import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Layers } from 'lucide-react';
import { api } from '../../api';

function ClassManager({ debouncedSearch = '' }) {
    const [classes, setClasses] = useState([]);
    const [newClass, setNewClass] = useState({ name: '', code: '', department: '' });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data = await api.classes.getAll();
            if (Array.isArray(data)) {
                setClasses(data);
            } else {
                console.error("Invalid classes format:", data);
                setClasses([]);
            }
        } catch (e) {
            console.error("Failed to fetch classes:", e);
        }
    };

    const handleCreate = async () => {
        if (!newClass.name || !newClass.code) return alert('Name and Code are required');
        try {
            const res = await api.classes.create(newClass);
            if (res.error) {
                alert(res.error);
            } else {
                setNewClass({ name: '', code: '', department: '' });
                fetchClasses();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create class. Please ensure the server is running and updated.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this class?')) {
            await api.classes.delete(id);
            fetchClasses();
        }
    };

    const handleExport = async (classId) => {
        try {
            const url = api.attendance.exportMatrixUrl(classId, true);
            await api.attendance.downloadExportBlob(url, `class_matrix_${classId}.xlsx`);
        } catch (error) {
            alert('Failed to export. ' + error.message);
        }
    };

    return (
        <div className="animate-fade" style={{ padding: '2.5rem' }}>
            <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', borderTop: '5px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Plus className="text-primary" size={24} />
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Add New Class</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Course Code</label>
                        <input
                            placeholder="e.g. COSC 305"
                            value={newClass.code}
                            onChange={e => setNewClass({ ...newClass, code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Course Title</label>
                        <input
                            placeholder="e.g. Software Engineering"
                            value={newClass.name}
                            onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                        <input
                            placeholder="Optional"
                            value={newClass.department}
                            onChange={e => setNewClass({ ...newClass, department: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate} style={{ height: '42px' }}>
                        Create Class
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Layers className="text-secondary" size={20} />
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Existing Classes</h3>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>CODE</th>
                            <th>TITLE</th>
                            <th>DEPARTMENT</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.filter(cls =>
                            cls.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            cls.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                        ).map((cls, i) => (
                            <tr key={cls.id} className="animate-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{i + 1}</td>
                                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{cls.code}</td>
                                <td style={{ fontWeight: 600 }}>{cls.name}</td>
                                <td className="text-muted">{cls.department || '-'}</td>
                                <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleExport(cls.id)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                    >
                                        EXPORT RECORDS
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls.id)}
                                        className="btn btn-secondary"
                                        style={{ color: 'var(--danger)', padding: '0.4rem' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {classes.filter(cls =>
                            cls.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            cls.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                        ).length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No classes matching your query were found.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ClassManager;
