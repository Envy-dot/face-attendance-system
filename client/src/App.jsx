import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, Home as HomeIcon } from 'lucide-react';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import LiquidBackground from './components/LiquidBackground';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Protective wrapper for Admin routes
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  // Obscure and secure the access route; only valid tokens survive
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Nav Link component for active state styling
const NavLink = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  return (
    <Link
      to={to}
      className={isActive ? 'active' : ''}
    >
      {label}
    </Link>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          <LiquidBackground />

          <nav className="navbar" style={{ margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
              <ScanFace className="text-primary" size={28} />
              FaceAttend
            </Link>

            <div className="nav-links">
              <NavLink to="/" label="Home" />
              <NavLink to="/register" label="Enroll" />
              <NavLink to="/attendance" label="Scanner" />
              <NavLink to="/admin-login" label={<><Lock size={18} /> Lecturer</>} />
            </div>
          </nav>

          <main className="main-content">
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
    </ErrorBoundary>
  );
}

export default App;
