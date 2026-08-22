from datetime import timedelta
from decimal import Decimal
from functools import wraps
import os
import re

from flask import Flask, jsonify, request, session
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

from alberiCO2 import alberiCO2
import calcoloCO2
import login as auth_service
import maps
from mezzo import opzione_trasporto
import storico


USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{3,30}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ALLOWED_VEHICLES = {"piedi", "bike", "car", "public_bus", "veicolo_elettrico"}


def required_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Variabile d'ambiente obbligatoria mancante: {name}")
    return value


def parse_origins():
    configured = os.environ.get(
        "FRONTEND_ORIGINS",
        "https://ecotracker.it,https://www.ecotracker.it",
    )
    return {origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()}


def json_body():
    if not request.is_json:
        return None, (jsonify({"ok": False, "errore": "È richiesto un corpo JSON."}), 415)

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({"ok": False, "errore": "JSON non valido."}), 400)

    return data, None


def valid_username(value):
    return isinstance(value, str) and USERNAME_PATTERN.fullmatch(value) is not None


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("username"):
            return jsonify({"ok": False, "errore": "Devi effettuare il login."}), 401
        return view(*args, **kwargs)

    return wrapped


class DynamoDBEncoder(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


environment = os.environ.get("APP_ENV", "production").lower()
is_production = environment == "production"
allowed_origins = parse_origins()

app = Flask(__name__)
app.json = DynamoDBEncoder(app)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config.update(
    SECRET_KEY=required_env("SECRET_KEY"),
    MAX_CONTENT_LENGTH=32 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=is_production,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_DOMAIN=os.environ.get("SESSION_COOKIE_DOMAIN") or None,
    PERMANENT_SESSION_LIFETIME=timedelta(hours=24),
)

CORS(
    app,
    resources={r"/api/*": {"origins": sorted(allowed_origins)}},
    supports_credentials=True,
)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
    headers_enabled=True,
)


@app.before_request
def protect_unsafe_requests():
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return None

    origin = request.headers.get("Origin", "").rstrip("/")
    if origin not in allowed_origins:
        return jsonify({"ok": False, "errore": "Origine della richiesta non autorizzata."}), 403

    return None


@app.after_request
def add_security_headers(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    if is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.errorhandler(429)
def rate_limit_exceeded(_error):
    return jsonify({"ok": False, "errore": "Troppe richieste. Riprova tra poco."}), 429


@app.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def api_login():
    data, error = json_body()
    if error:
        return error

    username = str(data.get("username", "")).lower().strip()
    password = data.get("password")
    if not valid_username(username) or not isinstance(password, str) or not (8 <= len(password) <= 128):
        return jsonify({"ok": False, "errore": "Credenziali non valide."}), 400

    user = auth_service.login_user(username, password)
    if not user:
        return jsonify({"ok": False, "errore": "Credenziali errate o account non verificato."}), 401

    session.clear()
    session.permanent = True
    session["username"] = user["username"]
    session["ruolo"] = user.get("role", "utente")
    session["regione"] = user.get("regione", "")

    return jsonify(
        {
            "ok": True,
            "username": user["username"],
            "ruolo": session["ruolo"],
            "regione": session["regione"],
        }
    )


@app.route("/api/registrati", methods=["POST"])
@limiter.limit("5 per hour")
def api_registrati():
    data, error = json_body()
    if error:
        return error

    username = str(data.get("username", "")).lower().strip()
    password = data.get("password")
    email = str(data.get("email", "")).strip().lower()
    regione = str(data.get("regione", "")).strip()

    if not valid_username(username):
        return jsonify({"ok": False, "errore": "Username non valido."}), 400
    if not isinstance(password, str) or not (8 <= len(password) <= 128):
        return jsonify({"ok": False, "errore": "La password deve contenere almeno 8 caratteri."}), 400
    if len(email) > 254 or EMAIL_PATTERN.fullmatch(email) is None:
        return jsonify({"ok": False, "errore": "Email non valida."}), 400
    if not (2 <= len(regione) <= 80):
        return jsonify({"ok": False, "errore": "Regione non valida."}), 400

    success, message = auth_service.register_user(username, password, regione, email)
    status = 200 if success else 400
    key = "messaggio" if success else "errore"
    return jsonify({"ok": success, key: message}), status


@app.route("/api/conferma", methods=["POST"])
@limiter.limit("10 per hour")
def api_conferma():
    data, error = json_body()
    if error:
        return error

    username = str(data.get("username", "")).lower().strip()
    code = str(data.get("codice", "")).strip()
    if not valid_username(username) or not code.isdigit() or not (4 <= len(code) <= 12):
        return jsonify({"ok": False, "errore": "Codice di conferma non valido."}), 400

    success, message = auth_service.verify_user(username, code)
    status = 200 if success else 400
    key = "messaggio" if success else "errore"
    return jsonify({"ok": success, key: message}), status


@app.route("/api/logout", methods=["POST"])
@limiter.limit("30 per minute")
def api_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def api_me():
    username = session.get("username")
    if not username:
        return jsonify({"ok": False, "is_logged": False}), 401

    return jsonify(
        {
            "ok": True,
            "username": username,
            "ruolo": session.get("ruolo"),
            "regione": session.get("regione", ""),
            "is_logged": True,
        }
    )


@app.route("/api/utenti", methods=["GET"])
@login_required
@limiter.limit("30 per minute")
def get_utenti():
    try:
        return jsonify({"ok": True, "utenti": auth_service.get_users_list() or []})
    except Exception:
        app.logger.exception("Errore durante il caricamento degli utenti")
        return jsonify({"ok": False, "utenti": []}), 500


@app.route("/api/veicoli", methods=["GET"])
def vehicles():
    return jsonify(opzione_trasporto())


@app.route("/api/navigazione", methods=["POST"])
@limiter.limit("20 per hour")
def navigazione():
    data, error = json_body()
    if error:
        return error

    start = str(data.get("start", "")).strip()
    end = str(data.get("end", "")).strip()
    mezzo = str(data.get("mezzo", "car")).strip()

    if not (2 <= len(start) <= 200) or not (2 <= len(end) <= 200):
        return jsonify({"ok": False, "errore": "Inserisci partenza e destinazione valide."}), 400
    if mezzo not in ALLOWED_VEHICLES:
        return jsonify({"ok": False, "errore": "Mezzo di trasporto non valido."}), 400

    route = maps.get_google_distance(start, end, mezzo)
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato."}), 400

    distanza_km = route.get("distanza_valore", 0) / 1000.0
    emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo)

    username = session.get("username")
    if username:
        storico.registra_viaggio(
            username=username,
            co2=emissioni,
            km=distanza_km,
            mezzo=mezzo,
            start=route.get("start_address"),
            end=route.get("end_address"),
        )

    return jsonify(
        {
            "ok": True,
            "start_address": route.get("start_address"),
            "end_address": route.get("end_address"),
            "distanza_testo": route.get("distanza_testo"),
            "emissioni_co2": f"{emissioni:.2f} kg di CO₂",
            "mezzo_scelto": mezzo,
            "is_logged": bool(username),
            "maps_link": maps.get_maps_link(route.get("start_address"), route.get("end_address"), mezzo),
            "map_embed_url": maps.get_embed_map_url(route.get("start_address"), route.get("end_address"), mezzo),
        }
    )


@app.route("/api/storico", methods=["GET"])
@login_required
def api_storico():
    return jsonify(storico.get_storico_completo(session["username"]))


@app.route("/api/wrapped", defaults={"username": None}, methods=["GET"])
@app.route("/api/wrapped/<username>", methods=["GET"])
@login_required
def api_wrapped(username):
    target_user = username or session["username"]
    if not valid_username(target_user):
        return jsonify({"ok": False, "errore": "Utente non valido."}), 400

    try:
        stats = storico.genera_wrapped(target_user)
        return jsonify(
            {
                "ok": True,
                "target": target_user,
                "dati": stats
                or {
                    "viaggi_totali": 0,
                    "co2_risparmiata": 0,
                    "km_totali": 0,
                    "mezzo_preferito": "Nessuno",
                },
            }
        )
    except Exception:
        app.logger.exception("Errore durante la generazione del riepilogo")
        return jsonify({"ok": False, "errore": "Impossibile generare il riepilogo."}), 500


@app.route("/api/calcolo-alberi", methods=["POST"])
@limiter.limit("30 per minute")
def api_calcolo_alberi():
    data, error = json_body()
    if error:
        return error

    try:
        co2_value = float(data.get("co2"))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "errore": "Valore CO₂ non valido."}), 400

    if not (0 <= co2_value <= 1_000_000):
        return jsonify({"ok": False, "errore": "Valore CO₂ fuori intervallo."}), 400

    days = alberiCO2(co2_value)
    return jsonify(
        {
            "ok": True,
            "co2_kg": co2_value,
            "giorni_per_albero": days,
            "messaggio": f"Un albero impiegherebbe circa {days} giorni.",
        }
    )


@app.route("/api/classifica", methods=["GET"])
@login_required
@limiter.limit("30 per minute")
def api_classifica():
    try:
        return jsonify({"ok": True, "classifica": storico.get_classifica_risparmio()})
    except Exception:
        app.logger.exception("Errore durante il caricamento della classifica")
        return jsonify({"ok": False, "classifica": []}), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=environment == "development",
    )
