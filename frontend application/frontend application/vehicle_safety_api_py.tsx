#!/usr/bin/env python3
"""
Vehicle Safety API Server
Emergency control system for autonomous vehicles in CyberAuton SOC
Created by Md.Hriday Khan
"""

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import time
import threading
import queue
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global vehicle state
vehicle_state = {
    'status': 'operational',
    'speed': 0.0,
    'location': {'lat': 40.7128, 'lng': -74.0060},
    'heading': 0.0,
    'emergency_mode': False,
    'systems': {
        'gps': True,
        'brakes': True,
        'steering': True,
        'communication': True,
        'engine': True
    },
    'last_update': time.time()
}

# Emergency response queue
emergency_queue = queue.Queue()
response_log = []

class VehicleEmergencyController:
    """Handle vehicle emergency responses"""
    
    def __init__(self):
        self.active_responses = {}
        self.response_types = {
            'emergency_stop': {'severity': 'critical', 'time': 5},
            'controlled_stop': {'severity': 'high', 'time': 15},
            'pull_over': {'severity': 'medium', 'time': 30},
            'reduce_speed': {'severity': 'low', 'time': 10}
        }
    
    def execute_emergency_stop(self) -> Dict:
        """Execute immediate emergency stop"""
        response_id = str(uuid.uuid4())
        
        response = {
            'response_id': response_id,
            'action': 'emergency_stop',
            'timestamp': datetime.now().isoformat(),
            'status': 'executing',
            'details': 'Immediate emergency stop activated - all systems engaged',
            'estimated_time': 5,
            'safety_systems': ['emergency_brakes', 'hazard_lights', 'horn'],
            'location': vehicle_state['location'].copy()
        }
        
        # Update vehicle state
        vehicle_state['emergency_mode'] = True
        vehicle_state['status'] = 'emergency_stop'
        vehicle_state['speed'] = 0.0
        
        self.active_responses[response_id] = response
        response_log.append(response.copy())
        
        logger.info(f"Emergency stop executed: {response_id}")
        return response
    
    def execute_controlled_stop(self) -> Dict:
        """Execute controlled safe stop"""
        response_id = str(uuid.uuid4())
        
        response = {
            'response_id': response_id,
            'action': 'controlled_stop',
            'timestamp': datetime.now().isoformat(),
            'status': 'executing',
            'details': 'Controlled deceleration to safe stop position',
            'estimated_time': 15,
            'safety_systems': ['gradual_braking', 'lane_keeping', 'hazard_lights'],
            'location': vehicle_state['location'].copy(),
            'target_location': {
                'lat': vehicle_state['location']['lat'] + random.uniform(-0.001, 0.001),
                'lng': vehicle_state['location']['lng'] + random.uniform(-0.001, 0.001)
            }
        }
        
        # Update vehicle state
        vehicle_state['emergency_mode'] = True
        vehicle_state['status'] = 'controlled_stopping'
        
        self.active_responses[response_id] = response
        response_log.append(response.copy())
        
        logger.info(f"Controlled stop executed: {response_id}")
        return response
    
    def execute_pull_over(self) -> Dict:
        """Execute pull over to shoulder"""
        response_id = str(uuid.uuid4())
        
        response = {
            'response_id': response_id,
            'action': 'pull_over',
            'timestamp': datetime.now().isoformat(),
            'status': 'executing',
            'details': 'Safely maneuvering to road shoulder',
            'estimated_time': 30,
            'safety_systems': ['turn_signals', 'lane_change', 'gradual_deceleration'],
            'location': vehicle_state['location'].copy(),
            'target_location': {
                'lat': vehicle_state['location']['lat'] + random.uniform(-0.002, 0.002),
                'lng': vehicle_state['location']['lng'] + random.uniform(-0.002, 0.002)
            },
            'maneuver': 'right_shoulder'
        }
        
        # Update vehicle state
        vehicle_state['status'] = 'pulling_over'
        
        self.active_responses[response_id] = response
        response_log.append(response.copy())
        
        logger.info(f"Pull over executed: {response_id}")
        return response

# Initialize emergency controller
emergency_controller = VehicleEmergencyController()

# API Routes

@app.route('/api/emergency/stop', methods=['POST'])
def emergency_stop():
    """Execute emergency stop"""
    try:
        threat_data = request.json or {}
        
        response = emergency_controller.execute_emergency_stop()
        
        # Add threat context if provided
        if threat_data:
            response['threat_context'] = {
                'threat_type': threat_data.get('threat_type', 'unknown'),
                'severity': threat_data.get('severity', 'critical'),
                'source': threat_data.get('source', 'unknown')
            }
        
        return jsonify({
            'success': True,
            'response': response,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Emergency stop failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/emergency/pull-over', methods=['POST'])
def pull_over():
    """Execute pull over maneuver"""
    try:
        threat_data = request.json or {}
        
        response = emergency_controller.execute_pull_over()
        
        # Add threat context if provided
        if threat_data:
            response['threat_context'] = {
                'threat_type': threat_data.get('threat_type', 'medium'),
                'confidence': threat_data.get('confidence', 0.8),
                'recommended_action': 'pull_over'
            }
        
        return jsonify({
            'success': True,
            'response': response,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Pull over failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/emergency/controlled-stop', methods=['POST'])
def controlled_stop():
    """Execute controlled stop"""
    try:
        threat_data = request.json or {}
        
        response = emergency_controller.execute_controlled_stop()
        
        # Add threat context if provided
        if threat_data:
            response['threat_context'] = {
                'threat_type': threat_data.get('threat_type', 'high'),
                'urgency': threat_data.get('urgency', 'high'),
                'estimated_impact_time': threat_data.get('impact_time', 15)
            }
        
        return jsonify({
            'success': True,
            'response': response,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Controlled stop failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/vehicle/status', methods=['GET'])
def get_vehicle_status():
    """Get current vehicle status"""
    try:
        # Simulate some realistic updates
        if vehicle_state['status'] == 'operational':
            vehicle_state['speed'] = random.uniform(45, 65)  # mph
            vehicle_state['heading'] = random.uniform(0, 360)
            # Simulate small GPS movements
            vehicle_state['location']['lat'] += random.uniform(-0.0001, 0.0001)
            vehicle_state['location']['lng'] += random.uniform(-0.0001, 0.0001)
        
        vehicle_state['last_update'] = time.time()
        
        return jsonify({
            'success': True,
            'vehicle_status': vehicle_state,
            'active_responses': len(emergency_controller.active_responses),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/systems/health', methods=['GET'])
def get_systems_health():
    """Get vehicle systems health status"""
    try:
        # Simulate system health checks
        systems_health = {
            'gps': {
                'status': 'operational',
                'accuracy': random.uniform(1, 3),  # meters
                'satellites': random.randint(8, 12),
                'last_fix': datetime.now().isoformat()
            },
            'brakes': {
                'status': 'operational',
                'pad_wear': random.uniform(20, 80),  # percentage remaining
                'fluid_level': random.uniform(80, 100),
                'temperature': random.uniform(60, 120)  # celsius
            },
            'steering': {
                'status': 'operational',
                'response_time': random.uniform(50, 150),  # milliseconds
                'calibration': 'ok',
                'torque': random.uniform(10, 30)
            },
            'communication': {
                'status': 'operational',
                'signal_strength': random.uniform(70, 100),  # percentage
                'latency': random.uniform(10, 50),  # milliseconds
                'last_heartbeat': datetime.now().isoformat()
            },
            'engine': {
                'status': 'operational',
                'temperature': random.uniform(85, 105),  # celsius
                'oil_pressure': random.uniform(25, 45),  # psi
                'rpm': random.uniform(1500, 3000)
            }
        }
        
        return jsonify({
            'success': True,
            'systems_health': systems_health,
            'overall_health': 'good',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Systems health check failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/emergency/responses', methods=['GET'])
def get_emergency_responses():
    """Get emergency response log"""
    try:
        return jsonify({
            'success': True,
            'responses': response_log[-50:],  # Last 50 responses
            'active_responses': emergency_controller.active_responses,
            'total_responses': len(response_log),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Response log retrieval failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/vehicle/reset', methods=['POST'])
def reset_vehicle():
    """Reset vehicle to operational state"""
    try:
        global vehicle_state
        
        vehicle_state.update({
            'status': 'operational',
            'emergency_mode': False,
            'speed': random.uniform(45, 65),
            'last_update': time.time()
        })
        
        # Clear active responses
        emergency_controller.active_responses.clear()
        
        logger.info("Vehicle reset to operational state")
        
        return jsonify({
            'success': True,
            'message': 'Vehicle reset to operational state',
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Vehicle reset failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Vehicle Safety API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'uptime': time.time() - start_time
    })

# Background simulation
def simulate_vehicle_movement():
    """Simulate realistic vehicle movement and updates"""
    while True:
        try:
            if vehicle_state['status'] == 'operational':
                # Simulate GPS drift and movement
                vehicle_state['location']['lat'] += random.uniform(-0.00001, 0.00001)
                vehicle_state['location']['lng'] += random.uniform(-0.00001, 0.00001)
                vehicle_state['heading'] += random.uniform(-2, 2)
                vehicle_state['heading'] = vehicle_state['heading'] % 360
                
            # Update system statuses randomly
            for system in vehicle_state['systems']:
                if random.random() > 0.99:  # 1% chance of temporary system issue
                    vehicle_state['systems'][system] = False
                    logger.warning(f"System {system} temporarily offline")
                elif not vehicle_state['systems'][system] and random.random() > 0.5:
                    vehicle_state['systems'][system] = True
                    logger.info(f"System {system} back online")
            
            time.sleep(5)  # Update every 5 seconds
            
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            time.sleep(10)

if __name__ == '__main__':
    start_time = time.time()
    
    # Start background simulation
    sim_thread = threading.Thread(target=simulate_vehicle_movement, daemon=True)
    sim_thread.start()
    
    logger.info("Starting Vehicle Safety API Server...")
    logger.info("Emergency control endpoints available:")
    logger.info("  POST /api/emergency/stop - Emergency stop")
    logger.info("  POST /api/emergency/pull-over - Pull over maneuver")
    logger.info("  POST /api/emergency/controlled-stop - Controlled stop")
    logger.info("  GET  /api/vehicle/status - Vehicle status")
    logger.info("  GET  /api/systems/health - Systems health")
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        threaded=True
    )