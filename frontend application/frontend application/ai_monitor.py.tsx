#!/usr/bin/env python3
"""
AI Model Performance Monitor for SHIELD SOC
Real-time monitoring of LSTM model performance, drift detection, and alerting
"""

import numpy as np
import pandas as pd
import time
import json
import logging
import threading
from collections import deque, defaultdict
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from scipy import stats
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import tensorflow as tf
from tensorflow import keras
import psutil
import queue
import websocket
import sqlite3
import warnings
warnings.filterwarnings('ignore')

@dataclass
class ModelMetrics:
    """Data class for model performance metrics"""
    timestamp: str
    confidence_scores: List[float]
    prediction_latency: List[float]
    feature_drift_scores: Dict[str, float]
    performance_metrics: Dict[str, float]
    resource_usage: Dict[str, float]
    drift_detected: bool
    alert_level: str

@dataclass
class DriftAlert:
    """Data class for drift detection alerts"""
    timestamp: str
    alert_type: str
    severity: str
    message: str
    affected_features: List[str]
    drift_magnitude: float
    recommended_action: str

class PerformanceTracker:
    """Tracks model performance metrics in real-time"""
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        
        # Performance metrics storage
        self.predictions_history = deque(maxlen=window_size)
        self.ground_truth_history = deque(maxlen=window_size)
        self.confidence_history = deque(maxlen=window_size)
        self.latency_history = deque(maxlen=window_size)
        
        # Real-time metrics
        self.current_accuracy = 0.0
        self.current_precision = 0.0
        self.current_recall = 0.0
        self.current_f1 = 0.0
        
    def add_prediction(self, prediction: int, confidence: float, ground_truth: int, latency: float):
        """Add a new prediction result for tracking"""
        self.predictions_history.append(prediction)
        self.ground_truth_history.append(ground_truth)
        self.confidence_history.append(confidence)
        self.latency_history.append(latency)
        
        # Update metrics if we have enough data
        if len(self.predictions_history) >= 10:
            self._update_metrics()
    
    def _update_metrics(self):
        """Update current performance metrics"""
        recent_preds = list(self.predictions_history)[-100:]
        recent_truth = list(self.ground_truth_history)[-100:]
        
        if len(recent_preds) >= 10:
            self.current_accuracy = accuracy_score(recent_truth, recent_preds)
            self.current_precision = precision_score(recent_truth, recent_preds, average='weighted', zero_division=0)
            self.current_recall = recall_score(recent_truth, recent_preds, average='weighted', zero_division=0)
            self.current_f1 = f1_score(recent_truth, recent_preds, average='weighted', zero_division=0)
    
    def get_performance_summary(self) -> Dict[str, float]:
        """Get current performance summary"""
        return {
            'accuracy': self.current_accuracy,
            'precision': self.current_precision,
            'recall': self.current_recall,
            'f1_score': self.current_f1,
            'avg_confidence': np.mean(list(self.confidence_history)[-100:]) if self.confidence_history else 0.0,
            'avg_latency': np.mean(list(self.latency_history)[-100:]) if self.latency_history else 0.0,
            'predictions_count': len(self.predictions_history)
        }

class DriftDetector:
    """Detects various types of model drift"""
    
    def __init__(self, drift_threshold: float = 0.1, min_samples: int = 100):
        self.drift_threshold = drift_threshold
        self.min_samples = min_samples
        
        # Reference distributions
        self.reference_features = None
        self.reference_confidence = None
        self.reference_performance = None
        
        # Current data buffers
        self.current_features = deque(maxlen=1000)
        self.current_confidence = deque(maxlen=1000)
        
        # Drift detection state
        self.feature_drift_scores = {}
        self.confidence_drift_detected = False
        self.performance_drift_detected = False
        
    def set_reference_data(self, features: np.ndarray, confidence_scores: List[float], performance_metrics: Dict[str, float]):
        """Set reference data for drift detection"""
        self.reference_features = features
        self.reference_confidence = confidence_scores
        self.reference_performance = performance_metrics
        
        logging.info(f"Reference data set: {features.shape[0]} samples, {features.shape[1]} features")
    
    def update_current_data(self, features: np.ndarray, confidence: float):
        """Update current data for drift detection"""
        # Flatten features and add to buffer
        flat_features = features.flatten() if features.ndim > 1 else features
        self.current_features.append(flat_features)
        self.current_confidence.append(confidence)
        
        # Perform drift detection if we have enough data
        if len(self.current_features) >= self.min_samples:
            self._detect_feature_drift()
            self._detect_confidence_drift()
    
    def _detect_feature_drift(self):
        """Detect drift in feature distributions using statistical tests"""
        if self.reference_features is None or len(self.current_features) < self.min_samples:
            return
        
        # Convert current features to array
        current_features_array = np.array(list(self.current_features))
        
        # Check each feature for drift
        num_features = min(current_features_array.shape[1], self.reference_features.shape[1])
        
        for i in range(num_features):
            reference_feature = self.reference_features[:, i]
            current_feature = current_features_array[:, i]
            
            # Kolmogorov-Smirnov test for distribution drift
            try:
                statistic, p_value = stats.ks_2samp(reference_feature, current_feature)
                
                # Store drift score
                feature_name = f'feature_{i}'
                self.feature_drift_scores[feature_name] = {
                    'drift_score': statistic,
                    'p_value': p_value,
                    'drift_detected': statistic > self.drift_threshold and p_value < 0.05
                }
                
            except Exception as e:
                logging.warning(f"Error detecting drift for feature {i}: {e}")
    
    def _detect_confidence_drift(self):
        """Detect drift in confidence score distributions"""
        if self.reference_confidence is None or len(self.current_confidence) < self.min_samples:
            return
        
        current_conf_array = np.array(list(self.current_confidence))
        reference_conf_array = np.array(self.reference_confidence)
        
        try:
            statistic, p_value = stats.ks_2samp(reference_conf_array, current_conf_array)
            self.confidence_drift_detected = statistic > self.drift_threshold and p_value < 0.05
            
            if self.confidence_drift_detected:
                logging.warning(f"Confidence drift detected: statistic={statistic:.3f}, p_value={p_value:.3f}")
                
        except Exception as e:
            logging.warning(f"Error detecting confidence drift: {e}")
    
    def get_drift_summary(self) -> Dict[str, Any]:
        """Get summary of drift detection results"""
        drifted_features = [name for name, scores in self.feature_drift_scores.items() 
                           if scores.get('drift_detected', False)]
        
        return {
            'feature_drift_scores': self.feature_drift_scores,
            'confidence_drift_detected': self.confidence_drift_detected,
            'performance_drift_detected': self.performance_drift_detected,
            'drifted_features': drifted_features,
            'drift_severity': self._calculate_drift_severity()
        }
    
    def _calculate_drift_severity(self) -> str:
        """Calculate overall drift severity"""
        drifted_features = [name for name, scores in self.feature_drift_scores.items() 
                           if scores.get('drift_detected', False)]
        
        drift_ratio = len(drifted_features) / max(len(self.feature_drift_scores), 1)
        
        if drift_ratio > 0.5 or self.confidence_drift_detected:
            return 'high'
        elif drift_ratio > 0.2:
            return 'medium'
        elif drift_ratio > 0.05:
            return 'low'
        else:
            return 'none'

class ResourceMonitor:
    """Monitors system resources during model inference"""
    
    def __init__(self):
        self.cpu_history = deque(maxlen=100)
        self.memory_history = deque(maxlen=100)
        self.gpu_memory_history = deque(maxlen=100)
        
        # Start monitoring thread
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_resources, daemon=True)
        self.monitor_thread.start()
    
    def _monitor_resources(self):
        """Monitor system resources in background thread"""
        while self.monitoring:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                self.cpu_history.append(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.memory_history.append(memory.percent)
                
                # GPU memory (if available)
                try:
                    gpu_devices = tf.config.experimental.list_physical_devices('GPU')
                    if gpu_devices:
                        # This is a simplified GPU monitoring - actual implementation depends on your setup
                        self.gpu_memory_history.append(0.0)  # Placeholder
                except:
                    pass
                    
                time.sleep(1)
                
            except Exception as e:
                logging.warning(f"Error monitoring resources: {e}")
                time.sleep(5)
    
    def get_resource_summary(self) -> Dict[str, float]:
        """Get current resource usage summary"""
        return {
            'cpu_usage_avg': np.mean(list(self.cpu_history)) if self.cpu_history else 0.0,
            'cpu_usage_max': np.max(list(self.cpu_history)) if self.cpu_history else 0.0,
            'memory_usage_avg': np.mean(list(self.memory_history)) if self.memory_history else 0.0,
            'memory_usage_max': np.max(list(self.memory_history)) if self.memory_history else 0.0,
            'gpu_memory_usage': np.mean(list(self.gpu_memory_history)) if self.gpu_memory_history else 0.0
        }
    
    def stop_monitoring(self):
        """Stop resource monitoring"""
        self.monitoring = False

class AIModelMonitor:
    """Main AI Model Performance Monitor"""
    
    def __init__(self, 
                 model_path: Optional[str] = None,
                 db_path: str = './data/ai_monitoring.db',
                 websocket_url: str = 'ws://localhost:8080',
                 window_size: int = 1000):
        
        self.model_path = model_path
        self.db_path = db_path
        self.websocket_url = websocket_url
        self.window_size = window_size
        
        # Initialize components
        self.performance_tracker = PerformanceTracker(window_size)
        self.drift_detector = DriftDetector()
        self.resource_monitor = ResourceMonitor()
        
        # Monitoring state
        self.monitoring_active = False
        self.alerts_queue = queue.Queue()
        self.monitoring_thread = None
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('ai_monitor.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('AIModelMonitor')
        
        # Initialize database
        self._init_database()
        
        # WebSocket connection
        self.ws = None
        
    def _init_database(self):
        """Initialize SQLite database for storing monitoring data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create monitoring metrics table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS monitoring_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        accuracy REAL,
                        precision_score REAL,
                        recall_score REAL,
                        f1_score REAL,
                        avg_confidence REAL,
                        avg_latency REAL,
                        cpu_usage REAL,
                        memory_usage REAL,
                        drift_severity TEXT,
                        alert_level TEXT
                    )
                ''')
                
                # Create drift alerts table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS drift_alerts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        alert_type TEXT,
                        severity TEXT,
                        message TEXT,
                        affected_features TEXT,
                        drift_magnitude REAL,
                        recommended_action TEXT
                    )
                ''')
                
                conn.commit()
                self.logger.info("Database initialized successfully")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def start_monitoring(self):
        """Start monitoring process"""
        if self.monitoring_active:
            self.logger.warning("Monitoring already active")
            return
        
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        # Connect to WebSocket
        self._connect_websocket()
        
        self.logger.info("AI Model monitoring started")
    
    def stop_monitoring(self):
        """Stop monitoring process"""
        self.monitoring_active = False
        self.resource_monitor.stop_monitoring()
        
        if self.ws:
            self.ws.close()
        
        self.logger.info("AI Model monitoring stopped")
    
    def _connect_websocket(self):
        """Connect to WebSocket for real-time data"""
        try:
            import websocket as ws_client
            
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    self._process_realtime_data(data)
                except Exception as e:
                    self.logger.error(f"Error processing WebSocket message: {e}")
            
            def on_error(ws, error):
                self.logger.error(f"WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                self.logger.info("WebSocket connection closed")
            
            self.ws = ws_client.WebSocketApp(
                self.websocket_url,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Start WebSocket in separate thread
            ws_thread = threading.Thread(target=self.ws.run_forever, daemon=True)
            ws_thread.start()
            
        except Exception as e:
            self.logger.error(f"Error connecting to WebSocket: {e}")
    
    def _process_realtime_data(self, data: Dict[str, Any]):
        """Process real-time data from IDS system"""
        try:
            # Extract relevant fields
            features = np.array(data.get('features', []))
            anomaly_score = data.get('anomaly_score', 0.0)
            confidence = data.get('confidence', 0.0)
            is_attack = data.get('is_attack', False)
            
            # Simulate latency measurement (in real implementation, this would be measured)
            latency = np.random.normal(0.002, 0.0005)  # Simulated latency
            
            # Update performance tracker
            prediction = 1 if is_attack else 0
            ground_truth = prediction  # In real scenario, this would come from validation
            
            self.performance_tracker.add_prediction(prediction, confidence, ground_truth, latency)
            
            # Update drift detector
            if len(features) > 0:
                self.drift_detector.update_current_data(features, confidence)
            
            # Check for anomalies and generate alerts
            self._check_for_anomalies()
            
        except Exception as e:
            self.logger.error(f"Error processing real-time data: {e}")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                # Collect current metrics
                metrics = self._collect_metrics()
                
                # Store in database
                self._store_metrics(metrics)
                
                # Check for alerts
                alerts = self._generate_alerts(metrics)
                for alert in alerts:
                    self.alerts_queue.put(alert)
                    self._store_alert(alert)
                
                # Sleep before next iteration
                time.sleep(10)  # Monitor every 10 seconds
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)
    
    def _collect_metrics(self) -> ModelMetrics:
        """Collect current monitoring metrics"""
        performance = self.performance_tracker.get_performance_summary()
        drift_summary = self.drift_detector.get_drift_summary()
        resource_summary = self.resource_monitor.get_resource_summary()
        
        # Determine alert level
        alert_level = self._determine_alert_level(performance, drift_summary, resource_summary)
        
        return ModelMetrics(
            timestamp=datetime.now().isoformat(),
            confidence_scores=list(self.performance_tracker.confidence_history)[-100:],
            prediction_latency=list(self.performance_tracker.latency_history)[-100:],
            feature_drift_scores=drift_summary['feature_drift_scores'],
            performance_metrics=performance,
            resource_usage=resource_summary,
            drift_detected=len(drift_summary['drifted_features']) > 0,
            alert_level=alert_level
        )
    
    def _determine_alert_level(self, performance: Dict, drift_summary: Dict, resource_summary: Dict) -> str:
        """Determine overall alert level based on metrics"""
        # Critical conditions
        if (performance['accuracy'] < 0.7 or 
            drift_summary['drift_severity'] == 'high' or
            resource_summary['cpu_usage_avg'] > 90 or
            resource_summary['memory_usage_avg'] > 90):
            return 'critical'
        
        # High conditions
        if (performance['accuracy'] < 0.8 or 
            drift_summary['drift_severity'] == 'medium' or
            performance['avg_latency'] > 0.1):
            return 'high'
        
        # Medium conditions
        if (performance['accuracy'] < 0.9 or 
            drift_summary['drift_severity'] == 'low' or
            resource_summary['cpu_usage_avg'] > 70):
            return 'medium'
        
        return 'low'
    
    def _generate_alerts(self, metrics: ModelMetrics) -> List[DriftAlert]:
        """Generate alerts based on current metrics"""
        alerts = []
        
        # Performance degradation alert
        if metrics.performance_metrics['accuracy'] < 0.8:
            alerts.append(DriftAlert(
                timestamp=metrics.timestamp,
                alert_type='performance_degradation',
                severity='high',
                message=f"Model accuracy dropped to {metrics.performance_metrics['accuracy']:.3f}",
                affected_features=[],
                drift_magnitude=1.0 - metrics.performance_metrics['accuracy'],
                recommended_action='Consider model retraining or threshold adjustment'
            ))
        
        # Drift alert
        if metrics.drift_detected:
            drifted_features = [name for name, scores in metrics.feature_drift_scores.items() 
                               if scores.get('drift_detected', False)]
            
            alerts.append(DriftAlert(
                timestamp=metrics.timestamp,
                alert_type='feature_drift',
                severity='medium',
                message=f"Feature drift detected in {len(drifted_features)} features",
                affected_features=drifted_features,
                drift_magnitude=len(drifted_features) / len(metrics.feature_drift_scores),
                recommended_action='Update reference data or retrain model'
            ))
        
        # Latency alert
        if metrics.performance_metrics['avg_latency'] > 0.05:  # 50ms threshold
            alerts.append(DriftAlert(
                timestamp=metrics.timestamp,
                alert_type='high_latency',
                severity='medium',
                message=f"High prediction latency: {metrics.performance_metrics['avg_latency']:.3f}s",
                affected_features=[],
                drift_magnitude=metrics.performance_metrics['avg_latency'],
                recommended_action='Check system resources and model optimization'
            ))
        
        return alerts
    
    def _store_metrics(self, metrics: ModelMetrics):
        """Store metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO monitoring_metrics (
                        timestamp, accuracy, precision_score, recall_score, f1_score,
                        avg_confidence, avg_latency, cpu_usage, memory_usage,
                        drift_severity, alert_level
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.timestamp,
                    metrics.performance_metrics.get('accuracy', 0),
                    metrics.performance_metrics.get('precision', 0),
                    metrics.performance_metrics.get('recall', 0),
                    metrics.performance_metrics.get('f1_score', 0),
                    metrics.performance_metrics.get('avg_confidence', 0),
                    metrics.performance_metrics.get('avg_latency', 0),
                    metrics.resource_usage.get('cpu_usage_avg', 0),
                    metrics.resource_usage.get('memory_usage_avg', 0),
                    'low',  # Simplified
                    metrics.alert_level
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing metrics: {e}")
    
    def _store_alert(self, alert: DriftAlert):
        """Store alert in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO drift_alerts (
                        timestamp, alert_type, severity, message,
                        affected_features, drift_magnitude, recommended_action
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    alert.timestamp,
                    alert.alert_type,
                    alert.severity,
                    alert.message,
                    json.dumps(alert.affected_features),
                    alert.drift_magnitude,
                    alert.recommended_action
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing alert: {e}")
    
    def _check_for_anomalies(self):
        """Check for performance anomalies"""
        # Get recent performance
        performance = self.performance_tracker.get_performance_summary()
        
        # Check for sudden performance drops
        if performance['accuracy'] < 0.7:
            self.logger.warning(f"Performance anomaly detected: accuracy={performance['accuracy']:.3f}")
        
        # Check for confidence drops
        if performance['avg_confidence'] < 0.6:
            self.logger.warning(f"Confidence anomaly detected: avg_confidence={performance['avg_confidence']:.3f}")
    
    def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """Get data for monitoring dashboard"""
        try:
            # Get recent metrics from database
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get last 100 metrics
                cursor.execute('''
                    SELECT * FROM monitoring_metrics 
                    ORDER BY timestamp DESC 
                    LIMIT 100
                ''')
                
                metrics_data = cursor.fetchall()
                
                # Get recent alerts
                cursor.execute('''
                    SELECT * FROM drift_alerts 
                    ORDER BY timestamp DESC 
                    LIMIT 50
                ''')
                
                alerts_data = cursor.fetchall()
            
            # Current metrics
            current_metrics = self._collect_metrics()
            
            return {
                'current_metrics': asdict(current_metrics),
                'historical_metrics': metrics_data,
                'recent_alerts': alerts_data,
                'monitoring_status': 'active' if self.monitoring_active else 'inactive',
                'system_health': self._assess_system_health(current_metrics)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}
    
    def _assess_system_health(self, metrics: ModelMetrics) -> str:
        """Assess overall system health"""
        if metrics.alert_level == 'critical':
            return 'critical'
        elif metrics.alert_level in ['high', 'medium']:
            return 'warning'
        else:
            return 'healthy'
    
    def set_reference_baseline(self, features: np.ndarray, confidence_scores: List[float], performance_metrics: Dict[str, float]):
        """Set reference baseline for drift detection"""
        self.drift_detector.set_reference_data(features, confidence_scores, performance_metrics)
        self.logger.info("Reference baseline set for drift detection")

def main():
    """Main function for running the AI Model Monitor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Model Performance Monitor')
    parser.add_argument('--model-path', help='Path to the model file')
    parser.add_argument('--db-path', default='./data/ai_monitoring.db', help='Database path')
    parser.add_argument('--websocket-url', default='ws://localhost:8080', help='WebSocket URL')
    parser.add_argument('--duration', type=int, default=0, help='Monitoring duration in seconds (0 = infinite)')
    
    args = parser.parse_args()
    
    # Create monitor
    monitor = AIModelMonitor(
        model_path=args.model_path,
        db_path=args.db_path,
        websocket_url=args.websocket_url
    )
    
    try:
        # Start monitoring
        monitor.start_monitoring()
        
        if args.duration > 0:
            time.sleep(args.duration)
        else:
            # Run until interrupted
            while True:
                time.sleep(10)
                
                # Print status
                dashboard_data = monitor.get_monitoring_dashboard_data()
                current_metrics = dashboard_data.get('current_metrics', {})
                
                print(f"\n--- AI Model Monitor Status ---")
                print(f"System Health: {dashboard_data.get('system_health', 'unknown')}")
                print(f"Alert Level: {current_metrics.get('alert_level', 'unknown')}")
                print(f"Accuracy: {current_metrics.get('performance_metrics', {}).get('accuracy', 0):.3f}")
                print(f"Avg Latency: {current_metrics.get('performance_metrics', {}).get('avg_latency', 0):.3f}s")
                print(f"CPU Usage: {current_metrics.get('resource_usage', {}).get('cpu_usage_avg', 0):.1f}%")
                
    except KeyboardInterrupt:
        print("\nStopping AI Model Monitor...")
    finally:
        monitor.stop_monitoring()

if __name__ == "__main__":
    main()