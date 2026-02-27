import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// 帳號密碼設定，從環境變數讀取
// 格式：USERS=admin:password1,user2:password2
function getUsers(): Record<string, string> {
  const raw = process.env.USERS || 'admin:admin123';
  const users: Record<string, string> = {};
  raw.split(',').forEach((pair) => {
    const [username, password] = pair.split(':');
    if (username && password) {
      users[username.trim()] = password.trim();
    }
  });
  return users;
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<string | null> {
  const users = getUsers();
  const storedPassword = users[username];
  if (!storedPassword) return null;
  if (password !== storedPassword) return null;

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch {
    return null;
  }
}