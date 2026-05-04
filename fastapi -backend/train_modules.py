import streamlit as st
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
import joblib
from helper_modules import plot_roc_curve_multi_class, plot_precision_recall_curve, enhanced_classification_report
from lstm_module import LSTMModel, train_lstm
from helper_modules import plot_confusion_matrix

def train_models(X_train, y_train, X_val, y_val, class_names, feature_names):
    """Train and evaluate multiple models"""
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'K-Nearest Neighbors': KNeighborsClassifier()
    }

    results = {}
    trained_models = {}

    for name, model in models.items():
        st.subheader(f"Training {name}...")
        
        with st.spinner(f"Training {name}..."):
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred = model.predict(X_val)
            y_proba = model.predict_proba(X_val)
            
            # Enhanced evaluation
            report = enhanced_classification_report(y_val, y_pred, y_proba, class_names)
            
            # Save results and model
            results[name] = report
            trained_models[name] = model
            
            # Display metrics
            st.write(f"**{name} Performance:**")
            st.write(f"Accuracy: {report['Overall']['Accuracy']:.4f}")
            st.write(f"Macro F1: {report['Overall']['Macro F1']:.4f}")
            
            # Visualizations
            col1, col2 = st.columns(2)
            
            with col1:
                fig_cm, _ = plot_confusion_matrix(y_val, y_pred, class_names, f"{name} - Confusion Matrix", 'inferno')
                st.pyplot(fig_cm)
            
            with col2:
                fig_roc, _ = plot_roc_curve_multi_class(y_val, y_proba, class_names, f"{name} - ROC Curve")
                st.pyplot(fig_roc)
            
            fig_pr, _ = plot_precision_recall_curve(y_val, y_proba, class_names, f"{name} - Precision-Recall Curve")
            st.pyplot(fig_pr)
            
        # Save model
        model_filename = f"{name.lower().replace(' ', '_')}_model.pkl"
        joblib.dump(model, model_filename)
        st.success(f"{name} model saved as '{model_filename}'")
    
    return results, trained_models

def train_lstm_model(X_train, y_train, X_val, y_val, input_size, num_classes, class_names):
    """Train LSTM model"""
    st.subheader("Training PyTorch LSTM Model...")
    
    # Prepare data for LSTM (reshape to 3D: [samples, timesteps, features])
    X_train_lstm = X_train.reshape(X_train.shape[0], 1, X_train.shape[1])
    X_val_lstm = X_val.reshape(X_val.shape[0], 1, X_val.shape[1])

    # Convert to PyTorch tensors
    X_train_tensor = torch.FloatTensor(X_train_lstm)
    y_train_tensor = torch.LongTensor(y_train.values)
    X_val_tensor = torch.FloatTensor(X_val_lstm)
    y_val_tensor = torch.LongTensor(y_val.values)

    # Create DataLoaders
    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    val_dataset = TensorDataset(X_val_tensor, y_val_tensor)

    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)

    # Initialize model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    st.write(f"Using device: {device}")

    lstm_model = LSTMModel(input_size=input_size, 
                          hidden_size=64, 
                          num_layers=2, 
                          num_classes=num_classes,
                          dropout_rate=0.3).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(lstm_model.parameters(), lr=0.001)

    # Train model
    with st.spinner("Training LSTM model..."):
        train_losses, val_losses, val_accuracies = train_lstm(
            lstm_model, train_loader, val_loader, criterion, optimizer, 
            num_epochs=20, device=device
        )

    # Plot training history
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    ax1.plot(train_losses, label='Train Loss')
    ax1.plot(val_losses, label='Validation Loss')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training and Validation Loss')
    ax1.legend()

    ax2.plot(val_accuracies)
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.set_title('Validation Accuracy')
    plt.tight_layout()
    st.pyplot(fig)

    # Evaluate LSTM model
    lstm_model.eval()
    with torch.no_grad():
        X_val_tensor = X_val_tensor.to(device)
        lstm_outputs = lstm_model(X_val_tensor)
        lstm_probs = torch.softmax(lstm_outputs, dim=1).cpu().numpy()
        lstm_preds = torch.argmax(lstm_outputs, dim=1).cpu().numpy()

    # Enhanced evaluation for LSTM
    lstm_report = enhanced_classification_report(y_val, lstm_preds, lstm_probs, class_names)

    # Visualizations for LSTM
    col1, col2 = st.columns(2)
    
    with col1:
        fig_cm, _ = plot_confusion_matrix(y_val, lstm_preds, class_names, "LSTM - Confusion Matrix", 'inferno')
        st.pyplot(fig_cm)
    
    with col2:
        fig_roc, _ = plot_roc_curve_multi_class(y_val, lstm_probs, class_names, "LSTM - ROC Curve")
        st.pyplot(fig_roc)
    
    fig_pr, _ = plot_precision_recall_curve(y_val, lstm_probs, class_names, "LSTM - Precision-Recall Curve")
    st.pyplot(fig_pr)

    # Display LSTM metrics
    st.write("**LSTM Performance:**")
    st.write(f"Accuracy: {lstm_report['Overall']['Accuracy']:.4f}")
    st.write(f"Macro F1: {lstm_report['Overall']['Macro F1']:.4f}")

    # Save LSTM model
    torch.save({
        'model_state_dict': lstm_model.state_dict(),
        'input_size': input_size,
        'hidden_size': 64,
        'num_layers': 2,
        'num_classes': num_classes,
        'class_names': class_names
    }, 'lstm_model.pth')
    st.success("LSTM model saved as 'lstm_model.pth'")
    
    return lstm_report, lstm_model
