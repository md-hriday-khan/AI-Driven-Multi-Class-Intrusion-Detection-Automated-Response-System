#!/usr/bin/env python3
"""
Vehicle Safety API Server
Emergency control system for autonomous vehicles
Created by Md.Hriday Khan
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import random
import logging
from datetime import datetime
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

# Emergency response log
response_log = []

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

@app.route('/api/emergency/stop', methods=['POST'])
def emergency_stop():
    """Execute emergency stop"""
    try:
        threat_data = request.json or {}
        
        response_id = str(uuid.uuid4())
        response = {
            'response_id': response_id,
            'action': 'emergency_stop',
            'timestamp': datetime.now().isoformat(),
            'status': 'executing',
            'details': 'Immediate emergency stop activated',
            'estimated_time': 5,
            'safety_systems': ['emergency_brakes', 'hazard_lights', 'horn'],
            'location': vehicle_state['location'].copy()
        }
        
        # Update vehicle state
        vehicle_state['emergency_mode'] = True
        vehicle_state['status'] = 'emergency_stop'
        vehicle_state['speed'] = 0.0
        
        response_log.append(response.copy())
        
        logger.info(f"Emergency stop executed: {response_id}")
        
        return jsonify({
            'success': True,
            'response': response,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Emergency stop failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/emergency/pull-over', methods=['POST'])
def pull_over():
    """Execute pull over maneuver"""
    try:
        threat_data = request.json or {}
        
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
            }
        }
        
        vehicle_state['status'] = 'pulling_over'
        response_log.append(response.copy())
        
        logger.info(f"Pull over executed: {response_id}")
        
        return jsonify({
            'success': True,
            'response': response,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Pull over failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/vehicle/status', methods=['GET'])
def get_vehicle_status():
    """Get current vehicle status"""
    try:
        # Simulate realistic updates
        if vehicle_state['status'] == 'operational':
            vehicle_state['speed'] = random.uniform(45, 65)
            vehicle_state['heading'] = random.uniform(0, 360)
            vehicle_state['location']['lat'] += random.uniform(-0.0001, 0.0001)
            vehicle_state['location']['lng'] += random.uniform(-0.0001, 0.0001)
        
        vehicle_state['last_update'] = time.time()
        
        return jsonify({
            'success': True,
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/systems/health', methods=['GET'])
def get_systems_health():
    """Get vehicle systems health"""
    try:
        systems_health = {
            'gps': {
                'status': 'operational',
                'accuracy': random.uniform(1, 3),
                'satellites': random.randint(8, 12)
            },
            'brakes': {
                'status': 'operational',
                'pad_wear': random.uniform(20, 80),
                'fluid_level': random.uniform(80, 100)
            },
            'steering': {
                'status': 'operational',
                'response_time': random.uniform(50, 150),
                'calibration': 'ok'
            },
            'communication': {
                'status': 'operational',
                'signal_strength': random.uniform(70, 100),
                'latency': random.uniform(10, 50)
            },
            'engine': {
                'status': 'operational',
                'temperature': random.uniform(85, 105),
                'oil_pressure': random.uniform(25, 45)
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
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/emergency/responses', methods=['GET'])
def get_emergency_responses():
    """Get emergency response log"""
    try:
        return jsonify({
            'success': True,
            'responses': response_log[-50:],
            'total_responses': len(response_log),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Response log retrieval failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/vehicle/reset', methods=['POST'])
def reset_vehicle():
    """Reset vehicle to operational state"""
    try:
        vehicle_state.update({
            'status': 'operational',
            'emergency_mode': False,
            'speed': random.uniform(45, 65),
            'last_update': time.time()
        })
        
        logger.info("Vehicle reset to operational state")
        
        return jsonify({
            'success': True,
            'message': 'Vehicle reset to operational state',
            'vehicle_status': vehicle_state,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Vehicle reset failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("Starting Vehicle Safety API Server...")
    logger.info("=" * 80)
    logger.info("Emergency control endpoints available:")
    logger.info("  POST /api/emergency/stop - Emergency stop")
    logger.info("  POST /api/emergency/pull-over - Pull over maneuver")
    logger.info("  GET  /api/vehicle/status - Vehicle status")
    logger.info("  GET  /api/systems/health - Systems health")
    logger.info("  GET  /api/health - Health check")
    logger.info("=" * 80)
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        threaded=True
    )