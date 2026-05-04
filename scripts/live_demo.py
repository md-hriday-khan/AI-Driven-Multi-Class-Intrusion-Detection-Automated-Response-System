#!/usr/bin/env python3
"""
SHIELD SOC Live Demonstration Script
Orchestrates real-time attack scenarios and IDS responses
"""

import os
import sys
import time
import json
import threading
import subprocess
import signal
import logging
from datetime import datetime
import websocket
import requests
from colorama import init, Fore, Back, Style
import argparse

# Initialize colorama for cross-platform colored output
init()

class ShieldSOCDemo:
    """
    Live demonstration controller for SHIELD SOC
    """
    
    def __init__(self, soc_url="http://localhost:3000", ws_url="ws://localhost:8080"):
        self.soc_url = soc_url
        self.ws_url = ws_url
        self.demo_running = False
        self.processes = []
        self.demo_scenarios = []
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        
    def print_banner(self):
        """Print demo banner"""
        banner = f"""
{Fore.CYAN}{'='*80}
{Fore.BLUE}   _____ _    _ _____ ______ _      _____     _____  ____   _____ 
{Fore.BLUE}  / ____| |  | |_   _|  ____| |    |  __ \   / ____|/ __ \ / ____|
{Fore.BLUE} | (___ | |__| | | | | |__  | |    | |  | | | (___ | |  | | |     
{Fore.BLUE}  \___ \|  __  | | | |  __| | |    | |  | |  \___ \| |  | | |     
{Fore.BLUE}  ____) | |  | |_| |_| |____| |____| |__| |  ____) | |__| | |____ 
{Fore.BLUE} |_____/|_|  |_|_____|______|______|_____/  |_____/ \____/ \_____|
{Fore.CYAN}{'='*80}
{Fore.GREEN}           Real-time Intrusion Detection System Demo
{Fore.WHITE}              Advanced AI-Powered Cybersecurity Platform
{Fore.CYAN}{'='*80}
{Style.RESET_ALL}"""
        print(banner)
    
    def check_dependencies(self):
        """Check if required components are available"""
        print(f"{Fore.YELLOW}Checking system dependencies...{Style.RESET_ALL}")
        
        dependencies = {
            'SOC Frontend': self.check_soc_frontend,
            'WebSocket Server': self.check_websocket_server,
            'Real-time IDS': self.check_realtime_ids,
            'Attack Generator': self.check_attack_generator
        }
        
        all_good = True
        for name, check_func in dependencies.items():
            status = check_func()
            if status:
                print(f"  ✓ {Fore.GREEN}{name}: Available{Style.RESET_ALL}")
            else:
                print(f"  ✗ {Fore.RED}{name}: Not available{Style.RESET_ALL}")
                all_good = False
        
        return all_good
    
    def check_soc_frontend(self):
        """Check if SOC frontend is running"""
        try:
            response = requests.get(f"{self.soc_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def check_websocket_server(self):
        """Check if WebSocket server is running"""
        try:
            ws = websocket.create_connection(self.ws_url, timeout=5)
            ws.close()
            return True
        except:
            return False
    
    def check_realtime_ids(self):
        """Check if real-time IDS script exists"""
        return os.path.exists('../real_time_ids.py')
    
    def check_attack_generator(self):
        """Check if attack generator script exists"""
        return os.path.exists('attack_traffic_generator.py')
    
    def start_realtime_ids(self, interface='lo'):
        """Start the real-time IDS system"""
        print(f"{Fore.BLUE}Starting Real-time IDS on interface {interface}...{Style.RESET_ALL}")
        
        cmd = [
            'python3', '../real_time_ids.py',
            '--interface', interface,
            '--verbose'
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            self.processes.append(('realtime_ids', process))
            print(f"  ✓ {Fore.GREEN}Real-time IDS started (PID: {process.pid}){Style.RESET_ALL}")
            return True
        except Exception as e:
            print(f"  ✗ {Fore.RED}Failed to start Real-time IDS: {e}{Style.RESET_ALL}")
            return False
    
    def load_demo_scenarios(self):
        """Load predefined demo scenarios"""
        self.demo_scenarios = [
            {
                'name': 'DDoS Attack Simulation',
                'description': 'High-volume UDP flood attack',
                'attack_type': 'ddos',
                'duration': 30,
                'intensity': 'medium',
                'expected_detections': ['ddos', 'high_traffic', 'anomalous_packets']
            },
            {
                'name': 'Brute Force Attack',
                'description': 'Credential brute force attempts',
                'attack_type': 'bruteforce',
                'duration': 45,
                'intensity': 'medium',
                'expected_detections': ['bruteforce', 'failed_logins', 'suspicious_activity']
            },
            {
                'name': 'Malware Communication',
                'description': 'C2 server communication patterns',
                'attack_type': 'malware',
                'duration': 60,
                'intensity': 'low',
                'expected_detections': ['malware', 'c2_communication', 'suspicious_domains']
            },
            {
                'name': 'Data Exfiltration',
                'description': 'Large data transfer patterns',
                'attack_type': 'exfiltration',
                'duration': 40,
                'intensity': 'medium',
                'expected_detections': ['exfiltration', 'data_leak', 'large_uploads']
            },
            {
                'name': 'Port Scanning',
                'description': 'Network reconnaissance activity',
                'attack_type': 'portscan',
                'duration': 35,
                'intensity': 'high',
                'expected_detections': ['portscan', 'reconnaissance', 'network_probing']
            },
            {
                'name': 'Multi-Vector Attack',
                'description': 'Combined attack scenario',
                'attack_type': 'mixed',
                'duration': 90,
                'intensity': 'medium',
                'expected_detections': ['multiple_attacks', 'coordinated_attack', 'high_threat_level']
            }
        ]
    
    def display_scenarios(self):
        """Display available demo scenarios"""
        print(f"\n{Fore.CYAN}Available Demo Scenarios:{Style.RESET_ALL}")
        print("=" * 60)
        
        for i, scenario in enumerate(self.demo_scenarios, 1):
            print(f"{Fore.YELLOW}{i:2d}.{Style.RESET_ALL} {Fore.WHITE}{scenario['name']}{Style.RESET_ALL}")
            print(f"     {scenario['description']}")
            print(f"     Duration: {scenario['duration']}s | Intensity: {scenario['intensity']}")
            print(f"     Expected: {', '.join(scenario['expected_detections'])}")
            print()
    
    def run_attack_scenario(self, scenario):
        """Run a specific attack scenario"""
        print(f"\n{Fore.RED}{'='*60}")
        print(f"LAUNCHING ATTACK SCENARIO: {scenario['name']}")
        print(f"{'='*60}{Style.RESET_ALL}")
        
        print(f"{Fore.YELLOW}Scenario Details:{Style.RESET_ALL}")
        print(f"  Type: {scenario['attack_type']}")
        print(f"  Duration: {scenario['duration']} seconds")
        print(f"  Intensity: {scenario['intensity']}")
        print(f"  Expected Detections: {', '.join(scenario['expected_detections'])}")
        
        # Start attack generator
        cmd = [
            'python3', 'attack_traffic_generator.py',
            '--attack', scenario['attack_type'],
            '--duration', str(scenario['duration']),
            '--intensity', scenario['intensity'],
            '--target', '127.0.0.1',
            '--log', f"attack_log_{scenario['attack_type']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        ]
        
        print(f"\n{Fore.BLUE}Starting attack generator...{Style.RESET_ALL}")
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            self.processes.append(('attack_generator', process))
            
            # Monitor attack progress
            start_time = time.time()
            print(f"\n{Fore.GREEN}Attack in progress...{Style.RESET_ALL}")
            
            while process.poll() is None and (time.time() - start_time) < scenario['duration'] + 10:
                elapsed = int(time.time() - start_time)
                remaining = max(0, scenario['duration'] - elapsed)
                
                print(f"\r{Fore.YELLOW}Progress: {elapsed:3d}s elapsed, {remaining:3d}s remaining{Style.RESET_ALL}", end='', flush=True)
                time.sleep(1)
            
            print(f"\n{Fore.GREEN}Attack scenario completed!{Style.RESET_ALL}")
            
            # Get attack results
            stdout, stderr = process.communicate(timeout=5)
            if stdout:
                print(f"\n{Fore.CYAN}Attack Results:{Style.RESET_ALL}")
                print(stdout)
                
        except subprocess.TimeoutExpired:
            print(f"\n{Fore.YELLOW}Attack timed out, terminating...{Style.RESET_ALL}")
            process.terminate()
        except Exception as e:
            print(f"\n{Fore.RED}Error running attack: {e}{Style.RESET_ALL}")
    
    def monitor_detections(self, duration=60):
        """Monitor IDS detections in real-time"""
        print(f"\n{Fore.BLUE}Monitoring IDS detections for {duration} seconds...{Style.RESET_ALL}")
        
        detection_count = 0
        start_time = time.time()
        
        try:
            # Connect to WebSocket for real-time updates
            ws = websocket.create_connection(self.ws_url)
            
            while time.time() - start_time < duration:
                try:
                    # Receive WebSocket message
                    message = ws.recv()
                    data = json.loads(message)
                    
                    if 'is_attack' in data and data['is_attack']:
                        detection_count += 1
                        timestamp = datetime.now().strftime('%H:%M:%S')
                        
                        print(f"\n{Fore.RED}🚨 ATTACK DETECTED at {timestamp}:{Style.RESET_ALL}")
                        print(f"  Flow: {data.get('flow_key', 'unknown')}")
                        print(f"  Score: {data.get('anomaly_score', 0):.3f}")
                        print(f"  Confidence: {data.get('confidence', 0):.3f}")
                        
                except websocket.WebSocketTimeoutError:
                    pass
                except Exception as e:
                    print(f"WebSocket error: {e}")
                    break
            
            ws.close()
            
        except Exception as e:
            print(f"Failed to connect to WebSocket: {e}")
            print("Simulating detection monitoring...")
            
            # Fallback: simulate detections
            for i in range(duration):
                if i % 5 == 0 and i > 0:  # Simulate detection every 5 seconds
                    detection_count += 1
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    print(f"\n{Fore.RED}🚨 SIMULATED DETECTION at {timestamp}:{Style.RESET_ALL}")
                    print(f"  Anomaly Score: {0.7 + (i * 0.01):.3f}")
                
                time.sleep(1)
        
        print(f"\n{Fore.GREEN}Detection monitoring completed. Total detections: {detection_count}{Style.RESET_ALL}")
        return detection_count
    
    def run_demo_sequence(self, scenario_indices=None):
        """Run a sequence of demo scenarios"""
        if scenario_indices is None:
            scenario_indices = list(range(len(self.demo_scenarios)))
        
        print(f"\n{Fore.CYAN}Starting Demo Sequence{Style.RESET_ALL}")
        print(f"Running {len(scenario_indices)} scenarios...")
        
        total_detections = 0
        
        for i, scenario_idx in enumerate(scenario_indices, 1):
            if scenario_idx >= len(self.demo_scenarios):
                print(f"Invalid scenario index: {scenario_idx}")
                continue
            
            scenario = self.demo_scenarios[scenario_idx]
            
            print(f"\n{Fore.MAGENTA}Demo {i}/{len(scenario_indices)}: {scenario['name']}{Style.RESET_ALL}")
            
            # Start monitoring thread
            monitor_thread = threading.Thread(
                target=lambda: self.monitor_detections(scenario['duration'] + 10),
                daemon=True
            )
            monitor_thread.start()
            
            # Run attack scenario
            self.run_attack_scenario(scenario)
            
            # Wait for monitoring to complete
            monitor_thread.join(timeout=scenario['duration'] + 15)
            
            # Brief pause between scenarios
            if i < len(scenario_indices):
                print(f"\n{Fore.BLUE}Pausing for 10 seconds before next scenario...{Style.RESET_ALL}")
                time.sleep(10)
        
        print(f"\n{Fore.GREEN}Demo sequence completed!{Style.RESET_ALL}")
    
    def cleanup(self):
        """Clean up running processes"""
        print(f"\n{Fore.YELLOW}Cleaning up processes...{Style.RESET_ALL}")
        
        for name, process in self.processes:
            try:
                if process.poll() is None:
                    print(f"  Terminating {name} (PID: {process.pid})")
                    process.terminate()
                    process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"  Force killing {name} (PID: {process.pid})")
                process.kill()
            except Exception as e:
                print(f"  Error terminating {name}: {e}")
        
        self.processes.clear()
        print(f"{Fore.GREEN}Cleanup completed.{Style.RESET_ALL}")
    
    def interactive_mode(self):
        """Run demo in interactive mode"""
        try:
            while True:
                print(f"\n{Fore.CYAN}SHIELD SOC Demo Control Panel{Style.RESET_ALL}")
                print("1. Run single scenario")
                print("2. Run demo sequence")
                print("3. Monitor detections only")
                print("4. Show system status")
                print("5. Exit")
                
                choice = input(f"\n{Fore.WHITE}Select option (1-5): {Style.RESET_ALL}")
                
                if choice == '1':
                    self.display_scenarios()
                    scenario_choice = input(f"{Fore.WHITE}Select scenario (1-{len(self.demo_scenarios)}): {Style.RESET_ALL}")
                    
                    try:
                        idx = int(scenario_choice) - 1
                        if 0 <= idx < len(self.demo_scenarios):
                            self.run_demo_sequence([idx])
                        else:
                            print(f"{Fore.RED}Invalid scenario number.{Style.RESET_ALL}")
                    except ValueError:
                        print(f"{Fore.RED}Please enter a valid number.{Style.RESET_ALL}")
                
                elif choice == '2':
                    print("Running full demo sequence...")
                    self.run_demo_sequence()
                
                elif choice == '3':
                    duration = input(f"{Fore.WHITE}Monitor duration (seconds, default 60): {Style.RESET_ALL}")
                    try:
                        duration = int(duration) if duration else 60
                        self.monitor_detections(duration)
                    except ValueError:
                        print(f"{Fore.RED}Invalid duration.{Style.RESET_ALL}")
                
                elif choice == '4':
                    print(f"\n{Fore.CYAN}System Status:{Style.RESET_ALL}")
                    self.check_dependencies()
                    print(f"Active processes: {len(self.processes)}")
                    for name, process in self.processes:
                        status = "Running" if process.poll() is None else "Stopped"
                        print(f"  {name}: {status}")
                
                elif choice == '5':
                    print("Exiting demo...")
                    break
                
                else:
                    print(f"{Fore.RED}Invalid choice. Please select 1-5.{Style.RESET_ALL}")
                    
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Demo interrupted by user.{Style.RESET_ALL}")
        finally:
            self.cleanup()


def signal_handler(signum, frame):
    """Handle interrupt signals"""
    print(f"\n{Fore.YELLOW}Received signal {signum}, shutting down...{Style.RESET_ALL}")
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description='SHIELD SOC Live Demo')
    parser.add_argument('--soc-url', default='http://localhost:3000', help='SOC frontend URL')
    parser.add_argument('--ws-url', default='ws://localhost:8080', help='WebSocket server URL')
    parser.add_argument('--interface', default='lo', help='Network interface for IDS')
    parser.add_argument('--scenario', type=int, help='Run specific scenario (1-6)')
    parser.add_argument('--sequence', action='store_true', help='Run full demo sequence')
    parser.add_argument('--auto', action='store_true', help='Run automated demo without interaction')
    
    args = parser.parse_args()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create demo instance
    demo = ShieldSOCDemo(soc_url=args.soc_url, ws_url=args.ws_url)
    
    try:
        # Print banner
        demo.print_banner()
        
        # Check dependencies
        if not demo.check_dependencies():
            print(f"\n{Fore.RED}Some dependencies are missing. Please ensure all components are running.{Style.RESET_ALL}")
            if not args.auto:
                continue_anyway = input("Continue anyway? (y/n): ")
                if continue_anyway.lower() != 'y':
                    sys.exit(1)
        
        # Load scenarios
        demo.load_demo_scenarios()
        
        # Start real-time IDS
        if not demo.start_realtime_ids(args.interface):
            print(f"{Fore.YELLOW}Warning: Real-time IDS not started. Demo will have limited functionality.{Style.RESET_ALL}")
        
        # Run demo based on arguments
        if args.scenario:
            if 1 <= args.scenario <= len(demo.demo_scenarios):
                demo.run_demo_sequence([args.scenario - 1])
            else:
                print(f"{Fore.RED}Invalid scenario number. Available: 1-{len(demo.demo_scenarios)}{Style.RESET_ALL}")
        elif args.sequence or args.auto:
            demo.run_demo_sequence()
        else:
            demo.interactive_mode()
            
    except Exception as e:
        print(f"{Fore.RED}Demo error: {e}{Style.RESET_ALL}")
        logging.exception("Demo error")
    finally:
        demo.cleanup()
        print(f"\n{Fore.GREEN}SHIELD SOC Demo completed. Thank you!{Style.RESET_ALL}")


if __name__ == "__main__":
    main()