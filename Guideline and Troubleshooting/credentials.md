# SHIELD Security Operations Center \- Test Credentials

## Authentication Information

**⚠️ IMPORTANT: These are test credentials for demonstration purposes only.** 

**Available User Accounts**

#### 1\. Administrator Account

- **Username:** `admin`  
- **Password:** `shield123!`  
- **Role:** Administrator  
- **Permissions:** Full system access, all operations  
- **Email:** [admin@shield.local](mailto:admin@shield.local)

#### 2\. Security Operations Account

- **Username:** `security_ops`  
- **Password:** `SecOps2024!`  
- **Role:** Operator  
- **Permissions:** Monitor, Respond, Investigate  
- **Email:** [ops@shield.local](mailto:ops@shield.local)

#### 3\. Security Analyst Account

- **Username:** `analyst`  
- **Password:** `Analyze123!`  
- **Role:** Analyst  
- **Permissions:** Monitor, Investigate, Report  
- **Email:** [analyst@shield.local](mailto:analyst@shield.local)

#### 4\. Viewer Account

- **Username:** `viewer`  
- **Password:** `View2024!`  
- **Role:** Viewer  
- **Permissions:** Monitor only (read-only access)  
- **Email:** [viewer@shield.local](mailto:viewer@shield.local)

## Features Available

### ✅ SQLite Event Logging

- Real-time event storage and retrieval  
- Full CRUD operations on security events  
- Event search and filtering capabilities  
- Database statistics and health monitoring  
- CSV import/export functionality

### ✅ Real-time Confidence Scores

- Live confidence score updates (every 2 seconds)  
- Threat-specific confidence tracking  
- Model performance metrics (Precision, Recall, F1-Score, Accuracy)  
- Historical confidence trends  
- Live confidence alerts  
- Radial confidence distribution charts

### ✅ CSV Testing Data Support

- Import security events from CSV files  
- Export current events to CSV format  
- Sample CSV file included (`sample_security_data.csv`)  
- Support for batch data operations  
- Data validation during import

### ✅ Enhanced Color Visibility

- Improved color contrast for better visibility  
- Brighter, more vibrant colors for critical indicators  
- Color-coded severity levels:  
  - **Critical:** Bright Red (\#ef4444)  
  - **High:** Orange (\#f97316)  
  - **Medium:** Yellow (\#f59e0b)  
  - **Low:** Green (\#10b981)  
- Enhanced status indicators  
- Better text contrast ratios

### ✅ Authentication & Authorization

- Session management with automatic timeout  
- Role-based access control  
- Multiple user roles with different permission levels  
- Secure login with attempt limiting  
- Session tracking and monitoring

## Quick Start Guide

1. **Login to the System**  
     
   - Use any of the test credentials above  
   - The system will redirect to the main dashboard after successful authentication

   

2. **Explore the Database Tab**  
     
   - View real-time event logging  
   - Import the sample CSV file for testing  
   - Export data for analysis

   

3. **Monitor Confidence Scores**  
     
   - Navigate to the "Confidence" tab  
   - Watch real-time confidence updates  
   - View historical trends and model metrics

   

4. **Test CSV Import/Export**  
     
   - Go to the "Database" tab  
   - Use the "Import CSV" button to upload `sample_security_data.csv`  
   - Export current data using the "Export CSV" button

## Security Notes

- All passwords are stored in plain text for demonstration purposes only  
- In production, implement proper password hashing (bcrypt, scrypt, etc.)  
- Use secure session management with HTTP-only cookies  
- Implement proper CSRF protection  
- Use HTTPS in production environments  
- Regular security audits and penetration testing recommended

## Database Schema

The SQLite database includes tables for:

- **threat\_events**: Security event records  
- **network\_traffic**: Network activity logs  
- **response\_actions**: Automated response logs  
- **system\_metrics**: Performance metrics  
- **model\_performance**: AI model statistics  
- **user\_activity**: User action logs  
- **configuration**: System settings

## Data Import Format

CSV files should follow this format:

ID,Event ID,Timestamp,Threat Type,Severity,Confidence,Source IP,Target IP,Attack Vector,Location,Status

Supported threat types: `ddos`, `malware`, `bruteforce`, `botnet`, `exfiltration`, `zeroday` Supported severities: `low`, `medium`, `high`, `critical` Supported statuses: `detected`, `investigating`, `mitigated`, `false_positive`

## Technical Implementation

- **Frontend:** React with TypeScript  
- **Styling:** Tailwind CSS with custom color scheme  
- **Charts:** Recharts for data visualization  
- **Database:** SQLite with comprehensive schema  
- **Authentication:** Session-based with role permissions  
- **Real-time Updates:** Simulated WebSocket connections  
- **Data Export:** CSV format with proper headers

## Support

For technical support or feature requests, please refer to the system documentation.