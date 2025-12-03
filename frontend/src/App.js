import React, { useState, useEffect } from 'react';

// Mappa per convertire le classi Tailwind del tuo Python in colori CSS reali
const colorMap = {
  "bg-green-500": "#22c55e",
  "bg-blue-500": "#00f048ff",
  "bg-red-500": "#ee0000ff",
  "bg-orange-500": "#f97316"
};

function App() {
  // --- STATI ---
  const [partenza, setPartenza] = useState("");
  const [arrivo, setArrivo] = useState("");
  const [veicoli, setVeicoli] = useState([]); 
  const [mezzoSelezionato, setMezzoSelezionato] = useState(null);  //inizializzo a queste di sotto a niente tutto
  const [datiPercorso, setDatiPercorso] = useState(null);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  const getMezzoLabel = (id) => {
    const veicolo = veicoli.find(v => v.id === id); //cerco nell'array veicoli quello con id uguale a id
    return veicolo ? veicolo.label : id;
  };

  // --- 1. CARICAMENTO VEICOLI ALL'AVVIO --- // solo visualizzazione
  useEffect(() => {
  const fetchVeicoli = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/veicoli'); // <-- QUI
      const data = await response.json();
      setVeicoli(data);
    } catch (err) {
      console.error("Errore nel caricamento veicoli:", err);
      setErrore("Errore nel caricamento dei veicoli");
    }
  };

  fetchVeicoli();
}, []);


  // --- 2. CALCOLO PERCORSO ---
  const calcolaPercorso = async () => {
    setCaricamento(true);
    setErrore("");
    setDatiPercorso(null);

    try { // cosi  facendo gestisco un eventuale errore di connessione
      const response  = await fetch('http://localhost:5000/api/navigazione', { // chiama il backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            start: partenza, 
            end: arrivo, 
            mezzo: mezzoSelezionato 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDatiPercorso(data);
      } 
    } catch (err) {
      console.error("Errore fetch:", err); //errore generico 
    } finally {
       setCaricamento(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 font-sans">
      <header className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
        
        {/* Titolo */}
        <div className="flex items-center justify-center gap-2 mb-6">
            <h1 className="text-2xl font-bold">🗺️ Calcolatore Percorsi</h1>
        </div>
        
        {/* Input Partenza e Arrivo */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
             <label className="text-xs text-gray-400 ml-1">Partenza</label>
             <input
                type="text"
                value={partenza}
                onChange={(e) => setPartenza(e.target.value)}
                placeholder="Es. Bari"
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
          </div>
          <div>
             <label className="text-xs text-gray-400 ml-1">Arrivo</label>
             <input
                type="text"
                value={arrivo}
                onChange={(e) => setArrivo(e.target.value)}
                placeholder="Es. Milano"
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
          </div>
        </div>

        {/* --- SEZIONE BOTTONI VEICOLI --- */}
        <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">Scegli il mezzo:</p>
            <div className="grid grid-cols-4 gap-2">
                {veicoli.length > 0 ? (
                    veicoli.map((v) => {
                        const isSelected = mezzoSelezionato === v.id; // <- mi serve questo
                        const bgColor = colorMap[v.color] || '#4b5563'; 
                        
                        return (
                            <button
                                key={v.id}
                                onClick={() => setMezzoSelezionato(v.id)}
                                style={{
                                    backgroundColor: isSelected ? bgColor : '#374151',
                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                    borderColor: isSelected ? 'white' : 'transparent'
                                }}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 border-2
                                    hover:opacity-90 active:scale-95
                                `}
                            >
                                {/* L'icona qui arriva dal backend Python (es. stringa "🚗"), quindi non serve libreria */}
                                <span className="text-2xl mb-1">{v.icon}</span>
                                <span className="text-xs font-medium">{v.label}</span>
                            </button>
                        );
                    })
                ) : (
                    <p className="col-span-4 text-center text-gray-500 text-sm">Caricamento veicoli...</p>
                )}
            </div>
        </div>

        {/* Bottone Calcola */}
        <button 
          onClick={calcolaPercorso} 
          disabled={caricamento}
          className={`
            w-full py-3 rounded-lg font-bold text-lg transition-colors shadow-lg
            ${caricamento ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}
          `}
        >
          {caricamento ? "Calcolo in corso..." : "Cerca Percorso"}
        </button>

        {/* Sezione Errori */}
        {errore && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 flex items-center gap-2">
            <span>⚠️ {errore}</span>
          </div>
        )}

        {/* Sezione Risultati */}
        {datiPercorso && (
          <div className="mt-6 p-4 bg-gray-700/50 rounded-xl border border-yellow-500/30 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-yellow-400 font-bold text-lg mb-2 flex items-center gap-2">
                🎉 Percorso Trovato!
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
                <p><strong className="text-white">Da:</strong> {datiPercorso.start_address}</p>
                <p><strong className="text-white">A:</strong> {datiPercorso.end_address}</p>
                <div className="h-px bg-gray-600 my-2"></div>
                <div className="flex justify-between items-center text-lg text-white">
                    <span>🚗 Distanza:</span>
                    <span className="font-bold text-green-400">{datiPercorso.distanza_testo}</span>
                </div>
                <p><strong className="text-white">Mezzo scelto:</strong> {getMezzoLabel(mezzoSelezionato)}</p>
                {datiPercorso.tempo_testo && (
                    <div className="flex justify-between items-center text-lg text-white">
                        <span>⏱️ Tempo:</span>
                        <span className="font-bold text-blue-400">{datiPercorso.tempo_testo}</span>
                    </div>
                )}
                {/* --- NUOVA PARTE PER LE EMISSIONI --- */}
                {datiPercorso.emissioni_co2 && (
                    <div className="flex justify-between items-center text-lg text-white">
                        <span>🌍 CO2 emessa:</span>
                        <span className="font-bold text-orange-400">{datiPercorso.emissioni_co2}</span>
                    </div>
                )}
              </div>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;