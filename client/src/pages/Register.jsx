import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { UserCheck, Camera, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

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
                //load ssdMobilenetv1 for precision, and Landmark and Recognition for precision
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                startVideo();
            } catch (err) {
                console.error("Model load error:", err);
                setErrorMsg("Critical: Failed to initialize biometric models.");
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
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
                setErrorMsg("Hardware Error: Camera access was denied or not found.");
            });
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // Custom drawing for more premium feel with Safari compatibility
                    resizedDetections.forEach(detection => {
                        const { x, y, width, height } = detection.detection.box;
                        ctx.strokeStyle = 'var(--primary)';
                        ctx.lineWidth = 3;
                        if (ctx.roundRect) {
                            ctx.roundRect(x, y, width, height, 8);
                        } else {
                            // Fallback for older Safari
                            const r = 8;
                            ctx.beginPath();
                            ctx.moveTo(x + r, y);
                            ctx.arcTo(x + width, y, x + width, y + height, r);
                            ctx.arcTo(x + width, y + height, x, y + height, r);
                            ctx.arcTo(x, y + height, x, y, r);
                            ctx.arcTo(x, y, x + width, y, r);
                            ctx.closePath();
                        }
                        ctx.stroke();

                        // Corner decorations
                        ctx.fillStyle = 'var(--primary)';
                        ctx.fillRect(x - 2, y - 2, 15, 4);
                        ctx.fillRect(x - 2, y - 2, 4, 15);
                    });
                }

                setFaceDetected(detections.length > 0);
            }
        }, 150);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const capturePhoto = () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 480, 360);
        return canvas.toDataURL('image/jpeg', 0.85);
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.matric_no) return setErrorMsg("Missing Requirements: Name and Matric No are mandatory.");
        if (!faceDetected) return setErrorMsg("Vision Error: No face detected in frame.");

        setErrorMsg('');
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const photo = capturePhoto();
            setCapturedPhoto(photo);

            try {
                const data = await api.users.register({ ...formData, descriptor, photo });
                if (data.userId || data.success) {
                    setSuccessMsg(data.created ? `Profile Created: ${formData.name}` : `Biometric Profile Updated: ${formData.name}`);
                    setFormData({ name: '', matric_no: '', level: '', department: '', course: '' });
                    setTimeout(() => {
                        setSuccessMsg('');
                        setCapturedPhoto(null);
                    }, 4000);
                } else {
                    setErrorMsg(data.error || 'System Error: Enrollment process failed.');
                }
            } catch (err) {
                setErrorMsg('Network Error: Unable to reach administration server.');
            }
        }
    };

    return (
        <div className="page-container animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
                    Student Biometric Enrollment
                </h2>
                <div className="flex-center gap-2 text-secondary">
                    <Info size={16} />
                    <span>Provide student details and alignment for facial token creation.</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Left: Form */}
                <div className="card animate-up" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
                            <UserCheck size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Profile Information</h3>
                    </div>

                    {errorMsg && (
                        <div className="badge badge-danger animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '1rem', marginBottom: '1.5rem', borderRadius: '10px' }}>
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="badge badge-success animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '1rem', marginBottom: '1.5rem', borderRadius: '10px' }}>
                            <CheckCircle2 size={18} /> {successMsg}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Full Legal Name *</label>
                            <input name="name" placeholder="Enter student's full name" value={formData.name} onChange={handleChange} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Matriculation Number *</label>
                            <input name="matric_no" placeholder="REG-2026-XXXX" value={formData.matric_no} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Level</label>
                                <input name="level" placeholder="100" value={formData.level} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                                <input name="department" placeholder="e.g. Science" value={formData.department} onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Course Concentration</label>
                            <input name="course" placeholder="B.Sc. Human Resource Management" value={formData.course} onChange={handleChange} />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '2.5rem', width: '100%', padding: '1rem', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
                        onClick={handleRegister}
                        disabled={!faceDetected || !formData.name || !formData.matric_no}
                    >
                        <Camera size={20} /> {faceDetected ? 'Generate Biometric Token' : 'Detecting Student Face...'}
                    </button>
                    {!faceDetected && <p className="text-secondary" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>Camera focus required for enrollment.</p>}

                    <div className="card" style={{ marginTop: '2rem', padding: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ color: '#d97706', marginTop: '2px' }}>
                            <Info size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pro Tip: Complex Identification</div>
                            <div style={{ fontSize: '0.85rem', color: '#b45309', lineHeight: '1.4' }}>
                                For students with <b>glasses, hijabs, or frequent headwear</b>, enroll twice: once with the accessory and once without for maximum recognition reliability.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Camera Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="video-wrapper" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
                        {initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 20 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="text-primary" style={{ marginBottom: '1rem', transform: 'scale(2)' }}>● ● ●</div>
                                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Calibrating Sensor...</div>
                                </div>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                    </div>

                    {capturedPhoto ? (
                        <div className="card animate-fade" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--success-bg)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <img src={capturedPhoto} alt="Captured" style={{ width: 70, height: 70, borderRadius: '12px', objectFit: 'cover', border: '2px solid white' }} />
                            <div>
                                <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1rem' }}>Snapshot Captured</div>
                                <div style={{ color: '#047857', fontSize: '0.85rem' }}>Facial map generated successfully.</div>
                            </div>
                        </div>
                    ) : faceDetected && (
                        <div className="card animate-fade" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--primary-light)', borderColor: 'rgba(37, 99, 235, 0.1)' }}>
                            <div className="text-primary"><UserCheck size={20} /></div>
                            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>Optimal Focus Achieved</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Register;
