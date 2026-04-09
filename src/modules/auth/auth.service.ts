import { pool } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';

export const registerUser = async (data: any) => {
  const { name, email, password } = data;

  const existing = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length) {
    throw new Error('Email already exists');
  }

  const hashed = await hashPassword(password);

  const user = await pool.query(
    `INSERT INTO users (id, email, password)
     VALUES (uuid_generate_v4(), $1, $2)
     RETURNING *`,
    [email, hashed]
  );

  return user.rows[0];
};

export const loginUser = async (email: string, password: string) => {
  const userRes = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (!userRes.rows.length) throw new Error('User not found');

  const user = userRes.rows[0];

  if (!user.password) {
    throw new Error('Use social login');
  }

  const valid = await comparePassword(password, user.password);

  if (!valid) throw new Error('Invalid credentials');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
     VALUES (uuid_generate_v4(), $1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshToken]
  );

  return { accessToken, refreshToken, user };
};

export const refreshAccessToken = async (token: string) => {
  const stored = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND is_revoked = false',
    [token]
  );

  if (!stored.rows.length) throw new Error('Invalid refresh token');

  const decoded: any = verifyRefreshToken(token);

  const userRes = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [decoded.userId]
  );

  const newAccessToken = generateAccessToken(userRes.rows[0]);

  return { accessToken: newAccessToken };
};

export const logoutUser = async (token: string) => {
  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
    [token]
  );
};