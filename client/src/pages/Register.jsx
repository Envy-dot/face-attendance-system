import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        matric_no: '',
        level: '',
        department: '',
        course: ''
    });
    const [initializing, setInitializing] = useState(true);
    const [faceDetected, setFaceDetected] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                startVideo();
            } catch (err) {
                console.error("Model load error:", err);
                setErrorMsg("Failed to load face models.");
            }
        };
        loadModels();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            })
            .catch(err => {
                console.error("Camera error:", err);
                setErrorMsg("Camera access denied.");
            });
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);

                setFaceDetected(detections.length > 0);
            }
        }, 100);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const capturePhoto = () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.matric_no) return setErrorMsg("Name and Matric No are required.");
        if (!faceDetected) return setErrorMsg("No face detected.");

        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const photo = capturePhoto();
            setCapturedPhoto(photo);

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, descriptor, photo })
                });
                const data = await response.json();
                if (data.success) {
                    setSuccessMsg(`User ${formData.name} registered successfully!`);
                    setFormData({ name: '', matric_no: '', level: '', department: '', course: '' });
                    setCapturedPhoto(null);

                    // Clear success msg after 3s
                    setTimeout(() => setSuccessMsg(''), 5000);
                } else {
                    setErrorMsg(data.error || 'Registration failed.');
                }
            } catch (err) {
                setErrorMsg('Network error.');
            }
        }
    };

    return (
        <div className="page-container">
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem 0', background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                New Registration
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', width: '100%' }}>

                {/* Left: Form */}
                <div className="glass-panel">
                    <h3 style={{ marginTop: 0 }}>Student Details</h3>
                    {errorMsg && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem' }}>{errorMsg}</div>}
                    {successMsg && <div className="badge badge-success" style={{ display: 'block', marginBottom: '1rem' }}>{successMsg}</div>}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label className="text-secondary text-sm">Full Name *</label>
                            <input name="name" placeholder="Unknown Student" value={formData.name} onChange={handleChange} style={{ marginTop: '0.4rem' }} />
                        </div>
                        <div>
                            <label className="text-secondary text-sm">Matric No *</label>
                            <input name="matric_no" placeholder="e.g. 21/0987" value={formData.matric_no} onChange={handleChange} style={{ marginTop: '0.4rem' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-secondary text-sm">Level</label>
                                <input name="level" placeholder="100" value={formData.level} onChange={handleChange} style={{ marginTop: '0.4rem' }} />
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Department</label>
                                <input name="department" placeholder="CSC" value={formData.department} onChange={handleChange} style={{ marginTop: '0.4rem' }} />
                            </div>
                        </div>
                        <div>
                            <label className="text-secondary text-sm">Course</label>
                            <input name="course" placeholder="Computer Science" value={formData.course} onChange={handleChange} style={{ marginTop: '0.4rem' }} />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '2rem', width: '100%', fontSize: '1rem', padding: '1rem' }}
                        onClick={handleRegister}
                        disabled={!faceDetected || !formData.name || !formData.matric_no}
                    >
                        {faceDetected ? (formData.name ? 'Capture & Register' : 'Enter Details') : 'Waiting for Face...'}
                    </button>
                    {!faceDetected && <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: '1rem' }}>Position face in camera to enable button</p>}
                </div>

                {/* Right: Video */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="video-wrapper">
                        {initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 20 }}>
                                <div style={{ color: '#fff', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Loading Camera...</div>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                    </div>

                    {capturedPhoto && (
                        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={capturedPhoto} style={{ width: 60, height: 60, borderRadius: '8px', border: '1px solid #fff', objectFit: 'cover' }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>Face Captured</div>
                                <div className="text-sm text-secondary">Ready for submission</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Register;
