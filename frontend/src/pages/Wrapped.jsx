import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuHeart, LuLeaf, LuMapPinned, LuRoute } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import './Wrapped.css';

const vehicleNames = { piedi: 'A piedi', bike: 'Bicicletta', car: 'Auto', public_bus: 'Bus', veicolo_elettrico: 'Veicolo elettrico', Nessuno: 'Nessuno' };
export default function Wrapped() {
  const { username } = useParams(); const navigate = useNavigate(); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api(`/api/wrapped/${encodeURIComponent(username)}`).then((response) => setData(response.dati)).catch((e) => setError(e.message)); }, [username]);
  if (error) return <div className="page"><div className="message error">{error}</div><button className="secondary-button" onClick={() => navigate(-1)}>Indietro</button></div>;
  if (!data) return <div className="loading-screen">Caricamento…</div>;
  const km = Number(data.km_totali || 0); const emitted = Number(data.co2_risparmiata || 0); const saved = Math.max((km * .12) - emitted, 0).toFixed(1);
  const cards = [[LuRoute, data.viaggi_totali || 0, 'Viaggi totali'], [LuMapPinned, km.toFixed(1), 'Km percorsi'], [LuLeaf, `${saved} kg`, 'CO₂ risparmiata'], [LuHeart, vehicleNames[data.mezzo_preferito] || 'Nessuno', 'Mezzo preferito']];
  return <div className="page"><BrandHeader subtitle="Profilo pubblico" /><section className="panel public-profile"><aside><div className="profile-avatar">{username[0].toUpperCase()}</div><h2>@{username}</h2><p>Membro della community</p><button className="secondary-button" onClick={() => navigate(-1)}><LuArrowLeft /> Torna alla ricerca</button></aside><div><h3 className="section-heading">Riepilogo attività</h3><div className="public-stats">{cards.map(([Icon, value, label]) => <article key={label}><Icon /><strong>{value}</strong><span>{label}</span></article>)}</div></div></section></div>;
}
