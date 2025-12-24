import json
import os
from datetime import datetime 

DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'percorse.db.json') 

def carica_db(): 
    if not os.path.exists(DB_PATH):
        return {}
    try:
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    except:
        return {}

def salva_db(db): 
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, 'w') as f:
        json.dump(db, f, indent=4)

def registra_viaggio(username, co2, km, mezzo, start, end): 
    db = carica_db()
    
    if username not in db: 
        db[username] = []
    
    valore_co2 = co2 if isinstance(co2, (int, float)) else 0.0 

    viaggio = { 
        "data": datetime.now().isoformat(),
        "co2": float(valore_co2),
        "km": float(km),
        "mezzo": mezzo,
        "start": start,
        "end": end
    }
    
    db[username].append(viaggio)  
    salva_db(db)

def genera_wrapped(username): 
    db = carica_db()
    viaggi_completi = db.get(username, [])
    
    ora = datetime.now() 
    inizio_mese = ora.replace(day=1, hour=0, minute=0, second=0, microsecond=0) 
    data_inizio_formattata = inizio_mese.strftime("%d/%m/%Y")

    # solo viaggi del mese
    viaggi = []
    for v in viaggi_completi:
        try:
            if datetime.fromisoformat(v['data']) >= inizio_mese:
                viaggi.append(v)
        except (ValueError, KeyError): 
            continue

     # se non ci sono viaggi nel mese 
    if not viaggi:
        return {
            "totale_co2": 0.0, 
            "totale_km": 0.0, 
            "numero_viaggi": 0, 
            "mezzo_preferito": "Nessuno",
            "data_inizio": data_inizio_formattata,
            "ultimo_viaggio": "-"
        }
    
    totale_co2 = sum(v['co2'] for v in viaggi) 
    totale_km = sum(v['km'] for v in viaggi)
    mezzi_usati = [v['mezzo'] for v in viaggi]
    mezzo_preferito = max(set(mezzi_usati), key=mezzi_usati.count)

    return { 
        "totale_co2": round(totale_co2, 2),
        "totale_km": round(totale_km, 2),
        "numero_viaggi": len(viaggi),
        "mezzo_preferito": mezzo_preferito,
        "ultimo_viaggio": viaggi[-1]['data'],
        "data_inizio": data_inizio_formattata 
    }

def leggi_tutti_utenti(): # mi serve per la classifica
    db = carica_db()
    return list(db.keys())  

def get_classifica_risparmio(): # leaderbord
    db = carica_db()
    classifica = []
    CO2_AUTO_PER_KM = 0.120 

    for username, viaggi in db.items():
        co2_risparmiata_totale = 0.0
        
        for v in viaggi:
            km = float(v.get('km', 0))
            co2_emessa = float(v.get('co2', 0))
            co2_teorica_auto = km * CO2_AUTO_PER_KM
            risparmio = co2_teorica_auto - co2_emessa
            
            if risparmio > 0:
                co2_risparmiata_totale += risparmio
                
        if co2_risparmiata_totale > 0:
            classifica.append({
                "username": username,
                "risparmio": round(co2_risparmiata_totale, 2)
            })
    
    classifica.sort(key=lambda x: x['risparmio'], reverse=True)
    return classifica

def get_storico_completo(username):
    db = carica_db()
    return db.get(username, [])

# licia e daniele se state leggendo questo sappiate che sono le 3 di notte e sto risolvendo il bug del wrapped 
# e finire il terzo capitolo della relazione mi dovete almeno 1 sushi a testa quando ci vedremo