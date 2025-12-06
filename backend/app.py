from flask import Flask, jsonify, request, session
from flask_cors import CORS
import os
import json
import re
import hashlib
from datetime import datetime

app = Flask(__name__)
app.secret_key = "dev-secret-key-change-in-production"
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type"],
     expose_headers=["Content-Type"])

print("=" * 60)
print("🚀 ECO-ROUTE BACKEND - INIZIALIZZAZIONE")
print("=" * 60)
try:
    import maps
    print("✅ Modulo 'maps' importato correttamente")
except ImportError as e:
    print(f"❌ ERRORE: Non trovo 'maps.py' nella cartella backend")
    print(f"   Assicurati che il file 'maps.py' esista nella stessa cartella di app.py")
    print(f"   Errore dettagliato: {e}")
    exit(1)

try:
    from mezzo import opzione_trasporto
    print("✅ Modulo 'mezzo' importato correttamente")
except ImportError as e:
    print(f"❌ ERRORE: Non trovo 'mezzo.py' nella cartella backend")
    print(f"   Assicurati che il file 'mezzo.py' esista nella stessa cartella di app.py")
    exit(1)

try:
    import calcoloCO2
    print("✅ Modulo 'calcoloCO2' importato correttamente")
except ImportError as e:
    print(f"❌ ERRORE: Non trovo 'calcoloCO2.py' nella cartella backend")
    print(f"   Assicurati che il file 'calcoloCO2.py' esista nella stessa cartella di app.py")
    exit(1)

users_db = {
    "admin": {"password": "adminpass", "role": "superuser", "username": "admin"},
    "paolo": {"password": "password", "role": "utente", "username": "paolo"}
}

print("\n📋 VERIFICA MODULI:")
print("-" * 40)

if hasattr(maps, 'get_google_distance'):
    print("✅ maps.get_google_distance() trovata")
else:
    print("❌ maps.get_google_distance() NON trovata!")

try:
    veicoli_test = opzione_trasporto()
    print(f"✅ opzione_trasporto() trovata - restituisce {len(veicoli_test)} veicoli")
except:
    print("❌ opzione_trasporto() NON funziona!")

if hasattr(calcoloCO2, 'calcoloCO2'):
    print("✅ calcoloCO2.calcoloCO2() trovata")
else:
    print("❌ calcoloCO2.calcoloCO2() NON trovata!")

print("-" * 40)
print("🌐 Server: http://localhost:5000")
print("🔑 Google API Key:", "✅ Presente" if os.environ.get("GOOGLE_API_KEY") else "❌ Mancante (verrà usato mock)")
print("👤 Account demo: admin / adminpass")
print("👤 Account demo: paolo / password")
print("=" * 60)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint per il controllo dello stato del server"""
    return jsonify({
        "ok": True,
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "server": "EcoRoute Backend",
        "users_count": len(users_db),
        "modules": {
            "maps": hasattr(maps, 'get_google_distance'),
            "mezzo": "importato" if 'opzione_trasporto' in globals() else "errore",
            "calcoloCO2": hasattr(calcoloCO2, 'calcoloCO2')
        },
        "google_api_key": "presente" if os.environ.get("GOOGLE_API_KEY") else "mancante"
    })

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Test di connessione semplice"""
    return jsonify({
        "ok": True,
        "message": "Connessione OK",
        "server_time": datetime.now().isoformat()
    })

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def api_login():
    """Endpoint per il login"""
    if request.method == 'OPTIONS':
        return '', 204
    
    print(f"\n[LOGIN] Richiesta ricevuta")
    
    if not request.is_json:
        return jsonify({"ok": False, "errore": "JSON richiesto"}), 400
    
    try:
        body = request.get_json()
        username = (body.get('username') or "").strip()
        password = body.get('password') or ""
        
        print(f"[LOGIN] Tentativo per: {username}")
        
    except Exception as e:
        print(f"[LOGIN] Errore parsing JSON: {e}")
        return jsonify({"ok": False, "errore": "JSON non valido"}), 400
    
    if not username or not password:
        return jsonify({"ok": False, "errore": "Username e password richiesti"}), 400
    
    user_data = users_db.get(username)
    if user_data and user_data['password'] == password:
        session.clear()
        session['username'] = username
        role = 'admin' if user_data['role'] == 'superuser' else 'utente'
        session['ruolo'] = role
        session['superuser'] = (role == 'admin')
        
        print(f"[LOGIN] ✅ Successo per: {username} (ruolo: {role})")
        
        return jsonify({
            "ok": True, 
            "username": username, 
            "ruolo": role, 
            "superuser": (role == 'admin')
        })
    
    print(f"[LOGIN] ❌ Fallito per: {username}")
    return jsonify({"ok": False, "errore": "Credenziali non valide"}), 401

@app.route('/api/registrati', methods=['POST', 'OPTIONS'])
def api_registrati():
    """Endpoint per la registrazione"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not request.is_json:
        return jsonify({"ok": False, "errore": "JSON richiesto"}), 400
    
    try:
        body = request.get_json()
        username = (body.get('username') or "").strip()
        password = body.get('password') or ""
    except:
        return jsonify({"ok": False, "errore": "JSON non valido"}), 400
    
    if not username or not password:
        return jsonify({"ok": False, "errore": "Username e password richiesti"}), 400
    
    if len(username) < 3:
        return jsonify({"ok": False, "errore": "Username deve essere di almeno 3 caratteri"}), 400
    
    if not re.match(r'^[A-Za-z0-9_.-]+$', username):
        return jsonify({"ok": False, "errore": "Username può contenere solo lettere, numeri, punti, trattini e underscore"}), 400
    
    if username in users_db:
        return jsonify({"ok": False, "errore": "Username già esistente"}), 409
    
    users_db[username] = {
        'password': password,
        'role': 'utente',
        'username': username
    }
    
    session.clear()
    session['username'] = username
    session['ruolo'] = 'utente'
    session['superuser'] = False
    
    print(f"[REGISTRAZIONE] ✅ Nuovo utente: {username}")
    
    return jsonify({
        "ok": True, 
        "messaggio": "Registrazione completata", 
        "username": username,
        "ruolo": "utente",
        "superuser": False
    }), 201

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def api_logout():
    """Endpoint per il logout"""
    if request.method == 'OPTIONS':
        return '', 204
    
    username = session.get('username', 'Sconosciuto')
    session.clear()
    print(f"[LOGOUT] Utente: {username}")
    return jsonify({"ok": True, "messaggio": "Logout effettuato"})

@app.route('/api/me', methods=['GET', 'OPTIONS'])
def api_me():
    """Endpoint per informazioni utente corrente"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if session.get('username'):
        return jsonify({
            "ok": True,
            "username": session.get('username'),
            "ruolo": session.get('ruolo', 'utente'),
            "superuser": bool(session.get('superuser', False))
        })
    
    return jsonify({"ok": False, "messaggio": "Non autenticato"})

@app.route('/api/veicoli', methods=['GET', 'OPTIONS'])
def vehicles_endpoint():
    """Endpoint per ottenere la lista dei veicoli"""
    if request.method == 'OPTIONS':
        return '', 204
    
    print(f"\n[VEICOLI] Richiesta lista veicoli")
    
    try:
        data = opzione_trasporto()
        
        if isinstance(data, list):
            print(f"[VEICOLI] ✅ Restituiti {len(data)} veicoli")
            for veicolo in data:
                if 'action_url' in veicolo:
                    del veicolo['action_url']
            return jsonify(data)
        else:
            print(f"[VEICOLI] ⚠️ opzione_trasporto() non ha restituito una lista")
            fallback = [
                {"id": "car", "label": "Auto", "icon": "🚗", "color": "bg-blue-500"},
                {"id": "public_bus", "label": "Bus", "icon": "🚌", "color": "bg-green-500"},
                {"id": "bike", "label": "Bici", "icon": "🚲", "color": "bg-orange-500"},
                {"id": "piedi", "label": "A piedi", "icon": "🚶", "color": "bg-red-500"}
            ]
            return jsonify(fallback)
            
    except Exception as e:
        print(f"[VEICOLI] ❌ Errore: {e}")
        import traceback
        traceback.print_exc()
        fallback = [
            {"id": "car", "label": "Auto", "icon": "🚗", "color": "bg-blue-500"},
            {"id": "public_bus", "label": "Bus", "icon": "🚌", "color": "bg-green-500"},
            {"id": "bike", "label": "Bici", "icon": "🚲", "color": "bg-orange-500"},
            {"id": "piedi", "label": "A piedi", "icon": "🚶", "color": "bg-red-500"}
        ]
        return jsonify(fallback)

@app.route('/api/navigazione', methods=['POST', 'OPTIONS'])
def calcola_percorso():
    """Endpoint per calcolare il percorso"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not request.is_json:
        return jsonify({"ok": False, "errore": "JSON richiesto"}), 400
    
    try:
        dati = request.get_json() or {}
    except:
        return jsonify({"ok": False, "errore": "JSON non valido"}), 400
    
    partenza = dati.get('start', '').strip()
    arrivo = dati.get('end', '').strip()
    mezzo_scelto = dati.get('mezzo', 'car')
    
    if not partenza or not arrivo:
        return jsonify({"ok": False, "errore": "Mancano indirizzi di partenza o arrivo"}), 400
    
    if not session.get('username'):
        return jsonify({"ok": False, "errore": "Devi essere autenticato"}), 401
    
    print(f"\n[NAVIGAZIONE] Calcolo percorso:")
    print(f"  • Utente: {session.get('username')}")
    print(f"  • Da: {partenza}")
    print(f"  • A: {arrivo}")
    print(f"  • Mezzo: {mezzo_scelto}")
    
    try:

        print(f"[NAVIGAZIONE] Chiamando maps.get_google_distance('{partenza}', '{arrivo}')...")
        risultato = maps.get_google_distance(partenza, arrivo)
        
        if risultato is None:
            print("[NAVIGAZIONE] ❌ Google Maps ha restituito None")
            return jsonify({
                "ok": False, 
                "errore": "Impossibile calcolare il percorso. Controlla gli indirizzi."
            }), 400
        
        print(f"[NAVIGAZIONE] ✅ Risultato Google Maps ricevuto")
        
        if 'durata' in risultato and 'tempo_testo' not in risultato:
            risultato['tempo_testo'] = risultato['durata']
        
        distanza_metri = risultato.get('distanza_valore', 0)
        distanza_km = distanza_metri / 1000.0
        
        print(f"[NAVIGAZIONE] Distanza: {distanza_km:.1f} km ({risultato.get('distanza_testo', 'N/A')})")
        print(f"[NAVIGAZIONE] Tempo: {risultato.get('tempo_testo', risultato.get('durata', 'N/A'))}")
        
        print(f"[NAVIGAZIONE] Calcolo emissioni CO2 con calcoloCO2.calcoloCO2({distanza_km:.1f}, '{mezzo_scelto}')...")
        
        try:

            emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo_scelto)
        except Exception as e:
            print(f"[NAVIGAZIONE] ⚠️ Errore calcolo CO2: {e}")

            emissioni = distanza_km * 0.12  
        
        print(f"[NAVIGAZIONE] Emissioni calcolate: {emissioni}")
        

        if isinstance(emissioni, (int, float)):
            if mezzo_scelto in ['car', 'public_bus']:
                risultato['emissioni_co2'] = f"{emissioni:.2f} kg di CO₂"
            else:
                risultato['emissioni_co2'] = f"{emissioni} kg di CO₂"
        else:
            risultato['emissioni_co2'] = str(emissioni)
        
        risultato['ok'] = True
        risultato['mezzo_scelto'] = mezzo_scelto
        
        print(f"[NAVIGAZIONE] ✅ Percorso calcolato con successo!")
        print(f"  • Emissioni: {risultato['emissioni_co2']}")
        print(f"  • Indirizzo partenza: {risultato.get('start_address', partenza)}")
        print(f"  • Indirizzo arrivo: {risultato.get('end_address', arrivo)}")
        
        return jsonify(risultato)
        
    except Exception as e:
        print(f"[NAVIGAZIONE] ❌ Errore nel calcolo percorso: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "ok": False, 
            "errore": f"Errore nel calcolo del percorso: {str(e)}"
        }), 500

@app.route('/api/test-maps', methods=['POST'])
def test_maps():
    """Endpoint di test per Google Maps"""
    if not request.is_json:
        return jsonify({"ok": False, "errore": "JSON richiesto"}), 400
    
    dati = request.get_json() or {}
    partenza = dati.get('start', 'Bari')
    arrivo = dati.get('end', 'Milano')
    
    print(f"\n[TEST-MAPS] Test: {partenza} -> {arrivo}")
    
    try:

        risultato = maps.get_google_distance(partenza, arrivo)
        
        if risultato is None:
            return jsonify({
                "ok": False,
                "test": "failed",
                "errore": "Google Maps ha restituito None",
                "suggerimento": "Controlla la chiave API Google in maps.py"
            })
        
        return jsonify({
            "ok": True,
            "test": "success",
            "dati": risultato,
            "google_api_key": "presente" if os.environ.get("GOOGLE_API_KEY") else "mancante"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "ok": False,
            "test": "failed",
            "errore": str(e),
            "traceback": traceback.format_exc()
        })

@app.route('/api/test-co2', methods=['POST'])
def test_co2():
    """Endpoint di test per calcolo CO2"""
    if not request.is_json:
        return jsonify({"ok": False, "errore": "JSON richiesto"}), 400
    
    dati = request.get_json() or {}
    distanza = dati.get('distanza', 100)
    mezzo = dati.get('mezzo', 'car')
    
    print(f"\n[TEST-CO2] Test: {distanza} km con {mezzo}")
    
    try:
        emissioni = calcoloCO2.calcoloCO2(distanza, mezzo)
        
        return jsonify({
            "ok": True,
            "test": "success",
            "distanza_km": distanza,
            "mezzo": mezzo,
            "emissioni_kg": emissioni,
            "emissioni_formattate": f"{emissioni:.2f} kg di CO₂"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "ok": False,
            "test": "failed",
            "errore": str(e)
        })

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🚀 AVVIO SERVER...")
    print("=" * 60)
    
    print("\n🧪 TEST INIZIALE MODULI:")
    print("-" * 40)
    
    try:
        test_result = maps.get_google_distance("Roma", "Milano")
        if test_result:
            print(f"✅ Test maps.get_google_distance(): OK")
            print(f"   Distanza: {test_result.get('distanza_testo', 'N/A')}")
        else:
            print(f"⚠️ Test maps.get_google_distance(): Restituito None (controlla API key)")
    except Exception as e:
        print(f"❌ Test maps.get_google_distance(): ERRORE - {e}")
    
    try:
        veicoli = opzione_trasporto()
        print(f"✅ Test opzione_trasporto(): OK - {len(veicoli)} veicoli")
    except Exception as e:
        print(f"❌ Test opzione_trasporto(): ERRORE - {e}")
    
    try:
        co2 = calcoloCO2.calcoloCO2(100, 'car')
        print(f"✅ Test calcoloCO2.calcoloCO2(): OK - {co2} kg CO2 per 100km in auto")
    except Exception as e:
        print(f"❌ Test calcoloCO2.calcoloCO2(): ERRORE - {e}")
    
    print("-" * 40)
    print("✅ Server pronto all'uso!")
    print(f"🌐 Collegati a: http://localhost:5000")
    print(f"📡 API Health: http://localhost:5000/api/health")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)