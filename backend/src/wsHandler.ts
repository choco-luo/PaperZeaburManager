import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { ptyManager } from './ptyManager';
import { verifyToken } from './auth';

export function setupWebSocket(wss: WebSocketServer) {
  ptyManager.on('output', (data: string) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'output', data }));
      }
    });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // 從 URL 參數取得 token
    // ws://backend/ws?token=xxx
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token || !verifyToken(token)) {
      ws.send(JSON.stringify({ type: 'error', message: '未授權' }));
      ws.close();
      return;
    }

    console.log('Client connected');

    ws.send(JSON.stringify({
      type: 'status',
      running: ptyManager.getStatus()
    }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        switch (msg.type) {
          case 'input':
            ptyManager.sendCommand(msg.data);
            break;
          case 'resize':
            ptyManager.resize(msg.cols, msg.rows);
            break;
        }
      } catch (e) {
        console.error('Invalid message:', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}