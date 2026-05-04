# streaming_module.py
import pandas as pd
import numpy as np
import torch
import time
import streamlit as st
from helper_modules import plot_confusion_matrix

def stream_data(X_test, y_test, models, scaler, label_encoder, class_names, selected_model, num_samples, sample_speed):
    """Simulate streaming data and perform real-time analysis for a selected model"""
    st.header("Real-time Streaming Analysis")

    # Create a placeholder for the streaming results
    results_placeholder = st.empty()
    progress_bar = st.progress(0)
    status_text = st.empty()

    # Initialize counters for metrics
    total_predictions = 0
    correct_predictions = 0
    class_correct = {i: 0 for i in range(len(class_names))}
    class_total = {i: 0 for i in range(len(class_names))}

    # Create a dataframe to store results
    results_df = pd.DataFrame(columns=['True_Label', 'Predicted_Label', 'Model', 'Confidence'])

    # Stream data points one by one
    for i in range(min(num_samples, len(X_test))):
        X_point = X_test[i].reshape(1, -1)
        y_true = y_test.iloc[i] if hasattr(y_test, 'iloc') else y_test[i]

        model = models[selected_model]
        if selected_model == 'LSTM':
            X_point_reshaped = X_point.reshape(1, 1, X_point.shape[1])
            X_point_tensor = torch.FloatTensor(X_point_reshaped).to(
                torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            )
            model.eval()
            with torch.no_grad():
                output = model(X_point_tensor)
                probabilities = torch.softmax(output, dim=1).cpu().numpy()
                prediction = np.argmax(probabilities, axis=1)[0]
                confidence = probabilities[0][prediction]
        else:
            probabilities = model.predict_proba(X_point)
            prediction = np.argmax(probabilities, axis=1)[0]
            confidence = probabilities[0][prediction]

        # Update metrics
        total_predictions += 1
        if prediction == y_true:
            correct_predictions += 1
            class_correct[y_true] += 1
        class_total[y_true] += 1

        # Store results
        results_df = pd.concat([results_df, pd.DataFrame({
            'True_Label': [class_names[y_true]],
            'Predicted_Label': [class_names[prediction]],
            'Model': [selected_model],
            'Confidence': [confidence],
            'Correct': [prediction == y_true]
        })], ignore_index=True)

        # Update progress
        progress = (i + 1) / min(num_samples, len(X_test))
        progress_bar.progress(progress)
        status_text.text(f"Processing sample {i+1}/{min(num_samples, len(X_test))}")

        # Update results display every 10 samples
        if i % 10 == 0:
            with results_placeholder.container():
                st.subheader("Real-time Performance Metrics")
                accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
                class_accuracy = {}
                for cls in class_names:
                    idx = list(class_names).index(cls)
                    class_accuracy[cls] = class_correct[idx] / class_total[idx] if class_total[idx] > 0 else 0
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Overall Accuracy", f"{accuracy:.4f}")
                    st.metric("Total Predictions", total_predictions)
                with col2:
                    st.write("**Class-wise Accuracy:**")
                    for cls, acc in class_accuracy.items():
                        st.write(f"{cls}: {acc:.4f}")
                st.write("**Recent Predictions:**")
                st.dataframe(results_df.tail(10))

        time.sleep(sample_speed)

    progress_bar.empty()
    status_text.empty()

    st.subheader("Final Streaming Results")
    accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Final Overall Accuracy", f"{accuracy:.4f}")
        st.metric("Total Predictions", total_predictions)
    with col2:
        st.write("**Final Class-wise Accuracy:**")
        for cls in class_names:
            idx = list(class_names).index(cls)
            acc = class_correct[idx] / class_total[idx] if class_total[idx] > 0 else 0
            st.write(f"{cls}: {acc:.4f}")

    # Show confusion matrix for the selected model
    best_model = models[selected_model]
    y_pred_all = best_model.predict(X_test[:num_samples])
    y_true_all = y_test[:num_samples] if hasattr(y_test, 'iloc') else y_test[:num_samples]
    fig_cm, _ = plot_confusion_matrix(y_true_all, y_pred_all, class_names, f"Final Confusion Matrix ({selected_model})", 'inferno')
    st.pyplot(fig_cm)
    return results_df