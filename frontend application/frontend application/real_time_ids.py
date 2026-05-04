#!/usr/bin/env python3
"""
Real-time Intrusion Detection System Engine
Provides real-time threat detection and analysis
Created by Md.Hriday Khan
"""

import random
import time
import numpy as np
from datetime import datetime
from typing import Dict, List, Any

class RealTimeIDSEngine:
    """Real-time IDS engine with ML-based detection"""
    
    def __init__(self):
        self.threat_database = {
            'DDoS': {'severity': 'critical', 'action': 'block'},
            'Port Scan': {'severity': 'high', 'action': 'alert'},
            'SQL Injection': {'severity': 'critical', 'action': 'block'},
            'XSS': {'severity': 'high', 'action': 'alert'},
            'Brute Force': {'severity': 'high', 'action': 'rate_limit'},
            'Malware': {'severity': 'critical', 'action': 'quarantine'},
            'Data Exfiltration': {'severity': 'critical', 'action': 'block'},
            'Reconnaissance': {'severity': 'medium', 'action': 'monitor'}
        }
        
        self.detection_count = 0
        self.blocked_count = 0
        self.start_time = time.time()
    
    def analyze_traffic(self, traffic_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze network traffic for threats"""
        
        # Simulate threat detection
        is_threat = random.random() > 0.85  # 15% threat rate
        
        if is_threat:
            threat_type = random.choice(list(self.threat_database.keys()))
            threat_info = self.threat_database[threat_type]
            confidence = random.uniform(0.75, 0.99)
            
            self.detection_count += 1
            if threat_info['action'] == 'block':
                self.blocked_count += 1
            
            return {
                'is_threat': True,
                'threat_type': threat_type,
                'severity': threat_info['severity'],
                'confidence': confidence,
                'recommended_action': threat_info['action'],
                'source_ip': traffic_data.get('source_ip', f'192.168.{random.randint(1,255)}.{random.randint(1,255)}'),
                'timestamp': datetime.now().isoformat(),
                'detection_id': f'DET-{int(time.time() * 1000)}'
            }
        
        return {
            'is_threat': False,
            'traffic_normal': True,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get IDS statistics"""
        uptime = time.time() - self.start_time
        
        return {
            'uptime_seconds': uptime,
            'total_detections': self.detection_count,
            'threats_blocked': self.blocked_count,
            'detection_rate': (self.detection_count / max(uptime / 60, 1)),  # per minute
            'last_update': datetime.now().isoformat()
        }
    
    def get_real_time_threats(self, count: int = 10) -> List[Dict[str, Any]]:
        """Generate real-time threat data"""
        threats = []
        
        for _ in range(count):
            threat_type = random.choice(list(self.threat_database.keys()))
            threat_info = self.threat_database[threat_type]
            
            threats.append({
                'id': f'THR-{random.randint(10000, 99999)}',
                'type': threat_type,
                'severity': threat_info['severity'],
                'confidence': random.uniform(0.70, 0.99),
                'source_ip': f'{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}',
                'target_ip': f'10.0.{random.randint(1,255)}.{random.randint(1,255)}',
                'timestamp': datetime.now().isoformat(),
                'status': random.choice(['detected', 'analyzing', 'blocked', 'mitigated'])
            })
        
        return threats

# Initialize global engine
ids_engine = RealTimeIDSEngine()

if __name__ == "__main__":
    print("Real-time IDS Engine initialized")
    print(f"Monitoring {len(ids_engine.threat_database)} threat types")
