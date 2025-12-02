import requests
import os

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_API_KEY")

def get_google_distance(origin, destination): # prendo nel metodo destinazione e arrivo
    
    endpoint = "https://maps.googleapis.com/maps/api/directions/json"  
    
    params = { # parametri imposti dall'api di google
        'origin': origin,
        'destination': destination,
        'key': os.environ.get("GOOGLE_API_KEY") ,
        'units': 'metric',
        'language': 'it'  
    }

    try:
        response = requests.get(endpoint, params=params)
        data = response.json()

        # Controllo se Google ha trovato la strada
        if data['status'] == 'OK':
            # Prendo la prima strada (route) e la prima tappa (leg)
            percorso = data['routes'][0]['legs'][0]
            
            return {
                "distanza_testo": percorso['distance']['text'],  # Es: "154 km"
                "distanza_valore": percorso['distance']['value'], # Es: 154000 (metri)
                "durata": percorso['duration']['text'],          # Es: "1 ora 40 min"
                "start_address": percorso['start_address'],      # Indirizzo preciso trovato da Google
                "end_address": percorso['end_address']
            }
        else:
            print(f"Errore Google: {data['status']}")
            return None

    except Exception as e:
        print(f"Errore connessione: {e}")