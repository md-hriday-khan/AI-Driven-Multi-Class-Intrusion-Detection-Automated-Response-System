#!/usr/bin/env python3
"""
API Model Connector for SHIELD SOC
Provides REST API endpoints for ML model integration
Created by Md.Hriday Khan
"""

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import numpy as np
import pandas as pd
import json
import logging
import time
import asyncio
import websockets
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import sqlite3
import hashlib
import jwt
import pickle
import joblib
from functools import wraps
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Import our ML systems
from intrusion_prevention_system import IntrusionPreventionSystem, NetworkPacket
from zero_day_detection import ZeroDayDetectionEngine
from adversarial_resilience import AdversarialResilienceSystem
from threat_intelligence_engine import ThreatIntelligenceEngine
from privacy_preserving_analytics import PrivacyPreservingQueryEngine
from digital_twin_security import DigitalTwinManager

class ModelAPIServer:
    """REST API server for ML model integration"""
    
    def __init__(self, port: int = 5000):
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'shield_soc_secret_key_hriday_khan_2024'
        CORS(self.app)
        
        self.port = port
        
        # Initialize ML systems
        self.ips_system = None
        self.zero_day_engine = None
        self.adversarial_system = None
        self.threat_intel_engine = None
        self.privacy_engine = None
        self.digital_twin = None
        
        # API usage tracking
        self.api_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'requests_by_endpoint': {},
            'last_request_time': None
        }
        
        # Rate limiting
        self.rate_limits = {}
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('ModelAPIServer')
        
        # Initialize systems
        self._initialize_ml_systems()
        
        # Setup routes
        self._setup_routes()
        
        # Start WebSocket server for real-time updates
        self.websocket_clients = set()
        threading.Thread(target=self._start_websocket_server, daemon=True).start()
    
    def _initialize_ml_systems(self):
        """Initialize all ML systems"""
        try:
            self.logger.info("Initializing ML systems...")
            
            # IPS System
            self.ips_system = IntrusionPreventionSystem()
            
            # Zero-day detection (would need to train models in production)
            self.zero_day_engine = ZeroDayDetectionEngine()
            
            # Threat Intelligence
            self.threat_intel_engine = ThreatIntelligenceEngine()
            
            # Privacy Analytics
            self.privacy_engine = PrivacyPreservingQueryEngine()
            
            # Digital Twin
            self.digital_twin = DigitalTwinManager()
            
            self.logger.info("All ML systems initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Error initializing ML systems: {e}")
    
    def _setup_routes(self):
        """Setup API routes"""
        
        # Authentication decorator
        def token_required(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                token = None
                
                # Check for token in header
                if 'Authorization' in request.headers:
                    auth_header = request.headers['Authorization']
                    try:
                        token = auth_header.split(" ")[1]  # Bearer TOKEN
                    except IndexError:
                        pass
                
                if not token:
                    return jsonify({'error': 'Token is missing'}), 401
                
                try:
                    # For demo purposes, we'll accept a simple token
                    # In production, use proper JWT validation
                    if token != 'shield_api_token_2024':
                        raise Exception('Invalid token')
                except:
                    return jsonify({'error': 'Token is invalid'}), 401
                
                return f(*args, **kwargs)
            
            return decorated
        
        # Rate limiting decorator
        def rate_limit(max_requests: int = 100, window: int = 3600):
            def decorator(f):
                @wraps(f)
                def decorated(*args, **kwargs):
                    client_ip = request.remote_addr
                    current_time = time.time()
                    
                    if client_ip not in self.rate_limits:
                        self.rate_limits[client_ip] = []
                    
                    # Clean old requests
                    self.rate_limits[client_ip] = [
                        req_time for req_time in self.rate_limits[client_ip]
                        if current_time - req_time < window
                    ]
                    
                    # Check rate limit
                    if len(self.rate_limits[client_ip]) >= max_requests:
                        return jsonify({'error': 'Rate limit exceeded'}), 429
                    
                    # Add current request
                    self.rate_limits[client_ip].append(current_time)
                    
                    return f(*args, **kwargs)
                
                return decorated
            return decorator
        
        # Health check endpoint
        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'systems': {
                    'ips': self.ips_system is not None,
                    'zero_day': self.zero_day_engine is not None,
                    'threat_intel': self.threat_intel_engine is not None,
                    'privacy': self.privacy_engine is not None,
                    'digital_twin': self.digital_twin is not None
                },
                'api_stats': self.api_stats
            })
        
        # IPS endpoints
        @self.app.route('/api/ips/analyze', methods=['POST'])
        @token_required
        @rate_limit(max_requests=1000, window=3600)
        def analyze_packet():
            """Analyze network packet for threats"""
            try:
                data = request.get_json()
                
                # Create NetworkPacket object
                packet = NetworkPacket(
                    timestamp=data.get('timestamp', datetime.now().isoformat()),
                    src_ip=data['src_ip'],
                    dst_ip=data['dst_ip'],
                    src_port=int(data['src_port']),
                    dst_port=int(data['dst_port']),
                    protocol=data.get('protocol', 'TCP'),
                    packet_size=int(data.get('packet_size', 1500)),
                    flags=data.get('flags', ['SYN']),
                    payload_size=int(data.get('payload_size', 1460)),
                    ttl=int(data.get('ttl', 64)),
                    window_size=int(data.get('window_size', 65535)),
                    packet_id=data.get('packet_id', f"api_{int(time.time())}"),
                    is_fragment=data.get('is_fragment', False),
                    fragment_offset=int(data.get('fragment_offset', 0))
                )
                
                # Process packet
                detections = self.ips_system.process_packet(packet)
                
                self._update_api_stats('/api/ips/analyze', True)
                
                return jsonify({
                    'success': True,
                    'packet_id': packet.packet_id,
                    'detections': [
                        {
                            'detection_id': d.detection_id,
                            'threat_type': d.threat_type,
                            'severity': d.severity,
                            'confidence': d.confidence,
                            'blocked': d.blocked,
                            'mitigation_action': d.mitigation_action
                        } for d in detections
                    ],
                    'processed_at': datetime.now().isoformat()
                })
                
            except Exception as e:
                self._update_api_stats('/api/ips/analyze', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/ips/dashboard', methods=['GET'])
        @token_required
        def get_ips_dashboard():
            """Get IPS dashboard data"""
            try:
                dashboard_data = self.ips_system.get_dashboard_data()
                self._update_api_stats('/api/ips/dashboard', True)
                return jsonify({'success': True, 'data': dashboard_data})
            except Exception as e:
                self._update_api_stats('/api/ips/dashboard', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/ips/block-ip', methods=['POST'])
        @token_required
        def block_ip():
            """Block an IP address"""
            try:
                data = request.get_json()
                ip_address = data['ip_address']
                reason = data.get('reason', 'Manual block')
                duration = int(data.get('duration', 3600))  # 1 hour default
                
                rule_data = {
                    'type': 'ip_block',
                    'criteria': {'ip_address': ip_address, 'reason': reason},
                    'action': 'block',
                    'duration': duration
                }
                
                rule_id = self.ips_system.add_custom_rule(rule_data)
                
                self._update_api_stats('/api/ips/block-ip', True)
                
                return jsonify({
                    'success': True,
                    'rule_id': rule_id,
                    'ip_address': ip_address,
                    'duration': duration
                })
                
            except Exception as e:
                self._update_api_stats('/api/ips/block-ip', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Zero-day detection endpoints
        @self.app.route('/api/zero-day/analyze', methods=['POST'])
        @token_required
        @rate_limit(max_requests=500, window=3600)
        def analyze_zero_day():
            """Analyze sample for zero-day attacks"""
            try:
                data = request.get_json()
                
                # Analyze sample
                alert = self.zero_day_engine.analyze_sample(data)
                
                self._update_api_stats('/api/zero-day/analyze', True)
                
                if alert:
                    return jsonify({
                        'success': True,
                        'zero_day_detected': True,
                        'alert': {
                            'alert_id': alert.alert_id,
                            'confidence_score': alert.confidence_score,
                            'anomaly_score': alert.anomaly_score,
                            'severity': alert.severity,
                            'attack_vector': alert.attack_vector,
                            'recommended_actions': alert.recommended_actions[:5]  # Limit for API
                        }
                    })
                else:
                    return jsonify({
                        'success': True,
                        'zero_day_detected': False,
                        'message': 'No zero-day attack detected'
                    })
                
            except Exception as e:
                self._update_api_stats('/api/zero-day/analyze', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/zero-day/dashboard', methods=['GET'])
        @token_required
        def get_zero_day_dashboard():
            """Get zero-day detection dashboard data"""
            try:
                dashboard_data = self.zero_day_engine.get_detection_dashboard_data()
                self._update_api_stats('/api/zero-day/dashboard', True)
                return jsonify({'success': True, 'data': dashboard_data})
            except Exception as e:
                self._update_api_stats('/api/zero-day/dashboard', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Threat Intelligence endpoints
        @self.app.route('/api/threat-intel/query', methods=['POST'])
        @token_required
        def query_threat_intel():
            """Query threat intelligence"""
            try:
                data = request.get_json()
                
                # Query indicators
                indicators = self.threat_intel_engine.query_indicators(data)
                
                self._update_api_stats('/api/threat-intel/query', True)
                
                return jsonify({
                    'success': True,
                    'indicators': [
                        {
                            'indicator_id': ind.indicator_id,
                            'type': ind.indicator_type,
                            'value': ind.value,
                            'confidence': ind.confidence,
                            'severity': ind.severity,
                            'source': ind.source,
                            'reputation_score': ind.reputation_score
                        } for ind in indicators
                    ]
                })
                
            except Exception as e:
                self._update_api_stats('/api/threat-intel/query', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/threat-intel/dashboard', methods=['GET'])
        @token_required
        def get_threat_intel_dashboard():
            """Get threat intelligence dashboard data"""
            try:
                dashboard_data = self.threat_intel_engine.get_threat_intelligence_summary()
                self._update_api_stats('/api/threat-intel/dashboard', True)
                return jsonify({'success': True, 'data': dashboard_data})
            except Exception as e:
                self._update_api_stats('/api/threat-intel/dashboard', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Privacy Analytics endpoints
        @self.app.route('/api/privacy/submit-query', methods=['POST'])
        @token_required
        def submit_privacy_query():
            """Submit privacy-preserving analytics query"""
            try:
                data = request.get_json()
                
                from privacy_preserving_analytics import AnalyticsQuery, PrivacyParameters
                
                # Create privacy parameters
                privacy_params = PrivacyParameters(
                    epsilon=float(data.get('epsilon', 1.0)),
                    delta=float(data.get('delta', 1e-5)),
                    sensitivity=float(data.get('sensitivity', 1.0)),
                    mechanism=data.get('mechanism', 'laplace')
                )
                
                # Create query
                query = AnalyticsQuery(
                    query_id=f"api_{int(time.time())}_{hash(str(data)) % 10000}",
                    query_type=data['query_type'],
                    data_source=data['data_source'],
                    filters=data.get('filters', {}),
                    privacy_params=privacy_params,
                    timestamp=datetime.now().isoformat(),
                    user_id=data.get('user_id', 'api_user'),
                    approved=data.get('auto_approve', False)
                )
                
                # Submit query
                query_id = self.privacy_engine.submit_query(query)
                
                self._update_api_stats('/api/privacy/submit-query', True)
                
                return jsonify({
                    'success': True,
                    'query_id': query_id,
                    'status': 'submitted',
                    'requires_approval': not query.approved
                })
                
            except Exception as e:
                self._update_api_stats('/api/privacy/submit-query', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Digital Twin endpoints
        @self.app.route('/api/digital-twin/create-topology', methods=['POST'])
        @token_required
        def create_topology():
            """Create network topology in digital twin"""
            try:
                data = request.get_json()
                
                topology_result = self.digital_twin.create_network_topology(
                    topology_type=data.get('topology_type', 'corporate'),
                    workstations=int(data.get('workstations', 10)),
                    servers=int(data.get('servers', 3))
                )
                
                self._update_api_stats('/api/digital-twin/create-topology', True)
                
                return jsonify({
                    'success': True,
                    'topology': topology_result
                })
                
            except Exception as e:
                self._update_api_stats('/api/digital-twin/create-topology', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/digital-twin/run-scenario', methods=['POST'])
        @token_required
        def run_security_scenario():
            """Run security testing scenario"""
            try:
                data = request.get_json()
                
                scenario_id = self.digital_twin.run_security_scenario(
                    scenario_type=data['scenario_type'],
                    target_nodes=data.get('target_nodes'),
                    parameters=data.get('parameters', {})
                )
                
                self._update_api_stats('/api/digital-twin/run-scenario', True)
                
                return jsonify({
                    'success': True,
                    'scenario_id': scenario_id,
                    'status': 'running'
                })
                
            except Exception as e:
                self._update_api_stats('/api/digital-twin/run-scenario', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Batch processing endpoint
        @self.app.route('/api/batch/analyze', methods=['POST'])
        @token_required
        @rate_limit(max_requests=50, window=3600)
        def batch_analyze():
            """Batch analyze multiple samples"""
            try:
                data = request.get_json()
                samples = data.get('samples', [])
                analysis_type = data.get('type', 'ips')
                
                results = []
                
                for sample in samples[:100]:  # Limit batch size
                    try:
                        if analysis_type == 'ips':
                            packet = NetworkPacket(**sample)
                            detections = self.ips_system.process_packet(packet)
                            results.append({
                                'sample_id': sample.get('packet_id', ''),
                                'success': True,
                                'detections': len(detections),
                                'blocked': any(d.blocked for d in detections)
                            })
                        elif analysis_type == 'zero_day':
                            alert = self.zero_day_engine.analyze_sample(sample)
                            results.append({
                                'sample_id': sample.get('sample_id', ''),
                                'success': True,
                                'zero_day_detected': alert is not None,
                                'confidence': alert.confidence_score if alert else 0.0
                            })
                    except Exception as e:
                        results.append({
                            'sample_id': sample.get('sample_id', ''),
                            'success': False,
                            'error': str(e)
                        })
                
                self._update_api_stats('/api/batch/analyze', True)
                
                return jsonify({
                    'success': True,
                    'processed': len(results),
                    'results': results
                })
                
            except Exception as e:
                self._update_api_stats('/api/batch/analyze', False)
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # WebSocket endpoint info
        @self.app.route('/api/websocket/info', methods=['GET'])
        @token_required
        def websocket_info():
            """Get WebSocket connection information"""
            return jsonify({
                'websocket_url': f'ws://localhost:8765',
                'connected_clients': len(self.websocket_clients),
                'supported_events': [
                    'ips_metrics',
                    'threat_detection',
                    'zero_day_alert',
                    'system_status'
                ]
            })
        
        # API documentation endpoint
        @self.app.route('/api/docs', methods=['GET'])
        def api_documentation():
            """API documentation"""
            docs = {
                'title': 'SHIELD SOC API',
                'version': '1.0.0',
                'description': 'ML Model Integration API for SHIELD Security Operations Center',
                'created_by': 'Md.Hriday Khan',
                'authentication': {
                    'type': 'Bearer Token',
                    'header': 'Authorization: Bearer YOUR_TOKEN',
                    'demo_token': 'shield_api_token_2024'
                },
                'endpoints': {
                    'Health': {
                        'GET /api/health': 'System health check'
                    },
                    'IPS': {
                        'POST /api/ips/analyze': 'Analyze network packet',
                        'GET /api/ips/dashboard': 'Get IPS dashboard data',
                        'POST /api/ips/block-ip': 'Block IP address'
                    },
                    'Zero-Day Detection': {
                        'POST /api/zero-day/analyze': 'Analyze for zero-day attacks',
                        'GET /api/zero-day/dashboard': 'Get zero-day dashboard data'
                    },
                    'Threat Intelligence': {
                        'POST /api/threat-intel/query': 'Query threat indicators',
                        'GET /api/threat-intel/dashboard': 'Get threat intel dashboard'
                    },
                    'Privacy Analytics': {
                        'POST /api/privacy/submit-query': 'Submit privacy-preserving query'
                    },
                    'Digital Twin': {
                        'POST /api/digital-twin/create-topology': 'Create network topology',
                        'POST /api/digital-twin/run-scenario': 'Run security scenario'
                    },
                    'Batch Processing': {
                        'POST /api/batch/analyze': 'Batch analyze samples'
                    }
                },
                'rate_limits': {
                    'default': '100 requests per hour',
                    'analysis': '1000 requests per hour',
                    'batch': '50 requests per hour'
                }
            }
            
            return jsonify(docs)
        
        # API statistics endpoint
        @self.app.route('/api/stats', methods=['GET'])
        @token_required
        def api_statistics():
            """Get API usage statistics"""
            return jsonify({
                'success': True,
                'statistics': self.api_stats,
                'active_connections': len(self.websocket_clients)
            })
    
    def _update_api_stats(self, endpoint: str, success: bool):
        """Update API usage statistics"""
        self.api_stats['total_requests'] += 1
        self.api_stats['last_request_time'] = datetime.now().isoformat()
        
        if success:
            self.api_stats['successful_requests'] += 1
        else:
            self.api_stats['failed_requests'] += 1
        
        if endpoint not in self.api_stats['requests_by_endpoint']:
            self.api_stats['requests_by_endpoint'][endpoint] = {'total': 0, 'successful': 0, 'failed': 0}
        
        self.api_stats['requests_by_endpoint'][endpoint]['total'] += 1
        if success:
            self.api_stats['requests_by_endpoint'][endpoint]['successful'] += 1
        else:
            self.api_stats['requests_by_endpoint'][endpoint]['failed'] += 1
    
    def _start_websocket_server(self):
        """Start WebSocket server for real-time updates"""
        async def handle_client(websocket, path):
            """Handle WebSocket client connection"""
            self.websocket_clients.add(websocket)
            self.logger.info(f"WebSocket client connected. Total clients: {len(self.websocket_clients)}")
            
            try:
                # Send welcome message
                await websocket.send(json.dumps({
                    'type': 'connection',
                    'message': 'Connected to SHIELD SOC WebSocket',
                    'timestamp': datetime.now().isoformat()
                }))
                
                # Keep connection alive
                async for message in websocket:
                    # Echo received message (for testing)
                    await websocket.send(json.dumps({
                        'type': 'echo',
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    }))
                    
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                self.websocket_clients.discard(websocket)
                self.logger.info(f"WebSocket client disconnected. Total clients: {len(self.websocket_clients)}")
        
        # Start WebSocket server
        start_server = websockets.serve(handle_client, "localhost", 8765)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(start_server)
        loop.run_forever()
    
    async def broadcast_update(self, message: Dict[str, Any]):
        """Broadcast update to all WebSocket clients"""
        if self.websocket_clients:
            message_json = json.dumps(message)
            for client in self.websocket_clients.copy():
                try:
                    await client.send(message_json)
                except:
                    self.websocket_clients.discard(client)
    
    def run(self, debug: bool = False):
        """Run the API server"""
        self.logger.info(f"Starting SHIELD SOC API Server on port {self.port}")
        self.logger.info(f"API Documentation: http://localhost:{self.port}/api/docs")
        self.logger.info(f"WebSocket Server: ws://localhost:8765")
        self.logger.info("Created by Md.Hriday Khan")
        
        self.app.run(host='0.0.0.0', port=self.port, debug=debug, threaded=True)

def main():
    """Main function to start the API server"""
    print("SHIELD SOC ML Model API Server")
    print("Created by Md.Hriday Khan")
    print("=" * 50)
    
    # Create and run server
    server = ModelAPIServer(port=5000)
    server.run(debug=False)

if __name__ == "__main__":
    main()