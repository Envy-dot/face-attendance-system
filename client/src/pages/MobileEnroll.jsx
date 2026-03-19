import React, { useEffect, useRef, useState } from 'react';
import { UserCheck, Camera, Info, AlertCircle, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api';
import * as faceapi from 'face-api.js';

const courseToDepartmentMap = {
    "Computer Science": "Computer Science",
    "Software Engineering": "Software Engineering",
    "Information Technology": "Information Technology",
    "Computer Engineering": "Engineering",
    "Civil Engineering": "Engineering",
    "Electrical & Electronics Engineering": "Engineering",
    "Mechanical Engineering": "Engineering",
    "Accounting": "Accounting",
    "Banking & Finance": "Banking and Finance",
    "Business Administration": "Business Administration and Marketing",
    "Marketing": "Business Administration and Marketing",
    "Information Resources Management": "Information Resources Management",
    "Agriculture": "Agriculture and Industrial Technology",
    "Biochemistry": "Biochemistry",
    "Microbiology": "Microbiology",
    "Biology": "Basic Sciences",
    "Chemistry": "Basic Sciences",
    "Mathematics": "Basic Sciences",
    "Physics/Electronics": "Basic Sciences",
    "Education": "Education",
    "History and International Studies": "History and International Studies",
    "Languages and Literary Studies": "Languages and Literary Studies",
    "Music and Creative Arts": "Music and Creative Arts",
    "Religious Studies": "Religious Studies",
    "Law": "Jurisprudence & Private Law",
    "Medicine and Surgery": "Medicine & Surgery",
    "Nursing Science": "Nursing",
    "Public Health": "Public Health",
    "Medical Laboratory Science": "Medical Laboratory Science",
    "Anatomy": "Anatomy",
    "Physiology": "Physiology",
    "Nutrition and Dietetics": "Nutrition and Dietetics",
    "Economics": "Economics",
    "Mass Communication": "Mass Communication",
    "Political Science & Public Administration": "Political Science and Public Administration",
    "Social Work": "Social Work"
};

function MobileEnroll() {
    const [formData, setFormData] = useState({
        name: '', matric_no: '', level: '', department: '', course: ''
    });
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const [initializing, setInitializing] = useState(true);
    const [status, setStatus] = useState('IDLE');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [poseStep, setPoseStep] = useState(0);
    const [captures, setCaptures] = useState([]);
    const [faceLandmarksPayload, setFaceLandmarksPayload] = useState(null);
    const [guidance, setGuidance] = useState(null);
    const [cameraError, setCameraError] = useState(false);

    const videoRef = useRef();
    const canvasRef = useRef();
    const detectionFrameRef = useRef(null);

    const stateRef = useRef({ status: 'IDLE', poseStep: 0, captures: [], guidance: null });

    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.poseStep = poseStep;
        stateRef.current.captures = captures;
        stateRef.current.guidance = guidance;
    }, [status, poseStep, captures, guidance]);

    useEffect(() => {
        const loadResources = async () => {
            try {
                const cls = await api.classes.getAll();
                setClasses(Array.isArray(cls) ? cls : []);
                setMsg({ type: 'info', text: "Loading AI models... Please wait." });
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setMsg({ type: '', text: "" });
                startVideo();
            } catch (err) {
                setMsg({ type: 'error', text: "Failed to load models: " + err.message });
            }
        };
        loadResources();
        return () => {
            if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    setInitializing(false);
                    detectLoop();
                };
            }
        } catch (err) {
            console.error("Camera access denied or device missing", err);
            setMsg({ type: 'error', text: "Please allow camera permissions in your browser settings to enroll." });
            setCameraError(true);
        }
    };

    const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
            detectionFrameRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        const displaySize = { width: videoRef.current.clientWidth, height: videoRef.current.clientHeight };
        
        if (displaySize.width > 0 && displaySize.height > 0 && canvasRef.current) {
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, displaySize.width, displaySize.height);

            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

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

                const currentStatus = stateRef.current.status;

                if (currentStatus === 'DETECTING') {
                    // Mobile centering thresholds
                    const widthLimit = displaySize.width;
                    const isCentered = box.x > (widthLimit * 0.1) && (box.x + box.width) < (widthLimit * 0.9);
                    const isBigEnough = box.width > (widthLimit * 0.3);

                    let newGuidance = null;
                    if (!isConfident) newGuidance = "Hold Still";
                    else if (!isBigEnough) newGuidance = "Move Closer";
                    else if (!isCentered) newGuidance = "Center Your Face";

                    if (newGuidance !== stateRef.current.guidance) setGuidance(newGuidance);

                    if (isCentered && isBigEnough && isConfident) capturePhoto(detection.descriptor);
                }
            } else {
                const currentStatus = stateRef.current.status;
                if (currentStatus === 'DETECTING') {
                    if (stateRef.current.guidance !== "Look at Camera") setGuidance("Look at Camera");
                } else {
                    if (stateRef.current.guidance !== null) setGuidance(null);
                }
            }
        }

        detectionFrameRef.current = requestAnimationFrame(detectLoop);
    };

    const startEnrollment = () => {
        if (!formData.name || !formData.matric_no) {
            setMsg({ type: 'error', text: "Please enter Name and Matric No." });
            return;
        }
        setMsg({ type: 'info', text: "Look at the camera" });
        setPoseStep(0);
        setCaptures([]);
        setFaceLandmarksPayload(null);
        setStatus('DETECTING');
    };

    const capturePhoto = (descriptorVal) => {
        if (stateRef.current.status === 'CAPTURING') return;
        setStatus('CAPTURING');
        setGuidance("Capturing...");

        if (stateRef.current.poseStep === 0) {
            setFaceLandmarksPayload(Array.from(descriptorVal));
        }

        const targetWidth = 320;
        const targetHeight = 240;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(blob => {
            setCaptures(prev => [...prev, blob]);

            if (stateRef.current.poseStep === 0) {
                setPoseStep(1);
                setMsg({ type: 'info', text: "Step 2: Turn head slightly (Keep glasses off)." });
                setGuidance("Great! Get ready for pose 2...");
                setTimeout(() => {
                    setStatus('DETECTING');
                    setGuidance(null);
                }, 4000);
            } else {
                setStatus('READY_TO_SUBMIT');
                setMsg({ type: 'success', text: "Captures complete! Ready to submit." });
                setGuidance("Done!");
            }
        }, 'image/jpeg', 0.8);
    };

    const handleSubmit = async () => {
        setStatus('SUBMITTING');
        const data = new FormData();
        data.append('name', formData.name);
        data.append('matric_no', formData.matric_no);
        data.append('level', formData.level);
        data.append('department', formData.department);
        data.append('course', formData.course);
        data.append('classIds', JSON.stringify(selectedClasses));

        if (faceLandmarksPayload) {
            data.append('faceLandmarks', JSON.stringify(faceLandmarksPayload));
        }

        const processCaptures = () => {
            return new Promise((resolve) => {
                let photoData = null;
                captures.forEach((blob, i) => {
                    data.append('images', blob, `capture_${i}.jpg`);
                    if (i === 0) {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => { photoData = reader.result; };
                    }
                });
                setTimeout(() => {
                    if (photoData) data.append('photo', photoData);
                    resolve();
                }, 300);
            });
        };

        try {
            await processCaptures();
            const res = await api.users.register(data);
            if (res.success) {
                setStatus('SUCCESS');
                setMsg({ type: 'success', text: "Enrollment Successful!" });
                setFormData({ name: '', matric_no: '', level: '', department: '', course: '' });
                setSelectedClasses([]);
                setCaptures([]);
                setFaceLandmarksPayload(null);
                setTimeout(() => setStatus('IDLE'), 3000);
            } else {
                setStatus('FAIL');
                setMsg({ type: 'error', text: res.error || "Enrollment failed." });
            }
        } catch (err) {
            setStatus('FAIL');
            setMsg({ type: 'error', text: err.message || "Network error. Check server." });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name' && !/^[a-zA-Z\s]*$/.test(value)) return;
        if (name === 'matric_no' && !/^[a-zA-Z0-9/\-]*$/.test(value)) return;
        if (name === 'course') {
            const mappedDepartment = courseToDepartmentMap[value] || '';
            setFormData({ ...formData, course: value, department: mappedDepartment });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const toggleClass = (id) => setSelectedClasses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    return (
        <div className="flex flex-col w-full px-4 py-8 animate-fade" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 className="text-3xl font-black text-gray-900" style={{ color: 'var(--text-main)' }}>Mobile Enrollment</h2>
            </div>

            <div className="flex flex-col gap-6 w-full">
                
                {/* Camera Section */}
                <div className="card w-full flex flex-col items-center" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex justify-center items-center" style={{ minHeight: '300px' }}>
                        {cameraError ? (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-md z-10 p-4 text-center">
                                <AlertCircle size={48} className="text-red-500 mb-3" />
                                <h3 className="text-xl font-bold mb-1">Camera Required</h3>
                                <p className="opacity-80 text-sm">Please allow camera permissions in your browser settings to enroll.</p>
                            </div>
                        ) : initializing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-500 font-medium z-10">
                                Starts Camera...
                            </div>
                        )}

                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-auto block" 
                        />

                        <canvas 
                            ref={canvasRef} 
                            className="absolute top-0 left-0 w-full h-full pointer-events-none z-[5]" 
                        />

                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 z-10">
                            {captures.map((blob, i) => (
                                <div key={i} className="w-14 h-14 rounded-xl overflow-hidden border-[3px] border-blue-500 shadow-md bg-white">
                                    <img src={URL.createObjectURL(blob)} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>

                        {guidance && (
                            <div className="absolute bottom-[20%] left-0 right-0 text-center z-[6]">
                                <span className="bg-white/90 backdrop-blur-md text-slate-800 px-5 py-2 rounded-full font-bold text-sm shadow-lg border border-slate-200">
                                    {guidance}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 w-full bg-white/60 rounded-xl p-3 border border-slate-200 shadow-sm backdrop-blur-sm">
                        <h4 className="flex items-center gap-2 font-bold mb-2 text-sm text-slate-800"><Layers size={16} /> Steps</h4>
                        <div className="text-xs text-slate-600 space-y-2">
                            <div className="flex items-center gap-2" style={{ opacity: poseStep >= 0 ? 1 : 0.5, fontWeight: poseStep === 0 ? 700 : 400 }}>
                                1. Front Pose (No Glasses)
                                {captures.length > 0 && <CheckCircle size={14} className="text-emerald-500" />}
                            </div>
                            <div className="flex items-center gap-2" style={{ opacity: poseStep >= 1 ? 1 : 0.5, fontWeight: poseStep === 1 ? 700 : 400 }}>
                                2. Alternate Pose (Turn Head)
                                {captures.length > 1 && <CheckCircle size={14} className="text-emerald-500" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="card w-full flex flex-col gap-4" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                    {msg.text && (
                        <div className={`p-4 rounded-xl mb-2 text-sm flex gap-3 font-medium items-start ${msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                            <Info size={18} className="shrink-0 mt-0.5" />
                            <span className="leading-snug">{msg.text}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <input name="name" className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="Full Name" value={formData.name} onChange={handleChange} disabled={status !== 'IDLE'} />
                        <input name="matric_no" className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="Matric No" value={formData.matric_no} onChange={handleChange} disabled={status !== 'IDLE'} />
                        
                        <div className="flex gap-3">
                            <select name="level" className="w-1/3 px-3 py-3.5 rounded-xl bg-white border border-slate-300 text-base shadow-sm outline-none" value={formData.level} onChange={handleChange} disabled={status !== 'IDLE'}>
                                <option value="">Level</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                                <option value="300">300</option>
                                <option value="400">400</option>
                                <option value="500">500</option>
                                <option value="600">600</option>
                            </select>
                            <input name="department" className="w-2/3 px-4 py-3.5 rounded-xl bg-slate-100 border border-slate-200 text-base text-slate-500 shadow-inner" placeholder="Dept (Auto)" value={formData.department} disabled={true} />
                        </div>
                        
                        <select name="course" className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-base shadow-sm outline-none shrink-0" value={formData.course} onChange={handleChange} disabled={status !== 'IDLE'}>
                            <option value="">Select a Course</option>
                            {Object.keys(courseToDepartmentMap).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <div className="mt-2">
                            <label className="text-sm font-bold mb-3 block text-slate-700">Classes</label>
                            <div className="flex flex-wrap gap-2.5">
                                {classes.map(c => (
                                    <div key={c.id} onClick={() => status === 'IDLE' && toggleClass(c.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-all border ${selectedClasses.includes(c.id) ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 ring-offset-1' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'}`}>
                                        {c.code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        {status === 'IDLE' && (
                            <button className="btn btn-primary !w-full !py-4 rounded-2xl text-base shadow-xl" onClick={startEnrollment}>
                                <UserCheck size={20} /> START ENROLLMENT
                            </button>
                        )}
                        {status === 'READY_TO_SUBMIT' && (
                            <button className="btn btn-primary !w-full !py-4 rounded-2xl text-base shadow-xl !bg-emerald-600 hover:!bg-emerald-700" onClick={handleSubmit}>
                                <CheckCircle size={20} /> SUBMIT PROFILE
                            </button>
                        )}
                        {(status === 'DETECTING' || status === 'CAPTURING') && (
                            <div className="w-full py-4 rounded-2xl text-base bg-sky-100 text-sky-800 font-bold flex items-center justify-center gap-2 border border-sky-200">
                                <Camera className="animate-pulse" size={20} />
                                {poseStep === 0 ? "Scanning Face..." : "Scanning Second Pose..."}
                            </div>
                        )}
                        {status === 'FAIL' && (
                            <button className="btn !w-full !py-4 rounded-2xl text-base bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-amber-600" onClick={() => { setStatus('IDLE'); setMsg({ type: '', text: '' }); }}>
                                <RefreshCw size={20} /> RETRY ENROLLMENT
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default MobileEnroll;
