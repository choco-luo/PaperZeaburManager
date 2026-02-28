import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import 'dotenv/config'
import { ptyManager } from './ptyManager';
import { setupWebSocket } from './wsHandler';
import loginRouter from './loginRouter';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/api', loginRouter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', mcRunning: ptyManager.getStatus() });
});

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  
  // 只有在有 jar 檔的情況下才啟動 PaperMC
  const fs = require('fs')
  const jarPath = process.env.JAR_PATH || '/mc/paper-1.21.11-113.jar'
  if (fs.existsSync(jarPath)) {
    ptyManager.start(jarPath, process.env.WORK_DIR || '/mc')
  } else {
    console.log('沒有找到JAR檔, 跳過PaperMC start (local dev mode)')
  }
});