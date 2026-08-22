import { useEffect, useState } from 'react';
import { LuArrowRight, LuLeaf, LuMapPin, LuRotateCcw, LuTreePine, LuX } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import TransportIcon from '../components/TransportIcon.jsx';
import './NuovoViaggio.css';

export default function NuovoViaggio({ user }) {
  const [route, setRoute] = useState({ start: '', end: '' });
  const [vehicles, setVehicles] = useState([]);
  const [vehicle, setVehicle] = useState('car');
  const [result, setResult] = useState(null);
  const [treeInfo, setTreeInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { api('/api/veicoli').then(setVehicles).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!result) return undefined;
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [result]);
  async function calculate() {
    if (!route.start.trim() || !route.end.trim()) { setError('Inserisci partenza e destinazione.'); return; }
    setLoading(true); setError(''); setTreeInfo('');
    try {
      const data = await api('/api/navigazione', { method: 'POST', body: JSON.stringify({ ...route, mezzo: vehicle }) });
      setResult(data);
      const co2 = Number.parseFloat(data.emissioni_co2);
      if (co2 > 0) { const trees = await api('/api/calcolo-alberi', { method: 'POST', body: JSON.stringify({ co2 }) }); setTreeInfo(trees.messaggio); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  return <div className="page"><BrandHeader subtitle="Monitora i tuoi progressi" /><section className="panel trip-panel"><h2 className="panel-title">Trova il tuo percorso</h2><div className="route-fields"><label><LuMapPin /><input className="field" placeholder="Partenza (es. Bari)" value={route.start} onChange={(e) => setRoute({ ...route, start: e.target.value })} /></label><label><LuMapPin /><input className="field" placeholder="Destinazione (es. Milano)" value={route.end} onChange={(e) => setRoute({ ...route, end: e.target.value })} /></label></div><div className="vehicle-selector" aria-label="Mezzo di trasporto">{vehicles.map((item) => <button key={item.id} type="button" className={`vehicle-button ${vehicle === item.id ? 'active' : ''}`} onClick={() => setVehicle(item.id)}><span><TransportIcon type={item.id} /></span><small>{item.label || item.id}</small></button>)}</div>{error && <div className="message error">{error}</div>}<button className="primary-button" onClick={calculate} disabled={loading}>{loading ? 'Calcolo in corso…' : 'Calcola percorso'}</button>{!user && <p className="login-note">Accedi per salvare automaticamente il viaggio nel tuo storico.</p>}</section>{result && <div className="result-backdrop" role="dialog" aria-modal="true" aria-label="Risultato percorso"><section className="result-panel"><button className="result-close" onClick={() => setResult(null)} aria-label="Chiudi"><LuX /></button><div className="result-route"><span>Tratta calcolata</span><h2>{result.start_address}</h2><LuArrowRight /><h2>{result.end_address}</h2></div>{result.map_embed_url && <iframe className="result-map" title="Mappa interattiva del percorso" src={result.map_embed_url} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}<div className="result-stats"><article><LuLeaf /><small>Impatto stimato</small><strong>{result.emissioni_co2}</strong></article><article><LuTreePine /><small>Assorbimento naturale</small><strong>{treeInfo || 'Nessuna emissione rilevante'}</strong></article></div><div className="result-actions">{result.maps_link && <a className="secondary-button maps-link" href={result.maps_link} target="_blank" rel="noreferrer"><LuMapPin /> Apri in Google Maps</a>}<button className="secondary-button new-search" onClick={() => setResult(null)}><LuRotateCcw /> Nuova ricerca</button></div></section></div>}</div>;
}
