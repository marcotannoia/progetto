import React, { useState, useEffect } from 'react';
import './NewTrip.css';

const API_BASE = 'http://localhost:5000';

// Icone Veicoli SVG - "Piedi" AGGIORNATA
const VehicleIcons = {
  // NUOVA ICONA: Persona che cammina (più chiara e dinamica)
  piedi: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M16 8h-3a2 2 0 0 0-2 2v3l-3 7"/><path d="M11 13l3 7"/><path d="M13 8l4 6"/></svg>,
  
  bike: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6l-5 5.5"/><path d="M15 6a2 2 0 0 1 2 2v4"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>,
  car: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  public_bus: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
  veicolo_elettrico: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 16h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M10 2v5h4l-2 5"/></svg>
};

function NewTrip({ user, theme, toggleTheme }) {
  const [percorso, setPercorso] = useState({ start: '', end: '' });
  const [mezzoScelto, setMezzoScelto] = useState('car');
  const [veicoli, setVeicoli] = useState([]);
  const [risultato, setRisultato] = useState(null); 
  const [messaggioAlberi, setMessaggioAlberi] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/veicoli`)
      .then(res => res.json())
      .then(data => setVeicoli(data));
  }, []);

  const calcola = async () => {
    setRisultato(null);
    setMessaggioAlberi(null);
    try {
      const res = await fetch(`${API_BASE}/api/navigazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...percorso, mezzo: mezzoScelto })
      });
      const data = await res.json();
      if (data.ok) {
        setRisultato(data);
        const co2Value = parseFloat(data.emissioni_co2); 
          if (!isNaN(co2Value) && co2Value > 0) {
            try {
                const treeRes = await fetch(`${API_BASE}/api/calcolo-alberi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ co2: co2Value })
                });
                const treeData = await treeRes.json();
                if (treeData.ok) setMessaggioAlberi(treeData.messaggio);
            } catch (err) { console.error(err); }
        }
      } else { alert(data.errore); }
    } catch (e) { alert("Errore calcolo"); }
  };

  return (
    <div className="newtrip-page">
      
      {/* HERO SECTION AGGIUNTA */}
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Track your progress</p>
      </header>

      <main className="hero-content">
        <div className="search-card-container">
          <section className="main-search-card fade-in">
            <h2 className="card-title">Trova il tuo percorso</h2>
            
            <div className="input-fields">
              <input
                className="card-input"
                placeholder="Partenza (es. Bari)"
                value={percorso.start}
                onChange={e => setPercorso({ ...percorso, start: e.target.value })}
              />
              <input
                className="card-input"
                placeholder="Destinazione (es. Milano)"
                value={percorso.end}
                onChange={e => setPercorso({ ...percorso, end: e.target.value })}
              />
            </div>

            <div className="vehicle-selector">
              {veicoli.map(v => (
                <button
                  key={v.id}
                  onClick={() => setMezzoScelto(v.id)}
                  className={`v-btn ${mezzoScelto === v.id ? 'active' : ''}`}
                >
                  <div className="v-circle">
                    {VehicleIcons[v.id] || <span>🚗</span>}
                  </div>
                  <span className="v-label">{v.label || v.id}</span>
                </button>
              ))}
            </div>

            <button onClick={calcola} className="cta-search-btn">
              Calcola Percorso
            </button>
          </section>
        </div>
        <div className="leaf-decoration"></div>
      </main>

      {/* Overlay Risultati */}
      {risultato && (
        <section className="results-overlay fade-in">
          <div className="results-content-card">
            <button className="close-icon" onClick={() => setRisultato(null)}>✕</button>
            
            <div className="res-left">
               <div className="res-header-mini">
                  <span>TRATTA CALCOLATA</span>
                  <h3>{risultato.start_address} <span className="arrow-green">➔</span> {risultato.end_address}</h3>
               </div>
               {risultato.map_url && (
                <div className="res-map-big">
                  <iframe title="Map" width="100%" height="100%" src={risultato.map_url} style={{border:0}}></iframe>
                </div>
              )}
            </div>

            <div className="res-right">
              <div className="stat-box co2-box">
                <p className="stat-label">IMPATTO CO₂</p>
                <span className="stat-giant">{risultato.emissioni_co2}</span>
                <span className="stat-sub">Stima calcolata sul mezzo scelto</span>
              </div>

              <div className="stat-box tree-box">
                <div className="tree-icon-bg">🌳</div>
                <div>
                   <p className="stat-label">COMPENSAZIONE NATURALE</p>
                   <span className="stat-desc">{messaggioAlberi || "Nessun impatto rilevante, ottimo lavoro!"}</span>
                </div>
              </div>

              <button className="new-search-btn" onClick={() => setRisultato(null)}>
                Effettua nuova ricerca
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default NewTrip;