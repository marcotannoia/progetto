import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "users.json")

def caricaDB():
    if not os.path.exists(DB_FILE): # se non sta il db
        print(f"ATTENZIONE: File DB non trovato in {DB_FILE}. Crearne uno nuovo.")
        return {} 
    
    try:
        with open(DB_FILE, 'r') as f: 
            return json.load(f)
    except Exception as e: # errore generico
        print(f"Errore lettura DB: {e}")
        return {}

def salvaDB(db):
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(db, f, indent=4) # dammelo ordinato e scrivici
    except Exception as e:
        print(f"Errore salvataggio DB: {e}")

def register_user(username, password, regione):
    db = caricaDB()
    if username in db:
        return False, "Username già in uso"
    
    password_hashata = generate_password_hash(password) # passowrd hashata
    
    db[username] = {
        "username": username,
        "password": password_hashata,
        "regione": regione,
        "role": "utente"
    }
    salvaDB(db) 
    return True, "Registrato con successo"

def login_user(username, password): # funzione di login
    db = caricaDB()
    user = db.get(username)
    
    if not user:
        print(f"Login fallito: Utente '{username}' non trovato nel DB.")
        return None
    if check_password_hash(user['password'], password):
        return user
    else:
        print(f"Login fallito: Password errata per '{username}'.")
        return None

def get_users_list(): #mi serve per la classifica
    db = caricaDB()
    lista = []
    for user_key, user_data in db.items():
        lista.append({
            "username": user_data.get("username"),
            "regione": user_data.get("regione", "").lower()
        })
    return lista