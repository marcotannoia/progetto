import boto3
import os
import hmac
import hashlib
import base64
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

REGION_NAME = os.getenv("AWS_REGION")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")

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

def get_users_list():
    if not client: return []
    try:
        lista = []
        paginator = client.get_paginator('list_users')
        for page in paginator.paginate(
            UserPoolId=USER_POOL_ID,
            AttributesToGet=['custom:regione']
        ):
            for user in page.get('Users', []):
                regione = next(
                    (attribute['Value'] for attribute in user['Attributes'] if attribute['Name'] == 'custom:regione'),
                    ""
                )
                lista.append({"username": user['Username'], "regione": regione.lower()})
        return lista
    except Exception:
        return []
