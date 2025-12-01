# Usa l'immagine di Node
FROM node:18-alpine

# Cartella di lavoro dentro il container
WORKDIR /app

# Copia i file di configurazione e installa le librerie
COPY package*.json ./
RUN npm install

# Copia tutto il resto del codice
COPY . .

# Avvia il server di sviluppo
CMD ["npm", "start"]