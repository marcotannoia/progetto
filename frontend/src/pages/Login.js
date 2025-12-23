import React, { useState } from 'react';
import './Login.css';

const API_BASE = 'http://localhost:5000';

function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '', regione: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/registrati' : '/api/login';
    
    // Resetta messaggi
    setError('');
    setSuccess('');

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
          setSuccess("Registrazione avvenuta con successo! Ora puoi accedere.");
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
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">
          {isRegister ? 'Unisciti al cambiamento' : 'Track your progress'}
        </p>
      </header>

      <main className="hero-content">
        <div className="search-card-container">
          <section className="main-search-card fade-in">
            <h2 className="card-title">
              {isRegister ? 'Crea Account' : 'Accedi'}
            </h2>
            
            <form onSubmit={handleAuth} className="login-form-stack">
              <input 
                className="card-input" 
                placeholder="Username" 
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})} 
              />
              
              <input 
                className="card-input" 
                type="password" 
                placeholder="Password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
              
              <input 
                className="card-input" 
                placeholder="Regione (es. Puglia)" 
                value={form.regione} 
                onChange={e => setForm({...form, regione: e.target.value})} 
              />

              <button className="cta-search-btn">
                {isRegister ? 'Registrati' : 'Accedi'}
              </button>
            </form>

            {error && (
              <div className="login-error-box">
                {error}
              </div>
            )}

            {success && (
              <div className="login-success-box">
                {success}
              </div>
            )}

            <div className="login-toggle-area">
              <p>{isRegister ? 'Hai già un account?' : 'Non hai un account?'}</p>
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setSuccess('');
                }} 
                className="toggle-link-btn"
              >
                {isRegister ? 'Vai al Login' : 'Registrati ora'}
              </button>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;