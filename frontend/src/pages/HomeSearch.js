import React, { useState, useEffect } from 'react';
import Intestazione from '../components/Intestazione';
import './HomeSearch.css';

const API_BASE = 'http://localhost:5000';

const WrappedDisplay = ({ stats, username, onClose }) => (
  <div className="wrap-modal">
    <div className="wrap-card fade-in">
      <button onClick={onClose} className="close-btn">✕</button>
      <p className="eyebrow">Wrapped del mese</p>
      <h2 className="wrap-title">{username}</h2>
      <p className="wrap-date">dal <span>{stats.data_inizio}</span></p>
      {stats ? (
        <div className="wrap-grid">
          <div className="wrap-stat">
            <p>CO₂ emessa</p>
            <span>{stats.totale_co2} kg</span>
          </div>
          <div className="wrap-stat">
            <p>Distanza</p>
            <span>{stats.totale_km} km</span>
          </div>
        </div>
      ) : (
        <div className="wrap-empty">Nessun dato disponibile.</div>
      )}
      <button onClick={onClose} className="primary-button">Chiudi</button>
    </div>
  </div>
);

function HomeSearch({ user }) {
  const [searchUser, setSearchUser] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [targetWrapped, setTargetWrapped] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/utenti`, { credentials: 'include' });
        const data = await res.json();
        if (data.ok) {
          setAllUsers(data.utenti);
          if (user.regione) {
            const sameRegion = data.utenti.filter(u =>
              u.regione === user.regione.toLowerCase() &&
              u.username !== user.username
            );
            setRecommended(sameRegion);
          }
        }
      } catch (e) {}
    };
    loadAllUsers();
  }, [user]);

  const handleSearchChange = (text) => {
    setSearchUser(text);
    if (targetUser) { setTargetWrapped(null); setTargetUser(null); }

    if (text.length > 0) {
      const currentUserName = user?.username?.toLowerCase();
      const filtered = allUsers.filter(u =>
        u.username.toLowerCase().startsWith(text.toLowerCase()) &&
        u.username.toLowerCase() !== currentUserName
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const showWrapped = async (username) => {
    try {
      const res = await fetch(`${API_BASE}/api/wrapped/${username}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setTargetUser(username);
        setTargetWrapped(data.dati);
        setSuggestions([]);
      } else {
        alert(data.messaggio || 'Nessun dato per questo utente.');
      }
    } catch (e) { alert("Errore connessione."); }
  };

  return (
    <div className="search-page">
      <Intestazione />

      <section className="search-hero">
        <div className="search-card">
          <p className="eyebrow">Search</p>
          <h2>Trova utenti sostenibili e compara i tuoi percorsi.</h2>
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Username..."
              value={searchUser}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="search-icon">🔎</span>
            {suggestions.length > 0 && (
              <div className="suggestion-list">
                {suggestions.map((u, i) => (
                  <div key={i} onClick={() => showWrapped(u.username)} className="suggestion-item">
                    <div>
                      <span className="suggestion-name">{u.username}</span>
                      {u.regione && <span className="suggestion-region">{u.regione}</span>}
                    </div>
                    <span className="suggestion-cta">Vedi →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {!searchUser && recommended.length > 0 && !targetUser && (
        <section className="flash-section fade-in">
          <div className="section-header">
            <p className="eyebrow">Utenti suggeriti</p>
            <h3>Flash green per te</h3>
            {user.regione && <span className="region-pill">📍 {user.regione}</span>}
          </div>
          <div className="flash-grid">
            {recommended.map((u, i) => (
              <button key={i} onClick={() => showWrapped(u.username)} className="flash-card">
                <div className="flash-avatar">{u.username.charAt(0).toUpperCase()}</div>
                <div className="flash-body">
                  <p className="flash-name">{u.username}</p>
                  <p className="flash-tag">Compatibile green</p>
                </div>
                <span className="flash-arrow">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {targetUser && targetWrapped && (
        <WrappedDisplay stats={targetWrapped} username={targetUser} onClose={() => { setTargetWrapped(null); setTargetUser(null); setSearchUser(''); }} />
      )}
    </div>
  );
}

export default HomeSearch;
