#!/usr/bin/env python3
"""
Privacy-Preserving Analytics Engine for SHIELD SOC
Implements differential privacy, homomorphic encryption, and secure multi-party computation
"""

import numpy as np
import pandas as pd
import hashlib
import hmac
import secrets
import json
import logging
import sqlite3
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import asyncio
import websockets

@dataclass
class PrivacyParameters:
    """Privacy parameters for differential privacy"""
    epsilon: float  # Privacy budget
    delta: float    # Failure probability
    sensitivity: float  # Global sensitivity
    mechanism: str  # laplace, gaussian, exponential

@dataclass
class AnalyticsQuery:
    """Privacy-preserving analytics query"""
    query_id: str
    query_type: str  # count, sum, mean, histogram, correlation
    data_source: str
    filters: Dict[str, Any]
    privacy_params: PrivacyParameters
    timestamp: str
    user_id: str
    approved: bool

@dataclass
class PrivateResult:
    """Result with privacy guarantees"""
    query_id: str
    result: Any
    noise_added: float
    privacy_cost: float
    confidence_interval: Tuple[float, float]
    timestamp: str
    metadata: Dict[str, Any]

class DifferentialPrivacyEngine:
    """Differential privacy implementation"""
    
    def __init__(self):
        self.privacy_budgets = {}  # Track privacy budgets per user/dataset
        self.query_history = []
        
    def add_laplace_noise(self, value: float, sensitivity: float, epsilon: float) -> float:
        """Add Laplace noise for differential privacy"""
        if epsilon <= 0:
            raise ValueError("Epsilon must be positive")
        
        scale = sensitivity / epsilon
        noise = np.random.laplace(0, scale)
        return value + noise
    
    def add_gaussian_noise(self, value: float, sensitivity: float, epsilon: float, delta: float) -> float:
        """Add Gaussian noise for (ε, δ)-differential privacy"""
        if epsilon <= 0 or delta <= 0 or delta >= 1:
            raise ValueError("Invalid privacy parameters")
        
        # Calculate noise scale using Gaussian mechanism
        sigma = (sensitivity * np.sqrt(2 * np.log(1.25 / delta))) / epsilon
        noise = np.random.normal(0, sigma)
        return value + noise
    
    def exponential_mechanism(self, candidates: List[Any], utility_function: callable, 
                            sensitivity: float, epsilon: float) -> Any:
        """Exponential mechanism for selecting from candidates"""
        utilities = [utility_function(candidate) for candidate in candidates]
        
        # Calculate probabilities using exponential mechanism
        scaled_utilities = [epsilon * u / (2 * sensitivity) for u in utilities]
        max_utility = max(scaled_utilities)
        
        # Numerically stable computation
        exp_utilities = [np.exp(u - max_utility) for u in scaled_utilities]
        total = sum(exp_utilities)
        probabilities = [eu / total for eu in exp_utilities]
        
        # Sample according to probabilities
        return np.random.choice(candidates, p=probabilities)
    
    def check_privacy_budget(self, user_id: str, dataset: str, epsilon: float) -> bool:
        """Check if user has sufficient privacy budget"""
        key = f"{user_id}:{dataset}"
        current_budget = self.privacy_budgets.get(key, 10.0)  # Default budget
        return current_budget >= epsilon
    
    def consume_privacy_budget(self, user_id: str, dataset: str, epsilon: float):
        """Consume privacy budget"""
        key = f"{user_id}:{dataset}"
        current_budget = self.privacy_budgets.get(key, 10.0)
        self.privacy_budgets[key] = current_budget - epsilon
    
    def private_count(self, data: List[Any], filters: Dict[str, Any], 
                     privacy_params: PrivacyParameters) -> PrivateResult:
        """Private count query with differential privacy"""
        # Apply filters
        filtered_data = self._apply_filters(data, filters)
        true_count = len(filtered_data)
        
        # Add noise based on mechanism
        if privacy_params.mechanism == 'laplace':
            noisy_count = self.add_laplace_noise(
                true_count, privacy_params.sensitivity, privacy_params.epsilon
            )
        elif privacy_params.mechanism == 'gaussian':
            noisy_count = self.add_gaussian_noise(
                true_count, privacy_params.sensitivity, 
                privacy_params.epsilon, privacy_params.delta
            )
        else:
            raise ValueError(f"Unknown mechanism: {privacy_params.mechanism}")
        
        # Ensure non-negative count
        noisy_count = max(0, round(noisy_count))
        noise_added = abs(noisy_count - true_count)
        
        # Calculate confidence interval (simplified)
        margin = 2 * privacy_params.sensitivity / privacy_params.epsilon
        confidence_interval = (max(0, noisy_count - margin), noisy_count + margin)
        
        return PrivateResult(
            query_id=f"count_{int(time.time())}",
            result=noisy_count,
            noise_added=noise_added,
            privacy_cost=privacy_params.epsilon,
            confidence_interval=confidence_interval,
            timestamp=datetime.now().isoformat(),
            metadata={'mechanism': privacy_params.mechanism, 'true_count': true_count}
        )
    
    def private_histogram(self, data: List[float], bins: int, 
                         privacy_params: PrivacyParameters) -> PrivateResult:
        """Private histogram with differential privacy"""
        # Create histogram
        hist, bin_edges = np.histogram(data, bins=bins)
        
        # Add noise to each bin
        noisy_hist = []
        for count in hist:
            if privacy_params.mechanism == 'laplace':
                noisy_count = self.add_laplace_noise(
                    count, privacy_params.sensitivity, privacy_params.epsilon / bins
                )
            else:
                noisy_count = self.add_gaussian_noise(
                    count, privacy_params.sensitivity,
                    privacy_params.epsilon / bins, privacy_params.delta / bins
                )
            noisy_hist.append(max(0, round(noisy_count)))
        
        total_noise = sum(abs(noisy_hist[i] - hist[i]) for i in range(len(hist)))
        
        return PrivateResult(
            query_id=f"histogram_{int(time.time())}",
            result={'counts': noisy_hist, 'bin_edges': bin_edges.tolist()},
            noise_added=total_noise,
            privacy_cost=privacy_params.epsilon,
            confidence_interval=(0, 0),  # Complex to compute for histograms
            timestamp=datetime.now().isoformat(),
            metadata={'bins': bins, 'mechanism': privacy_params.mechanism}
        )
    
    def private_mean(self, data: List[float], data_range: Tuple[float, float],
                    privacy_params: PrivacyParameters) -> PrivateResult:
        """Private mean computation"""
        if not data:
            return PrivateResult(
                query_id=f"mean_{int(time.time())}",
                result=0.0,
                noise_added=0.0,
                privacy_cost=0.0,
                confidence_interval=(0.0, 0.0),
                timestamp=datetime.now().isoformat(),
                metadata={'error': 'No data'}
            )
        
        # Clamp data to range
        min_val, max_val = data_range
        clamped_data = [max(min_val, min(max_val, x)) for x in data]
        
        # Calculate sensitivity for mean
        sensitivity = (max_val - min_val) / len(clamped_data)
        
        true_mean = np.mean(clamped_data)
        
        # Add noise
        if privacy_params.mechanism == 'laplace':
            noisy_mean = self.add_laplace_noise(
                true_mean, sensitivity, privacy_params.epsilon
            )
        else:
            noisy_mean = self.add_gaussian_noise(
                true_mean, sensitivity, privacy_params.epsilon, privacy_params.delta
            )
        
        noise_added = abs(noisy_mean - true_mean)
        
        # Confidence interval
        margin = 2 * sensitivity / privacy_params.epsilon
        confidence_interval = (noisy_mean - margin, noisy_mean + margin)
        
        return PrivateResult(
            query_id=f"mean_{int(time.time())}",
            result=noisy_mean,
            noise_added=noise_added,
            privacy_cost=privacy_params.epsilon,
            confidence_interval=confidence_interval,
            timestamp=datetime.now().isoformat(),
            metadata={'data_range': data_range, 'true_mean': true_mean}
        )
    
    def _apply_filters(self, data: List[Any], filters: Dict[str, Any]) -> List[Any]:
        """Apply filters to data (simplified implementation)"""
        if not filters:
            return data
        
        # For demonstration, assume data is list of dictionaries
        filtered = data[:]
        
        for key, value in filters.items():
            if isinstance(value, dict):
                # Range filter
                if 'min' in value and 'max' in value:
                    filtered = [item for item in filtered 
                               if isinstance(item, dict) and 
                               value['min'] <= item.get(key, 0) <= value['max']]
            else:
                # Equality filter
                filtered = [item for item in filtered 
                           if isinstance(item, dict) and item.get(key) == value]
        
        return filtered

class HomomorphicEncryption:
    """Simple homomorphic encryption implementation (educational purposes)"""
    
    def __init__(self, key_size: int = 1024):
        self.key_size = key_size
        self.public_key = None
        self.private_key = None
        self._generate_keys()
    
    def _generate_keys(self):
        """Generate RSA key pair for homomorphic operations"""
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=self.key_size,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def encrypt(self, plaintext: int) -> bytes:
        """Encrypt integer (simplified)"""
        # Convert to bytes
        plaintext_bytes = plaintext.to_bytes(8, byteorder='big', signed=True)
        
        # Encrypt using RSA
        ciphertext = self.public_key.encrypt(
            plaintext_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return ciphertext
    
    def decrypt(self, ciphertext: bytes) -> int:
        """Decrypt to integer"""
        plaintext_bytes = self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return int.from_bytes(plaintext_bytes, byteorder='big', signed=True)
    
    def homomorphic_add(self, ciphertext1: bytes, ciphertext2: bytes) -> bytes:
        """Homomorphic addition (simplified - not secure)"""
        # This is a simplified demonstration
        # Real homomorphic encryption requires specialized libraries like SEAL or PALISADE
        
        # Decrypt, add, re-encrypt (insecure but demonstrates concept)
        val1 = self.decrypt(ciphertext1)
        val2 = self.decrypt(ciphertext2)
        result = val1 + val2
        return self.encrypt(result)
    
    def homomorphic_multiply_scalar(self, ciphertext: bytes, scalar: int) -> bytes:
        """Homomorphic scalar multiplication"""
        val = self.decrypt(ciphertext)
        result = val * scalar
        return self.encrypt(result)

class SecureMultiPartyComputation:
    """Secure Multi-Party Computation protocols"""
    
    def __init__(self, party_id: str):
        self.party_id = party_id
        self.secret_shares = {}
        self.computation_history = []
    
    def secret_share(self, secret: int, num_parties: int, threshold: int) -> List[Tuple[int, int]]:
        """Shamir's Secret Sharing"""
        if threshold > num_parties:
            raise ValueError("Threshold cannot exceed number of parties")
        
        # Generate polynomial coefficients
        coefficients = [secret] + [secrets.randbelow(2**31) for _ in range(threshold - 1)]
        
        # Generate shares
        shares = []
        for i in range(1, num_parties + 1):
            share_value = sum(coeff * (i ** j) for j, coeff in enumerate(coefficients)) % (2**31 - 1)
            shares.append((i, share_value))
        
        return shares
    
    def reconstruct_secret(self, shares: List[Tuple[int, int]]) -> int:
        """Reconstruct secret from shares using Lagrange interpolation"""
        if not shares:
            raise ValueError("No shares provided")
        
        # Lagrange interpolation
        result = 0
        for i, (x_i, y_i) in enumerate(shares):
            # Calculate Lagrange basis polynomial
            basis = 1
            for j, (x_j, _) in enumerate(shares):
                if i != j:
                    basis *= (0 - x_j) * pow(x_i - x_j, -1, 2**31 - 1)
                    basis %= (2**31 - 1)
            
            result += y_i * basis
            result %= (2**31 - 1)
        
        return result
    
    def secure_sum(self, local_value: int, other_shares: List[Tuple[str, int]]) -> int:
        """Secure sum computation across multiple parties"""
        # In real implementation, this would involve network communication
        # For demonstration, we simulate the protocol
        
        total = local_value
        for party_id, share in other_shares:
            total += share
        
        return total
    
    def secure_dot_product(self, local_vector: List[int], 
                          other_vectors: List[Tuple[str, List[int]]]) -> int:
        """Secure dot product computation"""
        if not other_vectors:
            return sum(x * x for x in local_vector)
        
        # Simplified implementation
        result = 0
        for i, local_val in enumerate(local_vector):
            product_sum = local_val * local_val  # Self contribution
            
            for party_id, vector in other_vectors:
                if i < len(vector):
                    product_sum += local_val * vector[i]
            
            result += product_sum
        
        return result

class FederatedAnalytics:
    """Federated analytics with privacy preservation"""
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.local_data = []
        self.model_updates = []
        self.global_model = None
        
    def compute_local_statistics(self, data: List[Dict[str, Any]], 
                                privacy_params: PrivacyParameters) -> Dict[str, Any]:
        """Compute local statistics with differential privacy"""
        if not data:
            return {}
        
        dp_engine = DifferentialPrivacyEngine()
        
        # Count statistics
        count_result = dp_engine.private_count(data, {}, privacy_params)
        
        # Extract numerical columns for mean computation
        numerical_columns = {}
        for item in data:
            for key, value in item.items():
                if isinstance(value, (int, float)):
                    if key not in numerical_columns:
                        numerical_columns[key] = []
                    numerical_columns[key].append(value)
        
        # Compute private means for numerical columns
        means = {}
        for column, values in numerical_columns.items():
            if values:
                data_range = (min(values), max(values))
                mean_result = dp_engine.private_mean(values, data_range, privacy_params)
                means[column] = mean_result.result
        
        return {
            'node_id': self.node_id,
            'count': count_result.result,
            'means': means,
            'privacy_cost': privacy_params.epsilon,
            'timestamp': datetime.now().isoformat()
        }
    
    def aggregate_federated_statistics(self, local_stats: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate statistics from multiple nodes"""
        if not local_stats:
            return {}
        
        # Aggregate counts
        total_count = sum(stats.get('count', 0) for stats in local_stats)
        
        # Weighted average for means
        aggregated_means = {}
        for stats in local_stats:
            node_count = stats.get('count', 0)
            node_means = stats.get('means', {})
            
            for column, mean_value in node_means.items():
                if column not in aggregated_means:
                    aggregated_means[column] = {'sum': 0, 'weight': 0}
                
                aggregated_means[column]['sum'] += mean_value * node_count
                aggregated_means[column]['weight'] += node_count
        
        # Calculate final means
        final_means = {}
        for column, data in aggregated_means.items():
            if data['weight'] > 0:
                final_means[column] = data['sum'] / data['weight']
        
        return {
            'aggregated_count': total_count,
            'aggregated_means': final_means,
            'contributing_nodes': len(local_stats),
            'timestamp': datetime.now().isoformat()
        }

class PrivacyPreservingQueryEngine:
    """Main engine for privacy-preserving analytics"""
    
    def __init__(self, db_path: str = './data/privacy_analytics.db'):
        self.db_path = db_path
        self.dp_engine = DifferentialPrivacyEngine()
        self.he_engine = HomomorphicEncryption()
        self.smpc_engine = SecureMultiPartyComputation("shield_soc")
        self.federated_analytics = FederatedAnalytics("shield_node_1")
        
        # Query approval system
        self.pending_queries = {}
        self.approved_queries = {}
        
        # Initialize database
        self._init_database()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('PrivacyPreservingAnalytics')
    
    def _init_database(self):
        """Initialize privacy analytics database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Analytics queries table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS analytics_queries (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query_id TEXT UNIQUE NOT NULL,
                        query_type TEXT NOT NULL,
                        data_source TEXT,
                        filters TEXT,
                        privacy_params TEXT,
                        user_id TEXT,
                        approved BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Query results table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS query_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        query_id TEXT NOT NULL,
                        result TEXT,
                        noise_added REAL,
                        privacy_cost REAL,
                        confidence_interval TEXT,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Privacy budgets table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS privacy_budgets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        dataset TEXT NOT NULL,
                        total_budget REAL DEFAULT 10.0,
                        consumed_budget REAL DEFAULT 0.0,
                        last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, dataset)
                    )
                ''')
                
                conn.commit()
                self.logger.info("Privacy analytics database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def submit_query(self, query: AnalyticsQuery) -> str:
        """Submit analytics query for approval"""
        try:
            # Check privacy budget
            if not self.dp_engine.check_privacy_budget(
                query.user_id, query.data_source, query.privacy_params.epsilon
            ):
                raise ValueError("Insufficient privacy budget")
            
            # Store query
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO analytics_queries (
                        query_id, query_type, data_source, filters, 
                        privacy_params, user_id, approved
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    query.query_id,
                    query.query_type,
                    query.data_source,
                    json.dumps(query.filters),
                    json.dumps(asdict(query.privacy_params)),
                    query.user_id,
                    query.approved
                ))
                
                conn.commit()
            
            # Add to pending if not pre-approved
            if not query.approved:
                self.pending_queries[query.query_id] = query
            else:
                self.approved_queries[query.query_id] = query
            
            self.logger.info(f"Query {query.query_id} submitted by {query.user_id}")
            return query.query_id
            
        except Exception as e:
            self.logger.error(f"Error submitting query: {e}")
            raise
    
    def approve_query(self, query_id: str, approver_id: str) -> bool:
        """Approve pending query"""
        try:
            if query_id not in self.pending_queries:
                return False
            
            query = self.pending_queries[query_id]
            query.approved = True
            
            # Update database
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE analytics_queries SET approved = TRUE WHERE query_id = ?',
                    (query_id,)
                )
                conn.commit()
            
            # Move to approved
            self.approved_queries[query_id] = query
            del self.pending_queries[query_id]
            
            self.logger.info(f"Query {query_id} approved by {approver_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error approving query: {e}")
            return False
    
    def execute_query(self, query_id: str, data_source: List[Dict[str, Any]]) -> Optional[PrivateResult]:
        """Execute approved analytics query"""
        try:
            if query_id not in self.approved_queries:
                raise ValueError("Query not approved or not found")
            
            query = self.approved_queries[query_id]
            
            # Check privacy budget again
            if not self.dp_engine.check_privacy_budget(
                query.user_id, query.data_source, query.privacy_params.epsilon
            ):
                raise ValueError("Insufficient privacy budget at execution time")
            
            # Execute based on query type
            result = None
            
            if query.query_type == 'count':
                result = self.dp_engine.private_count(data_source, query.filters, query.privacy_params)
            
            elif query.query_type == 'mean':
                # Extract numerical values based on filters
                filtered_data = self.dp_engine._apply_filters(data_source, query.filters)
                if filtered_data and 'column' in query.filters:
                    column = query.filters['column']
                    values = [item[column] for item in filtered_data if column in item and isinstance(item[column], (int, float))]
                    if values:
                        data_range = (min(values), max(values))
                        result = self.dp_engine.private_mean(values, data_range, query.privacy_params)
            
            elif query.query_type == 'histogram':
                if 'column' in query.filters and 'bins' in query.filters:
                    column = query.filters['column']
                    bins = query.filters['bins']
                    values = [item[column] for item in data_source if column in item and isinstance(item[column], (int, float))]
                    if values:
                        result = self.dp_engine.private_histogram(values, bins, query.privacy_params)
            
            if result:
                # Consume privacy budget
                self.dp_engine.consume_privacy_budget(
                    query.user_id, query.data_source, query.privacy_params.epsilon
                )
                
                # Store result
                self._store_result(result)
                
                self.logger.info(f"Query {query_id} executed successfully")
                return result
            else:
                raise ValueError("Query execution failed")
                
        except Exception as e:
            self.logger.error(f"Error executing query {query_id}: {e}")
            raise
    
    def _store_result(self, result: PrivateResult):
        """Store query result in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO query_results (
                        query_id, result, noise_added, privacy_cost,
                        confidence_interval, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    result.query_id,
                    json.dumps(result.result),
                    result.noise_added,
                    result.privacy_cost,
                    json.dumps(result.confidence_interval),
                    json.dumps(result.metadata)
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing result: {e}")
    
    def get_privacy_budget_status(self, user_id: str) -> Dict[str, float]:
        """Get privacy budget status for user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT dataset, total_budget, consumed_budget 
                    FROM privacy_budgets 
                    WHERE user_id = ?
                ''', (user_id,))
                
                results = cursor.fetchall()
                
                budget_status = {}
                for dataset, total, consumed in results:
                    budget_status[dataset] = {
                        'total': total,
                        'consumed': consumed,
                        'remaining': total - consumed
                    }
                
                return budget_status
                
        except Exception as e:
            self.logger.error(f"Error getting budget status: {e}")
            return {}
    
    def demonstrate_homomorphic_computation(self, values: List[int]) -> Dict[str, Any]:
        """Demonstrate homomorphic encryption capabilities"""
        try:
            # Encrypt values
            encrypted_values = [self.he_engine.encrypt(v) for v in values]
            
            # Perform homomorphic operations
            if len(encrypted_values) >= 2:
                # Homomorphic addition
                encrypted_sum = encrypted_values[0]
                for enc_val in encrypted_values[1:]:
                    encrypted_sum = self.he_engine.homomorphic_add(encrypted_sum, enc_val)
                
                # Decrypt result
                decrypted_sum = self.he_engine.decrypt(encrypted_sum)
                
                # Scalar multiplication example
                encrypted_double = self.he_engine.homomorphic_multiply_scalar(encrypted_values[0], 2)
                decrypted_double = self.he_engine.decrypt(encrypted_double)
                
                return {
                    'original_sum': sum(values),
                    'homomorphic_sum': decrypted_sum,
                    'first_value_doubled': decrypted_double,
                    'verification': sum(values) == decrypted_sum
                }
            
            return {'error': 'Need at least 2 values for demonstration'}
            
        except Exception as e:
            self.logger.error(f"Error in homomorphic demonstration: {e}")
            return {'error': str(e)}
    
    def demonstrate_secure_multiparty(self, secret_value: int, num_parties: int = 3, threshold: int = 2) -> Dict[str, Any]:
        """Demonstrate secure multi-party computation"""
        try:
            # Create secret shares
            shares = self.smpc_engine.secret_share(secret_value, num_parties, threshold)
            
            # Simulate reconstruction with threshold shares
            reconstruction_shares = shares[:threshold]
            reconstructed_secret = self.smpc_engine.reconstruct_secret(reconstruction_shares)
            
            # Simulate secure sum with multiple parties
            party_values = [secret_value, secret_value + 10, secret_value + 20]
            secure_sum_result = self.smpc_engine.secure_sum(
                party_values[0], 
                [('party2', party_values[1]), ('party3', party_values[2])]
            )
            
            return {
                'original_secret': secret_value,
                'reconstructed_secret': reconstructed_secret,
                'shares_created': len(shares),
                'shares_used_for_reconstruction': len(reconstruction_shares),
                'verification': secret_value == reconstructed_secret,
                'secure_sum_result': secure_sum_result,
                'expected_sum': sum(party_values)
            }
            
        except Exception as e:
            self.logger.error(f"Error in SMPC demonstration: {e}")
            return {'error': str(e)}
    
    def get_analytics_dashboard_data(self) -> Dict[str, Any]:
        """Get privacy analytics dashboard data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get query statistics
                cursor.execute('''
                    SELECT query_type, COUNT(*), AVG(CASE WHEN approved THEN 1.0 ELSE 0.0 END)
                    FROM analytics_queries
                    WHERE created_at > datetime('now', '-24 hours')
                    GROUP BY query_type
                ''')
                query_stats = cursor.fetchall()
                
                # Get privacy budget usage
                cursor.execute('''
                    SELECT user_id, SUM(consumed_budget), COUNT(*)
                    FROM privacy_budgets
                    GROUP BY user_id
                ''')
                budget_usage = cursor.fetchall()
                
                # Get recent results
                cursor.execute('''
                    SELECT query_id, privacy_cost, noise_added
                    FROM query_results
                    ORDER BY created_at DESC
                    LIMIT 10
                ''')
                recent_results = cursor.fetchall()
                
                return {
                    'query_statistics': [
                        {
                            'type': row[0],
                            'count': row[1],
                            'approval_rate': row[2]
                        } for row in query_stats
                    ],
                    'budget_usage': [
                        {
                            'user_id': row[0],
                            'consumed': row[1],
                            'queries': row[2]
                        } for row in budget_usage
                    ],
                    'recent_results': [
                        {
                            'query_id': row[0],
                            'privacy_cost': row[1],
                            'noise_added': row[2]
                        } for row in recent_results
                    ],
                    'pending_queries': len(self.pending_queries),
                    'approved_queries': len(self.approved_queries),
                    'total_privacy_budget_consumed': sum(
                        sum(budget.values()) for budget in self.dp_engine.privacy_budgets.values()
                    ) if self.dp_engine.privacy_budgets else 0,
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}

def main():
    """Main function for testing privacy-preserving analytics"""
    engine = PrivacyPreservingQueryEngine()
    
    # Generate sample data
    sample_data = []
    for i in range(1000):
        sample_data.append({
            'user_id': f"user_{i % 100}",
            'threat_score': np.random.normal(50, 20),
            'attack_type': np.random.choice(['ddos', 'malware', 'phishing', 'brute_force']),
            'severity': np.random.choice(['low', 'medium', 'high', 'critical']),
            'timestamp': (datetime.now() - timedelta(hours=np.random.randint(0, 24))).isoformat()
        })
    
    print("Privacy-Preserving Analytics Engine Demo")
    print("=" * 50)
    
    # Demo 1: Differential Privacy Count Query
    print("\n1. Differential Privacy Count Query")
    privacy_params = PrivacyParameters(
        epsilon=1.0,
        delta=1e-5,
        sensitivity=1.0,
        mechanism='laplace'
    )
    
    count_query = AnalyticsQuery(
        query_id="demo_count_1",
        query_type="count",
        data_source="threat_logs",
        filters={"attack_type": "ddos"},
        privacy_params=privacy_params,
        timestamp=datetime.now().isoformat(),
        user_id="demo_user",
        approved=True
    )
    
    engine.submit_query(count_query)
    count_result = engine.execute_query("demo_count_1", sample_data)
    if count_result:
        print(f"Noisy Count: {count_result.result}")
        print(f"Noise Added: {count_result.noise_added}")
        print(f"Privacy Cost: {count_result.privacy_cost}")
    
    # Demo 2: Homomorphic Encryption
    print("\n2. Homomorphic Encryption Demo")
    values = [10, 20, 30, 40, 50]
    he_result = engine.demonstrate_homomorphic_computation(values)
    print(f"Homomorphic Computation Result: {he_result}")
    
    # Demo 3: Secure Multi-Party Computation
    print("\n3. Secure Multi-Party Computation Demo")
    smpc_result = engine.demonstrate_secure_multiparty(42)
    print(f"SMPC Result: {smpc_result}")
    
    # Demo 4: Dashboard Data
    print("\n4. Privacy Analytics Dashboard")
    dashboard_data = engine.get_analytics_dashboard_data()
    print(f"Dashboard Data: {json.dumps(dashboard_data, indent=2)}")

if __name__ == "__main__":
    main()