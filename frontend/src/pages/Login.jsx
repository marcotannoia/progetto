import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { API_URL, api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import './Login.css';

export default function Login({ setUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', regione: '', codice: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const update = (key, value) => { setMessage(null); setForm((current) => ({ ...current, [key]: value })); };

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    if (!oauthError) return;
    const messages = {
      cancelled: 'Accesso con Google annullato.',
      invalid_state: 'Sessione di accesso scaduta. Riprova.',
      unavailable: 'Accesso con Google temporaneamente non disponibile.',
      failed: 'Non è stato possibile completare l’accesso con Google.',
    };
    setMessage({ type: 'error', text: messages[oauthError] || messages.failed });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  async function submit(event) {
    event.preventDefault(); setLoading(true); setMessage(null);
    const paths = { login: '/api/login', register: '/api/registrati', confirm: '/api/conferma' };
    try {
      const data = await api(paths[mode], { method: 'POST', body: JSON.stringify(form) });
      if (mode === 'login') setUser(data);
      if (mode === 'register') { setMode('confirm'); setMessage({ type: 'success', text: 'Controlla la tua email e inserisci il codice ricevuto.' }); }
      if (mode === 'confirm') { setMode('login'); setForm((current) => ({ ...current, password: '', codice: '' })); setMessage({ type: 'success', text: 'Account verificato. Ora puoi accedere.' }); }
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  }

  const title = mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Verifica account';
  return <div className="page login-page"><BrandHeader subtitle="Unisciti al cambiamento" /><section className="panel login-panel"><h2 className="panel-title">{title}</h2>{mode === 'login' && <><a className="google-button" href={`${API_URL}/api/oauth/google`}><GoogleIcon />Continua con Google</a><div className="login-divider"><span>oppure</span></div></>}<form className="field-stack" onSubmit={submit}><input className="field" autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => update('username', e.target.value)} required />{mode === 'register' && <><input className="field" type="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required /><input className="field" placeholder="Regione" value={form.regione} onChange={(e) => update('regione', e.target.value)} required /></>}{mode !== 'confirm' && <input className="field" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />}{mode === 'confirm' && <input className="field" inputMode="numeric" autoComplete="one-time-code" placeholder="Codice di conferma" value={form.codice} onChange={(e) => update('codice', e.target.value)} required />}{message && <div className={`message ${message.type}`}>{message.type === 'error' ? <LuCircleAlert /> : <LuCircleCheck />}{message.text}</div>}<button className="primary-button" disabled={loading}>{loading ? 'Attendi…' : title}</button></form><div className="login-switch">{mode === 'login' ? <><span>Non hai un account?</span><button className="text-button" onClick={() => { setMode('register'); setMessage(null); }}>Registrati ora</button></> : <><span>Hai già un account?</span><button className="text-button" onClick={() => { setMode('login'); setMessage(null); }}>Torna al login</button></>}</div><div className="legal-links"><a href="/privacy">Privacy</a><a href="/termini">Termini</a></div></section></div>;
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6.03 6.03 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}
