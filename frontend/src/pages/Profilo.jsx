import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuFootprints, LuHistory, LuLeaf, LuLogOut, LuMapPinned, LuTreePine } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import TransportIcon from '../components/TransportIcon.jsx';
import './Profilo.css';

export default function Profilo({ user, setUser }) {
  const [trips, setTrips] = useState([]); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { api('/api/storico').then((data) => setTrips(data.viaggi || [])).catch((e) => setError(e.message)); }, []);
  const stats = useMemo(() => { const km = trips.reduce((sum, trip) => sum + Number(trip.km || 0), 0); const saved = trips.reduce((sum, trip) => sum + Math.max((Number(trip.km || 0) * .12) - Number(trip.co2 || 0), 0), 0); return { count: trips.length, km: km.toFixed(1), saved: saved.toFixed(1), trees: (saved / 20).toFixed(1) }; }, [trips]);
  async function logout() { try { await api('/api/logout', { method: 'POST' }); } finally { setUser(null); navigate('/login'); } }
  const statCards = [[LuFootprints, stats.count, 'Viaggi'], [LuMapPinned, stats.km, 'Km percorsi'], [LuLeaf, `${stats.saved} kg`, 'CO₂ risparmiata'], [LuTreePine, stats.trees, 'Alberi equivalenti']];
  return <div className="page"><BrandHeader subtitle="Il tuo impatto" /><section className="panel profile-panel"><aside className="profile-summary"><div className="profile-avatar">{user.username[0].toUpperCase()}</div><h2>@{user.username}</h2>{user.regione && <span className="region-chip">{user.regione}</span>}<button className="profile-logout" onClick={logout}><LuLogOut /> Disconnettiti</button></aside><div className="profile-main"><h3 className="section-heading">Statistiche generali</h3><div className="stats-grid">{statCards.map(([Icon, value, label]) => <article className="stat-card" key={label}><Icon /><strong>{value}</strong><span>{label}</span></article>)}</div><div className="recent-header"><h3 className="section-heading"><LuHistory /> Ultimi viaggi</h3>{trips.length > 0 && <button className="text-button" onClick={() => navigate('/storico')}>Vedi tutti</button>}</div>{error && <div className="message error">{error}</div>}{trips.length === 0 && !error ? <p className="empty-state">Nessun viaggio registrato.</p> : <div className="recent-list">{trips.slice(0, 4).map((trip, index) => <article className="trip-row" key={`${trip.data}-${index}`}><span className="icon-badge"><TransportIcon type={trip.mezzo} /></span><div><strong>{shortPlace(trip.partenza)} → {shortPlace(trip.arrivo)}</strong><small>{formatDate(trip.data)}</small></div><b>{Number(trip.km || 0).toFixed(1)} km</b></article>)}</div>}</div></section></div>;
}
function shortPlace(value = '') { return value.split(',')[0] || 'Località'; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value || 'Data non disponibile' : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date); }
