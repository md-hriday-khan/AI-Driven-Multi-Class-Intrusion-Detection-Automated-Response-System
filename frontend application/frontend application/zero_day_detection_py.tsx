#!/usr/bin/env python3
"""
Zero-Day Attack Detection System for SHIELD SOC
Advanced ML techniques to detect previously unknown attack patterns
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import sqlite3
import json
import logging
import threading
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import asyncio
import websockets
from scipy import stats
from scipy.spatial.distance import euclidean
import pickle
import os

@dataclass
class ZeroDayAlert:
    """Zero-day attack alert"""
    alert_id: str
    timestamp: str
    attack_signature: str
    confidence_score: float
    anomaly_score: float
    behavioral_deviation: float
    affected_systems: List[str]
    attack_vector: str
    payload_hash: str
    network_indicators: Dict[str, Any]
    system_indicators: Dict[str, Any]
    ml_model_predictions: Dict[str, float]
    severity: str
    recommended_actions: List[str]
    false_positive_probability: float

@dataclass
class BehavioralPattern:
    """Behavioral pattern for zero-day detection"""
    pattern_id: str
    pattern_type: str  # network, system, user, application
    feature_vector: List[float]
    frequency: int
    first_seen: str
    last_seen: str
    baseline_established: bool
    deviation_threshold: float
    associated_entities: List[str]

@dataclass
class AttackSignature:
    """Automatically generated attack signature"""
    signature_id: str
    signature_type: str  # statistical, behavioral, sequential, hybrid
    features: List[str]
    weights: List[float]
    threshold: float
    detection_accuracy: float
    false_positive_rate: float
    created_timestamp: str
    last_updated: str
    validation_status: str

class SequentialPatternDetector:
    """Detects sequential attack patterns using LSTM"""
    
    def __init__(self, sequence_length: int = 50, feature_dim: int = 20):
        self.sequence_length = sequence_length
        self.feature_dim = feature_dim
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Sequence buffer for real-time detection
        self.sequence_buffer = deque(maxlen=sequence_length)
        
    def _build_model(self):
        """Build LSTM autoencoder for sequence anomaly detection"""
        # Encoder
        encoder_inputs = keras.layers.Input(shape=(self.sequence_length, self.feature_dim))
        encoder_lstm1 = keras.layers.LSTM(128, return_sequences=True)(encoder_inputs)
        encoder_lstm2 = keras.layers.LSTM(64, return_sequences=False)(encoder_lstm1)
        encoder_dense = keras.layers.Dense(32, activation='relu')(encoder_lstm2)
        
        # Decoder
        decoder_dense = keras.layers.Dense(64, activation='relu')(encoder_dense)
        decoder_repeat = keras.layers.RepeatVector(self.sequence_length)(decoder_dense)
        decoder_lstm1 = keras.layers.LSTM(64, return_sequences=True)(decoder_repeat)
        decoder_lstm2 = keras.layers.LSTM(128, return_sequences=True)(decoder_lstm1)
        decoder_outputs = keras.layers.TimeDistributed(
            keras.layers.Dense(self.feature_dim, activation='linear')
        )(decoder_lstm2)
        
        # Autoencoder model
        autoencoder = keras.Model(encoder_inputs, decoder_outputs)
        autoencoder.compile(optimizer='adam', loss='mse', metrics=['mae'])
        
        # Encoder model for feature extraction
        encoder = keras.Model(encoder_inputs, encoder_dense)
        
        self.model = autoencoder
        self.encoder = encoder
    
    def train(self, normal_sequences: np.ndarray, epochs: int = 50, batch_size: int = 32):
        """Train the sequential pattern detector on normal traffic"""
        if self.model is None:
            self._build_model()
        
        # Normalize data
        original_shape = normal_sequences.shape
        reshaped_data = normal_sequences.reshape(-1, self.feature_dim)
        normalized_data = self.scaler.fit_transform(reshaped_data)
        normalized_sequences = normalized_data.reshape(original_shape)
        
        # Train autoencoder to reconstruct normal sequences
        history = self.model.fit(
            normalized_sequences, normalized_sequences,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            shuffle=True,
            verbose=0
        )
        
        # Calculate reconstruction error threshold
        reconstructions = self.model.predict(normalized_sequences, verbose=0)
        mse = np.mean(np.power(normalized_sequences - reconstructions, 2), axis=(1, 2))
        self.threshold = np.percentile(mse, 95)  # 95th percentile as threshold
        
        self.is_trained = True
        
        return history.history
    
    def detect_anomaly(self, sequence: np.ndarray) -> Tuple[float, bool]:
        """Detect anomaly in sequence"""
        if not self.is_trained:
            return 0.0, False
        
        # Normalize sequence
        reshaped_sequence = sequence.reshape(-1, self.feature_dim)
        normalized_sequence = self.scaler.transform(reshaped_sequence)
        normalized_sequence = normalized_sequence.reshape(1, self.sequence_length, self.feature_dim)
        
        # Get reconstruction
        reconstruction = self.model.predict(normalized_sequence, verbose=0)
        
        # Calculate reconstruction error
        mse = np.mean(np.power(normalized_sequence - reconstruction, 2))
        
        # Determine if anomalous
        is_anomaly = mse > self.threshold
        
        # Normalize score to 0-1 range
        anomaly_score = min(1.0, mse / (self.threshold * 2))
        
        return anomaly_score, is_anomaly
    
    def add_to_sequence_buffer(self, features: np.ndarray):
        """Add features to sequence buffer for real-time processing"""
        self.sequence_buffer.append(features)
        
        # Check if we have enough for a sequence
        if len(self.sequence_buffer) == self.sequence_length:
            sequence = np.array(list(self.sequence_buffer))
            return self.detect_anomaly(sequence)
        
        return 0.0, False

class BehavioralAnomalyDetector:
    """Detects behavioral anomalies using multiple ML techniques"""
    
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.dbscan = DBSCAN(eps=0.5, min_samples=5)
        self.pca = PCA(n_components=0.95)  # Keep 95% of variance
        self.scaler = StandardScaler()
        
        # Behavioral baselines
        self.user_baselines = {}
        self.system_baselines = {}
        self.network_baselines = {}
        
        # Pattern storage
        self.behavioral_patterns = {}
        
        self.is_trained = False
    
    def establish_baselines(self, training_data: Dict[str, np.ndarray]):
        """Establish behavioral baselines from training data"""
        # Combine all training data
        all_data = []
        for entity_type, data in training_data.items():
            all_data.append(data)
        
        combined_data = np.vstack(all_data)
        
        # Normalize and reduce dimensionality
        normalized_data = self.scaler.fit_transform(combined_data)
        reduced_data = self.pca.fit_transform(normalized_data)
        
        # Train isolation forest
        self.isolation_forest.fit(reduced_data)
        
        # Establish entity-specific baselines
        for entity_type, data in training_data.items():
            normalized_entity_data = self.scaler.transform(data)
            reduced_entity_data = self.pca.transform(normalized_entity_data)
            
            # Calculate baseline statistics
            baseline = {
                'mean': np.mean(reduced_entity_data, axis=0),
                'std': np.std(reduced_entity_data, axis=0),
                'min': np.min(reduced_entity_data, axis=0),
                'max': np.max(reduced_entity_data, axis=0),
                'percentiles': {
                    '25': np.percentile(reduced_entity_data, 25, axis=0),
                    '75': np.percentile(reduced_entity_data, 75, axis=0),
                    '95': np.percentile(reduced_entity_data, 95, axis=0)
                }
            }
            
            if entity_type.startswith('user_'):
                self.user_baselines[entity_type] = baseline
            elif entity_type.startswith('system_'):
                self.system_baselines[entity_type] = baseline
            elif entity_type.startswith('network_'):
                self.network_baselines[entity_type] = baseline
        
        self.is_trained = True
    
    def detect_behavioral_anomaly(self, entity_type: str, features: np.ndarray) -> Tuple[float, Dict[str, Any]]:
        """Detect behavioral anomaly for specific entity"""
        if not self.is_trained:
            return 0.0, {}
        
        # Normalize and reduce dimensionality
        normalized_features = self.scaler.transform(features.reshape(1, -1))
        reduced_features = self.pca.transform(normalized_features)
        
        # Isolation forest anomaly score
        isolation_score = self.isolation_forest.decision_function(reduced_features)[0]
        is_outlier = self.isolation_forest.predict(reduced_features)[0] == -1
        
        # Entity-specific baseline deviation
        baseline_deviation = 0.0
        deviation_details = {}
        
        # Find appropriate baseline
        baseline = None
        if entity_type.startswith('user_') and entity_type in self.user_baselines:
            baseline = self.user_baselines[entity_type]
        elif entity_type.startswith('system_') and entity_type in self.system_baselines:
            baseline = self.system_baselines[entity_type]
        elif entity_type.startswith('network_') and entity_type in self.network_baselines:
            baseline = self.network_baselines[entity_type]
        
        if baseline:
            # Calculate deviations from baseline
            mean_deviation = np.mean(np.abs(reduced_features[0] - baseline['mean']))
            std_deviations = np.abs(reduced_features[0] - baseline['mean']) / (baseline['std'] + 1e-8)
            max_std_deviation = np.max(std_deviations)
            
            # Check if outside normal ranges
            outside_95th = np.any(reduced_features[0] > baseline['percentiles']['95'])
            
            baseline_deviation = max_std_deviation
            deviation_details = {
                'mean_deviation': float(mean_deviation),
                'max_std_deviation': float(max_std_deviation),
                'outside_95th_percentile': bool(outside_95th),
                'significant_features': np.where(std_deviations > 3.0)[0].tolist()
            }
        
        # Combined anomaly score
        anomaly_score = max(0.0, min(1.0, -isolation_score / 2 + 0.5))  # Normalize isolation score
        if baseline_deviation > 3.0:  # 3 standard deviations
            anomaly_score = max(anomaly_score, min(1.0, baseline_deviation / 10.0))
        
        return anomaly_score, {
            'isolation_score': float(isolation_score),
            'is_outlier': bool(is_outlier),
            'baseline_deviation': float(baseline_deviation),
            'deviation_details': deviation_details
        }

class StatisticalAnomalyDetector:
    """Statistical methods for anomaly detection"""
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.feature_windows = defaultdict(lambda: deque(maxlen=window_size))
        self.feature_statistics = {}
        
    def update_statistics(self, features: Dict[str, float]):
        """Update statistical models with new features"""
        for feature_name, value in features.items():
            self.feature_windows[feature_name].append(value)
            
            # Update statistics if we have enough data
            if len(self.feature_windows[feature_name]) >= 30:
                window_data = np.array(list(self.feature_windows[feature_name]))
                
                self.feature_statistics[feature_name] = {
                    'mean': np.mean(window_data),
                    'std': np.std(window_data),
                    'median': np.median(window_data),
                    'q25': np.percentile(window_data, 25),
                    'q75': np.percentile(window_data, 75),
                    'min': np.min(window_data),
                    'max': np.max(window_data),
                    'trend': self._calculate_trend(window_data[-50:])  # Last 50 values
                }
    
    def _calculate_trend(self, data: np.ndarray) -> float:
        """Calculate trend using linear regression slope"""
        if len(data) < 5:
            return 0.0
        
        x = np.arange(len(data))
        slope, _ = np.polyfit(x, data, 1)
        return float(slope)
    
    def detect_statistical_anomalies(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Detect statistical anomalies in features"""
        anomalies = {}
        overall_score = 0.0
        
        for feature_name, value in features.items():
            if feature_name in self.feature_statistics:
                stats = self.feature_statistics[feature_name]
                
                # Z-score anomaly
                z_score = abs(value - stats['mean']) / (stats['std'] + 1e-8)
                
                # IQR anomaly
                iqr = stats['q75'] - stats['q25']
                iqr_lower = stats['q25'] - 1.5 * iqr
                iqr_upper = stats['q75'] + 1.5 * iqr
                iqr_anomaly = value < iqr_lower or value > iqr_upper
                
                # Trend anomaly (sudden change in trend)
                recent_trend = self._calculate_trend(
                    np.array(list(self.feature_windows[feature_name])[-10:])
                )
                trend_change = abs(recent_trend - stats['trend'])
                
                # Feature anomaly score
                feature_score = 0.0
                if z_score > 3.0:  # 3 standard deviations
                    feature_score += 0.4
                if iqr_anomaly:
                    feature_score += 0.3
                if trend_change > stats['std']:  # Significant trend change
                    feature_score += 0.3
                
                anomalies[feature_name] = {
                    'z_score': float(z_score),
                    'iqr_anomaly': iqr_anomaly,
                    'trend_change': float(trend_change),
                    'anomaly_score': feature_score,
                    'is_anomalous': feature_score > 0.5
                }
                
                overall_score = max(overall_score, feature_score)
        
        return {
            'overall_anomaly_score': overall_score,
            'feature_anomalies': anomalies,
            'is_anomalous': overall_score > 0.6
        }

class ZeroDaySignatureGenerator:
    """Automatically generates signatures for detected zero-day attacks"""
    
    def __init__(self):
        self.signature_templates = self._load_signature_templates()
        self.generated_signatures = {}
        
    def _load_signature_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load signature generation templates"""
        return {
            'network_anomaly': {
                'features': ['packet_size', 'inter_arrival_time', 'flow_duration', 'port_scan_indicators'],
                'thresholds': {'packet_size': (0, 1500), 'flow_duration': (0, 300)},
                'pattern_type': 'statistical'
            },
            'behavioral_anomaly': {
                'features': ['login_frequency', 'file_access_pattern', 'network_usage', 'privilege_escalation'],
                'thresholds': {'login_frequency': (0, 10), 'network_usage': (0, 1000)},
                'pattern_type': 'behavioral'
            },
            'payload_anomaly': {
                'features': ['entropy', 'string_patterns', 'code_injection_markers', 'shellcode_indicators'],
                'thresholds': {'entropy': (0, 8), 'string_patterns': (0, 100)},
                'pattern_type': 'content'
            }
        }
    
    def generate_signature(self, anomaly_data: Dict[str, Any], attack_samples: List[Dict[str, Any]]) -> AttackSignature:
        """Generate attack signature from anomaly data"""
        # Determine signature type based on anomaly characteristics
        signature_type = self._determine_signature_type(anomaly_data)
        
        # Extract features from attack samples
        features, weights = self._extract_signature_features(attack_samples, signature_type)
        
        # Calculate optimal threshold
        threshold = self._calculate_threshold(attack_samples, features, weights)
        
        # Estimate detection accuracy
        accuracy, fpr = self._estimate_signature_performance(attack_samples, features, weights, threshold)
        
        signature = AttackSignature(
            signature_id=f"zd_{int(time.time())}_{hashlib.md5(str(features).encode()).hexdigest()[:8]}",
            signature_type=signature_type,
            features=features,
            weights=weights,
            threshold=threshold,
            detection_accuracy=accuracy,
            false_positive_rate=fpr,
            created_timestamp=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            validation_status='pending'
        )
        
        self.generated_signatures[signature.signature_id] = signature
        return signature
    
    def _determine_signature_type(self, anomaly_data: Dict[str, Any]) -> str:
        """Determine the best signature type for the anomaly"""
        # Simple heuristic based on anomaly characteristics
        if 'network_indicators' in anomaly_data and anomaly_data['network_indicators']:
            return 'network_anomaly'
        elif 'behavioral_deviation' in anomaly_data and anomaly_data['behavioral_deviation'] > 0.7:
            return 'behavioral_anomaly'
        elif 'payload_hash' in anomaly_data:
            return 'payload_anomaly'
        else:
            return 'hybrid'
    
    def _extract_signature_features(self, attack_samples: List[Dict[str, Any]], 
                                  signature_type: str) -> Tuple[List[str], List[float]]:
        """Extract discriminative features for signature"""
        if signature_type in self.signature_templates:
            candidate_features = self.signature_templates[signature_type]['features']
        else:
            # For hybrid signatures, use all available features
            all_features = set()
            for sample in attack_samples:
                all_features.update(sample.keys())
            candidate_features = list(all_features)
        
        # Calculate feature importance using simple variance-based method
        feature_values = defaultdict(list)
        for sample in attack_samples:
            for feature in candidate_features:
                if feature in sample:
                    feature_values[feature].append(sample[feature])
        
        # Calculate weights based on variance and discriminative power
        features = []
        weights = []
        
        for feature, values in feature_values.items():
            if len(values) > 1:
                variance = np.var(values)
                if variance > 0:  # Only include features with variance
                    weight = min(1.0, variance / 100.0)  # Normalize weight
                    features.append(feature)
                    weights.append(weight)
        
        # Normalize weights
        if weights:
            total_weight = sum(weights)
            weights = [w / total_weight for w in weights]
        
        return features, weights
    
    def _calculate_threshold(self, attack_samples: List[Dict[str, Any]], 
                           features: List[str], weights: List[float]) -> float:
        """Calculate optimal detection threshold"""
        if not attack_samples or not features:
            return 0.5
        
        scores = []
        for sample in attack_samples:
            score = 0.0
            for feature, weight in zip(features, weights):
                if feature in sample:
                    # Normalize feature value and apply weight
                    normalized_value = min(1.0, abs(sample[feature]) / 100.0)
                    score += normalized_value * weight
            scores.append(score)
        
        # Use median as threshold
        return float(np.median(scores)) if scores else 0.5
    
    def _estimate_signature_performance(self, attack_samples: List[Dict[str, Any]], 
                                      features: List[str], weights: List[float], 
                                      threshold: float) -> Tuple[float, float]:
        """Estimate signature detection accuracy and false positive rate"""
        # This is a simplified estimation
        # In practice, you would use separate validation datasets
        
        if not attack_samples:
            return 0.5, 0.1
        
        # Calculate detection rate on attack samples
        detected = 0
        for sample in attack_samples:
            score = 0.0
            for feature, weight in zip(features, weights):
                if feature in sample:
                    normalized_value = min(1.0, abs(sample[feature]) / 100.0)
                    score += normalized_value * weight
            
            if score >= threshold:
                detected += 1
        
        detection_accuracy = detected / len(attack_samples) if attack_samples else 0.0
        
        # Estimate false positive rate (simplified)
        # Higher threshold generally means lower FPR
        estimated_fpr = max(0.01, min(0.5, (1.0 - threshold) * 0.2))
        
        return detection_accuracy, estimated_fpr

class ZeroDayDetectionEngine:
    """Main zero-day detection engine"""
    
    def __init__(self, db_path: str = './data/zero_day_detection.db'):
        self.db_path = db_path
        
        # Detection components
        self.sequential_detector = SequentialPatternDetector()
        self.behavioral_detector = BehavioralAnomalyDetector()
        self.statistical_detector = StatisticalAnomalyDetector()
        self.signature_generator = ZeroDaySignatureGenerator()
        
        # Alert storage
        self.active_alerts = {}
        self.signature_database = {}
        
        # Training status
        self.is_trained = False
        self.last_training = None
        
        # Initialize database
        self._init_database()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('ZeroDayDetectionEngine')
    
    def _init_database(self):
        """Initialize zero-day detection database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Zero-day alerts table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS zero_day_alerts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        alert_id TEXT UNIQUE NOT NULL,
                        timestamp TEXT NOT NULL,
                        attack_signature TEXT,
                        confidence_score REAL,
                        anomaly_score REAL,
                        behavioral_deviation REAL,
                        affected_systems TEXT,
                        attack_vector TEXT,
                        payload_hash TEXT,
                        network_indicators TEXT,
                        system_indicators TEXT,
                        ml_model_predictions TEXT,
                        severity TEXT,
                        recommended_actions TEXT,
                        false_positive_probability REAL,
                        status TEXT DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Generated signatures table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS attack_signatures (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        signature_id TEXT UNIQUE NOT NULL,
                        signature_type TEXT,
                        features TEXT,
                        weights TEXT,
                        threshold REAL,
                        detection_accuracy REAL,
                        false_positive_rate REAL,
                        created_timestamp TEXT,
                        last_updated TEXT,
                        validation_status TEXT,
                        deployment_status TEXT DEFAULT 'testing'
                    )
                ''')
                
                # Behavioral patterns table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS behavioral_patterns (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pattern_id TEXT UNIQUE NOT NULL,
                        pattern_type TEXT,
                        feature_vector TEXT,
                        frequency INTEGER,
                        first_seen TEXT,
                        last_seen TEXT,
                        baseline_established BOOLEAN,
                        deviation_threshold REAL,
                        associated_entities TEXT
                    )
                ''')
                
                conn.commit()
                self.logger.info("Zero-day detection database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def train_models(self, training_data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Train all detection models"""
        training_results = {}
        
        try:
            # Train sequential pattern detector
            if 'sequences' in training_data:
                seq_history = self.sequential_detector.train(training_data['sequences'])
                training_results['sequential'] = {
                    'trained': True,
                    'final_loss': seq_history['loss'][-1] if seq_history['loss'] else 0.0,
                    'threshold': self.sequential_detector.threshold
                }
            
            # Train behavioral anomaly detector
            if 'behavioral' in training_data:
                self.behavioral_detector.establish_baselines(training_data['behavioral'])
                training_results['behavioral'] = {
                    'trained': True,
                    'baselines_established': len(self.behavioral_detector.user_baselines) + 
                                           len(self.behavioral_detector.system_baselines) +
                                           len(self.behavioral_detector.network_baselines)
                }
            
            self.is_trained = True
            self.last_training = datetime.now().isoformat()
            
            self.logger.info("Zero-day detection models trained successfully")
            return training_results
            
        except Exception as e:
            self.logger.error(f"Error training models: {e}")
            return {'error': str(e)}
    
    def analyze_sample(self, sample_data: Dict[str, Any]) -> ZeroDayAlert:
        """Analyze sample for zero-day attack indicators"""
        try:
            # Extract different types of features
            network_features = sample_data.get('network_features', {})
            system_features = sample_data.get('system_features', {})
            behavioral_features = sample_data.get('behavioral_features', {})
            payload_data = sample_data.get('payload', {})
            
            # Sequential analysis
            sequential_score = 0.0
            if 'sequence' in sample_data and self.sequential_detector.is_trained:
                sequence = np.array(sample_data['sequence'])
                sequential_score, is_seq_anomaly = self.sequential_detector.detect_anomaly(sequence)
            
            # Behavioral analysis
            behavioral_score = 0.0
            behavioral_details = {}
            if behavioral_features and self.behavioral_detector.is_trained:
                entity_type = sample_data.get('entity_type', 'unknown')
                feature_vector = np.array(list(behavioral_features.values()))
                behavioral_score, behavioral_details = self.behavioral_detector.detect_behavioral_anomaly(
                    entity_type, feature_vector
                )
            
            # Statistical analysis
            statistical_results = {}
            if network_features or system_features:
                all_features = {**network_features, **system_features}
                self.statistical_detector.update_statistics(all_features)
                statistical_results = self.statistical_detector.detect_statistical_anomalies(all_features)
            
            # Combine scores
            anomaly_score = max(sequential_score, behavioral_score, 
                              statistical_results.get('overall_anomaly_score', 0.0))
            
            # Calculate confidence
            confidence_factors = []
            if sequential_score > 0.7:
                confidence_factors.append(0.3)
            if behavioral_score > 0.7:
                confidence_factors.append(0.4)
            if statistical_results.get('is_anomalous', False):
                confidence_factors.append(0.3)
            
            confidence_score = sum(confidence_factors)
            
            # Determine if this is a potential zero-day
            is_zero_day = (anomaly_score > 0.7 and confidence_score > 0.6)
            
            if is_zero_day:
                # Generate attack signature
                attack_samples = [sample_data]  # In practice, collect multiple samples
                signature = self.signature_generator.generate_signature(
                    {
                        'anomaly_score': anomaly_score,
                        'behavioral_deviation': behavioral_score,
                        'network_indicators': network_features,
                        'system_indicators': system_features
                    },
                    attack_samples
                )
                
                # Create zero-day alert
                alert = ZeroDayAlert(
                    alert_id=f"zd_{int(time.time())}_{hashlib.md5(str(sample_data).encode()).hexdigest()[:8]}",
                    timestamp=datetime.now().isoformat(),
                    attack_signature=signature.signature_id,
                    confidence_score=confidence_score,
                    anomaly_score=anomaly_score,
                    behavioral_deviation=behavioral_score,
                    affected_systems=sample_data.get('affected_systems', []),
                    attack_vector=self._determine_attack_vector(sample_data),
                    payload_hash=hashlib.sha256(str(payload_data).encode()).hexdigest(),
                    network_indicators=network_features,
                    system_indicators=system_features,
                    ml_model_predictions={
                        'sequential': sequential_score,
                        'behavioral': behavioral_score,
                        'statistical': statistical_results.get('overall_anomaly_score', 0.0)
                    },
                    severity=self._calculate_severity(anomaly_score, confidence_score),
                    recommended_actions=self._generate_response_actions(sample_data, anomaly_score),
                    false_positive_probability=self._estimate_false_positive_probability(confidence_score)
                )
                
                # Store alert and signature
                self._store_zero_day_alert(alert)
                self._store_attack_signature(signature)
                
                self.active_alerts[alert.alert_id] = alert
                self.signature_database[signature.signature_id] = signature
                
                self.logger.warning(f"Zero-day attack detected: {alert.alert_id}")
                return alert
            
            # Return empty alert if not zero-day
            return None
            
        except Exception as e:
            self.logger.error(f"Error analyzing sample: {e}")
            return None
    
    def _determine_attack_vector(self, sample_data: Dict[str, Any]) -> str:
        """Determine the attack vector based on sample characteristics"""
        if 'network_features' in sample_data and sample_data['network_features']:
            return 'network'
        elif 'payload' in sample_data and sample_data['payload']:
            return 'payload'
        elif 'behavioral_features' in sample_data:
            return 'behavioral'
        else:
            return 'unknown'
    
    def _calculate_severity(self, anomaly_score: float, confidence_score: float) -> str:
        """Calculate alert severity"""
        combined_score = (anomaly_score + confidence_score) / 2
        
        if combined_score >= 0.9:
            return 'critical'
        elif combined_score >= 0.7:
            return 'high'
        elif combined_score >= 0.5:
            return 'medium'
        else:
            return 'low'
    
    def _generate_response_actions(self, sample_data: Dict[str, Any], anomaly_score: float) -> List[str]:
        """Generate recommended response actions"""
        actions = []
        
        # Base actions
        actions.extend([
            'Isolate affected systems immediately',
            'Preserve forensic evidence',
            'Notify security team',
            'Begin incident response procedures'
        ])
        
        # Specific actions based on attack vector
        attack_vector = self._determine_attack_vector(sample_data)
        
        if attack_vector == 'network':
            actions.extend([
                'Block suspicious network traffic',
                'Update firewall rules',
                'Monitor network for similar patterns'
            ])
        elif attack_vector == 'payload':
            actions.extend([
                'Submit payload for analysis',
                'Update antivirus signatures',
                'Scan for similar malware'
            ])
        elif attack_vector == 'behavioral':
            actions.extend([
                'Review user access logs',
                'Reset compromised credentials',
                'Enhance user monitoring'
            ])
        
        # High-severity actions
        if anomaly_score > 0.8:
            actions.extend([
                'Contact external security experts',
                'Consider threat intelligence sharing',
                'Implement additional monitoring'
            ])
        
        return actions
    
    def _estimate_false_positive_probability(self, confidence_score: float) -> float:
        """Estimate false positive probability"""
        # Higher confidence generally means lower false positive probability
        return max(0.01, min(0.5, 1.0 - confidence_score))
    
    def _store_zero_day_alert(self, alert: ZeroDayAlert):
        """Store zero-day alert in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO zero_day_alerts (
                        alert_id, timestamp, attack_signature, confidence_score,
                        anomaly_score, behavioral_deviation, affected_systems,
                        attack_vector, payload_hash, network_indicators,
                        system_indicators, ml_model_predictions, severity,
                        recommended_actions, false_positive_probability
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    alert.alert_id, alert.timestamp, alert.attack_signature,
                    alert.confidence_score, alert.anomaly_score, alert.behavioral_deviation,
                    json.dumps(alert.affected_systems), alert.attack_vector,
                    alert.payload_hash, json.dumps(alert.network_indicators),
                    json.dumps(alert.system_indicators), json.dumps(alert.ml_model_predictions),
                    alert.severity, json.dumps(alert.recommended_actions),
                    alert.false_positive_probability
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing zero-day alert: {e}")
    
    def _store_attack_signature(self, signature: AttackSignature):
        """Store attack signature in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO attack_signatures (
                        signature_id, signature_type, features, weights, threshold,
                        detection_accuracy, false_positive_rate, created_timestamp,
                        last_updated, validation_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    signature.signature_id, signature.signature_type, json.dumps(signature.features),
                    json.dumps(signature.weights), signature.threshold, signature.detection_accuracy,
                    signature.false_positive_rate, signature.created_timestamp,
                    signature.last_updated, signature.validation_status
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing attack signature: {e}")
    
    def get_detection_dashboard_data(self) -> Dict[str, Any]:
        """Get zero-day detection dashboard data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get recent alerts by severity
                cursor.execute('''
                    SELECT severity, COUNT(*) FROM zero_day_alerts
                    WHERE created_at > datetime('now', '-24 hours')
                    GROUP BY severity
                ''')
                alerts_by_severity = dict(cursor.fetchall())
                
                # Get attack vectors
                cursor.execute('''
                    SELECT attack_vector, COUNT(*) FROM zero_day_alerts
                    WHERE created_at > datetime('now', '-7 days')
                    GROUP BY attack_vector
                ''')
                attack_vectors = dict(cursor.fetchall())
                
                # Get signature statistics
                cursor.execute('''
                    SELECT COUNT(*), AVG(detection_accuracy), AVG(false_positive_rate)
                    FROM attack_signatures
                ''')
                sig_stats = cursor.fetchone()
                
                return {
                    'training_status': {
                        'is_trained': self.is_trained,
                        'last_training': self.last_training,
                        'models_trained': {
                            'sequential': self.sequential_detector.is_trained,
                            'behavioral': self.behavioral_detector.is_trained,
                            'statistical': len(self.statistical_detector.feature_statistics) > 0
                        }
                    },
                    'alerts_summary': {
                        'active_alerts': len(self.active_alerts),
                        'alerts_by_severity': alerts_by_severity,
                        'attack_vectors': attack_vectors
                    },
                    'signature_database': {
                        'total_signatures': len(self.signature_database),
                        'avg_detection_accuracy': sig_stats[1] if sig_stats[1] else 0.0,
                        'avg_false_positive_rate': sig_stats[2] if sig_stats[2] else 0.0
                    },
                    'detection_metrics': {
                        'samples_analyzed': getattr(self, 'samples_analyzed', 0),
                        'zero_days_detected': len(self.active_alerts),
                        'false_positive_rate': self._calculate_overall_fpr()
                    },
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}
    
    def _calculate_overall_fpr(self) -> float:
        """Calculate overall false positive rate"""
        if not self.signature_database:
            return 0.0
        
        fprs = [sig.false_positive_rate for sig in self.signature_database.values()]
        return np.mean(fprs) if fprs else 0.0

def main():
    """Main function for testing zero-day detection"""
    engine = ZeroDayDetectionEngine()
    
    print("Zero-Day Attack Detection System")
    print("=" * 40)
    
    # Generate synthetic training data
    print("\n1. Generating synthetic training data...")
    
    # Sequential training data (normal network flows)
    normal_sequences = np.random.normal(0, 1, (1000, 50, 20))  # 1000 sequences, 50 timesteps, 20 features
    
    # Behavioral training data
    behavioral_data = {
        'user_admin': np.random.normal(0, 1, (500, 10)),
        'user_regular': np.random.normal(2, 0.5, (1000, 10)),
        'system_web_server': np.random.normal(1, 0.8, (300, 10)),
        'network_internal': np.random.normal(0.5, 1.2, (800, 10))
    }
    
    training_data = {
        'sequences': normal_sequences,
        'behavioral': behavioral_data
    }
    
    # Train models
    print("\n2. Training detection models...")
    training_results = engine.train_models(training_data)
    print(f"Training results: {json.dumps(training_results, indent=2)}")
    
    # Test with potential zero-day samples
    print("\n3. Testing with suspicious samples...")
    
    # Create suspicious sample
    suspicious_sample = {
        'entity_type': 'user_admin',
        'network_features': {
            'packet_size': 2000,  # Unusual large packets
            'inter_arrival_time': 0.001,  # Very fast
            'flow_duration': 600,  # Long duration
            'port_scan_indicators': 15  # High port scanning
        },
        'system_features': {
            'login_frequency': 50,  # Unusual high login frequency
            'file_access_pattern': 200,  # High file access
            'privilege_escalation': 5  # Privilege escalation attempts
        },
        'behavioral_features': {
            'activity_1': 10.0,  # Significantly different from normal
            'activity_2': -5.0,
            'activity_3': 15.0
        },
        'payload': {'entropy': 7.8, 'suspicious_strings': ['exec', 'payload']},
        'affected_systems': ['web-server-01', 'db-server-02'],
        'sequence': np.random.normal(5, 2, (50, 20))  # Anomalous sequence
    }
    
    # Analyze sample
    alert = engine.analyze_sample(suspicious_sample)
    
    if alert:
        print(f"\n🚨 ZERO-DAY ATTACK DETECTED!")
        print(f"Alert ID: {alert.alert_id}")
        print(f"Confidence: {alert.confidence_score:.3f}")
        print(f"Anomaly Score: {alert.anomaly_score:.3f}")
        print(f"Severity: {alert.severity.upper()}")
        print(f"Attack Vector: {alert.attack_vector}")
        print(f"Affected Systems: {', '.join(alert.affected_systems)}")
        print(f"Recommended Actions:")
        for action in alert.recommended_actions[:5]:
            print(f"  - {action}")
    else:
        print("No zero-day attack detected in sample")
    
    # Get dashboard data
    print("\n4. Detection System Status:")
    dashboard_data = engine.get_detection_dashboard_data()
    print(json.dumps(dashboard_data, indent=2))

if __name__ == "__main__":
    main()