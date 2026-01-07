import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    History,
    Settings2,
    LogOut,
    Search,
    Download,
    Trash2,
    ShieldCheck,
    CloudOff
} from 'lucide-react';
import { api } from '../api';
import UserTable from '../features/admin/UserTable';
import AttendanceLogs from '../features/admin/AttendanceLogs';
import SessionManager from '../features/admin/SessionManager';
import SessionStatsModal from '../features/admin/SessionStatsModal';
import UserDetailModal from '../features/admin/UserDetailModal';

function Admin() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('logs');
    const [selectedSessionStats, setSelectedSessionStats] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form inputs
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionDuration, setNewSessionDuration] = useState('60');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkDate, setBulkDate] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchActiveSession();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'sessions') fetchSessionHistory();
    }, [activeTab]);

    const handleLogout = () => {
        if (window.confirm("Securely sign out of administrative panel?")) {
            localStorage.removeItem('isAdmin');
            navigate('/admin-login');
        }
    };

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
        if (!newSessionName) return alert("Please specify a session name for tracking.");
        await api.sessions.create(newSessionName, type, parseInt(newSessionDuration) || 0);
        setNewSessionName('');
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const handleToggleSessionType = async (id) => {
        if (!window.confirm("Switch Active Session Mode?")) return;
        const data = await api.sessions.toggleType(id);
        if (data.success) fetchActiveSession();
    };

    const handleEndSession = async (id) => {
        if (!window.confirm("Terminate this session record?")) return;
        await api.sessions.toggleActive(id, false);
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Delete this session record permanently?")) return;
        await api.sessions.delete(id);
        fetchSessionHistory();
    };

    const handleDeleteUser = async (id) => {
        await api.users.delete(id);
        fetchUsers();
    };

    const handleDeleteLog = async (id) => {
        if (!id) return;
        await api.attendance.delete(id);
        fetchLogs();
    };

    const handleDeleteBulk = async () => {
        if (!bulkDate || !window.confirm(`Permanently remove all logs for ${bulkDate}?`)) return;
        await api.attendance.deleteBulk(bulkDate);
        setBulkDate('');
        fetchLogs();
    };

    const handleGetStats = async (sessionId) => {
        const data = await api.sessions.getStats(sessionId);
        setSelectedSessionStats(data);
    };

    const handleExportMatrix = (sessionName) => {
        window.open(api.attendance.exportMatrixUrl(sessionName), '_blank');
    };

    return (
        <div className="page-container animate-fade" style={{ padding: '4rem 1rem' }}>
            <div className="card" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem 2.5rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1px' }}>Management Console</h2>
                        {activeSession ? (
                            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <ShieldCheck size={14} className="text-success" />
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Operational:</span>
                                <span style={{ fontWeight: 700 }}>{activeSession.name}</span>
                                <span className="text-muted">({activeSession.type.toUpperCase()})</span>
                            </div>
                        ) : (
                            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <CloudOff size={14} />
                                <span>No active attendance sessions currently monitored.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '0.4rem', borderRadius: '12px', gap: '0.25rem' }}>
                    {[
                        { id: 'logs', label: 'Attendance', icon: <History size={16} /> },
                        { id: 'users', label: 'Database', icon: <Users size={16} /> },
                        { id: 'sessions', label: 'Sessions', icon: <Settings2 size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="btn"
                            style={{
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                                padding: '0.6rem 1.25rem'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', background: 'var(--border-light)', margin: '0.5rem' }} />
                    <button onClick={handleLogout} className="btn" style={{ color: 'var(--danger)', padding: '0.6rem 1rem' }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="card" style={{ width: '100%', padding: '0', overflow: 'hidden', minHeight: '600px' }}>
                {activeTab === 'logs' && (
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                                </div>
                                <button className="btn btn-primary" onClick={fetchLogs}>Filter</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ width: 'auto' }} />
                                <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleDeleteBulk}>
                                    <Trash2 size={16} /> Clear Day
                                </button>
                                <button className="btn btn-primary" onClick={() => window.open(api.attendance.exportUrl, '_blank')}>
                                    <Download size={16} /> Export Records
                                </button>
                            </div>
                        </div>
                        <AttendanceLogs logs={logs} onDeleteLog={handleDeleteLog} />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input placeholder="Filter by Name or Matric..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '3rem' }} />
                            </div>
                            <button className="btn btn-primary" onClick={fetchUsers}>Execute Search</button>
                            <span className="text-secondary" style={{ fontSize: '0.9rem', marginLeft: 'auto' }}>Total: {users.length} Students</span>
                        </div>
                        <UserTable users={users} onDeleteUser={handleDeleteUser} onUserClick={setSelectedUser} />
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <SessionManager
                        activeSession={activeSession}
                        sessionHistory={sessionHistory}
                        newSessionName={newSessionName}
                        setNewSessionName={setNewSessionName}
                        newSessionDuration={newSessionDuration}
                        setNewSessionDuration={setNewSessionDuration}
                        onCreateSession={handleCreateSession}
                        onToggleSessionType={handleToggleSessionType}
                        onEndSession={handleEndSession}
                        onDeleteSession={handleDeleteSession}
                        onGetStats={handleGetStats}
                        onExportMatrix={handleExportMatrix}
                    />
                )}
            </div>

            {/* Modals */}
            <SessionStatsModal stats={selectedSessionStats} onClose={() => setSelectedSessionStats(null)} />
            <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
}

export default Admin;

