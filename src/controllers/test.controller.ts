import { Request, Response } from "express";
import { pool } from "../config/db";
require("dotenv").config();

export const testDB = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Database connected successfully ✅",
      time: result.rows[0].now,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed ❌",
      error: error.message,
    });
  }
};

export const testApi = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: "Server connected successfully ✅",
      time: new Date(),
      dbhost: process.env.PG_HOST,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server connection failed",
      error: error.message,
    });
  }
};
