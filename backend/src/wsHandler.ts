import { WebSocket, WebSocketServer } from 'ws';
import { ptyManager } from './ptyManager';

export function setupWebSocket(wss: WebSocketServer) {
  // PTY 有輸出時，廣播給所有連線的客戶端
  ptyManager.on('output', (data: string) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'output', data }));
      }
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // 送出目前伺服器狀態
    ws.send(JSON.stringify({
      type: 'status',
      running: ptyManager.getStatus()
    }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'input':
            // 前端送來的鍵盤輸入
            ptyManager.sendCommand(msg.data);
            break;

          case 'resize':
            // 前端視窗大小改變
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