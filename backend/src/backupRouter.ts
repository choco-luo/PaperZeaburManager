import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const router = Router();
const WORK_DIR = path.resolve(process.env.WORK_DIR || '/mc');
const BACKUP_DIR = path.join(WORK_DIR, 'backups');

function isSafeFilename(filename: string): boolean {
  return (
    /^backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.tar\.gz$/.test(filename) &&
    !filename.includes('..') &&
    !filename.includes('/')
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function generateBackupName(): string {
  const now = new Date();
  return `backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.tar.gz`;
}

router.get('/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.tar.gz'))
      .map((name) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, name));
        return {
          name,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.name.localeCompare(a.name)); // 最新在前
    res.json(files);
  } catch {
    res.status(500).json({ error: '無法讀取備份清單' });
  }
});

router.post('/backups', async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const name = generateBackupName();
    const backupPath = path.join(BACKUP_DIR, name);
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('tar', { gzip: true });

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: WORK_DIR,
      ignore: ['backups/**'],
      dot: true,
    });

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    res.json({ ok: true, name });
  } catch (err) {
    console.error('備份失敗:', err);
    res.status(500).json({ error: '備份失敗' });
  }
});

router.get('/backups/:filename', (req, res) => {
  const { filename } = req.params;
  if (!isSafeFilename(filename)) {
    res.status(400).json({ error: '無效的檔名' });
    return;
  }
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '備份不存在' });
    return;
  }
  res.download(filePath, filename);
});

router.delete('/backups/:filename', (req, res) => {
  const { filename } = req.params;
  if (!isSafeFilename(filename)) {
    res.status(400).json({ error: '無效的檔名' });
    return;
  }
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '備份不存在' });
    return;
  }
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

export default router;
