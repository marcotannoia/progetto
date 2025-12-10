import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

function Profile({ user, setUser }) {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/wrapped`, { credentials: 'include' }) //fetcho i dati del wrapped
      .then(res => res.json())
      .then(data => { if (data.ok) setStats(data.dati); });
  }, []);

  const handleLogout = async () => { // funzione di logout
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    setUser(null);
    navigate('/');
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">IL TUO PROFILO 🏠</h1>
      
      <div className="w-full max-w-sm bg-gray-800 text-white rounded-xl p-8 shadow-lg min-h-[400px] flex flex-col">
        <h2 className="text-3xl font-black mb-2">{user.username}</h2>
        <p className="text-gray-400 mb-6">Le tue statistiche ambientali</p>

        {stats ? (
          <div className="space-y-6 flex-grow">
            
            {/* NUOVO: Data Inizio Wrapped */}
            <div className="p-3 bg-gray-700 rounded-lg border border-yellow-500">
                <p className="text-sm font-bold uppercase text-gray-400">Statistiche del Mese dal</p>
                <p className="text-xl font-extrabold text-yellow-300">{stats.data_inizio}</p>
            </div>
            
            {/* STATS DEL PROPRIO WRAPPED */}
            <div className="p-3 bg-gray-700 rounded-lg border border-green-500">
                <p className="text-sm font-bold uppercase text-gray-400">CO2 Totale Prodotta</p>
                <p className="text-4xl font-extrabold text-red-500">{stats.totale_co2} kg</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm font-bold uppercase text-gray-400">Distanza Totale Percorsa</p>
                <p className="text-4xl font-extrabold text-blue-400">{stats.totale_km} km</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm font-bold uppercase text-gray-400">Mezzo Più Usato</p>
                <p className="text-xl font-bold">{stats.mezzo_preferito}</p>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
             <p className="text-center text-gray-500">Nessun viaggio registrato. <Link to="/" className='underline text-blue-400'>Inizia ora!</Link></p>
          </div>
        )}

        <button onClick={handleLogout} className="mt-8 w-full py-2 bg-black text-white rounded font-bold">
          LOGOUT
        </button>
      </div>
    </div>
  );
}

export default Profile;