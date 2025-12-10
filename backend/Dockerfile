#abbiamo scelto un immagine leggera
FROM python:3.9-slim 

# la nostra workdir
WORKDIR /app

# installa tutte le librerie 
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

## comando per avviare il backend
CMD ["python", "app.py"]