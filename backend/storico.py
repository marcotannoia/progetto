import json
import os
from datetime import datetime 

DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'percorse.db.json') # gli assegno questo percorso per salvare le cose

def carica_db(): # funzione per caricare nel database
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

def registra_viaggio(username, co2, km, mezzo, start, end): # salvataggio del viaggio nel db
    db = carica_db()
    
    if username not in db: # se non esiste l'utente lo creo vuoto
        db[username] = []
    
    
    valore_co2 = co2 if isinstance(co2, (int, float)) else 0.0 # voglio capire se co2 e un numero altrimenti lo salvo a 0

    viaggio = { # qui creo la classe de viaggio che ha anche l'attributo data per farmi capire quandoe  stao fatto
        "data": datetime.now().isoformat(),
        "co2": float(valore_co2),
        "km": float(km),
        "mezzo": mezzo,
        "start": start,
        "end": end
    }
    
    db[username].append(viaggio)  # lo aggiungo alla fine della lista dei viaggi dell'utente
    salva_db(db)

def genera_wrapped(username): # genero un wrapped con cadenza mensile
    db = carica_db()
    viaggi_completi = db.get(username, [])
    
    if not viaggi_completi:
        return None

    now = datetime.now() 
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) # lo faccio qio
    data_inizio_formattata = start_of_month.strftime("%d/%m/%Y")

    viaggi = []
    for v in viaggi_completi:
        try:
            viaggio_data = datetime.fromisoformat(v['data']) # qui devo convertire come e fatta la data e gestisco l'errore di ancora e un formato sbagliato
            if viaggio_data >= start_of_month:
                viaggi.append(v)
        except ValueError: 
            continue


    if not viaggi:
        return {
            "totale_co2": 0.0, 
            "totale_km": 0.0, 
            "numero_viaggi": 0, 
            "mezzo_preferito": "Nessuno",
            "data_inizio": data_inizio_formattata 
        }

    totale_co2 = sum(v['co2'] for v in viaggi) # qui faccio i calcoli che devo fare x forza
    totale_km = sum(v['km'] for v in viaggi)
    numero_viaggi = len(viaggi)
    
 
    mezzi_usati = [v['mezzo'] for v in viaggi]
    mezzo_preferito = max(set(mezzi_usati), key=mezzi_usati.count) if mezzi_usati else "Nessuno" # algoritmo per scegliere il piu usato

    return { 
        "totale_co2": round(totale_co2, 2),
        "totale_km": round(totale_km, 2),
        "numero_viaggi": numero_viaggi,
        "mezzo_preferito": mezzo_preferito,
        "ultimo_viaggio": viaggi[-1]['data'],
        "data_inizio": data_inizio_formattata 
    }

def leggi_tutti_utenti(): # mi serve per edere chi sta loggato  nel db
    db = carica_db()
    return list(db.keys())  