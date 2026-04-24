import { pool } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';

export const registerUser = async (data: any) => {
  const client = await pool.connect();

  try {
    const { email, password, role = 'homeowner' } = data;

    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const userResult = await client.query(
      `INSERT INTO users (id, email, password, role, is_email_verified)
       VALUES (uuid_generate_v4(), LOWER($1), $2, $3, $4, false)
       RETURNING id, email, role, created_at`,
      [email, hashedPassword, role]
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO profile (id, user_id)
       VALUES (uuid_generate_v4(), $1)`,
      [user.id]
    );

    await client.query('COMMIT');

    return user;

  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw new Error('Email already exists');
    }

    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async (email: string, password: string) => {
  const userRes = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (!userRes.rows.length) throw new Error('User not found');

  const user = userRes.rows[0];

  if (!user.is_active || user.is_blocked) {
    throw new Error('Account is inactive');
  }

  if (!user.password) {
    throw new Error('Use social login');
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) throw new Error('Invalid credentials');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedRefreshToken = await hashPassword(refreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
     VALUES (uuid_generate_v4(), $1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, hashedRefreshToken]
  );

  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const tokensRes = await pool.query(
    `SELECT * FROM refresh_tokens 
     WHERE is_revoked = false 
     AND expires_at > NOW()`
  );

  let matchedToken = null;

  for (const tokenRow of tokensRes.rows) {
    const isMatch = await comparePassword(refreshToken, tokenRow.token);
    if (isMatch) {
      matchedToken = tokenRow;
      break;
    }
  }

  if (!matchedToken) throw new Error('Invalid refresh token');

  const decoded: any = verifyRefreshToken(refreshToken);

  const userRes = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (!userRes.rows.length) throw new Error('User not found');

  const user = userRes.rows[0];

  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1',
    [matchedToken.id]
  );

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken: string) => {
  const tokensRes = await pool.query(
    'SELECT * FROM refresh_tokens WHERE is_revoked = false'
  );

  for (const tokenRow of tokensRes.rows) {
    const isMatch = await comparePassword(refreshToken, tokenRow.token);
    if (isMatch) {
      await pool.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1',
        [tokenRow.id]
      );
      break;
    }
  }
};