# 🛡️ Data Security Quick Reference

## Quick Start

```bash
# Setup (run once)
./SETUP_DATA_SECURITY.sh          # Linux/Mac
SETUP_DATA_SECURITY.bat           # Windows

# Start Secure Backend
./START_SECURE_BACKEND.sh         # Linux/Mac
START_SECURE_BACKEND.bat          # Windows

# Test System
python3 test_data_security.py
```

## API Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Verify Token
curl http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Security Status
```bash
# Get Status
curl http://localhost:5000/api/security/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Violations
curl http://localhost:5000/api/security/violations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Access Log
curl http://localhost:5000/api/security/access-log?limit=50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Backups
```bash
# Create Backup
curl -X POST http://localhost:5000/api/backup/create \
  -H "Authorization: Bearer YOUR_TOKEN"

# List Backups
curl http://localhost:5000/api/backup/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Restore Backup
curl -X POST http://localhost:5000/api/backup/restore \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backup_path": "backups/backup_20250106_143022.db.gz"}'
```

## Python Quick Reference

### Initialize
```python
from data_integrity_security import SecureDatasetHandler

handler = SecureDatasetHandler()
```

### Secure Insert
```python
success, record_id, errors = handler.secure_insert(
    table_name='threat_intelligence',
    data={'threat_type': 'DDoS', 'severity': 'high'},
    user_id='admin',
    ip_address='127.0.0.1',
    sensitive_fields=['source_ip', 'target_ip']
)
```

### Secure Retrieve
```python
success, data, message = handler.secure_retrieve(
    table_name='threat_intelligence',
    record_id=1234,
    user_id='admin',
    ip_address='127.0.0.1',
    encrypted_fields=['source_ip', 'target_ip']
)
```

### Security Status
```python
status = handler.get_security_status()
print(f"Integrity Score: {status['integrity']['integrity_score']}%")
```

### Create Backup
```python
backup_path = handler.backup_manager.create_backup(
    'shield_backend.db',
    compress=True
)
```

## Security Features

- ✅ **Encryption**: Fernet (AES-128)
- ✅ **Integrity**: SHA-256 checksums
- ✅ **Authentication**: JWT tokens
- ✅ **Validation**: Input sanitization
- ✅ **Backups**: Automated every 6 hours
- ✅ **Monitoring**: Real-time dashboard

## Common Tasks

### Check System Health
```bash
curl http://localhost:5000/api/health
```

### View Dashboard
1. Login to CyberAuton SOC
2. Navigate: Management → Data Integrity Dashboard

### Manual Backup
```bash
curl -X POST http://localhost:5000/api/backup/create \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Review Violations
```bash
curl http://localhost:5000/api/security/violations \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

## Troubleshooting

### Backend Not Starting
```bash
# Check dependencies
pip install flask flask-cors cryptography pyjwt

# Check port availability
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows
```

### Integrity Violations
1. Check `/api/security/violations` endpoint
2. Review audit logs
3. Restore from backup if needed

### Database Issues
```bash
# Reset databases
rm shield_backend.db data_integrity.db

# Reinitialize
python3 -c "from data_integrity_security import init_secure_handler; init_secure_handler()"
```

## File Locations

- **Backend API**: `secure_backend_api.py`
- **Security Module**: `data_integrity_security.py`
- **Dashboard**: `components/DataIntegrityDashboard.tsx`
- **Main Database**: `shield_backend.db`
- **Integrity DB**: `data_integrity.db`
- **Backups**: `backups/`
- **Logs**: `logs/`

## Support

- Full Guide: `DATA_SECURITY_GUIDE.md`
- Main README: `README.md`
- Setup Guide: `QUICK_START.md`

Created by **Md.Hriday Khan**
