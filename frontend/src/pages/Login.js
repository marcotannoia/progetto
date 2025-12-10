import React, { useState } from 'react';
import Intestazione from '../components/Intestazione';
import './Login.css';

const API_BASE = 'http://localhost:5000';

function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '', regione: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

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
          setIsRegister(false);
          setError("Registrazione avvenuta! Ora puoi accedere.");
        } else {
          setUser(data);
        }
      } else {
        setError(data.errore || "Errore durante l'operazione");
      }
    } catch (err) {
      setError("Errore di connessione al server");
    }
  };

  return ( 
    <div className="login-page">
      <Intestazione />
      <div className="login-card">
        <form onSubmit={handleAuth} className="login-form">
          <p className="eyebrow">{isRegister ? 'Registrati' : 'Accedi'}</p>
          <h1>{isRegister ? 'Crea account EcoTrack' : 'Bentornato su EcoTrack'}</h1>
          
          <input 
            className="login-input" 
            placeholder="Username" 
            value={form.username} 
            onChange={e => setForm({...form, username: e.target.value})} 
          />
          
          <input 
            className="login-input" 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})} 
          />
          
          <input 
            className="login-input" 
            placeholder="Regione" 
            value={form.regione} 
            onChange={e => setForm({...form, regione: e.target.value})} 
          />

          <button className="primary-button">
            {isRegister ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-toggle">
          <p>{isRegister ? 'Hai già un account?' : 'Non hai un account?'}</p>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }} 
            className="toggle-btn"
          >
            {isRegister ? 'Vai al Login' : 'Registrati ora'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
