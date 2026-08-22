import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LuLogIn, LuLogOut, LuRoute, LuSearch, LuUserRound } from 'react-icons/lu';
import { api } from './api.js';
import Dock from './components/Dock.jsx';
import Login from './pages/Login.jsx';
import NuovoViaggio from './pages/NuovoViaggio.jsx';
import PaginaStoricoCompleto from './pages/PaginaStoricoCompleto.jsx';
import Profilo from './pages/Profilo.jsx';
import Ricerca from './pages/Ricerca.jsx';
import Wrapped from './pages/Wrapped.jsx';
import './App.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { api('/api/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  async function logout() { try { await api('/api/logout', { method: 'POST' }); } catch { /* Sessione già scaduta. */ } setUser(null); navigate('/login'); }
  const items = [
    { icon: <LuRoute />, label: 'Percorso', active: location.pathname === '/', onClick: () => navigate('/') },
    ...(user ? [
      { icon: <LuSearch />, label: 'Community', active: location.pathname === '/cerca', onClick: () => navigate('/cerca') },
      { icon: <LuUserRound />, label: 'Profilo', active: ['/profilo', '/storico'].includes(location.pathname), onClick: () => navigate('/profilo') },
      { icon: <LuLogOut />, label: 'Esci', danger: true, onClick: logout },
    ] : [{ icon: <LuLogIn />, label: 'Accedi', active: location.pathname === '/login', onClick: () => navigate('/login') }]),
  ];
  if (loading) return <div className="loading-screen">EcoTrack</div>;
  return <div className="app-shell"><main className="page-body"><Routes><Route path="/" element={<NuovoViaggio user={user} />} /><Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />} /><Route path="/cerca" element={user ? <Ricerca user={user} /> : <Navigate to="/login" replace />} /><Route path="/profilo" element={user ? <Profilo user={user} setUser={setUser} /> : <Navigate to="/login" replace />} /><Route path="/storico" element={user ? <PaginaStoricoCompleto /> : <Navigate to="/login" replace />} /><Route path="/wrapped/:username" element={user ? <Wrapped /> : <Navigate to="/login" replace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><Dock items={items} /></div>;
}
export default function App() { return <BrowserRouter><AppContent /></BrowserRouter>; }
