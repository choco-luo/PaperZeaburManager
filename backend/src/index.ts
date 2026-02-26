import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { ptyManager } from './ptyManager';
import { setupWebSocket } from './wsHandler';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const JAR_PATH = process.env.JAR_PATH || '/mc/papermc.jar';
const WORK_DIR = process.env.WORK_DIR || '/mc';

// health check endpoint（Zeabur 需要）
app.get('/health', (_, res) => {
  res.json({ status: 'ok', mcRunning: ptyManager.getStatus() });
});

// 啟動 WebSocket 處理
setupWebSocket(wss);

// 啟動伺服器
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  // 啟動 PaperMC
  ptyManager.start(JAR_PATH, WORK_DIR);
});