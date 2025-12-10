import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login'; 
import HomeSearch from './pages/HomeSearch'; 
import NewTrip from './pages/NewTrip'; 
import Profile from './pages/Profile'; 
import './App.css'; 

const API_BASE = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setUser(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { checkSession(); }, []);

  if (loading) return <div className="text-white p-10">Caricamento...</div>;

  // NUOVA LOGICA DI FLUSSO (La pagina di calcolo è la home per tutti)
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        <Routes>
          

          <Route path="/" element={<NewTrip user={user} />} /> {/* 1. Pagina principale di calcolo viaggio */}
          
          {/* 2. Pagina Login/Registrazione */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          
          {/* 3. Rotte protette (Accessibili solo se loggato, altrimenti redirect a Login) */}
          <Route path="/cerca" element={user ? <HomeSearch user={user} /> : <Navigate to="/login" />} />
          <Route path="/profilo" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* La Navbar è visibile solo quando l'utente è loggato */}
        {user && <Navbar />}
      </div>
    </Router>
  );
}

export default App;