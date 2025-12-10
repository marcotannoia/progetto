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

        if data['status'] == 'OK': # vedo se le api hanno trovato la strada, scelgo la prima e prendo cio che mi interessa nel return
            percorso = data['routes'][0]['legs'][0]
            
            return {
                "distanza_testo": percorso['distance']['text'],  
                "distanza_valore": percorso['distance']['value'],  # purtroppo me lo da in metri quindi poi lo convertiro
                "durata": percorso['duration']['text'],          
                "start_address": percorso['start_address'],      
                "end_address": percorso['end_address']
            }
        else:
            print(f"Errore Google: {data['status']}")
            return None

    except Exception as e:
        print(f"Errore connessione: {e}") # gestisco sta eccezione generale per farmi un idea 