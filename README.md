# FaceAttend

A biometric attendance tracking application that leverages facial recognition technology to securely log user attendance. This system consists of a React-based frontend for capturing facial data and an Express backend for managing attendance records and user profiles.

## Technologies Used

-   **Frontend**: React (Vite), face-api.js for browser-based facial recognition.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite (via `better-sqlite3`).

## Facial Recognition Models

This project utilizes specific pre-trained models from the `face-api.js` library, located in `client/public/models`. These models are essential for the biometric verification process:

*   **`tiny_face_detector` (TinyYOLOv2)**: A highly optimized, real-time face detection model based on the **TinyYOLOv2** architecture. It is designed to be lightweight and fast, making it ideal for mobile and web clients where resource usage is a concern.
*   **`face_landmark_68` (68-Point CNN)**: A lightweight Convolutional Neural Network (CNN) that detects 68 specific points on a face (jawline, eyebrows, nose, etc.). These landmarks are critical for face alignment, ensuring the face is properly oriented before recognition.
*   **`face_recognition_model` (ResNet-34)**: A deep learning model based on the **ResNet-34** architecture. It computes a unique 128-dimensional descriptor (embedding) for each face. This robust architecture ensures high accuracy in distinguishing individuals, even with slight variations in lighting or pose.

## How it works

The system captures facial images and uses the pre-trained models to extract and identify unique facial features. Instead of storing photos, it converts the face into a mathematical descriptor (a list of numbers representing facial features) and saves only that descriptor in the attendance.db SQLite database. This approach is great for privacy, but it means you cannot view the photos of registered users later.

## Installation and Setup

### Client (Frontend)

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Server (Backend)

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server:
    ```bash
    node index.js
    ```
    *Alternatively, you can use `npx nodemon` for development auto-restarts.*

-   `/server`: Backend API and database logic.

## Useful Links

-   **Library**: [face-api.js on GitHub](https://github.com/justadudewhohacks/face-api.js)
-   **Models**: [face-api.js weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
-   **Documentation**: [face-api.js Documentation](https://justadudewhohacks.github.io/face-api.js/docs/index.html)

## System Capacity & Privacy

-   **Database**: The `attendance.db` is a local SQLite file. Use a tool like [DB Browser for SQLite](https://sqlitebrowser.org/) or the [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) VS Code extension to view it.
-   **Capacity**: The system determines capacity by how many users the **browser** can cross-reference in real-time.
    -   *Efficient*: 1 - 500 users.
    -   *Strain*: 500 - 2,000 users (may increase initial load time).
    -   *Limit*: > 2,000 users may cause significant lag on client devices as every face descriptor is downloaded and matched locally.
-   **Images**: Actual images are **NOT** stored. Only mathematical face descriptors are saved to the database to ensure privacy.
