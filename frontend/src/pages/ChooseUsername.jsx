import { useState } from 'react';
import { LuAtSign, LuCircleAlert } from 'react-icons/lu';
import { api } from '../api.js';
import BrandHeader from '../components/BrandHeader.jsx';
import './ChooseUsername.css';

export default function ChooseUsername({ setUser }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api('/api/profile/username', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      setUser(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="username-page">
      <div className="username-content">
        <BrandHeader subtitle="Completa il tuo profilo" />
        <section className="panel username-panel">
          <span className="username-icon" aria-hidden="true"><LuAtSign /></span>
          <h1>Scegli il tuo username</h1>
          <p>Sarà il nome con cui comparirai nella community EcoTrack.</p>

          <form className="field-stack" onSubmit={submit}>
            <label className="username-field">
              <span>@</span>
              <input
                className="field"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                  setError('');
                }}
                minLength="3"
                maxLength="30"
                autoComplete="username"
                autoFocus
                placeholder="il_tuo_username"
                required
              />
            </label>
            <small>3–30 caratteri: lettere, numeri, punto, trattino o underscore.</small>
            {error && <div className="message error"><LuCircleAlert />{error}</div>}
            <button className="primary-button" disabled={loading}>
              {loading ? 'Salvataggio…' : 'Continua'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
