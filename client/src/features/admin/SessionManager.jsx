import React from 'react';

function SessionManager({
    activeSession,
    sessionHistory,
    newSessionName,
    setNewSessionName,
    onCreateSession,
    onToggleSessionType,
    onEndSession,
    onDeleteSession,
    onGetStats
}) {
    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Create Session Card */}
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ marginTop: 0 }}>Start New Session</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            placeholder="Session Name (e.g. CSC401 Lecture 1)"
                            value={newSessionName}
                            onChange={e => setNewSessionName(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onCreateSession('in')}>Start Check-In</button>
                            <button className="btn btn-secondary" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => onCreateSession('out')}>Start Check-Out</button>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                            Starting a new session automatically ends any other active session.
                        </p>
                    </div>
                </div>

                {/* Active Session Card */}
                <div className="glass-panel" style={{ background: activeSession ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ marginTop: 0 }}>Current Status</h3>
                    {activeSession ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.5rem' }}>{activeSession.name}</div>
                            <div className="badge badge-success" style={{ display: 'inline-block', fontSize: '1rem', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
                                MODE: {activeSession.type.toUpperCase()}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => onToggleSessionType(activeSession.id)}
                                    style={{ flex: 1, fontSize: '0.9rem' }}
                                >
                                    Switch to {activeSession.type === 'in' ? 'Sign Out' : 'Sign In'}
                                </button>
                                <button className="btn btn-danger" onClick={() => onEndSession(activeSession.id)} style={{ flex: 1 }}>End Session</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💤</div>
                            <div>No Active Session</div>
                        </div>
                    )}
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>History</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Session Name</th>
                            <th>Started At</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessionHistory.map(hist => (
                            <tr key={hist.id} onClick={() => onGetStats(hist.id)} style={{ cursor: 'pointer' }}>
                                <td style={{ fontWeight: 500 }}>{hist.name}</td>
                                <td className="text-secondary">{new Date(hist.start_time).toLocaleString()}</td>
                                <td>
                                    {hist.is_active ? <span className="badge badge-success">Active</span> : <span className="badge" style={{ opacity: 0.5 }}>Ended</span>}
                                </td>
                                <td>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteSession(hist.id); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Trash</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SessionManager;
