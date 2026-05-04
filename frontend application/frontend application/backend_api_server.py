#!/usr/bin/env python3
"""
CyberAuton Security Operations Centre Backend API Server
Provides comprehensive REST API for all cybersecurity functionality
Created by Md.Hriday Khan
"""

from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import json
import time
import threading
import queue
import random
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import io
import zipfile
import csv
from typing import Dict, List, Any
import uuid
import hashlib
import logging

# Import our IDS engines
from real_time_ids import RealTimeIDSEngine
try:
    from enhanced_ids_dataset_integration import CICIDSDatasetManager, RealTimeDataSimulator
    ENHANCED_IDS_AVAILABLE = True
except ImportError:
    ENHANCED_IDS_AVAILABLE = False
    logger.warning("Enhanced IDS dataset integration not available")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global IDS engine instances
ids_engine = None
enhanced_ids_manager = None
enhanced_ids_simulator = None
api_stats = {
    'requests_served': 0,
    'exports_generated': 0,
    'start_time': time.time(),
    'cic_ids_requests': 0,
    'enhanced_features': ENHANCED_IDS_AVAILABLE
}

class BackendDataManager:
    """Manages all backend data and exports"""
    
    def __init__(self):
        self.init_database()
        self.threat_data = []
        self.network_data = []
        self.system_metrics = []
        self.audit_logs = []
        self.detection_events = []
        
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect('shield_backend.db')
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS network_captures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                src_ip TEXT,
                dst_ip TEXT,
                protocol TEXT,
                src_port INTEGER,
                dst_port INTEGER,
                packet_size INTEGER,
                flags TEXT,
                payload_preview TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threat_intelligence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                threat_type TEXT,
                severity TEXT,
                source_ip TEXT,
                target_ip TEXT,
                mitre_technique TEXT,
                confidence REAL,
                status TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                user_id TEXT,
                action TEXT,
                resource TEXT,
                status TEXT,
                ip_address TEXT,
                user_agent TEXT,
                details TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

data_manager = BackendDataManager()

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global api_stats
    api_stats['requests_served'] += 1
    
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'uptime': time.time() - api_stats['start_time'],
        'requests_served': api_stats['requests_served'],
        'ids_running': ids_engine.running if ids_engine else False
    })

@app.route('/api/ids/stats', methods=['GET'])
def get_ids_stats():
    """Get IDS engine statistics"""
    global api_stats
    api_stats['requests_served'] += 1
    
    if ids_engine:
        stats = ids_engine.get_statistics()
        return jsonify({
            'success': True,
            'data': stats
        })
    else:
        return jsonify({
            'success': False,
            'error': 'IDS engine not running'
        }), 503

@app.route('/api/mitre/export', methods=['POST'])
def export_mitre_matrix():
    """Export MITRE ATT&CK matrix data"""
    global api_stats
    api_stats['requests_served'] += 1
    api_stats['exports_generated'] += 1
    
    try:
        # Generate comprehensive MITRE data
        mitre_data = {
            'metadata': {
                'name': 'MITRE ATT&CK Matrix Export',
                'version': '14.1',
                'author': 'CyberAuton Security Operations Centre',
                'created': datetime.now().isoformat(),
                'description': 'Complete MITRE ATT&CK framework mapping with detection coverage'
            },
            'tactics': [
                {
                    'id': 'TA0001',
                    'name': 'Initial Access',
                    'description': 'Adversaries are trying to get into your network',
                    'techniques': 9,
                    'detected_count': 7,
                    'coverage': 78,
                    'risk_level': 'high'
                },
                {
                    'id': 'TA0002',
                    'name': 'Execution',
                    'description': 'Adversaries are trying to run malicious code',
                    'techniques': 12,
                    'detected_count': 10,
                    'coverage': 83,
                    'risk_level': 'high'
                },
                {
                    'id': 'TA0003',
                    'name': 'Persistence',
                    'description': 'Adversaries are trying to maintain their foothold',
                    'techniques': 19,
                    'detected_count': 14,
                    'coverage': 74,
                    'risk_level': 'medium'
                }
            ],
            'techniques': [
                {
                    'id': 'T1566',
                    'name': 'Phishing',
                    'tactic': 'Initial Access',
                    'detection_coverage': 85,
                    'mitigation_coverage': 90,
                    'severity': 'high',
                    'platforms': ['Windows', 'Linux', 'macOS'],
                    'data_sources': ['Email Gateway', 'Network Traffic', 'File Monitoring']
                },
                {
                    'id': 'T1059',
                    'name': 'Command and Scripting Interpreter',
                    'tactic': 'Execution',
                    'detection_coverage': 75,
                    'mitigation_coverage': 80,
                    'severity': 'medium',
                    'platforms': ['Windows', 'Linux', 'macOS'],
                    'data_sources': ['Process Monitoring', 'Command History', 'Network Traffic']
                }
            ],
            'coverage_analysis': {
                'overall_coverage': 78.5,
                'total_techniques': 185,
                'detected_techniques': 145,
                'high_risk_techniques': 67
            }
        }
        
        return jsonify({
            'success': True,
            'data': mitre_data,
            'export_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error exporting MITRE matrix: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/network/export-pcap', methods=['POST'])
def export_pcap_data():
    """Export network packet capture data"""
    global api_stats
    api_stats['requests_served'] += 1
    api_stats['exports_generated'] += 1
    
    try:
        # Generate mock PCAP data
        packets = []
        for i in range(1000):  # Generate 1000 packets
            packet = {
                'packet_id': i + 1,
                'timestamp': time.time() - random.randint(0, 3600),
                'src_ip': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'dst_ip': f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'protocol': random.choice(['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS']),
                'src_port': random.randint(1024, 65535),
                'dst_port': random.randint(80, 8080),
                'packet_size': random.randint(64, 1500),
                'flags': random.choice(['SYN', 'ACK', 'FIN', 'RST']),
                'payload_preview': 'GET /api/data HTTP/1.1...'
            }
            packets.append(packet)
        
        # Store in database
        conn = sqlite3.connect('shield_backend.db')
        cursor = conn.cursor()
        
        for packet in packets[-50:]:  # Store last 50 packets
            cursor.execute('''
                INSERT INTO network_captures 
                (timestamp, src_ip, dst_ip, protocol, src_port, dst_port, packet_size, flags, payload_preview)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (packet['timestamp'], packet['src_ip'], packet['dst_ip'], packet['protocol'],
                  packet['src_port'], packet['dst_port'], packet['packet_size'], 
                  packet['flags'], packet['payload_preview']))
        
        conn.commit()
        conn.close()
        
        pcap_data = {
            'metadata': {
                'filename': f'network_capture_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pcap',
                'timestamp': datetime.now().isoformat(),
                'duration': '1 hour',
                'total_packets': len(packets),
                'total_bytes': sum(p['packet_size'] for p in packets),
                'capture_interface': 'eth0',
                'filter': 'all traffic'
            },
            'packets': packets,
            'statistics': {
                'packet_rate_avg': len(packets) / 3600,
                'bandwidth_utilization': random.uniform(60, 90),
                'top_talkers': [
                    {'ip': '192.168.1.100', 'bytes': 1024000, 'packets': 500},
                    {'ip': '192.168.1.101', 'bytes': 896000, 'packets': 420},
                    {'ip': '192.168.1.102', 'bytes': 745000, 'packets': 380}
                ]
            }
        }
        
        return jsonify({
            'success': True,
            'data': pcap_data,
            'export_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error exporting PCAP data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/network/report', methods=['POST'])
def export_network_report():
    """Export comprehensive network analysis report"""
    global api_stats
    api_stats['requests_served'] += 1
    api_stats['exports_generated'] += 1
    
    try:
        report = {
            'report_metadata': {
                'title': 'Network Traffic Analysis Report',
                'generated': datetime.now().isoformat(),
                'period': '24-hour monitoring period',
                'author': 'CyberAuton Network Monitoring System'
            },
            'executive_summary': {
                'total_packets': random.randint(1000000, 5000000),
                'average_bandwidth': random.uniform(70, 85),
                'active_connections': random.randint(1000, 2000),
                'security_alerts': random.randint(15, 45),
                'anomalies_detected': random.randint(5, 15),
                'blocked_connections': random.randint(100, 500)
            },
            'traffic_analysis': {
                'protocol_distribution': {
                    'HTTP/HTTPS': random.uniform(40, 60),
                    'TCP': random.uniform(20, 35),
                    'UDP': random.uniform(10, 20),
                    'DNS': random.uniform(5, 10),
                    'SSH': random.uniform(1, 5),
                    'Other': random.uniform(1, 3)
                },
                'peak_hours': ['09:00-10:00', '14:00-15:00', '20:00-21:00'],
                'geographic_distribution': {
                    'United States': 45.2,
                    'China': 18.7,
                    'Germany': 12.3,
                    'United Kingdom': 8.9,
                    'France': 6.5,
                    'Other': 8.4
                }
            },
            'security_findings': {
                'suspicious_traffic': [
                    {'source': '192.168.1.254', 'reason': 'High volume outbound traffic', 'risk': 'medium'},
                    {'source': '192.168.1.100', 'reason': 'Unusual port scanning activity', 'risk': 'high'},
                    {'source': '10.0.0.50', 'reason': 'Encrypted traffic to unknown destination', 'risk': 'medium'}
                ],
                'blocked_connections': random.randint(50, 200),
                'quarantined_ips': ['192.168.1.250', '10.0.0.100', '172.16.0.75'],
                'malware_signatures': random.randint(0, 5)
            },
            'recommendations': [
                'Implement rate limiting for high-volume sources',
                'Review firewall rules for port scanning prevention',
                'Enable DPI for encrypted traffic analysis',
                'Deploy additional sensors for comprehensive coverage',
                'Update intrusion detection signatures',
                'Enhance monitoring for lateral movement'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': report,
            'export_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating network report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/audit/logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with filtering"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        # Generate mock audit logs
        audit_logs = []
        for i in range(100):
            log_entry = {
                'id': str(uuid.uuid4()),
                'timestamp': datetime.now() - timedelta(hours=random.randint(0, 168)),
                'user': random.choice(['admin@shield.com', 'security@shield.com', 'analyst@shield.com', 'system']),
                'action': random.choice(['FILE_ACCESS', 'EXPORT_PCAP', 'MITRE_EXPORT', 'LOGIN', 'LOGOUT', 'CONFIG_CHANGE']),
                'resource': random.choice([
                    '/secure/threat_intel/ioc_database.json',
                    '/network/captures/suspicious_traffic.pcap',
                    '/frameworks/mitre_attack_matrix.xlsx',
                    '/config/security_policies.yaml',
                    '/logs/security_events.log'
                ]),
                'status': random.choice(['success', 'failure', 'warning']),
                'ip_address': f"192.168.1.{random.randint(100, 200)}",
                'user_agent': random.choice([
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Mozilla/5.0 (Linux; Ubuntu)',
                    'Mozilla/5.0 (Mac OS X)',
                    'SystemProcess/1.0'
                ]),
                'details': {
                    'operation': random.choice(['read', 'write', 'delete', 'export']),
                    'bytes_affected': random.randint(1024, 1048576),
                    'duration': random.uniform(0.1, 5.0)
                },
                'risk_level': random.choice(['low', 'medium', 'high', 'critical'])
            }
            
            # Convert datetime to ISO string
            log_entry['timestamp'] = log_entry['timestamp'].isoformat()
            audit_logs.append(log_entry)
        
        return jsonify({
            'success': True,
            'data': audit_logs,
            'total': len(audit_logs),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving audit logs: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/file-info/<path:file_path>', methods=['GET'])
def get_file_info(file_path):
    """Get detailed file information for audit purposes"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        # Mock file information
        file_info = {
            'file_path': f"/{file_path}",
            'file_name': file_path.split('/')[-1],
            'size_bytes': random.randint(1024, 104857600),
            'created': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            'modified': (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
            'accessed': datetime.now().isoformat(),
            'permissions': random.choice(['rw-r-----', 'rw-r--r--', 'rw-------']),
            'owner': random.choice(['security_team', 'network_admin', 'threat_intel', 'system']),
            'hash_sha256': hashlib.sha256(f"{file_path}{time.time()}".encode()).hexdigest(),
            'mime_type': random.choice([
                'application/json',
                'application/vnd.tcpdump.pcap',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/yaml',
                'text/plain'
            ]),
            'encrypted': random.choice([True, False]),
            'sensitive': random.choice([True, False]),
            'access_log': [
                {
                    'timestamp': (datetime.now() - timedelta(minutes=random.randint(1, 1440))).isoformat(),
                    'user': random.choice(['admin@shield.com', 'security@shield.com', 'analyst@shield.com']),
                    'action': random.choice(['read', 'write', 'metadata_access']),
                    'ip_address': f"192.168.1.{random.randint(100, 200)}"
                } for _ in range(random.randint(1, 10))
            ],
            'security_classification': random.choice(['public', 'internal', 'confidential', 'restricted']),
            'backup_status': random.choice(['backed_up', 'pending', 'failed']),
            'integrity_check': {
                'last_verified': (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(),
                'status': random.choice(['verified', 'modified', 'corrupted']),
                'checksum_match': random.choice([True, False])
            }
        }
        
        return jsonify({
            'success': True,
            'data': file_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving file info: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/threats/real-time', methods=['GET'])
def get_real_time_threats():
    """Get real-time threat data"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        threats = []
        for _ in range(random.randint(5, 15)):
            threat = {
                'id': str(uuid.uuid4()),
                'timestamp': datetime.now().isoformat(),
                'type': random.choice(['DDoS', 'Malware', 'Brute Force', 'Port Scan', 'Data Exfiltration', 'Botnet']),
                'severity': random.choice(['low', 'medium', 'high', 'critical']),
                'confidence': random.uniform(0.7, 0.99),
                'source_ip': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'target_ip': f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'status': random.choice(['detected', 'investigating', 'mitigated', 'blocked']),
                'mitre_technique': random.choice(['T1566', 'T1059', 'T1190', 'T1078', 'T1055']),
                'affected_systems': random.randint(1, 10),
                'response_action': random.choice(['block_ip', 'isolate_host', 'rate_limit', 'alert_only'])
            }
            threats.append(threat)
        
        return jsonify({
            'success': True,
            'data': threats,
            'total': len(threats),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving threats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/metrics', methods=['GET'])
def get_system_metrics():
    """Get real-time system performance metrics"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'usage_percent': random.uniform(20, 80),
                'cores': 8,
                'temperature': random.uniform(45, 75)
            },
            'memory': {
                'usage_percent': random.uniform(40, 85),
                'total_gb': 32,
                'available_gb': random.uniform(5, 20)
            },
            'disk': {
                'usage_percent': random.uniform(30, 70),
                'total_tb': 2,
                'available_gb': random.uniform(500, 1500)
            },
            'network': {
                'bytes_sent': random.randint(1000000, 10000000),
                'bytes_received': random.randint(1000000, 10000000),
                'packets_sent': random.randint(10000, 100000),
                'packets_received': random.randint(10000, 100000),
                'connections_active': random.randint(100, 1000)
            },
            'security': {
                'threats_detected': random.randint(0, 50),
                'threats_blocked': random.randint(0, 30),
                'ids_rules_triggered': random.randint(0, 100),
                'false_positives': random.randint(0, 5)
            }
        }
        
        return jsonify({
            'success': True,
            'data': metrics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving system metrics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/export/comprehensive-report', methods=['POST'])
def export_comprehensive_report():
    """Export comprehensive security report"""
    global api_stats
    api_stats['requests_served'] += 1
    api_stats['exports_generated'] += 1
    
    try:
        report = {
            'report_metadata': {
                'title': 'SHIELD Security Operations Center - Comprehensive Report',
                'generated': datetime.now().isoformat(),
                'period': request.json.get('period', '24 hours'),
                'author': 'SHIELD SOC Automated Reporting System',
                'classification': 'CONFIDENTIAL',
                'report_id': str(uuid.uuid4())
            },
            'executive_summary': {
                'security_posture': random.choice(['Excellent', 'Good', 'Fair', 'Poor']),
                'threat_level': random.choice(['Low', 'Medium', 'High', 'Critical']),
                'incidents_detected': random.randint(10, 100),
                'incidents_resolved': random.randint(8, 95),
                'mean_detection_time': random.uniform(30, 300),
                'mean_response_time': random.uniform(60, 600)
            },
            'threat_landscape': {
                'top_threats': [
                    {'type': 'DDoS', 'count': random.randint(10, 50), 'trend': 'increasing'},
                    {'type': 'Malware', 'count': random.randint(5, 30), 'trend': 'stable'},
                    {'type': 'Brute Force', 'count': random.randint(15, 40), 'trend': 'decreasing'}
                ],
                'attack_vectors': {
                    'network': random.uniform(40, 60),
                    'email': random.uniform(20, 35),
                    'web': random.uniform(10, 25),
                    'physical': random.uniform(0, 5)
                },
                'geographic_sources': {
                    'China': random.uniform(25, 35),
                    'Russia': random.uniform(15, 25),
                    'United States': random.uniform(10, 20),
                    'Other': random.uniform(20, 50)
                }
            },
            'security_controls': {
                'ids_effectiveness': random.uniform(85, 95),
                'firewall_blocks': random.randint(1000, 10000),
                'antivirus_detections': random.randint(50, 500),
                'endpoint_compliance': random.uniform(90, 99),
                'patch_compliance': random.uniform(85, 98)
            },
            'compliance_status': {
                'iso_27001': random.choice(['Compliant', 'Non-Compliant', 'Partial']),
                'nist_csf': random.choice(['Compliant', 'Non-Compliant', 'Partial']),
                'gdpr': random.choice(['Compliant', 'Non-Compliant', 'Partial']),
                'sox': random.choice(['Compliant', 'Non-Compliant', 'Partial'])
            },
            'recommendations': [
                'Enhance email security controls',
                'Implement zero-trust architecture',
                'Increase security awareness training',
                'Deploy additional network sensors',
                'Update incident response procedures'
            ],
            'appendices': {
                'technical_details': 'Available in separate technical report',
                'raw_data': 'Available upon request',
                'methodology': 'Based on NIST Cybersecurity Framework'
            }
        }
        
        return jsonify({
            'success': True,
            'data': report,
            'export_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating comprehensive report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# WebSocket support for real-time updates
@app.route('/api/websocket/test', methods=['GET'])
def test_websocket():
    """Test WebSocket connectivity"""
    return jsonify({
        'websocket_available': True,
        'mock_data_enabled': True,
        'endpoints': [
            'ws://localhost:8080',
            'wss://localhost:8080'
        ]
    })

# CIC-IDS Dataset Integration Endpoints
@app.route('/api/cic-ids/dataset/load', methods=['POST'])
def load_cic_ids_dataset():
    \"\"\"Load CIC-IDS dataset\"\"\"
    global api_stats, enhanced_ids_manager
    api_stats['requests_served'] += 1
    api_stats['cic_ids_requests'] = api_stats.get('cic_ids_requests', 0) + 1
    
    if not ENHANCED_IDS_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Enhanced IDS system not available - install required dependencies'
        }), 503
    
    try:
        dataset_name = request.json.get('dataset', 'CIC-IDS2017') if request.json else 'CIC-IDS2017'
        
        if not enhanced_ids_manager:
            enhanced_ids_manager = CICIDSDatasetManager()
        
        # Load dataset
        df = enhanced_ids_manager.load_real_dataset(dataset_name)
        if df is not None:
            processed_df = enhanced_ids_manager.preprocess_dataset(df, dataset_name)
            models = enhanced_ids_manager.train_models(processed_df, dataset_name)
            stats = enhanced_ids_manager.get_dataset_stats()
            
            return jsonify({
                'success': True,
                'dataset_loaded': dataset_name,
                'stats': stats,
                'models_trained': list(models.keys()),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to load dataset'
            }), 500
            
    except Exception as e:
        logger.error(f\"Error loading CIC-IDS dataset: {e}\")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/cic-ids/stats', methods=['GET'])
def get_cic_ids_stats():
    \"\"\"Get CIC-IDS dataset statistics\"\"\"
    global api_stats, enhanced_ids_manager
    api_stats['requests_served'] += 1
    
    if not ENHANCED_IDS_AVAILABLE or not enhanced_ids_manager:
        return jsonify({
            'success': False,
            'error': 'CIC-IDS system not initialized'
        }), 503
    
    try:
        stats = enhanced_ids_manager.get_dataset_stats()
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f\"Error getting CIC-IDS stats: {e}\")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ids/start', methods=['POST'])
def start_ids_system():
    \"\"\"Start IDS system\"\"\"
    global api_stats, ids_engine, enhanced_ids_simulator
    api_stats['requests_served'] += 1
    
    try:
        # Start enhanced IDS if available
        if ENHANCED_IDS_AVAILABLE and enhanced_ids_manager:
            if not enhanced_ids_simulator:
                enhanced_ids_simulator = RealTimeDataSimulator(enhanced_ids_manager)
            enhanced_ids_simulator.start_simulation()
        
        # Start regular IDS
        if not ids_engine:
            ids_engine = RealTimeIDSEngine()
        
        if not ids_engine.running:
            ids_engine.start()
        
        return jsonify({
            'success': True,
            'ids_running': True,
            'enhanced_ids_available': ENHANCED_IDS_AVAILABLE,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f\"Error starting IDS: {e}\")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ids/stop', methods=['POST'])
def stop_ids_system():
    \"\"\"Stop IDS system\"\"\"
    global api_stats, ids_engine, enhanced_ids_simulator
    api_stats['requests_served'] += 1
    
    try:
        if enhanced_ids_simulator:
            enhanced_ids_simulator.stop_simulation()
        
        if ids_engine:
            ids_engine.stop()
        
        return jsonify({
            'success': True,
            'ids_running': False,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error stopping IDS: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# DATA SECURITY & INTEGRITY ENDPOINTS
# ============================================================================

@app.route('/api/security/status', methods=['GET'])
def get_security_status():
    """Get comprehensive security status"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        # Generate comprehensive security status
        security_status = {
            'encryption': {
                'enabled': True,
                'algorithm': 'AES-256',
                'status': 'active',
                'keys_rotated': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                'next_rotation': (datetime.now() + timedelta(days=random.randint(30, 90))).isoformat()
            },
            'integrity': {
                'files_monitored': random.randint(500, 1000),
                'files_verified': random.randint(480, 999),
                'files_modified': random.randint(0, 5),
                'checksum_algorithm': 'SHA-256',
                'last_scan': (datetime.now() - timedelta(hours=random.randint(1, 6))).isoformat()
            },
            'authentication': {
                'system': 'JWT',
                'active_sessions': random.randint(5, 25),
                'failed_attempts_24h': random.randint(0, 10),
                'token_expiry': '24h',
                'mfa_enabled': True
            },
            'backup': {
                'last_backup': (datetime.now() - timedelta(hours=random.randint(1, 12))).isoformat(),
                'backup_count': random.randint(10, 50),
                'backup_size_gb': random.uniform(5, 50),
                'next_scheduled': (datetime.now() + timedelta(hours=12)).isoformat(),
                'retention_days': 30
            },
            'monitoring': {
                'active_alerts': random.randint(0, 5),
                'events_24h': random.randint(1000, 5000),
                'anomalies_detected': random.randint(0, 15),
                'response_time_ms': random.uniform(10, 100)
            },
            'compliance': {
                'gdpr': random.choice(['Compliant', 'Review Required']),
                'hipaa': random.choice(['Compliant', 'N/A']),
                'pci_dss': random.choice(['Compliant', 'Review Required']),
                'iso_27001': random.choice(['Compliant', 'In Progress'])
            },
            'overall_health': random.choice(['Excellent', 'Good', 'Fair']),
            'risk_score': random.uniform(10, 40),
            'last_audit': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': security_status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting security status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/security/violations', methods=['GET'])
def get_security_violations():
    """Get recent security violations"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        violations = []
        violation_types = [
            'Unauthorized Access Attempt',
            'Integrity Check Failed',
            'Encryption Key Mismatch',
            'Suspicious File Modification',
            'Failed Authentication',
            'Data Exfiltration Attempt',
            'Anomalous Behavior Detected',
            'Permission Violation'
        ]
        
        for i in range(random.randint(10, 30)):
            violation = {
                'id': str(uuid.uuid4()),
                'timestamp': (datetime.now() - timedelta(hours=random.randint(0, 72))).isoformat(),
                'type': random.choice(violation_types),
                'severity': random.choice(['low', 'medium', 'high', 'critical']),
                'user': random.choice(['user@system.com', 'admin@system.com', 'service_account', 'unknown']),
                'resource': random.choice([
                    '/secure/data/sensitive_records.db',
                    '/config/security_policies.yaml',
                    '/keys/encryption.key',
                    '/logs/audit_trail.log',
                    '/network/firewall_rules.json'
                ]),
                'action': random.choice(['read', 'write', 'delete', 'modify', 'access']),
                'ip_address': f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'status': random.choice(['blocked', 'flagged', 'investigating', 'resolved']),
                'details': {
                    'reason': random.choice([
                        'Checksum mismatch detected',
                        'Unauthorized IP address',
                        'Invalid credentials',
                        'Abnormal access pattern',
                        'File permissions violated'
                    ]),
                    'risk_level': random.uniform(0.3, 0.95),
                    'auto_remediated': random.choice([True, False])
                }
            }
            violations.append(violation)
        
        # Sort by timestamp (most recent first)
        violations.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': violations,
            'total': len(violations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting security violations: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/security/access-log', methods=['GET'])
def get_security_access_log():
    """Get data access log"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        limit = request.args.get('limit', 50, type=int)
        access_logs = []
        
        for i in range(limit):
            log_entry = {
                'id': str(uuid.uuid4()),
                'timestamp': (datetime.now() - timedelta(minutes=random.randint(0, 1440))).isoformat(),
                'user': random.choice(['admin@system.com', 'analyst@system.com', 'operator@system.com', 'system']),
                'action': random.choice(['FILE_READ', 'FILE_WRITE', 'FILE_DELETE', 'DECRYPT', 'ENCRYPT', 'BACKUP', 'RESTORE']),
                'resource': random.choice([
                    '/data/threat_intelligence.db',
                    '/data/network_captures.pcap',
                    '/config/system_settings.json',
                    '/logs/security_events.log',
                    '/secure/encryption_keys.vault'
                ]),
                'status': random.choice(['success', 'failure', 'warning']),
                'ip_address': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'user_agent': random.choice([
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Mozilla/5.0 (Linux; Ubuntu)',
                    'SystemProcess/1.0',
                    'API Client/2.0'
                ]),
                'details': {
                    'bytes_accessed': random.randint(1024, 10485760),
                    'duration_ms': random.uniform(10, 1000),
                    'encrypted': random.choice([True, False]),
                    'integrity_verified': random.choice([True, False])
                }
            }
            access_logs.append(log_entry)
        
        # Sort by timestamp (most recent first)
        access_logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': access_logs,
            'total': len(access_logs),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting access log: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/backup/create', methods=['POST'])
def create_backup():
    """Create a new backup"""
    global api_stats
    api_stats['requests_served'] += 1
    api_stats['exports_generated'] += 1
    
    try:
        backup_id = str(uuid.uuid4())
        backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Simulate backup creation
        backup_info = {
            'backup_id': backup_id,
            'name': backup_name,
            'created': datetime.now().isoformat(),
            'size_bytes': random.randint(1048576, 104857600),
            'size_mb': random.uniform(1, 100),
            'status': 'completed',
            'type': 'full',
            'encrypted': True,
            'compression': 'gzip',
            'items_backed_up': random.randint(100, 1000),
            'duration_seconds': random.uniform(5, 60),
            'location': f'/backups/{backup_name}.tar.gz.enc',
            'checksum_sha256': hashlib.sha256(f"{backup_id}{time.time()}".encode()).hexdigest(),
            'retention_days': 30,
            'auto_delete_date': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': backup_info,
            'message': 'Backup created successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/backup/list', methods=['GET'])
def list_backups():
    """List all available backups"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        backups = []
        for i in range(random.randint(10, 30)):
            backup = {
                'backup_id': str(uuid.uuid4()),
                'name': f"backup_{(datetime.now() - timedelta(days=i)).strftime('%Y%m%d_%H%M%S')}",
                'created': (datetime.now() - timedelta(days=i)).isoformat(),
                'size_mb': random.uniform(1, 100),
                'status': random.choice(['completed', 'in_progress', 'failed']),
                'type': random.choice(['full', 'incremental', 'differential']),
                'encrypted': True,
                'items_count': random.randint(100, 1000)
            }
            backups.append(backup)
        
        return jsonify({
            'success': True,
            'data': backups,
            'total': len(backups),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing backups: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# END OF SECURITY ENDPOINTS
# ============================================================================

def start_ids_engine():
    """Start the IDS engine in background"""
    global ids_engine
    try:
        ids_engine = RealTimeIDSEngine()
        ids_engine.start()
        logger.info("IDS Engine started successfully")
    except Exception as e:
        logger.error(f"Failed to start IDS engine: {e}")

if __name__ == '__main__':
    # Start IDS engine in background
    ids_thread = threading.Thread(target=start_ids_engine, daemon=True)
    ids_thread.start()
    
    logger.info("Starting SHIELD Backend API Server...")
    logger.info("API Documentation available at: http://localhost:5000/api/health")
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True
    )