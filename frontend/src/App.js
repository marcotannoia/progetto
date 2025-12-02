import React, { useState } from 'react';
import './App.css';

function App() {
  // 1. Stati per memorizzare cosa scrive l'utente e cosa risponde il server
  const [partenza, setPartenza] = useState("Bari");
  const [arrivo, setArrivo] = useState("Milano");
  const [datiPercorso, setDatiPercorso] = useState(null);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  // 2. Funzione che scatta quando premi il bottone
  const calcolaPercorso = async () => {
    setCaricamento(true);
    setErrore("");
    setDatiPercorso(null);

    try {
      // Chiamata al tuo Backend Flask (che a sua volta chiamerà Google)
      const response = await fetch('http://localhost:5000/api/navigazione', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start: partenza, end: arrivo }),
      });

      const data = await response.json();

      if (response.ok) {
        // Se tutto va bene, salvo i dati del percorso
        setDatiPercorso(data);
      } else {
        // Se Flask dice errore (es. indirizzo non trovato)
        setErrore(data.errore || "Errore sconosciuto");
      }
    } catch (err) {
      console.error("Errore fetch:", err);
      setErrore("Impossibile contattare il server (Backend spento?)");
    } finally {
      setCaricamento(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🗺️ Calcolatore Percorsi</h1>
        
        {/* Input Partenza e Arrivo */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={partenza}
            onChange={(e) => setPartenza(e.target.value)}
            placeholder="Partenza (es. Bari)"
            style={{ padding: '10px', marginRight: '10px', fontSize: '16px' }}
          />
          <input
            type="text"
            value={arrivo}
            onChange={(e) => setArrivo(e.target.value)}
            placeholder="Arrivo (es. Milano)"
            style={{ padding: '10px', marginRight: '10px', fontSize: '16px' }}
          />
          <button 
            onClick={calcolaPercorso} 
            disabled={caricamento}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
          >
            {caricamento ? "Calcolo..." : "Cerca"}
          </button>
        </div>

        {/* Sezione Errori */}
        {errore && (
          <div style={{ color: 'red', backgroundColor: '#ffddd0', padding: '10px', borderRadius: '5px' }}>
            ⚠️ {errore}
          </div>
        )}

        {/* Sezione Risultati (Appare solo se abbiamo i dati) */}
        {datiPercorso && (
          <div style={{ border: '2px solid yellow', padding: '20px', marginTop: '20px', borderRadius: '10px', textAlign: 'left' }}>
            <h3 style={{ color: 'yellow', marginTop: 0 }}>Percorso Trovato!</h3>
            <p><strong>📍 Da:</strong> {datiPercorso.start_address}</p>
            <p><strong>🏁 A:</strong> {datiPercorso.end_address}</p>
            <hr style={{ borderColor: 'gray' }}/>
            <p style={{ fontSize: '1.2em' }}>🚗 Distanza: <strong>{datiPercorso.distanza_testo}</strong></p>
            <p style={{ fontSize: '1.2em' }}>⏱️ Tempo: <strong>{datiPercorso.durata}</strong></p>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;