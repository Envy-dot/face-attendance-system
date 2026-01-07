import React from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Settings } from 'lucide-react';

function Home() {
    return (
        <div className="page-container centered-layout">
            <div className="animate-up" style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <ScanFace size={16} style={{ marginRight: '8px' }} /> Biometric Identification Grid
                </div>

                <h1 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '2.5rem', color: 'var(--text-main)', letterSpacing: '-3px' }}>
                    Automated Verification via <br /> <span className="text-primary">Facial Scanning</span>
                </h1>

                <p style={{ fontSize: '1.35rem', color: 'var(--text-secondary)', marginBottom: '5rem', maxWidth: '650px', marginInline: 'auto', lineHeight: 1.6 }}>
                    A reliable, lightning-fast, and completely offline solution for administrative attendance tracking using advanced biometric technology.
                </p>

                <div className="flex-center button-gutter" style={{ flexWrap: 'wrap', marginBottom: '8rem' }}>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.15rem', borderRadius: '14px' }}>
                        <UserPlus size={22} /> Student Enrollment
                    </Link>
                    <Link to="/attendance" className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.15rem', borderRadius: '14px' }}>
                        <Camera size={22} /> Launch Scanner
                    </Link>
                </div>

                <div className="section-gutter" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
                    <div className="card" style={{ textAlign: 'left', padding: '2rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1.25rem' }}><ScanFace size={32} /></div>
                        <h3 style={{ marginBottom: '0.75rem', fontWeight: 800 }}>Biometric Integrity</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>All facial data is hashed and stored locally. Privacy is baked into the architecture.</p>
                    </div>
                    <div className="card" style={{ textAlign: 'left', padding: '2rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1.25rem' }}><Camera size={32} /></div>
                        <h3 style={{ marginBottom: '0.75rem', fontWeight: 800 }}>Neural Processing</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Real-time verification using SSD MobileNet V1 for maximum reliability.</p>
                    </div>
                    <div className="card" style={{ textAlign: 'left', padding: '2rem' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '1.25rem' }}><Settings size={32} /></div>
                        <h3 style={{ marginBottom: '0.75rem', fontWeight: 800 }}>Matrix Reporting</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Automated attendance matrices with session timers and student management.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
