# Usa un'immagine base leggera di Python
FROM python:3.9-slim

# Imposta la cartella di lavoro dentro il container
WORKDIR /app

# Copia i file e installa le dipendenze
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Comando per avviare l'app (es. usando Flask)
CMD ["python", "app.py"]