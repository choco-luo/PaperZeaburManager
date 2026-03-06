import * as pty from 'node-pty';
import { EventEmitter } from 'events';

class PtyManager extends EventEmitter {
  private shell: pty.IPty | null = null;
  private isRunning = false;
  private manuallyStopped = false;
  private logBuffer: string[] = [];
  private readonly MAX_BUFFER = 1000;

  private stats = {
    players: '--' as string,
    playerList: [] as string[],
  };

  start(jarPath: string, workDir: string, maxMemory = '2G', minMemory = '1G') {
    if (this.isRunning) return;
    this.manuallyStopped = false;

    this.shell = pty.spawn('java', [
      `-Xmx${maxMemory}`, `-Xms${minMemory}`,
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
    this.emit('started');

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
      this.stats = { players: '--', playerList: [] };
      this.emit('exit', exitCode);
      if (!this.manuallyStopped) {
        setTimeout(() => this.start(jarPath, workDir, maxMemory, minMemory), 10000);
      }
      this.manuallyStopped = false;
    });
  }

  private stripAnsi(str: string): string {
    return str.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
  }

  private parseStats(data: string) {
    const clean = this.stripAnsi(data);
    // 玩家加入
    const joinMatch = clean.match(/(\w+) joined the game/);
    if (joinMatch) {
      const name = joinMatch[1];
      if (!this.stats.playerList.includes(name)) {
        this.stats.playerList.push(name);
        this.stats.players = `${this.stats.playerList.length}`;
        this.emit('stats', this.stats);
      }
    }

    // 玩家離開
    const leaveMatch = clean.match(/(\w+) left the game/);
    if (leaveMatch) {
      const name = leaveMatch[1];
      this.stats.playerList = this.stats.playerList.filter(n => n !== name);
      this.stats.players = `${this.stats.playerList.length}`;
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
      this.manuallyStopped = true;
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