import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_FILE = "users.json"

def caricaDB():
    """Carica il database dal file JSON. Se non esiste, ritorna un dizionario vuoto."""
    if not os.path.exists(DB_FILE):
        return {} # Ritorna vuoto invece di caricare i default
    
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except:
        return {} # In caso di errore di lettura, partiamo da un DB vuoto

def salvaDB(db):
    """Salva il dizionario degli utenti nel file JSON."""
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(db, f, indent=4)
    except Exception as e:
        print(f"Errore salvataggio DB: {e}")

def register_user(username, password, regione):
    """Registra un nuovo utente con password hashata."""
    db = caricaDB()
    if username in db:
        return False, "Username già in uso"
    
    # [SICUREZZA] Generiamo l'hash della password
    hashed_password = generate_password_hash(password)
    
    db[username] = {
        "username": username,
        "password": hashed_password,
        "regione": regione,
        "role": "utente"
    }
    salvaDB(db) 
    return True, "Registrato con successo"

def login_user(username, password):
    """Verifica le credenziali confrontando l'hash salvato con la password inserita."""
    db = caricaDB()
    user = db.get(username)
    
    # [SICUREZZA] Confronto sicuro tramite check_password_hash
    if user and check_password_hash(user['password'], password):
        return user
    return None

def get_users_list():
    """Ritorna la lista di tutti gli utenti registrati (solo username e regione)."""
    db = caricaDB()
    lista = []
    for user_key, user_data in db.items():
        lista.append({
            "username": user_data.get("username"),
            "regione": user_data.get("regione", "").lower()
        })
    return lista