# Machine Learning API

This directory contains the **production-ready machine learning models**
and the API layer that serves them.

The models located here are the **final selected models**, trained and evaluated
during the experimentation phase in `dataAnalysisAndModeling`, and are actively
used by the backend and frontend applications.

## Contents

- Trained machine learning models:
  - `.pkl` files for classical ML models
  - `.h5` files for deep learning (LSTM) models
- Feature scalers and encoders
- `app.py`:
  - Loads the trained models
  - Exposes prediction endpoints via an API

## Purpose

- Provide real-time inference for physiotherapy exercises
- Act as the interface between sensor data and the web application
- Ensure consistent and reproducible predictions using fixed, trained models

## Design Choice

The models are intentionally stored here to:
- Enable easy deployment
- Keep the system reproducible
- Allow the web application to run without retraining models

This structure reflects a **real-world ML deployment pipeline**.
