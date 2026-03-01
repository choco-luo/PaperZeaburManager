import * as pty from 'node-pty';
import { EventEmitter } from 'events';

class PtyManager extends EventEmitter {
  private shell: pty.IPty | null = null;
  private isRunning = false;
  private logBuffer: string[] = [];
  private readonly MAX_BUFFER = 1000;
  private statsInterval: NodeJS.Timeout | null = null;

  private stats = {
    tps: '--' as string,
    players: '--' as string,
    memory: '--' as string,
    playerList: [] as string[],
  };

  start(jarPath: string, workDir: string) {
    if (this.isRunning) return;

    this.shell = pty.spawn('java', [
      '-Xmx2G', '-Xms1G',
      '-jar', jarPath,
      '--nogui'
    ], {
      name: 'xterm-color',
      cols: 100,
      rows: 40,
      cwd: workDir,
      env: process.env as { [key: string]: string },
    });

    this.isRunning = true;

    this.shell.onData((data: string) => {
      this.logBuffer.push(data);
      if (this.logBuffer.length > this.MAX_BUFFER) {
        this.logBuffer.shift();
      }
      this.parseStats(data);
      this.emit('output', data);
    });

    this.shell.onExit(({ exitCode }) => {
      console.log(`PaperMC exited with code ${exitCode}`);
      this.isRunning = false;
      this.shell = null;
      this.stats = { tps: '--', players: '--', memory: '--', playerList: [] };
      this.emit('exit', exitCode);
      setTimeout(() => this.start(jarPath, workDir), 10000);
    });
  }

  private parseStats(data: string) {
    // 解析 TPS
    const tpsMatch = data.match(/TPS from last 1m, 5m, 15m: [\§a-z]*(\d+\.?\d*)/i);
    if (tpsMatch) {
      this.stats.tps = parseFloat(tpsMatch[1]).toFixed(1);
      this.emit('stats', this.stats);
    }

    // 解析玩家數
    const playersMatch = data.match(/There are (\d+) of a max of (\d+) players online/);
    if (playersMatch) {
      this.stats.players = `${playersMatch[1]}/${playersMatch[2]}`;
      const namesPart = data.split(':').slice(-1)[0];
      if (namesPart && namesPart.trim().length > 0) {
        this.stats.playerList = namesPart
          .trim()
          .split(',')
          .map(n => n.trim())
          .filter(n => n.length > 0);
      } else {
        this.stats.playerList = [];
      }
      this.emit('stats', this.stats);
    }

    // 解析記憶體
    const memMatch = data.match(/(\d+)\/(\d+) MB/i);
    if (memMatch) {
      this.stats.memory = `${memMatch[1]}MB`;
      this.emit('stats', this.stats);
    }
  }

  getStats() {
    return this.stats;
  }

  getBuffer() {
    return this.logBuffer;
  }

  stop() {
    if (this.shell && this.isRunning) {
      this.shell.write('stop\r');
    }
  }

  sendCommand(input: string) {
    if (this.shell && this.isRunning) {
      this.shell.write(input);
    }
  }

  resize(cols: number, rows: number) {
    if (this.shell && this.isRunning) {
      this.shell.resize(cols, rows);
    }
  }

  getStatus() {
    return this.isRunning;
  }
}

export const ptyManager = new PtyManager();