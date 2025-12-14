import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="page-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    margin: '0 0 1rem 0',
                    background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    letterSpacing: '-1px'
                }}>
                    FaceAttend
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '80%' }}>
                    Next-Generation Facial Biometric Attendance System
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center' }}>
                    <Link to="/attendance" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                        Mark Attendance
                    </Link>
                    <Link to="/register" className="btn btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                        Register User
                    </Link>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', width: '100%', display: 'flex', justifyContent: 'space-around', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>99%</span>
                        Accuracy
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>0.2s</span>
                        Speed
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>100%</span>
                        Secure
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
