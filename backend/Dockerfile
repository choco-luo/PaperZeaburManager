FROM docker.io/eclipse-temurin:21-jre

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

ENV PORT=3000
EXPOSE 25565
EXPOSE 3000
CMD ["node", "dist/index.js"]
