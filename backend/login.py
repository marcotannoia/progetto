import json
import os

DB_FILE = "users.json"

# utenti di default
DEFAULT_USERS = {
    "admin": {"password": "adminpass", "role": "superuser", "username": "admin"},
    "paolo": {"password": "password", "role": "utente", "username": "paolo"}
}

def caricaDB():
    if not os.path.exists(DB_FILE): # provo a caricare il db altrimenti uso qelli di default giusto per farlo funzionare
        salvaDB(DEFAULT_USERS)
        return DEFAULT_USERS.copy()
    
    try:
        with open(DB_FILE, 'r') as f: # accedo in lettura e nel caso carico altrimenti mando l'eccezione
            return json.load(f)
    except:
        return DEFAULT_USERS.copy()

def salvaDB(db):
    try:
        with open(DB_FILE, 'w') as f: # questa funzione salva nel database vero e proprio e ci scrivo dentro
            json.dump(db, f, indent=4)
    except Exception as e:
        print(f"Errore salvataggio DB: {e}")


def login_user(username, password): # funzione di login standard
    db = caricaDB()
    user = db.get(username)
    if user and user['password'] == password:
        return user
    return None

def register_user(username, password, regione):# idem + patate per la registrazione
    db = caricaDB()
    if username in db:
        return False, "Username già in uso"
    
    db[username] = {    # formato del nuovo utente 
        "username": username,
        "password": password,
        "regione": regione,
        "role": "utente"
    }
    salvaDB(db) 
    return True, "Registrato con successo"

def get_users_list(): # funzione per leggere tutti gli utenti, carico gli utenti e seleziono solo username e regione
    db = caricaDB()
    lista = []
    for user_key, user_data in db.items():
        lista.append({
            "username": user_data.get("username"),
            "regione": user_data.get("regione", "").lower() # li prendo minuscoli per prenderli tutti
        })
    return lista