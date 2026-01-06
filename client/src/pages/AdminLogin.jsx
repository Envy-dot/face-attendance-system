import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple demonstration logic - in a real app, this would be a server-side check
        if (password === 'admin123') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('The administrative credential provided is incorrect.');
        }
    };

    return (
        <div className="flex-center animate-fade" style={{ minHeight: '80vh' }}>
            <div className="card animate-up" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', padding: '3rem' }}>
                <div style={{ display: 'inline-flex', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: '20px', marginBottom: '2rem' }}>
                    <ShieldAlert size={40} />
                </div>

                <h2 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Restricted Access</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                    Authenticated administrative session required to access the internal management console.
                </p>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                            <Lock size={14} className="text-secondary" />
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Credential</label>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter administrative token"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ background: 'var(--bg-main)', border: error ? '1px solid var(--danger)' : '1px solid var(--border-light)' }}
                            required
                        />
                        {error && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <ShieldAlert size={14} /> {error}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 800 }}>
                        AUTHORIZE SESSION <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} className="text-muted" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>System Security Active</span>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
