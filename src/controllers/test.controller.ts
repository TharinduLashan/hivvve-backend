import { Request, Response } from 'express';
import { pool } from '../config/db';

export const testDB = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      success: true,
      message: 'Database connected successfully ✅',
      time: result.rows[0].now,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Database connection failed ❌',
      error: error.message,
    });
  }
};