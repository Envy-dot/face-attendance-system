import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, Home as HomeIcon, AlertTriangle } from 'lucide-react';
import Register from './pages/Register';
import Attendance from './pages/Attendance';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import LiquidBackground from './components/LiquidBackground';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Protective wrapper for Admin routes
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  // Obscure and secure the access route; only valid tokens survive
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Route Guard for Desktop-only features
const DesktopOnlyRoute = ({ children, isMobile }) => {
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade z-50 absolute inset-0 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2 shadow-inner">
                <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
            <p className="text-slate-600 mb-6">
                This area is restricted to Desktop devices only for security and system requirements.
            </p>
            <Link to="/" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <HomeIcon size={20} /> Return to Home
            </Link>
        </div>
      </div>
    );
  }
  return children;
};

// Nav Link component for active state styling
const NavLink = ({ to, label, hidden }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  if (hidden) return null;

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
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container relative">
          <LiquidBackground />

          <nav className="navbar relative z-40 flex-wrap" style={{ margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
              <ScanFace className="text-primary" size={28} />
              <span className="hidden sm:inline">FaceAttend</span>
            </Link>

            <div className="nav-links flex-wrap overflow-x-auto whitespace-nowrap hide-scrollbar">
              <NavLink to="/" label={<span className="flex items-center gap-2 pr-1"><HomeIcon size={18} className="sm:hidden" /> <span className={isMobile ? "hidden sm:inline" : ""}>Home</span></span>} />
              <NavLink to="/register" label={<span className="flex items-center gap-2 pr-1"><UserPlus size={18} className="sm:hidden" /> <span>Enroll</span></span>} />
              <NavLink to="/attendance" label="Scanner" hidden={isMobile} />
              <NavLink to="/admin-login" label={<><Lock size={18} /> Lecturer</>} hidden={isMobile} />
            </div>
          </nav>

          <main className="main-content z-30 relative overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/attendance" element={
                <DesktopOnlyRoute isMobile={isMobile}>
                    <Attendance />
                </DesktopOnlyRoute>
              } />
              
              <Route path="/admin-login" element={
                <DesktopOnlyRoute isMobile={isMobile}>
                    <AdminLogin />
                </DesktopOnlyRoute>
              } />
              
              <Route
                path="/admin"
                element={
                  <DesktopOnlyRoute isMobile={isMobile}>
                    <ProtectedRoute>
                        <Admin />
                    </ProtectedRoute>
                  </DesktopOnlyRoute>
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
