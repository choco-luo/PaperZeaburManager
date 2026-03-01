import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { ptyManager } from './ptyManager';
import { verifyToken } from './auth';

function broadcast(wss: WebSocketServer, payload: object) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export function setupWebSocket(wss: WebSocketServer) {
  ptyManager.on('output', (data: string) => {
    broadcast(wss, { type: 'output', data });
  });

  ptyManager.on('started', () => {
    broadcast(wss, { type: 'status', running: true });
  });

  ptyManager.on('exit', () => {
    broadcast(wss, { type: 'status', running: false });
  });

  // 推送即時狀態給所有客戶端
  ptyManager.on('stats', (stats) => {
    broadcast(wss, { type: 'stats', data: stats });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token || !verifyToken(token)) {
      ws.send(JSON.stringify({ type: 'error', message: '未授權' }));
      ws.close();
      return;
    }

    console.log('Client connected');

    // 補發歷史 log
    const buffer = ptyManager.getBuffer();
    if (buffer.length > 0) {
      ws.send(JSON.stringify({ type: 'output', data: buffer.join('') }));
    }

    // 推送目前狀態
    ws.send(JSON.stringify({ type: 'status', running: ptyManager.getStatus() }));
    ws.send(JSON.stringify({ type: 'stats', data: ptyManager.getStats() }));

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