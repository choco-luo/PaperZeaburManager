FROM docker.io/eclipse-temurin:21-jre

# 裝 Node.js 和編譯工具
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# 複製 MC 檔案
COPY mc-data/ /mc/

# 複製後端並建置
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

ENV JAR_PATH=/mc/paper-1.21.11-113.jar
ENV WORK_DIR=/mc
ENV PORT=3000

EXPOSE 25565
EXPOSE 3000

CMD ["node", "dist/index.js"]