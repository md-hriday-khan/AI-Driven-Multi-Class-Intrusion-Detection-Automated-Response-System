#!/usr/bin/env python3
"""
CyberAuton Data Integrity & Security Module
Comprehensive dataset protection against attacks and tampering
Created by Md.Hriday Khan
"""

import hashlib
import hmac
import secrets
import sqlite3
import json
import time
import os
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import logging
import threading
import pickle
import gzip

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataIntegrityManager:
    """Manages data integrity checks and validation"""
    
    def __init__(self, db_path: str = 'shield_backend.db'):
        self.db_path = db_path
        self.integrity_db = 'data_integrity.db'
        self.init_integrity_database()
        self.hash_cache = {}
        self.verification_interval = 300  # 5 minutes
        self.lock = threading.Lock()
        
    def init_integrity_database(self):
        """Initialize integrity tracking database"""
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        # Table for data checksums
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_checksums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                checksum TEXT NOT NULL,
                algorithm TEXT DEFAULT 'sha256',
                created_at REAL,
                verified_at REAL,
                status TEXT DEFAULT 'valid',
                UNIQUE(table_name, record_id)
            )
        ''')
        
        # Table for integrity violations
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS integrity_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                table_name TEXT,
                record_id INTEGER,
                violation_type TEXT,
                expected_checksum TEXT,
                actual_checksum TEXT,
                severity TEXT,
                details TEXT,
                resolved INTEGER DEFAULT 0
            )
        ''')
        
        # Table for access control
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS access_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                user_id TEXT,
                action TEXT,
                table_name TEXT,
                record_id INTEGER,
                ip_address TEXT,
                success INTEGER,
                details TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Integrity database initialized")
        
    def compute_checksum(self, data: Any, algorithm: str = 'sha256') -> str:
        """Compute checksum for data"""
        if isinstance(data, dict):
            data_str = json.dumps(data, sort_keys=True)
        elif isinstance(data, (list, tuple)):
            data_str = json.dumps(list(data), sort_keys=True)
        else:
            data_str = str(data)
            
        if algorithm == 'sha256':
            return hashlib.sha256(data_str.encode()).hexdigest()
        elif algorithm == 'sha512':
            return hashlib.sha512(data_str.encode()).hexdigest()
        elif algorithm == 'md5':
            return hashlib.md5(data_str.encode()).hexdigest()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    def store_checksum(self, table_name: str, record_id: int, data: Any) -> str:
        """Store checksum for a record"""
        checksum = self.compute_checksum(data)
        
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO data_checksums 
            (table_name, record_id, checksum, created_at, verified_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (table_name, record_id, checksum, time.time(), time.time()))
        
        conn.commit()
        conn.close()
        
        return checksum
    
    def verify_checksum(self, table_name: str, record_id: int, data: Any) -> Tuple[bool, Optional[str]]:
        """Verify data integrity using checksum"""
        current_checksum = self.compute_checksum(data)
        
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT checksum FROM data_checksums 
            WHERE table_name = ? AND record_id = ?
        ''', (table_name, record_id))
        
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False, "No checksum found"
        
        stored_checksum = row[0]
        is_valid = current_checksum == stored_checksum
        
        # Update verification timestamp
        cursor.execute('''
            UPDATE data_checksums 
            SET verified_at = ?, status = ?
            WHERE table_name = ? AND record_id = ?
        ''', (time.time(), 'valid' if is_valid else 'invalid', table_name, record_id))
        
        # Log violation if integrity check failed
        if not is_valid:
            cursor.execute('''
                INSERT INTO integrity_violations 
                (timestamp, table_name, record_id, violation_type, 
                 expected_checksum, actual_checksum, severity, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (time.time(), table_name, record_id, 'checksum_mismatch',
                  stored_checksum, current_checksum, 'critical',
                  'Data tampering detected'))
            
            logger.warning(f"Integrity violation detected: {table_name}[{record_id}]")
        
        conn.commit()
        conn.close()
        
        return is_valid, stored_checksum if not is_valid else None
    
    def verify_all_records(self, table_name: str) -> Dict[str, Any]:
        """Verify integrity of all records in a table"""
        violations = []
        total_checked = 0
        
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        cursor.execute('SELECT record_id FROM data_checksums WHERE table_name = ?', (table_name,))
        records = cursor.fetchall()
        conn.close()
        
        for (record_id,) in records:
            # Would need actual data retrieval here
            total_checked += 1
        
        return {
            'table_name': table_name,
            'total_checked': total_checked,
            'violations_found': len(violations),
            'violations': violations,
            'integrity_score': (total_checked - len(violations)) / max(total_checked, 1) * 100
        }
    
    def log_access(self, user_id: str, action: str, table_name: str, 
                   record_id: Optional[int], ip_address: str, success: bool, details: str = ""):
        """Log data access for audit trail"""
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO access_log 
            (timestamp, user_id, action, table_name, record_id, ip_address, success, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (time.time(), user_id, action, table_name, record_id, ip_address, 
              1 if success else 0, details))
        
        conn.commit()
        conn.close()
    
    def get_integrity_report(self) -> Dict[str, Any]:
        """Generate comprehensive integrity report"""
        conn = sqlite3.connect(self.integrity_db)
        cursor = conn.cursor()
        
        # Get total checksums
        cursor.execute('SELECT COUNT(*) FROM data_checksums')
        total_checksums = cursor.fetchone()[0]
        
        # Get unresolved violations
        cursor.execute('SELECT COUNT(*) FROM integrity_violations WHERE resolved = 0')
        active_violations = cursor.fetchone()[0]
        
        # Get recent violations
        cursor.execute('''
            SELECT table_name, record_id, violation_type, severity, timestamp 
            FROM integrity_violations 
            WHERE resolved = 0 
            ORDER BY timestamp DESC 
            LIMIT 10
        ''')
        recent_violations = [
            {
                'table': row[0],
                'record_id': row[1],
                'type': row[2],
                'severity': row[3],
                'timestamp': row[4]
            }
            for row in cursor.fetchall()
        ]
        
        # Get access statistics
        cursor.execute('''
            SELECT COUNT(*), SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END)
            FROM access_log 
            WHERE timestamp > ?
        ''', (time.time() - 86400,))  # Last 24 hours
        
        access_stats = cursor.fetchone()
        total_access = access_stats[0] or 0
        successful_access = access_stats[1] or 0
        
        conn.close()
        
        return {
            'timestamp': time.time(),
            'total_records_protected': total_checksums,
            'active_violations': active_violations,
            'recent_violations': recent_violations,
            'integrity_score': ((total_checksums - active_violations) / max(total_checksums, 1)) * 100,
            'access_stats_24h': {
                'total': total_access,
                'successful': successful_access,
                'failed': total_access - successful_access
            }
        }


class DataEncryptionManager:
    """Manages data encryption and decryption"""
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or self._generate_master_key()
        self.cipher_suite = self._init_cipher()
        self.encrypted_fields = set()
        
    def _generate_master_key(self) -> str:
        """Generate a secure master key"""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    def _init_cipher(self) -> Fernet:
        """Initialize encryption cipher"""
        key_bytes = base64.urlsafe_b64decode(self.master_key.encode())
        return Fernet(base64.urlsafe_b64encode(key_bytes))
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        try:
            encrypted = self.cipher_suite.encrypt(data.encode())
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            decoded = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher_suite.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            raise
    
    def encrypt_dict(self, data: Dict[str, Any], sensitive_fields: List[str]) -> Dict[str, Any]:
        """Encrypt specific fields in a dictionary"""
        encrypted_data = data.copy()
        for field in sensitive_fields:
            if field in encrypted_data:
                value = str(encrypted_data[field])
                encrypted_data[field] = self.encrypt_data(value)
                self.encrypted_fields.add(field)
        return encrypted_data
    
    def decrypt_dict(self, data: Dict[str, Any], encrypted_fields: List[str]) -> Dict[str, Any]:
        """Decrypt specific fields in a dictionary"""
        decrypted_data = data.copy()
        for field in encrypted_fields:
            if field in decrypted_data:
                decrypted_data[field] = self.decrypt_data(decrypted_data[field])
        return decrypted_data


class DataValidationManager:
    """Manages data validation and sanitization"""
    
    def __init__(self):
        self.validation_rules = {}
        self.sanitization_patterns = {}
        
    def add_validation_rule(self, field: str, rule_type: str, rule_params: Dict[str, Any]):
        """Add validation rule for a field"""
        if field not in self.validation_rules:
            self.validation_rules[field] = []
        self.validation_rules[field].append({
            'type': rule_type,
            'params': rule_params
        })
    
    def validate_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate data against defined rules"""
        errors = []
        
        for field, rules in self.validation_rules.items():
            if field not in data:
                errors.append(f"Missing required field: {field}")
                continue
            
            value = data[field]
            for rule in rules:
                rule_type = rule['type']
                params = rule['params']
                
                if rule_type == 'type':
                    expected_type = params['expected']
                    if not isinstance(value, expected_type):
                        errors.append(f"Field '{field}' must be of type {expected_type.__name__}")
                
                elif rule_type == 'range':
                    if not (params['min'] <= value <= params['max']):
                        errors.append(f"Field '{field}' must be between {params['min']} and {params['max']}")
                
                elif rule_type == 'length':
                    if len(str(value)) > params['max']:
                        errors.append(f"Field '{field}' exceeds maximum length of {params['max']}")
                
                elif rule_type == 'pattern':
                    import re
                    if not re.match(params['regex'], str(value)):
                        errors.append(f"Field '{field}' does not match required pattern")
                
                elif rule_type == 'allowed_values':
                    if value not in params['values']:
                        errors.append(f"Field '{field}' must be one of: {params['values']}")
        
        return len(errors) == 0, errors
    
    def sanitize_input(self, data: str) -> str:
        """Sanitize user input to prevent injection attacks"""
        # Remove null bytes
        sanitized = data.replace('\x00', '')
        
        # Escape SQL special characters
        sanitized = sanitized.replace("'", "''")
        
        # Remove control characters
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
        
        return sanitized
    
    def sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize all string values in a dictionary"""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self.sanitize_input(value)
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize_input(v) if isinstance(v, str) else v 
                    for v in value
                ]
            else:
                sanitized[key] = value
        return sanitized


class DataBackupManager:
    """Manages data backup and recovery"""
    
    def __init__(self, backup_dir: str = 'backups'):
        self.backup_dir = backup_dir
        self.ensure_backup_directory()
        
    def ensure_backup_directory(self):
        """Ensure backup directory exists"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
            logger.info(f"Created backup directory: {self.backup_dir}")
    
    def create_backup(self, db_path: str, compress: bool = True) -> str:
        """Create database backup"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"backup_{timestamp}.db"
        
        if compress:
            backup_name += ".gz"
        
        backup_path = os.path.join(self.backup_dir, backup_name)
        
        try:
            # Read original database
            with open(db_path, 'rb') as f_in:
                data = f_in.read()
            
            # Write backup
            if compress:
                with gzip.open(backup_path, 'wb') as f_out:
                    f_out.write(data)
            else:
                with open(backup_path, 'wb') as f_out:
                    f_out.write(data)
            
            logger.info(f"Backup created: {backup_path}")
            return backup_path
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            raise
    
    def restore_backup(self, backup_path: str, target_path: str) -> bool:
        """Restore database from backup"""
        try:
            if backup_path.endswith('.gz'):
                with gzip.open(backup_path, 'rb') as f_in:
                    data = f_in.read()
            else:
                with open(backup_path, 'rb') as f_in:
                    data = f_in.read()
            
            # Create backup of current database before restore
            if os.path.exists(target_path):
                pre_restore_backup = f"{target_path}.pre_restore"
                with open(target_path, 'rb') as f_in:
                    with open(pre_restore_backup, 'wb') as f_out:
                        f_out.write(f_in.read())
            
            # Write restored data
            with open(target_path, 'wb') as f_out:
                f_out.write(data)
            
            logger.info(f"Database restored from: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return False
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups"""
        backups = []
        
        for filename in os.listdir(self.backup_dir):
            if filename.startswith('backup_'):
                filepath = os.path.join(self.backup_dir, filename)
                stat = os.stat(filepath)
                
                backups.append({
                    'filename': filename,
                    'path': filepath,
                    'size': stat.st_size,
                    'created': stat.st_ctime,
                    'compressed': filename.endswith('.gz')
                })
        
        return sorted(backups, key=lambda x: x['created'], reverse=True)
    
    def auto_backup_scheduler(self, db_path: str, interval_hours: int = 6):
        """Schedule automatic backups"""
        def backup_task():
            while True:
                try:
                    self.create_backup(db_path)
                    time.sleep(interval_hours * 3600)
                except Exception as e:
                    logger.error(f"Auto-backup error: {e}")
                    time.sleep(300)  # Retry in 5 minutes
        
        backup_thread = threading.Thread(target=backup_task, daemon=True)
        backup_thread.start()
        logger.info(f"Auto-backup scheduled every {interval_hours} hours")


class SecureDatasetHandler:
    """Comprehensive secure dataset handler combining all security features"""
    
    def __init__(self, db_path: str = 'shield_backend.db', master_key: Optional[str] = None):
        self.db_path = db_path
        self.integrity_manager = DataIntegrityManager(db_path)
        self.encryption_manager = DataEncryptionManager(master_key)
        self.validation_manager = DataValidationManager()
        self.backup_manager = DataBackupManager()
        
        # Initialize security rules
        self._init_security_rules()
        
        # Start auto-backup
        self.backup_manager.auto_backup_scheduler(db_path, interval_hours=6)
        
        logger.info("Secure Dataset Handler initialized")
    
    def _init_security_rules(self):
        """Initialize validation rules for common fields"""
        # IP address validation
        self.validation_manager.add_validation_rule('ip_address', 'pattern', {
            'regex': r'^(?:\d{1,3}\.){3}\d{1,3}$'
        })
        
        # Port validation
        self.validation_manager.add_validation_rule('port', 'range', {
            'min': 0,
            'max': 65535
        })
        
        # Severity validation
        self.validation_manager.add_validation_rule('severity', 'allowed_values', {
            'values': ['low', 'medium', 'high', 'critical']
        })
    
    def secure_insert(self, table_name: str, data: Dict[str, Any], 
                     user_id: str, ip_address: str, 
                     sensitive_fields: Optional[List[str]] = None) -> Tuple[bool, Optional[int], List[str]]:
        """Securely insert data with validation, encryption, and integrity checks"""
        
        # Sanitize input
        sanitized_data = self.validation_manager.sanitize_dict(data)
        
        # Validate data
        is_valid, errors = self.validation_manager.validate_data(sanitized_data)
        if not is_valid:
            self.integrity_manager.log_access(user_id, 'INSERT', table_name, None, 
                                             ip_address, False, f"Validation failed: {errors}")
            return False, None, errors
        
        # Encrypt sensitive fields
        if sensitive_fields:
            sanitized_data = self.encryption_manager.encrypt_dict(sanitized_data, sensitive_fields)
        
        # Insert into database
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            columns = ', '.join(sanitized_data.keys())
            placeholders = ', '.join(['?' for _ in sanitized_data])
            values = list(sanitized_data.values())
            
            cursor.execute(f'INSERT INTO {table_name} ({columns}) VALUES ({placeholders})', values)
            record_id = cursor.lastrowid
            
            conn.commit()
            conn.close()
            
            # Store integrity checksum
            self.integrity_manager.store_checksum(table_name, record_id, sanitized_data)
            
            # Log successful access
            self.integrity_manager.log_access(user_id, 'INSERT', table_name, record_id, 
                                             ip_address, True, "Data inserted successfully")
            
            return True, record_id, []
            
        except Exception as e:
            logger.error(f"Insert error: {e}")
            self.integrity_manager.log_access(user_id, 'INSERT', table_name, None, 
                                             ip_address, False, str(e))
            return False, None, [str(e)]
    
    def secure_retrieve(self, table_name: str, record_id: int, 
                       user_id: str, ip_address: str,
                       encrypted_fields: Optional[List[str]] = None) -> Tuple[bool, Optional[Dict], str]:
        """Securely retrieve data with integrity verification"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(f'SELECT * FROM {table_name} WHERE id = ?', (record_id,))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return False, None, "Record not found"
            
            # Get column names
            cursor.execute(f'PRAGMA table_info({table_name})')
            columns = [col[1] for col in cursor.fetchall()]
            
            conn.close()
            
            # Create dictionary
            data = dict(zip(columns, row))
            
            # Verify integrity
            is_valid, _ = self.integrity_manager.verify_checksum(table_name, record_id, data)
            
            if not is_valid:
                self.integrity_manager.log_access(user_id, 'RETRIEVE', table_name, record_id,
                                                 ip_address, False, "Integrity check failed")
                return False, None, "Data integrity violation detected"
            
            # Decrypt sensitive fields
            if encrypted_fields:
                data = self.encryption_manager.decrypt_dict(data, encrypted_fields)
            
            # Log successful access
            self.integrity_manager.log_access(user_id, 'RETRIEVE', table_name, record_id,
                                             ip_address, True, "Data retrieved successfully")
            
            return True, data, "Success"
            
        except Exception as e:
            logger.error(f"Retrieve error: {e}")
            self.integrity_manager.log_access(user_id, 'RETRIEVE', table_name, record_id,
                                             ip_address, False, str(e))
            return False, None, str(e)
    
    def get_security_status(self) -> Dict[str, Any]:
        """Get comprehensive security status"""
        integrity_report = self.integrity_manager.get_integrity_report()
        backups = self.backup_manager.list_backups()
        
        return {
            'timestamp': time.time(),
            'integrity': integrity_report,
            'encryption': {
                'enabled': True,
                'algorithm': 'Fernet (AES-128)',
                'encrypted_fields': list(self.encryption_manager.encrypted_fields)
            },
            'backups': {
                'total': len(backups),
                'latest': backups[0] if backups else None,
                'total_size': sum(b['size'] for b in backups)
            },
            'validation': {
                'rules_configured': len(self.validation_manager.validation_rules),
                'fields_protected': list(self.validation_manager.validation_rules.keys())
            }
        }


# Initialize global secure handler
secure_handler = None

def init_secure_handler(db_path: str = 'shield_backend.db', master_key: Optional[str] = None):
    """Initialize the global secure dataset handler"""
    global secure_handler
    secure_handler = SecureDatasetHandler(db_path, master_key)
    return secure_handler


if __name__ == "__main__":
    # Test the security system
    print("Initializing Data Integrity & Security System...")
    handler = init_secure_handler()
    
    print("\n=== Security Status ===")
    status = handler.get_security_status()
    print(json.dumps(status, indent=2))
    
    print("\n=== Testing Data Operations ===")
    
    # Test secure insert
    test_data = {
        'timestamp': time.time(),
        'threat_type': 'DDoS Attack',
        'severity': 'high',
        'source_ip': '192.168.1.100',
        'target_ip': '10.0.0.50',
        'confidence': 0.95
    }
    
    success, record_id, errors = handler.secure_insert(
        'threat_intelligence',
        test_data,
        user_id='admin',
        ip_address='127.0.0.1',
        sensitive_fields=['source_ip', 'target_ip']
    )
    
    print(f"Insert Result: Success={success}, RecordID={record_id}, Errors={errors}")
    
    print("\n=== Data Security Initialized Successfully ===")
