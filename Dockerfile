
FROM node:18-alpine

WORKDIR /app
COPY web/package.json web/package-lock.json ./

RUN npm install --production

COPY web/ ./

RUN npm init -y && \
    npm install express

EXPOSE 80

CMD ["node", "server.js"]
