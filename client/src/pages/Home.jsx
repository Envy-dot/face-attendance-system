import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Settings, ShieldCheck, HelpCircle, CheckCircle, Clock, ChevronRight, Laptop } from 'lucide-react';

function Home() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen flex flex-col relative px-4 md:px-8 py-12 md:py-24">
            {/* Background Glows */}
            <div className="fixed top-[10%] -left-[5%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" />
            <div className="fixed bottom-0 -right-[10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full text-center space-y-12 mb-24 transition-opacity duration-700 animate-up">
                <div className="space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-black uppercase tracking-widest animate-fade-in shadow-sm">
                        <ShieldCheck size={14} />
                        Next-Gen Attendance
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
                        Effortless Attendance via <br />
                        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                            Facial Recognition
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium px-4">
                        A secure, automated platform using advanced neural networks to streamline classroom management.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
                    {!isMobile ? (
                        <Link
                            to="/attendance"
                            className="group flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-3xl font-black text-lg transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/40 active:scale-95 w-full sm:w-auto overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
                            <Camera size={24} />
                            <span>ENTER SCANNER</span>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <div className="flex flex-col items-center gap-3 bg-slate-900/5 backdrop-blur-sm border border-slate-200/50 p-6 rounded-3xl w-full sm:w-auto animate-fade-in">
                            <div className="flex items-center gap-2 text-slate-600 font-bold mb-1">
                                <Laptop size={20} className="text-primary" />
                                <span>Desktop Access Recommended</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Scanner is optimized for console environments.</p>
                        </div>
                    )}

                    <Link
                        to="/register"
                        className="flex items-center justify-center gap-3 bg-white/60 backdrop-blur-xl border border-white p-5 px-10 rounded-3xl font-black text-lg text-slate-900 transition-all hover:bg-white hover:shadow-xl active:scale-95 w-full sm:w-auto"
                    >
                        <UserPlus size={24} className="text-secondary" />
                        <span>REGISTER FACE</span>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-12 px-2">
                    <div className="group bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-12 rounded-[40px] text-left transition-all hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-slate-200/50">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                            <Settings size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Fully Automated Control</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Create strictly timed sessions, restrict access by class enrollment, and export comprehensive attendance matrices with one click.
                        </p>
                    </div>

                    <div className="group bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-12 rounded-[40px] text-left transition-all hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-slate-200/50">
                        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-8 group-hover:bg-secondary group-hover:text-white transition-all transform group-hover:-rotate-6 shadow-sm">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Local-First Privacy</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Utilizing browser-based neural networks for lightning-fast verification without compromising privacy or needing constant server pings.
                        </p>
                    </div>
                </div>

                {/* System Instructions */}
                <div className="w-full bg-white/30 backdrop-blur-3xl border border-white/40 rounded-[48px] p-8 md:p-16 text-left shadow-2xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12">
                        <ScanFace size={240} />
                    </div>

                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                            <HelpCircle size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Quick Start Guide</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {[
                            {
                                id: 1,
                                icon: UserPlus,
                                color: 'bg-primary',
                                title: 'Enrollment',
                                desc: 'Students must capture two clear biometrics snapshots without glasses to build their identity profile.'
                            },
                            {
                                id: 2,
                                icon: Clock,
                                color: 'bg-secondary',
                                title: 'Wait for Session',
                                desc: 'The scanner only activates when a session is live. If the timer expires, the portal locks automatically.'
                            },
                            {
                                id: 3,
                                icon: CheckCircle,
                                color: 'bg-emerald-500',
                                title: 'Blink to Verify',
                                desc: 'Look directly at the camera and blink when prompted. Liveness detection ensures 100% verification accuracy.'
                            }
                        ].map((step) => (
                            <div key={step.id} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={`${step.color} text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-${step.color.split('-')[1]}/30`}>
                                        {step.id}
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <step.icon size={18} className="text-slate-400" />
                                        {step.title}
                                    </h4>
                                </div>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed pl-14">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-400 font-bold border-t border-slate-200/60 max-w-6xl mx-auto w-full">
                <p className="text-sm tracking-widest uppercase">&copy; {new Date().getFullYear()} Facial Recognition Attendance System by the SWAG developer</p>
            </footer>
        </div>
    );
}

export default Home;
