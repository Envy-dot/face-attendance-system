const BASE_URL = '/api';

export const api = {
    users: {
        getAll: async (search = '') => {
            const res = await fetch(`${BASE_URL}/users${search ? `?search=${search}` : ''}`);
            return res.json();
        },
        register: async (userData) => {
            const res = await fetch(`${BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' });
            return res.json();
        }
    },
    sessions: {
        getActive: async () => {
            const res = await fetch(`${BASE_URL}/sessions/active`);
            return res.json();
        },
        getHistory: async () => {
            const res = await fetch(`${BASE_URL}/sessions/history`);
            return res.json();
        },
        create: async (name, type, duration = 0) => {
            const res = await fetch(`${BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', name, type, duration })
            });
            return res.json();
        },
        toggleActive: async (id, isActive) => {
            const res = await fetch(`${BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle', id, isActive })
            });
            return res.json();
        },
        toggleType: async (id) => {
            const res = await fetch(`${BASE_URL}/sessions/${id}/type`, { method: 'PUT' });
            return res.json();
        },
        getStats: async (id) => {
            const res = await fetch(`${BASE_URL}/sessions/${id}/stats`);
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/sessions/${id}`, { method: 'DELETE' });
            return res.json();
        }
    },
    attendance: {
        getLogs: async (search = '') => {
            const res = await fetch(`${BASE_URL}/attendance${search ? `?search=${search}` : ''}`);
            return res.json();
        },
        log: async (userId, image) => {
            const res = await fetch(`${BASE_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, image })
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/attendance/${id}`, { method: 'DELETE' });
            return res.json();
        },
        deleteBulk: async (date) => {
            const res = await fetch(`${BASE_URL}/attendance/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            return res.json();
        },
        exportUrl: `${BASE_URL}/attendance/export`,
        exportMatrixUrl: (sessionName) => `${BASE_URL}/attendance/export-matrix?sessionName=${encodeURIComponent(sessionName)}`
    }
};
