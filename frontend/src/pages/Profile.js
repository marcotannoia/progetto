import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Profile.css';

const API_BASE = 'http://localhost:5000';

function Profile({ user, setUser }) {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/wrapped`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.ok) setStats(data.dati); });
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    setUser(null);
    navigate('/');
  };

  return (
    <div className="profile-page">
      {/* NAVBAR RIMOSSA */}

      <section className="profile-hero">
        <p className="eyebrow">Il tuo profilo</p>
        <h1>{user.username}</h1>
        <p className="hero-sub">Track your consumes</p>
      </section>

      <section className="profile-stats">
        {stats ? (
          <>
            <div className="stat-card">
              <p>Statistiche dal</p>
              <span className="stat-value">{stats.data_inizio}</span>
              <small>Periodo attuale di monitoraggio</small>
            </div>

            <div className="stat-card accent">
              <p>CO₂ totale emessa</p>
              <span className="stat-value">{stats.totale_co2} kg</span>
              <small>Riduci scegliendo mezzi più green</small>
            </div>

            <div className="stat-card">
              <p>Distanza totale</p>
              <span className="stat-value">{stats.totale_km} km</span>
              <small>Ogni km ottimizzato conta</small>
            </div>

            <div className="stat-card">
              <p>Mezzo più usato</p>
              <span className="stat-value">{stats.mezzo_preferito}</span>
              <small>Prova alternative a minor impatto</small>
            </div>
          </>
        ) : (
          <div className="stat-card empty">
            <p>Nessun viaggio registrato.</p>
            <small>Inizia ora e costruisci il tuo wrapped!</small>
            <Link to="/" className="link-btn">Vai a calcolare</Link>
          </div>
        )}
      </section>

      {/* Il Logout qui rimane come "backup", anche se c'è nel Dock */}
      <button onClick={handleLogout} className="primary-button logout-btn">
        Logout
      </button>
    </div>
  );
}

export default Profile;