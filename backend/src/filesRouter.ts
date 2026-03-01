import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const MC_DIR = process.env.WORK_DIR || '/mc';

router.get('/files', (req, res) => {
  const reqPath = (req.query.path as string) || '/';
  const fullPath = path.join(MC_DIR, reqPath);

  // 防止路徑穿越攻擊
  if (!fullPath.startsWith(MC_DIR)) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }

  try {
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const result = items.map(item => ({
      name: item.name,
      isDir: item.isDirectory(),
      size: item.isFile() ? fs.statSync(path.join(fullPath, item.name)).size : null,
    })).sort((a, b) => {
      // 資料夾排前面
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ path: reqPath, items: result });
  } catch (err) {
    res.status(500).json({ error: '無法讀取目錄' });
  }
});

export default router;