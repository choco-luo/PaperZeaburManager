import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import fs from 'fs';
import 'dotenv/config'
import { ptyManager } from './ptyManager';
import { setupWebSocket } from './wsHandler';
import loginRouter from './loginRouter';
import filesRouter from './filesRouter';
import { verifyToken } from './auth';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// token 驗證 middleware
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: '未授權' });
    return;
  }
  next();
}

app.use('/api', loginRouter);
app.use('/api', authMiddleware, filesRouter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', mcRunning: ptyManager.getStatus() });
});

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  
  const jarPath = process.env.JAR_PATH || '/mc/paper-1.21.11-113.jar'
  if (fs.existsSync(jarPath)) {
    ptyManager.start(jarPath, process.env.WORK_DIR || '/mc')
  } else {
    console.log('沒有找到JAR檔, 跳過PaperMC start (local dev mode)')
  }
});