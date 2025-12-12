import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Intestazione from '../components/Intestazione';
import './NewTrip.css';

const API_BASE = 'http://localhost:5000';

function NewTrip({ user }) {// come semre inizalizzo gli stati
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
    setMessaggioAlberi(null); // ogni volta cancello i mex precedenti

    try {
      const res = await fetch(`${API_BASE}/api/navigazione`, {  // fetcho la rotta di calcolo
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...percorso, mezzo: mezzoScelto })
      });
      const data = await res.json();
      
      if (data.ok) {
        setRisultato(data);
        const co2Value = parseFloat(data.emissioni_co2); // leggo solo i numeri 
          if (!isNaN(co2Value) && co2Value > 0) {
            try {
                const treeRes = await fetch(`${API_BASE}/api/calcolo-alberi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ co2: co2Value })
                });
                const treeData = await treeRes.json();
                
                if (treeData.ok) {
                    setMessaggioAlberi(treeData.messaggio); // salvo il messaggio 
                }
            } catch (err) {
                console.error("Errore nel calcolo alberi:", err);
            }
        }
      } else {
        alert(data.errore);
      }
    } catch (e) { alert("Errore calcolo"); }
  };

  return (
    <div className="newtrip-page">
      <Intestazione />

      <section className="newtrip-hero">
        <div className="intro">
          <div>
            <p className="eyebrow">Pianifica in equilibrio</p>
            <h2>Parti, arrivi e calcola al centro della scena.</h2>
            <p className="subtext">
              Box ampi e simmetrici, pulsante in evidenza e scelta del mezzo sotto il tasto.
            </p>
          </div>
          {!user && (
            <div className="cta-box">
              <span className="cta-label">Nuovo qui?</span>
              <Link to="/login">Accedi o registrati per salvare i viaggi</Link>
            </div>
          )}
        </div>

        <div className="form-card">
          <div className="input-grid">
            <div className="field">
              <label>Luogo di partenza</label>
              <input
                className="trip-input"
                placeholder="Inserisci la città o l'indirizzo"
                value={percorso.start}
                onChange={e => setPercorso({ ...percorso, start: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Luogo di arrivo</label>
              <input
                className="trip-input"
                placeholder="Inserisci la destinazione"
                value={percorso.end}
                onChange={e => setPercorso({ ...percorso, end: e.target.value })}
              />
            </div>
          </div>

          <button onClick={calcola} className="primary-button">
            Calcola
          </button>

          <div className="vehicles">
            <p className="section-subtitle">Scegli il mezzo</p>
            <div className="vehicle-grid">
              {veicoli.map(v => (
                <button
                  key={v.id}
                  onClick={() => setMezzoScelto(v.id)}
                  className={`vehicle-button ${mezzoScelto === v.id ? 'selected' : ''}`}
                >
                  <span className="vehicle-icon">{v.icon}</span>
                  <span className="vehicle-label">{v.nome || v.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {risultato && (
        <section className="results-card">
          <div className="results-header">
            <h3>{risultato.start_address}</h3>
            <span className="arrow">⬇</span>
            <h3>{risultato.end_address}</h3>
          </div>

          {/* Mappa Google Embed con traffico */}
          {risultato.map_url && (
            <div className="map-container" style={{ 
              margin: '20px 0', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '1px solid rgba(34, 197, 94, 0.3)',
              height: '350px' // Altezza fissa per vedere bene la mappa
            }}>
              <iframe
                title="Mappa percorso"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={risultato.map_url}
              ></iframe>
            </div>
          )}
          {risultato && !['public_bus', 'bike', 'walking'].includes(risultato.mezzo_scelto) && (
            <p className="map-note">
              Per la mappa dinamica utilizziamo l'auto come mezzo rappresentativo per calcolare il percorso mostrato.
            </p>
          )}

          <div className="results-body">
            <div className="result-highlight">
              <p>CO₂ stimata</p>
              <span className="value">{risultato.emissioni_co2}</span>
            </div>

            <div className="tree-card">
              <div className="tree-icon">🌳</div>
              <div>
                <p className="tree-title">Alberi e compensazione</p>
                <p className="tree-text">
                  {messaggioAlberi
                    ? messaggioAlberi
                    : (!isNaN(parseFloat(risultato.emissioni_co2)) && 'Gli alberi possono respirare! Continua così.')}
                </p>
              </div>
            </div>

            {!user ? (
              <p className="result-note">
                Viaggio calcolato, ma non salvato. <Link to="/login">Accedi</Link> per salvare i progressi!
              </p>
            ) : (
              <p className="result-note success">Viaggio salvato con successo nel tuo storico!</p>
            )}  
          </div>
        </section>
      )}
    </div>
  );
}

export default NewTrip;
