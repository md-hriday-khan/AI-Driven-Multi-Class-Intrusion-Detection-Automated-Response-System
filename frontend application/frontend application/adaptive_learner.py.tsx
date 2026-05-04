#!/usr/bin/env python3
"""
Adaptive Learning System for SHIELD SOC
Implements online learning, active learning, and continuous model improvement
"""

import numpy as np
import pandas as pd
import json
import time
import logging
import threading
import queue
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
import joblib
import hashlib
import os

@dataclass
class LearningMetrics:
    """Metrics for adaptive learning performance"""
    timestamp: str
    model_version: str
    samples_processed: int
    active_learning_queries: int
    model_updates: int
    performance_improvement: float
    uncertainty_reduction: float
    feedback_accuracy: float

@dataclass
class UncertainSample:
    """Sample flagged for human review"""
    sample_id: str
    timestamp: str
    features: List[float]
    prediction: int
    confidence: float
    uncertainty_score: float
    model_consensus: Dict[str, float]
    human_label: Optional[int] = None
    feedback_timestamp: Optional[str] = None

@dataclass
class ModelVersion:
    """Model version tracking information"""
    version_id: str
    creation_timestamp: str
    base_model_path: str
    performance_metrics: Dict[str, float]
    training_samples: int
    validation_accuracy: float
    deployment_status: str
    rollback_available: bool

class UncertaintySampler:
    """Implements uncertainty sampling for active learning"""
    
    def __init__(self, uncertainty_threshold: float = 0.3, max_queue_size: int = 1000):
        self.uncertainty_threshold = uncertainty_threshold
        self.max_queue_size = max_queue_size
        self.uncertain_samples = deque(maxlen=max_queue_size)
        self.processed_samples = 0
        self.queried_samples = 0
        
    def evaluate_uncertainty(self, features: np.ndarray, predictions: Dict[str, float], model_consensus: Dict[str, float]) -> float:
        """Calculate uncertainty score for a sample"""
        # Entropy-based uncertainty
        probs = np.array(list(predictions.values()))
        entropy = -np.sum(probs * np.log(probs + 1e-8))
        
        # Model disagreement uncertainty
        consensus_values = list(model_consensus.values())
        disagreement = np.std(consensus_values) if len(consensus_values) > 1 else 0.0
        
        # Confidence-based uncertainty
        max_confidence = max(probs)
        confidence_uncertainty = 1.0 - max_confidence
        
        # Combined uncertainty score
        uncertainty_score = 0.4 * entropy + 0.3 * disagreement + 0.3 * confidence_uncertainty
        
        return uncertainty_score
    
    def should_query_human(self, uncertainty_score: float, prediction_confidence: float) -> bool:
        """Determine if sample should be queried for human feedback"""
        # Query if uncertainty is high and confidence is low
        return (uncertainty_score > self.uncertainty_threshold and 
                prediction_confidence < 0.7 and 
                len(self.uncertain_samples) < self.max_queue_size)
    
    def add_uncertain_sample(self, sample: UncertainSample):
        """Add sample to uncertain samples queue"""
        self.uncertain_samples.append(sample)
        self.queried_samples += 1
        
        logging.info(f"Added uncertain sample {sample.sample_id} (uncertainty: {sample.uncertainty_score:.3f})")
    
    def get_samples_for_review(self, limit: int = 10) -> List[UncertainSample]:
        """Get samples that need human review"""
        # Sort by uncertainty score (highest first)
        sorted_samples = sorted(self.uncertain_samples, 
                               key=lambda x: x.uncertainty_score, 
                               reverse=True)
        
        # Return unlabeled samples
        unlabeled = [s for s in sorted_samples if s.human_label is None]
        return unlabeled[:limit]

class IncrementalModelUpdater:
    """Handles incremental model updates and online learning"""
    
    def __init__(self, base_model_path: str, update_threshold: int = 100):
        self.base_model_path = base_model_path
        self.update_threshold = update_threshold
        self.model = None
        self.model_version = "v1.0.0"
        
        # Training data buffers
        self.training_features = deque(maxlen=10000)
        self.training_labels = deque(maxlen=10000)
        self.validation_features = deque(maxlen=1000)
        self.validation_labels = deque(maxlen=1000)
        
        # Update tracking
        self.samples_since_update = 0
        self.update_count = 0
        self.performance_history = deque(maxlen=100)
        
        # Load initial model
        self._load_model()
    
    def _load_model(self):
        """Load the base model"""
        try:
            if os.path.exists(self.base_model_path):
                self.model = keras.models.load_model(self.base_model_path)
                logging.info(f"Loaded model from {self.base_model_path}")
            else:
                logging.warning(f"Model file not found: {self.base_model_path}")
                self._create_dummy_model()
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            self._create_dummy_model()
    
    def _create_dummy_model(self):
        """Create a dummy model for testing"""
        self.model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(20,)),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')
        ])
        
        self.model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        logging.info("Created dummy model for testing")
    
    def add_training_sample(self, features: np.ndarray, label: int, validation: bool = False):
        """Add a new training sample"""
        if validation:
            self.validation_features.append(features.flatten())
            self.validation_labels.append(label)
        else:
            self.training_features.append(features.flatten())
            self.training_labels.append(label)
            self.samples_since_update += 1
        
        # Check if update is needed
        if self.samples_since_update >= self.update_threshold:
            self._trigger_incremental_update()
    
    def _trigger_incremental_update(self):
        """Trigger incremental model update"""
        if len(self.training_features) < 50:  # Need minimum samples
            return
        
        try:
            logging.info(f"Starting incremental update #{self.update_count + 1}")
            
            # Prepare training data
            X_train = np.array(list(self.training_features))
            y_train = np.array(list(self.training_labels))
            
            # Validate data
            if len(np.unique(y_train)) < 2:
                logging.warning("Insufficient class diversity for training")
                return
            
            # Incremental training
            self._perform_incremental_training(X_train, y_train)
            
            # Evaluate performance
            self._evaluate_updated_model()
            
            # Update version
            self.update_count += 1
            self.model_version = f"v1.{self.update_count}.0"
            self.samples_since_update = 0
            
            logging.info(f"Incremental update completed. New version: {self.model_version}")
            
        except Exception as e:
            logging.error(f"Error in incremental update: {e}")
    
    def _perform_incremental_training(self, X_train: np.ndarray, y_train: np.ndarray):
        """Perform incremental training on the model"""
        # Use a small learning rate for incremental updates
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        # Train for a few epochs with new data
        history = self.model.fit(
            X_train, y_train,
            epochs=5,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        
        # Store performance
        final_accuracy = history.history['accuracy'][-1]
        self.performance_history.append(final_accuracy)
    
    def _evaluate_updated_model(self):
        """Evaluate the updated model performance"""
        if len(self.validation_features) < 10:
            return
        
        X_val = np.array(list(self.validation_features))
        y_val = np.array(list(self.validation_labels))
        
        # Make predictions
        predictions = self.model.predict(X_val, verbose=0)
        y_pred = (predictions > 0.5).astype(int).flatten()
        
        # Calculate metrics
        accuracy = accuracy_score(y_val, y_pred)
        precision = precision_score(y_val, y_pred, zero_division=0)
        recall = recall_score(y_val, y_pred, zero_division=0)
        
        logging.info(f"Updated model performance - Accuracy: {accuracy:.3f}, Precision: {precision:.3f}, Recall: {recall:.3f}")
    
    def get_model_performance(self) -> Dict[str, float]:
        """Get current model performance metrics"""
        if not self.performance_history:
            return {}
        
        return {
            'current_accuracy': self.performance_history[-1] if self.performance_history else 0.0,
            'avg_accuracy': np.mean(self.performance_history) if self.performance_history else 0.0,
            'performance_trend': self._calculate_performance_trend(),
            'samples_processed': len(self.training_features),
            'updates_performed': self.update_count
        }
    
    def _calculate_performance_trend(self) -> float:
        """Calculate performance trend (positive = improving)"""
        if len(self.performance_history) < 5:
            return 0.0
        
        recent = np.mean(list(self.performance_history)[-5:])
        older = np.mean(list(self.performance_history)[-10:-5]) if len(self.performance_history) >= 10 else recent
        
        return recent - older

class FeedbackProcessor:
    """Processes human feedback and integrates it into the learning system"""
    
    def __init__(self, db_path: str = './data/feedback.db'):
        self.db_path = db_path
        self.feedback_queue = queue.Queue()
        self.processing_thread = None
        self.processing_active = False
        
        # Feedback statistics
        self.total_feedback = 0
        self.correct_feedback = 0
        self.incorrect_feedback = 0
        self.feedback_accuracy = 0.0
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize feedback database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS human_feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sample_id TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        original_prediction INTEGER,
                        human_label INTEGER,
                        confidence REAL,
                        uncertainty_score REAL,
                        feedback_quality TEXT,
                        model_version TEXT
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS feedback_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        total_feedback INTEGER,
                        feedback_accuracy REAL,
                        model_improvement REAL
                    )
                ''')
                
                conn.commit()
                logging.info("Feedback database initialized")
                
        except Exception as e:
            logging.error(f"Error initializing feedback database: {e}")
    
    def add_feedback(self, sample: UncertainSample, human_label: int, feedback_quality: str = 'good'):
        """Add human feedback for a sample"""
        # Update sample with feedback
        sample.human_label = human_label
        sample.feedback_timestamp = datetime.now().isoformat()
        
        # Queue for processing
        self.feedback_queue.put((sample, feedback_quality))
        
        # Update statistics
        self.total_feedback += 1
        if human_label == sample.prediction:
            self.correct_feedback += 1
        else:
            self.incorrect_feedback += 1
        
        self.feedback_accuracy = self.correct_feedback / self.total_feedback if self.total_feedback > 0 else 0.0
        
        logging.info(f"Received feedback for sample {sample.sample_id}: predicted={sample.prediction}, actual={human_label}")
    
    def start_processing(self):
        """Start feedback processing thread"""
        if self.processing_active:
            return
        
        self.processing_active = True
        self.processing_thread = threading.Thread(target=self._process_feedback_loop, daemon=True)
        self.processing_thread.start()
        
        logging.info("Feedback processing started")
    
    def stop_processing(self):
        """Stop feedback processing"""
        self.processing_active = False
    
    def _process_feedback_loop(self):
        """Main feedback processing loop"""
        while self.processing_active:
            try:
                # Get feedback from queue
                sample, quality = self.feedback_queue.get(timeout=1)
                
                # Store in database
                self._store_feedback(sample, quality)
                
                # Process feedback for learning
                self._process_feedback_for_learning(sample)
                
            except queue.Empty:
                continue
            except Exception as e:
                logging.error(f"Error processing feedback: {e}")
    
    def _store_feedback(self, sample: UncertainSample, quality: str):
        """Store feedback in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO human_feedback (
                        sample_id, timestamp, original_prediction, human_label,
                        confidence, uncertainty_score, feedback_quality, model_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    sample.sample_id,
                    sample.feedback_timestamp,
                    sample.prediction,
                    sample.human_label,
                    sample.confidence,
                    sample.uncertainty_score,
                    quality,
                    'current'  # Model version would be tracked
                ))
                
                conn.commit()
                
        except Exception as e:
            logging.error(f"Error storing feedback: {e}")
    
    def _process_feedback_for_learning(self, sample: UncertainSample):
        """Process feedback for adaptive learning"""
        # This would trigger model updates based on feedback
        # For now, we'll just log the feedback
        
        if sample.human_label != sample.prediction:
            logging.info(f"Correction received: {sample.sample_id} should be {sample.human_label}, not {sample.prediction}")
            
            # In a real implementation, this would:
            # 1. Add the corrected sample to training data
            # 2. Trigger model update if needed
            # 3. Adjust prediction thresholds
            # 4. Update uncertainty estimation
    
    def get_feedback_statistics(self) -> Dict[str, Any]:
        """Get feedback processing statistics"""
        return {
            'total_feedback': self.total_feedback,
            'correct_predictions': self.correct_feedback,
            'incorrect_predictions': self.incorrect_feedback,
            'feedback_accuracy': self.feedback_accuracy,
            'improvement_potential': self.incorrect_feedback / max(self.total_feedback, 1)
        }

class EnsembleModelManager:
    """Manages multiple model versions and ensemble predictions"""
    
    def __init__(self, models_dir: str = './models'):
        self.models_dir = models_dir
        self.active_models = {}
        self.model_versions = []
        self.current_primary = None
        self.ensemble_weights = {}
        
        # A/B testing
        self.ab_test_active = False
        self.ab_test_split = 0.5
        self.ab_test_metrics = {'model_a': defaultdict(list), 'model_b': defaultdict(list)}
        
        # Ensure models directory exists
        os.makedirs(models_dir, exist_ok=True)
    
    def register_model_version(self, version: ModelVersion):
        """Register a new model version"""
        self.model_versions.append(version)
        
        # Load model if available
        if os.path.exists(version.base_model_path):
            try:
                model = keras.models.load_model(version.base_model_path)
                self.active_models[version.version_id] = model
                self.ensemble_weights[version.version_id] = 1.0
                
                logging.info(f"Registered model version {version.version_id}")
                
                # Set as primary if first model or better performance
                if (self.current_primary is None or 
                    version.validation_accuracy > self._get_primary_accuracy()):
                    self.current_primary = version.version_id
                    
            except Exception as e:
                logging.error(f"Error loading model {version.version_id}: {e}")
    
    def _get_primary_accuracy(self) -> float:
        """Get accuracy of current primary model"""
        if self.current_primary:
            for version in self.model_versions:
                if version.version_id == self.current_primary:
                    return version.validation_accuracy
        return 0.0
    
    def predict_ensemble(self, features: np.ndarray) -> Dict[str, Any]:
        """Make ensemble prediction using multiple models"""
        if not self.active_models:
            return {'prediction': 0, 'confidence': 0.0, 'consensus': {}}
        
        predictions = {}
        confidences = {}
        
        # Get predictions from all active models
        for version_id, model in self.active_models.items():
            try:
                pred_prob = model.predict(features.reshape(1, -1), verbose=0)[0][0]
                prediction = 1 if pred_prob > 0.5 else 0
                
                predictions[version_id] = prediction
                confidences[version_id] = pred_prob
                
            except Exception as e:
                logging.warning(f"Error getting prediction from model {version_id}: {e}")
        
        if not predictions:
            return {'prediction': 0, 'confidence': 0.0, 'consensus': {}}
        
        # Weighted ensemble prediction
        weighted_sum = sum(confidences[vid] * self.ensemble_weights.get(vid, 1.0) 
                          for vid in confidences.keys())
        total_weight = sum(self.ensemble_weights.get(vid, 1.0) 
                          for vid in confidences.keys())
        
        ensemble_confidence = weighted_sum / total_weight if total_weight > 0 else 0.0
        ensemble_prediction = 1 if ensemble_confidence > 0.5 else 0
        
        return {
            'prediction': ensemble_prediction,
            'confidence': ensemble_confidence,
            'consensus': confidences,
            'individual_predictions': predictions
        }
    
    def start_ab_test(self, model_a_id: str, model_b_id: str, split_ratio: float = 0.5):
        """Start A/B test between two models"""
        if model_a_id not in self.active_models or model_b_id not in self.active_models:
            logging.error("Both models must be active to start A/B test")
            return
        
        self.ab_test_active = True
        self.ab_test_split = split_ratio
        self.ab_test_models = {'a': model_a_id, 'b': model_b_id}
        self.ab_test_metrics = {'model_a': defaultdict(list), 'model_b': defaultdict(list)}
        
        logging.info(f"Started A/B test: {model_a_id} vs {model_b_id} (split: {split_ratio})")
    
    def predict_ab_test(self, features: np.ndarray, sample_id: str) -> Dict[str, Any]:
        """Make prediction during A/B test"""
        if not self.ab_test_active:
            return self.predict_ensemble(features)
        
        # Determine which model to use based on sample ID hash
        hash_value = int(hashlib.md5(sample_id.encode()).hexdigest(), 16)
        use_model_a = (hash_value % 100) < (self.ab_test_split * 100)
        
        model_key = 'a' if use_model_a else 'b'
        model_id = self.ab_test_models[model_key]
        model = self.active_models[model_id]
        
        try:
            pred_prob = model.predict(features.reshape(1, -1), verbose=0)[0][0]
            prediction = 1 if pred_prob > 0.5 else 0
            
            result = {
                'prediction': prediction,
                'confidence': pred_prob,
                'model_used': model_id,
                'ab_group': model_key
            }
            
            # Track for A/B test analysis
            self.ab_test_metrics[f'model_{model_key}']['predictions'].append(prediction)
            self.ab_test_metrics[f'model_{model_key}']['confidences'].append(pred_prob)
            
            return result
            
        except Exception as e:
            logging.error(f"Error in A/B test prediction: {e}")
            return {'prediction': 0, 'confidence': 0.0, 'model_used': model_id, 'ab_group': model_key}
    
    def get_ab_test_results(self) -> Dict[str, Any]:
        """Get A/B test performance comparison"""
        if not self.ab_test_active:
            return {}
        
        results = {}
        
        for group in ['model_a', 'model_b']:
            metrics = self.ab_test_metrics[group]
            
            if metrics['predictions']:
                results[group] = {
                    'predictions_count': len(metrics['predictions']),
                    'avg_confidence': np.mean(metrics['confidences']),
                    'positive_rate': np.mean(metrics['predictions']),
                    'model_id': self.ab_test_models[group.split('_')[1]]
                }
        
        return results
    
    def rollback_to_version(self, version_id: str):
        """Rollback to a specific model version"""
        if version_id not in self.active_models:
            logging.error(f"Model version {version_id} not available for rollback")
            return False
        
        self.current_primary = version_id
        logging.info(f"Rolled back to model version {version_id}")
        return True

class AdaptiveLearner:
    """Main adaptive learning system coordinator"""
    
    def __init__(self, 
                 base_model_path: str,
                 db_path: str = './data/adaptive_learning.db',
                 websocket_url: str = 'ws://localhost:8080'):
        
        self.base_model_path = base_model_path
        self.db_path = db_path
        self.websocket_url = websocket_url
        
        # Initialize components
        self.uncertainty_sampler = UncertaintySampler()
        self.model_updater = IncrementalModelUpdater(base_model_path)
        self.feedback_processor = FeedbackProcessor()
        self.ensemble_manager = EnsembleModelManager()
        
        # Learning state
        self.learning_active = False
        self.learning_thread = None
        
        # Metrics
        self.learning_metrics = LearningMetrics(
            timestamp=datetime.now().isoformat(),
            model_version="v1.0.0",
            samples_processed=0,
            active_learning_queries=0,
            model_updates=0,
            performance_improvement=0.0,
            uncertainty_reduction=0.0,
            feedback_accuracy=0.0
        )
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('AdaptiveLearner')
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize adaptive learning database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS learning_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        model_version TEXT,
                        samples_processed INTEGER,
                        active_learning_queries INTEGER,
                        model_updates INTEGER,
                        performance_improvement REAL,
                        uncertainty_reduction REAL,
                        feedback_accuracy REAL
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS uncertain_samples (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sample_id TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        features TEXT,
                        prediction INTEGER,
                        confidence REAL,
                        uncertainty_score REAL,
                        human_label INTEGER,
                        status TEXT
                    )
                ''')
                
                conn.commit()
                self.logger.info("Adaptive learning database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def start_adaptive_learning(self):
        """Start the adaptive learning process"""
        if self.learning_active:
            self.logger.warning("Adaptive learning already active")
            return
        
        self.learning_active = True
        self.learning_thread = threading.Thread(target=self._learning_loop, daemon=True)
        self.learning_thread.start()
        
        # Start feedback processing
        self.feedback_processor.start_processing()
        
        self.logger.info("Adaptive learning started")
    
    def stop_adaptive_learning(self):
        """Stop adaptive learning process"""
        self.learning_active = False
        self.feedback_processor.stop_processing()
        self.logger.info("Adaptive learning stopped")
    
    def _learning_loop(self):
        """Main adaptive learning loop"""
        while self.learning_active:
            try:
                # Process uncertain samples
                self._process_uncertain_samples()
                
                # Update learning metrics
                self._update_learning_metrics()
                
                # Check for model update triggers
                self._check_update_triggers()
                
                # Sleep before next iteration
                time.sleep(30)  # Process every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error in learning loop: {e}")
                time.sleep(5)
    
    def process_prediction(self, features: np.ndarray, sample_id: str) -> Dict[str, Any]:
        """Process a new prediction and determine if active learning is needed"""
        try:
            # Get ensemble prediction
            ensemble_result = self.ensemble_manager.predict_ensemble(features)
            
            # Calculate uncertainty
            uncertainty_score = self.uncertainty_sampler.evaluate_uncertainty(
                features,
                {'prediction': ensemble_result['confidence']},
                ensemble_result['consensus']
            )
            
            # Check if human feedback is needed
            if self.uncertainty_sampler.should_query_human(
                uncertainty_score, 
                ensemble_result['confidence']
            ):
                
                # Create uncertain sample
                uncertain_sample = UncertainSample(
                    sample_id=sample_id,
                    timestamp=datetime.now().isoformat(),
                    features=features.flatten().tolist(),
                    prediction=ensemble_result['prediction'],
                    confidence=ensemble_result['confidence'],
                    uncertainty_score=uncertainty_score,
                    model_consensus=ensemble_result['consensus']
                )
                
                # Add to queue for human review
                self.uncertainty_sampler.add_uncertain_sample(uncertain_sample)
                self._store_uncertain_sample(uncertain_sample)
                
                self.learning_metrics.active_learning_queries += 1
            
            # Update samples processed
            self.learning_metrics.samples_processed += 1
            
            return {
                **ensemble_result,
                'uncertainty_score': uncertainty_score,
                'needs_human_review': uncertainty_score > self.uncertainty_sampler.uncertainty_threshold
            }
            
        except Exception as e:
            self.logger.error(f"Error processing prediction: {e}")
            return {'prediction': 0, 'confidence': 0.0, 'uncertainty_score': 0.0}
    
    def _store_uncertain_sample(self, sample: UncertainSample):
        """Store uncertain sample in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO uncertain_samples (
                        sample_id, timestamp, features, prediction, confidence,
                        uncertainty_score, human_label, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    sample.sample_id,
                    sample.timestamp,
                    json.dumps(sample.features),
                    sample.prediction,
                    sample.confidence,
                    sample.uncertainty_score,
                    sample.human_label,
                    'pending_review'
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing uncertain sample: {e}")
    
    def provide_human_feedback(self, sample_id: str, human_label: int) -> bool:
        """Provide human feedback for an uncertain sample"""
        try:
            # Find the sample in the uncertain samples queue
            for sample in self.uncertainty_sampler.uncertain_samples:
                if sample.sample_id == sample_id:
                    # Add feedback
                    self.feedback_processor.add_feedback(sample, human_label, 'manual')
                    
                    # Add to model training data
                    features = np.array(sample.features)
                    self.model_updater.add_training_sample(features, human_label)
                    
                    # Update database
                    self._update_sample_feedback(sample_id, human_label)
                    
                    self.logger.info(f"Human feedback processed for sample {sample_id}: {human_label}")
                    return True
            
            self.logger.warning(f"Sample {sample_id} not found in uncertain samples")
            return False
            
        except Exception as e:
            self.logger.error(f"Error processing human feedback: {e}")
            return False
    
    def _update_sample_feedback(self, sample_id: str, human_label: int):
        """Update sample with human feedback in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE uncertain_samples 
                    SET human_label = ?, status = 'reviewed'
                    WHERE sample_id = ?
                ''', (human_label, sample_id))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error updating sample feedback: {e}")
    
    def _process_uncertain_samples(self):
        """Process uncertain samples queue"""
        # Get samples needing review
        samples_for_review = self.uncertainty_sampler.get_samples_for_review(10)
        
        if samples_for_review:
            self.logger.info(f"{len(samples_for_review)} samples awaiting human review")
    
    def _update_learning_metrics(self):
        """Update adaptive learning metrics"""
        # Get performance metrics
        model_performance = self.model_updater.get_model_performance()
        feedback_stats = self.feedback_processor.get_feedback_statistics()
        
        # Update metrics
        self.learning_metrics.timestamp = datetime.now().isoformat()
        self.learning_metrics.model_version = self.model_updater.model_version
        self.learning_metrics.model_updates = self.model_updater.update_count
        self.learning_metrics.performance_improvement = model_performance.get('performance_trend', 0.0)
        self.learning_metrics.feedback_accuracy = feedback_stats.get('feedback_accuracy', 0.0)
        
        # Store in database
        self._store_learning_metrics()
    
    def _store_learning_metrics(self):
        """Store learning metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO learning_metrics (
                        timestamp, model_version, samples_processed,
                        active_learning_queries, model_updates, performance_improvement,
                        uncertainty_reduction, feedback_accuracy
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    self.learning_metrics.timestamp,
                    self.learning_metrics.model_version,
                    self.learning_metrics.samples_processed,
                    self.learning_metrics.active_learning_queries,
                    self.learning_metrics.model_updates,
                    self.learning_metrics.performance_improvement,
                    self.learning_metrics.uncertainty_reduction,
                    self.learning_metrics.feedback_accuracy
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing learning metrics: {e}")
    
    def _check_update_triggers(self):
        """Check if model update should be triggered"""
        model_performance = self.model_updater.get_model_performance()
        
        # Trigger update if performance is declining
        if model_performance.get('performance_trend', 0) < -0.05:
            self.logger.warning("Performance decline detected, considering model update")
    
    def get_learning_dashboard_data(self) -> Dict[str, Any]:
        """Get data for adaptive learning dashboard"""
        try:
            # Get samples for review
            samples_for_review = self.uncertainty_sampler.get_samples_for_review(20)
            
            # Get model performance
            model_performance = self.model_updater.get_model_performance()
            
            # Get feedback statistics
            feedback_stats = self.feedback_processor.get_feedback_statistics()
            
            return {
                'learning_metrics': asdict(self.learning_metrics),
                'samples_for_review': [asdict(s) for s in samples_for_review],
                'model_performance': model_performance,
                'feedback_statistics': feedback_stats,
                'uncertain_samples_count': len(self.uncertainty_sampler.uncertain_samples),
                'learning_status': 'active' if self.learning_active else 'inactive'
            }
            
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}

def main():
    """Main function for testing adaptive learning"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Adaptive Learning System')
    parser.add_argument('--model-path', default='./models/best_lstm_ids_deep.h5', help='Base model path')
    parser.add_argument('--db-path', default='./data/adaptive_learning.db', help='Database path')
    parser.add_argument('--duration', type=int, default=0, help='Run duration in seconds (0 = infinite)')
    
    args = parser.parse_args()
    
    # Create adaptive learner
    learner = AdaptiveLearner(
        base_model_path=args.model_path,
        db_path=args.db_path
    )
    
    try:
        # Start adaptive learning
        learner.start_adaptive_learning()
        
        if args.duration > 0:
            time.sleep(args.duration)
        else:
            # Interactive mode
            while True:
                command = input("\nEnter command (status/feedback/exit): ").strip().lower()
                
                if command == 'exit':
                    break
                elif command == 'status':
                    dashboard_data = learner.get_learning_dashboard_data()
                    print(f"\n--- Adaptive Learning Status ---")
                    print(f"Samples Processed: {dashboard_data.get('learning_metrics', {}).get('samples_processed', 0)}")
                    print(f"Active Learning Queries: {dashboard_data.get('learning_metrics', {}).get('active_learning_queries', 0)}")
                    print(f"Model Updates: {dashboard_data.get('learning_metrics', {}).get('model_updates', 0)}")
                    print(f"Samples for Review: {dashboard_data.get('uncertain_samples_count', 0)}")
                elif command == 'feedback':
                    # Simulate providing feedback
                    dashboard_data = learner.get_learning_dashboard_data()
                    samples = dashboard_data.get('samples_for_review', [])
                    
                    if samples:
                        sample = samples[0]
                        sample_id = sample['sample_id']
                        predicted = sample['prediction']
                        
                        print(f"Sample {sample_id}: Predicted {predicted}, Confidence: {sample['confidence']:.3f}")
                        feedback = input(f"Correct label (0/1, or 'skip'): ").strip()
                        
                        if feedback in ['0', '1']:
                            success = learner.provide_human_feedback(sample_id, int(feedback))
                            print(f"Feedback processed: {'Success' if success else 'Failed'}")
                        else:
                            print("Skipped")
                    else:
                        print("No samples awaiting review")
                else:
                    print("Unknown command")
                    
    except KeyboardInterrupt:
        print("\nStopping adaptive learning...")
    finally:
        learner.stop_adaptive_learning()

if __name__ == "__main__":
    main()