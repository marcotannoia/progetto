// frontend/src/components/Intestazione.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Intestazione.css';

function Intestazione() {
  return (
    <header className="hero-header">
      <Link to="/cerca" className="corner-icon" aria-label="Cerca">
        🔍
      </Link>

      <div className="title-block">
        <h1 className="hero-title">ECOTRACK</h1>
      </div>

      <Link to="/profilo" className="corner-icon" aria-label="Profilo">
        👤
      </Link>
    </header>
  );
}

export default Intestazione;