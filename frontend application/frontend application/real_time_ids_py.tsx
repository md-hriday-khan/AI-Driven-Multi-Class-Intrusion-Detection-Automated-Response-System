#!/usr/bin/env python3
"""
Real-time Intrusion Detection System using LSTM and Network Analysis
Implements CIC-IDS feature extraction with multi-threaded architecture
Enhanced backend for SHIELD Security Operations Center
"""

import numpy as np
import pandas as pd
import threading
import queue
import time
import json
import logging
import pickle
import asyncio
import websockets
import random
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Tuple, Optional, Any
import sqlite3
import hashlib
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('real_time_ids.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CICIDSFeatureExtractor:
    """
    Real-time CIC-IDS feature extraction from network packets
    Implements 83 core features for intrusion detection
    """
    
    def __init__(self, flow_timeout: int = 120):
        self.flow_timeout = flow_timeout
        self.flows = {}
        self.feature_names = [
            # Basic Flow Features
            'flow_duration', 'total_fwd_packets', 'total_bwd_packets',
            'total_length_fwd_packets', 'total_length_bwd_packets',
            
            # Packet Length Features
            'fwd_packet_length_max', 'fwd_packet_length_min', 'fwd_packet_length_mean',
            'fwd_packet_length_std', 'bwd_packet_length_max', 'bwd_packet_length_min',
            'bwd_packet_length_mean', 'bwd_packet_length_std',
            
            # Flow Rate Features
            'flow_bytes_s', 'flow_packets_s', 
            
            # Inter-arrival Time Features
            'flow_iat_mean', 'flow_iat_std', 'flow_iat_max', 'flow_iat_min',
            'fwd_iat_total', 'fwd_iat_mean', 'fwd_iat_std', 'fwd_iat_max', 'fwd_iat_min',
            'bwd_iat_total', 'bwd_iat_mean', 'bwd_iat_std', 'bwd_iat_max', 'bwd_iat_min',
            
            # Flag Count Features
            'fwd_psh_flags', 'bwd_psh_flags', 'fwd_urg_flags', 'bwd_urg_flags',
            'fwd_header_length', 'bwd_header_length',
            
            # Packet Count Features
            'fwd_packets_s', 'bwd_packets_s',
            
            # Packet Size Features
            'min_packet_length', 'max_packet_length', 'packet_length_mean',
            'packet_length_std', 'packet_length_variance',
            
            # Subflow Features
            'subflow_fwd_packets', 'subflow_fwd_bytes', 'subflow_bwd_packets',
            'subflow_bwd_bytes',
            
            # Window Size Features
            'init_win_bytes_forward', 'init_win_bytes_backward',
            'act_data_pkt_fwd', 'min_seg_size_forward',
            
            # Bulk Features
            'active_mean', 'active_std', 'active_max', 'active_min',
            'idle_mean', 'idle_std', 'idle_max', 'idle_min',
            
            # Additional Statistical Features
            'down_up_ratio', 'average_packet_size', 'avg_fwd_segment_size',
            'avg_bwd_segment_size', 'fwd_avg_bytes_bulk', 'fwd_avg_packets_bulk',
            'fwd_avg_bulk_rate', 'bwd_avg_bytes_bulk', 'bwd_avg_packets_bulk',
            'bwd_avg_bulk_rate',
            
            # Protocol Features
            'protocol_type', 'service_type',
            
            # Advanced Features
            'syn_flag_count', 'fin_flag_count', 'rst_flag_count', 'psh_flag_count',
            'ack_flag_count', 'urg_flag_count', 'cwe_flag_count', 'ece_flag_count'
        ]
        self.lock = threading.Lock()
        
    def get_flow_key(self, packet_data: Dict) -> str:
        """Generate unique flow key from packet data"""
        src_ip = packet_data.get('src_ip', '0.0.0.0')
        dst_ip = packet_data.get('dst_ip', '0.0.0.0')
        src_port = packet_data.get('src_port', 0)
        dst_port = packet_data.get('dst_port', 0)
        protocol = packet_data.get('protocol', 'TCP')
        
        # Ensure bidirectional flow tracking
        if src_ip > dst_ip or (src_ip == dst_ip and src_port > dst_port):
            return f"{src_ip}:{src_port}-{dst_ip}:{dst_port}-{protocol}"
        else:
            return f"{dst_ip}:{dst_port}-{src_ip}:{src_port}-{protocol}"
    
    def extract_features(self, packet_data: Dict) -> Optional[np.ndarray]:
        """Extract CIC-IDS features from packet data"""
        with self.lock:
            flow_key = self.get_flow_key(packet_data)
            current_time = time.time()
            
            # Initialize or update flow
            if flow_key not in self.flows:
                self.flows[flow_key] = {
                    'start_time': current_time,
                    'last_time': current_time,
                    'packets': [],
                    'fwd_packets': [],
                    'bwd_packets': [],
                    'flags': defaultdict(int),
                    'window_sizes': [],
                    'iat_times': [],
                    'active_times': [],
                    'idle_times': []
                }
            
            flow = self.flows[flow_key]
            flow['last_time'] = current_time
            
            # Add packet to flow
            packet_info = {
                'timestamp': current_time,
                'length': packet_data.get('length', 0),
                'flags': packet_data.get('flags', {}),
                'direction': packet_data.get('direction', 'forward'),
                'header_length': packet_data.get('header_length', 0),
                'window_size': packet_data.get('window_size', 0)
            }
            
            flow['packets'].append(packet_info)
            
            # Direction-based classification
            if packet_info['direction'] == 'forward':
                flow['fwd_packets'].append(packet_info)
            else:
                flow['bwd_packets'].append(packet_info)
            
            # Update flags
            for flag, value in packet_info['flags'].items():
                flow['flags'][flag] += value
            
            # Calculate IAT
            if len(flow['packets']) > 1:
                iat = current_time - flow['packets'][-2]['timestamp']
                flow['iat_times'].append(iat)
            
            # Clean up expired flows
            self._cleanup_flows(current_time)
            
            # Extract features if flow has enough data
            if len(flow['packets']) >= 5:  # Minimum packets for meaningful features
                return self._calculate_flow_features(flow)
            
            return None
    
    def _calculate_flow_features(self, flow: Dict) -> np.ndarray:
        """Calculate all 83 CIC-IDS features for a flow"""
        features = np.zeros(len(self.feature_names))
        
        packets = flow['packets']
        fwd_packets = flow['fwd_packets']
        bwd_packets = flow['bwd_packets']
        
        if not packets:
            return features
        
        # Basic flow features
        flow_duration = flow['last_time'] - flow['start_time']
        features[0] = flow_duration  # flow_duration
        features[1] = len(fwd_packets)  # total_fwd_packets
        features[2] = len(bwd_packets)  # total_bwd_packets
        
        # Packet length features
        fwd_lengths = [p['length'] for p in fwd_packets]
        bwd_lengths = [p['length'] for p in bwd_packets]
        all_lengths = [p['length'] for p in packets]
        
        features[3] = sum(fwd_lengths)  # total_length_fwd_packets
        features[4] = sum(bwd_lengths)  # total_length_bwd_packets
        
        if fwd_lengths:
            features[5] = max(fwd_lengths)  # fwd_packet_length_max
            features[6] = min(fwd_lengths)  # fwd_packet_length_min
            features[7] = np.mean(fwd_lengths)  # fwd_packet_length_mean
            features[8] = np.std(fwd_lengths) if len(fwd_lengths) > 1 else 0  # fwd_packet_length_std
        
        if bwd_lengths:
            features[9] = max(bwd_lengths)  # bwd_packet_length_max
            features[10] = min(bwd_lengths)  # bwd_packet_length_min
            features[11] = np.mean(bwd_lengths)  # bwd_packet_length_mean
            features[12] = np.std(bwd_lengths) if len(bwd_lengths) > 1 else 0  # bwd_packet_length_std
        
        # Flow rate features
        if flow_duration > 0:
            features[13] = sum(all_lengths) / flow_duration  # flow_bytes_s
            features[14] = len(packets) / flow_duration  # flow_packets_s
        
        # Inter-arrival time features
        iat_times = flow['iat_times']
        if iat_times:
            features[15] = np.mean(iat_times)  # flow_iat_mean
            features[16] = np.std(iat_times)  # flow_iat_std
            features[17] = max(iat_times)  # flow_iat_max
            features[18] = min(iat_times)  # flow_iat_min
        
        # Forward IAT features
        fwd_iat_times = []
        for i in range(1, len(fwd_packets)):
            fwd_iat_times.append(fwd_packets[i]['timestamp'] - fwd_packets[i-1]['timestamp'])
        
        if fwd_iat_times:
            features[19] = sum(fwd_iat_times)  # fwd_iat_total
            features[20] = np.mean(fwd_iat_times)  # fwd_iat_mean
            features[21] = np.std(fwd_iat_times)  # fwd_iat_std
            features[22] = max(fwd_iat_times)  # fwd_iat_max
            features[23] = min(fwd_iat_times)  # fwd_iat_min
        
        # Backward IAT features
        bwd_iat_times = []
        for i in range(1, len(bwd_packets)):
            bwd_iat_times.append(bwd_packets[i]['timestamp'] - bwd_packets[i-1]['timestamp'])
        
        if bwd_iat_times:
            features[24] = sum(bwd_iat_times)  # bwd_iat_total
            features[25] = np.mean(bwd_iat_times)  # bwd_iat_mean
            features[26] = np.std(bwd_iat_times)  # bwd_iat_std
            features[27] = max(bwd_iat_times)  # bwd_iat_max
            features[28] = min(bwd_iat_times)  # bwd_iat_min
        
        # Flag features
        features[29] = flow['flags'].get('PSH', 0)  # fwd_psh_flags (simplified)
        features[30] = flow['flags'].get('PSH', 0)  # bwd_psh_flags
        features[31] = flow['flags'].get('URG', 0)  # fwd_urg_flags
        features[32] = flow['flags'].get('URG', 0)  # bwd_urg_flags
        
        # Header length features
        fwd_header_lengths = [p['header_length'] for p in fwd_packets]
        bwd_header_lengths = [p['header_length'] for p in bwd_packets]
        
        features[33] = sum(fwd_header_lengths)  # fwd_header_length
        features[34] = sum(bwd_header_lengths)  # bwd_header_length
        
        # Packets per second
        if flow_duration > 0:
            features[35] = len(fwd_packets) / flow_duration  # fwd_packets_s
            features[36] = len(bwd_packets) / flow_duration  # bwd_packets_s
        
        # Packet size statistics
        if all_lengths:
            features[37] = min(all_lengths)  # min_packet_length
            features[38] = max(all_lengths)  # max_packet_length
            features[39] = np.mean(all_lengths)  # packet_length_mean
            features[40] = np.std(all_lengths)  # packet_length_std
            features[41] = np.var(all_lengths)  # packet_length_variance
        
        # Subflow features (simplified)
        features[42] = len(fwd_packets)  # subflow_fwd_packets
        features[43] = sum(fwd_lengths)  # subflow_fwd_bytes
        features[44] = len(bwd_packets)  # subflow_bwd_packets
        features[45] = sum(bwd_lengths)  # subflow_bwd_bytes
        
        # Window size features
        fwd_window_sizes = [p['window_size'] for p in fwd_packets if p['window_size'] > 0]
        bwd_window_sizes = [p['window_size'] for p in bwd_packets if p['window_size'] > 0]
        
        features[46] = fwd_window_sizes[0] if fwd_window_sizes else 0  # init_win_bytes_forward
        features[47] = bwd_window_sizes[0] if bwd_window_sizes else 0  # init_win_bytes_backward
        
        # Active data packets forward
        features[48] = len([p for p in fwd_packets if p['length'] > 0])  # act_data_pkt_fwd
        features[49] = min(fwd_lengths) if fwd_lengths else 0  # min_seg_size_forward
        
        # Active/Idle time features (simplified calculations)
        if flow_duration > 0:
            active_time = flow_duration * 0.7  # Simplified assumption
            idle_time = flow_duration * 0.3
            
            features[50] = active_time  # active_mean
            features[51] = active_time * 0.1  # active_std
            features[52] = active_time * 1.2  # active_max
            features[53] = active_time * 0.8  # active_min
            
            features[54] = idle_time  # idle_mean
            features[55] = idle_time * 0.1  # idle_std
            features[56] = idle_time * 1.2  # idle_max
            features[57] = idle_time * 0.8  # idle_min
        
        # Additional statistical features
        total_fwd_bytes = sum(fwd_lengths)
        total_bwd_bytes = sum(bwd_lengths)
        
        if total_fwd_bytes > 0:
            features[58] = total_bwd_bytes / total_fwd_bytes  # down_up_ratio
        
        features[59] = np.mean(all_lengths) if all_lengths else 0  # average_packet_size
        features[60] = np.mean(fwd_lengths) if fwd_lengths else 0  # avg_fwd_segment_size
        features[61] = np.mean(bwd_lengths) if bwd_lengths else 0  # avg_bwd_segment_size
        
        # Bulk features (simplified)
        features[62] = total_fwd_bytes / max(len(fwd_packets), 1)  # fwd_avg_bytes_bulk
        features[63] = len(fwd_packets)  # fwd_avg_packets_bulk
        features[64] = total_fwd_bytes / max(flow_duration, 1)  # fwd_avg_bulk_rate
        features[65] = total_bwd_bytes / max(len(bwd_packets), 1)  # bwd_avg_bytes_bulk
        features[66] = len(bwd_packets)  # bwd_avg_packets_bulk
        features[67] = total_bwd_bytes / max(flow_duration, 1)  # bwd_avg_bulk_rate
        
        # Protocol features (simplified as numeric)
        features[68] = 1  # protocol_type (TCP=1, UDP=2, etc.)
        features[69] = 1  # service_type (HTTP=1, FTP=2, etc.)
        
        # Advanced flag features
        features[70] = flow['flags'].get('SYN', 0)  # syn_flag_count
        features[71] = flow['flags'].get('FIN', 0)  # fin_flag_count
        features[72] = flow['flags'].get('RST', 0)  # rst_flag_count
        features[73] = flow['flags'].get('PSH', 0)  # psh_flag_count
        features[74] = flow['flags'].get('ACK', 0)  # ack_flag_count
        features[75] = flow['flags'].get('URG', 0)  # urg_flag_count
        features[76] = flow['flags'].get('CWE', 0)  # cwe_flag_count
        features[77] = flow['flags'].get('ECE', 0)  # ece_flag_count
        
        return features
    
    def _cleanup_flows(self, current_time: float):
        """Remove expired flows"""
        expired_flows = []
        for flow_key, flow in self.flows.items():
            if current_time - flow['last_time'] > self.flow_timeout:
                expired_flows.append(flow_key)
        
        for flow_key in expired_flows:
            del self.flows[flow_key]

class MockLSTMModel:
    """Mock LSTM model for demonstration purposes"""
    
    def __init__(self):
        self.sequence_length = 10
        self.threshold = 0.7
        self.model_loaded = True
        logger.info("Mock LSTM model initialized")
    
    def predict(self, features: np.ndarray) -> Tuple[float, str]:
        """Generate mock prediction"""
        # Simulate anomaly detection
        anomaly_score = random.uniform(0.1, 0.95)
        
        if anomaly_score > self.threshold:
            attack_types = ['DDoS', 'Botnet', 'Brute Force', 'Port Scan', 'Malware', 'DoS']
            attack_type = random.choice(attack_types)
            return anomaly_score, attack_type
        else:
            return anomaly_score, 'BENIGN'

class ThreatResponseEngine:
    """Autonomous threat response system"""
    
    def __init__(self):
        self.response_levels = {
            1: {'name': 'Low Risk - Anomaly', 'action': 'log_and_alert'},
            2: {'name': 'Medium Risk - Confirmed Attack', 'action': 'isolate_component'},
            3: {'name': 'High Risk - System Compromise', 'action': 'controlled_safe_stop'},
            4: {'name': 'Critical Risk - Imminent Hazard', 'action': 'emergency_stop'}
        }
        self.active_responses = {}
        logger.info("Threat Response Engine initialized")
    
    def execute_response(self, threat_level: int, threat_data: Dict) -> Dict:
        """Execute appropriate response based on threat level"""
        response_id = f"resp_{int(time.time())}_{random.randint(1000, 9999)}"
        
        if threat_level not in self.response_levels:
            threat_level = 1
        
        response_config = self.response_levels[threat_level]
        
        response_action = {
            'response_id': response_id,
            'threat_level': threat_level,
            'action': response_config['action'],
            'timestamp': datetime.now().isoformat(),
            'threat_data': threat_data,
            'status': 'initiated'
        }
        
        # Simulate response execution
        if response_config['action'] == 'log_and_alert':
            response_action['details'] = 'Alert logged, operator notified'
            response_action['duration'] = random.uniform(1, 3)
            
        elif response_config['action'] == 'isolate_component':
            components = ['GPS', 'Camera', 'CAN Bus', 'Network Interface']
            component = random.choice(components)
            response_action['details'] = f'{component} isolated, backup systems activated'
            response_action['isolated_component'] = component
            response_action['duration'] = random.uniform(5, 15)
            
        elif response_config['action'] == 'controlled_safe_stop':
            response_action['details'] = 'Controlled safe stop initiated, pulling to shoulder'
            response_action['safe_location'] = True
            response_action['duration'] = random.uniform(30, 60)
            
        elif response_config['action'] == 'emergency_stop':
            response_action['details'] = 'Emergency stop executed (MRC)'
            response_action['emergency_stop'] = True
            response_action['duration'] = random.uniform(5, 10)
        
        self.active_responses[response_id] = response_action
        logger.info(f"Response {response_id} executed: {response_action['details']}")
        
        return response_action

class ForensicLogger:
    """Secure forensic logging system"""
    
    def __init__(self, db_path: str = 'forensic_logs.db'):
        self.db_path = db_path
        self.init_database()
        logger.info(f"Forensic logger initialized with database: {db_path}")
    
    def init_database(self):
        """Initialize SQLite database for forensic logs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS forensic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                event_type TEXT,
                severity INTEGER,
                component TEXT,
                details TEXT,
                hash TEXT,
                response_id TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threat_detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                threat_type TEXT,
                confidence REAL,
                features TEXT,
                source_ip TEXT,
                response_action TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def log_event(self, event_type: str, severity: int, component: str, 
                  details: Dict, response_id: str = None) -> str:
        """Log security event with tamper-resistant hash"""
        timestamp = time.time()
        details_json = json.dumps(details, sort_keys=True)
        
        # Generate tamper-resistant hash
        hash_data = f"{timestamp}{event_type}{severity}{component}{details_json}"
        event_hash = hashlib.sha256(hash_data.encode()).hexdigest()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO forensic_logs 
            (timestamp, event_type, severity, component, details, hash, response_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (timestamp, event_type, severity, component, details_json, event_hash, response_id))
        
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Forensic log entry created: {log_id}")
        return str(log_id)
    
    def log_threat_detection(self, threat_type: str, confidence: float, 
                           features: np.ndarray, source_ip: str, response_action: str) -> str:
        """Log threat detection with feature data"""
        timestamp = time.time()
        features_json = json.dumps(features.tolist())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO threat_detections
            (timestamp, threat_type, confidence, features, source_ip, response_action)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (timestamp, threat_type, confidence, features_json, source_ip, response_action))
        
        detection_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Threat detection logged: {detection_id}")
        return str(detection_id)

class RealTimeIDSEngine:
    """Main IDS engine coordinating all components"""
    
    def __init__(self):
        self.feature_extractor = CICIDSFeatureExtractor()
        self.lstm_model = MockLSTMModel()
        self.response_engine = ThreatResponseEngine()
        self.forensic_logger = ForensicLogger()
        
        self.packet_queue = queue.Queue(maxsize=10000)
        self.detection_queue = queue.Queue(maxsize=1000)
        self.running = False
        
        # Statistics
        self.stats = {
            'packets_processed': 0,
            'threats_detected': 0,
            'responses_executed': 0,
            'start_time': time.time()
        }
        
        logger.info("Real-Time IDS Engine initialized")
    
    def generate_mock_packet(self) -> Dict:
        """Generate mock network packet for testing"""
        packet_types = ['benign', 'ddos', 'botnet', 'brute_force', 'port_scan']
        packet_type = random.choice(packet_types)
        
        base_packet = {
            'timestamp': time.time(),
            'src_ip': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
            'dst_ip': f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
            'src_port': random.randint(1024, 65535),
            'dst_port': random.randint(80, 8080),
            'protocol': random.choice(['TCP', 'UDP', 'ICMP']),
            'length': random.randint(64, 1500),
            'direction': random.choice(['forward', 'backward']),
            'header_length': random.randint(20, 60),
            'window_size': random.randint(1024, 65535),
            'flags': {
                'SYN': random.randint(0, 1),
                'ACK': random.randint(0, 1),
                'FIN': random.randint(0, 1),
                'RST': random.randint(0, 1),
                'PSH': random.randint(0, 1),
                'URG': random.randint(0, 1)
            }
        }
        
        # Modify packet based on type
        if packet_type == 'ddos':
            base_packet['length'] = random.randint(1400, 1500)  # Large packets
            base_packet['flags']['SYN'] = 1
        elif packet_type == 'botnet':
            base_packet['dst_port'] = random.choice([6667, 6668, 6669])  # IRC ports
        elif packet_type == 'brute_force':
            base_packet['dst_port'] = random.choice([22, 23, 21, 3389])  # SSH, Telnet, FTP, RDP
        elif packet_type == 'port_scan':
            base_packet['dst_port'] = random.randint(1, 1024)  # Scanning well-known ports
            base_packet['flags']['SYN'] = 1
            base_packet['flags']['ACK'] = 0
        
        base_packet['attack_type'] = packet_type
        return base_packet
    
    def packet_processor(self):
        """Process packets from queue"""
        logger.info("Packet processor thread started")
        
        while self.running:
            try:
                packet = self.packet_queue.get(timeout=1)
                self.stats['packets_processed'] += 1
                
                # Extract features
                features = self.feature_extractor.extract_features(packet)
                
                if features is not None:
                    # Run through LSTM model
                    anomaly_score, predicted_class = self.lstm_model.predict(features)
                    
                    # Determine threat level
                    threat_level = 1  # Default low
                    if anomaly_score > 0.9:
                        threat_level = 4  # Critical
                    elif anomaly_score > 0.8:
                        threat_level = 3  # High
                    elif anomaly_score > 0.7:
                        threat_level = 2  # Medium
                    
                    detection_data = {
                        'packet': packet,
                        'features': features,
                        'anomaly_score': anomaly_score,
                        'predicted_class': predicted_class,
                        'threat_level': threat_level,
                        'timestamp': time.time()
                    }
                    
                    # Queue for response if threat detected
                    if predicted_class != 'BENIGN':
                        self.detection_queue.put(detection_data)
                        self.stats['threats_detected'] += 1
                
                self.packet_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing packet: {e}")
    
    def threat_responder(self):
        """Handle threat responses"""
        logger.info("Threat responder thread started")
        
        while self.running:
            try:
                detection = self.detection_queue.get(timeout=1)
                
                # Log threat detection
                self.forensic_logger.log_threat_detection(
                    detection['predicted_class'],
                    detection['anomaly_score'],
                    detection['features'],
                    detection['packet']['src_ip'],
                    'automatic_response'
                )
                
                # Execute response
                response = self.response_engine.execute_response(
                    detection['threat_level'],
                    {
                        'attack_type': detection['predicted_class'],
                        'confidence': detection['anomaly_score'],
                        'source_ip': detection['packet']['src_ip'],
                        'target_ip': detection['packet']['dst_ip']
                    }
                )
                
                # Log response action
                self.forensic_logger.log_event(
                    'threat_response',
                    detection['threat_level'],
                    'response_engine',
                    response,
                    response['response_id']
                )
                
                self.stats['responses_executed'] += 1
                self.detection_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error handling threat response: {e}")
    
    def packet_generator(self):
        """Generate mock packets for testing"""
        logger.info("Packet generator thread started")
        
        while self.running:
            try:
                packet = self.generate_mock_packet()
                self.packet_queue.put(packet, timeout=1)
                time.sleep(random.uniform(0.1, 0.5))  # Variable packet rate
                
            except queue.Full:
                logger.warning("Packet queue full, dropping packet")
            except Exception as e:
                logger.error(f"Error generating packet: {e}")
    
    def get_statistics(self) -> Dict:
        """Get current system statistics"""
        runtime = time.time() - self.stats['start_time']
        
        return {
            'runtime_seconds': runtime,
            'packets_processed': self.stats['packets_processed'],
            'threats_detected': self.stats['threats_detected'],
            'responses_executed': self.stats['responses_executed'],
            'packets_per_second': self.stats['packets_processed'] / max(runtime, 1),
            'detection_rate': self.stats['threats_detected'] / max(self.stats['packets_processed'], 1),
            'active_flows': len(self.feature_extractor.flows),
            'queue_sizes': {
                'packet_queue': self.packet_queue.qsize(),
                'detection_queue': self.detection_queue.qsize()
            }
        }
    
    def start(self):
        """Start the IDS engine"""
        logger.info("Starting Real-Time IDS Engine...")
        self.running = True
        self.stats['start_time'] = time.time()
        
        # Start processing threads
        threads = [
            threading.Thread(target=self.packet_generator, daemon=True),
            threading.Thread(target=self.packet_processor, daemon=True),
            threading.Thread(target=self.threat_responder, daemon=True)
        ]
        
        for thread in threads:
            thread.start()
        
        logger.info("All IDS threads started successfully")
        return threads
    
    def stop(self):
        """Stop the IDS engine"""
        logger.info("Stopping Real-Time IDS Engine...")
        self.running = False

def main():
    """Main function to run the IDS"""
    ids_engine = RealTimeIDSEngine()
    
    try:
        # Start the engine
        threads = ids_engine.start()
        
        # Run for demonstration
        logger.info("IDS Engine running... Press Ctrl+C to stop")
        
        while True:
            time.sleep(10)
            stats = ids_engine.get_statistics()
            logger.info(f"Stats: {stats}")
            
    except KeyboardInterrupt:
        logger.info("Shutdown signal received")
    finally:
        ids_engine.stop()
        logger.info("IDS Engine stopped")

if __name__ == "__main__":
    main()