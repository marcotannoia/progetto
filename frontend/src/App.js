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

  // NUOVO: Stato per il Wrapped
  const [wrapped, setWrapped] = useState(null); 
  const [mostraWrapped, setMostraWrapped] = useState(false);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) { setUser(data); loadVehicles(); }
    } catch (e) {} finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/veicoli`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setVeicoli(data);
    } catch(e) {}
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
        else { setUser(data); loadVehicles(); }
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

  // NUOVO: Funzione per scaricare il Wrapped
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

  if (loading) return <div className="text-white p-10">Caricamento...</div>;

  if (!user) {
    // ... (Login Form rimasto uguale al tuo originale) ...
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-sm bg-gray-800 p-8 rounded-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="User" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            <input className="w-full p-3 bg-gray-700 rounded text-white" type="password" placeholder="Pass" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <button className="w-full py-3 bg-blue-600 rounded">{isRegister ? 'Registrati' : 'Accedi'}</button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-sm text-gray-400">
            {isRegister ? 'Vai al Login' : 'Crea account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 relative">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 shadow-xl space-y-6">
        
        {/* Header con Bottone Wrapped */}
        <div className="flex justify-between items-center bg-gray-700 p-4 rounded">
          <h2 className="font-bold">Ciao, {user.username}</h2>
          <div className="space-x-2">
            <button onClick={caricaWrapped} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold">
              🎁 Il mio 2025
            </button>
            <button onClick={() => setUser(null)} className="text-red-400 text-sm">Esci</button>
          </div>
        </div>

        {/* Form Calcolo */}
        <div className="grid md:grid-cols-2 gap-4">
          <input className="p-3 bg-gray-900 border border-gray-600 rounded text-white" placeholder="Partenza" value={percorso.start} onChange={e => setPercorso({...percorso, start: e.target.value})} />
          <input className="p-3 bg-gray-900 border border-gray-600 rounded text-white" placeholder="Arrivo" value={percorso.end} onChange={e => setPercorso({...percorso, end: e.target.value})} />
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {veicoli.map(v => (
            <button key={v.id} onClick={() => setMezzoScelto(v.id)}
              className={`p-3 rounded-lg text-2xl ${mezzoScelto === v.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {v.icon}
            </button>
          ))}
        </div>

        <button onClick={calcola} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold">
          Calcola Viaggio
        </button>

        {risultato && (
          <div className="bg-gray-900 p-4 rounded border border-green-500 text-center">
            <p className="text-2xl font-bold text-green-400">{risultato.emissioni_co2}</p>
            <p className="text-gray-400 text-sm mt-1">{risultato.distanza_testo}</p>
          </div>
        )}
      </div>

      {/* MODALE WRAPPED (NUOVO) */}
      {mostraWrapped && wrapped && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-2xl max-w-md w-full text-center border-2 border-yellow-400 shadow-2xl relative">
            <button onClick={() => setMostraWrapped(false)} className="absolute top-4 right-4 text-gray-300 hover:text-white">✕</button>
            
            <h1 className="text-4xl font-extrabold text-yellow-400 mb-2">Il tuo 2025</h1>
            <p className="text-purple-200 text-sm mb-8">Ecco il tuo impatto su EcoRoute</p>

            <div className="space-y-6">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-sm text-gray-300">Viaggi Totali</p>
                <p className="text-3xl font-bold">{wrapped.numero_viaggi}</p>
              </div>
              
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-sm text-gray-300">KM Percorsi</p>
                <p className="text-3xl font-bold text-blue-300">{wrapped.totale_km} km</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-red-500/30">
                <p className="text-sm text-gray-300">CO₂ Emessa</p>
                <p className="text-4xl font-bold text-red-400">{wrapped.totale_co2} kg</p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">Il tuo mezzo preferito:</p>
                <p className="text-xl font-bold capitalize mt-1">{wrapped.mezzo_preferito}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;