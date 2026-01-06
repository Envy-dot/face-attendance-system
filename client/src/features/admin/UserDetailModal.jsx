import React from 'react';
import { X, User, Fingerprint, BookOpen, Layers, Landmark, Calendar } from 'lucide-react';

function UserDetailModal({ user, onClose }) {
    if (!user) return null;

    return (
        <div className="modal-overlay animate-fade" onClick={onClose} style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
            <div className="modal-content animate-up" onClick={e => e.stopPropagation()} style={{ padding: '2.5rem', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User className="text-primary" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Student Profile</h2>
                    </div>
                    <button onClick={onClose} className="btn" style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    {user.photo ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={user.photo}
                                style={{ width: 160, height: 160, borderRadius: '30px', objectFit: 'cover', border: '5px solid white', boxShadow: 'var(--shadow-lg)' }}
                                alt={user.name}
                            />
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--success)', color: 'white', padding: '6px', borderRadius: '50%', border: '3px solid white' }}>
                                <Fingerprint size={16} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: 160, height: 160, background: 'var(--bg-main)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-light)' }}>
                            <User size={64} style={{ opacity: 0.1 }} />
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <User size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Legal Name</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{user.name}</div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <Fingerprint size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matriculation</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{user.matric_no}</div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <Layers size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Level</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{user.level || 'Not Set'}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <BookOpen size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Concentration</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{user.course || 'Unspecified'}</div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <Landmark size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{user.department || 'General'}</div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <Calendar size={14} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Enrolled</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 800 }}>
                        DISMISS PROFILE
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserDetailModal;
