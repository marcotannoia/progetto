import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dati form e stati
  const [form, setForm] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  // Dati calcolo
  const [percorso, setPercorso] = useState({ start: '', end: '' });
  const [veicoli, setVeicoli] = useState([]);
  const [mezzoScelto, setMezzoScelto] = useState('car');
  const [risultato, setRisultato] = useState(null);

  // Variabili Wrapped
  const [wrapped, setWrapped] = useState(null); 
  const [mostraWrapped, setMostraWrapped] = useState(false);

  // Variabili Ricerca & Navigazione
  const [view, setView] = useState('dashboard');
  const [searchUser, setSearchUser] = useState('');
  const [altruiWrapped, setAltruiWrapped] = useState(null);
  
  // NUOVO: Variabili per Autocompletamento
  const [allUsers, setAllUsers] = useState([]); // Lista completa utenti
  const [suggestions, setSuggestions] = useState([]); // Suggerimenti filtrati

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) { 
        setUser(data); 
        loadVehicles(); 
        loadAllUsers(); // <-- Carico anche gli utenti
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/veicoli`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setVeicoli(data);
    } catch(e) {}
  };

  // NUOVO: Scarica lista utenti per suggerimenti
  const loadAllUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/utenti`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setAllUsers(data.utenti);
    } catch(e) {}
  };

  // NUOVO: Gestione input ricerca con filtro
  const handleSearchChange = (text) => {
    setSearchUser(text);
    if (text.length > 0) {
      // Filtra utenti che iniziano con il testo inserito (ignorando maiuscole/minuscole)
      const filtered = allUsers.filter(u => 
        u.toLowerCase().startsWith(text.toLowerCase()) && u !== user.username
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // NUOVO: Click su un suggerimento
  const selectUser = (name) => {
    setSearchUser(name);
    setSuggestions([]); // Nascondi suggerimenti
    // Opzionale: cerca subito appena cliccato
    // cercaWrappedAltrui(name); 
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/registrati' : '/api/login';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.ok) {
        if (isRegister) { setIsRegister(false); setError("Ora accedi."); }
        else { 
          setUser(data); 
          loadVehicles(); 
          loadAllUsers(); // Carica utenti dopo login
        }
      } else setError(data.errore || "Errore");
    } catch (err) { setError("Errore connessione"); }
  };

  const calcola = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/navigazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...percorso, mezzo: mezzoScelto })
      });
      const data = await res.json();
      if (data.ok) setRisultato(data);
    } catch (e) {}
  };

  const caricaWrapped = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wrapped`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setWrapped(data.dati);
        setMostraWrapped(true);
      } else {
        alert(data.messaggio || "Fai almeno un viaggio prima!");
      }
    } catch (e) { alert("Errore nel caricamento Wrapped"); }
  };

  const cercaWrappedAltrui = async () => {
    if (!searchUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/wrapped/${searchUser}`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.ok) {
        setAltruiWrapped(data.dati);
        setView('profilo_altrui');
        setSuggestions([]); // Pulisci suggerimenti se aperti
      } else {
        alert("Utente non trovato o nessun viaggio.");
      }
    } catch (e) { alert("Errore ricerca"); }
  };

  if (loading) return <div className="text-white p-10">Caricamento...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-sm bg-gray-800 p-8 rounded-xl border border-gray-700">
          <form onSubmit={handleAuth} className="space-y-4">
            <h1 className="text-2xl font-bold text-center mb-6">EcoRoute Login</h1>
            <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="User" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            <input className="w-full p-3 bg-gray-700 rounded text-white" type="password" placeholder="Pass" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <button className="w-full py-3 bg-blue-600 rounded font-bold hover:bg-blue-500 transition">{isRegister ? 'Registrati' : 'Accedi'}</button>
          </form>
          {error && <p className="text-red-400 text-center mt-2 text-sm">{error}</p>}
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-sm text-gray-400 hover:text-white">
            {isRegister ? 'Vai al Login' : 'Crea account'}
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA 1: WRAPPED DI UN ALTRO UTENTE ---
  if (view === 'profilo_altrui' && altruiWrapped) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 fade-in">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl border border-purple-500 text-center relative">
          
          <button 
            onClick={() => { setView('dashboard'); setSearchUser(''); }} 
            className="absolute top-4 left-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold"
          >
            ← Torna Home
          </button>

          <div className="mb-8 mt-2">
            <h1 className="text-3xl font-extrabold text-purple-400 mb-1">Wrapped 2025</h1>
            <p className="text-xl text-white">di <span className="font-bold text-yellow-300">{searchUser}</span></p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <p className="text-sm text-gray-400 uppercase tracking-wide">Viaggi Totali</p>
              <p className="text-4xl font-bold text-white">{altruiWrapped.numero_viaggi}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-xl border border-blue-500/30">
                <p className="text-xs text-gray-400 uppercase">Distanza</p>
                <p className="text-2xl font-bold text-blue-300">{altruiWrapped.totale_km} km</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-xl border border-red-500/30">
                <p className="text-xs text-gray-400 uppercase">CO₂</p>
                <p className="text-2xl font-bold text-red-400">{altruiWrapped.totale_co2} kg</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-xl mt-4">
              <p className="text-sm text-gray-300">Mezzo Preferito</p>
              <p className="text-2xl font-bold capitalize mt-1 text-yellow-300">
                {altruiWrapped.mezzo_preferito}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA 2: DASHBOARD PRINCIPALE ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 relative">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 shadow-xl space-y-6 border border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-700 p-4 rounded-lg">
          <h2 className="font-bold text-lg">Ciao, {user.username} 👋</h2>
          <div className="space-x-3">
            <button onClick={caricaWrapped} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold transition">
              🎁 Il mio 2025
            </button>
            <button onClick={() => setUser(null)} className="text-red-400 text-sm hover:text-red-300">Esci</button>
          </div>
        </div>

        {/* Barra di Ricerca con Autocompletamento */}
        <div className="relative">
          <div className="bg-gray-700 p-2 pl-4 rounded-lg flex gap-2 items-center border border-gray-600 focus-within:border-blue-500 transition relative z-10">
            <span className="text-xl">🔍</span>
            <input 
              className="flex-1 p-2 bg-transparent text-white outline-none placeholder-gray-400"
              placeholder="Cerca un amico (es. paolo)"
              value={searchUser}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cercaWrappedAltrui()}
            />
            <button onClick={cercaWrappedAltrui} className="bg-purple-600 px-4 py-2 rounded-md font-bold hover:bg-purple-500 transition">
              Vai
            </button>
          </div>

          {/* Lista Suggerimenti (Dropdown) */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
              {suggestions.map((u, i) => (
                <div 
                  key={i} 
                  onClick={() => selectUser(u)}
                  className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 text-gray-200"
                >
                  {u}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Calcolo */}
        <div className="grid md:grid-cols-2 gap-4">
          <input className="p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-green-500 outline-none" placeholder="Partenza" value={percorso.start} onChange={e => setPercorso({...percorso, start: e.target.value})} />
          <input className="p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-green-500 outline-none" placeholder="Arrivo" value={percorso.end} onChange={e => setPercorso({...percorso, end: e.target.value})} />
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {veicoli.map(v => (
            <button key={v.id} onClick={() => setMezzoScelto(v.id)}
              className={`p-3 rounded-lg text-2xl transition transform hover:scale-110 ${mezzoScelto === v.id ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'bg-gray-700 hover:bg-gray-600'}`}>
              {v.icon}
            </button>
          ))}
        </div>

        <button onClick={calcola} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg shadow-lg shadow-green-900/50 transition transform hover:scale-[1.02]">
          Calcola Viaggio
        </button>

        {risultato && (
          <div className="bg-gray-900 p-6 rounded-xl border border-green-500 text-center fade-in mt-4">
            <p className="text-gray-400 text-sm mb-1">Hai emesso:</p>
            <p className="text-3xl font-bold text-green-400 mb-2">{risultato.emissioni_co2}</p>
            <div className="w-full h-px bg-gray-800 my-3"></div>
            <p className="text-gray-300 font-medium">{risultato.distanza_testo}</p>
            <p className="text-xs text-gray-500 mt-1">{risultato.start_address} <span className="text-green-500">➜</span> {risultato.end_address}</p>
          </div>
        )}
      </div>

      {/* MODALE PER IL "MIO" WRAPPED */}
      {mostraWrapped && wrapped && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 fade-in backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 p-1 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
            <div className="bg-gray-900 p-8 rounded-xl text-center relative h-full">
                <button onClick={() => setMostraWrapped(false)} className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl font-bold">✕</button>
                
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">Il tuo 2025</h1>
                
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Viaggi Totali</p>
                        <p className="text-3xl font-bold text-white">{wrapped.numero_viaggi}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Totale CO₂</p>
                        <p className="text-3xl font-bold text-red-400">{wrapped.totale_co2} kg</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">Mezzo preferito</p>
                        <p className="text-xl font-bold text-blue-400 capitalize mt-1">{wrapped.mezzo_preferito}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;