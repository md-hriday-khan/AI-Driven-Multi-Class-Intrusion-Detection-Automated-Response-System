#!/usr/bin/env python3
"""
API Connectivity Checker and Health Monitor
Comprehensive testing and validation tool for CyberAuton SOC backend services
Created by Md.Hriday Khan
"""

import requests
import websocket
import json
import time
import threading
import logging
import socket
import subprocess
import sys
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_connectivity.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class APIConnectivityChecker:
    """
    Comprehensive API connectivity and health checker for all CyberAuton SOC services
    """
    
    def __init__(self):
        self.results = {}
        self.services = {
            'backend_api': {
                'url': 'http://localhost:5000',
                'endpoints': [
                    '/api/health',
                    '/api/ids/stats',
                    '/api/mitre/export',
                    '/api/network/export-pcap',
                    '/api/network/report',
                    '/api/audit/logs',
                    '/api/threats/real-time',
                    '/api/system/metrics',
                    '/api/export/comprehensive-report'
                ],
                'type': 'http'
            },
            'websocket_server': {
                'url': 'ws://localhost:8080',
                'endpoints': ['/health'],
                'type': 'websocket'
            },
            'ids_websocket': {
                'url': 'ws://localhost:8081',
                'endpoints': [],
                'type': 'websocket'
            },
            'vehicle_safety_api': {
                'url': 'http://localhost:5001',
                'endpoints': [
                    '/api/emergency/stop',
                    '/api/emergency/pull-over',
                    '/api/vehicle/status',
                    '/api/systems/health'
                ],
                'type': 'http'
            }
        }
        
    def check_port_availability(self, host: str, port: int, timeout: int = 5) -> bool:
        """Check if a port is available/listening"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(timeout)
                result = sock.connect_ex((host, port))
                return result == 0
        except Exception as e:
            logger.error(f"Error checking port {port}: {e}")
            return False
    
    def check_http_endpoint(self, base_url: str, endpoint: str, timeout: int = 10) -> Dict:
        """Check HTTP endpoint connectivity and response"""
        full_url = f"{base_url}{endpoint}"
        result = {
            'url': full_url,
            'status': 'unknown',
            'response_time': None,
            'status_code': None,
            'response_data': None,
            'error': None
        }
        
        try:
            start_time = time.time()
            
            if endpoint in ['/api/mitre/export', '/api/network/export-pcap', '/api/network/report', '/api/export/comprehensive-report']:
                # POST endpoints
                response = requests.post(full_url, json={}, timeout=timeout, verify=False)
            else:
                # GET endpoints
                response = requests.get(full_url, timeout=timeout, verify=False)
            
            end_time = time.time()
            
            result['response_time'] = round((end_time - start_time) * 1000, 2)  # ms
            result['status_code'] = response.status_code
            
            if response.status_code < 400:
                result['status'] = 'success'
                try:
                    result['response_data'] = response.json()
                except:
                    result['response_data'] = response.text[:200]  # First 200 chars
            else:
                result['status'] = 'error'
                result['error'] = f"HTTP {response.status_code}: {response.text[:100]}"
                
        except requests.exceptions.Timeout:
            result['status'] = 'timeout'
            result['error'] = f"Request timeout after {timeout}s"
        except requests.exceptions.ConnectionError:
            result['status'] = 'connection_error'
            result['error'] = "Connection refused or host unreachable"
        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
        
        return result
    
    def check_websocket_endpoint(self, ws_url: str, timeout: int = 10) -> Dict:
        """Check WebSocket connectivity"""
        result = {
            'url': ws_url,
            'status': 'unknown',
            'connection_time': None,
            'messages_received': 0,
            'error': None
        }
        
        try:
            start_time = time.time()
            
            def on_message(ws, message):
                result['messages_received'] += 1
                logger.debug(f"WebSocket message received: {message[:100]}")
            
            def on_error(ws, error):
                result['error'] = str(error)
                result['status'] = 'error'
            
            def on_open(ws):
                connection_time = time.time() - start_time
                result['connection_time'] = round(connection_time * 1000, 2)  # ms
                result['status'] = 'connected'
                # Send test message
                ws.send(json.dumps({"type": "ping", "timestamp": time.time()}))
            
            def on_close(ws, close_status_code, close_msg):
                if result['status'] == 'connected':
                    result['status'] = 'success'
            
            ws = websocket.WebSocketApp(
                ws_url,
                on_message=on_message,
                on_error=on_error,
                on_open=on_open,
                on_close=on_close
            )
            
            # Run WebSocket in a separate thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection or timeout
            time.sleep(3)  # Give it time to connect and receive messages
            ws.close()
            ws_thread.join(timeout=2)
            
            if result['status'] == 'unknown':
                result['status'] = 'timeout'
                result['error'] = f"WebSocket connection timeout after {timeout}s"
                
        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
        
        return result
    
    def check_service_health(self, service_name: str, service_config: Dict) -> Dict:
        """Check health of a specific service"""
        logger.info(f"Checking service: {service_name}")
        
        service_result = {
            'service_name': service_name,
            'service_type': service_config['type'],
            'base_url': service_config['url'],
            'overall_status': 'unknown',
            'endpoints': {},
            'summary': {
                'total_endpoints': 0,
                'successful_endpoints': 0,
                'failed_endpoints': 0,
                'average_response_time': 0
            }
        }
        
        # Extract host and port
        if service_config['type'] == 'http':
            url_parts = service_config['url'].replace('http://', '').replace('https://', '')
            host, port = url_parts.split(':') if ':' in url_parts else (url_parts, 80)
            port = int(port)
        else:  # websocket
            url_parts = service_config['url'].replace('ws://', '').replace('wss://', '')
            host, port = url_parts.split(':') if ':' in url_parts else (url_parts, 80)
            port = int(port)
        
        # Check if port is listening
        port_available = self.check_port_availability(host, port)
        service_result['port_available'] = port_available
        
        if not port_available:
            service_result['overall_status'] = 'port_closed'
            service_result['error'] = f"Port {port} is not listening on {host}"
            return service_result
        
        # Check endpoints
        response_times = []
        
        if service_config['type'] == 'http':
            # HTTP service
            for endpoint in service_config['endpoints']:
                endpoint_result = self.check_http_endpoint(service_config['url'], endpoint)
                service_result['endpoints'][endpoint] = endpoint_result
                
                if endpoint_result['status'] == 'success':
                    service_result['summary']['successful_endpoints'] += 1
                    if endpoint_result['response_time']:
                        response_times.append(endpoint_result['response_time'])
                else:
                    service_result['summary']['failed_endpoints'] += 1
                
                service_result['summary']['total_endpoints'] += 1
        
        else:  # websocket
            # WebSocket service
            ws_result = self.check_websocket_endpoint(service_config['url'])
            service_result['endpoints']['websocket'] = ws_result
            
            if ws_result['status'] in ['success', 'connected']:
                service_result['summary']['successful_endpoints'] = 1
                if ws_result['connection_time']:
                    response_times.append(ws_result['connection_time'])
            else:
                service_result['summary']['failed_endpoints'] = 1
            
            service_result['summary']['total_endpoints'] = 1
        
        # Calculate overall status
        if service_result['summary']['failed_endpoints'] == 0:
            service_result['overall_status'] = 'healthy'
        elif service_result['summary']['successful_endpoints'] > 0:
            service_result['overall_status'] = 'partial'
        else:
            service_result['overall_status'] = 'unhealthy'
        
        # Calculate average response time
        if response_times:
            service_result['summary']['average_response_time'] = round(sum(response_times) / len(response_times), 2)
        
        return service_result
    
    def check_python_dependencies(self) -> Dict:
        """Check if required Python dependencies are installed"""
        dependencies = [
            'flask', 'flask_cors', 'pandas', 'numpy', 'sqlite3',
            'sklearn', 'joblib', 'websockets', 'asyncio'
        ]
        
        dependency_status = {}
        for dep in dependencies:
            try:
                if dep == 'sqlite3':
                    import sqlite3
                elif dep == 'asyncio':
                    import asyncio
                else:
                    __import__(dep)
                dependency_status[dep] = 'installed'
            except ImportError:
                dependency_status[dep] = 'missing'
            except Exception as e:
                dependency_status[dep] = f'error: {str(e)}'
        
        return dependency_status
    
    def check_system_resources(self) -> Dict:
        """Check system resources and requirements"""
        resources = {
            'timestamp': datetime.now().isoformat(),
            'python_version': sys.version,
            'platform': sys.platform
        }
        
        try:
            import psutil
            resources['cpu_count'] = psutil.cpu_count()
            resources['memory_total_gb'] = round(psutil.virtual_memory().total / (1024**3), 2)
            resources['memory_available_gb'] = round(psutil.virtual_memory().available / (1024**3), 2)
            resources['disk_usage_percent'] = psutil.disk_usage('/').percent
        except ImportError:
            resources['system_info'] = 'psutil not available for detailed system info'
        
        return resources
    
    def run_comprehensive_check(self) -> Dict:
        """Run comprehensive connectivity and health check"""
        logger.info("Starting comprehensive API connectivity check...")
        
        check_results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'unknown',
            'services': {},
            'dependencies': {},
            'system_resources': {},
            'summary': {
                'total_services': len(self.services),
                'healthy_services': 0,
                'partial_services': 0,
                'unhealthy_services': 0
            }
        }
        
        # Check dependencies
        logger.info("Checking Python dependencies...")
        check_results['dependencies'] = self.check_python_dependencies()
        
        # Check system resources
        logger.info("Checking system resources...")
        check_results['system_resources'] = self.check_system_resources()
        
        # Check each service
        for service_name, service_config in self.services.items():
            service_result = self.check_service_health(service_name, service_config)
            check_results['services'][service_name] = service_result
            
            # Update summary
            if service_result['overall_status'] == 'healthy':
                check_results['summary']['healthy_services'] += 1
            elif service_result['overall_status'] == 'partial':
                check_results['summary']['partial_services'] += 1
            else:
                check_results['summary']['unhealthy_services'] += 1
        
        # Determine overall status
        if check_results['summary']['unhealthy_services'] == 0:
            if check_results['summary']['partial_services'] == 0:
                check_results['overall_status'] = 'all_healthy'
            else:
                check_results['overall_status'] = 'mostly_healthy'
        elif check_results['summary']['healthy_services'] > 0:
            check_results['overall_status'] = 'mixed'
        else:
            check_results['overall_status'] = 'critical'
        
        self.results = check_results
        return check_results
    
    def print_detailed_report(self):
        """Print detailed connectivity report"""
        if not self.results:
            logger.error("No check results available. Run check first.")
            return
        
        results = self.results
        
        print("\n" + "="*80)
        print("CYBERAUTON SOC - API CONNECTIVITY REPORT")
        print("="*80)
        print(f"Timestamp: {results['timestamp']}")
        print(f"Overall Status: {results['overall_status'].upper()}")
        print(f"Services: {results['summary']['healthy_services']}/{results['summary']['total_services']} healthy")
        
        # Dependencies
        print("\n📦 PYTHON DEPENDENCIES:")
        for dep, status in results['dependencies'].items():
            status_icon = "✅" if status == "installed" else "❌"
            print(f"  {status_icon} {dep}: {status}")
        
        # System Resources
        print("\n💻 SYSTEM RESOURCES:")
        sys_res = results['system_resources']
        print(f"  • Python Version: {sys_res.get('python_version', 'Unknown')}")
        if 'memory_total_gb' in sys_res:
            print(f"  • Memory: {sys_res['memory_available_gb']:.1f}GB available / {sys_res['memory_total_gb']:.1f}GB total")
            print(f"  • CPU Cores: {sys_res.get('cpu_count', 'Unknown')}")
            print(f"  • Disk Usage: {sys_res.get('disk_usage_percent', 'Unknown')}%")
        
        # Services
        print("\n🔗 SERVICE CONNECTIVITY:")
        for service_name, service_data in results['services'].items():
            status_icon = {
                'healthy': '✅',
                'partial': '⚠️',
                'unhealthy': '❌',
                'port_closed': '🔒'
            }.get(service_data['overall_status'], '❓')
            
            print(f"\n  {status_icon} {service_name.upper()} ({service_data['service_type']})")
            print(f"     URL: {service_data['base_url']}")
            print(f"     Status: {service_data['overall_status']}")
            print(f"     Port Available: {'Yes' if service_data.get('port_available', False) else 'No'}")
            
            if service_data['summary']['total_endpoints'] > 0:
                success_rate = (service_data['summary']['successful_endpoints'] / 
                              service_data['summary']['total_endpoints'] * 100)
                print(f"     Success Rate: {success_rate:.1f}% ({service_data['summary']['successful_endpoints']}/{service_data['summary']['total_endpoints']})")
                
                if service_data['summary']['average_response_time'] > 0:
                    print(f"     Avg Response Time: {service_data['summary']['average_response_time']}ms")
            
            # Show endpoint details for failed endpoints
            for endpoint, endpoint_data in service_data['endpoints'].items():
                if endpoint_data['status'] != 'success':
                    print(f"     ❌ {endpoint}: {endpoint_data['status']} - {endpoint_data.get('error', 'Unknown error')}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        
        unhealthy_services = [name for name, data in results['services'].items() 
                            if data['overall_status'] in ['unhealthy', 'port_closed']]
        
        if unhealthy_services:
            print("  • Start the following services:")
            for service in unhealthy_services:
                service_config = self.services[service]
                if 'backend_api' in service:
                    print("    - Run: python backend_api_server.py")
                elif 'websocket' in service:
                    print("    - Run: node websocket-server/server.js")
                elif 'vehicle_safety' in service:
                    print("    - Run: python vehicle_safety_api.py")
        
        missing_deps = [dep for dep, status in results['dependencies'].items() 
                       if status == 'missing']
        if missing_deps:
            print("  • Install missing dependencies:")
            print(f"    pip install {' '.join(missing_deps)}")
        
        if results['overall_status'] == 'all_healthy':
            print("  ✅ All systems operational! No action required.")
        
        print("\n" + "="*80)
    
    def save_results_to_file(self, filename: str = None):
        """Save results to JSON file"""
        if not self.results:
            logger.error("No results to save")
            return
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"api_connectivity_report_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.results, f, indent=2)
            logger.info(f"Results saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving results: {e}")

def main():
    """Main function to run connectivity checks"""
    checker = APIConnectivityChecker()
    
    print("🔍 CyberAuton SOC - API Connectivity Checker")
    print("Checking all backend services and API endpoints...")
    
    # Run comprehensive check
    results = checker.run_comprehensive_check()
    
    # Print detailed report
    checker.print_detailed_report()
    
    # Save results
    checker.save_results_to_file()
    
    # Return exit code based on overall status
    if results['overall_status'] in ['all_healthy', 'mostly_healthy']:
        return 0
    elif results['overall_status'] == 'mixed':
        return 1
    else:
        return 2

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)