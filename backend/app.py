from flask import Flask, jsonify, request, session
from flask_cors import CORS
import maps
import calcoloCO2
from mezzo import opzione_trasporto
import login as auth_service # Importiamo il modulo corretto
import storico
from alberiCO2 import alberiCO2

app = Flask(__name__)
app.secret_key = "chiave-segreta-super-sicura"

# config log
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False #siamo in locale non serve il protocollo https
app.config['SESSION_COOKIE_HTTPONLY'] = True 

CORS(app, supports_credentials=True, origins=["http://localhost:3000"]) # permettiamo al frontend di comunicare con il backend

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
    # Permette il calcolo anche ad utenti non loggati
    
    data = request.get_json() or {}
    start, end = data.get('start'), data.get('end')
    mezzo = data.get('mezzo', 'car')

    if not start or not end:
        return jsonify({"ok": False, "errore": "Indirizzi mancanti"}), 400

    route = maps.get_google_distance(start, end)
    
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato"}), 400

    distanza_km = route.get('distanza_valore', 0) / 1000.0

    # calcolo delle emissioni di CO2
    if mezzo in ['bike', 'piedi']:
        emissioni = 0
    else:
        emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo)

    # Tentiamo di salvare solo se l'utente è loggato
    current_username = session.get('username') 
    
    if current_username: 
        storico.registra_viaggio(
            username=current_username,
            co2=emissioni,
            km=distanza_km,
            mezzo=mezzo,
            start=route.get('start_address'), 
            end=route.get('end_address')      
        )

    return jsonify({
        "ok": True,
        "start_address": route.get('start_address'),
        "end_address": route.get('end_address'),
        "distanza_testo": route.get('distanza_testo'),
        "emissioni_co2": f"{emissioni:.2f} kg di CO₂" if isinstance(emissioni, (int, float)) else str(emissioni),
        "mezzo_scelto": mezzo,
        "is_logged": bool(current_username)
    })

# rotta per il wrapped
@app.route('/api/wrapped', defaults={'username': None}, methods=['GET'])
@app.route('/api/wrapped/<username>', methods=['GET'])
def api_wrapped(username):
    current_username = session.get('username')
    if not current_username:
        return jsonify({"ok": False, "errore": "Accesso negato. Devi effettuare il login per vedere le statistiche."}), 401 # cioe devi essere loggato
    
    
    target_user = username if username else current_username # cioe o di un utente selezionato o di noi stessi
    
    stats = storico.genera_wrapped(target_user) # algoritmo di storico.py, una volta determinato chi e l'user

    if not stats:
        return jsonify({"ok": False, "messaggio": f"Nessun dato trovato per {target_user}"}), 404 # se non sono presenti dati


    return jsonify({"ok": True, "dati": stats, "target": target_user})


# rotta per cercare utenti 
@app.route('/api/utenti/cerca', methods=['GET'])
def cerca_utenti():
    nomi = storico.lista_utenti_con_dati()
    return jsonify({"ok": True, "utenti": nomi})


# rotta per leggere tutti gli utenti
@app.route('/api/utenti', methods=['GET'])
def get_utenti():
    try:
        lista = storico.leggi_tutti_utenti()
        return jsonify({"ok": True, "utenti": lista})
    except:
        return jsonify({"ok": False, "utenti": []})
    

# richiamo funzione per calcolo alberi che assorbono CO2
@app.route('/api/calcolo-alberi', methods=['POST'])
def api_calcolo_alberi():
    data = request.get_json() or {}
    co2_input = data.get('co2')
    
    if co2_input is None:
        return jsonify({"ok": False, "errore": "Valore CO2 mancante"}), 400
    
    try:
        co2_valore = float(co2_input)
    except ValueError:
        return jsonify({"ok": False, "errore": "Il valore CO2 deve essere un numero"}), 400

    # Ora la funzione sarà trovata grazie all'import
    giorni_necessari = alberiCO2(co2_valore)

    return jsonify({
        "ok": True,
        "co2_kg": co2_valore,
        "giorni_per_albero": giorni_necessari,
        "messaggio": f"Un albero impiegherebbe circa {giorni_necessari} giorni per assorbire questa CO₂."
    })
if __name__ == '__main__':
    print("🚀 Server EcoRoute attivo su http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)