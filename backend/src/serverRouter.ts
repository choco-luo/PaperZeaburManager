import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { ptyManager } from './ptyManager';

const router = Router();
const WORK_DIR = path.resolve(process.env.WORK_DIR || '/mc');

router.post('/server/start', (req, res) => {
  if (ptyManager.getStatus()) {
    res.status(400).json({ error: '伺服器已在執行中' });
    return;
  }

  const maxMemory: string = req.body?.maxMemory || '2G';
  const minMemory: string = req.body?.minMemory || '1G';

  let jarPath: string;

  // 前端傳 jar 檔名（不含路徑），由後端接上 WORK_DIR
  const jarName: string | undefined = req.body?.jar;

  if (jarName) {
    // 防止路徑穿越
    if (jarName.includes('/') || jarName.includes('\\') || jarName.includes('..')) {
      res.status(400).json({ error: '無效的 jar 檔名' });
      return;
    }
    jarPath = path.join(WORK_DIR, jarName);
  } else {
    // 自動掃描 WORK_DIR 下第一個 .jar
    try {
      const files = fs.readdirSync(WORK_DIR);
      const found = files.find((f) => f.endsWith('.jar'));
      if (!found) {
        res.status(404).json({ error: '找不到 .jar 檔，請先上傳伺服器包' });
        return;
      }
      jarPath = path.join(WORK_DIR, found);
    } catch (err) {
      console.error('掃描目錄失敗:', err);
      res.status(500).json({ error: '無法掃描目錄' });
      return;
    }
  }

  if (!fs.existsSync(jarPath)) {
    res.status(404).json({ error: `找不到檔案: ${path.basename(jarPath)}` });
    return;
  }

  try {
    ptyManager.start(jarPath, WORK_DIR, maxMemory, minMemory);
    res.json({ ok: true, jarPath });
  } catch (err: any) {
    console.error('啟動失敗:', err);
    res.status(500).json({ error: `啟動失敗: ${err?.message ?? String(err)}` });
  }
});

router.post('/server/stop', (req, res) => {
  ptyManager.stop();
  res.json({ ok: true });
});

router.get('/server/jars', (req, res) => {
  try {
    const files = fs.readdirSync(WORK_DIR);
    const jars = files.filter((f) => f.endsWith('.jar'));
    res.json({ jars });
  } catch {
    res.json({ jars: [] });
  }
});

export default router;
