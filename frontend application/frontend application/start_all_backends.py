#!/usr/bin/env python3
"""
CyberAuton SOC - Complete Backend Startup Script
This script starts all backend services for the Security Operations Centre
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def print_header(message):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {message}")
    print("=" * 70 + "\n")

def check_dependencies():
    """Check if required Python packages are installed"""
    print_header("Checking Dependencies")
    
    required_packages = [
        'flask',
        'flask_cors',
        'pandas',
        'numpy',
        'sqlite3'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'flask_cors':
                __import__('flask_cors')
            elif package == 'sqlite3':
                __import__(package)
            else:
                __import__(package)
            print(f"✓ {package} is installed")
        except ImportError:
            print(f"✗ {package} is NOT installed")
            missing_packages.append(package)
    
    if missing_packages:
        print("\n⚠️  Missing packages detected!")
        print(f"Install them with: pip install {' '.join(missing_packages)}")
        print("\nOr install all requirements: pip install -r requirements.txt")
        return False
    
    print("\n✓ All dependencies are installed!")
    return True

def start_backend_service(name, script, port, log_file):
    """Start a backend service"""
    print(f"\nStarting {name} on port {port}...")
    
    try:
        # Check if script exists
        if not os.path.exists(script):
            print(f"✗ Script not found: {script}")
            return None
        
        # Start the process
        with open(log_file, 'w') as log:
            process = subprocess.Popen(
                [sys.executable, script],
                stdout=log,
                stderr=subprocess.STDOUT,
                cwd=os.getcwd()
            )
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            print(f"✓ {name} started successfully (PID: {process.pid})")
            print(f"  Log file: {log_file}")
            return process
        else:
            print(f"✗ {name} failed to start. Check log file: {log_file}")
            return None
            
    except Exception as e:
        print(f"✗ Error starting {name}: {e}")
        return None

def main():
    """Main startup routine"""
    print_header("CyberAuton Security Operations Centre")
    print("Starting all backend services...")
    
    # Check dependencies first
    if not check_dependencies():
        print("\n⚠️  Please install missing dependencies before starting services.")
        response = input("\nDo you want to continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("\nExiting...")
            sys.exit(1)
    
    print_header("Starting Backend Services")
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    processes = []
    
    # Service configurations
    services = [
        {
            'name': 'Main Backend API',
            'script': 'backend_api_server.py',
            'port': 5000,
            'log': 'logs/backend_api.log'
        },
        {
            'name': 'WebSocket Server',
            'script': 'websocket-server/server.js',
            'port': 8080,
            'log': 'logs/websocket.log',
            'skip': True  # Skip Node.js server for now
        }
    ]
    
    # Start each service
    for service in services:
        if service.get('skip'):
            print(f"\n⊘ Skipping {service['name']} (requires Node.js)")
            continue
            
        process = start_backend_service(
            service['name'],
            service['script'],
            service['port'],
            service['log']
        )
        
        if process:
            processes.append({
                'name': service['name'],
                'process': process,
                'port': service['port']
            })
    
    # Summary
    print_header("Service Status Summary")
    
    if processes:
        print("✓ Running Services:\n")
        for proc in processes:
            print(f"  • {proc['name']}")
            print(f"    - Port: {proc['port']}")
            print(f"    - PID: {proc['process'].pid}")
            print(f"    - URL: http://localhost:{proc['port']}")
            print()
        
        print("\n" + "=" * 70)
        print("  All services are running!")
        print("  Press Ctrl+C to stop all services")
        print("=" * 70 + "\n")
        
        # Keep script running and monitor processes
        try:
            while True:
                time.sleep(5)
                # Check if processes are still running
                for proc in processes:
                    if proc['process'].poll() is not None:
                        print(f"\n⚠️  {proc['name']} has stopped unexpectedly!")
                        
        except KeyboardInterrupt:
            print("\n\nShutting down all services...")
            for proc in processes:
                print(f"  Stopping {proc['name']}...")
                proc['process'].terminate()
                proc['process'].wait()
            print("\n✓ All services stopped.")
            
    else:
        print("✗ No services were started successfully.")
        print("\nTroubleshooting:")
        print("  1. Check the log files in the 'logs' directory")
        print("  2. Ensure all dependencies are installed: pip install -r requirements.txt")
        print("  3. Check if ports 5000, 5001, 8080, 8081 are available")
        print("\nFor demo mode without backend, just run the frontend:")
        print("  The system will automatically use mock data.")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        sys.exit(1)
