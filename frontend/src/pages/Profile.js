import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Profile.css';

const API_BASE = 'http://localhost:5000';

function Profile({ user, setUser }) {
  const [stats, setStats] = useState({
    viaggi: 0,
    kmTotali: 0,
    co2Totale: 0,
    alberiEquivalenti: 0
  });

  const navigate = useNavigate();

  // Recupera lo storico e calcola le statistiche
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Ora questa chiamata funzionerà perché abbiamo aggiunto la rotta nel backend!
        const res = await fetch(`${API_BASE}/api/storico`,   { credentials: 'include' });
        const data = await res.json();
        
        console.log("Dati storico:", data); // Controlla la console del browser se hai dubbi

        if (Array.isArray(data)) {
          const viaggi = data.length;
          
          // Calcolo somma KM (gestisce diverse possibili chiavi nel JSON)
          const km = data.reduce((acc, curr) => {
            const val = curr.km || curr.km_percorsi || curr.distanza || 0;
            return acc + parseFloat(val);
          }, 0);

          // Calcolo somma CO2
          const co2 = data.reduce((acc, curr) => {
            const val = curr.co2 || curr.emissioni_co2 || 0;
            return acc + parseFloat(val);
          }, 0);
          
          setStats({
            viaggi,
            kmTotali: km.toFixed(1),
            co2Totale: co2.toFixed(1),
            // Stima: 1 albero assorbe circa 20kg di CO2 l'anno
            alberiEquivalenti: (co2 / 20).toFixed(1) 
          });
        }
      } catch (e) {
        console.error("Errore fetch stats", e);
      }
    };
    
    if(user) fetchStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
      setUser(null);
      navigate('/login');
    } catch (e) {
      console.error("Errore logout", e);
    }
  };

  // Logica Avatar: Prende l'iniziale del nome, oppure quella dell'username
  const getInitial = () => {
    if (user?.nome) return user.nome.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className="profile-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">IL TUO IMPATTO</p>
      </header>

      <main className="hero-content">
        <div className="profile-card-container">
          <div className="profile-card fade-in">
            
            {/* COLONNA SINISTRA: Info Utente */}
            <div className="profile-left-col">
              <div className="profile-avatar">
                {getInitial()}
              </div>
              
              <div className="profile-identity">
                {/* Mostra Nome Cognome se ci sono, altrimenti Username */}
                <h2>{(user?.nome && user?.cognome) ? `${user.nome} ${user.cognome}` : user?.username}</h2>
                
                {/* Se stiamo mostrando il nome reale, mostra l'username sotto come tag */}
                {(user?.nome || user?.cognome) && <p className="username-tag">@{user?.username}</p>}
                
                {user?.regione && <span className="region-badge">{user.regione}</span>}
              </div>

              <div className="profile-actions">
                <button className="logout-btn" onClick={handleLogout}>
                  Disconnettiti
                </button>
              </div>
            </div>

            {/* COLONNA DESTRA: Statistiche */}
            <div className="profile-right-col">
              <h3 className="stats-title">Statistiche Generali</h3>
              
              <div className="stats-grid">
                {/* Box 1: Viaggi */}
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats.viaggi}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>

                {/* Box 2: KM */}
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats.kmTotali}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>

                {/* Box 3: CO2 */}
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats.co2Totale} <small>kg</small></span>
                    <span className="stat-label">CO2 Risparmiata</span>
                  </div>
                </div>

                {/* Box 4: Alberi */}
                <div className="stat-item">
                  <span className="stat-icon">🌳</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats.alberiEquivalenti}</span>
                    <span className="stat-label">Alberi Utilizzati</span>
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

export default Profile;