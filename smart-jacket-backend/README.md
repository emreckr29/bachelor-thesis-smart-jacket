# Smart Jacket Backend

This directory contains the **backend application** of the Smart Jacket system.

The backend acts as the central communication layer between:
- The frontend application
- The machine learning API
- External services (if applicable)

## Responsibilities

- Handle HTTP requests from the frontend
- Forward relevant data to the ML API
- Manage application logic and response formatting
- Serve as the system's integration layer

## Technologies Used

- Java
- Spring Boot
- Maven

## Structure

- `src/`:
  - Application source code
- `pom.xml`:
  - Project dependencies and build configuration

## Design Philosophy

The backend is intentionally kept modular to:
- Decouple frontend and machine learning logic
- Allow future scalability
- Reflect industry-standard layered architecture

This backend completes the **end-to-end pipeline**
from sensor data to user feedback.
