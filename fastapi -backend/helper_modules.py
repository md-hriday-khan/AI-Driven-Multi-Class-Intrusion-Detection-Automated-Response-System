import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, label_binarize

from sklearn.metrics import (accuracy_score, roc_auc_score, 
                           confusion_matrix, roc_curve, auc, precision_recall_curve,
                           average_precision_score, f1_score, precision_score, recall_score)


def apply_normalization(X, method='standard'):
    """Apply normalization to data"""
    if method == 'standard':
        scaler = StandardScaler()
    elif method == 'minmax':
        scaler = MinMaxScaler()
    elif method == 'robust':
        scaler = RobustScaler()
    else:
        raise ValueError("Invalid normalization method. Choose 'standard', 'minmax', or 'robust'.")

    X_normalized = scaler.fit_transform(X)
    return X_normalized, scaler

def enhanced_classification_report(y_true, y_pred, y_probs, class_names):
    """Generate enhanced classification report with multiple metrics"""
    report = {}
    
    for i, class_name in enumerate(class_names):
        # Binary indicators for current class
        y_true_binary = (y_true == i).astype(int)
        y_pred_binary = (y_pred == i).astype(int)
        y_prob_binary = y_probs[:, i]
        
        # Calculate metrics
        precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
        recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
        f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
        roc_auc = roc_auc_score(y_true_binary, y_prob_binary)
        avg_precision = average_precision_score(y_true_binary, y_prob_binary)
        
        report[class_name] = {
            'Precision': precision,
            'Recall': recall,
            'F1-Score': f1,
            'ROC AUC': roc_auc,
            'Average Precision': avg_precision
        }
    
    # Overall metrics
    overall_accuracy = accuracy_score(y_true, y_pred)
    micro_f1 = f1_score(y_true, y_pred, average='micro', zero_division=0)
    macro_f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
    weighted_f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    
    report['Overall'] = {
        'Accuracy': overall_accuracy,
        'Micro F1': micro_f1,
        'Macro F1': macro_f1,
        'Weighted F1': weighted_f1
    }
    
    return report

def load_test_data_fast():
    """Fast loading of test data for real-time simulation"""
    try:
        # Load a smaller subset or preprocessed data
        df = pd.read_parquet('cicidscollection/cic-collection.parquet')
        df = df.drop(columns='Label', errors='ignore')
        
        # Filter to specific classes
        labels_to_keep = ['Benign', 'DDoS', 'Bruteforce', 'Botnet']
        df = df[df['ClassLabel'].isin(labels_to_keep)]
        
        # Select important features
        positive_correlation_features = [
            'Avg Packet Size', 'Packet Length Mean', 'Bwd Packet Length Std', 'Packet Length Variance',
            'Bwd Packet Length Max', 'Packet Length Max', 'Packet Length Std', 'Fwd Packet Length Mean',
            'Avg Fwd Segment Size', 'Flow Bytes/s', 'Avg Bwd Segment Size', 'Bwd Packet Length Mean',
            'Fwd Packets/s', 'Flow Packets/s', 'Init Fwd Win Bytes', 'Subflow Fwd Bytes',
            'Fwd Packets Length Total', 'Fwd Act Data Packets', 'Total Fwd Packets', 'Subflow Fwd Packets'
        ]
        df = df[positive_correlation_features + ['ClassLabel']]
        
        return df
        
    except Exception as e:
        print(f"Error loading test data: {e}")
        return None