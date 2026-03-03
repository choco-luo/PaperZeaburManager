import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();
const MC_DIR = path.resolve(process.env.WORK_DIR || '/mc');

// 設定 multer 儲存位置
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const targetDir = req.query.path as string || '/';
    const normalized = targetDir.startsWith('/') ? targetDir.slice(1) : targetDir;
    const fullPath = path.resolve(MC_DIR, normalized);
    
    const relative = path.relative(MC_DIR, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return cb(new Error('禁止存取'), fullPath);
    }
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (_req, file, cb) => {
    // 解決中文檔名問題
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

function resolveSafePath(reqPath: string): string | null {
  const normalized = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
  const fullPath = path.resolve(MC_DIR, normalized);
  const relative = path.relative(MC_DIR, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return fullPath;
}

router.get('/files', (req, res) => {
  const reqPath = (req.query.path as string) || '/';
  const fullPath = resolveSafePath(reqPath);

  if (!fullPath) {
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
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ path: reqPath, items: result });
  } catch (err) {
    res.status(500).json({ error: '無法讀取目錄' });
  }
});

// 讀取檔案內容
router.get('/file/content', (req, res) => {
  const targetPath = req.query.path as string;
  if (!targetPath) {
    res.status(400).json({ error: '缺少 path 參數' });
    return;
  }
  
  const fullPath = resolveSafePath(targetPath);
  if (!fullPath) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: '找不到檔案' });
    return;
  }
  
  try {
    // 限制讀取大小 (例如 5MB) 避免把記憶體塞爆
    const stat = fs.statSync(fullPath);
    if (stat.size > 5 * 1024 * 1024) {
      res.status(400).json({ error: '檔案過大，請透過下載方式檢視' });
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: '讀取檔案失敗' });
  }
});

// 儲存檔案內容
router.put('/file/content', (req, res) => {
  const { path: targetPath, content } = req.body;
  if (!targetPath || content === undefined) {
    res.status(400).json({ error: '缺少參數' });
    return;
  }
  
  const fullPath = resolveSafePath(targetPath);
  if (!fullPath) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '寫入檔案失敗' });
  }
});

// 重新命名檔案或資料夾
router.post('/file/rename', (req, res) => {
  const { path: oldPath, newName } = req.body;
  if (!oldPath || !newName) {
    res.status(400).json({ error: '缺少參數' });
    return;
  }
  
  const fullOldPath = resolveSafePath(oldPath);
  if (!fullOldPath) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  const dirName = path.dirname(fullOldPath);
  const fullNewPath = path.resolve(dirName, newName);
  
  // 安全檢查新的路徑
  const relative = path.relative(MC_DIR, fullNewPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  try {
    if (fs.existsSync(fullNewPath)) {
      res.status(400).json({ error: '目標名稱已存在' });
      return;
    }
    fs.renameSync(fullOldPath, fullNewPath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '重新命名失敗' });
  }
});

// 刪除檔案或資料夾
router.delete('/file', (req, res) => {
  const targetPath = req.query.path as string;
  if (!targetPath) {
    res.status(400).json({ error: '缺少 path 參數' });
    return;
  }
  
  const fullPath = resolveSafePath(targetPath);
  if (!fullPath) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  try {
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: '找不到檔案' });
      return;
    }
    fs.rmSync(fullPath, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '刪除失敗' });
  }
});

// 建立資料夾
router.post('/file/folder', (req, res) => {
  const { path: dirPath, name } = req.body;
  if (!dirPath || !name) {
    res.status(400).json({ error: '缺少參數' });
    return;
  }
  
  const baseDir = resolveSafePath(dirPath);
  if (!baseDir) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  const newDirPath = path.resolve(baseDir, name);
  const relative = path.relative(MC_DIR, newDirPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.status(403).json({ error: '禁止存取' });
    return;
  }
  
  try {
    if (fs.existsSync(newDirPath)) {
      res.status(400).json({ error: '資料夾已存在' });
      return;
    }
    fs.mkdirSync(newDirPath, { recursive: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '建立資料夾失敗' });
  }
});

// 下載檔案
router.get('/file/download', (req, res) => {
  const targetPath = req.query.path as string;
  if (!targetPath) {
    res.status(400).json({ error: '缺少 path 參數' });
    return;
  }
  
  const fullPath = resolveSafePath(targetPath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    res.status(404).json({ error: '找不到檔案' });
    return;
  }
  
  res.download(fullPath);
});

// 單一檔案上傳
router.post('/file/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || '上傳失敗' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: '未收到檔案' });
      return;
    }
    res.json({ ok: true });
  });
});

export default router;