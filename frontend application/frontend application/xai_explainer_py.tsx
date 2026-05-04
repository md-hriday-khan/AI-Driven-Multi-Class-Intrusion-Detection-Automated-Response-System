#!/usr/bin/env python3
"""
Explainable AI (XAI) Module for SHIELD SOC
Provides interpretable explanations for LSTM model predictions and attack classifications
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
import tensorflow as tf
from tensorflow import keras
import shap
import lime
from lime.lime_tabular import LimeTabularExplainer
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss
import sqlite3
import os
import warnings
warnings.filterwarnings('ignore')

@dataclass
class FeatureExplanation:
    """Explanation for individual features"""
    feature_name: str
    importance_score: float
    contribution: float
    direction: str  # 'positive', 'negative', 'neutral'
    confidence: float
    description: str

@dataclass
class AttackExplanation:
    """Complete explanation for an attack prediction"""
    sample_id: str
    timestamp: str
    prediction: int
    confidence: float
    attack_type: str
    severity: str
    key_features: List[FeatureExplanation]
    decision_rationale: str
    uncertainty_factors: List[str]
    recommended_actions: List[str]
    model_version: str

@dataclass
class ModelCalibration:
    """Model calibration metrics"""
    calibration_error: float
    brier_score: float
    reliability_bins: List[Tuple[float, float, int]]
    confidence_histogram: Dict[str, Any]
    calibration_curve_data: Dict[str, List[float]]

class SHAPExplainer:
    """SHAP-based explanations for LSTM models"""
    
    def __init__(self, model: keras.Model, background_data: np.ndarray, feature_names: List[str]):
        self.model = model
        self.background_data = background_data
        self.feature_names = feature_names
        self.explainer = None
        self.shap_values_cache = {}
        
        # Initialize SHAP explainer
        self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize SHAP explainer for LSTM model"""
        try:
            # For LSTM models, we use DeepExplainer
            self.explainer = shap.DeepExplainer(self.model, self.background_data)
            logging.info("SHAP DeepExplainer initialized successfully")
        except Exception as e:
            logging.warning(f"Failed to initialize DeepExplainer: {e}")
            try:
                # Fallback to KernelExplainer
                def model_predict(x):
                    return self.model.predict(x, verbose=0)
                
                self.explainer = shap.KernelExplainer(model_predict, self.background_data[:100])
                logging.info("SHAP KernelExplainer initialized as fallback")
            except Exception as e2:
                logging.error(f"Failed to initialize any SHAP explainer: {e2}")
                self.explainer = None
    
    def explain_prediction(self, sample: np.ndarray, sample_id: str) -> Dict[str, Any]:
        """Generate SHAP explanation for a single prediction"""
        if self.explainer is None:
            return self._fallback_explanation(sample)
        
        try:
            # Check cache first
            cache_key = f"{sample_id}_{hash(sample.tobytes())}"
            if cache_key in self.shap_values_cache:
                return self.shap_values_cache[cache_key]
            
            # Get SHAP values
            if hasattr(self.explainer, 'shap_values'):
                shap_values = self.explainer.shap_values(sample.reshape(1, -1))
                
                # Handle different SHAP output formats
                if isinstance(shap_values, list):
                    shap_values = shap_values[0]  # For binary classification
                
                shap_values = shap_values.flatten()
            else:
                # For newer SHAP versions
                explanation = self.explainer(sample.reshape(1, -1))
                shap_values = explanation.values[0].flatten()
            
            # Create feature explanations
            feature_explanations = []
            for i, (feature_name, shap_value) in enumerate(zip(self.feature_names, shap_values)):
                if i < len(self.feature_names):
                    feature_explanations.append({
                        'feature_name': feature_name,
                        'shap_value': float(shap_value),
                        'feature_value': float(sample.flatten()[i]) if i < len(sample.flatten()) else 0.0,
                        'importance_rank': 0  # Will be set later
                    })
            
            # Sort by absolute SHAP value
            feature_explanations.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            
            # Add importance ranks
            for rank, explanation in enumerate(feature_explanations):
                explanation['importance_rank'] = rank + 1
            
            result = {
                'sample_id': sample_id,
                'shap_values': shap_values.tolist(),
                'feature_explanations': feature_explanations,
                'base_value': float(getattr(self.explainer, 'expected_value', 0.0)),
                'explanation_method': 'SHAP'
            }
            
            # Cache result
            self.shap_values_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logging.error(f"Error generating SHAP explanation: {e}")
            return self._fallback_explanation(sample)
    
    def _fallback_explanation(self, sample: np.ndarray) -> Dict[str, Any]:
        """Fallback explanation when SHAP fails"""
        # Simple gradient-based explanation
        try:
            with tf.GradientTape() as tape:
                input_tensor = tf.Variable(sample.reshape(1, -1), dtype=tf.float32)
                prediction = self.model(input_tensor)
                
            gradients = tape.gradient(prediction, input_tensor)
            gradient_values = gradients.numpy().flatten()
            
            feature_explanations = []
            for i, (feature_name, grad_value) in enumerate(zip(self.feature_names, gradient_values)):
                if i < len(self.feature_names):
                    feature_explanations.append({
                        'feature_name': feature_name,
                        'shap_value': float(grad_value * sample.flatten()[i]) if i < len(sample.flatten()) else 0.0,
                        'feature_value': float(sample.flatten()[i]) if i < len(sample.flatten()) else 0.0,
                        'importance_rank': i + 1
                    })
            
            return {
                'sample_id': 'unknown',
                'shap_values': gradient_values.tolist(),
                'feature_explanations': feature_explanations,
                'base_value': 0.0,
                'explanation_method': 'Gradient'
            }
            
        except Exception as e:
            logging.error(f"Fallback explanation failed: {e}")
            return {
                'sample_id': 'unknown',
                'shap_values': [0.0] * len(self.feature_names),
                'feature_explanations': [],
                'base_value': 0.0,
                'explanation_method': 'None'
            }

class LIMEExplainer:
    """LIME-based explanations for local interpretability"""
    
    def __init__(self, model: keras.Model, training_data: np.ndarray, feature_names: List[str]):
        self.model = model
        self.training_data = training_data
        self.feature_names = feature_names
        self.explainer = None
        
        # Initialize LIME explainer
        self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize LIME tabular explainer"""
        try:
            def model_predict_proba(x):
                predictions = self.model.predict(x, verbose=0)
                # Convert to binary classification probabilities
                if predictions.shape[1] == 1:
                    proba_positive = predictions.flatten()
                    proba_negative = 1 - proba_positive
                    return np.column_stack([proba_negative, proba_positive])
                return predictions
            
            self.explainer = LimeTabularExplainer(
                training_data=self.training_data,
                feature_names=self.feature_names,
                class_names=['Normal', 'Attack'],
                mode='classification',
                discretize_continuous=True
            )
            
            self.model_predict_proba = model_predict_proba
            logging.info("LIME explainer initialized successfully")
            
        except Exception as e:
            logging.error(f"Error initializing LIME explainer: {e}")
            self.explainer = None
    
    def explain_prediction(self, sample: np.ndarray, sample_id: str, num_features: int = 10) -> Dict[str, Any]:
        """Generate LIME explanation for a single prediction"""
        if self.explainer is None:
            return {'error': 'LIME explainer not available'}
        
        try:
            # Get LIME explanation
            explanation = self.explainer.explain_instance(
                data_row=sample.flatten(),
                predict_fn=self.model_predict_proba,
                num_features=num_features,
                labels=[1]  # Explain the 'Attack' class
            )
            
            # Extract feature importance
            feature_importance = explanation.as_list(label=1)
            
            # Create structured explanation
            feature_explanations = []
            for feature_desc, importance in feature_importance:
                # Parse feature description (LIME format: "feature_name <= value")
                feature_name = feature_desc.split(' ')[0]
                
                feature_explanations.append({
                    'feature_description': feature_desc,
                    'feature_name': feature_name,
                    'importance': importance,
                    'direction': 'positive' if importance > 0 else 'negative'
                })
            
            return {
                'sample_id': sample_id,
                'feature_explanations': feature_explanations,
                'explanation_method': 'LIME',
                'local_explanation': True
            }
            
        except Exception as e:
            logging.error(f"Error generating LIME explanation: {e}")
            return {'error': f'LIME explanation failed: {str(e)}'}

class ConfidenceCalibrator:
    """Calibrates and validates model confidence scores"""
    
    def __init__(self):
        self.calibration_data = []
        self.predictions = []
        self.true_labels = []
        
    def add_prediction(self, confidence: float, prediction: int, true_label: int):
        """Add a prediction for calibration analysis"""
        self.calibration_data.append({
            'confidence': confidence,
            'prediction': prediction,
            'true_label': true_label,
            'timestamp': datetime.now().isoformat()
        })
        
        self.predictions.append(confidence)
        self.true_labels.append(true_label)
    
    def calculate_calibration_metrics(self) -> ModelCalibration:
        """Calculate calibration metrics"""
        if len(self.predictions) < 10:
            return ModelCalibration(
                calibration_error=0.0,
                brier_score=0.0,
                reliability_bins=[],
                confidence_histogram={},
                calibration_curve_data={'prob_true': [], 'prob_pred': []}
            )
        
        predictions = np.array(self.predictions)
        true_labels = np.array(self.true_labels)
        
        # Calculate Brier score
        brier_score = brier_score_loss(true_labels, predictions)
        
        # Calculate calibration curve
        try:
            prob_true, prob_pred = calibration_curve(true_labels, predictions, n_bins=10)
            
            # Calculate Expected Calibration Error (ECE)
            bin_boundaries = np.linspace(0, 1, 11)
            bin_lowers = bin_boundaries[:-1]
            bin_uppers = bin_boundaries[1:]
            
            ece = 0
            reliability_bins = []
            
            for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
                in_bin = (predictions > bin_lower) & (predictions <= bin_upper)
                prop_in_bin = in_bin.mean()
                
                if prop_in_bin > 0:
                    accuracy_in_bin = true_labels[in_bin].mean()
                    avg_confidence_in_bin = predictions[in_bin].mean()
                    
                    ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
                    
                    reliability_bins.append((
                        float(avg_confidence_in_bin),
                        float(accuracy_in_bin),
                        int(in_bin.sum())
                    ))
            
            # Confidence histogram
            hist, bin_edges = np.histogram(predictions, bins=20, range=(0, 1))
            confidence_histogram = {
                'counts': hist.tolist(),
                'bin_edges': bin_edges.tolist()
            }
            
            return ModelCalibration(
                calibration_error=float(ece),
                brier_score=float(brier_score),
                reliability_bins=reliability_bins,
                confidence_histogram=confidence_histogram,
                calibration_curve_data={
                    'prob_true': prob_true.tolist(),
                    'prob_pred': prob_pred.tolist()
                }
            )
            
        except Exception as e:
            logging.error(f"Error calculating calibration metrics: {e}")
            return ModelCalibration(
                calibration_error=0.0,
                brier_score=float(brier_score),
                reliability_bins=[],
                confidence_histogram={},
                calibration_curve_data={'prob_true': [], 'prob_pred': []}
            )

class AttackPatternAnalyzer:
    """Analyzes and explains attack patterns"""
    
    def __init__(self, feature_names: List[str]):
        self.feature_names = feature_names
        self.attack_patterns = {}
        self.pattern_signatures = {}
        
        # Define attack type indicators
        self.attack_indicators = {
            'ddos': {
                'high_packet_rate': ['flow_packets_s', 'total_fwd_packets'],
                'low_iat': ['flow_iat_mean', 'fwd_iat_mean'],
                'high_bandwidth': ['flow_bytes_s', 'total_length_fwd_packets']
            },
            'bruteforce': {
                'high_connection_rate': ['total_fwd_packets', 'fwd_packets_s'],
                'small_packets': ['packet_length_mean', 'fwd_packet_length_mean'],
                'tcp_flags': ['psh_flag_count', 'syn_flag_count']
            },
            'portscan': {
                'low_packet_count': ['total_fwd_packets', 'total_bwd_packets'],
                'diverse_ports': ['fwd_header_length', 'bwd_header_length'],
                'short_flows': ['flow_duration', 'active_mean']
            },
            'exfiltration': {
                'high_upload': ['total_length_fwd_packets', 'flow_bytes_s'],
                'persistent_connection': ['flow_duration', 'active_mean'],
                'regular_pattern': ['flow_iat_std', 'packet_length_std']
            }
        }
    
    def analyze_attack_pattern(self, features: np.ndarray, feature_explanations: List[Dict]) -> Dict[str, Any]:
        """Analyze attack pattern from features and explanations"""
        try:
            # Create feature value mapping
            feature_values = {}
            for i, feature_name in enumerate(self.feature_names):
                if i < len(features.flatten()):
                    feature_values[feature_name] = features.flatten()[i]
            
            # Score each attack type
            attack_scores = {}
            for attack_type, indicators in self.attack_indicators.items():
                score = self._calculate_attack_score(feature_values, indicators)
                attack_scores[attack_type] = score
            
            # Determine most likely attack type
            most_likely_attack = max(attack_scores, key=attack_scores.get)
            confidence = attack_scores[most_likely_attack]
            
            # Generate attack signature
            signature = self._generate_attack_signature(feature_values, most_likely_attack)
            
            return {
                'attack_type': most_likely_attack,
                'confidence': confidence,
                'attack_scores': attack_scores,
                'signature': signature,
                'indicators_triggered': self._get_triggered_indicators(feature_values, most_likely_attack)
            }
            
        except Exception as e:
            logging.error(f"Error analyzing attack pattern: {e}")
            return {
                'attack_type': 'unknown',
                'confidence': 0.0,
                'attack_scores': {},
                'signature': {},
                'indicators_triggered': []
            }
    
    def _calculate_attack_score(self, feature_values: Dict[str, float], indicators: Dict[str, List[str]]) -> float:
        """Calculate score for a specific attack type"""
        score = 0.0
        total_indicators = 0
        
        for indicator_type, feature_list in indicators.items():
            for feature_name in feature_list:
                if feature_name in feature_values:
                    total_indicators += 1
                    
                    # Simple scoring based on feature values
                    value = feature_values[feature_name]
                    
                    # Normalize and score based on expected ranges
                    if 'high' in indicator_type:
                        # Higher values indicate this attack type
                        normalized_score = min(value / 1000.0, 1.0)  # Simplified normalization
                    elif 'low' in indicator_type:
                        # Lower values indicate this attack type
                        normalized_score = max(1.0 - value / 1000.0, 0.0)
                    else:
                        # Moderate values
                        normalized_score = 0.5
                    
                    score += normalized_score
        
        return score / max(total_indicators, 1)
    
    def _generate_attack_signature(self, feature_values: Dict[str, float], attack_type: str) -> Dict[str, Any]:
        """Generate attack signature"""
        signature = {
            'attack_type': attack_type,
            'key_features': {},
            'pattern_strength': 0.0
        }
        
        if attack_type in self.attack_indicators:
            indicators = self.attack_indicators[attack_type]
            
            for indicator_type, feature_list in indicators.items():
                for feature_name in feature_list:
                    if feature_name in feature_values:
                        signature['key_features'][feature_name] = feature_values[feature_name]
        
        return signature
    
    def _get_triggered_indicators(self, feature_values: Dict[str, float], attack_type: str) -> List[str]:
        """Get list of triggered indicators for attack type"""
        triggered = []
        
        if attack_type in self.attack_indicators:
            indicators = self.attack_indicators[attack_type]
            
            for indicator_type, feature_list in indicators.items():
                indicator_triggered = False
                
                for feature_name in feature_list:
                    if feature_name in feature_values:
                        value = feature_values[feature_name]
                        
                        # Simple threshold-based triggering
                        if 'high' in indicator_type and value > 100:
                            indicator_triggered = True
                        elif 'low' in indicator_type and value < 10:
                            indicator_triggered = True
                        elif 'tcp_flags' in indicator_type and value > 0:
                            indicator_triggered = True
                
                if indicator_triggered:
                    triggered.append(indicator_type)
        
        return triggered

class XAIExplainer:
    """Main XAI explainer that coordinates all explanation methods"""
    
    def __init__(self, 
                 model_path: str,
                 background_data: np.ndarray,
                 feature_names: List[str],
                 db_path: str = './data/xai_explanations.db'):
        
        self.model_path = model_path
        self.background_data = background_data
        self.feature_names = feature_names
        self.db_path = db_path
        
        # Load model
        self.model = self._load_model()
        
        # Initialize explainers
        self.shap_explainer = SHAPExplainer(self.model, background_data, feature_names)
        self.lime_explainer = LIMEExplainer(self.model, background_data, feature_names)
        self.confidence_calibrator = ConfidenceCalibrator()
        self.attack_analyzer = AttackPatternAnalyzer(feature_names)
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('XAIExplainer')
        
        # Initialize database
        self._init_database()
    
    def _load_model(self) -> keras.Model:
        """Load the LSTM model"""
        try:
            if os.path.exists(self.model_path):
                model = keras.models.load_model(self.model_path)
                self.logger.info(f"Loaded model from {self.model_path}")
                return model
            else:
                self.logger.warning(f"Model file not found: {self.model_path}")
                return self._create_dummy_model()
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            return self._create_dummy_model()
    
    def _create_dummy_model(self) -> keras.Model:
        """Create dummy model for testing"""
        model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(len(self.feature_names),)),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        self.logger.info("Created dummy model for testing")
        return model
    
    def _init_database(self):
        """Initialize XAI database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS explanations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sample_id TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        prediction INTEGER,
                        confidence REAL,
                        attack_type TEXT,
                        explanation_method TEXT,
                        feature_explanations TEXT,
                        decision_rationale TEXT,
                        model_version TEXT
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS calibration_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        confidence REAL,
                        prediction INTEGER,
                        true_label INTEGER,
                        calibration_error REAL
                    )
                ''')
                
                conn.commit()
                self.logger.info("XAI database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def explain_prediction(self, 
                          features: np.ndarray, 
                          sample_id: str,
                          true_label: Optional[int] = None,
                          explanation_methods: List[str] = ['shap', 'lime', 'pattern']) -> AttackExplanation:
        """Generate comprehensive explanation for a prediction"""
        
        try:
            # Make prediction
            prediction_prob = self.model.predict(features.reshape(1, -1), verbose=0)[0][0]
            prediction = 1 if prediction_prob > 0.5 else 0
            confidence = float(prediction_prob)
            
            # Update calibration data if true label is provided
            if true_label is not None:
                self.confidence_calibrator.add_prediction(confidence, prediction, true_label)
            
            # Initialize explanation components
            feature_explanations = []
            decision_rationale = ""
            uncertainty_factors = []
            
            # SHAP explanation
            if 'shap' in explanation_methods:
                shap_result = self.shap_explainer.explain_prediction(features, sample_id)
                if 'feature_explanations' in shap_result:
                    for feat_exp in shap_result['feature_explanations'][:10]:  # Top 10 features
                        feature_explanations.append(FeatureExplanation(
                            feature_name=feat_exp['feature_name'],
                            importance_score=abs(feat_exp['shap_value']),
                            contribution=feat_exp['shap_value'],
                            direction='positive' if feat_exp['shap_value'] > 0 else 'negative',
                            confidence=confidence,
                            description=f"SHAP value: {feat_exp['shap_value']:.4f}, Feature value: {feat_exp['feature_value']:.4f}"
                        ))
            
            # LIME explanation
            if 'lime' in explanation_methods:
                lime_result = self.lime_explainer.explain_prediction(features, sample_id)
                if 'feature_explanations' in lime_result:
                    decision_rationale += "LIME local explanation: "
                    for feat_exp in lime_result['feature_explanations'][:5]:
                        decision_rationale += f"{feat_exp['feature_description']} (importance: {feat_exp['importance']:.3f}); "
            
            # Attack pattern analysis
            attack_analysis = {}
            if 'pattern' in explanation_methods:
                attack_analysis = self.attack_analyzer.analyze_attack_pattern(features, [])
                decision_rationale += f"\nAttack pattern analysis: Most likely {attack_analysis.get('attack_type', 'unknown')} attack "
                decision_rationale += f"(confidence: {attack_analysis.get('confidence', 0):.3f})"
            
            # Generate uncertainty factors
            if confidence < 0.7:
                uncertainty_factors.append("Low prediction confidence")
            
            if attack_analysis.get('confidence', 0) < 0.5:
                uncertainty_factors.append("Ambiguous attack pattern")
            
            # Generate recommended actions
            recommended_actions = self._generate_recommendations(prediction, confidence, attack_analysis)
            
            # Determine severity
            severity = self._determine_severity(prediction, confidence, attack_analysis)
            
            # Create explanation
            explanation = AttackExplanation(
                sample_id=sample_id,
                timestamp=datetime.now().isoformat(),
                prediction=prediction,
                confidence=confidence,
                attack_type=attack_analysis.get('attack_type', 'unknown'),
                severity=severity,
                key_features=feature_explanations,
                decision_rationale=decision_rationale,
                uncertainty_factors=uncertainty_factors,
                recommended_actions=recommended_actions,
                model_version='v1.0'
            )
            
            # Store explanation
            self._store_explanation(explanation)
            
            return explanation
            
        except Exception as e:
            self.logger.error(f"Error generating explanation: {e}")
            return self._create_fallback_explanation(sample_id)
    
    def _generate_recommendations(self, prediction: int, confidence: float, attack_analysis: Dict) -> List[str]:
        """Generate recommended actions based on prediction"""
        recommendations = []
        
        if prediction == 1:  # Attack detected
            if confidence > 0.8:
                recommendations.append("High confidence attack - Immediately block source IP")
                recommendations.append("Initiate incident response procedures")
            elif confidence > 0.6:
                recommendations.append("Moderate confidence attack - Monitor closely and gather additional evidence")
                recommendations.append("Consider rate limiting from source")
            else:
                recommendations.append("Low confidence attack - Flag for manual review")
                recommendations.append("Increase monitoring sensitivity for this source")
            
            # Attack-specific recommendations
            attack_type = attack_analysis.get('attack_type', 'unknown')
            if attack_type == 'ddos':
                recommendations.append("Deploy DDoS mitigation measures")
                recommendations.append("Scale up infrastructure if needed")
            elif attack_type == 'bruteforce':
                recommendations.append("Implement account lockout policies")
                recommendations.append("Enable multi-factor authentication")
            elif attack_type == 'portscan':
                recommendations.append("Review firewall rules")
                recommendations.append("Hide unnecessary services")
            elif attack_type == 'exfiltration':
                recommendations.append("Check for data breaches")
                recommendations.append("Review access controls and permissions")
        else:
            recommendations.append("Traffic appears normal - Continue monitoring")
            if confidence < 0.8:
                recommendations.append("Low confidence normal - Consider model retraining")
        
        return recommendations
    
    def _determine_severity(self, prediction: int, confidence: float, attack_analysis: Dict) -> str:
        """Determine severity level"""
        if prediction == 0:
            return 'low'
        
        if confidence > 0.9:
            return 'critical'
        elif confidence > 0.7:
            return 'high'
        elif confidence > 0.5:
            return 'medium'
        else:
            return 'low'
    
    def _create_fallback_explanation(self, sample_id: str) -> AttackExplanation:
        """Create fallback explanation when main explanation fails"""
        return AttackExplanation(
            sample_id=sample_id,
            timestamp=datetime.now().isoformat(),
            prediction=0,
            confidence=0.0,
            attack_type='unknown',
            severity='low',
            key_features=[],
            decision_rationale="Explanation generation failed",
            uncertainty_factors=["Explanation system error"],
            recommended_actions=["Manual review required"],
            model_version='unknown'
        )
    
    def _store_explanation(self, explanation: AttackExplanation):
        """Store explanation in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO explanations (
                        sample_id, timestamp, prediction, confidence, attack_type,
                        explanation_method, feature_explanations, decision_rationale, model_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    explanation.sample_id,
                    explanation.timestamp,
                    explanation.prediction,
                    explanation.confidence,
                    explanation.attack_type,
                    'comprehensive',
                    json.dumps([asdict(fe) for fe in explanation.key_features]),
                    explanation.decision_rationale,
                    explanation.model_version
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing explanation: {e}")
    
    def get_model_calibration(self) -> ModelCalibration:
        """Get current model calibration metrics"""
        return self.confidence_calibrator.calculate_calibration_metrics()
    
    def generate_explanation_report(self, sample_ids: List[str]) -> Dict[str, Any]:
        """Generate comprehensive explanation report"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get explanations for specified samples
                placeholders = ','.join(['?' for _ in sample_ids])
                cursor.execute(f'''
                    SELECT * FROM explanations 
                    WHERE sample_id IN ({placeholders})
                    ORDER BY timestamp DESC
                ''', sample_ids)
                
                explanations = cursor.fetchall()
                
                # Get calibration metrics
                calibration = self.get_model_calibration()
                
                return {
                    'explanations': explanations,
                    'calibration_metrics': asdict(calibration),
                    'report_timestamp': datetime.now().isoformat(),
                    'total_explanations': len(explanations)
                }
                
        except Exception as e:
            self.logger.error(f"Error generating explanation report: {e}")
            return {}
    
    def visualize_explanation(self, explanation: AttackExplanation, save_path: Optional[str] = None) -> str:
        """Create visualization of explanation"""
        try:
            # Create figure with subplots
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            fig.suptitle(f'Attack Explanation: {explanation.sample_id}', fontsize=16)
            
            # Feature importance plot
            if explanation.key_features:
                features = [fe.feature_name for fe in explanation.key_features[:10]]
                importance = [fe.importance_score for fe in explanation.key_features[:10]]
                
                axes[0, 0].barh(features, importance)
                axes[0, 0].set_title('Top 10 Feature Importance')
                axes[0, 0].set_xlabel('Importance Score')
            
            # Feature contributions
            if explanation.key_features:
                contributions = [fe.contribution for fe in explanation.key_features[:10]]
                colors = ['red' if c < 0 else 'blue' for c in contributions]
                
                axes[0, 1].barh(features, contributions, color=colors)
                axes[0, 1].set_title('Feature Contributions')
                axes[0, 1].set_xlabel('Contribution')
                axes[0, 1].axvline(x=0, color='black', linestyle='-', alpha=0.3)
            
            # Prediction confidence
            axes[1, 0].pie([explanation.confidence, 1 - explanation.confidence], 
                          labels=['Attack Confidence', 'Normal Confidence'],
                          colors=['red', 'green'],
                          autopct='%1.1f%%')
            axes[1, 0].set_title(f'Prediction Confidence\n{explanation.attack_type.capitalize()} Attack')
            
            # Uncertainty factors
            if explanation.uncertainty_factors:
                axes[1, 1].text(0.1, 0.9, 'Uncertainty Factors:', transform=axes[1, 1].transAxes, 
                                fontweight='bold')
                for i, factor in enumerate(explanation.uncertainty_factors):
                    axes[1, 1].text(0.1, 0.8 - i*0.1, f'• {factor}', 
                                    transform=axes[1, 1].transAxes)
            
            axes[1, 1].set_xlim(0, 1)
            axes[1, 1].set_ylim(0, 1)
            axes[1, 1].axis('off')
            axes[1, 1].set_title('Uncertainty Analysis')
            
            plt.tight_layout()
            
            # Save or display
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                plt.close()
                return save_path
            else:
                # Save to temporary file
                temp_path = f"./temp_explanation_{explanation.sample_id}.png"
                plt.savefig(temp_path, dpi=300, bbox_inches='tight')
                plt.close()
                return temp_path
                
        except Exception as e:
            self.logger.error(f"Error creating visualization: {e}")
            return ""

def main():
    """Main function for testing XAI explainer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='XAI Explainer for SHIELD SOC')
    parser.add_argument('--model-path', default='./models/best_lstm_ids_deep.h5', help='Model path')
    parser.add_argument('--test-samples', type=int, default=10, help='Number of test samples')
    
    args = parser.parse_args()
    
    # Create dummy data for testing
    feature_names = [
        'flow_duration', 'total_fwd_packets', 'total_bwd_packets',
        'packet_length_mean', 'packet_length_std', 'flow_bytes_s',
        'flow_packets_s', 'flow_iat_mean', 'fwd_header_length',
        'psh_flag_count', 'urg_flag_count', 'syn_flag_count',
        'ack_flag_count', 'down_up_ratio', 'average_packet_size',
        'fwd_packets_s', 'bwd_packets_s', 'active_mean',
        'idle_mean', 'packet_length_variance'
    ]
    
    # Generate background data
    background_data = np.random.normal(0, 1, (100, len(feature_names)))
    
    # Create explainer
    explainer = XAIExplainer(
        model_path=args.model_path,
        background_data=background_data,
        feature_names=feature_names
    )
    
    print("XAI Explainer initialized successfully")
    
    # Test explanations
    for i in range(args.test_samples):
        # Generate test sample
        test_sample = np.random.normal(0, 1, len(feature_names))
        sample_id = f"test_sample_{i}"
        
        # Generate explanation
        explanation = explainer.explain_prediction(
            test_sample, 
            sample_id,
            true_label=np.random.choice([0, 1])  # Random true label for testing
        )
        
        print(f"\n--- Explanation for {sample_id} ---")
        print(f"Prediction: {explanation.prediction} ({explanation.attack_type})")
        print(f"Confidence: {explanation.confidence:.3f}")
        print(f"Severity: {explanation.severity}")
        print(f"Top features: {[fe.feature_name for fe in explanation.key_features[:3]]}")
        print(f"Rationale: {explanation.decision_rationale[:100]}...")
        
        # Create visualization
        viz_path = explainer.visualize_explanation(explanation)
        if viz_path:
            print(f"Visualization saved: {viz_path}")
    
    # Get calibration metrics
    calibration = explainer.get_model_calibration()
    print(f"\n--- Model Calibration ---")
    print(f"Calibration Error: {calibration.calibration_error:.4f}")
    print(f"Brier Score: {calibration.brier_score:.4f}")

if __name__ == "__main__":
    main()