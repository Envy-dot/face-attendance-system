import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ScanFace, UserPlus, Camera, Lock, ShieldAlert, Laptop } from 'lucide-react';
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
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Mobile restriction wrapper
const MobileGuard = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <Navigate to="/" replace /> : children;
};

// Nav Link component for active state styling
const NavLink = ({ to, label, icon: Icon, hideOnMobile }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/admin' && to === '/admin-login');

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
        hideOnMobile ? 'hidden lg:flex' : 'flex'
      } ${
        isActive 
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
      }`}
    >
      {Icon && <Icon size={18} />}
      <span className="text-sm tracking-tight">{label}</span>
    </Link>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col relative overflow-x-hidden">
          <LiquidBackground />

          <nav className="sticky top-0 z-50 px-4 py-4 md:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 p-3 rounded-2xl shadow-xl shadow-slate-200/50">
              <Link to="/" className="flex items-center gap-2.5 px-3 group no-underline">
                <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <ScanFace className="text-primary" size={24} />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900">FaceAttend</span>
              </Link>

              <div className="flex items-center gap-1 md:gap-3">
                <NavLink to="/" label="Home" />
                <NavLink to="/register" label="Enroll" icon={UserPlus} />
                <NavLink to="/attendance" label="Scanner" icon={Camera} hideOnMobile />
                <NavLink to="/admin-login" label="Lecturer" icon={Lock} hideOnMobile />
              </div>
            </div>
          </nav>

          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/attendance" 
                element={
                  <MobileGuard>
                    <Attendance />
                  </MobileGuard>
                } 
              />
              <Route 
                path="/admin-login" 
                element={
                  <MobileGuard>
                    <AdminLogin />
                  </MobileGuard>
                } 
              />
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
          
          {/* Mobile Notice Bar */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
              <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-up pointer-events-auto">
                <div className="flex items-center gap-3">
                  <Laptop size={18} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest leading-none">Console Mode Restricted</span>
                </div>
                <div className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-md opacity-60">PC ONLY</div>
              </div>
            </div>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
