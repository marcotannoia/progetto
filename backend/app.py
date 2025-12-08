from flask import Flask, jsonify, request, session
from flask_cors import CORS
import maps
import calcoloCO2
from mezzo import opzione_trasporto
import login as auth_service # Importiamo il modulo corretto

app = Flask(__name__)
app.secret_key = "chiave-segreta-super-sicura"

# --- CONFIGURAZIONE FONDAMENTALE PER IL LOGIN ---
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False # False perché siamo su localhost (http)
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# questa gestisce il login e  la registrazione
@app.route('/api/login', methods=['POST']) 
def api_login():
    data = request.get_json() or {}
    user = auth_service.login_user(data.get('username'), data.get('password')) # praticamente vedo se esise nel caso prendo, vedeo se esiste l'utente e che ruoli ha
    if user:
        session.permanent = True
        session['username'] = user['username']
        session['ruolo'] = 'admin' if user.get('role') == 'superuser' else 'utente' # eventuale assegnaiozione ruolo
        return jsonify({"ok": True, "username": user['username'], "ruolo": session['ruolo']})
    
    return jsonify({"ok": False, "errore": "Credenziali errate"}), 401 # in caso di errore

@app.route('/api/registrati', methods=['POST'])
def api_registrati():
    data = request.get_json() or {}
    ok, msg = auth_service.register_user(data.get('username'), data.get('password'))
    return jsonify({"ok": ok, "messaggio": msg}), 201 if ok else 409

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"ok": True})
# fine api login.register.logout

# se refresho non perdo il login
@app.route('/api/me', methods=['GET'])
def api_me():
    user = session.get('username')
    if user:
        return jsonify({"ok": True, "username": user, "ruolo": session.get('ruolo')})
    return jsonify({"ok": False}), 401


# rotte per i veicoli e la navigazione
@app.route('/api/veicoli', methods=['GET'])
def vehicles():
    return jsonify(opzione_trasporto()) # restituisce le opzioni di trasporto disponibili

@app.route('/api/navigazione', methods=['POST'])
def navigazione():
    if not session.get('username'):
        return jsonify({"ok": False, "errore": "Login richiesto"}), 401 # se non loggato

    data = request.get_json() or {}
    start, end = data.get('start'), data.get('end')
    mezzo = data.get('mezzo', 'car') # Default auto

    if not start or not end:
        return jsonify({"ok": False, "errore": "Indirizzi mancanti"}), 400

   
    route = maps.get_google_distance(start, end) # questo me lo fornisce sempre in distanza di automobili
    
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato"}), 400

    distanza_km = route.get('distanza_valore', 0) / 1000.0
    
    # 2. gestioni emissioni
    if mezzo in ['bike', 'piedi']:
        emissioni = 0
    else:
            emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo)


    return jsonify({
        "ok": True,
        "start_address": route.get('start_address'),
        "end_address": route.get('end_address'),
        "distanza_testo": route.get('distanza_testo'),
        # Se è 0, scriviamo "0 kg", altrimenti il valore calcolato
        "emissioni_co2": f"{emissioni:.2f} kg di CO₂" if isinstance(emissioni, (int, float)) else str(emissioni),
        "mezzo_scelto": mezzo
    })
if __name__ == '__main__':
    print("🚀 Server EcoRoute attivo su http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)