import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'percorse.db.json') # gli assegno questo percorso per salvare le cose

def carica_db(): # questa funzione carica il database
    if not os.path.exists(DB_PATH):
        return {}
    try:
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    except:
        return {}

def salva_db(db): # questa funzione salva il database
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, 'w') as f:
        json.dump(db, f, indent=4)

def registra_viaggio(username, co2, km, mezzo, start, end):
    """Salva un singolo viaggio nello storico dell'utente"""
    db = carica_db()
    
    if username not in db: # se non esiste l'utente lo creo vuoto
        db[username] = []
    
    
    valore_co2 = co2 if isinstance(co2, (int, float)) else 0.0 # Assicuriamoci che co2 sia un numero

    viaggio = {
        "data": datetime.now().isoformat(), # Salva data e ora attuali
        "co2": float(valore_co2),
        "km": float(km),
        "mezzo": mezzo,
        "start": start,
        "end": end
    }
    
    db[username].append(viaggio)  # lo aggiungo alla lista dei viaggi dell'utente
    salva_db(db)

def genera_wrapped(username):
    """Calcola le statistiche totali per l'utente"""
    db = carica_db()
    viaggi = db.get(username, [])
    
    if not viaggi:
        return None

    # Calcoli per il Wrapped
    totale_co2 = sum(v['co2'] for v in viaggi)
    totale_km = sum(v['km'] for v in viaggi)
    numero_viaggi = len(viaggi)
    
    # Trova il mezzo più usato
    mezzi_usati = [v['mezzo'] for v in viaggi]
    mezzo_preferito = max(set(mezzi_usati), key=mezzi_usati.count) if mezzi_usati else "Nessuno"

    return {
        "totale_co2": round(totale_co2, 2),
        "totale_km": round(totale_km, 2),
        "numero_viaggi": numero_viaggi,
        "mezzo_preferito": mezzo_preferito,
        "ultimo_viaggio": viaggi[-1]['data'] # Utile per dire "dal tuo ultimo viaggio..."
    }