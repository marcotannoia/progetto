import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuCalendarDays, LuLeaf, LuRoute } from 'react-icons/lu';
import { api } from '../api.js';
import TransportIcon from '../components/TransportIcon.jsx';
import './PaginaStoricoCompleto.css';

export default function PaginaStoricoCompleto() {
  const [trips, setTrips] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { api('/api/storico').then((data) => setTrips(data.viaggi || [])).catch((e) => { if (e.status === 401) navigate('/login'); else setError(e.message); }).finally(() => setLoading(false)); }, [navigate]);
  const summary = useMemo(() => ({ km: trips.reduce((sum, trip) => sum + Number(trip.km || 0), 0), co2: trips.reduce((sum, trip) => sum + Number(trip.co2 || 0), 0) }), [trips]);
  const groups = useMemo(() => trips.reduce((all, trip) => { const label = monthLabel(trip.data); (all[label] ||= []).push(trip); return all; }, {}), [trips]);
  return <div className="page history-page"><header className="history-header"><button className="history-back" onClick={() => navigate('/profilo')}><LuArrowLeft /> Profilo</button><div><h1>Storico viaggi</h1><p>Tutti i tuoi spostamenti, organizzati per mese.</p></div></header>{trips.length > 0 && <div className="history-summary"><article><LuRoute /><div><strong>{trips.length}</strong><span>viaggi</span></div></article><article><LuCalendarDays /><div><strong>{summary.km.toFixed(1)}</strong><span>km totali</span></div></article><article><LuLeaf /><div><strong>{summary.co2.toFixed(1)}</strong><span>kg CO₂ emessi</span></div></article></div>}<section className="panel history-panel">{loading ? <p className="empty-state">Caricamento…</p> : error ? <div className="message error">{error}</div> : trips.length === 0 ? <div className="empty-state"><LuLeaf /><h3>Nessun viaggio salvato</h3><button className="secondary-button" onClick={() => navigate('/')}>Inizia ora</button></div> : Object.entries(groups).map(([month, items]) => <section className="month-group" key={month}><h2>{month}</h2>{items.map((trip, index) => <article className="history-row" key={`${trip.data}-${index}`}><span className="icon-badge"><TransportIcon type={trip.mezzo} /></span><div className="history-route"><strong>{shortPlace(trip.partenza)} → {shortPlace(trip.arrivo)}</strong><small>{formatDate(trip.data)} · {vehicleName(trip.mezzo)}</small></div><div className="history-values"><strong>{Number(trip.km || 0).toFixed(1)} km</strong><small>{Number(trip.co2 || 0).toFixed(2)} kg CO₂</small></div></article>)}</section>)}</section></div>;
}
const dateOf = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; };
const monthLabel = (value) => { const date = dateOf(value); return date ? new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(date) : 'Data non disponibile'; };
const formatDate = (value) => { const date = dateOf(value); return date ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : value || 'Data non disponibile'; };
const shortPlace = (value = '') => value.split(',')[0] || 'Località';
const vehicleName = (type) => ({ piedi: 'A piedi', bike: 'Bicicletta', car: 'Auto', public_bus: 'Bus', veicolo_elettrico: 'Veicolo elettrico' }[type] || type);
