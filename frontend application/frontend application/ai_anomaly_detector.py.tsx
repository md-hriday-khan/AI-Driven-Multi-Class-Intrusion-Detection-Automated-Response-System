#!/usr/bin/env python3
"""
AI Anomaly Detector for SHIELD SOC
Meta-monitoring system that monitors the AI monitoring systems themselves
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
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import tensorflow as tf
import psutil
import hashlib
import os

@dataclass
class SystemHealthMetrics:
    """System health and performance metrics"""
    timestamp: str
    cpu_usage: float
    memory_usage: float
    gpu_usage: float
    disk_io: float
    network_io: float
    model_inference_time: float
    prediction_throughput: float
    queue_depth: int
    error_rate: float

@dataclass
class AISystemAnomaly:
    """Detected anomaly in AI system"""
    anomaly_id: str
    timestamp: str
    anomaly_type: str
    severity: str
    description: str
    affected_components: List[str]
    metrics_snapshot: Dict[str, float]
    root_cause_analysis: Dict[str, Any]
    recommended_actions: List[str]
    auto_mitigation_applied: bool

@dataclass
class SecurityThreat:
    """Detected security threat against AI system"""
    threat_id: str
    timestamp: str
    threat_type: str
    severity: str
    source: str
    target_component: str
    indicators: List[str]
    confidence: float
    mitigation_status: str

class ModelPerformanceAnomalyDetector:
    """Detects anomalies in model performance metrics"""
    
    def __init__(self, window_size: int = 1000, contamination: float = 0.1):
        self.window_size = window_size
        self.contamination = contamination
        
        # Performance metrics storage
        self.accuracy_history = deque(maxlen=window_size)
        self.latency_history = deque(maxlen=window_size)
        self.confidence_history = deque(maxlen=window_size)
        self.prediction_distribution = deque(maxlen=window_size)
        
        # Anomaly detection models
        self.isolation_forest = IsolationForest(contamination=contamination, random_state=42)
        self.dbscan = DBSCAN(eps=0.5, min_samples=5)
        self.scaler = StandardScaler()
        
        # Baseline metrics
        self.baseline_metrics = None
        self.baseline_established = False
        
        # Anomaly tracking
        self.detected_anomalies = []
        self.anomaly_patterns = defaultdict(list)
    
    def add_performance_metrics(self, accuracy: float, latency: float, confidence: float, prediction: int):
        """Add new performance metrics"""
        self.accuracy_history.append(accuracy)
        self.latency_history.append(latency)
        self.confidence_history.append(confidence)
        self.prediction_distribution.append(prediction)
        
        # Establish baseline if we have enough data
        if len(self.accuracy_history) >= 100 and not self.baseline_established:
            self._establish_baseline()
        
        # Detect anomalies if baseline is established
        if self.baseline_established:
            self._detect_performance_anomalies()
    
    def _establish_baseline(self):
        """Establish baseline performance metrics"""
        if len(self.accuracy_history) < 100:
            return
        
        self.baseline_metrics = {
            'accuracy_mean': np.mean(list(self.accuracy_history)),
            'accuracy_std': np.std(list(self.accuracy_history)),
            'latency_mean': np.mean(list(self.latency_history)),
            'latency_std': np.std(list(self.latency_history)),
            'confidence_mean': np.mean(list(self.confidence_history)),
            'confidence_std': np.std(list(self.confidence_history)),
            'positive_rate': np.mean(list(self.prediction_distribution))
        }
        
        self.baseline_established = True
        logging.info("Performance baseline established")
        logging.info(f"Baseline metrics: {self.baseline_metrics}")
    
    def _detect_performance_anomalies(self):
        """Detect anomalies in performance metrics"""
        if not self.baseline_established or len(self.accuracy_history) < 50:
            return
        
        # Get recent metrics
        recent_window = 20
        recent_accuracy = list(self.accuracy_history)[-recent_window:]
        recent_latency = list(self.latency_history)[-recent_window:]
        recent_confidence = list(self.confidence_history)[-recent_window:]
        recent_predictions = list(self.prediction_distribution)[-recent_window:]
        
        anomalies = []
        
        # Check accuracy degradation
        recent_acc_mean = np.mean(recent_accuracy)
        if recent_acc_mean < self.baseline_metrics['accuracy_mean'] - 2 * self.baseline_metrics['accuracy_std']:
            anomalies.append({
                'type': 'accuracy_degradation',
                'severity': 'high',
                'description': f"Accuracy dropped to {recent_acc_mean:.3f} from baseline {self.baseline_metrics['accuracy_mean']:.3f}",
                'metric_value': recent_acc_mean,
                'baseline_value': self.baseline_metrics['accuracy_mean']
            })
        
        # Check latency spikes
        recent_lat_mean = np.mean(recent_latency)
        if recent_lat_mean > self.baseline_metrics['latency_mean'] + 3 * self.baseline_metrics['latency_std']:
            anomalies.append({
                'type': 'latency_spike',
                'severity': 'medium',
                'description': f"Latency increased to {recent_lat_mean:.3f}s from baseline {self.baseline_metrics['latency_mean']:.3f}s",
                'metric_value': recent_lat_mean,
                'baseline_value': self.baseline_metrics['latency_mean']
            })
        
        # Check confidence degradation
        recent_conf_mean = np.mean(recent_confidence)
        if recent_conf_mean < self.baseline_metrics['confidence_mean'] - 2 * self.baseline_metrics['confidence_std']:
            anomalies.append({
                'type': 'confidence_degradation',
                'severity': 'medium',
                'description': f"Confidence dropped to {recent_conf_mean:.3f} from baseline {self.baseline_metrics['confidence_mean']:.3f}",
                'metric_value': recent_conf_mean,
                'baseline_value': self.baseline_metrics['confidence_mean']
            })
        
        # Check prediction distribution shift
        recent_pos_rate = np.mean(recent_predictions)
        baseline_pos_rate = self.baseline_metrics['positive_rate']
        if abs(recent_pos_rate - baseline_pos_rate) > 0.2:  # 20% shift threshold
            anomalies.append({
                'type': 'prediction_distribution_shift',
                'severity': 'medium',
                'description': f"Prediction rate shifted to {recent_pos_rate:.3f} from baseline {baseline_pos_rate:.3f}",
                'metric_value': recent_pos_rate,
                'baseline_value': baseline_pos_rate
            })
        
        # Store detected anomalies
        for anomaly in anomalies:
            self.detected_anomalies.append({
                **anomaly,
                'timestamp': datetime.now().isoformat(),
                'detection_method': 'statistical_threshold'
            })
            
            self.anomaly_patterns[anomaly['type']].append(anomaly)
            
            logging.warning(f"Performance anomaly detected: {anomaly['description']}")
    
    def get_anomaly_summary(self) -> Dict[str, Any]:
        """Get summary of detected anomalies"""
        recent_anomalies = [a for a in self.detected_anomalies 
                           if datetime.fromisoformat(a['timestamp']) > datetime.now() - timedelta(hours=1)]
        
        return {
            'total_anomalies': len(self.detected_anomalies),
            'recent_anomalies': len(recent_anomalies),
            'anomaly_types': dict(self.anomaly_patterns.keys()),
            'baseline_established': self.baseline_established,
            'baseline_metrics': self.baseline_metrics,
            'latest_anomalies': self.detected_anomalies[-10:] if self.detected_anomalies else []
        }

class DataPipelineMonitor:
    """Monitors data pipeline integrity and quality"""
    
    def __init__(self):
        self.feature_statistics = defaultdict(lambda: deque(maxlen=1000))
        self.data_quality_metrics = deque(maxlen=1000)
        self.pipeline_errors = []
        self.schema_violations = []
        
        # Expected feature ranges (learned from training data)
        self.expected_ranges = {}
        self.feature_correlations = {}
        
    def validate_data_sample(self, features: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """Validate a data sample for quality issues"""
        validation_results = {
            'valid': True,
            'issues': [],
            'quality_score': 1.0
        }
        
        try:
            # Check for missing values
            if np.any(np.isnan(features)):
                validation_results['valid'] = False
                validation_results['issues'].append('missing_values')
                validation_results['quality_score'] *= 0.5
            
            # Check for infinite values
            if np.any(np.isinf(features)):
                validation_results['valid'] = False
                validation_results['issues'].append('infinite_values')
                validation_results['quality_score'] *= 0.3
            
            # Check feature ranges
            for i, (feature_name, value) in enumerate(zip(feature_names, features.flatten())):
                if feature_name in self.expected_ranges:
                    min_val, max_val = self.expected_ranges[feature_name]
                    if value < min_val or value > max_val:
                        validation_results['issues'].append(f'{feature_name}_out_of_range')
                        validation_results['quality_score'] *= 0.9
            
            # Update feature statistics
            for i, (feature_name, value) in enumerate(zip(feature_names, features.flatten())):
                self.feature_statistics[feature_name].append(value)
            
            # Check for data distribution shifts
            shift_detected = self._detect_distribution_shift(features, feature_names)
            if shift_detected:
                validation_results['issues'].append('distribution_shift')
                validation_results['quality_score'] *= 0.8
            
            # Record quality metrics
            self.data_quality_metrics.append({
                'timestamp': datetime.now().isoformat(),
                'quality_score': validation_results['quality_score'],
                'issues': validation_results['issues']
            })
            
            return validation_results
            
        except Exception as e:
            logging.error(f"Error validating data sample: {e}")
            return {
                'valid': False,
                'issues': ['validation_error'],
                'quality_score': 0.0
            }
    
    def _detect_distribution_shift(self, features: np.ndarray, feature_names: List[str]) -> bool:
        """Detect distribution shift in features"""
        try:
            # Simple distribution shift detection using recent vs historical data
            shift_detected = False
            
            for i, feature_name in enumerate(feature_names):
                if len(self.feature_statistics[feature_name]) > 100:
                    recent_data = list(self.feature_statistics[feature_name])[-50:]
                    historical_data = list(self.feature_statistics[feature_name])[-100:-50]
                    
                    if len(recent_data) >= 20 and len(historical_data) >= 20:
                        # Use Kolmogorov-Smirnov test
                        statistic, p_value = stats.ks_2samp(historical_data, recent_data)
                        
                        if p_value < 0.05 and statistic > 0.2:  # Significant shift
                            shift_detected = True
                            logging.warning(f"Distribution shift detected in {feature_name}: p={p_value:.4f}")
            
            return shift_detected
            
        except Exception as e:
            logging.error(f"Error detecting distribution shift: {e}")
            return False
    
    def set_expected_ranges(self, feature_ranges: Dict[str, Tuple[float, float]]):
        """Set expected ranges for features"""
        self.expected_ranges = feature_ranges
        logging.info(f"Set expected ranges for {len(feature_ranges)} features")
    
    def get_pipeline_health(self) -> Dict[str, Any]:
        """Get pipeline health metrics"""
        recent_quality = [m['quality_score'] for m in list(self.data_quality_metrics)[-100:]]
        
        return {
            'average_quality_score': np.mean(recent_quality) if recent_quality else 1.0,
            'quality_trend': self._calculate_quality_trend(),
            'total_samples_processed': len(self.data_quality_metrics),
            'pipeline_errors': len(self.pipeline_errors),
            'schema_violations': len(self.schema_violations),
            'feature_health': self._assess_feature_health()
        }
    
    def _calculate_quality_trend(self) -> float:
        """Calculate quality trend (positive = improving)"""
        recent_quality = [m['quality_score'] for m in list(self.data_quality_metrics)[-50:]]
        
        if len(recent_quality) < 10:
            return 0.0
        
        # Simple linear trend
        x = np.arange(len(recent_quality))
        slope, _ = np.polyfit(x, recent_quality, 1)
        return float(slope)
    
    def _assess_feature_health(self) -> Dict[str, str]:
        """Assess health of individual features"""
        feature_health = {}
        
        for feature_name, values in self.feature_statistics.items():
            if len(values) < 10:
                feature_health[feature_name] = 'insufficient_data'
                continue
            
            recent_values = list(values)[-50:]
            
            # Check for constant values
            if np.std(recent_values) < 1e-6:
                feature_health[feature_name] = 'constant_values'
            # Check for extreme outliers
            elif np.any(np.abs(stats.zscore(recent_values)) > 5):
                feature_health[feature_name] = 'outliers_detected'
            else:
                feature_health[feature_name] = 'healthy'
        
        return feature_health

class SecurityThreatDetector:
    """Detects security threats against the AI system"""
    
    def __init__(self):
        self.attack_patterns = {
            'adversarial_inputs': self._detect_adversarial_inputs,
            'model_extraction': self._detect_model_extraction,
            'data_poisoning': self._detect_data_poisoning,
            'inference_attacks': self._detect_inference_attacks,
            'resource_exhaustion': self._detect_resource_exhaustion
        }
        
        self.threat_history = []
        self.suspicious_patterns = defaultdict(list)
        self.request_patterns = deque(maxlen=10000)
        
    def analyze_request_pattern(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Analyze request pattern for security threats"""
        self.request_patterns.append({
            **request_info,
            'timestamp': datetime.now().isoformat()
        })
        
        # Run all threat detection methods
        for threat_type, detector in self.attack_patterns.items():
            threat = detector(request_info)
            if threat:
                self.threat_history.append(threat)
                return threat
        
        return None
    
    def _detect_adversarial_inputs(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Detect adversarial input attacks"""
        try:
            features = request_info.get('features', [])
            if not features:
                return None
            
            # Check for unusual feature values that might indicate adversarial crafting
            features_array = np.array(features)
            
            # Look for extremely high or low values
            z_scores = np.abs(stats.zscore(features_array))
            if np.any(z_scores > 10):  # Extreme outliers
                return SecurityThreat(
                    threat_id=f"adv_{int(time.time())}_{hash(str(features)) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type='adversarial_inputs',
                    severity='medium',
                    source=request_info.get('source_ip', 'unknown'),
                    target_component='model_inference',
                    indicators=['extreme_feature_values'],
                    confidence=0.7,
                    mitigation_status='detected'
                )
            
            return None
            
        except Exception as e:
            logging.error(f"Error detecting adversarial inputs: {e}")
            return None
    
    def _detect_model_extraction(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Detect model extraction attempts"""
        try:
            source_ip = request_info.get('source_ip', 'unknown')
            
            # Count requests from this IP in recent time window
            recent_requests = [r for r in self.request_patterns 
                             if r.get('source_ip') == source_ip and
                             datetime.fromisoformat(r['timestamp']) > datetime.now() - timedelta(minutes=10)]
            
            # High frequency requests might indicate extraction
            if len(recent_requests) > 100:  # More than 100 requests in 10 minutes
                return SecurityThreat(
                    threat_id=f"extract_{int(time.time())}_{hash(source_ip) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type='model_extraction',
                    severity='high',
                    source=source_ip,
                    target_component='model_inference',
                    indicators=['high_request_frequency', f'{len(recent_requests)}_requests_in_10min'],
                    confidence=0.8,
                    mitigation_status='detected'
                )
            
            return None
            
        except Exception as e:
            logging.error(f"Error detecting model extraction: {e}")
            return None
    
    def _detect_data_poisoning(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Detect data poisoning attempts"""
        try:
            # This would typically analyze feedback or training data for poisoning
            # For now, we'll implement a simple placeholder
            
            if request_info.get('feedback_provided') and request_info.get('confidence_score', 1.0) < 0.1:
                # Suspicious: providing feedback on very low confidence predictions
                return SecurityThreat(
                    threat_id=f"poison_{int(time.time())}_{hash(str(request_info)) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type='data_poisoning',
                    severity='medium',
                    source=request_info.get('source_ip', 'unknown'),
                    target_component='feedback_system',
                    indicators=['suspicious_feedback_pattern'],
                    confidence=0.6,
                    mitigation_status='detected'
                )
            
            return None
            
        except Exception as e:
            logging.error(f"Error detecting data poisoning: {e}")
            return None
    
    def _detect_inference_attacks(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Detect inference/membership attacks"""
        try:
            # Look for patterns that might indicate membership inference
            features = request_info.get('features', [])
            confidence = request_info.get('confidence_score', 0.5)
            
            # Repeated similar queries with slight variations might indicate inference attack
            source_ip = request_info.get('source_ip', 'unknown')
            recent_similar = 0
            
            for req in list(self.request_patterns)[-100:]:  # Check last 100 requests
                if req.get('source_ip') == source_ip:
                    req_features = req.get('features', [])
                    if len(req_features) == len(features):
                        # Calculate similarity
                        similarity = np.corrcoef(features, req_features)[0, 1] if len(features) > 1 else 0
                        if similarity > 0.9:  # Very similar features
                            recent_similar += 1
            
            if recent_similar > 10:  # More than 10 very similar requests
                return SecurityThreat(
                    threat_id=f"infer_{int(time.time())}_{hash(source_ip) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type='inference_attacks',
                    severity='medium',
                    source=source_ip,
                    target_component='model_inference',
                    indicators=['repeated_similar_queries', f'{recent_similar}_similar_requests'],
                    confidence=0.7,
                    mitigation_status='detected'
                )
            
            return None
            
        except Exception as e:
            logging.error(f"Error detecting inference attacks: {e}")
            return None
    
    def _detect_resource_exhaustion(self, request_info: Dict[str, Any]) -> Optional[SecurityThreat]:
        """Detect resource exhaustion attacks"""
        try:
            # Check for patterns that might exhaust system resources
            processing_time = request_info.get('processing_time', 0)
            
            # Extremely long processing times might indicate resource exhaustion
            if processing_time > 10.0:  # More than 10 seconds
                return SecurityThreat(
                    threat_id=f"exhaust_{int(time.time())}_{hash(str(request_info)) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type='resource_exhaustion',
                    severity='high',
                    source=request_info.get('source_ip', 'unknown'),
                    target_component='inference_engine',
                    indicators=['excessive_processing_time', f'{processing_time:.2f}s'],
                    confidence=0.8,
                    mitigation_status='detected'
                )
            
            return None
            
        except Exception as e:
            logging.error(f"Error detecting resource exhaustion: {e}")
            return None
    
    def get_security_summary(self) -> Dict[str, Any]:
        """Get security threat summary"""
        recent_threats = [t for t in self.threat_history 
                         if datetime.fromisoformat(t.timestamp) > datetime.now() - timedelta(hours=24)]
        
        threat_counts = defaultdict(int)
        for threat in recent_threats:
            threat_counts[threat.threat_type] += 1
        
        return {
            'total_threats_detected': len(self.threat_history),
            'threats_last_24h': len(recent_threats),
            'threat_types': dict(threat_counts),
            'severity_distribution': self._get_severity_distribution(recent_threats),
            'top_threat_sources': self._get_top_threat_sources(recent_threats),
            'latest_threats': [asdict(t) for t in self.threat_history[-10:]]
        }
    
    def _get_severity_distribution(self, threats: List[SecurityThreat]) -> Dict[str, int]:
        """Get distribution of threat severities"""
        distribution = defaultdict(int)
        for threat in threats:
            distribution[threat.severity] += 1
        return dict(distribution)
    
    def _get_top_threat_sources(self, threats: List[SecurityThreat]) -> List[Tuple[str, int]]:
        """Get top threat sources"""
        sources = defaultdict(int)
        for threat in threats:
            sources[threat.source] += 1
        
        return sorted(sources.items(), key=lambda x: x[1], reverse=True)[:10]

class RootCauseAnalyzer:
    """Performs automated root cause analysis for detected anomalies"""
    
    def __init__(self):
        self.analysis_rules = {
            'accuracy_degradation': self._analyze_accuracy_degradation,
            'latency_spike': self._analyze_latency_spike,
            'confidence_degradation': self._analyze_confidence_degradation,
            'resource_exhaustion': self._analyze_resource_exhaustion,
            'data_quality_issues': self._analyze_data_quality_issues
        }
        
        self.correlation_matrix = {}
        self.historical_patterns = defaultdict(list)
    
    def analyze_anomaly(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Perform root cause analysis for an anomaly"""
        try:
            analysis_method = self.analysis_rules.get(anomaly.anomaly_type)
            if analysis_method:
                return analysis_method(anomaly, system_metrics)
            else:
                return self._generic_analysis(anomaly, system_metrics)
                
        except Exception as e:
            logging.error(f"Error in root cause analysis: {e}")
            return {
                'root_cause': 'analysis_failed',
                'confidence': 0.0,
                'contributing_factors': [],
                'recommendations': ['Manual investigation required']
            }
    
    def _analyze_accuracy_degradation(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze accuracy degradation root causes"""
        contributing_factors = []
        root_cause = 'unknown'
        confidence = 0.0
        
        # Check for data drift
        if system_metrics.get('data_drift_detected', False):
            contributing_factors.append('data_distribution_drift')
            root_cause = 'data_drift'
            confidence = 0.8
        
        # Check for resource constraints
        if system_metrics.get('cpu_usage', 0) > 90:
            contributing_factors.append('high_cpu_usage')
            if root_cause == 'unknown':
                root_cause = 'resource_constraints'
                confidence = 0.7
        
        # Check for adversarial attacks
        if system_metrics.get('security_threats_detected', 0) > 0:
            contributing_factors.append('potential_adversarial_attacks')
            if root_cause == 'unknown':
                root_cause = 'security_attack'
                confidence = 0.6
        
        recommendations = self._generate_recommendations(root_cause, contributing_factors)
        
        return {
            'root_cause': root_cause,
            'confidence': confidence,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _analyze_latency_spike(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze latency spike root causes"""
        contributing_factors = []
        root_cause = 'unknown'
        confidence = 0.0
        
        # Check resource utilization
        if system_metrics.get('cpu_usage', 0) > 85:
            contributing_factors.append('high_cpu_usage')
            root_cause = 'resource_bottleneck'
            confidence = 0.9
        
        if system_metrics.get('memory_usage', 0) > 90:
            contributing_factors.append('high_memory_usage')
            root_cause = 'memory_bottleneck'
            confidence = 0.9
        
        # Check for I/O bottlenecks
        if system_metrics.get('disk_io', 0) > 80:
            contributing_factors.append('disk_io_bottleneck')
            if root_cause == 'unknown':
                root_cause = 'io_bottleneck'
                confidence = 0.8
        
        # Check for network issues
        if system_metrics.get('network_latency', 0) > 100:  # ms
            contributing_factors.append('network_latency')
            if root_cause == 'unknown':
                root_cause = 'network_issues'
                confidence = 0.7
        
        recommendations = self._generate_recommendations(root_cause, contributing_factors)
        
        return {
            'root_cause': root_cause,
            'confidence': confidence,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _analyze_confidence_degradation(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze confidence degradation root causes"""
        contributing_factors = []
        root_cause = 'model_uncertainty'
        confidence = 0.7
        
        # Check for new attack patterns
        if system_metrics.get('unknown_patterns_detected', False):
            contributing_factors.append('novel_attack_patterns')
            root_cause = 'new_threat_landscape'
            confidence = 0.8
        
        # Check for model staleness
        model_age = system_metrics.get('model_age_days', 0)
        if model_age > 30:
            contributing_factors.append('model_staleness')
            if root_cause == 'model_uncertainty':
                root_cause = 'outdated_model'
                confidence = 0.8
        
        recommendations = self._generate_recommendations(root_cause, contributing_factors)
        
        return {
            'root_cause': root_cause,
            'confidence': confidence,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _analyze_resource_exhaustion(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze resource exhaustion root causes"""
        contributing_factors = []
        root_cause = 'resource_exhaustion'
        confidence = 0.9
        
        # Identify specific resource bottlenecks
        if system_metrics.get('cpu_usage', 0) > 95:
            contributing_factors.append('cpu_exhaustion')
        
        if system_metrics.get('memory_usage', 0) > 95:
            contributing_factors.append('memory_exhaustion')
        
        if system_metrics.get('disk_usage', 0) > 95:
            contributing_factors.append('disk_exhaustion')
        
        # Check for attack patterns
        if system_metrics.get('dos_attack_detected', False):
            contributing_factors.append('denial_of_service_attack')
            root_cause = 'security_attack'
        
        recommendations = self._generate_recommendations(root_cause, contributing_factors)
        
        return {
            'root_cause': root_cause,
            'confidence': confidence,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _analyze_data_quality_issues(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze data quality issues"""
        contributing_factors = []
        root_cause = 'data_pipeline_issue'
        confidence = 0.8
        
        # Check for specific data issues
        if system_metrics.get('missing_values_rate', 0) > 0.1:
            contributing_factors.append('high_missing_values')
        
        if system_metrics.get('schema_violations', 0) > 0:
            contributing_factors.append('schema_violations')
        
        if system_metrics.get('outlier_rate', 0) > 0.05:
            contributing_factors.append('high_outlier_rate')
        
        recommendations = self._generate_recommendations(root_cause, contributing_factors)
        
        return {
            'root_cause': root_cause,
            'confidence': confidence,
            'contributing_factors': contributing_factors,
            'recommendations': recommendations
        }
    
    def _generic_analysis(self, anomaly: AISystemAnomaly, system_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Generic analysis for unknown anomaly types"""
        return {
            'root_cause': 'requires_investigation',
            'confidence': 0.3,
            'contributing_factors': ['unknown_anomaly_type'],
            'recommendations': [
                'Manual investigation required',
                'Review system logs',
                'Check recent system changes'
            ]
        }
    
    def _generate_recommendations(self, root_cause: str, contributing_factors: List[str]) -> List[str]:
        """Generate recommendations based on root cause analysis"""
        recommendations = []
        
        if root_cause == 'data_drift':
            recommendations.extend([
                'Update model with recent data',
                'Implement drift detection alerts',
                'Review data sources for changes'
            ])
        elif root_cause == 'resource_constraints':
            recommendations.extend([
                'Scale up system resources',
                'Optimize model inference',
                'Implement load balancing'
            ])
        elif root_cause == 'security_attack':
            recommendations.extend([
                'Block malicious sources',
                'Enable rate limiting',
                'Review security configurations'
            ])
        elif root_cause == 'model_uncertainty':
            recommendations.extend([
                'Retrain model with recent data',
                'Adjust confidence thresholds',
                'Implement ensemble methods'
            ])
        else:
            recommendations.extend([
                'Monitor system closely',
                'Investigate root cause manually',
                'Implement additional monitoring'
            ])
        
        return recommendations

class AIAnomalyDetector:
    """Main AI Anomaly Detector that coordinates all monitoring components"""
    
    def __init__(self, db_path: str = './data/ai_anomaly_detection.db'):
        self.db_path = db_path
        
        # Initialize monitoring components
        self.performance_monitor = ModelPerformanceAnomalyDetector()
        self.pipeline_monitor = DataPipelineMonitor()
        self.security_detector = SecurityThreatDetector()
        self.root_cause_analyzer = RootCauseAnalyzer()
        
        # System state
        self.monitoring_active = False
        self.monitoring_thread = None
        
        # Anomaly tracking
        self.detected_anomalies = []
        self.security_threats = []
        self.system_health_history = deque(maxlen=1000)
        
        # Auto-mitigation
        self.auto_mitigation_enabled = True
        self.mitigation_actions = {
            'high_latency': self._mitigate_latency_spike,
            'resource_exhaustion': self._mitigate_resource_exhaustion,
            'security_threat': self._mitigate_security_threat
        }
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('AIAnomalyDetector')
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize anomaly detection database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # System anomalies table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS system_anomalies (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        anomaly_id TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        anomaly_type TEXT,
                        severity TEXT,
                        description TEXT,
                        affected_components TEXT,
                        root_cause TEXT,
                        mitigation_applied BOOLEAN,
                        resolution_status TEXT
                    )
                ''')
                
                # Security threats table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS security_threats (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        threat_id TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        threat_type TEXT,
                        severity TEXT,
                        source TEXT,
                        target_component TEXT,
                        confidence REAL,
                        mitigation_status TEXT
                    )
                ''')
                
                # System health table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS system_health (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        cpu_usage REAL,
                        memory_usage REAL,
                        gpu_usage REAL,
                        prediction_throughput REAL,
                        error_rate REAL,
                        health_score REAL
                    )
                ''')
                
                conn.commit()
                self.logger.info("AI anomaly detection database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def start_monitoring(self):
        """Start anomaly monitoring"""
        if self.monitoring_active:
            self.logger.warning("Monitoring already active")
            return
        
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        self.logger.info("AI anomaly monitoring started")
    
    def stop_monitoring(self):
        """Stop anomaly monitoring"""
        self.monitoring_active = False
        self.logger.info("AI anomaly monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                # Collect system health metrics
                health_metrics = self._collect_system_health()
                
                # Store health metrics
                self._store_system_health(health_metrics)
                
                # Analyze for anomalies
                self._analyze_system_health(health_metrics)
                
                # Sleep before next iteration
                time.sleep(30)  # Monitor every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)
    
    def _collect_system_health(self) -> SystemHealthMetrics:
        """Collect current system health metrics"""
        try:
            # Get system metrics
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Get disk I/O
            disk_io = psutil.disk_io_counters()
            disk_io_percent = 0.0  # Simplified
            
            # Get network I/O
            net_io = psutil.net_io_counters()
            network_io_percent = 0.0  # Simplified
            
            # Simulate AI-specific metrics
            model_inference_time = np.random.normal(0.05, 0.01)  # Simulated
            prediction_throughput = np.random.normal(100, 10)    # Simulated
            queue_depth = np.random.randint(0, 50)              # Simulated
            error_rate = np.random.exponential(0.01)            # Simulated
            
            return SystemHealthMetrics(
                timestamp=datetime.now().isoformat(),
                cpu_usage=cpu_usage,
                memory_usage=memory.percent,
                gpu_usage=0.0,  # Would need nvidia-ml-py for real GPU monitoring
                disk_io=disk_io_percent,
                network_io=network_io_percent,
                model_inference_time=model_inference_time,
                prediction_throughput=prediction_throughput,
                queue_depth=queue_depth,
                error_rate=error_rate
            )
            
        except Exception as e:
            self.logger.error(f"Error collecting system health: {e}")
            return SystemHealthMetrics(
                timestamp=datetime.now().isoformat(),
                cpu_usage=0, memory_usage=0, gpu_usage=0,
                disk_io=0, network_io=0, model_inference_time=0,
                prediction_throughput=0, queue_depth=0, error_rate=0
            )
    
    def _store_system_health(self, health_metrics: SystemHealthMetrics):
        """Store system health metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                health_score = self._calculate_health_score(health_metrics)
                
                cursor.execute('''
                    INSERT INTO system_health (
                        timestamp, cpu_usage, memory_usage, gpu_usage,
                        prediction_throughput, error_rate, health_score
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    health_metrics.timestamp,
                    health_metrics.cpu_usage,
                    health_metrics.memory_usage,
                    health_metrics.gpu_usage,
                    health_metrics.prediction_throughput,
                    health_metrics.error_rate,
                    health_score
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing system health: {e}")
    
    def _calculate_health_score(self, health_metrics: SystemHealthMetrics) -> float:
        """Calculate overall system health score (0-1)"""
        try:
            # Normalize metrics to 0-1 scale
            cpu_score = max(0, 1 - health_metrics.cpu_usage / 100)
            memory_score = max(0, 1 - health_metrics.memory_usage / 100)
            latency_score = max(0, 1 - health_metrics.model_inference_time / 1.0)  # 1s max
            throughput_score = min(1, health_metrics.prediction_throughput / 200)  # 200 pred/s max
            error_score = max(0, 1 - health_metrics.error_rate / 0.1)  # 10% max error rate
            
            # Weighted average
            health_score = (
                0.2 * cpu_score +
                0.2 * memory_score +
                0.2 * latency_score +
                0.2 * throughput_score +
                0.2 * error_score
            )
            
            return float(health_score)
            
        except Exception as e:
            self.logger.error(f"Error calculating health score: {e}")
            return 0.5
    
    def _analyze_system_health(self, health_metrics: SystemHealthMetrics):
        """Analyze system health for anomalies"""
        try:
            # Add to history
            self.system_health_history.append(health_metrics)
            
            # Check for anomalies
            anomalies = []
            
            # High resource usage
            if health_metrics.cpu_usage > 90:
                anomalies.append(self._create_anomaly(
                    'high_cpu_usage', 'high',
                    f"CPU usage at {health_metrics.cpu_usage:.1f}%",
                    ['inference_engine']
                ))
            
            if health_metrics.memory_usage > 90:
                anomalies.append(self._create_anomaly(
                    'high_memory_usage', 'high',
                    f"Memory usage at {health_metrics.memory_usage:.1f}%",
                    ['inference_engine']
                ))
            
            # High latency
            if health_metrics.model_inference_time > 0.5:  # 500ms
                anomalies.append(self._create_anomaly(
                    'high_latency', 'medium',
                    f"Model inference time at {health_metrics.model_inference_time:.3f}s",
                    ['model', 'inference_engine']
                ))
            
            # Low throughput
            if health_metrics.prediction_throughput < 50:  # Less than 50 pred/s
                anomalies.append(self._create_anomaly(
                    'low_throughput', 'medium',
                    f"Prediction throughput at {health_metrics.prediction_throughput:.1f} pred/s",
                    ['inference_engine']
                ))
            
            # High error rate
            if health_metrics.error_rate > 0.05:  # More than 5% errors
                anomalies.append(self._create_anomaly(
                    'high_error_rate', 'high',
                    f"Error rate at {health_metrics.error_rate:.3f}",
                    ['model', 'data_pipeline']
                ))
            
            # Process detected anomalies
            for anomaly in anomalies:
                self._handle_detected_anomaly(anomaly, health_metrics)
                
        except Exception as e:
            self.logger.error(f"Error analyzing system health: {e}")
    
    def _create_anomaly(self, anomaly_type: str, severity: str, description: str, components: List[str]) -> AISystemAnomaly:
        """Create anomaly object"""
        return AISystemAnomaly(
            anomaly_id=f"{anomaly_type}_{int(time.time())}_{hash(description) % 10000}",
            timestamp=datetime.now().isoformat(),
            anomaly_type=anomaly_type,
            severity=severity,
            description=description,
            affected_components=components,
            metrics_snapshot={},
            root_cause_analysis={},
            recommended_actions=[],
            auto_mitigation_applied=False
        )
    
    def _handle_detected_anomaly(self, anomaly: AISystemAnomaly, health_metrics: SystemHealthMetrics):
        """Handle a detected anomaly"""
        try:
            # Perform root cause analysis
            system_metrics = asdict(health_metrics)
            root_cause_analysis = self.root_cause_analyzer.analyze_anomaly(anomaly, system_metrics)
            
            # Update anomaly with analysis
            anomaly.root_cause_analysis = root_cause_analysis
            anomaly.recommended_actions = root_cause_analysis.get('recommended_actions', [])
            anomaly.metrics_snapshot = system_metrics
            
            # Store anomaly
            self._store_anomaly(anomaly)
            
            # Add to detected anomalies
            self.detected_anomalies.append(anomaly)
            
            # Apply auto-mitigation if enabled
            if self.auto_mitigation_enabled and anomaly.severity in ['high', 'critical']:
                mitigation_applied = self._apply_auto_mitigation(anomaly)
                anomaly.auto_mitigation_applied = mitigation_applied
            
            self.logger.warning(f"Anomaly detected: {anomaly.description}")
            
        except Exception as e:
            self.logger.error(f"Error handling anomaly: {e}")
    
    def _store_anomaly(self, anomaly: AISystemAnomaly):
        """Store anomaly in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO system_anomalies (
                        anomaly_id, timestamp, anomaly_type, severity, description,
                        affected_components, root_cause, mitigation_applied, resolution_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    anomaly.anomaly_id,
                    anomaly.timestamp,
                    anomaly.anomaly_type,
                    anomaly.severity,
                    anomaly.description,
                    json.dumps(anomaly.affected_components),
                    anomaly.root_cause_analysis.get('root_cause', 'unknown'),
                    anomaly.auto_mitigation_applied,
                    'open'
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing anomaly: {e}")
    
    def _apply_auto_mitigation(self, anomaly: AISystemAnomaly) -> bool:
        """Apply automatic mitigation for anomaly"""
        try:
            mitigation_method = self.mitigation_actions.get(anomaly.anomaly_type)
            if mitigation_method:
                return mitigation_method(anomaly)
            else:
                self.logger.info(f"No auto-mitigation available for {anomaly.anomaly_type}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error applying auto-mitigation: {e}")
            return False
    
    def _mitigate_latency_spike(self, anomaly: AISystemAnomaly) -> bool:
        """Mitigate latency spike"""
        # Example mitigation actions
        self.logger.info("Applying latency spike mitigation:")
        self.logger.info("- Reducing model complexity temporarily")
        self.logger.info("- Enabling request queuing")
        self.logger.info("- Scaling up inference resources")
        return True
    
    def _mitigate_resource_exhaustion(self, anomaly: AISystemAnomaly) -> bool:
        """Mitigate resource exhaustion"""
        self.logger.info("Applying resource exhaustion mitigation:")
        self.logger.info("- Implementing rate limiting")
        self.logger.info("- Scaling up system resources")
        self.logger.info("- Enabling load balancing")
        return True
    
    def _mitigate_security_threat(self, anomaly: AISystemAnomaly) -> bool:
        """Mitigate security threat"""
        self.logger.info("Applying security threat mitigation:")
        self.logger.info("- Blocking suspicious sources")
        self.logger.info("- Enabling enhanced monitoring")
        self.logger.info("- Alerting security team")
        return True
    
    def process_model_prediction(self, 
                                features: np.ndarray, 
                                prediction: int, 
                                confidence: float,
                                latency: float,
                                source_ip: str = 'unknown') -> Dict[str, Any]:
        """Process a model prediction for anomaly detection"""
        try:
            # Add to performance monitoring
            self.performance_monitor.add_performance_metrics(
                accuracy=1.0,  # Would be calculated from validation data
                latency=latency,
                confidence=confidence,
                prediction=prediction
            )
            
            # Validate data quality
            feature_names = [f'feature_{i}' for i in range(len(features.flatten()))]
            data_validation = self.pipeline_monitor.validate_data_sample(features, feature_names)
            
            # Check for security threats
            request_info = {
                'features': features.flatten().tolist(),
                'confidence_score': confidence,
                'processing_time': latency,
                'source_ip': source_ip,
                'timestamp': datetime.now().isoformat()
            }
            
            security_threat = self.security_detector.analyze_request_pattern(request_info)
            if security_threat:
                self.security_threats.append(security_threat)
                self._store_security_threat(security_threat)
            
            return {
                'prediction_processed': True,
                'data_quality': data_validation,
                'security_threat_detected': security_threat is not None,
                'anomalies_detected': len(self.detected_anomalies),
                'system_health': self._get_current_health_summary()
            }
            
        except Exception as e:
            self.logger.error(f"Error processing model prediction: {e}")
            return {'prediction_processed': False, 'error': str(e)}
    
    def _store_security_threat(self, threat: SecurityThreat):
        """Store security threat in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO security_threats (
                        threat_id, timestamp, threat_type, severity, source,
                        target_component, confidence, mitigation_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    threat.threat_id,
                    threat.timestamp,
                    threat.threat_type,
                    threat.severity,
                    threat.source,
                    threat.target_component,
                    threat.confidence,
                    threat.mitigation_status
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing security threat: {e}")
    
    def _get_current_health_summary(self) -> Dict[str, Any]:
        """Get current system health summary"""
        if not self.system_health_history:
            return {'status': 'unknown'}
        
        latest_health = self.system_health_history[-1]
        health_score = self._calculate_health_score(latest_health)
        
        if health_score > 0.8:
            status = 'healthy'
        elif health_score > 0.6:
            status = 'warning'
        else:
            status = 'critical'
        
        return {
            'status': status,
            'health_score': health_score,
            'cpu_usage': latest_health.cpu_usage,
            'memory_usage': latest_health.memory_usage,
            'prediction_throughput': latest_health.prediction_throughput,
            'error_rate': latest_health.error_rate
        }
    
    def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data"""
        try:
            # Get recent anomalies
            recent_anomalies = [a for a in self.detected_anomalies 
                               if datetime.fromisoformat(a.timestamp) > datetime.now() - timedelta(hours=24)]
            
            # Get performance summary
            performance_summary = self.performance_monitor.get_anomaly_summary()
            
            # Get pipeline health
            pipeline_health = self.pipeline_monitor.get_pipeline_health()
            
            # Get security summary
            security_summary = self.security_detector.get_security_summary()
            
            # Get system health
            health_summary = self._get_current_health_summary()
            
            return {
                'monitoring_status': 'active' if self.monitoring_active else 'inactive',
                'system_health': health_summary,
                'recent_anomalies': [asdict(a) for a in recent_anomalies],
                'performance_monitoring': performance_summary,
                'pipeline_health': pipeline_health,
                'security_monitoring': security_summary,
                'auto_mitigation_enabled': self.auto_mitigation_enabled,
                'dashboard_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}

def main():
    """Main function for testing AI anomaly detection"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Anomaly Detector')
    parser.add_argument('--db-path', default='./data/ai_anomaly_detection.db', help='Database path')
    parser.add_argument('--duration', type=int, default=0, help='Run duration in seconds (0 = infinite)')
    parser.add_argument('--simulate', action='store_true', help='Simulate predictions for testing')
    
    args = parser.parse_args()
    
    # Create detector
    detector = AIAnomalyDetector(db_path=args.db_path)
    
    try:
        # Start monitoring
        detector.start_monitoring()
        
        # Simulate predictions if requested
        if args.simulate:
            def simulate_predictions():
                feature_names = [f'feature_{i}' for i in range(20)]
                
                while detector.monitoring_active:
                    # Generate random prediction
                    features = np.random.normal(0, 1, 20)
                    prediction = np.random.choice([0, 1])
                    confidence = np.random.uniform(0.3, 0.95)
                    latency = np.random.exponential(0.05)
                    
                    # Occasionally inject anomalies
                    if np.random.random() < 0.1:  # 10% chance
                        latency *= 10  # Simulate latency spike
                    
                    # Process prediction
                    result = detector.process_model_prediction(
                        features, prediction, confidence, latency, 
                        f"192.168.1.{np.random.randint(1, 255)}"
                    )
                    
                    time.sleep(1)  # One prediction per second
            
            sim_thread = threading.Thread(target=simulate_predictions, daemon=True)
            sim_thread.start()
        
        if args.duration > 0:
            time.sleep(args.duration)
        else:
            # Interactive mode
            while True:
                command = input("\nEnter command (status/dashboard/exit): ").strip().lower()
                
                if command == 'exit':
                    break
                elif command == 'status':
                    health = detector._get_current_health_summary()
                    print(f"\n--- System Status ---")
                    print(f"Health Status: {health.get('status', 'unknown')}")
                    print(f"Health Score: {health.get('health_score', 0):.3f}")
                    print(f"CPU Usage: {health.get('cpu_usage', 0):.1f}%")
                    print(f"Memory Usage: {health.get('memory_usage', 0):.1f}%")
                    print(f"Anomalies Detected: {len(detector.detected_anomalies)}")
                    print(f"Security Threats: {len(detector.security_threats)}")
                elif command == 'dashboard':
                    dashboard_data = detector.get_monitoring_dashboard_data()
                    print(f"\n--- Dashboard Summary ---")
                    print(f"Monitoring: {dashboard_data.get('monitoring_status', 'unknown')}")
                    print(f"System Health: {dashboard_data.get('system_health', {}).get('status', 'unknown')}")
                    print(f"Recent Anomalies: {len(dashboard_data.get('recent_anomalies', []))}")
                    print(f"Security Threats (24h): {dashboard_data.get('security_monitoring', {}).get('threats_last_24h', 0)}")
                else:
                    print("Unknown command. Use: status, dashboard, or exit")
                    
    except KeyboardInterrupt:
        print("\nStopping AI anomaly detection...")
    finally:
        detector.stop_monitoring()

if __name__ == "__main__":
    main()