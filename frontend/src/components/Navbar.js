import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "text-blue-400" : "text-gray-400"; // serve semplicemente per colorare l'interfaccia

  return (
    <nav className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 p-4 flex justify-around items-center z-50">
      
      {/* 🏠 Home: Calcolatore/Nuovo Viaggio. Punta a / */}
      <Link to="/" className={`text-2xl ${isActive('/')}`}>
        🏠 <span className="text-xs block">Calcola</span>
      </Link>

      {/* 🔍 Cerca: Schermo di ricerca utenti. Punta a /cerca */}
      <Link to="/cerca" className={`text-2xl ${isActive('/cerca')}`}>
        🔍 <span className="text-xs block">Cerca</span>
      </Link>

      {/* 👤 Profilo: Wrapped/Statistiche. Punta a /profilo */}
      <Link to="/profilo" className={`text-2xl ${isActive('/profilo')}`}>
        👤 <span className="text-xs block">Profilo</span>
      </Link>
    </nav>
  );
}

export default Navbar;