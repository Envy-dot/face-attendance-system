import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

function Attendance() {
    const [initializing, setInitializing] = useState(true);
    const [logs, setLogs] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [session, setSession] = useState(null);

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();
    const matcherRef = useRef(null);
    const usersMapRef = useRef({});
    const lastLogRef = useRef({});

    useEffect(() => {
        const setup = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    fetchActiveSession()
                ]);

                const usersRes = await fetch('/api/users');
                const users = await usersRes.json();

                if (users.length > 0) {
                    const labeledDescriptors = users.map(user => {
                        usersMapRef.current[user.name] = user.id;
                        return new faceapi.LabeledFaceDescriptors(
                            user.name,
                            [new Float32Array(user.descriptor)]
                        );
                    });
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
                }

                startVideo();
            } catch (err) {
                console.error("Setup error:", err);
                setErrorMsg("Failed to load system resources.");
            }
        };
        setup();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchActiveSession, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveSession = async () => {
        try {
            const res = await fetch('/api/sessions/active');
            const data = await res.json();
            setSession(data);
        } catch (err) {
            console.error("Failed to fetch session", err);
        }
    };

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            })
            .catch(err => setErrorMsg("Camera access denied."));
    };

    const logAttendance = async (name, detectionBox) => {
        if (!session) return;

        const now = Date.now();
        if (lastLogRef.current[name] && (now - lastLogRef.current[name] < 60000)) return;

        const userId = usersMapRef.current[name];
        if (userId) {
            lastLogRef.current[name] = now;

            let imageBase64 = null;
            if (videoRef.current && detectionBox) {
                const logCanvas = document.createElement('canvas');
                logCanvas.width = 320;
                logCanvas.height = 240;
                logCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
                imageBase64 = logCanvas.toDataURL('image/jpeg', 0.5);
            }

            try {
                const currentMode = session.type || 'in';
                const res = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, type: currentMode, image: imageBase64 })
                });

                if (res.ok) {
                    setLogs(prev => [{ name, time: new Date().toLocaleTimeString(), type: currentMode }, ...prev].slice(0, 10));
                } else if (res.status === 409) {
                    setLogs(prev => [{ name, time: 'Already logged', type: 'error' }, ...prev].slice(0, 10));
                } else if (res.status === 403) {
                    setLogs(prev => [{ name, time: 'Session inactive', type: 'error' }, ...prev].slice(0, 10));
                }
            } catch (err) {
                console.error("Log error", err);
            }
        }
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current && matcherRef.current && session) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                const results = resizedDetections.map(d => matcherRef.current.findBestMatch(d.descriptor));

                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                    drawBox.draw(canvasRef.current);

                    if (result.label !== 'unknown') {
                        logAttendance(result.label, box);
                    }
                });
            } else if (!session && videoRef.current) {
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.font = "30px Arial";
                    ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
                    ctx.textAlign = "center";
                    ctx.fillText("No Active Session", canvasRef.current.width / 2, canvasRef.current.height / 2);
                }
            }
        }, 100);
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(90deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Attendance Scanner
                </h2>
                {session ? (
                    <div className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1.5rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)', border: '1px solid #22c55e' }}>
                        Active: {session.name} <span style={{ opacity: 0.8 }}>({session.type === 'in' ? 'Check In' : 'Check Out'})</span>
                    </div>
                ) : (
                    <div className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
                        ● Waiting for Session...
                    </div>
                )}
            </div>

            {errorMsg && <div className="badge badge-danger" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1400px' }}>
                {/* Main Video Area */}
                <div style={{ flex: '1', minWidth: '350px', maxWidth: '800px' }}>
                    <div className="video-wrapper">
                        {initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 20 }}>
                                <div style={{ color: '#fff', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Initializing Neural Networks...</div>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                    </div>
                    {session && (
                        <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Point your face at the camera to mark attendance automatically.
                        </div>
                    )}
                </div>

                {/* Right Panel: Logs */}
                <div className="glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column', height: '500px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Recent Activity</h3>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {logs.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontStyle: 'italic' }}>
                                No scans yet...
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {logs.map((log, i) => (
                                    <li key={i} style={{
                                        padding: '0.8rem',
                                        marginBottom: '0.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: log.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{log.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.time}</div>
                                        </div>
                                        <div>
                                            {log.type === 'error' ?
                                                <span style={{ color: '#f87171' }}>⚠</span> :
                                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✔</span>
                                            }
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Attendance;
