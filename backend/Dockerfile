FROM node:20-slim

# 安裝 Java 和 node-pty 需要的編譯工具
RUN apt-get update && apt-get install -y \
    openjdk-21-jre-headless \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 建立 mc 資料夾
RUN mkdir -p /mc

# 複製後端程式碼
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 複製 PaperMC jar 進容器
# 你需要先把 papermc.jar 放在 backend/ 底下
COPY papermc.jar /mc/papermc.jar

# 啟動時自動同意 Minecraft EULA
RUN echo "eula=true" > /mc/eula.txt

# 設定環境變數
ENV JAR_PATH=/mc/papermc.jar
ENV WORK_DIR=/mc
ENV PORT=3000

EXPOSE 3000
# Minecraft 預設 port
EXPOSE 25565

CMD ["node", "dist/index.js"]