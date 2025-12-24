import React, { useState } from 'react';
import './Login.css';

const URL_SERVER = 'http://localhost:5000'; // Costante per il backend

// Rinomino la prop in ingresso per coerenza interna
function PaginaAccesso({ setUser: impostaUtenteLoggato }) {
  
  // Stati per la gestione del form e dell'interfaccia
  const [datiInput, setDatiInput] = useState({ username: '', password: '', regione: '' });
  const [modalitaRegistrazione, setModalitaRegistrazione] = useState(false);
  const [messaggioErrore, setMessaggioErrore] = useState('');
  const [messaggioSuccesso, setMessaggioSuccesso] = useState('');

  const gestisciAuth = async (e) => {
    e.preventDefault(); // non si aggiorna a caso
    

    const endpoint = modalitaRegistrazione ? '/api/registrati' : '/api/login'; // endopoint possibili
    

    setMessaggioErrore(''); // reset messaggi
    setMessaggioSuccesso('');

    try {
      const risposta = await fetch(`${URL_SERVER}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datiInput)
      });
      
      const datiRisposta = await risposta.json();
      
      if (datiRisposta.ok) {
        if (modalitaRegistrazione) {
          setModalitaRegistrazione(false); 
          setMessaggioSuccesso("Registrazione avvenuta con successo! Ora puoi accedere."); //vai al login
        } else {
          impostaUtenteLoggato(datiRisposta); // setta l'utente loggato
        }
      } else {
        setMessaggioErrore(datiRisposta.errore || "Si è verificato un errore."); //errore generico
      }
    } catch (err) {
      console.error(err);
      setMessaggioErrore("Impossibile connettersi al server.");
    }
  };


  const aggiornaCampo = (campo, valore) => {
    setDatiInput(prev => ({ ...prev, [campo]: valore }));
  };

  return ( //frontend
    <div className="login-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">
          {modalitaRegistrazione ? 'Unisciti al cambiamento' : 'Monitora i tuoi progressi'}
        </p>
      </header>

      <main className="hero-content">
        <div className="search-card-container">
          <section className="main-search-card fade-in">
            <h2 className="card-title">
              {modalitaRegistrazione ? 'Crea Account' : 'Accedi'}
            </h2>
            
            <form onSubmit={gestisciAuth} className="login-form-stack">
              <input 
                className="card-input" 
                placeholder="Username" 
                value={datiInput.username} 
                onChange={e => aggiornaCampo('username', e.target.value)} 
              />
              
              <input 
                className="card-input" 
                type="password" 
                placeholder="Password" 
                value={datiInput.password} 
                onChange={e => aggiornaCampo('password', e.target.value)} 
              />
              
        
              <input 
                className="card-input" 
                placeholder="Regione (es. Puglia)" 
                value={datiInput.regione} 
                onChange={e => aggiornaCampo('regione', e.target.value)} 
              />

              <button className="cta-search-btn">
                {modalitaRegistrazione ? 'Registrati' : 'Accedi'}
              </button>
            </form>

            {messaggioErrore && (
              <div className="login-error-box">
                {messaggioErrore}
              </div>
            )}

            {messaggioSuccesso && (
              <div className="login-success-box">
                {messaggioSuccesso}
              </div>
            )}

            <div className="login-toggle-area">
              <p>{modalitaRegistrazione ? 'Hai già un account?' : 'Non hai un account?'}</p>
              <button 
                onClick={() => {
                  setModalitaRegistrazione(!modalitaRegistrazione);
                  setMessaggioErrore('');
                  setMessaggioSuccesso('');
                }} 
                className="toggle-link-btn"
              >
                {modalitaRegistrazione ? 'Vai al Login' : 'Registrati ora'}
              </button>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

export default PaginaAccesso;