import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, Camera, Settings } from 'lucide-react';

function Home() {
    return (
        <div className="page-container flex-center" style={{ minHeight: '80vh' }}>
            <div className="animate-up" style={{ textAlign: 'center', maxWidth: '800px' }}>
                <div style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <ShieldCheck size={16} style={{ marginRight: '8px' }} /> Secure Biometric Attendance
                </div>

                <h1 style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '-2px' }}>
                    Effortless Attendance with <span className="text-primary">Face Recognition</span>
                </h1>

                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', marginInline: 'auto' }}>
                    A reliable, lightning-fast, and completely offline solution for administrative attendance tracking using advanced biometric technology.
                </p>

                <div className="flex-center" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        <UserPlus size={20} /> Student Enrollment
                    </Link>
                    <Link to="/attendance" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        <Camera size={20} /> Launch Scanner
                    </Link>
                </div>

                <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    <div className="card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><ShieldCheck size={32} /></div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Privacy First</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>All biometric data is processed and stored locally. Never leaves your device.</p>
                    </div>
                    <div className="card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><Camera size={32} /></div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Real-time Sync</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Instant detection and logging with high-precision face matching algorithms.</p>
                    </div>
                    <div className="card" style={{ textAlign: 'left', padding: '1.5rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><Settings size={32} /></div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Admin Tools</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Deep-dive analytics, student management, and data export capabilities.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
