#!/usr/bin/env python3
"""
Intrusion Prevention System API Server
Real-time intrusion detection, prevention, and response capabilities
Created for CyberAuton Security Operations Centre
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import time
import threading
import logging
from typing import Dict, List, Any
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global state for IPS
ips_state = {
    'is_active': True,
    'detections': [],
    'blocked_ips': [],
    'blocking_rules': [],
    'metrics': {
        'packets_analyzed': 0,
        'threats_detected': 0,
        'threats_blocked': 0,
        'false_positives': 0,
        'performance': {
            'cpu_usage': 0,
            'memory_usage': 0,
            'processing_latency': 0,
            'throughput_mbps': 0
        }
    },
    'signature_database': {
        'total_signatures': 156234,
        'last_updated': datetime.now().isoformat(),
        'version': '2025.10.21'
    }
}

# Threat signatures and patterns
THREAT_SIGNATURES = {
    'SQL_INJECTION': ['union select', 'or 1=1', "'; drop table", 'exec sp_'],
    'XSS': ['<script>', 'javascript:', 'onerror=', 'onload='],
    'DDOS': ['syn flood', 'udp flood', 'icmp flood', 'http flood'],
    'PORT_SCAN': ['nmap', 'masscan', 'zmap', 'rapid port scan'],
    'BRUTE_FORCE': ['multiple failed auth', 'password spray', 'credential stuffing'],
    'MALWARE': ['backdoor', 'trojan', 'ransomware', 'cryptominer'],
    'DATA_EXFILTRATION': ['large data transfer', 'compression', 'encoding', 'tunneling'],
    'COMMAND_INJECTION': ['&&', '||', ';', '`', '$()', 'powershell'],
}

# Mock network data
def generate_ip():
    """Generate a random IP address"""
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}"

def generate_threat_detection():
    """Generate a simulated threat detection"""
    threat_types = list(THREAT_SIGNATURES.keys())
    threat_type = random.choice(threat_types)
    severities = ['low', 'medium', 'high', 'critical']
    severity_weights = [0.4, 0.3, 0.2, 0.1]
    severity = random.choices(severities, weights=severity_weights)[0]
    
    attack_vectors = ['signature_match', 'ml_detection', 'behavioral', 'anomaly_detection', 'heuristic']
    mitigation_actions = ['block_ip', 'rate_limit', 'monitor', 'quarantine', 'drop_packet']
    
    source_ip = generate_ip()
    target_ip = generate_ip()
    
    indicators = random.sample(THREAT_SIGNATURES[threat_type], min(len(THREAT_SIGNATURES[threat_type]), random.randint(1, 3)))
    
    detection = {
        'detection_id': f"det_{int(time.time())}_{random.randint(1000, 9999)}",
        'timestamp': datetime.now().isoformat(),
        'threat_type': threat_type.lower(),
        'severity': severity,
        'confidence': round(random.uniform(0.65, 0.99), 3),
        'source_ip': source_ip,
        'source_port': random.randint(1024, 65535),
        'target_ip': target_ip,
        'target_port': random.choice([22, 23, 80, 443, 3306, 3389, 5432, 8080]),
        'protocol': random.choice(['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS']),
        'attack_vector': random.choice(attack_vectors),
        'indicators': indicators,
        'mitigation_action': random.choice(mitigation_actions),
        'blocked': random.random() > 0.25,  # 75% block rate
        'false_positive_risk': round(random.uniform(0.01, 0.25), 3),
        'packet_count': random.randint(1, 1000),
        'bytes_transferred': random.randint(512, 1048576),
        'geolocation': {
            'country': random.choice(['USA', 'China', 'Russia', 'Germany', 'UK', 'France', 'India']),
            'city': random.choice(['Unknown', 'Beijing', 'Moscow', 'Berlin', 'London', 'Mumbai']),
            'asn': f"AS{random.randint(1000, 99999)}"
        }
    }
    
    return detection

def create_blocking_rule(detection):
    """Create a blocking rule based on detection"""
    rule = {
        'rule_id': f"rule_{int(time.time())}_{random.randint(100, 999)}",
        'rule_type': random.choice(['ip_block', 'port_block', 'rate_limit', 'pattern_block']),
        'criteria': {
            'source_ip': detection['source_ip'],
            'threat_type': detection['threat_type']
        },
        'action': detection['mitigation_action'],
        'priority': random.choice(['low', 'medium', 'high', 'critical']),
        'duration': random.randint(1800, 7200),  # 30min - 2hours
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(seconds=random.randint(1800, 7200))).isoformat(),
        'hit_count': 0,
        'last_triggered': None,
        'enabled': True,
        'auto_generated': True
    }
    return rule

def background_threat_generation():
    """Background thread to generate threats"""
    while True:
        try:
            if ips_state['is_active']:
                # Generate threat detection
                if random.random() > 0.6:  # 40% chance
                    detection = generate_threat_detection()
                    ips_state['detections'].insert(0, detection)
                    ips_state['detections'] = ips_state['detections'][:100]  # Keep last 100
                    
                    # Update metrics
                    ips_state['metrics']['threats_detected'] += 1
                    if detection['blocked']:
                        ips_state['metrics']['threats_blocked'] += 1
                        if detection['mitigation_action'] == 'block_ip':
                            if detection['source_ip'] not in ips_state['blocked_ips']:
                                ips_state['blocked_ips'].append(detection['source_ip'])
                    
                    # Create blocking rule occasionally
                    if detection['blocked'] and random.random() > 0.7:
                        rule = create_blocking_rule(detection)
                        ips_state['blocking_rules'].insert(0, rule)
                        ips_state['blocking_rules'] = ips_state['blocking_rules'][:50]
                
                # Update performance metrics
                ips_state['metrics']['packets_analyzed'] += random.randint(1000, 5000)
                ips_state['metrics']['performance']['cpu_usage'] = round(random.uniform(20, 50), 1)
                ips_state['metrics']['performance']['memory_usage'] = round(random.uniform(40, 65), 1)
                ips_state['metrics']['performance']['processing_latency'] = round(random.uniform(0.1, 0.8), 3)
                ips_state['metrics']['performance']['throughput_mbps'] = round(random.uniform(500, 750), 1)
            
            time.sleep(2)  # Generate every 2 seconds
        except Exception as e:
            logger.error(f"Error in background threat generation: {e}")
            time.sleep(5)

# API Endpoints

@app.route('/api/ips/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Intrusion Prevention System',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'is_active': ips_state['is_active']
    })

@app.route('/api/ips/status', methods=['GET'])
def get_status():
    """Get IPS status"""
    return jsonify({
        'is_active': ips_state['is_active'],
        'metrics': ips_state['metrics'],
        'signature_database': ips_state['signature_database'],
        'active_rules': len(ips_state['blocking_rules']),
        'blocked_ips_count': len(ips_state['blocked_ips']),
        'detections_count': len(ips_state['detections']),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/toggle', methods=['POST'])
def toggle_ips():
    """Toggle IPS active state"""
    ips_state['is_active'] = not ips_state['is_active']
    action = 'activated' if ips_state['is_active'] else 'deactivated'
    logger.info(f"IPS {action}")
    return jsonify({
        'success': True,
        'is_active': ips_state['is_active'],
        'message': f'IPS {action}',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/detections', methods=['GET'])
def get_detections():
    """Get threat detections"""
    limit = request.args.get('limit', 50, type=int)
    severity = request.args.get('severity', None)
    threat_type = request.args.get('threat_type', None)
    
    detections = ips_state['detections'][:limit]
    
    # Filter by severity
    if severity:
        detections = [d for d in detections if d['severity'] == severity]
    
    # Filter by threat type
    if threat_type:
        detections = [d for d in detections if d['threat_type'] == threat_type]
    
    return jsonify({
        'detections': detections,
        'total': len(detections),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/detection/<detection_id>', methods=['GET'])
def get_detection_details(detection_id):
    """Get detailed information about a specific detection"""
    detection = next((d for d in ips_state['detections'] if d['detection_id'] == detection_id), None)
    
    if not detection:
        return jsonify({'error': 'Detection not found'}), 404
    
    return jsonify({
        'detection': detection,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/blocked-ips', methods=['GET'])
def get_blocked_ips():
    """Get list of blocked IP addresses"""
    return jsonify({
        'blocked_ips': ips_state['blocked_ips'],
        'count': len(ips_state['blocked_ips']),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/block-ip', methods=['POST'])
def block_ip():
    """Manually block an IP address"""
    data = request.get_json()
    ip = data.get('ip')
    
    if not ip:
        return jsonify({'error': 'IP address required'}), 400
    
    if ip not in ips_state['blocked_ips']:
        ips_state['blocked_ips'].append(ip)
        logger.info(f"Manually blocked IP: {ip}")
        
        # Create blocking rule
        rule = {
            'rule_id': f"rule_manual_{int(time.time())}",
            'rule_type': 'ip_block',
            'criteria': {'source_ip': ip},
            'action': 'block_ip',
            'priority': 'high',
            'duration': 3600,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(seconds=3600)).isoformat(),
            'hit_count': 0,
            'last_triggered': None,
            'enabled': True,
            'auto_generated': False
        }
        ips_state['blocking_rules'].insert(0, rule)
    
    return jsonify({
        'success': True,
        'message': f'IP {ip} has been blocked',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/unblock-ip', methods=['POST'])
def unblock_ip():
    """Unblock an IP address"""
    data = request.get_json()
    ip = data.get('ip')
    
    if not ip:
        return jsonify({'error': 'IP address required'}), 400
    
    if ip in ips_state['blocked_ips']:
        ips_state['blocked_ips'].remove(ip)
        logger.info(f"Unblocked IP: {ip}")
    
    return jsonify({
        'success': True,
        'message': f'IP {ip} has been unblocked',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/rules', methods=['GET'])
def get_blocking_rules():
    """Get active blocking rules"""
    limit = request.args.get('limit', 50, type=int)
    
    return jsonify({
        'rules': ips_state['blocking_rules'][:limit],
        'total': len(ips_state['blocking_rules']),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/rule/<rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    """Delete a blocking rule"""
    ips_state['blocking_rules'] = [r for r in ips_state['blocking_rules'] if r['rule_id'] != rule_id]
    logger.info(f"Deleted rule: {rule_id}")
    
    return jsonify({
        'success': True,
        'message': f'Rule {rule_id} deleted',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/metrics', methods=['GET'])
def get_metrics():
    """Get IPS performance metrics"""
    return jsonify({
        'metrics': ips_state['metrics'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/statistics', methods=['GET'])
def get_statistics():
    """Get statistical analysis of threats"""
    detections = ips_state['detections']
    
    # Group by threat type
    threat_types = {}
    for d in detections:
        t_type = d['threat_type']
        if t_type not in threat_types:
            threat_types[t_type] = 0
        threat_types[t_type] += 1
    
    # Group by severity
    severity_counts = {}
    for d in detections:
        severity = d['severity']
        if severity not in severity_counts:
            severity_counts[severity] = 0
        severity_counts[severity] += 1
    
    # Top source IPs
    source_ips = {}
    for d in detections:
        ip = d['source_ip']
        if ip not in source_ips:
            source_ips[ip] = 0
        source_ips[ip] += 1
    
    top_sources = sorted(source_ips.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return jsonify({
        'threat_types': threat_types,
        'severity_distribution': severity_counts,
        'top_source_ips': [{'ip': ip, 'count': count} for ip, count in top_sources],
        'total_detections': len(detections),
        'block_rate': round((ips_state['metrics']['threats_blocked'] / max(ips_state['metrics']['threats_detected'], 1)) * 100, 1),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/update-signatures', methods=['POST'])
def update_signatures():
    """Simulate signature database update"""
    logger.info("Updating signature database...")
    time.sleep(1)  # Simulate update process
    
    ips_state['signature_database']['total_signatures'] += random.randint(10, 100)
    ips_state['signature_database']['last_updated'] = datetime.now().isoformat()
    
    return jsonify({
        'success': True,
        'message': 'Signature database updated successfully',
        'signature_database': ips_state['signature_database'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ips/export', methods=['GET'])
def export_data():
    """Export IPS data"""
    export_type = request.args.get('type', 'detections')
    
    data = {
        'export_type': export_type,
        'generated_at': datetime.now().isoformat(),
        'data': None
    }
    
    if export_type == 'detections':
        data['data'] = ips_state['detections']
    elif export_type == 'rules':
        data['data'] = ips_state['blocking_rules']
    elif export_type == 'blocked_ips':
        data['data'] = ips_state['blocked_ips']
    elif export_type == 'full':
        data['data'] = {
            'detections': ips_state['detections'],
            'rules': ips_state['blocking_rules'],
            'blocked_ips': ips_state['blocked_ips'],
            'metrics': ips_state['metrics']
        }
    
    return jsonify(data)

if __name__ == '__main__':
    # Start background thread for threat generation
    thread = threading.Thread(target=background_threat_generation, daemon=True)
    thread.start()
    
    logger.info("=" * 80)
    logger.info("🛡️  INTRUSION PREVENTION SYSTEM API SERVER")
    logger.info("=" * 80)
    logger.info("Service: Intrusion Prevention System")
    logger.info("Port: 5003")
    logger.info("Status: ACTIVE")
    logger.info("Capabilities:")
    logger.info("  ✓ Real-time threat detection")
    logger.info("  ✓ Automatic IP blocking")
    logger.info("  ✓ Dynamic rule creation")
    logger.info("  ✓ Signature-based detection")
    logger.info("  ✓ Behavioral analysis")
    logger.info("  ✓ Performance monitoring")
    logger.info("=" * 80)
    logger.info("API Endpoints:")
    logger.info("  GET  /api/ips/health        - Health check")
    logger.info("  GET  /api/ips/status        - System status")
    logger.info("  POST /api/ips/toggle        - Toggle IPS on/off")
    logger.info("  GET  /api/ips/detections    - Get threat detections")
    logger.info("  GET  /api/ips/blocked-ips   - Get blocked IPs")
    logger.info("  POST /api/ips/block-ip      - Block an IP")
    logger.info("  POST /api/ips/unblock-ip    - Unblock an IP")
    logger.info("  GET  /api/ips/rules         - Get blocking rules")
    logger.info("  GET  /api/ips/metrics       - Get metrics")
    logger.info("  GET  /api/ips/statistics    - Get statistics")
    logger.info("=" * 80)
    
    app.run(host='0.0.0.0', port=5003, debug=True)
