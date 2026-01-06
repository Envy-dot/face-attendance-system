import React from 'react';

function SessionStatsModal({ stats, onClose }) {
    if (!stats) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
            <div className="glass-panel" style={{ minWidth: '300px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <h3>Session Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.total_students}</div>
                        <div className="text-muted">Unique Students</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="badge badge-success" style={{ display: 'block' }}>
                            IN: {stats.total_in}
                        </div>
                        <div className="badge badge-danger" style={{ display: 'block' }}>
                            OUT: {stats.total_out}
                        </div>
                    </div>
                </div>
                <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default SessionStatsModal;
