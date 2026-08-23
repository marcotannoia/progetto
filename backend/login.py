import boto3
import os
import hmac
import hashlib
import base64
import secrets
from urllib.parse import urlencode

import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

REGION_NAME = os.getenv("AWS_REGION")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")
COGNITO_DOMAIN = os.getenv("COGNITO_DOMAIN", "").rstrip("/")
OAUTH_CALLBACK_URL = os.getenv("OAUTH_CALLBACK_URL", "")

try:
    client = boto3.client('cognito-idp', region_name=REGION_NAME)
except Exception as e:
    print(f"ERRORE BOTO3: {e}")
    client = None

def get_secret_hash(username):
    if not CLIENT_SECRET or not CLIENT_ID: return None
    msg = username + CLIENT_ID
    dig = hmac.new(
        str(CLIENT_SECRET).encode('utf-8'), 
        msg=str(msg).encode('utf-8'), 
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def traduci_errore_aws(error):
    if not hasattr(error, 'response'):
        return "Servizio di autenticazione temporaneamente non disponibile."
    code = error.response['Error']['Code']
    
    if code == 'InvalidParameterException':
        return "Parametri di registrazione non validi."
    elif code == 'UsernameExistsException':
        return "Questo username è già in uso."
    elif code == 'LimitExceededException':
        return "Troppi tentativi. Riprova più tardi."
    return "Servizio di autenticazione temporaneamente non disponibile."

def register_user(username, password, regione, email):
    if not client: return False, "Errore server: Credenziali AWS mancanti."
    try:
        secret_hash = get_secret_hash(username)

        client.sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=username,
            Password=password,
            UserAttributes=[
                {'Name': 'custom:regione', 'Value': regione},
                {'Name': 'email', 'Value': email}
            ]
        )

        return True, "CODICE_INVIATO"

    except ClientError as e:
        return False, traduci_errore_aws(e)
    except Exception:
        return False, "Servizio di autenticazione temporaneamente non disponibile."
def verify_user(username, code):
    if not client: return False, "Servizio di autenticazione non disponibile."
    try:
        client.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=get_secret_hash(username),
            Username=username,
            ConfirmationCode=code
        )
        return True, "Account verificato."
    except ClientError as error:
        code = error.response.get('Error', {}).get('Code')
        if code in {'CodeMismatchException', 'ExpiredCodeException'}:
            return False, "Codice non valido o scaduto."
        if code == 'NotAuthorizedException':
            return False, "Account già verificato."
        return False, traduci_errore_aws(error)
    except Exception:
        return False, "Servizio di autenticazione temporaneamente non disponibile."

def login_user(username, password):
    if not client: return None
    try:
        secret_hash = get_secret_hash(username)
        resp = client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            }
        )
        access_token = resp['AuthenticationResult']['AccessToken']
        user_info = client.get_user(AccessToken=access_token)
        
        regione = ""
        for attr in user_info['UserAttributes']:
            if attr['Name'] == 'custom:regione':
                regione = attr['Value']

        return {"username": username, "regione": regione, "role": "utente"}
    except ClientError:
        return None
    except Exception:
        return None


def create_google_authorization_url(state):
    if not all((COGNITO_DOMAIN, CLIENT_ID, OAUTH_CALLBACK_URL)):
        return None

    query = urlencode({
        "identity_provider": "Google",
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": OAUTH_CALLBACK_URL,
        "scope": "openid email profile aws.cognito.signin.user.admin",
        "state": state,
    })
    return f"{COGNITO_DOMAIN}/oauth2/authorize?{query}"


def exchange_google_code(code):
    if not all((COGNITO_DOMAIN, CLIENT_ID, CLIENT_SECRET, OAUTH_CALLBACK_URL)):
        return None, "oauth_configuration_missing"
    if not client:
        return None, "cognito_client_unavailable"

    try:
        response = requests.post(
            f"{COGNITO_DOMAIN}/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "client_id": CLIENT_ID,
                "code": code,
                "redirect_uri": OAUTH_CALLBACK_URL,
            },
            auth=(CLIENT_ID, CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        response.raise_for_status()
        access_token = response.json().get("access_token")
        if not access_token:
            return None, "access_token_missing"

        user_info = client.get_user(AccessToken=access_token)
        attributes = {
            item["Name"]: item["Value"]
            for item in user_info.get("UserAttributes", [])
        }
        public_username = attributes.get("preferred_username", "").lower().strip()
        return {
            "cognito_username": user_info["Username"],
            "username": public_username,
            "needs_username": not public_username,
            "regione": attributes.get("custom:regione", ""),
            "role": "utente",
        }, None
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else "unknown"
        return None, f"token_endpoint_http_{status}"
    except requests.RequestException:
        return None, "token_endpoint_unreachable"
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code", "unknown")
        return None, f"cognito_{code}"
    except (KeyError, ValueError):
        return None, "invalid_provider_response"


def new_oauth_state():
    return secrets.token_urlsafe(32)


def set_public_username(cognito_username, public_username):
    if not client or not USER_POOL_ID:
        return False, "Servizio di autenticazione non disponibile."

    normalized = public_username.lower().strip()
    try:
        paginator = client.get_paginator("list_users")
        for page in paginator.paginate(UserPoolId=USER_POOL_ID):
            for user in page.get("Users", []):
                if user.get("Username") == cognito_username:
                    continue

                attributes = {
                    item["Name"]: item["Value"]
                    for item in user.get("Attributes", [])
                }
                existing_public = attributes.get("preferred_username", "").lower().strip()
                existing_login = user.get("Username", "").lower().strip()
                if normalized in {existing_public, existing_login}:
                    return False, "Questo username è già in uso."

        client.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=cognito_username,
            UserAttributes=[{"Name": "preferred_username", "Value": normalized}],
        )
        return True, normalized
    except ClientError:
        return False, "Non è stato possibile salvare lo username. Riprova."


def get_users_list():
    if not client: return []
    try:
        lista = []
        paginator = client.get_paginator('list_users')
        for page in paginator.paginate(UserPoolId=USER_POOL_ID):
            for user in page.get('Users', []):
                attributes = {
                    item['Name']: item['Value']
                    for item in user.get('Attributes', [])
                }
                cognito_username = user.get('Username', '')
                public_username = attributes.get('preferred_username', '').lower().strip()
                if not public_username and cognito_username.lower().startswith('google_'):
                    continue

                lista.append({
                    "username": public_username or cognito_username,
                    "regione": attributes.get('custom:regione', '').lower(),
                })
        return lista
    except Exception:
        return []
