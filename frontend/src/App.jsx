import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LuLogIn, LuLogOut, LuRoute, LuSearch, LuUserRound } from 'react-icons/lu';
import { api } from './api.js';
import BackendWakeup from './components/BackendWakeup.jsx';
import Dock from './components/Dock.jsx';
import Login from './pages/Login.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NuovoViaggio from './pages/NuovoViaggio.jsx';
import PaginaStoricoCompleto from './pages/PaginaStoricoCompleto.jsx';
import Profilo from './pages/Profilo.jsx';
import Ricerca from './pages/Ricerca.jsx';
import Wrapped from './pages/Wrapped.jsx';
import './App.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWakeup, setShowWakeup] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    let active = true;
    let retryTimer;
    const controller = new AbortController();
    const wakeupTimer = window.setTimeout(() => {
      if (active) setShowWakeup(true);
    }, 1400);
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    api('/api/me', { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          setUser(null);
          setLoading(false);
          return;
        }
        setShowWakeup(true);
        retryTimer = window.setTimeout(() => setRetryKey((key) => key + 1), 6000);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(wakeupTimer);
      window.clearTimeout(retryTimer);
    };
  }, [retryKey]);
  async function logout() { try { await api('/api/logout', { method: 'POST' }); } catch { /* Sessione già scaduta. */ } setUser(null); navigate('/login'); }
  const items = [
    { icon: <LuRoute />, label: 'Percorso', active: location.pathname === '/', onClick: () => navigate('/') },
    ...(user ? [
      { icon: <LuSearch />, label: 'Community', active: location.pathname === '/cerca', onClick: () => navigate('/cerca') },
      { icon: <LuUserRound />, label: 'Profilo', active: ['/profilo', '/storico'].includes(location.pathname), onClick: () => navigate('/profilo') },
      { icon: <LuLogOut />, label: 'Esci', danger: true, onClick: logout },
    ] : [{ icon: <LuLogIn />, label: 'Accedi', active: location.pathname === '/login', onClick: () => navigate('/login') }]),
  ];
  if (loading) {
    if (showWakeup) {
      return <BackendWakeup onRetry={() => setRetryKey((key) => key + 1)} />;
    }
    return <div className="loading-screen">EcoTrack</div>;
  }
  return <div className="app-shell"><main className="page-body"><Routes><Route path="/" element={<NuovoViaggio user={user} />} /><Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />} /><Route path="/privacy" element={<LegalPage type="privacy" />} /><Route path="/termini" element={<LegalPage type="terms" />} /><Route path="/cerca" element={user ? <Ricerca user={user} /> : <Navigate to="/login" replace />} /><Route path="/profilo" element={user ? <Profilo user={user} setUser={setUser} /> : <Navigate to="/login" replace />} /><Route path="/storico" element={user ? <PaginaStoricoCompleto /> : <Navigate to="/login" replace />} /><Route path="/wrapped/:username" element={user ? <Wrapped /> : <Navigate to="/login" replace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><Dock items={items} /></div>;
}
export default function App() { return <BrowserRouter><AppContent /></BrowserRouter>; }
