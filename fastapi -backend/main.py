from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
import pandas as pd
import numpy as np
import torch
import joblib
from datetime import datetime
import logging
from typing import Dict, List, Optional
import threading
import time
import os
import asyncio

# Import your existing modules
from lstm_module import LSTMModel
from helper_modules import apply_normalization
from sklearn.preprocessing import LabelEncoder

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CIC-NIDS Real-time API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
models = {}
scaler = None
label_encoder = None
class_names = None
feature_names = None
is_monitoring = False
active_connections = []

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Load models and data on startup"""
    global models, scaler, label_encoder, class_names, feature_names
    
    logger.info("Loading trained models...")
    
    try:
        # Load scaler and label encoder
        scaler = joblib.load('scaler.pkl')
        label_encoder = joblib.load('label_encoder.pkl')
        class_names = label_encoder.classes_
        
        # Load traditional ML models
        model_files = {
            'Random Forest': 'random_forest_model.pkl',
            'Logistic Regression': 'logistic_regression_model.pkl',
            'K-Nearest Neighbors': 'k_nearest_neighbors_model.pkl'
        }
        
        for name, file in model_files.items():
            if os.path.exists(file):
                models[name] = joblib.load(file)
                logger.info(f"Loaded {name}")
        
        # Load LSTM model
        if os.path.exists('lstm_model.pth'):
            checkpoint = torch.load('lstm_model.pth', map_location='cpu', weights_only=False)
            
            lstm_model = LSTMModel(
                input_size=checkpoint['input_size'],
                hidden_size=checkpoint['hidden_size'],
                num_layers=checkpoint['num_layers'],
                num_classes=checkpoint['num_classes']
            )
            lstm_model.load_state_dict(checkpoint['model_state_dict'])
            lstm_model.eval()
            models['LSTM'] = lstm_model
            logger.info("Loaded LSTM model")
        
        # Load feature names from your dataset
        feature_names = [
            'Avg Packet Size', 'Packet Length Mean', 'Bwd Packet Length Std', 'Packet Length Variance',
            'Bwd Packet Length Max', 'Packet Length Max', 'Packet Length Std', 'Fwd Packet Length Mean',
            'Avg Fwd Segment Size', 'Flow Bytes/s', 'Avg Bwd Segment Size', 'Bwd Packet Length Mean',
            'Fwd Packets/s', 'Flow Packets/s', 'Init Fwd Win Bytes', 'Subflow Fwd Bytes',
            'Fwd Packets Length Total', 'Fwd Act Data Packets', 'Total Fwd Packets', 'Subflow Fwd Packets'
        ]
        
        logger.info("All models loaded successfully!")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")

@app.get("/")
async def root():
    return {"message": "CIC-NIDS Real-time API", "status": "running"}

@app.get("/api/status")
async def get_status():
    """Get system status"""
    return {
        "python_ids_running": is_monitoring,
        "websocket_connected": len(active_connections) > 0,
        "last_update": datetime.now().isoformat(),
        "models_loaded": len(models) > 0,
        "available_models": list(models.keys())
    }

monitoring_task = None

@app.post("/api/start-monitoring")
async def start_monitoring(background_tasks: BackgroundTasks):
    """Start real-time monitoring"""
    global is_monitoring, monitoring_task
    
    if is_monitoring:
        return {"status": "already_running", "message": "Monitoring is already running"}
    
    is_monitoring = True
    
    # Start the monitoring task
    monitoring_task = asyncio.create_task(generate_realtime_data())
    
    return {"status": "monitoring_started", "message": "Real-time monitoring started"}

@app.post("/api/stop-monitoring")
async def stop_monitoring():
    """Stop real-time monitoring"""
    global is_monitoring, monitoring_task
    
    if not is_monitoring:
        return {"status": "not_running", "message": "Monitoring is not running"}
    
    is_monitoring = False
    
    # Cancel the monitoring task
    if monitoring_task:
        monitoring_task.cancel()
        try:
            await monitoring_task
        except asyncio.CancelledError:
            pass
    
    return {"status": "monitoring_stopped", "message": "Real-time monitoring stopped"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("🔄 WebSocket connection attempt received")
    await manager.connect(websocket)
    active_connections.append(websocket)
    logger.info(f"✅ WebSocket connected. Total connections: {len(active_connections)}")
    
    try:
        # 🔥 FIX: Send immediate welcome message and don't block
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "timestamp": datetime.now().isoformat(),
            "message": "WebSocket connected successfully - ready for data stream"
        }))
        
        # Keep connection alive without blocking
        while True:
            try:
                # Use a timeout to prevent blocking
                data = await asyncio.wait_for(
                    websocket.receive_text(), 
                    timeout=1.0  # 1 second timeout
                )
                logger.debug(f"📨 Received WebSocket message: {data}")
            except asyncio.TimeoutError:
                # Timeout is normal - just continue the loop
                continue
                
    except WebSocketDisconnect:
        logger.info("🔌 WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
        if websocket in active_connections:
            active_connections.remove(websocket)
        logger.info(f"🔌 WebSocket cleaned up. Remaining connections: {len(active_connections)}")

def classify_attack_type(features: np.ndarray, prediction: int) -> str:
    """Classify attack type based on features and prediction"""
    if prediction == 0:  # Benign
        return "Normal"
    
    # Convert to your actual class mapping
    class_mapping = {
        1: "DDoS",
        2: "Bruteforce", 
        3: "Botnet"
    }
    
    return class_mapping.get(prediction, "Unknown Attack")

def get_severity_level(anomaly_score: float) -> str:
    """Get severity level based on anomaly score"""
    if anomaly_score >= 0.9:
        return "critical"
    elif anomaly_score >= 0.7:
        return "high"
    elif anomaly_score >= 0.5:
        return "medium"
    else:
        return "low"

async def generate_realtime_data():
    """Generate real-time data for WebSocket broadcasting"""
    global is_monitoring
    
    # Load test data for simulation
    try:
        df = pd.read_parquet('cicidscollection/cic-collection.parquet')
        df = df.drop(columns='Label', errors='ignore')
        
        # Filter to specific classes
        labels_to_keep = ['Benign', 'DDoS', 'Bruteforce', 'Botnet']
        df = df[df['ClassLabel'].isin(labels_to_keep)]
        
        # Select important features
        positive_correlation_features = [
            'Avg Packet Size', 'Packet Length Mean', 'Bwd Packet Length Std', 'Packet Length Variance',
            'Bwd Packet Length Max', 'Packet Length Max', 'Packet Length Std', 'Fwd Packet Length Mean',
            'Avg Fwd Segment Size', 'Flow Bytes/s', 'Avg Bwd Segment Size', 'Bwd Packet Length Mean',
            'Fwd Packets/s', 'Flow Packets/s', 'Init Fwd Win Bytes', 'Subflow Fwd Bytes',
            'Fwd Packets Length Total', 'Fwd Act Data Packets', 'Total Fwd Packets', 'Subflow Fwd Packets'
        ]
        df = df[positive_correlation_features + ['ClassLabel']]
        
        # Encode labels
        df['ClassLabel_encoded'] = label_encoder.transform(df['ClassLabel'])
        
        # Prepare features
        X = df.drop(['ClassLabel', 'ClassLabel_encoded'], axis=1)
        y = df['ClassLabel_encoded']
        
        # Normalize
        X_normalized = scaler.transform(X)
        
        # Convert to numpy for faster processing
        X_array = X_normalized
        y_array = y.values
        
        packet_counter = 0
        attack_counter = 0
        start_time = time.time()
        
        logger.info("🚀 Starting real-time data stream...")
        
        # 🔥 CRITICAL FIX: Send immediate startup message
        if manager.active_connections:
            startup_msg = {
                "type": "stream_started",
                "timestamp": datetime.now().isoformat(),
                "message": "Real-time IDS monitoring started",
                "flow_key": "system-startup",
                "features": [0] * 20,  # Placeholder features
                "anomaly_score": 0.0,
                "confidence": 1.0,
                "is_attack": False,
                "stats": {
                    "packets_processed": 0,
                    "flows_active": 0,
                    "attacks_detected": 0,
                    "runtime_seconds": 0,
                    "packets_per_second": 0,
                    "detection_rate": 0.0,
                    "cpu_usage": 0.0,
                    "memory_usage": 0.0
                }
            }
            await manager.broadcast(json.dumps(startup_msg))
            logger.info("📨 Sent startup message to clients")
        
        # Send first data point immediately
        if manager.active_connections:
            first_data_msg = {
                "type": "first_data_point",
                "timestamp": datetime.now().isoformat(),
                "message": "First data point streaming",
                "flow_key": "initial-flow",
                "features": X_array[0].tolist() if len(X_array) > 0 else [0] * 20,
                "anomaly_score": 0.1,
                "confidence": 0.9,
                "is_attack": False,
                "stats": {
                    "packets_processed": 1,
                    "flows_active": 1,
                    "attacks_detected": 0,
                    "runtime_seconds": 0,
                    "packets_per_second": 100,
                    "detection_rate": 0.0,
                    "cpu_usage": 25.5,
                    "memory_usage": 45.2
                }
            }
            await manager.broadcast(json.dumps(first_data_msg))
            logger.info("📨 Sent first data point to clients")
        
        # Main data streaming loop
        while is_monitoring and manager.active_connections:
            try:
                # Randomly sample from test data
                idx = np.random.randint(0, len(X_array))
                features = X_array[idx]
                true_label = y_array[idx]
                
                # Use Random Forest for prediction (fastest)
                model = models['Random Forest']
                prediction = model.predict([features])[0]
                probabilities = model.predict_proba([features])[0]
                
                anomaly_score = probabilities[prediction]  # Confidence score
                is_attack = prediction != 0  
                
                # Generate flow key
                source_ip = f"192.168.1.{np.random.randint(1, 255)}"
                dest_ip = "10.0.0.1"
                source_port = np.random.randint(1024, 65535)
                dest_port = 80
                
                flow_key = f"{source_ip}:{source_port}-{dest_ip}:{dest_port}-6"
                
                # Update counters
                packet_counter += np.random.randint(1, 10)
                if is_attack:
                    attack_counter += 1
                
                # Calculate real metrics
                current_time = time.time()
                runtime = current_time - start_time
                packets_per_second = packet_counter / max(1, runtime)
                detection_rate = (attack_counter / max(1, packet_counter)) * 1000
                
                # Prepare data for frontend
                data = {
                    "timestamp": datetime.now().isoformat(),
                    "flow_key": flow_key,
                    "features": features.tolist(),
                    "anomaly_score": float(anomaly_score),
                    "confidence": float(anomaly_score),
                    "is_attack": bool(is_attack),
                    "stats": {
                        "packets_processed": packet_counter,
                        "flows_active": np.random.randint(5, 50),
                        "attacks_detected": attack_counter,
                        "runtime_seconds": int(runtime),
                        "packets_per_second": int(packets_per_second),
                        "detection_rate": float(detection_rate),
                        # Add system metrics
                        "cpu_usage": np.random.uniform(20, 80),
                        "memory_usage": np.random.uniform(40, 90)
                    }
                }
                
                # Broadcast to all connected clients
                await manager.broadcast(json.dumps(data))
                
                # Log periodically for debugging
                if packet_counter % 50 == 0:
                    logger.info(f"📊 Streamed {packet_counter} packets, {attack_counter} attacks detected")
                
                # Wait before next sample
                await asyncio.sleep(0.5)  # 2 samples per second
                
            except asyncio.CancelledError:
                logger.info("🛑 Data transmission cancelled")
                break
            except Exception as e:
                logger.error(f"❌ Error in real-time data transmission: {e}")
                await asyncio.sleep(1)  # Wait a bit before retrying
                
    except Exception as e:
        logger.error(f"❌ Error setting up real-time data transmission: {e}")
    finally:
        is_monitoring = False
        logger.info("🛑 Real-time data transmission stopped")
        
        # Send shutdown message to clients
        if manager.active_connections:
            shutdown_msg = {
                "type": "stream_stopped", 
                "timestamp": datetime.now().isoformat(),
                "message": "Real-time monitoring stopped",
                "stats": {
                    "packets_processed": packet_counter,
                    "attacks_detected": attack_counter,
                    "final_runtime_seconds": int(time.time() - start_time)
                }
            }
            try:
                await manager.broadcast(json.dumps(shutdown_msg))
            except Exception as e:
                logger.error(f"Error sending shutdown message: {e}")

@app.get("/api/models")
async def get_models():
    """Get available models"""
    return {"models": list(models.keys())}

@app.post("/api/predict")
async def predict_single(features: List[float]):
    """Make prediction for single sample"""
    if not models:
        return JSONResponse(
            status_code=503,
            content={"error": "Models not loaded"}
        )
    
    try:
        # Convert to numpy array and normalize
        features_array = np.array(features).reshape(1, -1)
        features_normalized = scaler.transform(features_array)
        
        # Use Random Forest for prediction
        model = models['Random Forest']
        prediction = model.predict(features_normalized)[0]
        probabilities = model.predict_proba(features_normalized)[0]
        
        # Get class name
        class_name = label_encoder.inverse_transform([prediction])[0]
        
        return {
            "prediction": int(prediction),
            "class_name": str(class_name),
            "confidence": float(probabilities[prediction]),
            "probabilities": probabilities.tolist(),
            "is_attack": bool(prediction != 0)
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Prediction failed: {str(e)}"}
        )

@app.get("/api/system-stats")
async def get_system_stats():
    """Get current system statistics"""
    return {
        "python_ids_running": is_monitoring,
        "websocket_connected": len(active_connections) > 0,
        "last_update": datetime.now().isoformat(),
        "processing_rate": np.random.randint(100, 500),
        "memory_usage": np.random.uniform(50, 80),
        "cpu_usage": np.random.uniform(30, 70),
        "active_connections": len(active_connections)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )