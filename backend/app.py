from flask import Flask, jsonify
from flask_cors import CORS # Importante per far parlare React e Python
import os
from flask import Flask, jsonify, request
import maps

# Legge la variabile dal sistema operativo del container
API_KEY = os.environ.get("GOOGLE_API_KEY") 

if not API_KEY:
    raise ValueError("Attenzione: Manca la API Key di Google!")

# -- fine gestione API Key --

app = Flask(__name__)
CORS(app) # Abilita le chiamate dal frontend


@app.route('/api/navigazione', methods=['POST'])
def calcola_percorso():
    dati = request.json
    partenza = dati.get('start')
    arrivo = dati.get('end')

    if not partenza or not arrivo:
        return jsonify({"errore": "Mancano indirizzi"}), 400

    # Chiamo la funzione che parla con Google
    risultato = maps.get_google_distance(partenza, arrivo)

    if risultato:
        return jsonify(risultato)
    else:
        return jsonify({"errore": "Impossibile calcolare il percorso (Indirizzi non validi?)"}), 404
    

if __name__ == '__main__':
    # host='0.0.0.0' è fondamentale per Docker!
    app.run(host='0.0.0.0', port=5000, debug=True)