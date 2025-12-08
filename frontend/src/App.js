import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dati form
  const [form, setForm] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  // Dati calcolo
  const [percorso, setPercorso] = useState({ start: '', end: '' });
  const [veicoli, setVeicoli] = useState([]);
  const [mezzoScelto, setMezzoScelto] = useState('car');
  const [risultato, setRisultato] = useState(null);

  // 1. Al caricamento: controlla sessione e scarica veicoli
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Controlla utente
      const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setUser(data);
        loadVehicles();
      }
    } catch (e) {
      console.log("Non loggato");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/veicoli`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setVeicoli(data);
    } catch(e) {}
  };

  // 2. Login / Registrazione
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/registrati' : '/api/login';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // FONDAMENTALE
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.ok) {
        if (isRegister) {
            // Se registrato, fai login automatico o chiedi login
            setIsRegister(false);
            setError("Registrazione ok! Ora accedi.");
        } else {
            setUser(data);
            loadVehicles();
        }
      } else {
        setError(data.errore || data.messaggio || "Errore");
      }
    } catch (err) {
      setError("Server non raggiungibile");
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setRisultato(null);
    setForm({ username: '', password: '' });
  };

  // 3. Calcolo
  const calcola = async () => {
    if (!percorso.start || !percorso.end) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/navigazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...percorso, mezzo: mezzoScelto })
      });
      const data = await res.json();
      
      if (data.ok) setRisultato(data);
      else setError(data.errore);
      
    } catch (e) { setError("Errore calcolo"); }
  };

  // frontend leggero

  if (loading) return <div className="p-10 text-white text-center">Caricamento...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-sm bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <h1 className="text-2xl font-bold text-center mb-6">EcoRoute</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              placeholder="Username" 
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})} 
            />
            <input 
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              type="password" placeholder="Password" 
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} 
            />
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold">
              {isRegister ? 'Registrati' : 'Accedi'}
            </button>
          </form>
          {error && <p className="mt-4 text-red-400 text-center text-sm">{error}</p>}
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-gray-400 text-sm hover:text-white">
            {isRegister ? 'Torna al Login' : 'Crea un account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <div className="bg-gray-700 p-4 flex justify-between items-center">
          <div className="font-bold">Ciao, {user.username}</div>
          <button onClick={logout} className="text-red-400 text-sm hover:text-white">Esci</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input 
              className="p-3 bg-gray-900 border border-gray-600 rounded text-white"
              placeholder="Partenza"
              value={percorso.start} onChange={e => setPercorso({...percorso, start: e.target.value})}
            />
            <input 
              className="p-3 bg-gray-900 border border-gray-600 rounded text-white"
              placeholder="Arrivo"
              value={percorso.end} onChange={e => setPercorso({...percorso, end: e.target.value})}
            />
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
            Calcola CO₂
          </button>

          {risultato && (
            <div className="bg-gray-900 p-4 rounded border border-green-500 text-center">
              <p className="text-gray-400 text-sm">Distanza: {risultato.distanza_testo}</p>
              <p className="text-2xl font-bold text-green-400 mt-2">{risultato.emissioni_co2}</p>
              <p className="text-xs text-gray-500 mt-1">{risultato.start_address} ➝ {risultato.end_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;