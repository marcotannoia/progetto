import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

# CORREZIONE PERCORSO: Usa il percorso assoluto basato sulla posizione di questo file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "users.json")

def caricaDB():
    """Carica il database dal file JSON. Se non esiste, ritorna un dizionario vuoto."""
    if not os.path.exists(DB_FILE):
        print(f"ATTENZIONE: File DB non trovato in {DB_FILE}. Crearne uno nuovo.")
        return {} 
    
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Errore lettura DB: {e}")
        return {}

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
    
    # Generiamo l'hash della password
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
    
    if not user:
        print(f"Login fallito: Utente '{username}' non trovato nel DB.")
        return None

    # Verifica la password
    if check_password_hash(user['password'], password):
        return user
    else:
        print(f"Login fallito: Password errata per '{username}'.")
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