import React, { useState, useEffect } from 'react';
import './HomeSearch.css';

const API_BASE = 'http://localhost:5000';

// Icone SVG per la classifica
const RankIcons = {
  1: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.21 13.89L7 21L12 17L17 21L15.79 13.88" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  2: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 21L12 17L17 21L15.79 13.88"/></svg>,
  3: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 21L12 17L17 21L15.79 13.88"/></svg>
};

function HomeSearch({ user, theme, toggleTheme }) {
  const [searchUser, setSearchUser] = useState('');
  const [leaderboard, setLeaderboard] = useState([]); 
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/utenti`, { credentials: 'include' });
        const data = await res.json();
        if (data.ok) setAllUsers(data.utenti);
      } catch (e) {}
    };

    const loadLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/classifica`, { credentials: 'include' });
        const data = await res.json();
        if (data.ok) setLeaderboard(data.classifica);
      } catch (e) { console.error("Errore classifica", e); }
    };

    loadUsers();
    loadLeaderboard();
  }, []);

  const handleSearchChange = (text) => {
    setSearchUser(text);
    if (text.length > 0) {
      const filtered = allUsers.filter(u => u.username.toLowerCase().startsWith(text.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="search-page">
      {/* NAVBAR RIMOSSA */}

      <div className="hero-content-search">
        <div className="search-dashboard">
          
          <div className="search-panel">
            <div className="search-label-tag">SEARCH</div>
            <h2>Trova utenti sostenibili</h2>
            
            <div className="search-input-group">
              <input 
                className="big-search-input"
                placeholder="Cerca un username..."
                value={searchUser}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <button className="search-action-btn">Cerca</button>
            </div>
            
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((u, i) => (
                  <div key={i} className="suggestion-row">
                    <span>@{u.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="leaderboard-panel">
            <div className="lb-header">
              <span className="lb-tag">TOP 3</span>
              <h3>🏆 Hall of Fame</h3>
            </div>

            <div className="rank-list">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 3).map((u, index) => (
                  <div key={index} className={`rank-card rank-${index + 1}`}>
                    <div className="rank-left-group">
                      <div className="rank-number">{index + 1}</div>
                      <div className="rank-avatar">
                        {RankIcons[index + 1] || RankIcons[3]}
                      </div>
                      <div className="rank-info">
                        <span className="rank-name">{u.username}</span>
                        <span className="rank-badge">
                          {index === 0 ? "👑 Leader" : "Eco Saver"}
                        </span>
                      </div>
                    </div>
                    <div className="rank-score">
                      +{u.risparmio} <span>kg</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Classifica in aggiornamento...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HomeSearch;