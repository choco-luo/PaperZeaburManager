import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { ptyManager } from './ptyManager';
import { setupWebSocket } from './wsHandler';
import loginRouter from './loginRouter';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', loginRouter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', mcRunning: ptyManager.getStatus() });
});

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  ptyManager.start(
    process.env.JAR_PATH || '/mc/paper-1.21.11-113.jar',
    process.env.WORK_DIR || '/mc'
  );
});