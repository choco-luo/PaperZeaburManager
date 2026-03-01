import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import unzipper from 'unzipper';
import { ptyManager } from './ptyManager';

const router = Router();
const WORK_DIR = path.resolve(process.env.WORK_DIR || '/mc');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}.zip`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip' || file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
      // allow common zip mimetypes; block anything else
      if (ext !== '.zip') {
        cb(new Error('只接受 .zip 檔'));
        return;
      }
    }
    cb(null, true);
  },
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (ptyManager.getStatus()) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: '伺服器執行中，請先停止再上傳' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: '未收到檔案' });
    return;
  }

  try {
    // 確保目標目錄存在
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR, { recursive: true });
    }

    // 串流解壓到 WORK_DIR
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(unzipper.Extract({ path: WORK_DIR }))
        .on('close', resolve)
        .on('error', reject);
    });

    // 刪除暫存檔
    fs.unlinkSync(req.file.path);

    // 回傳偵測到的 jar 清單
    const jars = fs.readdirSync(WORK_DIR).filter((f) => f.endsWith('.jar'));
    res.json({ ok: true, jars });
  } catch (err) {
    try { if (req.file) fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    console.error('解壓失敗:', err);
    res.status(500).json({ error: '解壓失敗' });
  }
});

export default router;
