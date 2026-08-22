import { useState } from 'react';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import './Login.css';

export default function Login({ setUser }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', regione: '', codice: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const update = (key, value) => { setMessage(null); setForm((current) => ({ ...current, [key]: value })); };

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
  return <div className="page login-page"><BrandHeader subtitle="Unisciti al cambiamento" /><section className="panel login-panel"><h2 className="panel-title">{title}</h2><form className="field-stack" onSubmit={submit}><input className="field" autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => update('username', e.target.value)} required />{mode === 'register' && <><input className="field" type="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required /><input className="field" placeholder="Regione" value={form.regione} onChange={(e) => update('regione', e.target.value)} required /></>}{mode !== 'confirm' && <input className="field" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />}{mode === 'confirm' && <input className="field" inputMode="numeric" autoComplete="one-time-code" placeholder="Codice di conferma" value={form.codice} onChange={(e) => update('codice', e.target.value)} required />}{message && <div className={`message ${message.type}`}>{message.type === 'error' ? <LuCircleAlert /> : <LuCircleCheck />}{message.text}</div>}<button className="primary-button" disabled={loading}>{loading ? 'Attendi…' : title}</button></form><div className="login-switch">{mode === 'login' ? <><span>Non hai un account?</span><button className="text-button" onClick={() => { setMode('register'); setMessage(null); }}>Registrati ora</button></> : <><span>Hai già un account?</span><button className="text-button" onClick={() => { setMode('login'); setMessage(null); }}>Torna al login</button></>}</div></section></div>;
}
