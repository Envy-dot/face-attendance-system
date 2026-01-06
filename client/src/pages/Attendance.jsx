import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Activity, ShieldCheck, AlertCircle, CheckCircle2, CloudOff } from 'lucide-react';
import { api } from '../api';

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
                const [activeSession, users] = await Promise.all([
                    api.sessions.getActive(),
                    api.users.getAll(),
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                setSession(activeSession);

                if (users.length > 0) {
                    const labeledDescriptors = users.map(user => {
                        usersMapRef.current[user.name] = user.id;

                        // Parse descriptors: could be single [num] or cumulative [[num],[num]]
                        // Support both formats for safety
                        const descriptorsArray = Array.isArray(user.descriptor[0])
                            ? user.descriptor.map(d => new Float32Array(Object.values(d)))
                            : [new Float32Array(Object.values(user.descriptor))];

                        return new faceapi.LabeledFaceDescriptors(user.name, descriptorsArray);
                    });
                    // Threshold set to 0.45 to support variations like glasses/hats
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
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
            } catch (e) { }
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            })
            .catch(err => setErrorMsg("Camera access was denied by system policy."));
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
                const res = await api.attendance.log(userId, imageBase64);
                if (res.success) {
                    setLogs(prev => [{ name, time: new Date().toLocaleTimeString(), type: session.type }, ...prev].slice(0, 10));
                } else {
                    setLogs(prev => [{ name, time: res.error || 'Server Error', type: 'error' }, ...prev].slice(0, 10));
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

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (users.length > 0 && !matcherRef.current) {
                    // Re-initialize matcher if missing
                    const labeledDescriptors = users.map(user => {
                        const ds = Array.isArray(user.descriptor[0]) ? user.descriptor : [user.descriptor];
                        return new faceapi.LabeledFaceDescriptors(user.name, ds.map(d => new Float32Array(Object.values(d))));
                    });
                    matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
                }

                const results = resizedDetections.map(d => matcherRef.current.findBestMatch(d.descriptor));

                results.forEach((result, i) => {
                    const box = resizedDetections[i].detection.box;
                    const isMatched = result.label !== 'unknown';

                    // High-Tech custom drawing with Safari compatibility fallback
                    ctx.strokeStyle = isMatched ? 'var(--success)' : 'var(--primary)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(box.x, box.y, box.width, box.height, 10);
                    } else {
                        // Fallback for older Safari
                        const r = 10;
                        ctx.moveTo(box.x + r, box.y);
                        ctx.arcTo(box.x + box.width, box.y, box.x + box.width, box.y + box.height, r);
                        ctx.arcTo(box.x + box.width, box.y + box.height, box.x, box.y + box.height, r);
                        ctx.arcTo(box.x, box.y + box.height, box.x, box.y, r);
                        ctx.arcTo(box.x, box.y, box.x + box.width, box.y, r);
                        ctx.closePath();
                    }
                    ctx.stroke();

                    // Label Background
                    ctx.fillStyle = isMatched ? 'var(--success)' : 'var(--primary)';
                    ctx.font = '700 14px Inter';
                    const text = isMatched ? result.label : 'Scanning...';
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillRect(box.x, box.y - 25, textWidth + 16, 25);

                    // Label Text
                    ctx.fillStyle = 'white';
                    ctx.fillText(text, box.x + 8, box.y - 8);

                    if (isMatched) {
                        logAttendance(result.label, box);
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
                    Identity Verification Hub
                </h2>
                {session ? (
                    <div className="badge badge-success animate-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <ShieldCheck size={18} />
                        Live: <strong>{session.name}</strong> • Mode: <span style={{ textTransform: 'uppercase' }}>{session.type}</span>
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

