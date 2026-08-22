import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuMapPin, LuMedal, LuSearch, LuTrophy } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import './Ricerca.css';

export default function Ricerca({ user }) {
  const [users, setUsers] = useState([]); const [ranking, setRanking] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { Promise.all([api('/api/utenti'), api('/api/classifica')]).then(([a, b]) => { setUsers(a.utenti || []); setRanking(b.classifica || []); }).catch((e) => setError(e.message)); }, []);
  const filtered = useMemo(() => users.filter((item) => item.username !== user.username && item.username.toLowerCase().includes(query.toLowerCase())), [users, user.username, query]);
  const nearby = users.filter((item) => item.username !== user.username && item.regione && item.regione.toLowerCase() === user.regione?.toLowerCase());
  const open = (username) => navigate(`/wrapped/${username}`);
  return <div className="page"><BrandHeader subtitle="Community e classifica" /><div className="community-search"><LuSearch /><input className="field" placeholder="Cerca un utente…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>{error && <div className="message error">{error}</div>}{query ? <section className="community-section"><h3 className="section-heading"><LuSearch /> Risultati</h3><UserGrid users={filtered} open={open} /></section> : <><section className="community-section"><h3 className="section-heading"><LuTrophy /> EcoSavers</h3><div className="ranking-list">{ranking.slice(0, 3).map((item, index) => <button key={item.username} className="ranking-card" onClick={() => open(item.username)}><span className="rank-number"><LuMedal /> {index + 1}</span><strong>@{item.username}</strong><b>{item.risparmio} kg CO₂</b></button>)}{ranking.length === 0 && <p className="empty-state">La classifica è ancora vuota.</p>}</div></section>{nearby.length > 0 && <section className="community-section"><h3 className="section-heading"><LuMapPin /> Vicino a te · {user.regione}</h3><UserGrid users={nearby} open={open} /></section>}</>}</div>;
}
function UserGrid({ users, open }) { return <div className="user-grid">{users.map((item) => <button className="user-card" key={item.username} onClick={() => open(item.username)}><span>{item.username[0].toUpperCase()}</span><div><strong>@{item.username}</strong><small>{item.regione || 'Regione non indicata'}</small></div></button>)}{users.length === 0 && <p className="empty-state">Nessun utente trovato.</p>}</div>; }
