import React from 'react';

function UserTable({ users, onDeleteUser }) {
    return (
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
                                {user.photo ? <img src={user.photo} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} alt={user.name} /> : <div style={{ width: 44, height: 44, background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>}
                            </td>
                            <td style={{ fontWeight: 600, color: '#a5b4fc' }}>{user.matric_no}</td>
                            <td>{user.name}</td>
                            <td>
                                <div>{user.course}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.department} - {user.level}</div>
                            </td>
                            <td style={{ fontSize: '0.9rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => onDeleteUser(user.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No users found</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export default UserTable;
