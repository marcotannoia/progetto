from flask import Flask, jsonify, request, session
from flask_cors import CORS
import maps
import calcoloCO2
from mezzo import opzione_trasporto
import login as auth_service 
import storico
from alberiCO2 import alberiCO2

app = Flask(__name__)
app.secret_key = "chiave-segreta-super-sicura"

# config log
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False # siamo in locale non serve il protocollo https
app.config['SESSION_COOKIE_HTTPONLY'] = True 

CORS(app, supports_credentials=True, origins=["http://localhost:3000"]) # permettiamo al frontend di comunicare con il backend

# qui devo mettere tute le route che mi permettoo di richiamare le funzioni del backend e collegarle al frontend

@app.route('/api/login', methods=['POST']) 
def api_login():
    data = request.get_json() or {}
    user = auth_service.login_user(data.get('username'), data.get('password'))
    if user:
        session.permanent = True
        session['username'] = user['username']
        session['ruolo'] = 'admin' if user.get('role') == 'superuser' else 'utente'
        session['regione'] = user.get('regione', '') 

        
        return jsonify({"ok": True, "username": user['username'], "ruolo": session['ruolo'], "regione": user.get('regione', '')})
    
    return jsonify({"ok": False, "errore": "Credenziali errate"}), 401

@app.route('/api/registrati', methods=['POST'])
def api_registrati():
    data = request.get_json() or {}
    ok, msg = auth_service.register_user(data.get('username'), data.get('password'), data.get('regione')) # ho messo anche la regione perche cosi faccio i suggerimenti nel homesearch
    return jsonify({"ok": ok, "messaggio": msg}), 201 if ok else 409

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


# se refresho non perdo il login
@app.route('/api/me', methods=['GET'])
def api_me():
    user = session.get('username')
    if user:
        return jsonify({"ok": True, "username": user, "ruolo": session.get('ruolo'), "regione": session.get('regione', '')})
    return jsonify({"ok": False}), 401


# rotte per i veicoli e la navigazione
@app.route('/api/veicoli', methods=['GET'])
def vehicles():
    return jsonify(opzione_trasporto()) 

@app.route('/api/navigazione', methods=['POST']) # l'ho modificata per far cercare i viaggi anche agli utenti non loggati
def navigazione():

    data = request.get_json() or {} # qui prendo i dati che mi servono
    start, end = data.get('start'), data.get('end')
    mezzo = data.get('mezzo', 'car')

    if not start or not end:
        return jsonify({"ok": False, "errore": "Indirizzi mancanti"}), 400

    route = maps.get_google_distance(start, end)  # grazie alle api in maps.py faccio il calcolo e letsgoky
    
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato"}), 400

    distanza_km = route.get('distanza_valore', 0) / 1000.0


    if mezzo in ['bike', 'piedi', 'veicolo_elettrico']:
        emissioni = 0
    else:
        emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo) #qua ho messo che mi serve sapere se ho emesso o no cosi dopo nel frotnend metto messaggi cariniS


    current_username = session.get('username') # prendo l'username corrente per salvare lo storico solo se loggato
    
    if current_username: 
        storico.registra_viaggio(
            username=current_username,
            co2=emissioni,
            km=distanza_km,
            mezzo=mezzo,
            start=route.get('start_address'), 
            end=route.get('end_address')      
        )
    
    # Genero l'URL per l'iframe (mappa interattiva con traffico)
    map_url = maps.get_embed_map_url(route.get('start_address'), route.get('end_address'))

    return jsonify({
        "ok": True,
        "start_address": route.get('start_address'),
        "end_address": route.get('end_address'),
        "distanza_testo": route.get('distanza_testo'),
        "emissioni_co2": f"{emissioni:.2f} kg di CO₂" if isinstance(emissioni, (int, float)) else str(emissioni),
        "mezzo_scelto": mezzo,
        "is_logged": bool(current_username),
        "map_url": map_url
    })

# rotta per il wrapped
@app.route('/api/wrapped', defaults={'username': None}, methods=['GET'])
@app.route('/api/wrapped/<username>', methods=['GET']) # per quello di u utente ricercato
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
        # Usiamo la nuova funzione di login.py invece di storico
        lista = auth_service.get_users_list() 
        return jsonify({"ok": True, "utenti": lista})
    except Exception as e:
        print(e)
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

    giorni_necessari = alberiCO2(co2_valore)

    return jsonify({
        "ok": True,
        "co2_kg": co2_valore,
        "giorni_per_albero": giorni_necessari,
        "messaggio": f"Un albero impiegherebbe circa {giorni_necessari} giorni per assorbire questa CO₂."
    })
if __name__ == '__main__':
    print("Server EcoRoute attivo su http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)