import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Clock, Activity, CloudOff } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { api } from '../api';

function Attendance() {
    const [initializing, setInitializing] = useState(true);
    const [logs, setLogs] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [session, setSession] = useState(null);
    const [recentIdentified, setRecentIdentified] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    const videoRef = useRef();
    const canvasRef = useRef();
    const streamRef = useRef();
    const matcherRef = useRef(null);
    const usersMapRef = useRef({});
    const usersRef = useRef([]); // Critical: store users for access in handleVideoPlay
    const lastLogRef = useRef({});

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            })
            .catch(() => setErrorMsg("Camera access was denied by system policy."));
    };

    useEffect(() => {
        const setup = async () => {
            const MODEL_URL = '/models';
            try {
                const [activeSession, users] = await Promise.all([
                    api.sessions.getActive(),
                    api.users.getAll(),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                setSession(activeSession);

                if (users.length > 0) {
                    usersRef.current = users;
                    const labeledDescriptors = users.map(user => {
                        usersMapRef.current[user.name] = user.id;

                        // Parse descriptors: could be single [num] or cumulative [[num],[num]]
                        const ds = Array.isArray(user.descriptor[0]) ? user.descriptor : [user.descriptor];
                        const floatDescriptors = ds.map(d => new Float32Array(d));

                        return new faceapi.LabeledFaceDescriptors(user.name, floatDescriptors);
                    });
                    // Threshold set to 0.40 to reduce misidentification (lower is stricter)
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.40);
                }

                startVideo();
            } catch (err) {
                console.error("Setup error:", err);
                setErrorMsg("Hardware/Model Initialization Error.");
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
        const interval = setInterval(async () => {
            try {
                const data = await api.sessions.getActive();
                setSession(data);
            } catch { }
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (session) {
            if (session.duration > 0) {
                const start = new Date(session.start_time).getTime();
                const end = start + session.duration * 60000;

                const timer = setInterval(() => {
                    const now = new Date().getTime();
                    const diff = end - now;
                    if (diff <= 0) {
                        setTimeLeft(0);
                        setIsExpired(true);
                        clearInterval(timer);
                    } else {
                        setTimeLeft(diff);
                    }
                }, 1000);
                return () => clearInterval(timer);
            } else {
                setTimeLeft(null);
                setIsExpired(false);
            }
        }
    }, [session]);

    const handleAttendance = async (name, detectionBox) => {
        if (!session) return;

        const now = Date.now();
        if (lastLogRef.current[name] && (now - lastLogRef.current[name] < 60000)) return;

        const userId = usersMapRef.current[name];
        if (userId) {
            lastLogRef.current[name] = now;

            let imageBase64 = null;
            if (videoRef.current && detectionBox) {
                const logCanvas = document.createElement('canvas');
                logCanvas.width = 300;
                logCanvas.height = 300;

                // Crop to face
                const { x, y, width, height } = detectionBox;
                logCanvas.getContext('2d').drawImage(
                    videoRef.current,
                    x - 20, y - 40, width + 40, height + 60,
                    0, 0, 300, 300
                );
                imageBase64 = logCanvas.toDataURL('image/jpeg', 0.8);
            }

            try {
                const res = await api.attendance.log(userId, imageBase64, 'in'); // Enforce 'in' type
                if (res.success) {
                    setLogs(prev => [{ name, time: new Date().toLocaleTimeString(), type: 'in' }, ...prev].slice(0, 10));
                } else {
                    setLogs(prev => [{ name, time: res.error || 'Server Error', type: 'error' }, ...prev].slice(0, 10));
                }
            } catch {
                setErrorMsg('Network Error: Unable to reach administration server.');
            }
        }
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        setInterval(async () => {
            if (videoRef.current && canvasRef.current && matcherRef.current && session) {
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (usersRef.current.length > 0 && !matcherRef.current) {
                    // Re-initialize matcher if missing using the ref
                    const labeledDescriptors = usersRef.current.map(user => {
                        const ds = Array.isArray(user.descriptor[0]) ? user.descriptor : [user.descriptor];
                        return new faceapi.LabeledFaceDescriptors(user.name, ds.map(d => new Float32Array(d)));
                    });
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.40);
                }

                const results = resizedDetections.map(d => matcherRef.current.findBestMatch(d.descriptor));

                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const isMatched = result.label !== 'unknown';
                    const { x, y, width, height } = box;

                    // Neon Pulse Calculation (0.7 to 1.0 opacity)
                    const pulse = isMatched ? 1 : (Math.sin(Date.now() / 150) * 0.15 + 0.85);
                    const mainColor = isMatched ? '#10b981' : '#3b82f6'; // Success Green or Cyber Blue

                    ctx.save();
                    ctx.strokeStyle = mainColor;
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = pulse;

                    // 1. High-Tech Corner Brackets
                    const len = Math.min(width, height) * 0.2;
                    ctx.beginPath();
                    // Top Left
                    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
                    // Top Right
                    ctx.moveTo(x + width - len, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + len);
                    // Bottom Right
                    ctx.moveTo(x + width, y + height - len); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - len, y + height);
                    // Bottom Left
                    ctx.moveTo(x + len, y + height); ctx.lineTo(x, y + height); ctx.lineTo(x, y + height - len);
                    ctx.stroke();

                    // 2. Subtle Outer Glow
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = mainColor;
                    ctx.globalAlpha = pulse * 0.4;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, width, height);

                    // 3. Label Design
                    ctx.restore();
                    ctx.fillStyle = mainColor;
                    ctx.font = '700 14px Inter';
                    const text = isMatched ? result.label : 'SCANNING_BIO...';
                    const textWidth = ctx.measureText(text).width;

                    ctx.fillRect(x, y - 30, textWidth + 16, 25);
                    ctx.fillStyle = 'white';
                    ctx.fillText(text, x + 8, y - 13);

                    // Match Found!
                    if (isMatched && !isExpired) {
                        handleAttendance(result.label, box);
                    }
                });
            } else if (!session && videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.font = "700 24px Inter";
                ctx.fillStyle = "#ef4444";
                ctx.textAlign = "center";
                ctx.fillText("Sensors Idle: No Active Session", canvasRef.current.width / 2, canvasRef.current.height / 2);
            }
        }, 150);
    };

    return (
        <div className="page-container animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
                    Identity Verification
                </h2>
                {session ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div className="badge badge-success animate-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                            Live Session: {session.name}
                        </div>

                        {timeLeft !== null && (
                            <div style={{
                                background: isExpired ? 'var(--danger-bg)' : 'var(--primary-light)',
                                color: isExpired ? 'var(--danger)' : 'var(--primary)',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '1.25rem',
                                border: `1px solid ${isExpired ? '#fca5a5' : '#bfdbfe'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Clock size={20} />
                                {isExpired ? "TIME EXPIRED" : (
                                    <span>
                                        Closing in: {Math.floor(timeLeft / 60000)}:
                                        {Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="badge badge-danger animate-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 700 }}>
                        <CloudOff size={18} /> System Offline: Waiting for command
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="badge badge-danger animate-fade" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto 2rem auto', maxWidth: '500px', padding: '1rem', borderRadius: '12px' }}>
                    <AlertCircle size={20} /> {errorMsg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ flex: '1', minWidth: '400px', maxWidth: '850px' }}>
                    <div className="video-wrapper" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
                        {initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 20 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="text-primary" style={{ marginBottom: '1rem', transform: 'scale(2)' }}>● ● ●</div>
                                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Syncing Biometric Grid...</div>
                                </div>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} width="640" height="480" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                    </div>
                    {session && (
                        <div className="animate-fade" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            <Activity size={18} className="text-primary" />
                            Processing live biometric streams...
                        </div>
                    )}
                </div>

                <div className="card" style={{ width: '380px', display: 'flex', flexDirection: 'column', height: '532px', padding: '0', background: 'white' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} className="text-primary" />
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 700 }}>Real-time Feed</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                        {logs.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
                                <div style={{ marginBottom: '1.5rem', opacity: 0.2 }}><Camera size={64} style={{ margin: '0 auto' }} /></div>
                                <p style={{ fontWeight: 500 }}>Ready for verification.</p>
                                <p style={{ fontSize: '0.85rem' }}>Detected faces will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {logs.map((log, i) => (
                                    <div key={i} className="animate-up" style={{
                                        padding: '1rem 1.25rem',
                                        background: log.type === 'error' ? 'var(--danger-bg)' : 'var(--bg-main)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{log.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{log.time}</div>
                                        </div>
                                        <div>
                                            {log.type === 'error' ?
                                                <AlertCircle className="text-danger" size={20} /> :
                                                <div style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>VERIFIED</div>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Audit Log: Last 10 Scans
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Attendance;

