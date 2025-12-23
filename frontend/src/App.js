// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login'; 
import HomeSearch from './pages/HomeSearch'; 
import NewTrip from './pages/NewTrip'; 
import Profile from './pages/Profile'; 
import Wrapped from './pages/Wrapped'; // <--- IMPORTA WRAPPED
import Iridescence from './components/Iridescence'; 
import Dock from './components/Dock'; 
import './App.css'; 

const API_BASE = 'http://localhost:5000';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const navigate = useNavigate(); 
  const location = useLocation();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = ''; 
    document.body.classList.add(`${theme}-mode`); 
  }, [theme]);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setUser(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { checkSession(); }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    setUser(null);
    navigate('/login');
  };

  const dockItems = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
      label: 'Home',
      onClick: () => navigate('/')
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
      label: 'Cerca',
      onClick: () => navigate('/cerca')
    },
    ...(user ? [{
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
      label: 'Profilo',
      onClick: () => navigate('/profilo')
    }] : []),
    {
      icon: theme === 'dark' 
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onClick: toggleTheme
    },
    user ? {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" color="#ef4444"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
      label: 'Logout',
      onClick: handleLogout
    } : {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>,
      label: 'Login',
      onClick: () => navigate('/login')
    }
  ];

  if (loading) return <div style={{color:'white', padding:'20px'}}>Caricamento...</div>;

  return (
    <div className={`app-shell ${theme}-theme`}>
      <Iridescence color={[0.1, 0.3, 0.2]} mouseReact={false} amplitude={0.1} speed={0.2} />

      <main className="page-body" style={{ position: 'relative', zIndex: 1, paddingBottom: '100px' }}>
        <Routes>
          <Route path="/" element={<NewTrip user={user} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/cerca" element={user ? <HomeSearch user={user} /> : <Navigate to="/login" />} />
          <Route path="/profilo" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          
          {/* NUOVA ROTTA WRAPPED */}
          <Route path="/wrapped/:username" element={user ? <Wrapped /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {location.pathname !== '/login_NO' && <Dock items={dockItems} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}