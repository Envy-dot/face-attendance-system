import React, { useEffect, useState } from 'react';
import { api } from '../api';
import UserTable from '../features/admin/UserTable';
import AttendanceLogs from '../features/admin/AttendanceLogs';
import SessionManager from '../features/admin/SessionManager';
import SessionStatsModal from '../features/admin/SessionStatsModal';

function Admin() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('logs');
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
        const data = await api.users.getAll(searchQuery);
        setUsers(data);
    };

    const fetchLogs = async () => {
        const data = await api.attendance.getLogs(searchQuery);
        const grouped = {};
        data.forEach(log => {
            const key = `${log.session_name || 'N/A'}_${log.matric_no || 'Unknown'}`;
            if (!grouped[key]) {
                grouped[key] = { ...log, in_time: null, out_time: null, in_id: null, out_id: null };
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
        const data = await api.sessions.getActive();
        setActiveSession(data);
    };

    const fetchSessionHistory = async () => {
        const data = await api.sessions.getHistory();
        setSessionHistory(data);
    };

    const handleCreateSession = async (type) => {
        if (!newSessionName) return alert("Please enter a session name");
        await api.sessions.create(newSessionName, type);
        setNewSessionName('');
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
        alert(`${type === 'in' ? 'Sign In' : 'Sign Out'} Session Started!`);
    };

    const handleToggleSessionType = async (id) => {
        if (!window.confirm("Switch Active Session Mode?")) return;
        const data = await api.sessions.toggleType(id);
        if (data.success) fetchActiveSession();
    };

    const handleEndSession = async (id) => {
        if (!window.confirm("End this session?")) return;
        await api.sessions.toggleActive(id, false);
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Delete this session record? This action cannot be undone.")) return;
        await api.sessions.delete(id);
        fetchSessionHistory();
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user? All their attendance records will also be deleted.')) return;
        await api.users.delete(id);
        fetchUsers();
    };

    const handleDeleteLog = async (id) => {
        if (!id || !window.confirm('Delete this specific log entry?')) return;
        await api.attendance.delete(id);
        fetchLogs();
    };

    const handleDeleteBulk = async () => {
        if (!bulkDate || !window.confirm(`Delete all logs for ${bulkDate}?`)) return;
        await api.attendance.deleteBulk(bulkDate);
        setBulkDate('');
        fetchLogs();
    };

    const handleGetStats = async (sessionId) => {
        const data = await api.sessions.getStats(sessionId);
        setSelectedSessionStats(data);
    };

    return (
        <div className="page-container">
            <div className="glass-panel" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Dashboard</h2>
                    {activeSession ? (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-success">● Active Session</span>
                            <span style={{ fontWeight: 600 }}>{activeSession.name}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({activeSession.type.toUpperCase()})</span>
                        </div>
                    ) : (
                        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>● No active session</div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['logs', 'users', 'sessions'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary'} style={{ textTransform: 'capitalize' }}>{tab}</button>
                    ))}
                </div>
            </div>

            <div className="glass-panel" style={{ width: '100%', padding: '0' }}>
                {activeTab === 'logs' && (
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: '300px' }} />
                                <button className="btn btn-secondary" onClick={fetchLogs}>Search</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ width: 'auto' }} />
                                <button className="btn btn-danger" onClick={handleDeleteBulk}>Delete Day</button>
                                <button className="btn btn-primary" onClick={() => window.open(api.attendance.exportUrl, '_blank')}>Export Excel</button>
                            </div>
                        </div>
                        <AttendanceLogs logs={logs} onDeleteLog={handleDeleteLog} />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <input placeholder="Search Users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: '400px' }} />
                            <button className="btn btn-secondary" onClick={fetchUsers}>Search</button>
                        </div>
                        <UserTable users={users} onDeleteUser={handleDeleteUser} />
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <SessionManager
                        activeSession={activeSession}
                        sessionHistory={sessionHistory}
                        newSessionName={newSessionName}
                        setNewSessionName={setNewSessionName}
                        onCreateSession={handleCreateSession}
                        onToggleSessionType={handleToggleSessionType}
                        onEndSession={handleEndSession}
                        onDeleteSession={handleDeleteSession}
                        onGetStats={handleGetStats}
                    />
                )}
            </div>

            <SessionStatsModal stats={selectedSessionStats} onClose={() => setSelectedSessionStats(null)} />
        </div>
    );
}

export default Admin;

