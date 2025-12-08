import React, { useState } from 'react';

const API_BASE = 'http://localhost:5000';

function Login({ setUser }) {
  // Stati per il form
  const [form, setForm] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  // Gestione del submit (Login o Registrazione)
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
        if (isRegister) {
          setIsRegister(false); // se la registrazione ha successo, torna al login
          setError("Registrazione avvenuta! Ora puoi accedere.");
        } else {
          setUser(data); // se ha fatto tutto allora stai apposto
        }
      } else {
        setError(data.errore || "Errore durante l'operazione"); // se bho qualcosa va storto
      }
    } catch (err) {
      setError("Errore di connessione al server"); //errore generico di connessione
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-sm bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleAuth} className="space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">
            {isRegister ? 'Crea Account EcoRoute' : 'Accedi a EcoRoute'}
          </h1>
          
          <div>
            <input 
              className="w-full p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" 
              placeholder="Username" 
              value={form.username} 
              onChange={e => setForm({...form, username: e.target.value})} 
            />
          </div>
          
          <div>
            <input 
              className="w-full p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" 
              type="password" 
              placeholder="Password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>

          <button 
            className="w-full py-3 bg-blue-600 rounded font-bold hover:bg-blue-500 transition transform hover:scale-[1.02]"
          >
            {isRegister ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-center text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 text-center pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">
            {isRegister ? 'Hai già un account?' : 'Non hai un account?'}
          </p>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }} 
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline"
          >
            {isRegister ? 'Vai al Login' : 'Registrati ora'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;