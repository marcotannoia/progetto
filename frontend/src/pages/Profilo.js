import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Profilo.css';

const URL_SERVER = 'http://localhost:5000';

function PaginaProfilo({ user: utenteLoggato, setUser: setUtenteLoggato }) {
  
// campi dashboardW
  const [statistiche, setStatistiche] = useState({
    totaleViaggi: 0,
    totaleKm: 0,
    totaleCo2: 0,
    alberi: 0
  });

  const naviga = useNavigate();
// carico le statistiche 
  useEffect(() => {
    if (utenteLoggato) {
      calcolaStatistiche();
    }
  }, [utenteLoggato]);


  const calcolaStatistiche = async () => { 
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      const storicoViaggi = await risposta.json(); 
      
      if (Array.isArray(storicoViaggi)) {// se è un array valido
        
        
        const sommaKm = storicoViaggi.reduce((totale, viaggio) => { //facccio i vari calcoli
          const kmViaggio = viaggio.km || viaggio.km_percorsi || viaggio.distanza || 0;
          return totale + parseFloat(kmViaggio);
        }, 0);

        const sommaCo2 = storicoViaggi.reduce((totale, viaggio) => {
          const co2Viaggio = viaggio.co2 || viaggio.emissioni_co2 || 0;
          return totale + parseFloat(co2Viaggio);
        }, 0);
        // aggiorno
        setStatistiche({
          totaleViaggi: storicoViaggi.length,
          totaleKm: sommaKm.toFixed(1),
          totaleCo2: sommaCo2.toFixed(1),
          alberi: (sommaCo2 / 20).toFixed(1) 
        });
      }
    } catch (errore) {
      console.error("Impossibile recuperare lo storico:", errore); //errore generico
    }
  };

  const eseguiLogout = async () => {
    try {
      await fetch(`${URL_SERVER}/api/logout`, { method: 'POST' });
      setUtenteLoggato(null); 
      naviga('/login');// ritorno al login
    } catch (errore) {
      console.error("Errore durante il logout:", errore); // errore generico
    }
  };


  const ottieniIniziale = () => { // serve per l'immagine profilo
    if (utenteLoggato?.nome) return utenteLoggato.nome.charAt(0).toUpperCase();
    if (utenteLoggato?.username) return utenteLoggato.username.charAt(0).toUpperCase();
    return '?';
  };

  return ( // frontend
    <div className="profile-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">IL TUO IMPATTO</p>
      </header>

      <main className="hero-content">
        <div className="profile-card-container">
          <div className="profile-card fade-in">
            
        
            <div className="profile-left-col">
              <div className="profile-avatar">
                {ottieniIniziale()}
              </div>
              
              <div className="profile-identity">
              
                <h2>
                  {(utenteLoggato?.nome && utenteLoggato?.cognome) 
                    ? `${utenteLoggato.nome} ${utenteLoggato.cognome}` 
                    : utenteLoggato?.username}
                </h2>
                
                
                {(utenteLoggato?.nome || utenteLoggato?.cognome) && (
                  <p className="username-tag">@{utenteLoggato?.username}</p>
                )}
                
                {utenteLoggato?.regione && (
                  <span className="region-badge">{utenteLoggato.regione}</span>
                )}
              </div>

              <div className="profile-actions">
                <button className="logout-btn" onClick={eseguiLogout}>
                  Disconnettiti
                </button>
              </div>
            </div>

         
            <div className="profile-right-col">
              <h3 className="stats-title">Statistiche Generali</h3>
              
              <div className="stats-grid">
          
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleViaggi}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>

        
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleKm}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>

                
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleCo2} <small>kg</small></span>
                    <span className="stat-label">CO2 Risparmiata</span>
                  </div>
                </div>

         
                <div className="stat-item">
                  <span className="stat-icon">🌳</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.alberi}</span>
                    <span className="stat-label">Alberi Equivalenti</span>
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

export default PaginaProfilo;