import React from 'react';

function AttendanceLogs({ logs, onDeleteLog }) {
    return (
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
                                {log.image ? <img src={log.image} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} alt={log.name} /> : '-'}
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
                                    {log.in_id && <button onClick={() => onDeleteLog(log.in_id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Delete IN</button>}
                                    {log.out_id && <button onClick={() => onDeleteLog(log.out_id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Delete OUT</button>}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No logs found matching your criteria</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export default AttendanceLogs;
