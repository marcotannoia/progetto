import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

function NewTrip({ user }) {
  const [percorso, setPercorso] = useState({ start: '', end: '' });
  const [mezzoScelto, setMezzoScelto] = useState('car');
  const [veicoli, setVeicoli] = useState([]);
  
  const [risultato, setRisultato] = useState(null); 
  // Nuovo stato per memorizzare il messaggio sugli alberi dal backend
  const [messaggioAlberi, setMessaggioAlberi] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/veicoli`)
      .then(res => res.json())
      .then(data => setVeicoli(data));
  }, []);

  const calcola = async () => {
    // Resettiamo i risultati precedenti prima del nuovo calcolo
    setRisultato(null);
    setMessaggioAlberi(null);

    try {
      // 1. Prima chiamata: Calcolo Navigazione
      const res = await fetch(`${API_BASE}/api/navigazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...percorso, mezzo: mezzoScelto })
      });
      const data = await res.json();
      
      if (data.ok) {
        setRisultato(data);

        // 2. Logica per chiamare la nuova API degli alberi
        // "data.emissioni_co2" è una stringa (es: "12.50 kg di CO2") o un messaggio di testo.
        // parseFloat legge i numeri all'inizio della stringa e si ferma al testo.
        const co2Value = parseFloat(data.emissioni_co2);

        // Se è un numero valido e maggiore di 0, chiamiamo la tua API
        if (!isNaN(co2Value) && co2Value > 0) {
            try {
                const treeRes = await fetch(`${API_BASE}/api/calcolo-alberi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ co2: co2Value })
                });
                const treeData = await treeRes.json();
                
                if (treeData.ok) {
                    setMessaggioAlberi(treeData.messaggio); // Salviamo il messaggio ricevuto
                }
            } catch (err) {
                console.error("Errore nel calcolo alberi:", err);
            }
        }
      } else {
        alert(data.errore);
      }
    } catch (e) { alert("Errore calcolo"); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">ECOTRACK ✏️</h1>
      
      {!user && (
        <div className="text-center mb-6">
          <Link to="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition">
            Accedi o Registrati per salvare i viaggi
          </Link>
        </div>
      )}

      {/* INPUT FORM */}
      <div className="space-y-4 max-w-md mx-auto">
        <input 
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white" 
          placeholder="LUOGO DI PARTENZA" 
          value={percorso.start} onChange={e => setPercorso({...percorso, start: e.target.value})} 
        />
        <input 
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white" 
          placeholder="LUOGO DI ARRIVO" 
          value={percorso.end} onChange={e => setPercorso({...percorso, end: e.target.value})} 
        />

        <div className="flex gap-2 justify-center py-4">
          {veicoli.map(v => (
            <button key={v.id} onClick={() => setMezzoScelto(v.id)}
              className={`p-3 rounded-lg text-2xl transition ${mezzoScelto === v.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {v.icon}
            </button>
          ))}
        </div>

        <button onClick={calcola} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg uppercase tracking-widest transition transform hover:scale-[1.02]">
          CALCOLA
        </button>
      </div>

      {/* RISULTATI */}
      {risultato && (
        <div className="mt-8 p-6 bg-gray-800 rounded-xl border-2 border-white max-w-md mx-auto fade-in">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">{risultato.start_address} <br/>⬇<br/> {risultato.end_address}</h2>
            
            <p className="text-gray-400 text-sm">CO2 CREATED:</p>
            <p className="text-3xl font-bold text-red-500 my-2">{risultato.emissioni_co2}</p>
            
            <div className="mt-6 text-left space-y-2 border-t border-gray-600 pt-4">
              <ul className="list-disc pl-5 text-gray-300">
      
                {messaggioAlberi ? (
                    <li>{messaggioAlberi} 🌳</li>
                ) : (

                    !isNaN(parseFloat(risultato.emissioni_co2)) && <li>Gli alberi possono respirare!</li>
                )}
              </ul>
            </div>

            {!user ? (
              <p className="mt-6 text-yellow-400 font-medium">
                Viaggio calcolato, ma non salvato. <Link to="/login" className="underline hover:text-yellow-300">Accedi</Link> per salvare i progressi!
              </p>
            ) : (
              <p className="mt-6 text-green-400 font-medium">
                Viaggio salvato con successo nel tuo storico!
              </p>
            )}
            <p className="mt-6 font-bold underline cursor-pointer">How can you do better?</p> 
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTrip;