
# Usa Node.js oficial
FROM node:18-slim

WORKDIR /app

# 1) Copia los manifiestos y haz npm install solo de prod
COPY web/web/package.json web/web/package-lock.json ./
RUN npm install --production dotenv

# 2) Copia el resto del código
COPY web/ ./

# 3) Exponemos el puerto 80
EXPOSE 80

# 4) Arrancamos la app
CMD ["node", "server.js"]

