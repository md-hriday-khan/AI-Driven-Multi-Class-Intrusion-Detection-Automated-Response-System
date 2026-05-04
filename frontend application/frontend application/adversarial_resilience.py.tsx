#!/usr/bin/env python3
"""
Adversarial Attack Resilience System for SHIELD SOC
Defense mechanisms against adversarial examples and model poisoning
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats
import json
import logging
import time
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import threading
import asyncio
import warnings
warnings.filterwarnings('ignore')

@dataclass
class AdversarialAttack:
    """Detected adversarial attack"""
    attack_id: str
    timestamp: str
    attack_type: str  # fgsm, pgd, c&w, deepfool, backdoor, poisoning
    target_model: str
    original_input: np.ndarray
    adversarial_input: np.ndarray
    perturbation: np.ndarray
    perturbation_norm: float
    confidence_drop: float
    detection_method: str
    detection_confidence: float
    mitigation_applied: str
    success_probability: float
    metadata: Dict[str, Any]

@dataclass
class DefenseMetrics:
    """Defense system performance metrics"""
    timestamp: str
    attacks_detected: int
    attacks_blocked: int
    false_positives: int
    detection_accuracy: float
    robustness_score: float
    model_confidence_avg: float
    perturbation_budget_used: float
    defense_overhead: float
    adaptive_threshold: float

class AdversarialDetector:
    """Detects adversarial examples using multiple techniques"""
    
    def __init__(self, model: keras.Model, input_shape: Tuple[int, ...]):
        self.model = model
        self.input_shape = input_shape
        
        # Detection thresholds
        self.confidence_threshold = 0.7
        self.entropy_threshold = 2.0
        self.gradient_threshold = 0.1
        self.reconstruction_threshold = 0.05
        
        # Detection models
        self.statistical_detector = self._build_statistical_detector()
        self.reconstruction_model = self._build_reconstruction_model()
        self.gradient_analyzer = GradientAnalyzer(model)
        
        # Baseline statistics
        self.baseline_stats = {}
        self.is_calibrated = False
        
    def _build_statistical_detector(self):
        """Build statistical anomaly detector for adversarial examples"""
        return IsolationForest(contamination=0.1, random_state=42)
    
    def _build_reconstruction_model(self):
        """Build autoencoder for input reconstruction"""
        input_layer = keras.layers.Input(shape=self.input_shape)
        
        # Encoder
        x = keras.layers.Flatten()(input_layer)
        x = keras.layers.Dense(128, activation='relu')(x)
        x = keras.layers.Dense(64, activation='relu')(x)
        encoded = keras.layers.Dense(32, activation='relu')(x)
        
        # Decoder
        x = keras.layers.Dense(64, activation='relu')(encoded)
        x = keras.layers.Dense(128, activation='relu')(x)
        x = keras.layers.Dense(np.prod(self.input_shape), activation='sigmoid')(x)
        decoded = keras.layers.Reshape(self.input_shape)(x)
        
        autoencoder = keras.Model(input_layer, decoded)
        autoencoder.compile(optimizer='adam', loss='mse')
        
        return autoencoder
    
    def calibrate_detector(self, clean_samples: np.ndarray):
        """Calibrate detector with clean samples"""
        # Calculate baseline statistics
        predictions = self.model.predict(clean_samples, verbose=0)
        
        # Confidence statistics
        confidences = np.max(predictions, axis=1)
        self.baseline_stats['confidence_mean'] = np.mean(confidences)
        self.baseline_stats['confidence_std'] = np.std(confidences)
        
        # Entropy statistics
        entropies = -np.sum(predictions * np.log(predictions + 1e-8), axis=1)
        self.baseline_stats['entropy_mean'] = np.mean(entropies)
        self.baseline_stats['entropy_std'] = np.std(entropies)
        
        # Gradient statistics
        gradients = self.gradient_analyzer.compute_gradients(clean_samples)
        gradient_norms = np.linalg.norm(gradients.reshape(len(gradients), -1), axis=1)
        self.baseline_stats['gradient_mean'] = np.mean(gradient_norms)
        self.baseline_stats['gradient_std'] = np.std(gradient_norms)
        
        # Train reconstruction model
        self.reconstruction_model.fit(clean_samples, clean_samples, epochs=50, verbose=0)
        
        # Reconstruction error statistics
        reconstructed = self.reconstruction_model.predict(clean_samples, verbose=0)
        reconstruction_errors = np.mean((clean_samples - reconstructed)**2, axis=tuple(range(1, len(self.input_shape)+1)))
        self.baseline_stats['reconstruction_mean'] = np.mean(reconstruction_errors)
        self.baseline_stats['reconstruction_std'] = np.std(reconstruction_errors)
        
        # Train statistical detector
        feature_vectors = self._extract_features(clean_samples)
        self.statistical_detector.fit(feature_vectors)
        
        self.is_calibrated = True
        logging.info("Adversarial detector calibrated")
    
    def detect_adversarial(self, input_sample: np.ndarray) -> Tuple[bool, Dict[str, float]]:
        """Detect if input is adversarial"""
        if not self.is_calibrated:
            return False, {}
        
        scores = {}
        is_adversarial = False
        
        # Confidence-based detection
        prediction = self.model.predict(input_sample.reshape(1, *self.input_shape), verbose=0)[0]
        confidence = np.max(prediction)
        confidence_z_score = abs(confidence - self.baseline_stats['confidence_mean']) / self.baseline_stats['confidence_std']
        scores['confidence_anomaly'] = confidence_z_score
        
        if confidence < self.confidence_threshold or confidence_z_score > 2.0:
            is_adversarial = True
        
        # Entropy-based detection
        entropy = -np.sum(prediction * np.log(prediction + 1e-8))
        entropy_z_score = abs(entropy - self.baseline_stats['entropy_mean']) / self.baseline_stats['entropy_std']
        scores['entropy_anomaly'] = entropy_z_score
        
        if entropy > self.entropy_threshold or entropy_z_score > 2.0:
            is_adversarial = True
        
        # Gradient-based detection
        gradients = self.gradient_analyzer.compute_gradients(input_sample.reshape(1, *self.input_shape))
        gradient_norm = np.linalg.norm(gradients.reshape(-1))
        gradient_z_score = abs(gradient_norm - self.baseline_stats['gradient_mean']) / self.baseline_stats['gradient_std']
        scores['gradient_anomaly'] = gradient_z_score
        
        if gradient_z_score > 2.0:
            is_adversarial = True
        
        # Reconstruction-based detection
        reconstructed = self.reconstruction_model.predict(input_sample.reshape(1, *self.input_shape), verbose=0)[0]
        reconstruction_error = np.mean((input_sample - reconstructed)**2)
        reconstruction_z_score = abs(reconstruction_error - self.baseline_stats['reconstruction_mean']) / self.baseline_stats['reconstruction_std']
        scores['reconstruction_anomaly'] = reconstruction_z_score
        
        if reconstruction_error > self.reconstruction_threshold or reconstruction_z_score > 2.0:
            is_adversarial = True
        
        # Statistical anomaly detection
        feature_vector = self._extract_features(input_sample.reshape(1, *self.input_shape))
        anomaly_score = self.statistical_detector.decision_function(feature_vector)[0]
        is_outlier = self.statistical_detector.predict(feature_vector)[0] == -1
        scores['statistical_anomaly'] = -anomaly_score  # Convert to positive anomaly score
        
        if is_outlier:
            is_adversarial = True
        
        # Overall confidence
        detection_confidence = np.mean([
            min(1.0, confidence_z_score / 3.0),
            min(1.0, entropy_z_score / 3.0),
            min(1.0, gradient_z_score / 3.0),
            min(1.0, reconstruction_z_score / 3.0),
            min(1.0, max(0.0, -anomaly_score + 0.5))
        ])
        
        scores['detection_confidence'] = detection_confidence
        
        return is_adversarial, scores
    
    def _extract_features(self, samples: np.ndarray) -> np.ndarray:
        """Extract features for statistical analysis"""
        features = []
        
        for sample in samples:
            sample_features = []
            
            # Statistical features
            sample_features.append(np.mean(sample))
            sample_features.append(np.std(sample))
            sample_features.append(np.min(sample))
            sample_features.append(np.max(sample))
            sample_features.append(stats.skew(sample.flatten()))
            sample_features.append(stats.kurtosis(sample.flatten()))
            
            # Gradient features
            if len(sample.shape) > 1:
                # Image-like features
                sample_features.append(np.mean(np.gradient(sample)[0]))
                sample_features.append(np.mean(np.gradient(sample)[1]))
            
            features.append(sample_features)
        
        return np.array(features)

class GradientAnalyzer:
    """Analyzes gradients for adversarial detection"""
    
    def __init__(self, model: keras.Model):
        self.model = model
    
    def compute_gradients(self, inputs: np.ndarray) -> np.ndarray:
        """Compute gradients of model output w.r.t. input"""
        inputs_tensor = tf.Variable(inputs, dtype=tf.float32)
        
        with tf.GradientTape() as tape:
            predictions = self.model(inputs_tensor)
            loss = tf.reduce_mean(predictions)
        
        gradients = tape.gradient(loss, inputs_tensor)
        return gradients.numpy()
    
    def analyze_gradient_patterns(self, gradients: np.ndarray) -> Dict[str, float]:
        """Analyze gradient patterns for anomalies"""
        flat_gradients = gradients.reshape(len(gradients), -1)
        
        analysis = {}
        
        # Gradient magnitude analysis
        gradient_norms = np.linalg.norm(flat_gradients, axis=1)
        analysis['mean_gradient_norm'] = np.mean(gradient_norms)
        analysis['std_gradient_norm'] = np.std(gradient_norms)
        
        # Gradient direction consistency
        if len(gradients) > 1:
            correlations = []
            for i in range(len(gradients)):
                for j in range(i+1, len(gradients)):
                    corr = np.corrcoef(flat_gradients[i], flat_gradients[j])[0, 1]
                    if not np.isnan(corr):
                        correlations.append(abs(corr))
            
            analysis['gradient_consistency'] = np.mean(correlations) if correlations else 0.0
        
        return analysis

class AdversarialDefense:
    """Implements defense mechanisms against adversarial attacks"""
    
    def __init__(self, model: keras.Model, input_shape: Tuple[int, ...]):
        self.model = model
        self.input_shape = input_shape
        
        # Defense strategies
        self.input_transformations = InputTransformations()
        self.adversarial_training = AdversarialTraining(model)
        self.gradient_masking = GradientMasking(model)
        
        # Defense parameters
        self.defense_enabled = True
        self.transformation_probability = 0.3
        self.noise_scale = 0.01
        
    def apply_input_transformations(self, inputs: np.ndarray) -> np.ndarray:
        """Apply defensive input transformations"""
        if not self.defense_enabled:
            return inputs
        
        transformed_inputs = inputs.copy()
        
        # Random transformations
        if np.random.random() < self.transformation_probability:
            transformed_inputs = self.input_transformations.apply_random_transformation(transformed_inputs)
        
        # Gaussian noise injection
        if np.random.random() < 0.5:
            noise = np.random.normal(0, self.noise_scale, inputs.shape)
            transformed_inputs = np.clip(transformed_inputs + noise, 0, 1)
        
        return transformed_inputs
    
    def adversarial_prediction(self, inputs: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Make prediction with adversarial defenses"""
        defense_info = {}
        
        # Apply input transformations
        transformed_inputs = self.apply_input_transformations(inputs)
        defense_info['transformations_applied'] = not np.array_equal(inputs, transformed_inputs)
        
        # Make prediction
        predictions = self.model.predict(transformed_inputs, verbose=0)
        
        # Gradient masking (if needed)
        if self.gradient_masking.enabled:
            predictions = self.gradient_masking.mask_gradients(predictions)
            defense_info['gradient_masking'] = True
        
        defense_info['confidence'] = np.max(predictions, axis=1)
        defense_info['entropy'] = -np.sum(predictions * np.log(predictions + 1e-8), axis=1)
        
        return predictions, defense_info

class InputTransformations:
    """Input transformation defenses"""
    
    def __init__(self):
        self.transformations = [
            self._gaussian_blur,
            self._median_filter,
            self._bit_depth_reduction,
            self._jpeg_compression,
            self._random_resizing
        ]
    
    def apply_random_transformation(self, inputs: np.ndarray) -> np.ndarray:
        """Apply random transformation"""
        transformation = np.random.choice(self.transformations)
        return transformation(inputs)
    
    def _gaussian_blur(self, inputs: np.ndarray) -> np.ndarray:
        """Apply Gaussian blur"""
        # Simplified implementation
        from scipy import ndimage
        blurred = np.zeros_like(inputs)
        for i in range(len(inputs)):
            blurred[i] = ndimage.gaussian_filter(inputs[i], sigma=0.5)
        return blurred
    
    def _median_filter(self, inputs: np.ndarray) -> np.ndarray:
        """Apply median filter"""
        from scipy import ndimage
        filtered = np.zeros_like(inputs)
        for i in range(len(inputs)):
            filtered[i] = ndimage.median_filter(inputs[i], size=3)
        return filtered
    
    def _bit_depth_reduction(self, inputs: np.ndarray) -> np.ndarray:
        """Reduce bit depth"""
        # Reduce to 4 bits and back to 8 bits
        reduced = np.round(inputs * 15) / 15
        return reduced
    
    def _jpeg_compression(self, inputs: np.ndarray) -> np.ndarray:
        """Simulate JPEG compression"""
        # Simplified - just add slight noise
        noise = np.random.normal(0, 0.01, inputs.shape)
        return np.clip(inputs + noise, 0, 1)
    
    def _random_resizing(self, inputs: np.ndarray) -> np.ndarray:
        """Random resize and back"""
        # Simplified - return with slight modification
        return inputs * (1 + np.random.normal(0, 0.005, inputs.shape))

class AdversarialTraining:
    """Adversarial training implementation"""
    
    def __init__(self, model: keras.Model):
        self.model = model
        self.epsilon = 0.1
        self.alpha = 0.01
        self.num_steps = 10
    
    def generate_adversarial_examples(self, inputs: np.ndarray, labels: np.ndarray) -> np.ndarray:
        """Generate adversarial examples using PGD"""
        inputs_tensor = tf.Variable(inputs, dtype=tf.float32)
        labels_tensor = tf.constant(labels, dtype=tf.float32)
        
        # Initialize perturbation
        perturbation = tf.random.uniform(inputs.shape, -self.epsilon, self.epsilon)
        
        for _ in range(self.num_steps):
            with tf.GradientTape() as tape:
                tape.watch(inputs_tensor)
                adv_inputs = inputs_tensor + perturbation
                adv_inputs = tf.clip_by_value(adv_inputs, 0, 1)
                
                predictions = self.model(adv_inputs)
                loss = tf.keras.losses.categorical_crossentropy(labels_tensor, predictions)
            
            gradients = tape.gradient(loss, inputs_tensor)
            perturbation = perturbation + self.alpha * tf.sign(gradients)
            perturbation = tf.clip_by_value(perturbation, -self.epsilon, self.epsilon)
        
        adversarial_inputs = inputs_tensor + perturbation
        adversarial_inputs = tf.clip_by_value(adversarial_inputs, 0, 1)
        
        return adversarial_inputs.numpy()
    
    def adversarial_training_step(self, inputs: np.ndarray, labels: np.ndarray) -> Dict[str, float]:
        """Perform one step of adversarial training"""
        # Generate adversarial examples
        adv_inputs = self.generate_adversarial_examples(inputs, labels)
        
        # Mix clean and adversarial examples
        mixed_inputs = np.concatenate([inputs, adv_inputs])
        mixed_labels = np.concatenate([labels, labels])
        
        # Train on mixed batch
        history = self.model.fit(mixed_inputs, mixed_labels, epochs=1, verbose=0)
        
        return {'loss': history.history['loss'][0]}

class GradientMasking:
    """Gradient masking defense"""
    
    def __init__(self, model: keras.Model):
        self.model = model
        self.enabled = False
        self.noise_scale = 0.01
    
    def mask_gradients(self, predictions: np.ndarray) -> np.ndarray:
        """Apply gradient masking"""
        if not self.enabled:
            return predictions
        
        # Add noise to predictions to mask gradients
        noise = np.random.normal(0, self.noise_scale, predictions.shape)
        masked_predictions = predictions + noise
        
        # Renormalize
        masked_predictions = np.clip(masked_predictions, 0, 1)
        masked_predictions = masked_predictions / np.sum(masked_predictions, axis=1, keepdims=True)
        
        return masked_predictions

class PoisoningDetector:
    """Detects data poisoning attacks"""
    
    def __init__(self):
        self.baseline_performance = None
        self.performance_threshold = 0.05  # 5% performance drop threshold
        self.anomaly_detector = IsolationForest(contamination=0.1)
        
    def detect_poisoning(self, training_data: np.ndarray, labels: np.ndarray, 
                        model_performance: float) -> Tuple[bool, Dict[str, Any]]:
        """Detect potential poisoning in training data"""
        detection_results = {}
        is_poisoned = False
        
        # Performance-based detection
        if self.baseline_performance is not None:
            performance_drop = self.baseline_performance - model_performance
            detection_results['performance_drop'] = performance_drop
            
            if performance_drop > self.performance_threshold:
                is_poisoned = True
                detection_results['performance_anomaly'] = True
        
        # Statistical analysis of training data
        data_stats = self._analyze_data_statistics(training_data, labels)
        detection_results.update(data_stats)
        
        # Outlier detection
        outlier_indices = self._detect_outliers(training_data)
        detection_results['outlier_count'] = len(outlier_indices)
        detection_results['outlier_percentage'] = len(outlier_indices) / len(training_data)
        
        if detection_results['outlier_percentage'] > 0.1:  # More than 10% outliers
            is_poisoned = True
            detection_results['outlier_anomaly'] = True
        
        return is_poisoned, detection_results
    
    def _analyze_data_statistics(self, data: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
        """Analyze statistical properties of training data"""
        stats = {}
        
        # Class distribution analysis
        unique_labels, counts = np.unique(labels.argmax(axis=1), return_counts=True)
        class_distribution = dict(zip(unique_labels, counts))
        stats['class_distribution'] = class_distribution
        
        # Check for class imbalance
        min_class_size = min(counts)
        max_class_size = max(counts)
        imbalance_ratio = max_class_size / min_class_size
        stats['class_imbalance_ratio'] = imbalance_ratio
        
        # Feature statistics
        stats['data_mean'] = np.mean(data, axis=0).tolist()
        stats['data_std'] = np.std(data, axis=0).tolist()
        stats['data_min'] = np.min(data, axis=0).tolist()
        stats['data_max'] = np.max(data, axis=0).tolist()
        
        return stats
    
    def _detect_outliers(self, data: np.ndarray) -> List[int]:
        """Detect outliers in training data"""
        # Reshape data for anomaly detection
        reshaped_data = data.reshape(len(data), -1)
        
        # Fit anomaly detector
        self.anomaly_detector.fit(reshaped_data)
        
        # Detect outliers
        outlier_predictions = self.anomaly_detector.predict(reshaped_data)
        outlier_indices = np.where(outlier_predictions == -1)[0]
        
        return outlier_indices.tolist()

class AdversarialResilienceSystem:
    """Main adversarial resilience system"""
    
    def __init__(self, model: keras.Model, input_shape: Tuple[int, ...], 
                 db_path: str = './data/adversarial_resilience.db'):
        self.model = model
        self.input_shape = input_shape
        self.db_path = db_path
        
        # Initialize components
        self.detector = AdversarialDetector(model, input_shape)
        self.defense = AdversarialDefense(model, input_shape)
        self.poisoning_detector = PoisoningDetector()
        
        # Attack tracking
        self.detected_attacks = []
        self.defense_metrics = []
        
        # System state
        self.system_active = True
        self.adaptive_threshold = 0.5
        
        # Initialize database
        self._init_database()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('AdversarialResilienceSystem')
    
    def _init_database(self):
        """Initialize adversarial resilience database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Adversarial attacks table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS adversarial_attacks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        attack_id TEXT UNIQUE NOT NULL,
                        timestamp TEXT NOT NULL,
                        attack_type TEXT,
                        target_model TEXT,
                        perturbation_norm REAL,
                        confidence_drop REAL,
                        detection_method TEXT,
                        detection_confidence REAL,
                        mitigation_applied TEXT,
                        success_probability REAL,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Defense metrics table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS defense_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        attacks_detected INTEGER,
                        attacks_blocked INTEGER,
                        false_positives INTEGER,
                        detection_accuracy REAL,
                        robustness_score REAL,
                        model_confidence_avg REAL,
                        perturbation_budget_used REAL,
                        defense_overhead REAL,
                        adaptive_threshold REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                self.logger.info("Adversarial resilience database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def process_input(self, input_sample: np.ndarray, apply_defense: bool = True) -> Dict[str, Any]:
        """Process input through adversarial resilience pipeline"""
        try:
            start_time = time.time()
            
            # Detect adversarial examples
            is_adversarial, detection_scores = self.detector.detect_adversarial(input_sample)
            
            result = {
                'is_adversarial': is_adversarial,
                'detection_scores': detection_scores,
                'processing_time': 0,
                'defense_applied': False,
                'final_prediction': None,
                'confidence': 0.0
            }
            
            if is_adversarial:
                # Create attack record
                attack = AdversarialAttack(
                    attack_id=f"adv_{int(time.time())}_{hashlib.md5(input_sample.tobytes()).hexdigest()[:8]}",
                    timestamp=datetime.now().isoformat(),
                    attack_type='unknown',  # Would be classified based on characteristics
                    target_model='ids_model',
                    original_input=input_sample,  # In practice, this might not be available
                    adversarial_input=input_sample,
                    perturbation=np.zeros_like(input_sample),  # Unknown perturbation
                    perturbation_norm=0.0,
                    confidence_drop=detection_scores.get('confidence_anomaly', 0.0),
                    detection_method='multi_method',
                    detection_confidence=detection_scores.get('detection_confidence', 0.0),
                    mitigation_applied='input_transformation' if apply_defense else 'none',
                    success_probability=1.0 - detection_scores.get('detection_confidence', 0.0),
                    metadata={'detection_scores': detection_scores}
                )
                
                self.detected_attacks.append(attack)
                self._store_attack(attack)
                
                self.logger.warning(f"Adversarial attack detected: {attack.attack_id}")
            
            # Apply defenses if needed
            if apply_defense:
                predictions, defense_info = self.defense.adversarial_prediction(input_sample.reshape(1, *self.input_shape))
                result['defense_applied'] = True
                result['defense_info'] = defense_info
                result['final_prediction'] = predictions[0]
                result['confidence'] = np.max(predictions[0])
            else:
                predictions = self.model.predict(input_sample.reshape(1, *self.input_shape), verbose=0)
                result['final_prediction'] = predictions[0]
                result['confidence'] = np.max(predictions[0])
            
            result['processing_time'] = time.time() - start_time
            
            # Update metrics
            self._update_defense_metrics(is_adversarial, apply_defense, result['processing_time'])
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error processing input: {e}")
            return {'error': str(e)}
    
    def _store_attack(self, attack: AdversarialAttack):
        """Store detected attack in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO adversarial_attacks (
                        attack_id, timestamp, attack_type, target_model,
                        perturbation_norm, confidence_drop, detection_method,
                        detection_confidence, mitigation_applied, success_probability, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    attack.attack_id, attack.timestamp, attack.attack_type,
                    attack.target_model, attack.perturbation_norm, attack.confidence_drop,
                    attack.detection_method, attack.detection_confidence,
                    attack.mitigation_applied, attack.success_probability,
                    json.dumps(attack.metadata)
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing attack: {e}")
    
    def _update_defense_metrics(self, attack_detected: bool, defense_applied: bool, processing_time: float):
        """Update defense performance metrics"""
        # Simple running statistics
        current_time = datetime.now().isoformat()
        
        metrics = DefenseMetrics(
            timestamp=current_time,
            attacks_detected=1 if attack_detected else 0,
            attacks_blocked=1 if attack_detected and defense_applied else 0,
            false_positives=0,  # Would need ground truth to calculate
            detection_accuracy=1.0 if attack_detected else 0.0,  # Simplified
            robustness_score=0.8,  # Would be calculated based on testing
            model_confidence_avg=0.0,  # Would be running average
            perturbation_budget_used=0.1,  # Simulated
            defense_overhead=processing_time,
            adaptive_threshold=self.adaptive_threshold
        )
        
        self.defense_metrics.append(metrics)
        self._store_defense_metrics(metrics)
    
    def _store_defense_metrics(self, metrics: DefenseMetrics):
        """Store defense metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO defense_metrics (
                        timestamp, attacks_detected, attacks_blocked, false_positives,
                        detection_accuracy, robustness_score, model_confidence_avg,
                        perturbation_budget_used, defense_overhead, adaptive_threshold
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.timestamp, metrics.attacks_detected, metrics.attacks_blocked,
                    metrics.false_positives, metrics.detection_accuracy, metrics.robustness_score,
                    metrics.model_confidence_avg, metrics.perturbation_budget_used,
                    metrics.defense_overhead, metrics.adaptive_threshold
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing defense metrics: {e}")
    
    def calibrate_system(self, clean_data: np.ndarray):
        """Calibrate the adversarial detection system"""
        self.logger.info("Calibrating adversarial resilience system...")
        self.detector.calibrate_detector(clean_data)
        self.logger.info("System calibration completed")
    
    def get_resilience_dashboard_data(self) -> Dict[str, Any]:
        """Get dashboard data for adversarial resilience"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get recent attacks by type
                cursor.execute('''
                    SELECT attack_type, COUNT(*) FROM adversarial_attacks
                    WHERE created_at > datetime('now', '-24 hours')
                    GROUP BY attack_type
                ''')
                attacks_by_type = dict(cursor.fetchall())
                
                # Get detection performance
                cursor.execute('''
                    SELECT AVG(detection_accuracy), AVG(robustness_score), AVG(defense_overhead)
                    FROM defense_metrics
                    WHERE created_at > datetime('now', '-1 hour')
                ''')
                perf_stats = cursor.fetchone()
                
                return {
                    'system_status': {
                        'active': self.system_active,
                        'detector_calibrated': self.detector.is_calibrated,
                        'defense_enabled': self.defense.defense_enabled
                    },
                    'attack_statistics': {
                        'total_attacks_detected': len(self.detected_attacks),
                        'attacks_by_type': attacks_by_type,
                        'recent_attacks': len([a for a in self.detected_attacks 
                                             if datetime.fromisoformat(a.timestamp) > 
                                             datetime.now() - timedelta(hours=1)])
                    },
                    'defense_performance': {
                        'detection_accuracy': perf_stats[0] if perf_stats[0] else 0.0,
                        'robustness_score': perf_stats[1] if perf_stats[1] else 0.0,
                        'average_overhead': perf_stats[2] if perf_stats[2] else 0.0,
                        'adaptive_threshold': self.adaptive_threshold
                    },
                    'configuration': {
                        'confidence_threshold': self.detector.confidence_threshold,
                        'transformation_probability': self.defense.transformation_probability,
                        'noise_scale': self.defense.noise_scale
                    },
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}

def main():
    """Main function for testing adversarial resilience"""
    # Create dummy model for testing
    model = keras.Sequential([
        keras.layers.Dense(64, activation='relu', input_shape=(20,)),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(10, activation='softmax')
    ])
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    # Initialize system
    system = AdversarialResilienceSystem(model, (20,))
    
    print("Adversarial Resilience System")
    print("=" * 40)
    
    # Generate clean data for calibration
    print("\n1. Calibrating system with clean data...")
    clean_data = np.random.normal(0, 1, (1000, 20))
    system.calibrate_system(clean_data)
    
    # Test with clean sample
    print("\n2. Testing with clean sample...")
    clean_sample = np.random.normal(0, 1, 20)
    result = system.process_input(clean_sample)
    print(f"Clean sample result: {result['is_adversarial']}")
    
    # Test with suspicious sample (simulated adversarial)
    print("\n3. Testing with suspicious sample...")
    adversarial_sample = np.random.normal(5, 2, 20)  # Different distribution
    result = system.process_input(adversarial_sample)
    print(f"Suspicious sample result: {result['is_adversarial']}")
    print(f"Detection confidence: {result['detection_scores'].get('detection_confidence', 0):.3f}")
    
    # Get dashboard data
    print("\n4. System Status:")
    dashboard_data = system.get_resilience_dashboard_data()
    print(json.dumps(dashboard_data, indent=2))

if __name__ == "__main__":
    main()