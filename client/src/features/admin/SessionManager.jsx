import React from 'react';
import {
    PlayCircle,
    StopCircle,
    RefreshCcw,
    Calendar,
    Trash2,
    Activity,
    Info,
    ChevronRight,
    LogIn,
    LogOut
} from 'lucide-react';

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
        <div className="animate-fade" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', marginBottom: '4rem' }}>
                {/* Create Session Card */}
                <div className="card" style={{ borderTop: '5px solid var(--primary)', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <PlayCircle className="text-primary" size={24} />
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Initiate Surveillance</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Operational Context</label>
                            <input
                                placeholder="e.g. Morning Lecture - BIO101"
                                value={newSessionName}
                                onChange={e => setNewSessionName(e.target.value)}
                                style={{ background: 'var(--bg-main)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.8rem' }} onClick={() => onCreateSession('in')}>
                                <LogIn size={18} /> OPEN ENTRY
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem' }} onClick={() => onCreateSession('out')}>
                                <LogOut size={18} /> OPEN EXIT
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <Info size={16} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                Start will automatically finalize any active biometric surveillance sessions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Session Card */}
                <div className="card" style={{
                    borderTop: activeSession ? '5px solid var(--success)' : '5px solid var(--text-muted)',
                    background: activeSession ? 'var(--success-bg)' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '2.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                        <Activity className={activeSession ? 'text-success' : 'text-muted'} size={24} />
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>System Integrity</h3>
                    </div>

                    {activeSession ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>{activeSession.name}</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--success)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '2rem', textTransform: 'uppercase' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }}></div>
                                {activeSession.type} Mode ACTIVE
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => onToggleSessionType(activeSession.id)}
                                    style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem', fontWeight: 700, background: 'white' }}
                                >
                                    <RefreshCcw size={18} /> SWAP
                                </button>
                                <button className="btn btn-danger" onClick={() => onEndSession(activeSession.id)} style={{ flex: 1, padding: '0.8rem', fontWeight: 700 }}>
                                    <StopCircle size={18} /> TERMINATE
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <StopCircle size={48} style={{ opacity: 0.1 }} />
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>SENSORS IDLE</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar className="text-secondary" size={20} />
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Audit Archives</h3>
                </div>
                <div style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    HISTORICAL INTELLIGENCE
                </div>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>IDENTIFIER</th>
                            <th>TIMESTAMP (START)</th>
                            <th>LIFECYCLE</th>
                            <th style={{ textAlign: 'right' }}>OPERATIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessionHistory.map((hist, index) => (
                            <tr key={hist.id} onClick={() => onGetStats(hist.id)} className="clickable animate-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ChevronRight size={14} className="text-primary" />
                                        {hist.name}
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>{new Date(hist.start_time).toLocaleString()}</td>
                                <td>
                                    {hist.is_active ?
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 800, fontSize: '0.7rem' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> LIVE
                                        </div> :
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.7rem' }}>
                                            ARCHIVED
                                        </div>
                                    }
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(hist.id); }}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                        title="Purge record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sessionHistory.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                    <div style={{ fontWeight: 500 }}>Central intelligence repository is empty.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SessionManager;
