import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [messaggio, setMessaggio] = useState("In attesa del backend...");

  useEffect(() => {
    // Appena la pagina carica, chiamiamo il backend
    fetch('http://localhost:5000/api/ciao')
      .then(response => response.json()) // Trasformiamo la risposta in JSON
      .then(data => {
        console.log("Dati ricevuti:", data);
        setMessaggio(data.messaggio); // Aggiorniamo la scritta a video
      })
      .catch(error => console.error("Errore:", error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Frontend React</h1>
        <p>Messaggio dal backend:</p>
        {/* Qui mostriamo quello che ci ha detto Python */}
        <h2 style={{color: 'yellow'}}>{messaggio}</h2>
      </header>
    </div>
  );
}

export default App;