import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, UserPlus, Camera, Lock, Home as HomeIcon } from 'lucide-react';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import './index.css';

// Protective wrapper for Admin routes
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Nav Link component for active state styling
const NavLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0.6rem 1.25rem',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--primary-light)' : 'transparent',
        fontWeight: isActive ? 800 : 600,
        textDecoration: 'none',
        fontSize: '0.95rem'
      }}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      <span>{label}</span>
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar" style={{
          padding: '1rem 5%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <Link to="/" className="nav-brand" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'var(--text-main)'
          }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '10px' }}>
              <ShieldCheck size={24} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-1.5px', color: 'var(--primary)' }}>FaceAttend</span>
          </Link>

          <div className="nav-links" style={{ display: 'flex', gap: '0.5rem' }}>
            <NavLink to="/" icon={HomeIcon} label="Home" />
            <NavLink to="/register" icon={UserPlus} label="Enroll" />
            <NavLink to="/attendance" icon={Camera} label="Scanner" />
            <NavLink to="/admin" icon={Lock} label="Admin" />
          </div>
        </nav>

        <main className="main-content" style={{ padding: '3rem 5%' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
