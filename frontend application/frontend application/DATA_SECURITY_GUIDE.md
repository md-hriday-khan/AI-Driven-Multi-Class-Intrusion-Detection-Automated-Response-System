# 🛡️ CyberAuton Data Integrity & Security System

## Complete Dataset Protection & Attack Prevention

Created by **Md.Hriday Khan**

---

## 📋 Overview

The **Data Integrity & Security System** provides comprehensive protection for your cybersecurity datasets against tampering, unauthorized access, and attacks. This enterprise-grade security framework includes encryption, integrity verification, access control, automated backups, and real-time monitoring.

## 🔐 Security Features

### 1. **Data Encryption**
- **Algorithm**: Fernet (AES-128 in CBC mode)
- **Key Management**: Secure master key generation and storage
- **Field-Level Encryption**: Encrypt sensitive fields (IPs, payloads, credentials)
- **Automatic Encryption/Decryption**: Transparent to application logic

### 2. **Integrity Verification**
- **Checksums**: SHA-256 hashing for all protected records
- **Real-Time Verification**: Automatic integrity checks on data access
- **Tamper Detection**: Immediate alerts for data modifications
- **Violation Tracking**: Complete audit trail of integrity breaches

### 3. **Access Control**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin, Analyst, Viewer roles
- **Access Logging**: Complete audit trail of all data operations
- **IP Tracking**: Monitor and log access by IP address

### 4. **Input Validation & Sanitization**
- **Schema Validation**: Type checking and range validation
- **SQL Injection Prevention**: Automatic input sanitization
- **Pattern Matching**: Regex-based field validation
- **Allowed Values**: Whitelist-based validation

### 5. **Automated Backups**
- **Scheduled Backups**: Every 6 hours automatically
- **Compression**: GZIP compression for storage efficiency
- **Point-in-Time Recovery**: Restore to any previous backup
- **Backup Integrity**: Checksums for backup files

### 6. **Real-Time Monitoring**
- **Live Dashboard**: Monitor security status in real-time
- **Violation Alerts**: Immediate notification of security breaches
- **Access Statistics**: 24-hour rolling statistics
- **Integrity Score**: Overall system health indicator

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install required Python packages
pip install flask flask-cors cryptography pyjwt pandas numpy
```

### Starting the Secure Backend

**Linux/Mac:**
```bash
chmod +x START_SECURE_BACKEND.sh
./START_SECURE_BACKEND.sh
```

**Windows:**
```batch
START_SECURE_BACKEND.bat
```

**Manual Start:**
```bash
python3 secure_backend_api.py
```

The server will start on `http://localhost:5000`

---

## 📊 API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "username": "admin",
    "role": "analyst"
  },
  "expires_in": 3600
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user_id": "admin",
  "role": "analyst"
}
```

### Security Status

#### Get Security Status
```http
GET /api/security/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "timestamp": 1704557400.123,
    "integrity": {
      "total_records_protected": 15847,
      "active_violations": 3,
      "integrity_score": 99.98,
      "access_stats_24h": {
        "total": 2547,
        "successful": 2544,
        "failed": 3
      }
    },
    "encryption": {
      "enabled": true,
      "algorithm": "Fernet (AES-128)",
      "encrypted_fields": ["source_ip", "target_ip"]
    },
    "backups": {
      "total": 8,
      "latest": {
        "filename": "backup_20250106_143022.db.gz",
        "size": 4567890,
        "created": 1704557400.0
      }
    }
  }
}
```

#### Get Integrity Report
```http
GET /api/security/integrity/report
Authorization: Bearer <token>
```

#### Get Security Violations
```http
GET /api/security/violations
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": 1704557400.0,
      "table": "threat_intelligence",
      "record_id": 1234,
      "type": "checksum_mismatch",
      "severity": "critical",
      "details": "Data tampering detected",
      "resolved": false
    }
  ]
}
```

#### Get Access Log
```http
GET /api/security/access-log?limit=50
Authorization: Bearer <token>
```

### Backup Management

#### Create Backup
```http
POST /api/backup/create
Authorization: Bearer <token>

Response:
{
  "success": true,
  "backup_path": "backups/backup_20250106_143022.db.gz",
  "timestamp": 1704557400.0
}
```

#### List Backups
```http
GET /api/backup/list
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "filename": "backup_20250106_143022.db.gz",
      "path": "backups/backup_20250106_143022.db.gz",
      "size": 4567890,
      "created": 1704557400.0,
      "compressed": true
    }
  ],
  "total": 8
}
```

#### Restore Backup
```http
POST /api/backup/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "backup_path": "backups/backup_20250106_143022.db.gz"
}

Response:
{
  "success": true,
  "message": "Database restored successfully"
}
```

### Secure Data Operations

#### Insert Threat Data
```http
POST /api/data/threat/insert
Authorization: Bearer <token>
Content-Type: application/json

{
  "threat_type": "DDoS Attack",
  "severity": "high",
  "source_ip": "192.168.1.100",
  "target_ip": "10.0.0.50",
  "confidence": 0.95
}

Response:
{
  "success": true,
  "record_id": 1234,
  "message": "Threat data inserted successfully"
}
```

#### Get Threat Data
```http
GET /api/data/threat/1234
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": 1234,
    "timestamp": 1704557400.0,
    "threat_type": "DDoS Attack",
    "severity": "high",
    "source_ip": "192.168.1.100",
    "target_ip": "10.0.0.50",
    "confidence": 0.95
  }
}
```

---

## 🔧 Python Usage Examples

### Initializing the Secure Handler

```python
from data_integrity_security import SecureDatasetHandler

# Initialize with default database
handler = SecureDatasetHandler(db_path='shield_backend.db')

# Or with custom encryption key
handler = SecureDatasetHandler(
    db_path='shield_backend.db',
    master_key='your-secure-master-key-here'
)
```

### Secure Data Insertion

```python
# Insert data with encryption
data = {
    'timestamp': time.time(),
    'threat_type': 'DDoS Attack',
    'severity': 'high',
    'source_ip': '192.168.1.100',
    'target_ip': '10.0.0.50',
    'confidence': 0.95
}

success, record_id, errors = handler.secure_insert(
    table_name='threat_intelligence',
    data=data,
    user_id='admin',
    ip_address='127.0.0.1',
    sensitive_fields=['source_ip', 'target_ip']  # These fields will be encrypted
)

if success:
    print(f"Data inserted successfully: Record ID {record_id}")
else:
    print(f"Insertion failed: {errors}")
```

### Secure Data Retrieval

```python
# Retrieve and verify data integrity
success, data, message = handler.secure_retrieve(
    table_name='threat_intelligence',
    record_id=1234,
    user_id='admin',
    ip_address='127.0.0.1',
    encrypted_fields=['source_ip', 'target_ip']  # These fields will be decrypted
)

if success:
    print(f"Retrieved data: {data}")
else:
    print(f"Retrieval failed: {message}")
```

### Creating Backups

```python
# Manual backup
backup_path = handler.backup_manager.create_backup(
    db_path='shield_backend.db',
    compress=True
)
print(f"Backup created: {backup_path}")

# List all backups
backups = handler.backup_manager.list_backups()
for backup in backups:
    print(f"Backup: {backup['filename']} - {backup['size']} bytes")
```

### Checking Security Status

```python
# Get comprehensive security status
status = handler.get_security_status()

print(f"Integrity Score: {status['integrity']['integrity_score']}%")
print(f"Protected Records: {status['integrity']['total_records_protected']}")
print(f"Active Violations: {status['integrity']['active_violations']}")
print(f"Encryption: {status['encryption']['algorithm']}")
print(f"Total Backups: {status['backups']['total']}")
```

---

## 🎯 Security Best Practices

### 1. **Password Management**
- Use strong, unique passwords for authentication
- Implement password rotation policies
- Never hardcode credentials in source code

### 2. **API Key Security**
- Store master encryption keys in environment variables
- Use secrets management systems in production
- Rotate keys periodically

### 3. **Access Control**
- Implement principle of least privilege
- Regularly audit user permissions
- Monitor failed authentication attempts

### 4. **Data Encryption**
- Encrypt all sensitive fields (IPs, credentials, payloads)
- Use TLS/SSL for data in transit
- Secure key storage with hardware security modules (HSM)

### 5. **Backup Strategy**
- Test backup restoration regularly
- Store backups in secure, off-site locations
- Encrypt backup files
- Maintain multiple backup generations

### 6. **Monitoring**
- Enable real-time security monitoring
- Set up alerts for integrity violations
- Review access logs regularly
- Monitor for anomalous access patterns

### 7. **Incident Response**
- Have a documented incident response plan
- Regularly test incident response procedures
- Maintain audit logs for forensic analysis

---

## 📈 Monitoring Dashboard

Access the **Data Integrity Dashboard** in the CyberAuton SOC interface:

1. Login to the system
2. Navigate to **Management** → **Data Integrity Dashboard**
3. View real-time security metrics:
   - Integrity Score
   - Protected Records Count
   - Active Violations
   - Access Statistics
   - Backup Status

### Dashboard Features

- **Overview Tab**: Security metrics, access stats, validation rules
- **Violations Tab**: List of all integrity violations with severity
- **Access Log Tab**: Complete audit trail of data operations
- **Backups Tab**: Backup management and restoration

---

## 🔍 Integrity Verification

### How It Works

1. **Record Creation**: When data is inserted, a SHA-256 checksum is computed and stored
2. **Record Access**: When data is retrieved, the current checksum is compared with the stored one
3. **Violation Detection**: Any mismatch triggers an integrity violation alert
4. **Automatic Logging**: All violations are logged with details for investigation

### Verification Levels

- **Field-Level**: Individual field integrity checks
- **Record-Level**: Complete record integrity verification
- **Table-Level**: Batch verification of all records
- **Database-Level**: Full database integrity audit

---

## 🚨 Attack Prevention

### Prevented Attack Types

1. **SQL Injection**
   - Input sanitization
   - Parameterized queries
   - Special character escaping

2. **Data Tampering**
   - Checksum verification
   - Integrity monitoring
   - Immutable audit logs

3. **Unauthorized Access**
   - JWT authentication
   - Role-based access control
   - IP whitelisting capability

4. **Data Exfiltration**
   - Access logging
   - Rate limiting
   - Anomaly detection

5. **Insider Threats**
   - Complete audit trail
   - Mandatory access logging
   - Violation alerts

---

## 📝 Configuration

### Environment Variables

```bash
# Set encryption master key
export CYBERAUTON_MASTER_KEY="your-secure-key-here"

# Set backup directory
export BACKUP_DIR="/secure/backups"

# Set log level
export LOG_LEVEL="INFO"
```

### Custom Validation Rules

```python
from data_integrity_security import DataValidationManager

validator = DataValidationManager()

# Add IP address validation
validator.add_validation_rule('ip_address', 'pattern', {
    'regex': r'^(?:\d{1,3}\.){3}\d{1,3}$'
})

# Add port range validation
validator.add_validation_rule('port', 'range', {
    'min': 0,
    'max': 65535
})

# Add severity whitelist
validator.add_validation_rule('severity', 'allowed_values', {
    'values': ['low', 'medium', 'high', 'critical']
})
```

---

## 🔄 Integration with Existing Systems

### Backend Integration

Replace your existing backend calls with secure versions:

```python
# Before (Insecure)
cursor.execute(f"INSERT INTO threats VALUES ({data})")

# After (Secure)
handler.secure_insert(
    table_name='threats',
    data=data,
    user_id=user_id,
    ip_address=ip_address,
    sensitive_fields=['source_ip', 'target_ip']
)
```

### Frontend Integration

Use the Data Integrity Dashboard component:

```typescript
import { DataIntegrityDashboard } from './components/DataIntegrityDashboard';

// In your component
<DataIntegrityDashboard />
```

---

## 📊 Performance Impact

- **Encryption Overhead**: < 5ms per operation
- **Checksum Calculation**: < 2ms per record
- **Backup Creation**: Depends on database size (async operation)
- **Integrity Verification**: < 3ms per record

**Recommendation**: Minimal performance impact for enterprise workloads

---

## 🐛 Troubleshooting

### Issue: "Cryptography module not found"
```bash
pip install cryptography
```

### Issue: "JWT decode error"
```python
# Regenerate token or check expiration
# Tokens expire after 1 hour by default
```

### Issue: "Integrity violation detected"
```python
# Check the violations log
GET /api/security/violations

# Review the specific record
# Restore from backup if necessary
```

### Issue: "Backup restore failed"
```python
# Verify backup file exists and is not corrupted
# Check file permissions
# Review logs for specific error messages
```

---

## 📚 Additional Resources

- **Main Documentation**: `/README.md`
- **Setup Guide**: `/QUICK_START.md`
- **API Documentation**: This file
- **Backend Source**: `/data_integrity_security.py`
- **Secure API**: `/secure_backend_api.py`
- **Frontend Component**: `/components/DataIntegrityDashboard.tsx`

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the logs in `/logs` directory
3. Check the console output for error messages
4. Verify all dependencies are installed

---

## ✅ Security Checklist

- [x] Data encryption enabled
- [x] Integrity verification active
- [x] Access control implemented
- [x] Automated backups scheduled
- [x] Input validation configured
- [x] Audit logging enabled
- [x] Real-time monitoring active
- [x] Violation alerts configured
- [x] Backup restoration tested
- [x] Security dashboard accessible

---

## 🎓 Created By

**Md.Hriday Khan**

CyberAuton Security Operations Centre
Enterprise Cybersecurity Platform

---

**Last Updated**: January 6, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
