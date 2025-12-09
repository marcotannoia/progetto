import json
import os

DB_FILE = "users.json"

# utenti di default
DEFAULT_USERS = {
    "admin": {"password": "adminpass", "role": "superuser", "username": "admin"},
    "paolo": {"password": "password", "role": "utente", "username": "paolo"}
}

def caricaDB():
    """Carica DB da file. Se non esiste o è corrotto, usa i default."""
    if not os.path.exists(DB_FILE):
        salvaDB(DEFAULT_USERS)
        return DEFAULT_USERS.copy()
    
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except:
        return DEFAULT_USERS.copy()

def salvaDB(db):
    """Salva su file JSON"""
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(db, f, indent=4)
    except Exception as e:
        print(f"Errore salvataggio DB: {e}")

# --- API ---

def login_user(username, password):
    db = caricaDB()
    user = db.get(username)
    if user and user['password'] == password:
        return user
    return None

def register_user(username, password, regione):
    db = caricaDB()
    if username in db:
        return False, "Username già in uso"
    
    # Aggiungi nuovo utente
    db[username] = {    
        "username": username,
        "password": password,
        "regione": regione,
        "role": "utente"
    }
    salvaDB(db) # Salvataggio permanente
    return True, "Registrato con successo"