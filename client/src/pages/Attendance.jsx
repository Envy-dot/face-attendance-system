import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, Clock, Activity, CloudOff, CheckCircle, UserX, RefreshCw, ShieldCheck, Info } from 'lucide-react';
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
    const [cameraError, setCameraError] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const videoRef = useRef();
    const canvasRef = useRef(); 
    const detectionFrameRef = useRef(null);
    const cooldownRef = useRef(false);
    const localCooldownCache = useRef({}); // { matricNo: timestamp } for 5 min cache
    const [livenessStage, setLivenessStage] = useState('INIT'); // INIT, CHALLENGE, VERIFYING
    const [livenessChallenge, setLivenessChallenge] = useState(null); // 'BLINK'
    const [guidance, setGuidance] = useState(null);

    const earRef = useRef({ blinkFrames: 0, baselineEAR: 0, consecutiveFrames: 0 });

    const stateRef = useRef({
        status: 'IDLE',
        session: null,
        guidance: null,
        livenessStage: 'INIT',
        livenessChallenge: null,
        modelsLoaded: false
    });

    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.session = session;
        stateRef.current.guidance = guidance;
        stateRef.current.livenessStage = livenessStage;
        stateRef.current.livenessChallenge = livenessChallenge;
        stateRef.current.modelsLoaded = modelsLoaded;
    }, [status, session, guidance, livenessStage, livenessChallenge, modelsLoaded]);

    useEffect(() => {
        const setup = async () => {
            try {
                // Parallelize Session & Model Loading
                const [sessionData] = await Promise.all([
                    api.sessions.getActive().catch(e => {
                        console.error("Session fetch failed", e);
                        return null;
                    }),
                    (async () => {
                        setInitMsg("Loading AI models...");
                        await Promise.all([
                            faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                        ]);
                        setModelsLoaded(true);
                    })()
                ]);

                setSession(sessionData);
                setInitMsg("Initializing Camera...");
                startVideo();
            } catch (err) {
                console.error("Setup error", err);
                setInitMsg("Failed to initialize: " + err.message);
                setInitializing(false);
            }
        };
        setup();
        return () => {
            if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        setInitializing(false);
                        if (stateRef.current.session) {
                            setStatus('SCANNING');
                        }
                        detectLoop();
                    };
                }
            })
            .catch((err) => {
                console.error("Camera denied", err);
                setCameraError(true);
                setInitializing(false);
            });
    };

    useEffect(() => {
        if (session) {
            const fetchLogs = async () => {
                try {
                    const sessionLogs = await api.attendance.getLogs('', session.id);
                    setLogs(sessionLogs.map(log => ({ 
                        name: log.name, 
                        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
                        type: log.type 
                    })).slice(0, 8));
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
                    clearInterval(timer);
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [session]);

    const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || stateRef.current.status === 'EXPIRED') {
            if (stateRef.current.status !== 'EXPIRED') {
                detectionFrameRef.current = requestAnimationFrame(detectLoop);
            }
            return;
        }

        if (!stateRef.current.modelsLoaded) {
            detectionFrameRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            const displaySize = { width: 640, height: 480 };

            if (canvasRef.current && stateRef.current.status !== 'VERIFYING') {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, 640, 480);

                if (detection) {
                    const resized = faceapi.resizeResults(detection, displaySize);
                    const { box, score } = resized.detection;
                    const isConfident = score > 0.75;

                    ctx.strokeStyle = isConfident ? '#10b981' : '#f59e0b';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);

                    const currentStatus = stateRef.current.status;
                    const currentSession = stateRef.current.session;
                    const stage = stateRef.current.livenessStage;

                    if (currentStatus === 'SCANNING' && !cooldownRef.current && currentSession) {
                        const isBigEnough = box.width > 120;
                        let newGuidance = null;

                        if (!isConfident) {
                            newGuidance = "Hold Still & Look at Camera";
                            if (stage !== 'INIT') setLivenessStage('INIT');
                        } else if (!isBigEnough) {
                            newGuidance = "Move Closer to Camera";
                            if (stage !== 'INIT') setLivenessStage('INIT');
                        } else {
                            if (stage === 'INIT') {
                                setLivenessChallenge('BLINK');
                                setLivenessStage('CHALLENGE');
                                newGuidance = "Blink once to verify liveness...";
                            } else if (stage === 'CHALLENGE') {
                                if (verifyBlink(detection.landmarks)) {
                                    setLivenessStage('VERIFYING');
                                    newGuidance = "✅ Verified! Processing...";
                                    triggerVerification(detection.descriptor);
                                } else {
                                    newGuidance = "Blink once to verify liveness...";
                                }
                            }
                        }

                        if (newGuidance !== stateRef.current.guidance) {
                            setGuidance(newGuidance);
                        }
                    }
                } else {
                    if (stateRef.current.status === 'SCANNING') {
                        if (stateRef.current.guidance !== "Looking for face...") setGuidance("Looking for face...");
                        if (stateRef.current.livenessStage !== 'INIT') setLivenessStage('INIT');
                    }
                }
            }
        } catch (e) {
            console.error("Detection error", e);
        }

        detectionFrameRef.current = requestAnimationFrame(detectLoop);
    };

    const verifyBlink = (landmarks) => {
        const positions = landmarks.positions;
        const calculateEAR = (eye) => {
            const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
            return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2.0 * dist(eye[0], eye[3]));
        };

        const leftEAR = calculateEAR(positions.slice(36, 42));
        const rightEAR = calculateEAR(positions.slice(42, 48));
        const avgEAR = (leftEAR + rightEAR) / 2.0;

        if (avgEAR < 0.25) { 
            earRef.current.consecutiveFrames += 1;
        } else {
            if (earRef.current.consecutiveFrames >= 1) {
                earRef.current.blinkFrames += 1;
            }
            earRef.current.consecutiveFrames = 0;
        }
        return earRef.current.blinkFrames > 0;
    };

    const triggerVerification = async (descriptorVal) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;
        setStatus('VERIFYING');

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');
            formData.append('faceLandmarks', JSON.stringify(Array.from(descriptorVal)));
            formData.append('sessionId', session.id);

            try {
                const res = await api.attendance.log(formData);
                if (res.success) {
                    const name = res.user?.name || "Verified";
                    const matricNo = res.user?.matric_no || "VERIFIED";
                    
                    if (res.duplicate) {
                        setFeedback({ type: 'success', name, text: "Already Marked Present" });
                    } else {
                        setFeedback({ type: 'success', name, text: "Attendance Marked ✅" });
                        setLogs(prev => [{ name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'in' }, ...prev].slice(0, 8));
                    }
                } else {
                    setFeedback({ type: 'error', name: 'Denied', text: res.error || "Identity Mismatch" });
                }
            } catch (err) {
                setFeedback({ type: 'error', text: "Network Timeout" });
            } finally {
                setTimeout(() => {
                    setFeedback(null);
                    setLivenessStage('INIT');
                    setStatus('SCANNING');
                    cooldownRef.current = false;
                    earRef.current.blinkFrames = 0;
                }, 3000);
            }
        }, 'image/jpeg', 0.8);
    };

    const formatTime = (ms) => {
        if (!ms) return "00:00";
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen animate-fade flex flex-col items-center justify-center p-4 py-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Identity Verification</h2>
                {session && (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm animate-up">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-bold text-sm uppercase tracking-wider">{session.name}</span>
                        {timeLeft !== null && (
                            <span className="ml-2 font-mono bg-white px-2 py-0.5 rounded border border-emerald-100 text-xs shadow-inner">
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                
                {/* Scanner Section */}
                <div className="flex flex-col gap-4">
                    <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative shadow-2xl bg-slate-900 border-4 border-white/60 backdrop-blur-xl">
                        
                        {cameraError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-8 text-center z-30">
                                <CloudOff size={48} className="text-red-400 mb-4" />
                                <h3 className="text-2xl font-bold">Webcam Not Detected</h3>
                                <p className="text-slate-400 mt-2">Please ensure camera permissions are granted and the device is connected.</p>
                                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors">
                                    Try Reconnecting
                                </button>
                            </div>
                        ) : initializing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-20">
                                <RefreshCw className="animate-spin mb-4 text-primary" size={40} />
                                <div className="font-bold text-lg tracking-wide">{initMsg}</div>
                            </div>
                        ) : !session ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white p-8 text-center z-10">
                                <AlertCircle size={48} className="text-amber-400 mb-4" />
                                <h3 className="text-2xl font-bold">No Active Training</h3>
                                <p className="text-slate-400 mt-2">Attendance sessions must be initialized by a lecturer via the admin panel.</p>
                            </div>
                        ) : status === 'EXPIRED' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-8 text-center z-10">
                                <Clock size={48} className="text-red-400 mb-4" />
                                <h3 className="text-2xl font-bold">Session Finalized</h3>
                                <p className="text-slate-400 mt-2">The allowed time for this verification window has elapsed.</p>
                            </div>
                        ) : null}

                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className={`w-full h-full object-cover transition-opacity duration-500 ${initializing || cameraError ? 'opacity-0' : 'opacity-100'}`}
                        />
                        <canvas 
                            ref={canvasRef} 
                            width="640" 
                            height="480" 
                            className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                        />

                        {/* Guidance Toast */}
                        {guidance && status === 'SCANNING' && (
                            <div className="absolute bottom-10 left-0 right-0 px-6 z-20 flex justify-center">
                                <div className="bg-white/90 backdrop-blur-xl border border-white shadow-2xl text-slate-900 px-6 py-3 rounded-full font-extrabold text-sm md:text-base flex items-center gap-3 animate-up">
                                    {guidance.includes("Blink") && <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />}
                                    {guidance}
                                </div>
                            </div>
                        )}

                        {/* Verification Layer */}
                        {status === 'VERIFYING' && (
                            <div className="absolute top-6 right-6 z-20">
                                <div className="bg-primary/90 backdrop-blur-lg text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg flex items-center gap-3 border border-white/20">
                                    <Activity className="animate-pulse" size={20} />
                                    <span>Syncing Identity...</span>
                                </div>
                            </div>
                        )}

                        {/* Success/Error Overlay */}
                        {feedback && (
                            <div className="absolute inset-0 flex items-center justify-center p-6 z-40 bg-white/10 backdrop-blur-[2px]">
                                <div className={`animate-up max-w-sm w-full p-8 rounded-[2.5rem] shadow-2xl text-center border-4 ${
                                    feedback.type === 'success' ? 'bg-emerald-50/95 border-emerald-500/30 text-emerald-900' : 'bg-red-50/95 border-red-500/30 text-red-900'
                                }`}>
                                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${
                                        feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {feedback.type === 'success' ? <ShieldCheck size={40} /> : <UserX size={40} />}
                                    </div>
                                    <h4 className="text-2xl font-black mb-1">{feedback.name}</h4>
                                    <p className="font-bold opacity-80">{feedback.text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Logs */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl overflow-hidden flex flex-col h-full max-h-[600px]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40">
                            <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">Real-time Feed</h3>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                                <Activity size={12} />
                                <span className="text-[10px] font-black uppercase">Live</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <div key={i} className="group p-4 bg-white/50 border border-white rounded-2xl flex items-center justify-between hover:bg-white hover:shadow-md transition-all animate-up">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{log.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.type === 'in' ? 'Check-In' : 'Check-Out'}</span>
                                    </div>
                                    <div className="text-[11px] font-black text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md">
                                        {log.time}
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center translate-y-[-20px]">
                                    <Info className="mb-3 opacity-20" size={40} />
                                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Verification Sequences</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Identity Management Node v2.0</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Attendance;
