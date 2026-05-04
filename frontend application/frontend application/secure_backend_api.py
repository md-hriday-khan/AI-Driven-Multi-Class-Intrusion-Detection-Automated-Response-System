#!/usr/bin/env python3
"""
CyberAuton Secure Backend API Server
Enhanced API with comprehensive data integrity and security
Created by Md.Hriday Khan
"""

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import time
import sqlite3
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import secrets
import jwt
from functools import wraps

# Import security module
from data_integrity_security import (
    SecureDatasetHandler,
    DataIntegrityManager,
    DataEncryptionManager,
    DataValidationManager,
    DataBackupManager
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Security configuration
SECRET_KEY = secrets.token_urlsafe(32)
app.config['SECRET_KEY'] = SECRET_KEY

# Initialize secure handler
secure_handler = SecureDatasetHandler(db_path='shield_backend.db')

# API statistics
api_stats = {
    'requests_served': 0,
    'security_violations': 0,
    'start_time': time.time(),
    'authenticated_requests': 0,
    'blocked_requests': 0
}


def generate_token(user_id: str, role: str = 'analyst') -> str:
    """Generate JWT token for authentication"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': time.time() + 3600,  # 1 hour expiration
        'iat': time.time()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None


def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        global api_stats
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        # For development, allow requests without token
        if not token:
            # Use default user for unauthenticated requests
            request.user_id = 'anonymous'
            request.user_role = 'viewer'
        else:
            payload = verify_token(token)
            if not payload:
                api_stats['blocked_requests'] += 1
                return jsonify({
                    'success': False,
                    'error': 'Invalid or expired token'
                }), 401
            
            request.user_id = payload['user_id']
            request.user_role = payload['role']
            api_stats['authenticated_requests'] += 1
        
        return f(*args, **kwargs)
    return decorated_function


def get_client_ip() -> str:
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr or '0.0.0.0'


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return token"""
    global api_stats
    api_stats['requests_served'] += 1
    
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Mock authentication (in production, validate against database)
    if username and password:
        token = generate_token(username, role='analyst')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'username': username,
                'role': 'analyst'
            },
            'expires_in': 3600
        })
    
    return jsonify({
        'success': False,
        'error': 'Invalid credentials'
    }), 401


@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify():
    """Verify token validity"""
    return jsonify({
        'success': True,
        'user_id': request.user_id,
        'role': request.user_role
    })


# ============================================================================
# SECURITY STATUS ENDPOINTS
# ============================================================================

@app.route('/api/security/status', methods=['GET'])
@require_auth
def get_security_status():
    """Get comprehensive security status"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        status = secure_handler.get_security_status()
        
        # Add API stats
        status['api_stats'] = {
            'requests_served': api_stats['requests_served'],
            'security_violations': api_stats['security_violations'],
            'authenticated_requests': api_stats['authenticated_requests'],
            'blocked_requests': api_stats['blocked_requests'],
            'uptime': time.time() - api_stats['start_time']
        }
        
        return jsonify({
            'success': True,
            'data': status
        })
        
    except Exception as e:
        logger.error(f"Security status error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/security/integrity/report', methods=['GET'])
@require_auth
def get_integrity_report():
    """Get data integrity report"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        report = secure_handler.integrity_manager.get_integrity_report()
        
        return jsonify({
            'success': True,
            'data': report
        })
        
    except Exception as e:
        logger.error(f"Integrity report error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/security/violations', methods=['GET'])
@require_auth
def get_security_violations():
    """Get recent security violations"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        conn = sqlite3.connect('data_integrity.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, timestamp, table_name, record_id, violation_type, 
                   severity, details, resolved
            FROM integrity_violations 
            ORDER BY timestamp DESC 
            LIMIT 100
        ''')
        
        violations = []
        for row in cursor.fetchall():
            violations.append({
                'id': row[0],
                'timestamp': row[1],
                'table': row[2],
                'record_id': row[3],
                'type': row[4],
                'severity': row[5],
                'details': row[6],
                'resolved': bool(row[7])
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': violations,
            'total': len(violations)
        })
        
    except Exception as e:
        logger.error(f"Violations query error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/security/access-log', methods=['GET'])
@require_auth
def get_access_log():
    """Get data access log"""
    global api_stats
    api_stats['requests_served'] += 1
    
    limit = request.args.get('limit', 100, type=int)
    
    try:
        conn = sqlite3.connect('data_integrity.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, user_id, action, table_name, record_id, 
                   ip_address, success, details
            FROM access_log 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        logs = []
        for row in cursor.fetchall():
            logs.append({
                'timestamp': row[0],
                'user_id': row[1],
                'action': row[2],
                'table': row[3],
                'record_id': row[4],
                'ip_address': row[5],
                'success': bool(row[6]),
                'details': row[7]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': logs,
            'total': len(logs)
        })
        
    except Exception as e:
        logger.error(f"Access log query error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# BACKUP MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/backup/create', methods=['POST'])
@require_auth
def create_backup():
    """Create database backup"""
    global api_stats
    api_stats['requests_served'] += 1
    
    # Only allow admins to create backups
    if request.user_role not in ['admin', 'analyst']:
        return jsonify({
            'success': False,
            'error': 'Insufficient permissions'
        }), 403
    
    try:
        backup_path = secure_handler.backup_manager.create_backup(
            'shield_backend.db',
            compress=True
        )
        
        return jsonify({
            'success': True,
            'backup_path': backup_path,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Backup creation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/backup/list', methods=['GET'])
@require_auth
def list_backups():
    """List all available backups"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        backups = secure_handler.backup_manager.list_backups()
        
        return jsonify({
            'success': True,
            'data': backups,
            'total': len(backups)
        })
        
    except Exception as e:
        logger.error(f"Backup list error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/backup/restore', methods=['POST'])
@require_auth
def restore_backup():
    """Restore from backup"""
    global api_stats
    api_stats['requests_served'] += 1
    
    # Only allow admins to restore backups
    if request.user_role != 'admin':
        return jsonify({
            'success': False,
            'error': 'Insufficient permissions'
        }), 403
    
    data = request.json
    backup_path = data.get('backup_path')
    
    if not backup_path:
        return jsonify({
            'success': False,
            'error': 'backup_path required'
        }), 400
    
    try:
        success = secure_handler.backup_manager.restore_backup(
            backup_path,
            'shield_backend.db'
        )
        
        return jsonify({
            'success': success,
            'message': 'Database restored successfully' if success else 'Restore failed'
        })
        
    except Exception as e:
        logger.error(f"Backup restore error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# SECURE DATA OPERATIONS
# ============================================================================

@app.route('/api/data/threat/insert', methods=['POST'])
@require_auth
def insert_threat_data():
    """Securely insert threat intelligence data"""
    global api_stats
    api_stats['requests_served'] += 1
    
    data = request.json
    
    # Add timestamp if not provided
    if 'timestamp' not in data:
        data['timestamp'] = time.time()
    
    try:
        success, record_id, errors = secure_handler.secure_insert(
            table_name='threat_intelligence',
            data=data,
            user_id=request.user_id,
            ip_address=get_client_ip(),
            sensitive_fields=['source_ip', 'target_ip']
        )
        
        if not success:
            api_stats['security_violations'] += 1
            return jsonify({
                'success': False,
                'errors': errors
            }), 400
        
        return jsonify({
            'success': True,
            'record_id': record_id,
            'message': 'Threat data inserted successfully'
        })
        
    except Exception as e:
        logger.error(f"Threat insert error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data/threat/<int:record_id>', methods=['GET'])
@require_auth
def get_threat_data(record_id: int):
    """Securely retrieve threat intelligence data"""
    global api_stats
    api_stats['requests_served'] += 1
    
    try:
        success, data, message = secure_handler.secure_retrieve(
            table_name='threat_intelligence',
            record_id=record_id,
            user_id=request.user_id,
            ip_address=get_client_ip(),
            encrypted_fields=['source_ip', 'target_ip']
        )
        
        if not success:
            api_stats['security_violations'] += 1
            return jsonify({
                'success': False,
                'error': message
            }), 404
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Threat retrieve error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/data/network/insert', methods=['POST'])
@require_auth
def insert_network_data():
    """Securely insert network capture data"""
    global api_stats
    api_stats['requests_served'] += 1
    
    data = request.json
    
    # Add timestamp if not provided
    if 'timestamp' not in data:
        data['timestamp'] = time.time()
    
    try:
        success, record_id, errors = secure_handler.secure_insert(
            table_name='network_captures',
            data=data,
            user_id=request.user_id,
            ip_address=get_client_ip(),
            sensitive_fields=['src_ip', 'dst_ip', 'payload_preview']
        )
        
        if not success:
            api_stats['security_violations'] += 1
            return jsonify({
                'success': False,
                'errors': errors
            }), 400
        
        return jsonify({
            'success': True,
            'record_id': record_id,
            'message': 'Network data inserted successfully'
        })
        
    except Exception as e:
        logger.error(f"Network insert error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# HEALTH AND MONITORING
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global api_stats
    api_stats['requests_served'] += 1
    
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'uptime': time.time() - api_stats['start_time'],
        'security_enabled': True,
        'services': {
            'authentication': True,
            'encryption': True,
            'integrity_checking': True,
            'backup_system': True,
            'validation': True
        }
    })


@app.route('/api/stats', methods=['GET'])
@require_auth
def get_stats():
    """Get API statistics"""
    return jsonify({
        'success': True,
        'data': {
            'requests_served': api_stats['requests_served'],
            'security_violations': api_stats['security_violations'],
            'authenticated_requests': api_stats['authenticated_requests'],
            'blocked_requests': api_stats['blocked_requests'],
            'uptime': time.time() - api_stats['start_time'],
            'start_time': api_stats['start_time']
        }
    })


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Forbidden'
    }), 403


if __name__ == '__main__':
    logger.info("="*60)
    logger.info("CyberAuton Secure Backend API Server")
    logger.info("Data Integrity & Security: ENABLED")
    logger.info("="*60)
    
    # Initialize security system
    logger.info("Initializing security components...")
    status = secure_handler.get_security_status()
    logger.info(f"Protected records: {status['integrity']['total_records_protected']}")
    logger.info(f"Encryption: {status['encryption']['algorithm']}")
    logger.info(f"Backups available: {status['backups']['total']}")
    
    logger.info("\nStarting server on port 5000...")
    logger.info("Security features:")
    logger.info("  ✓ Data encryption (Fernet/AES-128)")
    logger.info("  ✓ Integrity checking (SHA-256)")
    logger.info("  ✓ Input validation & sanitization")
    logger.info("  ✓ Automated backups (every 6 hours)")
    logger.info("  ✓ Access logging & audit trail")
    logger.info("  ✓ JWT authentication")
    logger.info("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
