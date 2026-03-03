import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import 'dotenv/config'
import { ptyManager } from './ptyManager';
import { setupWebSocket } from './wsHandler';
import loginRouter from './loginRouter';
import filesRouter from './filesRouter';
import serverRouter from './serverRouter';
import uploadRouter from './uploadRouter';
import backupRouter from './backupRouter';
import { verifyToken } from './auth';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

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
app.use('/api', authMiddleware, serverRouter);
app.use('/api', authMiddleware, uploadRouter);
app.use('/api', authMiddleware, backupRouter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', mcRunning: ptyManager.getStatus() });
});

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  console.log('MC server will start when manually triggered via /api/server/start')
});
