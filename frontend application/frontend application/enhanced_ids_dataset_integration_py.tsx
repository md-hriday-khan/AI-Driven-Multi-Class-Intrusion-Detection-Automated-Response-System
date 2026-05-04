#!/usr/bin/env python3
"""
Enhanced CIC-IDS Dataset Integration System
Supports CIC-IDS2017, CIC-IDS2018, and other network IDS datasets
Provides real-time ingestion, processing, and analysis capabilities
Created by Md.Hriday Khan for CyberAuton SOC
"""

import pandas as pd
import numpy as np
import sqlite3
import json
import logging
import time
import threading
import queue
import random
import os
import pickle
import asyncio
import websockets
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import io
import zipfile
import requests
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ids_dataset_integration.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CICIDSDatasetManager:
    """
    Comprehensive manager for CIC-IDS datasets including CIC-IDS2017, CIC-IDS2018
    Provides dataset download, preprocessing, and real-time simulation capabilities
    """
    
    def __init__(self, data_dir: str = "./datasets"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Dataset configurations
        self.datasets = {
            'CIC-IDS2017': {
                'files': [
                    'Monday-WorkingHours.pcap_ISCX.csv',
                    'Tuesday-WorkingHours.pcap_ISCX.csv',
                    'Wednesday-workingHours.pcap_ISCX.csv',
                    'Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv',
                    'Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv',
                    'Friday-WorkingHours-Morning.pcap_ISCX.csv',
                    'Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv',
                    'Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv'
                ],
                'features': 78,  # Original CIC-IDS2017 has 78 features
                'label_column': 'Label',
                'attack_types': [
                    'BENIGN', 'Bot', 'DDoS', 'DoS GoldenEye', 'DoS Hulk', 'DoS Slowhttptest',
                    'DoS slowloris', 'FTP-Patator', 'Heartbleed', 'Infiltration',
                    'PortScan', 'SSH-Patator', 'Web Attack – Brute Force',
                    'Web Attack – Sql Injection', 'Web Attack – XSS'
                ]
            },
            'CIC-IDS2018': {
                'files': [
                    'Thuesday-20-02-2018_TrafficForML_CICFlowMeter.csv',
                    'Wednesday-21-02-2018_TrafficForML_CICFlowMeter.csv',
                    'Thursday-22-02-2018_TrafficForML_CICFlowMeter.csv',
                    'Friday-23-02-2018_TrafficForML_CICFlowMeter.csv'
                ],
                'features': 79,
                'label_column': 'Label',
                'attack_types': [
                    'Benign', 'Bot', 'Brute Force -Web', 'Brute Force -XSS',
                    'DDoS attacks-LOIC-HTTP', 'DDoS attacks-LOIC-UDP',
                    'DDOS attack-HOIC', 'DoS attacks-GoldenEye', 'DoS attacks-Hulk',
                    'DoS attacks-SlowHTTPTest', 'DoS attacks-Slowloris',
                    'FTP-BruteForce', 'Infilteration', 'SQL Injection'
                ]
            }
        }
        
        # Standard CIC-IDS features (common across versions)
        self.cic_features = [
            'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
            'Total Length of Fwd Packets', 'Total Length of Bwd Packets',
            'Fwd Packet Length Max', 'Fwd Packet Length Min', 'Fwd Packet Length Mean',
            'Fwd Packet Length Std', 'Bwd Packet Length Max', 'Bwd Packet Length Min',
            'Bwd Packet Length Mean', 'Bwd Packet Length Std', 'Flow Bytes/s',
            'Flow Packets/s', 'Flow IAT Mean', 'Flow IAT Std', 'Flow IAT Max',
            'Flow IAT Min', 'Fwd IAT Total', 'Fwd IAT Mean', 'Fwd IAT Std',
            'Fwd IAT Max', 'Fwd IAT Min', 'Bwd IAT Total', 'Bwd IAT Mean',
            'Bwd IAT Std', 'Bwd IAT Max', 'Bwd IAT Min', 'Fwd PSH Flags',
            'Bwd PSH Flags', 'Fwd URG Flags', 'Bwd URG Flags', 'Fwd Header Length',
            'Bwd Header Length', 'Fwd Packets/s', 'Bwd Packets/s', 'Min Packet Length',
            'Max Packet Length', 'Packet Length Mean', 'Packet Length Std',
            'Packet Length Variance', 'FIN Flag Count', 'SYN Flag Count',
            'RST Flag Count', 'PSH Flag Count', 'ACK Flag Count', 'URG Flag Count',
            'CWE Flag Count', 'ECE Flag Count', 'Down/Up Ratio', 'Average Packet Size',
            'Avg Fwd Segment Size', 'Avg Bwd Segment Size', 'Fwd Header Length.1',
            'Fwd Avg Bytes/Bulk', 'Fwd Avg Packets/Bulk', 'Fwd Avg Bulk Rate',
            'Bwd Avg Bytes/Bulk', 'Bwd Avg Packets/Bulk', 'Bwd Avg Bulk Rate',
            'Subflow Fwd Packets', 'Subflow Fwd Bytes', 'Subflow Bwd Packets',
            'Subflow Bwd Bytes', 'Init_Win_bytes_forward', 'Init_Win_bytes_backward',
            'act_data_pkt_fwd', 'min_seg_size_forward', 'Active Mean', 'Active Std',
            'Active Max', 'Active Min', 'Idle Mean', 'Idle Std', 'Idle Max', 'Idle Min'
        ]
        
        self.processed_data = None
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.init_database()
        
    def init_database(self):
        """Initialize database for dataset storage"""
        db_path = self.data_dir / "cic_ids_data.db"
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Create tables for different datasets
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cic_ids_flows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                dataset_source TEXT,
                flow_duration REAL,
                total_fwd_packets INTEGER,
                total_bwd_packets INTEGER,
                fwd_packet_length_mean REAL,
                bwd_packet_length_mean REAL,
                flow_bytes_s REAL,
                flow_packets_s REAL,
                flow_iat_mean REAL,
                protocol INTEGER,
                src_port INTEGER,
                dst_port INTEGER,
                label TEXT,
                attack_category TEXT,
                anomaly_score REAL,
                is_attack BOOLEAN,
                features_json TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dataset_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_name TEXT,
                file_name TEXT,
                rows_processed INTEGER,
                attack_count INTEGER,
                benign_count INTEGER,
                processing_time REAL,
                created_at REAL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                dataset_used TEXT,
                accuracy REAL,
                precision REAL,
                recall REAL,
                f1_score REAL,
                training_time REAL,
                created_at REAL
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info(f"Database initialized at {db_path}")
    
    def generate_sample_cic_data(self, num_samples: int = 10000) -> pd.DataFrame:
        """
        Generate realistic sample CIC-IDS data for demonstration
        This simulates real CIC-IDS2017/2018 dataset structure
        """
        logger.info(f"Generating {num_samples} sample CIC-IDS records...")
        
        data = []
        attack_types = ['BENIGN', 'Bot', 'DDoS', 'DoS GoldenEye', 'DoS Hulk', 
                       'PortScan', 'FTP-Patator', 'SSH-Patator', 'Web Attack']
        
        for i in range(num_samples):
            # Generate realistic network flow features
            is_attack = random.random() > 0.8  # 20% attack rate
            attack_type = random.choice(attack_types[1:]) if is_attack else 'BENIGN'
            
            # Base features with realistic ranges
            flow_duration = random.uniform(0.1, 300000) if not is_attack else random.uniform(1000, 600000)
            total_fwd_packets = random.randint(1, 100) if not is_attack else random.randint(50, 10000)
            total_bwd_packets = random.randint(1, 100) if not is_attack else random.randint(20, 5000)
            
            # Packet length features
            fwd_pkt_len_mean = random.uniform(40, 1500)
            bwd_pkt_len_mean = random.uniform(40, 1500)
            
            # Flow rate features
            flow_bytes_s = (total_fwd_packets * fwd_pkt_len_mean + total_bwd_packets * bwd_pkt_len_mean) / max(flow_duration / 1000000, 1)
            flow_packets_s = (total_fwd_packets + total_bwd_packets) / max(flow_duration / 1000000, 1)
            
            # IAT features
            flow_iat_mean = flow_duration / max(total_fwd_packets + total_bwd_packets - 1, 1)
            flow_iat_std = random.uniform(0, flow_iat_mean * 2)
            
            # Modify features based on attack type
            if attack_type == 'DDoS':
                total_fwd_packets *= random.randint(10, 100)
                flow_packets_s *= random.randint(5, 50)
                flow_bytes_s *= random.randint(5, 50)
            elif attack_type == 'Bot':
                flow_duration *= random.uniform(5, 20)
                flow_iat_mean *= random.uniform(0.1, 0.5)
            elif attack_type == 'PortScan':
                total_fwd_packets = random.randint(1, 10)
                total_bwd_packets = random.randint(0, 2)
                fwd_pkt_len_mean = random.uniform(40, 100)
            
            # Create feature vector
            features = {
                'Flow Duration': flow_duration,
                'Total Fwd Packets': total_fwd_packets,
                'Total Backward Packets': total_bwd_packets,
                'Total Length of Fwd Packets': total_fwd_packets * fwd_pkt_len_mean,
                'Total Length of Bwd Packets': total_bwd_packets * bwd_pkt_len_mean,
                'Fwd Packet Length Max': fwd_pkt_len_mean * random.uniform(1.2, 2.0),
                'Fwd Packet Length Min': fwd_pkt_len_mean * random.uniform(0.5, 0.8),
                'Fwd Packet Length Mean': fwd_pkt_len_mean,
                'Fwd Packet Length Std': fwd_pkt_len_mean * random.uniform(0.1, 0.5),
                'Bwd Packet Length Max': bwd_pkt_len_mean * random.uniform(1.2, 2.0),
                'Bwd Packet Length Min': bwd_pkt_len_mean * random.uniform(0.5, 0.8),
                'Bwd Packet Length Mean': bwd_pkt_len_mean,
                'Bwd Packet Length Std': bwd_pkt_len_mean * random.uniform(0.1, 0.5),
                'Flow Bytes/s': flow_bytes_s,
                'Flow Packets/s': flow_packets_s,
                'Flow IAT Mean': flow_iat_mean,
                'Flow IAT Std': flow_iat_std,
                'Flow IAT Max': flow_iat_mean * random.uniform(2, 5),
                'Flow IAT Min': flow_iat_mean * random.uniform(0.1, 0.5),
                'Fwd IAT Total': flow_duration * random.uniform(0.6, 0.9),
                'Fwd IAT Mean': flow_iat_mean * random.uniform(0.8, 1.2),
                'Fwd IAT Std': flow_iat_std * random.uniform(0.5, 1.5),
                'Fwd IAT Max': flow_iat_mean * random.uniform(3, 8),
                'Fwd IAT Min': flow_iat_mean * random.uniform(0.1, 0.3),
                'Bwd IAT Total': flow_duration * random.uniform(0.1, 0.4),
                'Bwd IAT Mean': flow_iat_mean * random.uniform(0.5, 1.5),
                'Bwd IAT Std': flow_iat_std * random.uniform(0.3, 1.2),
                'Bwd IAT Max': flow_iat_mean * random.uniform(2, 6),
                'Bwd IAT Min': flow_iat_mean * random.uniform(0.05, 0.25),
                'Fwd PSH Flags': random.randint(0, 5) if attack_type in ['Web Attack'] else random.randint(0, 1),
                'Bwd PSH Flags': random.randint(0, 3),
                'Fwd URG Flags': random.randint(0, 1),
                'Bwd URG Flags': random.randint(0, 1),
                'Fwd Header Length': total_fwd_packets * random.randint(20, 60),
                'Bwd Header Length': total_bwd_packets * random.randint(20, 60),
                'Fwd Packets/s': total_fwd_packets / max(flow_duration / 1000000, 1),
                'Bwd Packets/s': total_bwd_packets / max(flow_duration / 1000000, 1),
                'Label': attack_type
            }
            
            # Add remaining features with realistic values
            for feature in self.cic_features[38:]:  # Remaining features
                if feature not in features:
                    features[feature] = random.uniform(0, 100)
            
            data.append(features)
        
        df = pd.DataFrame(data)
        logger.info(f"Generated dataset with {len(df)} samples")
        logger.info(f"Attack distribution: {df['Label'].value_counts().to_dict()}")
        
        return df
    
    def load_real_dataset(self, dataset_name: str = 'CIC-IDS2017') -> Optional[pd.DataFrame]:
        """
        Load real CIC-IDS dataset if available
        Falls back to generated sample data if not found
        """
        dataset_config = self.datasets.get(dataset_name)
        if not dataset_config:
            logger.error(f"Unknown dataset: {dataset_name}")
            return None
        
        dataset_dir = self.data_dir / dataset_name
        if not dataset_dir.exists():
            logger.warning(f"Dataset directory not found: {dataset_dir}")
            logger.info("Generating sample data instead...")
            return self.generate_sample_cic_data()
        
        all_data = []
        for file_name in dataset_config['files']:
            file_path = dataset_dir / file_name
            if file_path.exists():
                try:
                    logger.info(f"Loading {file_name}...")
                    chunk_data = pd.read_csv(file_path, low_memory=False)
                    chunk_data['source_file'] = file_name
                    all_data.append(chunk_data)
                    logger.info(f"Loaded {len(chunk_data)} records from {file_name}")
                except Exception as e:
                    logger.error(f"Error loading {file_name}: {e}")
            else:
                logger.warning(f"File not found: {file_path}")
        
        if all_data:
            combined_data = pd.concat(all_data, ignore_index=True)
            logger.info(f"Combined dataset: {len(combined_data)} total records")
            return combined_data
        else:
            logger.warning("No real data files found, generating sample data...")
            return self.generate_sample_cic_data()
    
    def preprocess_dataset(self, df: pd.DataFrame, dataset_name: str = 'CIC-IDS2017') -> pd.DataFrame:
        """
        Preprocess CIC-IDS dataset for training and analysis
        """
        logger.info(f"Preprocessing {dataset_name} dataset...")
        
        # Handle missing values
        df = df.dropna()
        
        # Clean infinite values
        df = df.replace([np.inf, -np.inf], np.nan).dropna()
        
        # Standardize label column
        label_col = self.datasets[dataset_name]['label_column']
        if label_col not in df.columns:
            label_col = 'Label'  # Fallback
        
        # Clean and categorize labels
        df[label_col] = df[label_col].astype(str).str.strip()
        df['is_attack'] = ~df[label_col].str.contains('BENIGN|Benign', case=False, na=False)
        
        # Create attack categories
        def categorize_attack(label):
            label = label.upper()
            if 'BENIGN' in label:
                return 'BENIGN'
            elif any(ddos in label for ddos in ['DDOS', 'DOS']):
                return 'DoS/DDoS'
            elif 'BOT' in label:
                return 'Botnet'
            elif any(web in label for web in ['WEB', 'SQL', 'XSS']):
                return 'Web Attack'
            elif any(brute in label for brute in ['BRUTE', 'PATATOR']):
                return 'Brute Force'
            elif 'SCAN' in label:
                return 'Reconnaissance'
            else:
                return 'Other'
        
        df['attack_category'] = df[label_col].apply(categorize_attack)
        
        # Select numerical features for modeling
        numerical_features = []
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64'] and col not in [label_col, 'is_attack']:
                numerical_features.append(col)
        
        # Remove features with zero variance
        feature_data = df[numerical_features]
        zero_var_features = feature_data.columns[feature_data.var() == 0].tolist()
        if zero_var_features:
            logger.info(f"Removing zero variance features: {zero_var_features}")
            numerical_features = [f for f in numerical_features if f not in zero_var_features]
        
        # Scale features
        scaler = StandardScaler()
        feature_data = df[numerical_features]
        scaled_features = scaler.fit_transform(feature_data)
        
        # Store scaler
        self.scalers[dataset_name] = scaler
        
        # Create final dataset
        processed_df = pd.DataFrame(scaled_features, columns=numerical_features)
        processed_df[label_col] = df[label_col].values
        processed_df['is_attack'] = df['is_attack'].values
        processed_df['attack_category'] = df['attack_category'].values
        processed_df['timestamp'] = time.time()
        
        logger.info(f"Preprocessing complete. Features: {len(numerical_features)}")
        logger.info(f"Attack distribution: {processed_df['attack_category'].value_counts().to_dict()}")
        
        self.processed_data = processed_df
        return processed_df
    
    def train_models(self, df: pd.DataFrame, dataset_name: str = 'CIC-IDS2017'):
        """
        Train machine learning models on the processed dataset
        """
        logger.info(f"Training models on {dataset_name} dataset...")
        
        # Prepare features and labels
        feature_columns = [col for col in df.columns if col not in ['Label', 'is_attack', 'attack_category', 'timestamp']]
        X = df[feature_columns]
        y_binary = df['is_attack']
        y_multi = df['attack_category']
        
        # Split data
        X_train, X_test, y_bin_train, y_bin_test, y_multi_train, y_multi_test = train_test_split(
            X, y_binary, y_multi, test_size=0.2, random_state=42, stratify=y_binary
        )
        
        models = {}
        
        # 1. Binary classification (Attack vs Benign)
        logger.info("Training binary classifier...")
        rf_binary = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        rf_binary.fit(X_train, y_bin_train)
        
        binary_pred = rf_binary.predict(X_test)
        binary_accuracy = (binary_pred == y_bin_test).mean()
        logger.info(f"Binary classifier accuracy: {binary_accuracy:.4f}")
        
        models['binary_classifier'] = rf_binary
        
        # 2. Anomaly detection
        logger.info("Training anomaly detector...")
        iso_forest = IsolationForest(contamination=0.1, random_state=42, n_jobs=-1)
        iso_forest.fit(X_train[y_bin_train == False])  # Train on benign data only
        
        anomaly_pred = iso_forest.predict(X_test)
        anomaly_pred_binary = (anomaly_pred == -1)  # -1 is anomaly in IsolationForest
        anomaly_accuracy = (anomaly_pred_binary == y_bin_test).mean()
        logger.info(f"Anomaly detector accuracy: {anomaly_accuracy:.4f}")
        
        models['anomaly_detector'] = iso_forest
        
        # 3. Multi-class attack classifier
        logger.info("Training multi-class classifier...")
        rf_multi = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        rf_multi.fit(X_train, y_multi_train)
        
        multi_pred = rf_multi.predict(X_test)
        multi_accuracy = (multi_pred == y_multi_test).mean()
        logger.info(f"Multi-class classifier accuracy: {multi_accuracy:.4f}")
        
        models['multiclass_classifier'] = rf_multi
        
        # Store models
        self.models[dataset_name] = models
        
        # Save models to disk
        model_dir = self.data_dir / "models"
        model_dir.mkdir(exist_ok=True)
        
        for model_name, model in models.items():
            model_path = model_dir / f"{dataset_name}_{model_name}.joblib"
            joblib.dump(model, model_path)
            logger.info(f"Saved {model_name} to {model_path}")
        
        # Save scaler
        scaler_path = model_dir / f"{dataset_name}_scaler.joblib"
        joblib.dump(self.scalers[dataset_name], scaler_path)
        
        return models
    
    def predict_flow(self, flow_features: Dict) -> Dict:
        """
        Predict if a network flow is malicious using trained models
        """
        if not self.models or not self.scalers:
            logger.warning("No models trained yet")
            return {
                'is_attack': False,
                'attack_category': 'BENIGN',
                'confidence': 0.5,
                'anomaly_score': 0.0,
                'model_used': 'none'
            }
        
        # Use the first available dataset models
        dataset_name = list(self.models.keys())[0]
        models = self.models[dataset_name]
        scaler = self.scalers[dataset_name]
        
        try:
            # Prepare features
            feature_vector = []
            for feature in self.cic_features[:len(flow_features)]:
                feature_vector.append(flow_features.get(feature, 0.0))
            
            # Scale features
            scaled_features = scaler.transform([feature_vector])
            
            # Make predictions
            binary_pred = models['binary_classifier'].predict(scaled_features)[0]
            binary_proba = models['binary_classifier'].predict_proba(scaled_features)[0]
            
            anomaly_score = models['anomaly_detector'].decision_function(scaled_features)[0]
            anomaly_pred = models['anomaly_detector'].predict(scaled_features)[0] == -1
            
            multi_pred = models['multiclass_classifier'].predict(scaled_features)[0]
            multi_proba = models['multiclass_classifier'].predict_proba(scaled_features)[0]
            
            return {
                'is_attack': bool(binary_pred) or anomaly_pred,
                'attack_category': multi_pred if binary_pred else 'BENIGN',
                'confidence': max(binary_proba),
                'anomaly_score': abs(anomaly_score),
                'binary_prediction': bool(binary_pred),
                'anomaly_prediction': anomaly_pred,
                'multiclass_confidence': max(multi_proba),
                'model_used': dataset_name
            }
            
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            return {
                'is_attack': False,
                'attack_category': 'BENIGN',
                'confidence': 0.0,
                'anomaly_score': 0.0,
                'error': str(e)
            }
    
    def get_dataset_stats(self) -> Dict:
        """Get comprehensive dataset statistics"""
        if self.processed_data is None:
            return {'error': 'No dataset loaded'}
        
        df = self.processed_data
        stats = {
            'total_samples': len(df),
            'attack_samples': len(df[df['is_attack'] == True]),
            'benign_samples': len(df[df['is_attack'] == False]),
            'attack_rate': len(df[df['is_attack'] == True]) / len(df),
            'attack_categories': df['attack_category'].value_counts().to_dict(),
            'feature_count': len([col for col in df.columns if col not in ['Label', 'is_attack', 'attack_category', 'timestamp']]),
            'models_trained': list(self.models.keys()) if self.models else [],
            'processing_timestamp': df['timestamp'].iloc[0] if len(df) > 0 else None
        }
        
        return stats

class RealTimeDataSimulator:
    """
    Simulates real-time network traffic using CIC-IDS dataset patterns
    """
    
    def __init__(self, dataset_manager: CICIDSDatasetManager):
        self.dataset_manager = dataset_manager
        self.running = False
        self.data_queue = queue.Queue(maxsize=1000)
        self.websocket_clients = set()
        
    def start_simulation(self):
        """Start real-time data simulation"""
        self.running = True
        threading.Thread(target=self._simulation_loop, daemon=True).start()
        threading.Thread(target=self._websocket_server, daemon=True).start()
        logger.info("Real-time simulation started")
    
    def stop_simulation(self):
        """Stop real-time data simulation"""
        self.running = False
        logger.info("Real-time simulation stopped")
    
    def _simulation_loop(self):
        """Main simulation loop"""
        while self.running:
            try:
                # Generate realistic flow data
                flow_data = self._generate_realistic_flow()
                
                # Get prediction
                prediction = self.dataset_manager.predict_flow(flow_data)
                
                # Create complete data packet
                data_packet = {
                    'timestamp': time.time(),
                    'flow_features': flow_data,
                    'prediction': prediction,
                    'metadata': {
                        'simulation': True,
                        'source': 'CIC-IDS-Simulator'
                    }
                }
                
                # Add to queue
                if not self.data_queue.full():
                    self.data_queue.put(data_packet)
                
                # Broadcast to WebSocket clients
                self._broadcast_to_websockets(data_packet)
                
                # Variable delay
                time.sleep(random.uniform(0.5, 2.0))
                
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                time.sleep(1)
    
    def _generate_realistic_flow(self) -> Dict:
        """Generate realistic network flow features"""
        # Base on CIC-IDS patterns
        is_attack = random.random() > 0.85  # 15% attack rate
        
        if is_attack:
            attack_type = random.choice(['DDoS', 'Bot', 'PortScan', 'Web Attack', 'Brute Force'])
            
            if attack_type == 'DDoS':
                flow_features = {
                    'Flow Duration': random.uniform(1000, 60000),
                    'Total Fwd Packets': random.randint(100, 10000),
                    'Total Backward Packets': random.randint(50, 5000),
                    'Flow Bytes/s': random.uniform(100000, 1000000),
                    'Flow Packets/s': random.uniform(100, 1000),
                    'Flow IAT Mean': random.uniform(1, 100),
                    'Fwd Packet Length Mean': random.uniform(800, 1500),
                    'Bwd Packet Length Mean': random.uniform(40, 200)
                }
            elif attack_type == 'PortScan':
                flow_features = {
                    'Flow Duration': random.uniform(100, 5000),
                    'Total Fwd Packets': random.randint(1, 10),
                    'Total Backward Packets': random.randint(0, 3),
                    'Flow Bytes/s': random.uniform(100, 10000),
                    'Flow Packets/s': random.uniform(1, 50),
                    'Flow IAT Mean': random.uniform(10, 1000),
                    'Fwd Packet Length Mean': random.uniform(40, 100),
                    'Bwd Packet Length Mean': random.uniform(40, 100)
                }
            else:  # Other attacks
                flow_features = {
                    'Flow Duration': random.uniform(5000, 300000),
                    'Total Fwd Packets': random.randint(20, 1000),
                    'Total Backward Packets': random.randint(10, 500),
                    'Flow Bytes/s': random.uniform(1000, 100000),
                    'Flow Packets/s': random.uniform(10, 100),
                    'Flow IAT Mean': random.uniform(100, 5000),
                    'Fwd Packet Length Mean': random.uniform(200, 1000),
                    'Bwd Packet Length Mean': random.uniform(100, 800)
                }
        else:
            # Benign traffic
            flow_features = {
                'Flow Duration': random.uniform(1000, 120000),
                'Total Fwd Packets': random.randint(5, 100),
                'Total Backward Packets': random.randint(3, 80),
                'Flow Bytes/s': random.uniform(1000, 50000),
                'Flow Packets/s': random.uniform(1, 20),
                'Flow IAT Mean': random.uniform(500, 10000),
                'Fwd Packet Length Mean': random.uniform(200, 800),
                'Bwd Packet Length Mean': random.uniform(200, 600)
            }
        
        # Add additional features
        for i, feature in enumerate(self.dataset_manager.cic_features[8:20]):
            flow_features[feature] = random.uniform(0, 1000)
        
        return flow_features
    
    async def _websocket_handler(self, websocket, path):
        """Handle WebSocket connections"""
        self.websocket_clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.websocket_clients.discard(websocket)
    
    def _websocket_server(self):
        """Start WebSocket server for real-time data"""
        try:
            start_server = websockets.serve(self._websocket_handler, "localhost", 8081)
            asyncio.new_event_loop().run_until_complete(start_server)
            logger.info("WebSocket server started on port 8081")
        except Exception as e:
            logger.error(f"WebSocket server error: {e}")
    
    def _broadcast_to_websockets(self, data):
        """Broadcast data to all WebSocket clients"""
        if self.websocket_clients:
            message = json.dumps(data, default=str)
            for client in self.websocket_clients.copy():
                try:
                    asyncio.run(client.send(message))
                except:
                    self.websocket_clients.discard(client)

def main():
    """Main function to initialize and run the enhanced IDS dataset integration"""
    logger.info("Starting Enhanced CIC-IDS Dataset Integration System...")
    
    # Initialize dataset manager
    dataset_manager = CICIDSDatasetManager()
    
    # Load and preprocess dataset
    logger.info("Loading CIC-IDS2017 dataset...")
    df = dataset_manager.load_real_dataset('CIC-IDS2017')
    
    if df is not None:
        processed_df = dataset_manager.preprocess_dataset(df, 'CIC-IDS2017')
        
        # Train models
        logger.info("Training machine learning models...")
        models = dataset_manager.train_models(processed_df, 'CIC-IDS2017')
        
        # Get statistics
        stats = dataset_manager.get_dataset_stats()
        logger.info(f"Dataset statistics: {stats}")
        
        # Start real-time simulation
        simulator = RealTimeDataSimulator(dataset_manager)
        simulator.start_simulation()
        
        logger.info("System ready! Real-time simulation is running...")
        logger.info("Press Ctrl+C to stop")
        
        try:
            while True:
                time.sleep(10)
                logger.info("System running... (use Ctrl+C to stop)")
        except KeyboardInterrupt:
            logger.info("Stopping system...")
            simulator.stop_simulation()
    
    else:
        logger.error("Failed to load dataset")

if __name__ == "__main__":
    main()