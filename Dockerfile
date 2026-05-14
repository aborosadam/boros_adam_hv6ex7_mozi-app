FROM node:20-alpine

WORKDIR /app

# Telepítsük a függőségeket
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Másoljuk a forráskódot
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Adatbázis könyvtár
RUN mkdir -p /app/data

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/mozi.db

EXPOSE 3000

CMD ["node", "server.js"]
