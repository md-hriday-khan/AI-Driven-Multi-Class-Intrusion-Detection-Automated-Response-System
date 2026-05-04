#!/usr/bin/env python3
"""
Intrusion Prevention System (IPS) for SHIELD SOC
Real-time traffic analysis and automated threat blocking
Created by Md.Hriday Khan
"""

import asyncio
import aiohttp
import numpy as np
import pandas as pd
import json
import sqlite3
import logging
import time
import threading
import hashlib
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import socket
import struct
import scapy.all as scapy
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.l2 import Ether
import subprocess
import psutil
import requests
import websockets
import pickle
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import tensorflow as tf

@dataclass
class NetworkPacket:
    """Network packet information"""
    timestamp: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    packet_size: int
    flags: List[str]
    payload_size: int
    ttl: int
    window_size: int
    packet_id: str
    is_fragment: bool
    fragment_offset: int

@dataclass
class ThreatDetection:
    """Detected threat information"""
    detection_id: str
    timestamp: str
    threat_type: str  # malware, dos, port_scan, brute_force, data_exfiltration
    severity: str  # low, medium, high, critical
    confidence: float
    source_ip: str
    target_ip: str
    attack_vector: str
    indicators: List[str]
    packet_info: NetworkPacket
    mitigation_action: str
    blocked: bool
    false_positive_risk: float

@dataclass
class BlockingRule:
    """IPS blocking rule"""
    rule_id: str
    rule_type: str  # ip_block, port_block, pattern_block, rate_limit
    criteria: Dict[str, Any]
    action: str  # block, allow, monitor, rate_limit
    duration: int  # seconds, -1 for permanent
    created_at: str
    expires_at: Optional[str]
    hit_count: int
    last_triggered: Optional[str]

@dataclass
class IPSMetrics:
    """IPS performance metrics"""
    timestamp: str
    packets_analyzed: int
    threats_detected: int
    threats_blocked: int
    false_positives: int
    processing_latency: float
    throughput_mbps: float
    cpu_usage: float
    memory_usage: float
    active_rules: int
    blocked_ips: int

class PacketAnalyzer:
    """Analyzes network packets for threats"""
    
    def __init__(self):
        self.ml_models = {}
        self.feature_extractors = {}
        self.threat_signatures = self._load_threat_signatures()
        self.behavioral_baselines = {}
        self.anomaly_detectors = {}
        
        # Initialize ML models
        self._initialize_ml_models()
        
        # Traffic statistics
        self.traffic_stats = defaultdict(lambda: defaultdict(int))
        self.connection_tracking = {}
        
    def _load_threat_signatures(self) -> Dict[str, Any]:
        """Load known threat signatures"""
        return {
            'malware_patterns': [
                b'\x4d\x5a\x90\x00',  # PE header
                b'cmd.exe',
                b'powershell.exe',
                b'/bin/sh',
                b'wget',
                b'curl'
            ],
            'exploit_patterns': [
                b'../../../',  # Directory traversal
                b'<script>',   # XSS
                b'UNION SELECT',  # SQL injection
                b'\x90\x90\x90\x90',  # NOP sled
            ],
            'c2_patterns': [
                b'heartbeat',
                b'beacon',
                b'checkin',
                b'callback'
            ]
        }
    
    def _initialize_ml_models(self):
        """Initialize machine learning models"""
        try:
            # DDoS detection model
            self.ml_models['ddos'] = RandomForestClassifier(n_estimators=100, random_state=42)
            self.anomaly_detectors['ddos'] = IsolationForest(contamination=0.1, random_state=42)
            
            # Port scan detection model
            self.ml_models['port_scan'] = RandomForestClassifier(n_estimators=50, random_state=42)
            self.anomaly_detectors['port_scan'] = IsolationForest(contamination=0.05, random_state=42)
            
            # Data exfiltration model
            self.ml_models['exfiltration'] = RandomForestClassifier(n_estimators=75, random_state=42)
            
            # Generate synthetic training data for initialization
            self._train_models_with_synthetic_data()
            
            logging.info("ML models initialized successfully")
            
        except Exception as e:
            logging.error(f"Error initializing ML models: {e}")
    
    def _train_models_with_synthetic_data(self):
        """Train models with synthetic data for demonstration"""
        # Generate synthetic DDoS training data
        normal_ddos = np.random.normal(0, 1, (1000, 10))
        attack_ddos = np.random.normal(3, 2, (200, 10))
        ddos_X = np.vstack([normal_ddos, attack_ddos])
        ddos_y = np.hstack([np.zeros(1000), np.ones(200)])
        
        self.ml_models['ddos'].fit(ddos_X, ddos_y)
        self.anomaly_detectors['ddos'].fit(normal_ddos)
        
        # Generate synthetic port scan training data
        normal_scan = np.random.normal(1, 0.5, (1000, 8))
        attack_scan = np.random.normal(5, 1, (150, 8))
        scan_X = np.vstack([normal_scan, attack_scan])
        scan_y = np.hstack([np.zeros(1000), np.ones(150)])
        
        self.ml_models['port_scan'].fit(scan_X, scan_y)
        self.anomaly_detectors['port_scan'].fit(normal_scan)
        
        # Generate synthetic exfiltration training data
        normal_exfil = np.random.normal(0.5, 0.2, (1000, 12))
        attack_exfil = np.random.normal(2, 0.8, (100, 12))
        exfil_X = np.vstack([normal_exfil, attack_exfil])
        exfil_y = np.hstack([np.zeros(1000), np.ones(100)])
        
        self.ml_models['exfiltration'].fit(exfil_X, exfil_y)
    
    def analyze_packet(self, packet: NetworkPacket) -> List[ThreatDetection]:
        """Analyze a single packet for threats"""
        detections = []
        
        try:
            # Signature-based detection
            signature_threats = self._detect_signature_threats(packet)
            detections.extend(signature_threats)
            
            # Behavioral analysis
            behavioral_threats = self._detect_behavioral_anomalies(packet)
            detections.extend(behavioral_threats)
            
            # ML-based detection
            ml_threats = self._detect_ml_threats(packet)
            detections.extend(ml_threats)
            
            # Update traffic statistics
            self._update_traffic_stats(packet)
            
        except Exception as e:
            logging.error(f"Error analyzing packet {packet.packet_id}: {e}")
        
        return detections
    
    def _detect_signature_threats(self, packet: NetworkPacket) -> List[ThreatDetection]:
        """Detect threats using signature matching"""
        detections = []
        
        # Mock payload analysis (in real implementation, would analyze actual packet payload)
        mock_payload = f"{packet.src_ip}:{packet.src_port}->{packet.dst_ip}:{packet.dst_port}".encode()
        
        for threat_type, patterns in self.threat_signatures.items():
            for pattern in patterns:
                if pattern in mock_payload or self._simulate_pattern_match(packet, pattern):
                    detection = ThreatDetection(
                        detection_id=f"sig_{int(time.time())}_{hash(packet.packet_id) % 10000}",
                        timestamp=packet.timestamp,
                        threat_type=threat_type.replace('_patterns', ''),
                        severity=self._calculate_severity(threat_type),
                        confidence=0.85,
                        source_ip=packet.src_ip,
                        target_ip=packet.dst_ip,
                        attack_vector='signature_match',
                        indicators=[f"Pattern: {pattern.hex()[:20]}"],
                        packet_info=packet,
                        mitigation_action='block_ip',
                        blocked=False,
                        false_positive_risk=0.1
                    )
                    detections.append(detection)
                    break
        
        return detections
    
    def _simulate_pattern_match(self, packet: NetworkPacket, pattern: bytes) -> bool:
        """Simulate pattern matching for demonstration"""
        # Simulate based on packet characteristics
        if b'cmd.exe' in pattern and packet.dst_port in [445, 139]:  # SMB ports
            return np.random.random() > 0.9
        elif b'<script>' in pattern and packet.dst_port == 80:  # HTTP
            return np.random.random() > 0.95
        elif b'UNION SELECT' in pattern and packet.dst_port in [3306, 1433, 5432]:  # DB ports
            return np.random.random() > 0.92
        return False
    
    def _detect_behavioral_anomalies(self, packet: NetworkPacket) -> List[ThreatDetection]:
        """Detect behavioral anomalies"""
        detections = []
        
        # Port scanning detection
        if self._is_port_scanning(packet):
            detection = ThreatDetection(
                detection_id=f"bhv_{int(time.time())}_{hash(packet.packet_id) % 10000}",
                timestamp=packet.timestamp,
                threat_type='port_scan',
                severity='medium',
                confidence=0.75,
                source_ip=packet.src_ip,
                target_ip=packet.dst_ip,
                attack_vector='port_scanning',
                indicators=['Multiple port connections', 'Sequential port access'],
                packet_info=packet,
                mitigation_action='rate_limit',
                blocked=False,
                false_positive_risk=0.2
            )
            detections.append(detection)
        
        # DDoS detection
        if self._is_ddos_attack(packet):
            detection = ThreatDetection(
                detection_id=f"ddos_{int(time.time())}_{hash(packet.packet_id) % 10000}",
                timestamp=packet.timestamp,
                threat_type='ddos',
                severity='high',
                confidence=0.8,
                source_ip=packet.src_ip,
                target_ip=packet.dst_ip,
                attack_vector='volume_attack',
                indicators=['High packet rate', 'Multiple sources'],
                packet_info=packet,
                mitigation_action='block_ip',
                blocked=False,
                false_positive_risk=0.15
            )
            detections.append(detection)
        
        return detections
    
    def _is_port_scanning(self, packet: NetworkPacket) -> bool:
        """Detect port scanning behavior"""
        src_key = packet.src_ip
        current_time = time.time()
        
        # Track connection attempts per source IP
        if src_key not in self.connection_tracking:
            self.connection_tracking[src_key] = {
                'ports': set(),
                'first_seen': current_time,
                'last_seen': current_time,
                'packet_count': 0
            }
        
        tracking = self.connection_tracking[src_key]
        tracking['ports'].add(packet.dst_port)
        tracking['last_seen'] = current_time
        tracking['packet_count'] += 1
        
        # Cleanup old entries (older than 5 minutes)
        if current_time - tracking['first_seen'] > 300:
            if src_key in self.connection_tracking:
                del self.connection_tracking[src_key]
            return False
        
        # Port scan detection criteria
        time_window = tracking['last_seen'] - tracking['first_seen']
        unique_ports = len(tracking['ports'])
        
        # More than 10 unique ports in less than 60 seconds
        if unique_ports > 10 and time_window < 60:
            return True
        
        # More than 20 unique ports in less than 300 seconds
        if unique_ports > 20 and time_window < 300:
            return True
        
        return False
    
    def _is_ddos_attack(self, packet: NetworkPacket) -> bool:
        """Detect DDoS attack patterns"""
        dst_key = packet.dst_ip
        current_time = time.time()
        
        # Track packets per destination
        if dst_key not in self.traffic_stats:
            self.traffic_stats[dst_key] = defaultdict(int)
        
        # Count packets in last 10 seconds
        window_start = int(current_time) - 10
        recent_count = sum(self.traffic_stats[dst_key][t] for t in range(window_start, int(current_time) + 1))
        
        # Update current second count
        self.traffic_stats[dst_key][int(current_time)] += 1
        
        # DDoS threshold: more than 100 packets per 10 seconds to same destination
        return recent_count > 100
    
    def _detect_ml_threats(self, packet: NetworkPacket) -> List[ThreatDetection]:
        """Use ML models to detect threats"""
        detections = []
        
        try:
            # Extract features for ML models
            features = self._extract_packet_features(packet)
            
            # DDoS detection
            if 'ddos' in self.ml_models:
                ddos_features = features[:10]  # First 10 features for DDoS
                ddos_prediction = self.ml_models['ddos'].predict([ddos_features])[0]
                ddos_confidence = self.ml_models['ddos'].predict_proba([ddos_features])[0].max()
                
                if ddos_prediction == 1 and ddos_confidence > 0.7:
                    detection = ThreatDetection(
                        detection_id=f"ml_ddos_{int(time.time())}_{hash(packet.packet_id) % 10000}",
                        timestamp=packet.timestamp,
                        threat_type='ddos',
                        severity='high',
                        confidence=ddos_confidence,
                        source_ip=packet.src_ip,
                        target_ip=packet.dst_ip,
                        attack_vector='ml_detection',
                        indicators=['ML model prediction', f'Confidence: {ddos_confidence:.3f}'],
                        packet_info=packet,
                        mitigation_action='block_ip',
                        blocked=False,
                        false_positive_risk=1.0 - ddos_confidence
                    )
                    detections.append(detection)
            
            # Port scan detection
            if 'port_scan' in self.ml_models:
                scan_features = features[:8]  # First 8 features for port scan
                scan_prediction = self.ml_models['port_scan'].predict([scan_features])[0]
                scan_confidence = self.ml_models['port_scan'].predict_proba([scan_features])[0].max()
                
                if scan_prediction == 1 and scan_confidence > 0.6:
                    detection = ThreatDetection(
                        detection_id=f"ml_scan_{int(time.time())}_{hash(packet.packet_id) % 10000}",
                        timestamp=packet.timestamp,
                        threat_type='port_scan',
                        severity='medium',
                        confidence=scan_confidence,
                        source_ip=packet.src_ip,
                        target_ip=packet.dst_ip,
                        attack_vector='ml_detection',
                        indicators=['ML scan detection', f'Confidence: {scan_confidence:.3f}'],
                        packet_info=packet,
                        mitigation_action='rate_limit',
                        blocked=False,
                        false_positive_risk=1.0 - scan_confidence
                    )
                    detections.append(detection)
            
        except Exception as e:
            logging.error(f"Error in ML threat detection: {e}")
        
        return detections
    
    def _extract_packet_features(self, packet: NetworkPacket) -> List[float]:
        """Extract numerical features from packet for ML models"""
        features = []
        
        # Basic packet features
        features.append(packet.packet_size)
        features.append(packet.payload_size)
        features.append(packet.src_port)
        features.append(packet.dst_port)
        features.append(packet.ttl)
        features.append(packet.window_size)
        features.append(float(packet.is_fragment))
        features.append(packet.fragment_offset)
        
        # Protocol encoding
        protocol_map = {'TCP': 1, 'UDP': 2, 'ICMP': 3}
        features.append(protocol_map.get(packet.protocol, 0))
        
        # Time-based features
        hour = datetime.fromisoformat(packet.timestamp).hour
        features.append(hour)
        
        # IP-based features (simplified)
        try:
            src_ip_obj = ipaddress.ip_address(packet.src_ip)
            dst_ip_obj = ipaddress.ip_address(packet.dst_ip)
            features.append(float(src_ip_obj.is_private))
            features.append(float(dst_ip_obj.is_private))
        except:
            features.extend([0.0, 0.0])
        
        # Pad or truncate to ensure consistent feature count
        while len(features) < 15:
            features.append(0.0)
        
        return features[:15]
    
    def _calculate_severity(self, threat_type: str) -> str:
        """Calculate threat severity"""
        severity_map = {
            'malware': 'critical',
            'exploit': 'high',
            'c2': 'high',
            'ddos': 'high',
            'port_scan': 'medium',
            'brute_force': 'medium',
            'data_exfiltration': 'critical'
        }
        return severity_map.get(threat_type, 'low')
    
    def _update_traffic_stats(self, packet: NetworkPacket):
        """Update traffic statistics"""
        current_second = int(time.time())
        
        # Update per-IP statistics
        self.traffic_stats[packet.src_ip]['packets'] += 1
        self.traffic_stats[packet.src_ip]['bytes'] += packet.packet_size
        
        # Cleanup old statistics (keep only last 5 minutes)
        cutoff_time = current_second - 300
        for ip in list(self.traffic_stats.keys()):
            self.traffic_stats[ip] = {
                k: v for k, v in self.traffic_stats[ip].items()
                if isinstance(k, int) and k > cutoff_time or not isinstance(k, int)
            }

class ThreatMitigator:
    """Handles threat mitigation and blocking"""
    
    def __init__(self):
        self.active_rules = {}
        self.blocked_ips = set()
        self.rate_limits = defaultdict(dict)
        self.mitigation_stats = defaultdict(int)
        
    def apply_mitigation(self, detection: ThreatDetection) -> bool:
        """Apply mitigation action for detected threat"""
        try:
            if detection.mitigation_action == 'block_ip':
                return self._block_ip(detection.source_ip, detection.threat_type)
            elif detection.mitigation_action == 'rate_limit':
                return self._apply_rate_limit(detection.source_ip, detection.threat_type)
            elif detection.mitigation_action == 'monitor':
                return self._add_monitoring(detection.source_ip, detection.threat_type)
            else:
                logging.warning(f"Unknown mitigation action: {detection.mitigation_action}")
                return False
                
        except Exception as e:
            logging.error(f"Error applying mitigation: {e}")
            return False
    
    def _block_ip(self, ip_address: str, threat_type: str) -> bool:
        """Block an IP address"""
        try:
            # Add to blocked IPs set
            self.blocked_ips.add(ip_address)
            
            # Create blocking rule
            rule = BlockingRule(
                rule_id=f"block_{ip_address}_{int(time.time())}",
                rule_type='ip_block',
                criteria={'ip_address': ip_address, 'threat_type': threat_type},
                action='block',
                duration=3600,  # 1 hour
                created_at=datetime.now().isoformat(),
                expires_at=(datetime.now() + timedelta(hours=1)).isoformat(),
                hit_count=0,
                last_triggered=None
            )
            
            self.active_rules[rule.rule_id] = rule
            
            # In real implementation, would interface with firewall/router
            # For now, simulate blocking
            logging.warning(f"BLOCKED IP: {ip_address} for {threat_type}")
            
            self.mitigation_stats['ips_blocked'] += 1
            return True
            
        except Exception as e:
            logging.error(f"Error blocking IP {ip_address}: {e}")
            return False
    
    def _apply_rate_limit(self, ip_address: str, threat_type: str) -> bool:
        """Apply rate limiting to an IP address"""
        try:
            # Set rate limit (e.g., 10 packets per second)
            self.rate_limits[ip_address] = {
                'max_packets': 10,
                'time_window': 1,
                'current_count': 0,
                'window_start': time.time(),
                'threat_type': threat_type
            }
            
            # Create rate limit rule
            rule = BlockingRule(
                rule_id=f"rate_limit_{ip_address}_{int(time.time())}",
                rule_type='rate_limit',
                criteria={'ip_address': ip_address, 'max_packets': 10, 'time_window': 1},
                action='rate_limit',
                duration=1800,  # 30 minutes
                created_at=datetime.now().isoformat(),
                expires_at=(datetime.now() + timedelta(minutes=30)).isoformat(),
                hit_count=0,
                last_triggered=None
            )
            
            self.active_rules[rule.rule_id] = rule
            
            logging.info(f"RATE LIMITED: {ip_address} for {threat_type}")
            self.mitigation_stats['rate_limits_applied'] += 1
            return True
            
        except Exception as e:
            logging.error(f"Error applying rate limit to {ip_address}: {e}")
            return False
    
    def _add_monitoring(self, ip_address: str, threat_type: str) -> bool:
        """Add enhanced monitoring for an IP address"""
        try:
            # Create monitoring rule
            rule = BlockingRule(
                rule_id=f"monitor_{ip_address}_{int(time.time())}",
                rule_type='monitor',
                criteria={'ip_address': ip_address, 'threat_type': threat_type},
                action='monitor',
                duration=7200,  # 2 hours
                created_at=datetime.now().isoformat(),
                expires_at=(datetime.now() + timedelta(hours=2)).isoformat(),
                hit_count=0,
                last_triggered=None
            )
            
            self.active_rules[rule.rule_id] = rule
            
            logging.info(f"MONITORING: {ip_address} for {threat_type}")
            self.mitigation_stats['monitoring_added'] += 1
            return True
            
        except Exception as e:
            logging.error(f"Error adding monitoring for {ip_address}: {e}")
            return False
    
    def is_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked"""
        return ip_address in self.blocked_ips
    
    def check_rate_limit(self, ip_address: str) -> bool:
        """Check if IP is within rate limits"""
        if ip_address not in self.rate_limits:
            return True
        
        rate_limit = self.rate_limits[ip_address]
        current_time = time.time()
        
        # Reset window if expired
        if current_time - rate_limit['window_start'] > rate_limit['time_window']:
            rate_limit['current_count'] = 0
            rate_limit['window_start'] = current_time
        
        # Check if within limits
        if rate_limit['current_count'] < rate_limit['max_packets']:
            rate_limit['current_count'] += 1
            return True
        else:
            return False
    
    def cleanup_expired_rules(self):
        """Remove expired blocking rules"""
        current_time = datetime.now()
        expired_rules = []
        
        for rule_id, rule in self.active_rules.items():
            if rule.expires_at and datetime.fromisoformat(rule.expires_at) < current_time:
                expired_rules.append(rule_id)
                
                # Remove from blocked IPs if it's an IP block rule
                if rule.rule_type == 'ip_block' and 'ip_address' in rule.criteria:
                    self.blocked_ips.discard(rule.criteria['ip_address'])
                
                # Remove from rate limits
                if rule.rule_type == 'rate_limit' and 'ip_address' in rule.criteria:
                    self.rate_limits.pop(rule.criteria['ip_address'], None)
        
        # Remove expired rules
        for rule_id in expired_rules:
            del self.active_rules[rule_id]
        
        if expired_rules:
            logging.info(f"Cleaned up {len(expired_rules)} expired rules")

class IntrusionPreventionSystem:
    """Main IPS system coordinating all components"""
    
    def __init__(self, db_path: str = './data/ips_system.db'):
        self.db_path = db_path
        self.analyzer = PacketAnalyzer()
        self.mitigator = ThreatMitigator()
        
        # System state
        self.is_active = True
        self.monitoring_interfaces = []
        self.detection_count = 0
        self.blocked_count = 0
        self.processed_packets = 0
        
        # Performance metrics
        self.metrics_history = deque(maxlen=1000)
        self.start_time = time.time()
        
        # WebSocket connections for real-time updates
        self.websocket_clients = set()
        
        # Initialize database
        self._init_database()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('IntrusionPreventionSystem')
        
        # Start background tasks
        self._start_background_tasks()
    
    def _init_database(self):
        """Initialize IPS database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Threat detections table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS threat_detections (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        detection_id TEXT UNIQUE NOT NULL,
                        timestamp TEXT NOT NULL,
                        threat_type TEXT,
                        severity TEXT,
                        confidence REAL,
                        source_ip TEXT,
                        target_ip TEXT,
                        attack_vector TEXT,
                        indicators TEXT,
                        mitigation_action TEXT,
                        blocked BOOLEAN,
                        false_positive_risk REAL,
                        packet_info TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Blocking rules table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS blocking_rules (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        rule_id TEXT UNIQUE NOT NULL,
                        rule_type TEXT,
                        criteria TEXT,
                        action TEXT,
                        duration INTEGER,
                        created_at TEXT,
                        expires_at TEXT,
                        hit_count INTEGER,
                        last_triggered TEXT,
                        status TEXT DEFAULT 'active'
                    )
                ''')
                
                # IPS metrics table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS ips_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        packets_analyzed INTEGER,
                        threats_detected INTEGER,
                        threats_blocked INTEGER,
                        false_positives INTEGER,
                        processing_latency REAL,
                        throughput_mbps REAL,
                        cpu_usage REAL,
                        memory_usage REAL,
                        active_rules INTEGER,
                        blocked_ips INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                self.logger.info("IPS database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def _start_background_tasks(self):
        """Start background monitoring tasks"""
        # Metrics collection thread
        threading.Thread(target=self._metrics_collection_loop, daemon=True).start()
        
        # Rule cleanup thread
        threading.Thread(target=self._rule_cleanup_loop, daemon=True).start()
        
        # Packet simulation thread (for demo)
        threading.Thread(target=self._packet_simulation_loop, daemon=True).start()
        
    def _metrics_collection_loop(self):
        """Background metrics collection"""
        while self.is_active:
            try:
                # Collect system metrics
                cpu_usage = psutil.cpu_percent()
                memory_usage = psutil.virtual_memory().percent
                
                # Calculate throughput (simplified)
                current_time = time.time()
                elapsed = current_time - self.start_time
                throughput = (self.processed_packets * 1500 * 8) / (elapsed * 1024 * 1024) if elapsed > 0 else 0  # Mbps
                
                metrics = IPSMetrics(
                    timestamp=datetime.now().isoformat(),
                    packets_analyzed=self.processed_packets,
                    threats_detected=self.detection_count,
                    threats_blocked=self.blocked_count,
                    false_positives=0,  # Would need ground truth to calculate
                    processing_latency=0.001,  # Mock latency
                    throughput_mbps=throughput,
                    cpu_usage=cpu_usage,
                    memory_usage=memory_usage,
                    active_rules=len(self.mitigator.active_rules),
                    blocked_ips=len(self.mitigator.blocked_ips)
                )
                
                self.metrics_history.append(metrics)
                self._store_metrics(metrics)
                
                # Broadcast to WebSocket clients
                asyncio.run(self._broadcast_metrics(metrics))
                
            except Exception as e:
                self.logger.error(f"Error in metrics collection: {e}")
            
            time.sleep(10)  # Collect metrics every 10 seconds
    
    def _rule_cleanup_loop(self):
        """Background rule cleanup"""
        while self.is_active:
            try:
                self.mitigator.cleanup_expired_rules()
            except Exception as e:
                self.logger.error(f"Error in rule cleanup: {e}")
            
            time.sleep(60)  # Cleanup every minute
    
    def _packet_simulation_loop(self):
        """Simulate packet processing for demonstration"""
        while self.is_active:
            try:
                # Generate mock packets
                for _ in range(np.random.randint(5, 20)):
                    packet = self._generate_mock_packet()
                    self.process_packet(packet)
                
            except Exception as e:
                self.logger.error(f"Error in packet simulation: {e}")
            
            time.sleep(1)  # Process packets every second
    
    def _generate_mock_packet(self) -> NetworkPacket:
        """Generate mock network packet for demonstration"""
        # Generate realistic IP addresses
        src_ips = [
            '192.168.1.100', '10.0.0.50', '172.16.0.200',
            '203.0.113.5', '198.51.100.10', '8.8.8.8'
        ]
        
        dst_ips = [
            '192.168.1.1', '10.0.0.1', '172.16.0.1',
            '203.0.113.1', '198.51.100.1'
        ]
        
        protocols = ['TCP', 'UDP', 'ICMP']
        common_ports = [80, 443, 22, 21, 25, 53, 3389, 1433, 3306]
        
        # Occasionally generate suspicious patterns
        is_suspicious = np.random.random() < 0.1  # 10% chance
        
        if is_suspicious:
            # Generate patterns that might trigger detection
            src_port = np.random.randint(1024, 65535)
            dst_port = np.random.choice([22, 1433, 3306, 445])  # Common attack targets
            packet_size = np.random.randint(1000, 1500)  # Larger packets
        else:
            src_port = np.random.randint(1024, 65535)
            dst_port = np.random.choice(common_ports)
            packet_size = np.random.randint(64, 1500)
        
        return NetworkPacket(
            timestamp=datetime.now().isoformat(),
            src_ip=np.random.choice(src_ips),
            dst_ip=np.random.choice(dst_ips),
            src_port=src_port,
            dst_port=dst_port,
            protocol=np.random.choice(protocols),
            packet_size=packet_size,
            flags=['SYN'] if np.random.random() > 0.5 else ['ACK'],
            payload_size=max(0, packet_size - 40),  # Subtract headers
            ttl=np.random.randint(32, 128),
            window_size=np.random.randint(1024, 65535),
            packet_id=f"pkt_{int(time.time())}_{np.random.randint(1000, 9999)}",
            is_fragment=np.random.random() < 0.05,  # 5% fragments
            fragment_offset=0
        )
    
    def process_packet(self, packet: NetworkPacket) -> List[ThreatDetection]:
        """Process a network packet through the IPS"""
        try:
            start_time = time.time()
            
            # Check if source IP is already blocked
            if self.mitigator.is_blocked(packet.src_ip):
                self.blocked_count += 1
                return []
            
            # Check rate limits
            if not self.mitigator.check_rate_limit(packet.src_ip):
                return []
            
            # Analyze packet for threats
            detections = self.analyzer.analyze_packet(packet)
            
            # Apply mitigation for each detection
            for detection in detections:
                success = self.mitigator.apply_mitigation(detection)
                detection.blocked = success
                
                if success:
                    self.blocked_count += 1
                    self.logger.warning(f"Threat mitigated: {detection.threat_type} from {detection.source_ip}")
                
                # Store detection in database
                self._store_detection(detection)
            
            self.processed_packets += 1
            self.detection_count += len(detections)
            
            # Update processing time
            processing_time = time.time() - start_time
            
            return detections
            
        except Exception as e:
            self.logger.error(f"Error processing packet {packet.packet_id}: {e}")
            return []
    
    def _store_detection(self, detection: ThreatDetection):
        """Store threat detection in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO threat_detections (
                        detection_id, timestamp, threat_type, severity, confidence,
                        source_ip, target_ip, attack_vector, indicators,
                        mitigation_action, blocked, false_positive_risk, packet_info
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    detection.detection_id, detection.timestamp, detection.threat_type,
                    detection.severity, detection.confidence, detection.source_ip,
                    detection.target_ip, detection.attack_vector, json.dumps(detection.indicators),
                    detection.mitigation_action, detection.blocked, detection.false_positive_risk,
                    json.dumps(asdict(detection.packet_info))
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing detection: {e}")
    
    def _store_metrics(self, metrics: IPSMetrics):
        """Store IPS metrics in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO ips_metrics (
                        timestamp, packets_analyzed, threats_detected, threats_blocked,
                        false_positives, processing_latency, throughput_mbps,
                        cpu_usage, memory_usage, active_rules, blocked_ips
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.timestamp, metrics.packets_analyzed, metrics.threats_detected,
                    metrics.threats_blocked, metrics.false_positives, metrics.processing_latency,
                    metrics.throughput_mbps, metrics.cpu_usage, metrics.memory_usage,
                    metrics.active_rules, metrics.blocked_ips
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing metrics: {e}")
    
    async def _broadcast_metrics(self, metrics: IPSMetrics):
        """Broadcast metrics to WebSocket clients"""
        if self.websocket_clients:
            message = json.dumps({
                'type': 'ips_metrics',
                'data': asdict(metrics)
            })
            
            for client in self.websocket_clients.copy():
                try:
                    await client.send(message)
                except:
                    self.websocket_clients.discard(client)
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get IPS dashboard data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get recent detections by type
                cursor.execute('''
                    SELECT threat_type, COUNT(*), AVG(confidence)
                    FROM threat_detections
                    WHERE created_at > datetime('now', '-1 hour')
                    GROUP BY threat_type
                ''')
                detections_by_type = [
                    {'type': row[0], 'count': row[1], 'avg_confidence': row[2]}
                    for row in cursor.fetchall()
                ]
                
                # Get top blocked IPs
                cursor.execute('''
                    SELECT source_ip, COUNT(*) as block_count
                    FROM threat_detections
                    WHERE blocked = 1 AND created_at > datetime('now', '-24 hours')
                    GROUP BY source_ip
                    ORDER BY block_count DESC
                    LIMIT 10
                ''')
                top_blocked_ips = [
                    {'ip': row[0], 'count': row[1]}
                    for row in cursor.fetchall()
                ]
                
                # Get system performance
                latest_metrics = self.metrics_history[-1] if self.metrics_history else None
                
                return {
                    'system_status': {
                        'active': self.is_active,
                        'uptime': time.time() - self.start_time,
                        'processed_packets': self.processed_packets,
                        'detection_count': self.detection_count,
                        'blocked_count': self.blocked_count
                    },
                    'detections_by_type': detections_by_type,
                    'top_blocked_ips': top_blocked_ips,
                    'active_rules': len(self.mitigator.active_rules),
                    'blocked_ips': list(self.mitigator.blocked_ips)[:10],  # Limit for display
                    'performance': asdict(latest_metrics) if latest_metrics else {},
                    'mitigation_stats': dict(self.mitigator.mitigation_stats),
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}
    
    def add_custom_rule(self, rule_data: Dict[str, Any]) -> str:
        """Add custom blocking rule"""
        try:
            rule = BlockingRule(
                rule_id=f"custom_{int(time.time())}_{hash(str(rule_data)) % 10000}",
                rule_type=rule_data.get('type', 'custom'),
                criteria=rule_data.get('criteria', {}),
                action=rule_data.get('action', 'block'),
                duration=rule_data.get('duration', 3600),
                created_at=datetime.now().isoformat(),
                expires_at=(datetime.now() + timedelta(seconds=rule_data.get('duration', 3600))).isoformat(),
                hit_count=0,
                last_triggered=None
            )
            
            self.mitigator.active_rules[rule.rule_id] = rule
            
            # Store in database
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO blocking_rules (
                        rule_id, rule_type, criteria, action, duration,
                        created_at, expires_at, hit_count, last_triggered
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    rule.rule_id, rule.rule_type, json.dumps(rule.criteria),
                    rule.action, rule.duration, rule.created_at, rule.expires_at,
                    rule.hit_count, rule.last_triggered
                ))
                conn.commit()
            
            self.logger.info(f"Custom rule added: {rule.rule_id}")
            return rule.rule_id
            
        except Exception as e:
            self.logger.error(f"Error adding custom rule: {e}")
            return ""

# API endpoints for model integration
class IPSAPIServer:
    """REST API server for IPS integration"""
    
    def __init__(self, ips_system: IntrusionPreventionSystem, port: int = 8000):
        self.ips = ips_system
        self.port = port
        
    async def handle_packet_analysis(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle packet analysis API request"""
        try:
            # Convert request data to NetworkPacket
            packet = NetworkPacket(**request_data['packet'])
            
            # Process packet
            detections = self.ips.process_packet(packet)
            
            return {
                'success': True,
                'packet_id': packet.packet_id,
                'detections': [asdict(d) for d in detections],
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processed_at': datetime.now().isoformat()
            }
    
    async def handle_rule_management(self, action: str, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle rule management API requests"""
        try:
            if action == 'add':
                rule_id = self.ips.add_custom_rule(rule_data)
                return {'success': True, 'rule_id': rule_id}
            elif action == 'list':
                rules = [asdict(rule) for rule in self.ips.mitigator.active_rules.values()]
                return {'success': True, 'rules': rules}
            else:
                return {'success': False, 'error': f'Unknown action: {action}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def handle_dashboard_data(self) -> Dict[str, Any]:
        """Handle dashboard data API request"""
        return {
            'success': True,
            'data': self.ips.get_dashboard_data()
        }

def main():
    """Main function for testing IPS"""
    ips = IntrusionPreventionSystem()
    
    print("Intrusion Prevention System - Created by Md.Hriday Khan")
    print("=" * 60)
    
    print("\n1. Starting IPS system...")
    
    # Let system run for a bit to generate data
    time.sleep(5)
    
    print("\n2. System Status:")
    dashboard_data = ips.get_dashboard_data()
    print(f"  - Processed Packets: {dashboard_data['system_status']['processed_packets']}")
    print(f"  - Detections: {dashboard_data['system_status']['detection_count']}")
    print(f"  - Blocked: {dashboard_data['system_status']['blocked_count']}")
    print(f"  - Active Rules: {dashboard_data['active_rules']}")
    
    print("\n3. Recent Detections:")
    for detection in dashboard_data['detections_by_type'][:5]:
        print(f"  - {detection['type']}: {detection['count']} detections (avg confidence: {detection['avg_confidence']:.2f})")
    
    print("\n4. Top Blocked IPs:")
    for blocked_ip in dashboard_data['top_blocked_ips'][:5]:
        print(f"  - {blocked_ip['ip']}: {blocked_ip['count']} blocks")
    
    print(f"\nIPS System running successfully!")
    print(f"Database: {ips.db_path}")

if __name__ == "__main__":
    main()