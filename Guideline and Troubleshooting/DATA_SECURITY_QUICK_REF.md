# 🛡️ Data Security Quick Reference

## Quick Start

\# Setup (run once)

./SETUP\_DATA\_SECURITY.sh          \# Linux/Mac

SETUP\_DATA\_SECURITY.bat           \# Windows

\# Start Secure Backend

./START\_SECURE\_BACKEND.sh         \# Linux/Mac

START\_SECURE\_BACKEND.bat          \# Windows

\# Test System

python3 test\_data\_security.py

## API Quick Reference

### Authentication

\# Login

curl \-X POST http://localhost:5000/api/auth/login \\

  \-H "Content-Type: application/json" \\

  \-d '{"username": "admin", "password": "password"}'

\# Verify Token

curl http://localhost:5000/api/auth/verify \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

### Security Status

\# Get Status

curl http://localhost:5000/api/security/status \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

\# Get Violations

curl http://localhost:5000/api/security/violations \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

\# Get Access Log

curl http://localhost:5000/api/security/access-log?limit=50 \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

### Backups

\# Create Backup

curl \-X POST http://localhost:5000/api/backup/create \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

\# List Backups

curl http://localhost:5000/api/backup/list \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

\# Restore Backup

curl \-X POST http://localhost:5000/api/backup/restore \\

  \-H "Authorization: Bearer YOUR\_TOKEN" \\

  \-H "Content-Type: application/json" \\

  \-d '{"backup\_path": "backups/backup\_20250106\_143022.db.gz"}'

## Python Quick Reference

### Initialize

from data\_integrity\_security import SecureDatasetHandler

handler \= SecureDatasetHandler()

### Secure Insert

success, record\_id, errors \= handler.secure\_insert(

    table\_name='threat\_intelligence',

    data={'threat\_type': 'DDoS', 'severity': 'high'},

    user\_id='admin',

    ip\_address='127.0.0.1',

    sensitive\_fields=\['source\_ip', 'target\_ip'\]

)

### Secure Retrieve

success, data, message \= handler.secure\_retrieve(

    table\_name='threat\_intelligence',

    record\_id=1234,

    user\_id='admin',

    ip\_address='127.0.0.1',

    encrypted\_fields=\['source\_ip', 'target\_ip'\]

)

### Security Status

status \= handler.get\_security\_status()

print(f"Integrity Score: {status\['integrity'\]\['integrity\_score'\]}%")

### Create Backup

backup\_path \= handler.backup\_manager.create\_backup(

    'shield\_backend.db',

    compress=True

)

## Security Features

- ✅ **Encryption**: Fernet (AES-128)  
- ✅ **Integrity**: SHA-256 checksums  
- ✅ **Authentication**: JWT tokens  
- ✅ **Validation**: Input sanitization  
- ✅ **Backups**: Automated every 6 hours  
- ✅ **Monitoring**: Real-time dashboard

## Common Tasks

### Check System Health

curl http://localhost:5000/api/health

### View Dashboard

1. Login to CyberAuton SOC  
2. Navigate: Management → Data Integrity Dashboard

### Manual Backup

curl \-X POST http://localhost:5000/api/backup/create \\

  \-H "Authorization: Bearer YOUR\_TOKEN"

### Review Violations

curl http://localhost:5000/api/security/violations \\

  \-H "Authorization: Bearer YOUR\_TOKEN" | jq

## Troubleshooting

### Backend Not Starting

\# Check dependencies

pip install flask flask-cors cryptography pyjwt

\# Check port availability

lsof \-i :5000  \# Linux/Mac

netstat \-ano | findstr :5000  \# Windows

### Integrity Violations

1. Check `/api/security/violations` endpoint  
2. Review audit logs  
3. Restore from backup if needed

### Database Issues

\# Reset databases

rm shield\_backend.db data\_integrity.db

\# Reinitialize

python3 \-c "from data\_integrity\_security import init\_secure\_handler; init\_secure\_handler()"

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
