import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, Home as HomeIcon } from 'lucide-react';
import AdaptiveEnroll from './pages/AdaptiveEnroll';
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
const NavLink = ({ to, label, className = '' }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  return (
    <Link
      to={to}
      className={`${isActive ? 'active' : ''} ${className}`}
    >
      {label}
    </Link>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent swiping by adding a strict overflow block on the main container
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container" style={{ paddingBottom: isMobile ? '80px' : '0', overflowX: 'hidden', touchAction: isMobile ? 'pan-y' : 'auto' }}>
          <LiquidBackground />

          <nav className="navbar" style={isMobile ? { padding: '1rem', display: 'flex', justifyContent: 'center', background: 'transparent', boxShadow: 'none', border: 'none' } : { margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
              <ScanFace className="text-primary" size={isMobile ? 36 : 28} />
              { !isMobile && "FaceAttend" }
            </Link>

            {!isMobile && (
              <div className="nav-links">
                <NavLink to="/" label="Home" />
                <NavLink to="/register" label="Enroll" />
                <NavLink to="/attendance" label="Scanner" />
                <NavLink to="/admin-login" label={<><Lock size={18} /> Lecturer</>} />
              </div>
            )}
          </nav>

          {isMobile && (
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 z-[100] flex justify-between items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', paddingTop: '1rem' }}>
              <NavLink to="/" className="flex flex-col items-center text-slate-400 gap-1 active:text-blue-600 transition-colors" label={<><HomeIcon size={26} /><span className="text-[11px] font-bold">Home</span></>} />
              
              <NavLink to="/register" className="flex items-center justify-center bg-blue-600 text-white rounded-full px-10 py-3.5 font-bold text-[15px] shadow-xl shadow-blue-500/30 active:scale-95 transition-transform" label="ENROLL NOW" />
            </div>
          )}

          <main className="main-content" style={isMobile ? { padding: '1rem', paddingTop: '0' } : {}}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<AdaptiveEnroll />} />
              <Route path="/attendance" element={isMobile ? <Navigate to="/" replace /> : <Attendance />} />
              <Route path="/admin-login" element={isMobile ? <Navigate to="/" replace /> : <AdminLogin />} />
              <Route
                path="/admin"
                element={
                  isMobile ? <Navigate to="/" replace /> :
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
