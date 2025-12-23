import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; 
import HomeSearch from './pages/HomeSearch'; 
import NewTrip from './pages/NewTrip'; 
import Profile from './pages/Profile'; 
import Iridescence from './components/Iridescence'; 
import './App.css'; 

const API_BASE = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Inizializza il tema
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Sincronizza la classe sul body
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

  if (loading) return <div style={{color:'white', padding:'20px'}}>Caricamento...</div>;

  return (
    <Router>
      <div className={`app-shell ${theme}-theme`}>
        
        {/* CONFIGURAZIONE SFONDO "GREEN-ONLY" */}
        <Iridescence 
          color={
            theme === 'dark' 
              ? [0.1, 0.3, 0.2]       // Notte: Verde Foresta Profondo
              : [0.25, 0.6, 0.35]     // Giorno: Verde Natura (Vibrante ma non neon, né bianco)
          } 
          mouseReact={false}
          amplitude={0.1}
          speed={1.0}
        />

        <main className="page-body" style={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<NewTrip user={user} theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
            <Route path="/cerca" element={user ? <HomeSearch user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
            <Route path="/profilo" element={user ? <Profile user={user} setUser={setUser} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;