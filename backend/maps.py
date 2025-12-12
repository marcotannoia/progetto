import requests
import os
import urllib.parse

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
        return None

def get_embed_map_url(origin, destination):
    """
    Genera l'URL per la Google Maps Embed API in modalità 'directions'.
    Questa modalità supporta la visualizzazione del traffico.
    """
    if not origin or not destination:
        return None
        
    # URL base ufficiale per l'Embed API
    base_url = "https://www.google.com/maps/embed/v1/directions"
    
    params = {
        'key': GOOGLE_MAPS_API_KEY,
        'origin': origin,
        'destination': destination,
        'mode': 'driving', # Fondamentale per vedere il traffico
        'language': 'it'
    }
    
    # Costruisce la query string in modo sicuro
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}?{query_string}"