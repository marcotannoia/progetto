import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

// Componente Modale (Invariato, lo includo per completezza)
const WrappedDisplay = ({ stats, username, onClose }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4 fade-in">
    <div className="bg-gray-800 p-8 rounded-xl border-2 border-green-500 max-w-sm w-full text-white shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-xl">✕</button>
      <h2 className="text-2xl font-extrabold text-center mb-1 text-green-400">Wrapped 2025</h2>
      <p className="text-center text-gray-400 mb-6">di <span className="text-white font-bold">{username}</span></p>
      {stats ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">CO₂ Emessa</p>
            <p className="text-3xl font-black text-red-400">{stats.totale_co2} kg</p>
          </div>
          <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Distanza</p>
            <p className="text-3xl font-black text-blue-400">{stats.totale_km} km</p>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center"><p className="text-gray-500">Nessun dato disponibile.</p></div>
      )}
      <button onClick={onClose} className="mt-8 w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition shadow-lg">Chiudi</button>
    </div>
  </div>
);

function HomeSearch({ user }) {
  const [searchUser, setSearchUser] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Ora conterrà oggetti {username, regione}
  const [recommended, setRecommended] = useState([]); // Utenti della stessa regione
  
  const [targetWrapped, setTargetWrapped] = useState(null); 
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/utenti`, { credentials: 'include' });
        const data = await res.json();
        if (data.ok) {
            setAllUsers(data.utenti);
            
            // FILTRO CONSIGLIATI: Stessa regione dell'utente loggato
            if (user.regione) {
                const sameRegion = data.utenti.filter(u => 
                    u.regione === user.regione.toLowerCase() && 
                    u.username !== user.username
                );
                setRecommended(sameRegion);
            }
        }
      } catch(e) {}
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
    // ... logica invariata ...
    try {
      const res = await fetch(`${API_BASE}/api/wrapped/${username}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setTargetUser(username);
        setTargetWrapped(data.dati);
        setSuggestions([]); // Pulisce i suggerimenti
      } else {
        alert(data.messaggio || 'Nessun dato per questo utente.');
      }
    } catch (e) { alert("Errore connessione."); }
  };

  return (
    <div className="p-6 pt-12 min-h-screen pb-24">
      <h1 className="text-3xl font-bold text-center mb-8 tracking-tight">Cerca Amici 🔍</h1>
      
      {/* BARRA DI RICERCA */}
      <div className="relative max-w-md mx-auto mb-8">
        <div className="relative">
            <input 
            className="w-full p-4 bg-gray-800 rounded-xl border border-gray-600 text-white text-lg placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Nome utente..."
            value={searchUser}
            onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">🔎</span>
        </div>
        
        {/* Dropdown Risultati Ricerca */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-20 overflow-hidden">
            {suggestions.map((u, i) => (
              <div key={i} onClick={() => showWrapped(u.username)} 
                className="p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex justify-between items-center">
                <div>
                    <span className="font-bold text-gray-200 block">{u.username}</span>
                    {u.regione && <span className="text-xs text-blue-400 uppercase">{u.regione}</span>}
                </div>
                <span className="text-gray-500 text-sm">Vedi profilo →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEZIONE CONSIGLIATI (Visibile se non stai cercando o se la ricerca è vuota) */}
      {!searchUser && recommended.length > 0 && !targetUser && (
          <div className="max-w-md mx-auto fade-in">
              <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 tracking-wider">
                  📍 Vicino a te ({user.regione})
              </h3>
              <div className="grid gap-3">
                  {recommended.map((u, i) => (
                      <div key={i} onClick={() => showWrapped(u.username)}
                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex justify-between items-center hover:bg-gray-700 cursor-pointer transition">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                  {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <p className="font-bold">{u.username}</p>
                                  <p className="text-xs text-green-400">Compatibile</p>
                              </div>
                          </div>
                          <span className="text-2xl">👉</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* MODALE WRAPPED */}
      {targetUser && targetWrapped && (
        <WrappedDisplay stats={targetWrapped} username={targetUser} onClose={() => { setTargetWrapped(null); setTargetUser(null); setSearchUser(''); }} />
      )}
    </div>
  );
}

export default HomeSearch;