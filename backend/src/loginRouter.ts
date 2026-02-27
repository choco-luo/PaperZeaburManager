import { Router } from 'express';
import { verifyLogin } from './auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '請輸入帳號和密碼' });
    return;
  }

  const token = await verifyLogin(username, password);
  if (!token) {
    res.status(401).json({ error: '帳號或密碼錯誤' });
    return;
  }

  res.json({ token });
});

export default router;