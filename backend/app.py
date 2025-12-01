from flask import Flask, jsonify
from flask_cors import CORS # Importante per far parlare React e Python

app = Flask(__name__)
CORS(app) # Abilita le chiamate dal frontend

# Questa è la "porta" dove bussa React
@app.route('/api/ciao', methods=['GET'])
def saluta():
    # Qui faresti query al DB, calcoli, ecc.
    dati = {"messaggio": "Ciao Marco! Questi dati arrivano da Python!"}
    return jsonify(dati)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)