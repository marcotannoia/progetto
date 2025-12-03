from flask import Flask, jsonify
from flask_cors import CORS # Importante per far parlare React e Python
import os
from flask import Flask, jsonify, request
import maps
from mezzo import opzione_trasporto
import calcoloCO2
# Legge la variabile dal sistema operativo del container
API_KEY = os.environ.get("GOOGLE_API_KEY") 

if not API_KEY:
    raise ValueError("Attenzione: Manca la API Key di Google!")

# -- fine gestione API Key --

app = Flask(__name__)
CORS(app) # Abilita le chiamate dal frontend

#  scelta percorso

@app.route('/api/navigazione', methods=['POST'])
def calcola_percorso():
    dati = request.json
    partenza = dati.get('start')
    arrivo = dati.get('end')
    mezzo_scelto = dati.get('mezzo')  

    

    if not partenza or not arrivo:
        return jsonify({"errore": "Mancano indirizzi"}), 400

    # Chiamo la funzione che parla con Google
    risultato = maps.get_google_distance(partenza, arrivo)
    distanza_metri = risultato.get('distanza_valore', 0)
    distanza_km = distanza_metri / 1000.0

    emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo_scelto) # praticamente dovrei chiamare la funzione calcoloCO2
    if mezzo_scelto in ['car', 'public_bus']:
        risultato['emissioni_co2'] = f"{emissioni} kg di CO2"
    else:
        risultato['emissioni_co2'] = emissioni
   

    if risultato:
        return jsonify(risultato)
    else:
        return jsonify({"errore": "Impossibile calcolare il percorso (Indirizzi non validi?)"}), 404


# scelta veicoli

@app.route('/api/veicoli', methods=['GET'])
def vehicles_endpoint():
    # 1. Chiamiamo la logica
    data = opzione_trasporto()
    
    # 2. Restituiamo il JSON al frontend
    return jsonify(data)

if __name__ == '__main__':
    # host='0.0.0.0' è fondamentale per Docker!
    app.run(host='0.0.0.0', port=5000, debug=True)