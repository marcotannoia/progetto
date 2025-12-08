import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

// Componente Interno per visualizzare il Wrapped cercato (il Modale)
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
          <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Mezzo Preferito</p>
            <p className="text-xl font-bold text-yellow-400 capitalize">{stats.mezzo_preferito}</p>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-gray-500">Nessun dato disponibile.</p>
        </div>
      )}
      
      <button 
        onClick={onClose} 
        className="mt-8 w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition shadow-lg"
      >
        Chiudi
      </button>
    </div>
  </div>
);

function HomeSearch({ user }) {
  const [searchUser, setSearchUser] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Stati per il modale
  const [targetWrapped, setTargetWrapped] = useState(null); 
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/utenti`, { credentials: 'include' });
        const data = await res.json();
        if (data.ok) setAllUsers(data.utenti);
      } catch(e) {}
    };
    loadAllUsers();
  }, []);

  const handleSearchChange = (text) => {
    setSearchUser(text);
    // Se scrivo, resetto la vista del wrapped
    if (targetUser) {
        setTargetWrapped(null);
        setTargetUser(null);
    }

    if (text.length > 0) {
      const currentUser = user?.username?.toLowerCase();
      const filtered = allUsers.filter(u => 
        u.toLowerCase().startsWith(text.toLowerCase()) && u.toLowerCase() !== currentUser
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const showWrapped = async (username) => {
    setSearchUser(username);
    setSuggestions([]); 
    
    try {
      const res = await fetch(`${API_BASE}/api/wrapped/${username}`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.ok) {
        setTargetUser(username);
        setTargetWrapped(data.dati);
      } else {
        alert(data.messaggio || data.errore || 'Errore generico nel caricamento.');
      }
    } catch (e) {
      alert("Errore di connessione al server.");
    }
  };

  return (
    <div className="p-6 pt-12 min-h-screen pb-24">
      <h1 className="text-3xl font-bold text-center mb-8 tracking-tight">Cerca Amici 🔍</h1>
      
      <div className="relative max-w-md mx-auto">
        <div className="relative">
            <input 
            className="w-full p-4 bg-gray-800 rounded-xl border border-gray-600 text-white text-lg placeholder-gray-500 focus:border-blue-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            placeholder="Nome utente..."
            value={searchUser}
            onChange={(e) => handleSearchChange(e.target.value)}
            />
            {/* Icona lente assoluta a destra */}
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                🔎
            </span>
        </div>
        
        {/* Dropdown Suggerimenti */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-20 max-h-60 overflow-y-auto overflow-hidden">
            {suggestions.map((u, i) => (
              <div 
                key={i} 
                onClick={() => showWrapped(u)} 
                className="p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex justify-between items-center group transition-colors"
              >
                <span className="font-medium text-gray-200 group-hover:text-white">{u}</span>
                <span className="text-gray-500 text-sm group-hover:text-blue-400">Vedi profilo →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spazio vuoto o messaggio di benvenuto */}
      {!targetUser && (
          <div className="text-center mt-12 opacity-50">
              <p className="text-6xl mb-4">🌍</p>
              <p className="text-sm">Cerca un amico per confrontare <br/>il vostro impatto ambientale.</p>
          </div>
      )}
      
      {/* MODALE DEL WRAPPED CERCATO */}
      {targetUser && targetWrapped && (
        <WrappedDisplay 
          stats={targetWrapped} 
          username={targetUser} 
          onClose={() => { setTargetWrapped(null); setTargetUser(null); setSearchUser(''); }} 
        />
      )}

    </div>
  );
}

export default HomeSearch;