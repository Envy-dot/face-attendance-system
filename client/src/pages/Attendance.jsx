import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, Clock, Activity, CloudOff, CheckCircle, UserX, RefreshCw } from 'lucide-react';
import { api } from '../api';
import * as faceapi from 'face-api.js';

function Attendance() {
    const [initializing, setInitializing] = useState(true);
    const [initMsg, setInitMsg] = useState("Initializing Biometric Sensors...");
    const [logs, setLogs] = useState([]);
    const [session, setSession] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, VERIFYING, COOLDOWN, EXPIRED
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '', name: '' }

    const videoRef = useRef();
    const canvasRef = useRef(); // Bounding Box Overlay
    const detectionFrameRef = useRef(null);
    const cooldownRef = useRef(false);
    const [guidance, setGuidance] = useState(null);

    // Bounding Box state removed, using Canvas Ref instead

    // Refs for Loop Access (Fix Stale Closures)
    const stateRef = useRef({
        status: 'IDLE',
        session: null,
        guidance: null
    });

    // Sync Refs
    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.session = session;
        stateRef.current.guidance = guidance;
    }, [status, session, guidance]);

    // Initial Setup
    useEffect(() => {
        const setup = async () => {
            try {
                // 1. Get Active Session
                const activeSession = await api.sessions.getActive();
                setSession(activeSession);

                // 2. Load Vision Model
                setInitMsg("Loading AI models... Please wait.");
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setInitMsg("Initializing Camera...");

                startVideo();
            } catch (err) {
                console.error("Setup error", err);
                setInitMsg("Failed to load models: " + err.message);
            }
        };
        setup();
        return () => {
            if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
        };
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        setInitializing(false);
                        setStatus('SCANNING');
                        detectLoop();
                    };
                }
            })
            .catch(() => {
                console.error("Camera denied");
                setInitMsg("Camera access denied.");
            });
    };

    // Session Timer & Logs Logic
    useEffect(() => {
        if (session) {
            const fetchLogs = async () => {
                try {
                    const sessionLogs = await api.attendance.getLogs('', session.id);
                    setLogs(sessionLogs.map(log => ({ name: log.name, time: new Date(log.timestamp).toLocaleTimeString(), type: log.type })).slice(0, 10));
                } catch (error) {
                    console.error("Failed to fetch logs", error);
                }
            };
            fetchLogs();

            const duration = parseInt(session.duration, 10) || 0;
            const startTime = new Date(session.start_time).getTime();
            if (isNaN(startTime) || duration <= 0) {
                setTimeLeft(null); return;
            }
            const end = startTime + duration * 60000;
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const diff = end - now;
                if (diff <= 0) {
                    setTimeLeft(0);
                    setStatus('EXPIRED');
                    if (videoRef.current && videoRef.current.srcObject) {
                        const tracks = videoRef.current.srcObject.getTracks();
                        tracks.forEach(t => t.stop());
                    }
                    clearInterval(timer);
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setLogs([]);
        }
    }, [session]);

    const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || stateRef.current.status === 'EXPIRED') {
            if (stateRef.current.status !== 'EXPIRED') {
                detectionFrameRef.current = requestAnimationFrame(detectLoop);
            }
            return;
        }

        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        const displaySize = { width: 640, height: 480 };

        if (stateRef.current.status !== 'VERIFYING') {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, 640, 480);

                if (detection) {
                    const resizedDetections = faceapi.resizeResults(detection, displaySize);
                    const box = resizedDetections.detection.box;
                    const score = resizedDetections.detection.score;
                    const isConfident = score > 0.75;

                    ctx.strokeStyle = isConfident ? '#10b981' : '#f59e0b';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);

                    ctx.fillStyle = isConfident ? '#10b981' : '#f59e0b';
                    ctx.font = '16px sans-serif';
                    ctx.fillText(`${Math.round(score * 100)}%`, box.x, box.y > 20 ? box.y - 5 : 20);

                    // Auto-Verify Logic
                    const currentStatus = stateRef.current.status;
                    const currentSession = stateRef.current.session;

                    if (currentStatus === 'SCANNING' && !cooldownRef.current && currentSession) {
                        const isBigEnough = box.width > 110;
                        let newGuidance = null;

                        if (!isConfident) {
                            newGuidance = "Hold Still";
                        } else if (!isBigEnough) {
                            newGuidance = "Move Closer";
                        }

                        if (newGuidance !== stateRef.current.guidance) {
                            setGuidance(newGuidance);
                        }

                        if (isConfident && isBigEnough) {
                            triggerVerification(detection.descriptor);
                        }
                    }
                } else {
                    const currentStatus = stateRef.current.status;
                    if (currentStatus === 'SCANNING') {
                        if (stateRef.current.guidance !== "Look at Camera") setGuidance("Look at Camera");
                    } else {
                        if (stateRef.current.guidance !== null) setGuidance(null);
                    }
                }
            }
        }

        detectionFrameRef.current = requestAnimationFrame(detectLoop);
    };

    const triggerVerification = async (descriptorVal) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;
        setStatus('VERIFYING');

        // Keep detection marking visible instead of clearing it
        // so the user knows their face was captured


        // Size for transfer (smaller = faster)
        const targetWidth = 320;
        const targetHeight = 240;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Draw resized version
        ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');

            // Send descriptor to the backend for comparison
            formData.append('faceLandmarks', JSON.stringify(Array.from(descriptorVal)));

            try {
                const res = await api.attendance.log(formData);
                if (res.success) {
                    const name = res.user ? res.user.name : "Verified";
                    if (res.duplicate) {
                        setFeedback({ type: 'success', name, text: "Already Marked" });
                    } else {
                        setFeedback({ type: 'success', name, text: "Attendance Marked" });
                        setLogs(prev => [{ name, time: new Date().toLocaleTimeString(), type: 'in' }, ...prev].slice(0, 10));
                    }
                } else {
                    setFeedback({ type: 'error', name: 'Unknown', text: res.error || "Face not recognized" });
                }
            } catch {
                setFeedback({ type: 'error', text: "Network Error" });
            } finally {
                setTimeout(() => {
                    setFeedback(null);
                    setStatus('SCANNING');
                    cooldownRef.current = false;
                }, 2000);
            }
        }, 'image/jpeg', 0.8);
    };

    return (
        <div className="page-container animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Identity Verification</h2>
                {session && (
                    <div className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        {session.name} {timeLeft !== null && `(${Math.floor(timeLeft / 60000)}m left)`}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>

                {/* Camera Feed */}
                <div style={{ position: 'relative', width: '640px', maxWidth: '100%' }}>
                    <div className="video-wrapper" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
                        {initializing && <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>{initMsg}</div>}

                        {!initializing && !session && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                                <AlertCircle size={48} className="text-warning" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>No Active Session</h3>
                                <p style={{ opacity: 0.8 }}>Your lecturer has not started a session.</p>
                            </div>
                        )}

                        {status === 'EXPIRED' && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                                <Clock size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Session Expired</h3>
                                <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>Time is up! No further attendance can be marked.</p>
                            </div>
                        )}

                        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block' }}></video>
                        <canvas ref={canvasRef} width="640" height="480" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }} />

                        {/* Guidance Overlay */}
                        {guidance && status === 'SCANNING' && (
                            <div style={{ position: 'absolute', bottom: '15%', left: '0', right: '0', textAlign: 'center', zIndex: 6 }}>
                                <span style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', color: 'var(--text-main)', padding: '0.6rem 1.5rem', borderRadius: '30px', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)' }}>
                                    {guidance}
                                </span>
                            </div>
                        )}

                        {status === 'VERIFYING' && (
                            <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800, padding: '0.5rem 1.2rem', borderRadius: '30px', boxShadow: '0 4px 15px rgba(37,99,235,0.2)', zIndex: 10 }}>
                                <Activity className="spin" size={20} style={{ marginRight: '8px' }} /> Verifying...
                            </div>
                        )}

                        {/* New Glassmorphism Toast Feedback Overlay replacing the old alerts */}
                        {feedback && (
                            <div className="animate-up" style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', background: feedback.type === 'success' ? 'rgba(220, 252, 231, 0.90)' : 'rgba(254, 226, 226, 0.90)', backdropFilter: 'blur(12px)', border: `1px solid ${feedback.type === 'success' ? 'rgba(22, 101, 52, 0.2)' : 'rgba(153, 27, 27, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '15px', color: feedback.type === 'success' ? '#166534' : '#991b1b', padding: '1.2rem 2.5rem', borderRadius: '50px', boxShadow: `0 10px 30px ${feedback.type === 'success' ? 'rgba(22, 101, 52, 0.2)' : 'rgba(153, 27, 27, 0.2)'}`, zIndex: 20 }}>
                                {feedback.type === 'success' ? <CheckCircle size={28} /> : <UserX size={28} />}
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{feedback.name || 'Notice'}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{feedback.text}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                        {!session ? "System Idle" : (status === 'SCANNING' ? "Looking for faces..." : "Processing...")}
                    </div>
                </div>

                {/* Logs */}
                <div className="card" style={{ width: '350px', height: '520px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>Recent Scans</div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {logs.map((log, i) => (
                            <div key={i} className="animate-up" style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>{log.name}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.time}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No recent scans</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Attendance;
