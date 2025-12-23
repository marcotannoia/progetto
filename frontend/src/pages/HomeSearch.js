import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeSearch.css';

const API_BASE = 'http://localhost:5000';

function HomeSearch({ user }) {
  const [allUsers, setAllUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resUsers = await fetch(`${API_BASE}/api/utenti`);
      const dataUsers = await resUsers.json();
      if (dataUsers.ok) setAllUsers(dataUsers.utenti);

      const resLeader = await fetch(`${API_BASE}/api/classifica`);
      const dataLeader = await resLeader.json();
      if (dataLeader.ok) setLeaderboard(dataLeader.classifica);

    } catch (error) {
      console.error("Errore fetch dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const suggestedUsers = allUsers.filter(u => 
    u.username !== user.username &&
    user.regione && u.regione && 
    u.regione.toLowerCase() === user.regione.toLowerCase()
  );

  const searchResults = searchTerm 
    ? allUsers.filter(u => 
        u.username !== user.username &&
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleUserClick = (username) => {
    navigate(`/wrapped/${username}`);
  };

  const getRankEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="homesearch-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Community & Classifica</p>
      </header>

      <main className="search-content fade-in">
        
        <div className="search-bar-container">
          <input 
            className="main-search-input"
            placeholder="Cerca un utente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {!searchTerm && (
          <>
             <section className="leaderboard-section">
              <div className="section-header">
                <span className="section-icon">🏆</span>
                <h3>EcoSavers</h3>
              </div>

              <div className="leaderboard-list">
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 3).map((entry, index) => (
                    <div key={entry.username} className={`rank-card rank-${index + 1}`} onClick={() => handleUserClick(entry.username)} style={{cursor: 'pointer'}}>
                      <div className="rank-pos">{getRankEmoji(index)}</div>
                      <div className="rank-info">
                        <h4>@{entry.username}</h4>
                        <span className="rank-score">-{entry.risparmio} kg CO₂</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data-msg">Ancora nessun dato in classifica.</p>
                )}
              </div>
            </section>

            {suggestedUsers.length > 0 && (
              <section className="suggested-section">
                <div className="section-header">
                  <span className="section-icon">📍</span>
                  <h3>Vicino a te ({user.regione})</h3>
                </div>
                
                <div className="cards-grid">
                  {suggestedUsers.map(u => (
                    <div key={u.username} className="user-card suggested-card" onClick={() => handleUserClick(u.username)}>
                      <div className="card-avatar">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="card-info">
                        <h4>@{u.username}</h4>
                        <span className="region-tag">{u.regione}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {searchTerm && (
          <section className="results-section">
            <h3 className="section-title">Risultati</h3>
            <div className="cards-grid">
              {searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u.username} className="user-card" onClick={() => handleUserClick(u.username)}>
                    <div className="card-avatar simple">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="card-info">
                      <h4>@{u.username}</h4>
                      {u.regione && <span className="region-mini">{u.regione}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">Nessun utente trovato.</p>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default HomeSearch;