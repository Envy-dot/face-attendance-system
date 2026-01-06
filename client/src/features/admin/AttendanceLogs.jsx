import React from 'react';
import { LogIn, LogOut, Trash2 } from 'lucide-react';

function AttendanceLogs({ logs, onDeleteLog }) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>Imagery</th>
                        <th>Personnel</th>
                        <th>Session Context</th>
                        <th>Entry Status</th>
                        <th>Exit Status</th>
                        <th style={{ textAlign: 'right' }}>Purge</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log, index) => (
                        <tr key={index} className="animate-up" style={{ animationDelay: `${index * 0.05}s` }}>
                            <td>
                                {log.image ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={log.image} style={{ width: 50, height: 50, borderRadius: '10px', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-md)' }} alt={log.name} />
                                    </div>
                                ) : (
                                    <div style={{ width: 50, height: 50, borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>-</div>
                                )}
                            </td>
                            <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{log.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{log.matric_no || 'Credential Missing'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{log.department}</div>
                            </td>
                            <td>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.session_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terminal Sync</div>
                            </td>
                            <td>
                                {log.in_time ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: '#dcfce7', color: '#166534', padding: '4px', borderRadius: '6px' }}><LogIn size={14} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{new Date(log.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAPTURED</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>
                                )}
                            </td>
                            <td>
                                {log.out_time ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '4px', borderRadius: '6px' }}><LogOut size={14} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{new Date(log.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>RELEASED</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>In Session</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                    {log.in_id && (
                                        <button onClick={() => onDeleteLog(log.in_id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Delete IN log">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    {log.out_id && (
                                        <button onClick={() => onDeleteLog(log.out_id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Delete OUT log">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No attendance intelligence detected yet for this query.</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AttendanceLogs;
