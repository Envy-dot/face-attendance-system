# Face Attendance System

A high-precision biometric attendance application powered by **ArcFace (InsightFace)** and **MediaPipe**. This system features a React-based client for image capture and a robust Node.js backend for secure facial recognition and attendance tracking.

## Technologies Used

-   **Frontend**: React (Vite) - Serves as a capture interface.
-   **Backend**: Node.js, Express, `onnxruntime-node`.
-   **Biometrics**:
    -   **Detection**: Google MediaPipe (Face Detection & Landmarks).
    -   **Recognition**: ArcFace (ResNet50 ONNX) - 99.8% accuracy on LFW (Labeled Faces in the Wild).
    -   **Processing**: Sharp (High-performance image manipulation).
-   **Database**: SQLite (via `better-sqlite3`).

## Facial Recognition Pipeline

The system processes biometrics securely on the server:
1.  **Capture**: Client captures a high-quality image via webcam.
2.  **Detection**: Server uses **MediaPipe** (or BlazeFace) to locate the face and 6 facial landmarks.
3.  **Alignment**: Face is cropped and aligned to a standard 112x112 pixel grid.
4.  **Embedding**: **ArcFace** generates a 512-dimensional vector embedding.
5.  **Matching**: Server computes Cosine Similarity against the registered user database (Threshold: 0.45).

## Installation and Setup

### 1. Server (Backend)

The backend handles all recognition logic.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Download Models**:
    Run the setup script to download the required ONNX and TFLite models to `server/models/`.
    ```bash
    node setup_models.js
    ```
4.  Start the server:
    ```bash
    npm start
    ```
    *Server runs on port 3000 by default.*

### 2. Client (Frontend)

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development interface:
    ```bash
    npm run dev
    ```

## System Capacity & Privacy

-   **Database**: The `attendance.db` is a local SQLite file.
-   **Privacy**: 
    -   Actual images are **NOT** stored by default (configurable).
    -   Only mathematical face descriptors (512-float arrays) are saved.
-   **Capacity**: 
    -   Server-side matching is highly efficient.
    -   Supports 1,000+ users with negligible latency on standard CPU hardware.
    -   No GPU required (uses ONNX Runtime CPU provider).

## Troubleshooting

-   **"ClassIds" error**: Ensure your server is running the latest code with the JSON parsing middleware.
-   **Models missing**: Run `node setup_models.js` in the `server` folder.
-   **Recognition Fails**: Ensure good lighting. The system enforces strict matching (0.45 threshold) to prevent false positives.
