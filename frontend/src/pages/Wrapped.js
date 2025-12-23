import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Wrapped.css'; // Useremo uno stile dedicato

const API_BASE = 'http://localhost:5000';

function Wrapped() {
  const { username } = useParams(); // Prende l'username dall'URL
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWrapped = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wrapped/${username}`);
        const json = await res.json();
        
        if (json.ok) {
          setData(json.dati);
        } else {
          setError(json.messaggio || "Utente non trovato");
        }
      } catch (err) {
        setError("Errore di connessione");
      } finally {
        setLoading(false);
      }
    };

    fetchWrapped();
  }, [username]);

  // Calcolo Risparmio (Simile alla logica della classifica)
  const calcolaRisparmio = () => {
    if (!data) return 0;
    // Stima: un'auto media emette ~120g (0.12kg) di CO2 per Km
    const co2Teorica = data.totale_km * 0.120;
    const risparmio = co2Teorica - data.totale_co2;
    return risparmio > 0 ? risparmio.toFixed(1) : "0.0";
  };

  if (loading) return <div className="wrapped-loading">Caricamento Wrapped...</div>;
  if (error) return <div className="wrapped-error">{error} <button onClick={() => navigate(-1)}>Torna indietro</button></div>;

  return (
    <div className="wrapped-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Profilo Pubblico</p>
      </header>

      <main className="hero-content">
        <div className="wrapped-card-container">
          <div className="wrapped-card fade-in">
            
            {/* COLONNA SINISTRA: Identità */}
            <div className="wrapped-left-col">
              <div className="wrapped-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="wrapped-identity">
                <h2>@{username}</h2>
                <p className="member-since">Membro dal {data.data_inizio}</p>
              </div>
              <button className="back-btn" onClick={() => navigate(-1)}>
                ← Torna alla ricerca
              </button>
            </div>

            {/* COLONNA DESTRA: Statistiche */}
            <div className="wrapped-right-col">
              <h3 className="stats-title">Riepilogo Attività</h3>
              
              <div className="stats-grid">
                
                {/* Viaggi */}
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    <span className="stat-value">{data.numero_viaggi}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>

                {/* KM */}
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                    <span className="stat-value">{data.totale_km}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>

                {/* Risparmio CO2 */}
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{calcolaRisparmio()} <small>kg</small></span>
                    <span className="stat-label">CO₂ Risparmiata</span>
                  </div>
                </div>

                {/* Mezzo Preferito */}
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <div className="stat-info">
                    <span className="stat-value capitalize">{data.mezzo_preferito}</span>
                    <span className="stat-label">Mezzo Preferito</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Wrapped;