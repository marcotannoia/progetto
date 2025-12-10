import React from 'react';
import { Link } from 'react-router-dom';
import './Intestazione.css';

function Intestazione() {
  return (
    <header className="hero-header">
      <Link to="/cerca" className="corner-icon corner-left" aria-label="Cerca utenti">
        🔍
      </Link>

      <div className="title-block">
        <p className="eyebrow">EcoTrack</p>
        <h1 className="hero-title">ECOTRACK</h1>
        <p className="caption">track your consumes</p>
      </div>

      <Link to="/profilo" className="corner-icon corner-right" aria-label="Vai al profilo">
        👤
      </Link>
    </header>
  );
}

export default Intestazione;
