import * as pty from 'node-pty';
import { EventEmitter } from 'events';

class PtyManager extends EventEmitter {
  private shell: pty.IPty | null = null;
  private isRunning = false;
  private logBuffer: string[] = [];
  private readonly MAX_BUFFER = 1000;

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
      this.emit('output', data);
    });

    this.shell.onExit(({ exitCode }) => {
      console.log(`PaperMC exited with code ${exitCode}`);
      this.isRunning = false;
      this.shell = null;
      setTimeout(() => this.start(jarPath, workDir), 10000);
    });
  }

  getBuffer() {
    return this.logBuffer;
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