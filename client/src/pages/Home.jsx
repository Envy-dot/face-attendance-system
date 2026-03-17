import React from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Settings, ShieldCheck, HelpCircle, CheckCircle, Clock } from 'lucide-react';

function Home() {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed top-[10%] -left-[5%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,var(--primary-glow),transparent_70%)] blur-[100px] -z-10 opacity-50" />
            <div className="fixed bottom-0 -right-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(14,165,233,0.3),transparent_70%)] blur-[100px] -z-10 opacity-50" />

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:p-16 text-center z-10">
                <div className="animate-up max-w-[900px] w-full">

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-black leading-tight mb-6 text-slate-800 tracking-tight">
                        Effortless Attendance via <br />
                        <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                            Facial Recognition
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-[650px] mx-auto leading-relaxed font-medium px-2">
                        Secure and automated attendance tracking using advanced facial recognition.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 px-4">
                        <Link to="/attendance" className="w-full sm:w-auto px-8 py-4 text-base md:text-lg rounded-full bg-primary text-white shadow-[0_0_25px_var(--primary-glow)] no-underline flex items-center justify-center gap-2 hover:scale-105 transition-transform font-bold">
                            <Camera size={22} /> ENTER SCANNER
                        </Link>
                        <Link to="/register" className="w-full sm:w-auto px-8 py-4 text-base md:text-lg rounded-full bg-white/40 backdrop-blur-md border border-white/60 no-underline flex items-center justify-center gap-2 shadow-xl text-slate-800 hover:bg-white/60 hover:scale-105 transition-all font-bold">
                            <UserPlus size={22} /> REGISTER FACE
                        </Link>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left mt-8 px-2 md:px-0">
                        <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl hover:-translate-y-2 transition-transform">
                            <div className="text-primary mb-6 bg-white/60 inline-flex p-4 rounded-2xl shadow-sm border border-white/40">
                                <Settings size={28} />
                            </div>
                            <h3 className="mb-4 font-extrabold text-xl md:text-2xl text-slate-800">Fully Automated</h3>
                            <p className="text-slate-600 text-base md:text-lg m-0 leading-relaxed font-medium">
                                Create strictly timed sessions, restrict access by class enrollment, and export comprehensive attendance matrices globally.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl hover:-translate-y-2 transition-transform">
                            <div className="text-secondary mb-6 bg-white/60 inline-flex p-4 rounded-2xl shadow-sm border border-white/40">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="mb-4 font-extrabold text-xl md:text-2xl text-slate-800">Real-Time Processing</h3>
                            <p className="text-slate-600 text-base md:text-lg m-0 leading-relaxed font-medium">
                                Utilizing browser-based neural networks for fast, secure identification without constant web pings.
                            </p>
                        </div>
                    </div>

                    {/* How It Works Section */}
                    <div className="mt-16 md:mt-24 text-left bg-white/40 rounded-3xl p-6 md:p-12 border border-white/60 shadow-xl backdrop-blur-xl mx-2 md:mx-0">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-10 justify-center text-center">
                            <HelpCircle size={36} className="text-primary" />
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 m-0">System Instructions</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {/* Step 1 */}
                            <div className="flex flex-col gap-4 items-start">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_4px_10px_var(--primary-glow)] shrink-0">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xl mb-3 text-slate-800 flex items-center gap-2">
                                        <UserPlus size={20} className="text-primary" /> First-Time Enrollment
                                    </h4>
                                    <p className="text-slate-600 text-[0.95rem] md:text-base leading-relaxed m-0 font-medium">
                                        Before you can mark attendance, navigate to the <strong className="text-slate-800">Register Face</strong> portal. Enter your academic details and follow the on-screen prompts to capture your facial biometric data. Note: The system will require you to hold still without glasses and take two captures for accuracy.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col gap-4 items-start">
                                <div className="bg-secondary text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_4px_10px_rgba(236,72,153,0.3)] shrink-0">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xl mb-3 text-slate-800 flex items-center gap-2">
                                        <Clock size={20} className="text-secondary" /> Wait for a Session
                                    </h4>
                                    <p className="text-slate-600 text-[0.95rem] md:text-base leading-relaxed m-0 font-medium">
                                        Attendance can only be marked when a Lecturer has opened an active session for your enrolled class. If no session is active, or if the time limit expires, the scanner will lock you out.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col gap-4 items-start hidden md:flex">
                                <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_4px_10px_rgba(16,185,129,0.3)] shrink-0">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xl mb-3 text-slate-800 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-emerald-500" /> Scan to Verify
                                    </h4>
                                    <p className="text-slate-600 text-[0.95rem] md:text-base leading-relaxed m-0 font-medium">
                                        Click <strong className="text-slate-800">Enter Scanner</strong> to access the webcam. Ensure you are in a well-lit area. Look directly into the camera until the bounding box centers on your face and a success notification appears on screen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-8 pb-12 sm:p-8 text-center text-slate-500 font-medium mt-auto z-10 border-t border-slate-200/50">
                &copy; Facial Recognition-Based Attendance System
            </footer>
        </div>
    );
}

export default Home;

