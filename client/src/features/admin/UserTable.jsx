import React from 'react';
import { Trash2, User, IdCard } from 'lucide-react';

function UserTable({ users, onDeleteUser, onUserClick, currentPage, totalPages, onPageChange }) {
    return (
        <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            <table>
                <thead>
                    <tr>
                        <th>S/N</th>
                        <th>MATRIC NO</th>
                        <th>STUDENT NAME</th>
                        <th>ACADEMIC INFORMATION</th>
                        <th>ENROLLED</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {users.filter(u => u.is_active !== 0).map((user, index) => (
                        <tr key={user.id} className="clickable animate-up" onClick={() => onUserClick(user)} style={{ animationDelay: `${index * 0.03}s` }}>
                            <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{(currentPage - 1) * 10 + index + 1}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <IdCard size={16} className="text-primary" />
                                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{user.matric_no}</span>
                                </div>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ background: 'var(--bg-main)', padding: '6px', borderRadius: '50%', color: 'var(--primary)' }}><User size={14} /></div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
                                </div>
                            </td>
                            <td>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.course || 'Unspecified'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.department} • Level {user.level}</div>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Remove student ${user.name} from the active database?`)) {
                                            onDeleteUser(user.id);
                                        }
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem', color: 'var(--danger)' }}
                                    title="Purge student record"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.filter(u => u.is_active !== 0).length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontWeight: 500 }}>Student biometric repository is currently unpopulated.</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Page {currentPage} of {totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn btn-secondary"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-secondary"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserTable;
