import React, { useEffect, useState } from 'react';

function Admin() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('logs');

    // Modal
    const [selectedSessionStats, setSelectedSessionStats] = useState(null);

    // Form inputs
    const [newSessionName, setNewSessionName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkDate, setBulkDate] = useState('');

    useEffect(() => {
        fetchActiveSession();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'sessions') fetchSessionHistory();
    }, [activeTab]);

    const fetchUsers = async () => {
        let url = '/api/users';
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url);
        const data = await res.json();
        setUsers(data);
    };

    const fetchLogs = async () => {
        let url = '/api/attendance';
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url);
        const data = await res.json();

        // Group logs for display: Session + Matric No
        // This is a client-side grouping processing
        const grouped = {};
        data.forEach(log => {
            const key = `${log.session_name || 'N/A'}_${log.matric_no || 'Unknown'}`;
            if (!grouped[key]) {
                grouped[key] = {
                    ...log, // Keep base info
                    in_time: null,
                    out_time: null,
                    in_id: null,
                    out_id: null
                };
            }
            if (log.type === 'in') {
                grouped[key].in_time = log.timestamp;
                grouped[key].in_id = log.id;
            } else if (log.type === 'out') {
                grouped[key].out_time = log.timestamp;
                grouped[key].out_id = log.id;
            }
        });

        setLogs(Object.values(grouped));
    };

    const fetchActiveSession = async () => {
        const res = await fetch('/api/sessions/active');
        const data = await res.json();
        setActiveSession(data);
    };

    const fetchSessionHistory = async () => {
        const res = await fetch('/api/sessions/history');
        const data = await res.json();
        setSessionHistory(data);
    };

    const getSessionStats = async (sessionId) => {
        try {
            const res = await fetch(`/api/sessions/${sessionId}/stats`);
            const data = await res.json();
            setSelectedSessionStats(data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const createSession = async (type) => {
        if (!newSessionName) return alert("Please enter a session name");
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', name: newSessionName, type })
        });
        setNewSessionName('');
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
        alert(`${type === 'in' ? 'Sign In' : 'Sign Out'} Session Started!`);
    };

    const toggleSessionType = async (id) => {
        if (!window.confirm("Switch Active Session Mode?")) return;
        const res = await fetch(`/api/sessions/${id}/type`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
            fetchActiveSession();
        }
    };

    const endSession = async (id) => {
        if (!window.confirm("End this session?")) return;
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle', id, isActive: false })
        });
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const deleteSession = async (id) => {
        if (!window.confirm("Delete this session record? This action cannot be undone.")) return;
        await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
        fetchSessionHistory();
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Delete this user? All their attendance records will also be deleted.')) return;
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const deleteLog = async (id) => {
        if (!id) return;
        if (!window.confirm('Delete this specific log entry?')) return;
        await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
        fetchLogs();
    };

    const deleteBulk = async () => {
        if (!bulkDate || !window.confirm(`Delete all logs for ${bulkDate}?`)) return;
        await fetch('/api/attendance/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: bulkDate })
        });
        setBulkDate('');
        fetchLogs();
    };

    const exportData = () => {
        window.open('http://localhost:3000/api/export', '_blank');
    };

    return (
        <div className="page-container">
            {/* Header / Stats */}
            <div className="glass-panel" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Admin Dashboard
                    </h2>
                    {activeSession ? (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-success">● Active Session</span>
                            <span style={{ fontWeight: 600 }}>{activeSession.name}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({activeSession.type === 'in' ? 'Sign In' : 'Sign Out'})</span>
                        </div>
                    ) : (
                        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>● No active session</div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['logs', 'users', 'sessions'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel" style={{ width: '100%', boxSizing: 'border-box', padding: '0' }}>

                {activeTab === 'logs' && (
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                <input
                                    placeholder="Search by Name or Matric No..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ maxWidth: '300px' }}
                                />
                                <button className="btn btn-secondary" onClick={fetchLogs}>Search</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ width: 'auto' }} />
                                <button className="btn btn-danger" onClick={deleteBulk}>Delete Day</button>
                                <button className="btn btn-primary" onClick={exportData}>Export Excel</button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <th>Student Info</th>
                                        <th>Session</th>
                                        <th>IN</th>
                                        <th>OUT</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={index}>
                                            <td>
                                                {log.image ? <img src={log.image} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} /> : '-'}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{log.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.matric_no || 'No Matric'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.department}</div>
                                            </td>
                                            <td>{log.session_name}</td>
                                            <td>
                                                {log.in_time ? (
                                                    <div>
                                                        <span className="badge badge-success">IN</span>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                                            {new Date(log.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {log.out_time ? (
                                                    <div>
                                                        <span className="badge badge-danger">OUT</span>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                                            {new Date(log.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {log.in_id && <button onClick={() => deleteLog(log.in_id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Delete IN</button>}
                                                    {log.out_id && <button onClick={() => deleteLog(log.out_id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Delete OUT</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No logs found matching your criteria</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                placeholder="Search Users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ maxWidth: '400px' }}
                            />
                            <button className="btn btn-secondary" onClick={fetchUsers}>Search</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <th>Matric No</th>
                                        <th>Name</th>
                                        <th>Course/Level</th>
                                        <th>Registered</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                {user.photo ? <img src={user.photo} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} /> : <div style={{ width: 44, height: 44, background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#a5b4fc' }}>{user.matric_no}</td>
                                            <td>{user.name}</td>
                                            <td>
                                                <div>{user.course}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.department} - {user.level}</div>
                                            </td>
                                            <td style={{ fontSize: '0.9rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <button onClick={() => deleteUser(user.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No users found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
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
                                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => createSession('in')}>Start Check-In</button>
                                        <button className="btn btn-secondary" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => createSession('out')}>Start Check-Out</button>
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
                                                onClick={() => toggleSessionType(activeSession.id)}
                                                style={{ flex: 1, fontSize: '0.9rem' }}
                                            >
                                                Switch to {activeSession.type === 'in' ? 'Sign Out' : 'Sign In'}
                                            </button>
                                            <button className="btn btn-danger" onClick={() => endSession(activeSession.id)} style={{ flex: 1 }}>End Session</button>
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
                                        <tr key={hist.id} onClick={() => getSessionStats(hist.id)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 500 }}>{hist.name}</td>
                                            <td className="text-secondary">{new Date(hist.start_time).toLocaleString()}</td>
                                            <td>
                                                {hist.is_active ? <span className="badge badge-success">Active</span> : <span className="badge" style={{ opacity: 0.5 }}>Ended</span>}
                                            </td>
                                            <td>
                                                <button onClick={(e) => { e.stopPropagation(); deleteSession(hist.id); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Trash</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for stats */}
            {selectedSessionStats && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setSelectedSessionStats(null)}>
                    <div className="glass-panel" style={{ minWidth: '300px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h3>Session Statistics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            <div className="glass-panel" style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{selectedSessionStats.total_students}</div>
                                <div className="text-muted">Unique Students</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="badge badge-success" style={{ display: 'block' }}>
                                    IN: {selectedSessionStats.total_in}
                                </div>
                                <div className="badge badge-danger" style={{ display: 'block' }}>
                                    OUT: {selectedSessionStats.total_out}
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setSelectedSessionStats(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
