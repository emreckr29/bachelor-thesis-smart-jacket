# Bachelor Thesis – Smart Jacket for Physiotherapy

This repository contains the full implementation of my bachelor thesis project,
which focuses on developing a wearable system for physiotherapy exercise evaluation.

## Project Overview

The goal of this project is to design and implement a **smart jacket equipped with multiple IMU sensors**
to monitor and evaluate physiotherapy exercises.

Orientation data collected from the sensors is processed using **machine learning models**
to determine whether exercises are performed correctly.
The system provides structured feedback to physiotherapists through a web-based application.

## System Architecture

The project is composed of four main components:

- **Data Analysis and Modeling**
  - Data preprocessing and feature extraction from IMU quaternion data
  - Training and evaluation of multiple machine learning models

- **ML API**
  - Deployment-ready machine learning models
  - Provides inference services for exercise evaluation

- **Backend**
  - Central application logic
  - Handles communication between frontend and ML API

- **Frontend**
  - Web-based user interface for physiotherapists
  - Visualization of exercise feedback and results

## Technologies

- IMU sensors (quaternion-based orientation data)
- Python (data analysis, machine learning, ML API)
- Angular (frontend)
- Spring Boot (backend)

## Notes

- The trained models included in this repository are intentionally versioned
  as they are directly used in the deployed system.
- The dataset is not patient-specific and does not contain sensitive personal data.
- The project structure reflects a clear separation between **research**, **deployment**, and **application layers**.
