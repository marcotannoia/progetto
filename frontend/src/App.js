import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';


const colorMap = {
  "bg-green-500": "#22c55e",
  "bg-blue-500": "#3b82f6",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316"
};

function App() {

  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [apiStatus, setApiStatus] = useState('checking');

  const [isRegister, setIsRegister] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const [partenza, setPartenza] = useState('');
  const [arrivo, setArrivo] = useState('');
  const [veicoli, setVeicoli] = useState([]);
  const [mezzoSelezionato, setMezzoSelezionato] = useState('car');
  const [datiPercorso, setDatiPercorso] = useState(null);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  useEffect(() => {
    checkApiHealth();
  }, []);

  useEffect(() => {
    if (apiStatus === 'healthy') {
      checkUserSession();
    }
  }, [apiStatus]);

  async function checkApiHealth() {
    console.log('🔍 Controllo connessione a:', API_BASE);
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('✅ Health check status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check data:', data);
        setApiStatus('healthy');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('❌ Errore connessione API:', error);
      setApiStatus('error');
    }
  }

  async function checkUserSession() {
    console.log('🔍 Controllo sessione utente...');
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('✅ Check sessione status:', res.status);
      const data = await res.json();
      console.log('✅ Check sessione data:', data);
      
      if (data.ok) {
        setUser({
          username: data.username,
          ruolo: data.ruolo,
          superuser: data.superuser
        });
        loadVehicles();
      }
    } catch (error) {
      console.log('❌ Utente non autenticato:', error);
    } finally {
      setCheckingSession(false);
    }
  }

  async function loadVehicles() {
    console.log('🚗 Caricamento veicoli...');
    try {
      const response = await fetch(`${API_BASE}/api/veicoli`, {
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('✅ Veicoli status:', response.status);
      const data = await response.json();
      console.log('✅ Veicoli data:', data);
      
      if (Array.isArray(data)) {
        setVeicoli(data);
      }
    } catch (error) {
      console.error('❌ Errore caricamento veicoli:', error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formPassword.trim()) {
      setFormError('Inserisci username e password');
      return;
    }

    console.log('🔐 Tentativo login per:', formUsername);
    
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword
        })
      });

      console.log('✅ Login status:', response.status);
      const data = await response.json();
      console.log('✅ Login data:', data);
      
      if (response.ok && data.ok) {
        setUser({
          username: data.username,
          ruolo: data.ruolo,
          superuser: data.superuser
        });
        setFormUsername('');
        setFormPassword('');
        setFormError(null);
        setIsRegister(false);
        loadVehicles();
      } else {
        setFormError(data.errore || 'Login fallito');
      }
    } catch (error) {
      console.error('❌ Errore login:', error);
      setFormError('Errore di connessione. Controlla che il backend sia in esecuzione su localhost:5000');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formPassword.trim()) {
      setFormError('Inserisci username e password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/registrati`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        setUser({
          username: data.username,
          ruolo: data.ruolo,
          superuser: data.superuser
        });
        setFormUsername('');
        setFormPassword('');
        setFormError(null);
        setIsRegister(false);
        loadVehicles();
      } else {
        setFormError(data.errore || 'Registrazione fallita');
      }
    } catch (error) {
      console.error('Errore registrazione:', error);
      setFormError('Errore di connessione al server');
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors'
      });
    } catch (error) {
      console.error('Errore logout:', error);
    }
    
    setUser(null);
    setDatiPercorso(null);
    setMezzoSelezionato('car');
  }

  async function calcolaPercorso() {
    if (!partenza.trim() || !arrivo.trim()) {
      setErrore('Inserisci partenza e arrivo');
      return;
    }

    setCaricamento(true);
    setErrore('');
    setDatiPercorso(null);

    try {
      const response = await fetch(`${API_BASE}/api/navigazione`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          start: partenza.trim(),
          end: arrivo.trim(),
          mezzo: mezzoSelezionato
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        setDatiPercorso(data);
        setErrore('');
      } else {
        setErrore(data.errore || 'Errore nel calcolo del percorso');
      }
    } catch (error) {
      console.error('Errore calcolo percorso:', error);
      setErrore('Errore di connessione al server di mappe');
    } finally {
      setCaricamento(false);
    }
  }

  if (checkingSession && apiStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Connessione al server...</p>
        </div>
      </div>
    );
  }
  if (apiStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Server non disponibile</h1>
          <p className="text-gray-400 mb-6">
            Il backend non è raggiungibile all'indirizzo: <br />
            <code className="bg-gray-700 px-2 py-1 rounded mt-2 inline-block">{API_BASE}</code>
          </p>
          <div className="text-left bg-gray-700 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-300 mb-2">Per risolvere:</p>
            <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
              <li>Apri un terminale nella cartella <code className="bg-gray-800 px-1 rounded">backend</code></li>
              <li>Esegui: <code className="bg-gray-800 px-1 rounded text-green-300">python app.py</code></li>
              <li>Attendi il messaggio "Server in esecuzione su http://localhost:5000"</li>
              <li>Ricarica questa pagina</li>
            </ol>
          </div>
          <button 
            onClick={checkApiHealth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Riprova connessione
          </button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h1 className="text-3xl font-bold text-white">EcoRoute</h1>
            <p className="text-gray-400 mt-2">Calcolatore percorsi ecologici</p>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Server connesso a {API_BASE}
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            {isRegister ? 'Crea Account' : 'Accedi'}
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-500 transition-colors"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-500 transition-colors"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isRegister ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </form>

          <div className="text-center pt-6 border-t border-gray-700 mt-6">
            <p className="text-gray-400">
              {isRegister ? 'Hai già un account?' : 'Non hai un account?'}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setFormError(null);
                }}
                className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isRegister ? 'Accedi' : 'Registrati'}
              </button>
            </p>
            
            <div className="mt-6 text-xs text-gray-500">
              <p>Account demo:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-700/50 p-2 rounded text-center">
                  <div className="text-gray-400">Utente</div>
                  <div>paolo / password</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded text-center">
                  <div className="text-gray-400">Admin</div>
                  <div>admin / adminpass</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {}
        <header className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-2xl border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">EcoRoute Calculator</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400">
                    Utente: <span className="text-blue-300">{user.username}</span>
                  </span>
                  {user.superuser && (
                    <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded-full text-xs">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Logout
            </button>
          </div>
        </header>

        {}
        <main className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
          {}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📍 Partenza
              </label>
              <input
                type="text"
                value={partenza}
                onChange={(e) => setPartenza(e.target.value)}
                placeholder="Es: Roma, Italia"
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && calcolaPercorso()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🎯 Arrivo
              </label>
              <input
                type="text"
                value={arrivo}
                onChange={(e) => setArrivo(e.target.value)}
                placeholder="Es: Milano, Italia"
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && calcolaPercorso()}
              />
            </div>
          </div>

          {}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🚗 Seleziona mezzo di trasporto
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {veicoli.length > 0 ? (
                veicoli.map((v) => {
                  const isSelected = mezzoSelezionato === v.id;
                  const bgColor = colorMap[v.color] || '#4b5563';
                  
                  return (
                    <button
                      key={v.id}
                      onClick={() => setMezzoSelezionato(v.id)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200
                        ${isSelected ? 'ring-2 ring-white ring-opacity-50 shadow-lg' : ''}
                      `}
                      style={{
                        backgroundColor: isSelected ? bgColor : 'rgba(55, 65, 81, 0.5)'
                      }}
                    >
                      <span className="text-2xl mb-1">{v.icon}</span>
                      <span className="text-xs font-medium">{v.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-4 text-center py-4 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  Caricamento veicoli...
                </div>
              )}
            </div>
          </div>

          {}
          <button
            onClick={calcolaPercorso}
            disabled={caricamento}
            className={`
              w-full py-3 rounded-lg font-bold text-lg transition-all duration-200 mb-4
              ${caricamento 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]'
              }
            `}
          >
            {caricamento ? '⏳ Calcolo in corso...' : '🎯 Calcola Percorso'}
          </button>

          {}
          {errore && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm mb-4">
              ⚠️ {errore}
            </div>
          )}

          {}
          {datiPercorso && (
            <div className="mt-6 p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-yellow-500/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>✅</span> Percorso Calcolato
              </h3>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Partenza</div>
                    <div className="font-medium">{datiPercorso.start_address}</div>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Arrivo</div>
                    <div className="font-medium">{datiPercorso.end_address}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                    <div className="text-xs text-blue-300 mb-1">Distanza</div>
                    <div className="text-lg font-bold">{datiPercorso.distanza_testo}</div>
                  </div>
                  
                  <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                    <div className="text-xs text-green-300 mb-1">Tempo</div>
                    <div className="text-lg font-bold">{datiPercorso.tempo_testo}</div>
                  </div>
                  
                  <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
                    <div className="text-xs text-orange-300 mb-1">CO₂</div>
                    <div className="text-lg font-bold">{datiPercorso.emissioni_co2}</div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Mezzo selezionato</div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {veicoli.find(v => v.id === datiPercorso.mezzo_scelto)?.label || datiPercorso.mezzo_scelto}
                    </div>
                    <div className="text-2xl">
                      {veicoli.find(v => v.id === datiPercorso.mezzo_scelto)?.icon || '🚗'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>EcoRoute Calculator © {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs">Backend: {API_BASE} | Utente: {user?.username}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;