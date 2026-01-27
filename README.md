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

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

-   **Node.js (LTS Version)**: The system requires Node.js and npm (Node Package Manager).
    -   Download from: [nodejs.org](https://nodejs.org/)
-   **Browser**: A modern web browser (Chrome, Firefox, or Edge) with webcam access enabled.

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
### Windows Setup

If you encounter native module errors on Windows (e.g., `better-sqlite3` compilation issues):

1. **Change Powershell permissions (IF THERE IS AN ERROR RUNNING SCRIPTS)**:
    run 
    ```bash
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned on powershell
    ```

2. **Ensure Node.js and npm are installed**:
   ```bash
   node --version
   npm --version
   ```

3. **Clear and reinstall dependencies**:
   ```bash
   # In the server directory
   cd server
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

4. **Start the server**:
   ```bash
   node index.js
   ```
   *Server runs on port 3001 by default.*

5. **In a new terminal, start the client**:
   ```bash
   cd client
   npm install  
   npm run dev
   ```



**Note**: If you see "npm is not recognized", restart your terminal or ensure Node.js is in your system PATH.

## Troubleshooting

-   **"ClassIds" error**: Ensure your server is running the latest code with the JSON parsing middleware.
-   **Models missing**: Run `node setup_models.js` in the `server` folder.
-   **Recognition Fails**: Ensure good lighting. The system enforces strict matching (0.45 threshold) to prevent false positives.
-   **Native module errors on Windows**: Follow the Windows Setup section above to rebuild dependencies.

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

-   **"npm is not recognized" (Windows)**:
    -   **Cause**: Node.js is not installed, or its path is not added to the system's environment variables.
    -   **Solution**: 
        1.  Download and install Node.js from [nodejs.org](https://nodejs.org/). 
        2.  Make sure to check "Add to PATH" during installation.
        3.  **Restart your terminal** (PowerShell or Command Prompt) after installation.
-   **"install npm" error**:
    -   The command is `npm install`, not `install npm`. `npm` is the tool, and `install` is the action.
-   **"ClassIds" error**: Ensure your server is running the latest code with the JSON parsing middleware.
-   **Models missing**: Run `node setup_models.js` in the `server` folder.
-   **Recognition Fails**: Ensure good lighting. The system enforces strict matching (0.45 threshold) to prevent false positives.


