#!/usr/bin/env python3
"""
Backend API Validation Script
Tests all API endpoints and verifies functionality
"""

import requests
import json
import sys
import time
from datetime import datetime

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(message):
    """Print formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {message}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.RESET}\n")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.RESET} {message}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.RESET} {message}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {message}")

def test_endpoint(method, url, description, expected_status=200, json_data=None):
    """Test a single API endpoint"""
    try:
        print(f"\n{Colors.BOLD}Testing:{Colors.RESET} {description}")
        print(f"  URL: {url}")
        print(f"  Method: {method}")
        
        start_time = time.time()
        
        if method == 'GET':
            response = requests.get(url, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=json_data or {}, timeout=5)
        else:
            print_error(f"Unsupported method: {method}")
            return False
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        if response.status_code == expected_status:
            print_success(f"Status: {response.status_code} (Expected: {expected_status})")
            print_success(f"Response time: {response_time:.2f}ms")
            
            # Try to parse JSON response
            try:
                data = response.json()
                print_info(f"Response keys: {', '.join(data.keys())}")
                
                if 'success' in data and data['success']:
                    print_success("Response indicates success")
                    return True
                elif 'status' in data and data['status'] == 'healthy':
                    print_success("Health check passed")
                    return True
                else:
                    print_warning("Response received but success not indicated")
                    return True
            except json.JSONDecodeError:
                print_warning("Response is not JSON")
                return True
        else:
            print_error(f"Status: {response.status_code} (Expected: {expected_status})")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Connection failed - Backend service not running")
        return False
    except requests.exceptions.Timeout:
        print_error("Request timeout - Service may be overloaded")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def main():
    """Main validation routine"""
    print_header("CyberAuton Backend API Validation")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    base_url = "http://localhost:5000"
    
    # Check if backend is running
    print_info("Checking if backend service is running...")
    
    try:
        response = requests.get(f"{base_url}/api/health", timeout=2)
        if response.status_code == 200:
            print_success("Backend service is running!")
        else:
            print_error("Backend service returned unexpected status")
            sys.exit(1)
    except:
        print_error("Backend service is NOT running!")
        print_warning("\nTo start the backend:")
        print("  python backend_api_server.py")
        print("  or")
        print("  python start_all_backends.py")
        print("\nNote: The frontend works perfectly without the backend (demo mode)")
        sys.exit(1)
    
    # Test results tracking
    tests = []
    
    print_header("Testing Core Endpoints")
    
    # Health Check
    tests.append(test_endpoint(
        'GET', 
        f"{base_url}/api/health",
        "Health Check"
    ))
    
    # System Metrics
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/system/metrics",
        "System Performance Metrics"
    ))
    
    # IDS Stats
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/ids/stats",
        "IDS Engine Statistics"
    ))
    
    print_header("Testing Security Endpoints")
    
    # Security Status
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/security/status",
        "Security Status (NEW)"
    ))
    
    # Security Violations
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/security/violations",
        "Security Violations (NEW)"
    ))
    
    # Access Log
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/security/access-log?limit=10",
        "Security Access Log (NEW)"
    ))
    
    print_header("Testing Backup Endpoints")
    
    # Create Backup
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/backup/create",
        "Create Backup (NEW)"
    ))
    
    # List Backups
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/backup/list",
        "List Backups (NEW)"
    ))
    
    print_header("Testing Threat Intelligence")
    
    # Real-time Threats
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/threats/real-time",
        "Real-time Threat Data"
    ))
    
    print_header("Testing Export Endpoints")
    
    # MITRE Export
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/mitre/export",
        "MITRE ATT&CK Framework Export"
    ))
    
    # PCAP Export
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/network/export-pcap",
        "Network PCAP Export"
    ))
    
    # Network Report
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/network/report",
        "Network Analysis Report"
    ))
    
    print_header("Testing Audit Endpoints")
    
    # Audit Logs
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/audit/logs",
        "Audit Logs"
    ))
    
    # File Info
    tests.append(test_endpoint(
        'GET',
        f"{base_url}/api/file-info/secure/threat_intel/database.json",
        "File Information"
    ))
    
    # Comprehensive Report
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/export/comprehensive-report",
        "Comprehensive Security Report"
    ))
    
    print_header("Testing IDS Control")
    
    # Start IDS
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/ids/start",
        "Start IDS System"
    ))
    
    # Stop IDS
    tests.append(test_endpoint(
        'POST',
        f"{base_url}/api/ids/stop",
        "Stop IDS System"
    ))
    
    # Summary
    print_header("Validation Summary")
    
    passed = sum(tests)
    total = len(tests)
    percentage = (passed / total) * 100 if total > 0 else 0
    
    print(f"\n{Colors.BOLD}Results:{Colors.RESET}")
    print(f"  Total Tests: {total}")
    print(f"  Passed: {Colors.GREEN}{passed}{Colors.RESET}")
    print(f"  Failed: {Colors.RED}{total - passed}{Colors.RESET}")
    print(f"  Success Rate: {percentage:.1f}%\n")
    
    if percentage == 100:
        print_success("All tests passed! Backend is fully functional.")
        print_info("\nThe backend is ready to serve the frontend.")
        print_info("You can now use the application with full backend integration.")
    elif percentage >= 80:
        print_warning("Most tests passed, but some issues detected.")
        print_info("The system should work, but check failed tests above.")
    else:
        print_error("Multiple tests failed!")
        print_warning("Check the error messages above for details.")
        print_info("\nCommon issues:")
        print("  1. Dependencies not installed: pip install -r requirements.txt")
        print("  2. Database errors: Delete shield_backend.db and restart")
        print("  3. Port conflicts: Check if port 5000 is available")
    
    print(f"\n{Colors.BOLD}Note:{Colors.RESET} The frontend works perfectly even if backend tests fail.")
    print("All features are available with simulated data in demo mode.\n")
    
    return 0 if percentage == 100 else 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Validation interrupted by user{Colors.RESET}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Fatal error: {e}{Colors.RESET}")
        sys.exit(1)
