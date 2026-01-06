# Data Analysis and Modeling

This directory contains the **research and development phase** of the bachelor thesis project.

The main purpose of this folder is to explore the raw sensor data, perform
feature extraction, test different machine learning approaches, and evaluate
model performance before selecting the final models used in the system.

## Contents

- Jupyter notebooks (`.ipynb`) for:
  - Data exploration and visualization
  - Feature extraction from quaternion-based IMU data
  - Model training and comparison (LSTM, Random Forest, etc.)
- Python scripts for:
  - Data preprocessing
  - Normalization and synchronization between multiple sensors
  - Dataset preparation and transformation
- Experimental models and intermediate results

## Workflow

1. Raw IMU data collected from multiple participants is processed.
2. Quaternion-based features are extracted and normalized.
3. Multiple machine learning models are trained and evaluated.
4. The best-performing models are selected based on accuracy and robustness.

## Notes

- This folder represents the **experimental and exploratory** part of the project.
- Not all models here are used in the final system.
- The selected final models are transferred to the `ml-api` directory for deployment.

This separation reflects a clear distinction between **research** and **production** phases.
