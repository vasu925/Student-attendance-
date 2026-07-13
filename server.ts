import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import pg from "pg";
import * as dotenv from "dotenv";

// Load environment variables for local testing
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "attendance.db");

// ==========================================
// SECURITY & SESSION SYSTEMS
// ==========================================

const PASSWORD_SALT = process.env.PASSWORD_SALT || "university_attendance_secure_salt_2026";
const JWT_SECRET = process.env.JWT_SECRET || "university_attendance_system_secret_token_key_2026";

/**
 * Hash password securely using HMAC-SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHmac("sha256", PASSWORD_SALT).update(password).digest("hex");
}

/**
 * Check if input matches stored password (supports legacy plain text fallback and auto-upgrades)
 */
function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  if (storedPassword === inputPassword) {
    return true; // plain text legacy match
  }
  return hashPassword(inputPassword) === storedPassword;
}

/**
 * Generate standard compliance HMAC-SHA256 JWT Token
 */
function generateToken(userId: number, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({
    userId,
    email,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24-hour expiration
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

/**
 * Verify JWT Token and return payload or null
 */
function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to verify Authorization: Bearer <token>
 */
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Authorization token missing. Authentication required." });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Your session has expired or is invalid. Please sign in again." });
  }

  req.user = decoded;
  next();
}

// ==========================================
// DATABASE HYBRID ENGINE (POSTGRESQL / SQLITE)
// ==========================================

let pgPool: pg.Pool | null = null;
let sqliteDb: any = null;

if (process.env.SQL_HOST) {
  pgPool = new pg.Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
  console.log("Database Connection: Cloud SQL PostgreSQL connection initialized.");
} else {
  sqliteDb = new Database(DB_FILE);
  console.log("Database Connection: Using local SQLite database.");
}

/**
 * Convert SQLite style '?' parameters to PostgreSQL '$1', '$2', etc. parameters
 */
function convertSql(sqliteSql: string): string {
  let pgSql = sqliteSql;
  let index = 1;
  while (pgSql.includes("?")) {
    pgSql = pgSql.replace("?", `$${index++}`);
  }
  return pgSql;
}

const dbHelper = {
  async get(sql: string, ...params: any[]): Promise<any> {
    if (pgPool) {
      const pgSql = convertSql(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(...params);
    }
  },
  async all(sql: string, ...params: any[]): Promise<any[]> {
    if (pgPool) {
      const pgSql = convertSql(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },
  async run(sql: string, ...params: any[]): Promise<{ lastInsertRowid: number }> {
    if (pgPool) {
      let pgSql = convertSql(sql);
      const isInsert = pgSql.trim().toUpperCase().startsWith("INSERT");
      if (isInsert && !pgSql.toUpperCase().includes("RETURNING")) {
        pgSql += " RETURNING id";
      }
      const res = await pgPool.query(pgSql, params);
      const lastInsertRowid = res.rows[0]?.id || 0;
      return { lastInsertRowid };
    } else {
      const info = sqliteDb.prepare(sql).run(...params);
      return { lastInsertRowid: Number(info.lastInsertRowid) };
    }
  }
};

/**
 * Initialize and seed the database (supports both SQLite and Cloud SQL)
 */
async function initDatabase() {
  if (pgPool) {
    try {
      console.log("Creating Cloud SQL PostgreSQL tables if they do not exist...");
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          code VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT
        );
        CREATE TABLE IF NOT EXISTS faculty (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password TEXT,
          phone VARCHAR(255),
          department_id INTEGER,
          profile_pic TEXT,
          photo TEXT
        );
        CREATE TABLE IF NOT EXISTS password_resets (
          email VARCHAR(255) PRIMARY KEY,
          token VARCHAR(255),
          expires BIGINT
        );
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          code VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          department_id INTEGER,
          year INTEGER,
          semester INTEGER
        );
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          roll_number VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          gender VARCHAR(255),
          dob VARCHAR(255),
          department_id INTEGER,
          year INTEGER,
          semester INTEGER,
          section VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(255),
          address TEXT,
          parent_name VARCHAR(255),
          parent_phone VARCHAR(255),
          photo TEXT
        );
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          date VARCHAR(255),
          department_id INTEGER,
          semester INTEGER,
          section VARCHAR(255),
          subject_id INTEGER,
          created_by INTEGER,
          created_at VARCHAR(255)
        );
        CREATE TABLE IF NOT EXISTS attendance_details (
          id SERIAL PRIMARY KEY,
          attendance_id INTEGER,
          student_id INTEGER,
          status VARCHAR(255),
          remarks TEXT
        );
      `);

      console.log("Checking Cloud SQL tables for seeding...");
      const deptCountRes = await dbHelper.get("SELECT COUNT(*) as count FROM departments");
      const count = Number(deptCountRes?.count || 0);
      
      if (count === 0) {
        console.log("Seeding Cloud SQL database with default academic data...");
        
        // Seed Departments
        const depts = [
          ["CSE", "Computer Science & Engineering", "Computing theory, algorithms, software engineering, and artificial intelligence."],
          ["ECE", "Electronics & Communication Engineering", "Electronics hardware, communication links, IoT systems, and signal processing."],
          ["ME", "Mechanical Engineering", "Design, thermal systems, manufacturing, and mechanics."],
          ["EE", "Electrical Engineering", "Power networks, electrical drives, and control systems."]
        ];
        for (const d of depts) {
          await dbHelper.run("INSERT INTO departments (code, name, description) VALUES (?, ?, ?)", d[0], d[1], d[2]);
        }

        // Seed Faculty
        await dbHelper.run(
          "INSERT INTO faculty (name, email, password, phone, department_id, profile_pic, photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          "Dr. Rajesh Sharma", "rajesh.cse@college.edu", "admin", "+919876543210", 1,
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        );
        await dbHelper.run(
          "INSERT INTO faculty (name, email, password, phone, department_id, profile_pic, photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          "Dr. Priya Nair", "priya.ece@college.edu", "admin", "+919876543211", 2,
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
        );

        // Seed Subjects
        const subs = [
          ["CS-401", "Cryptography & Network Security", 1, 4, 8],
          ["CS-402", "Cloud Computing Architecture", 1, 4, 8],
          ["CS-403", "Neural Networks & Deep Learning", 1, 4, 8],
          ["CS-404", "Software Project Management", 1, 4, 8],
          ["EC-401", "Wireless Communications", 2, 4, 8],
          ["EC-402", "Embedded Systems & IoT", 2, 4, 8]
        ];
        for (const s of subs) {
          await dbHelper.run("INSERT INTO subjects (code, name, department_id, year, semester) VALUES (?, ?, ?, ?, ?)", s[0], s[1], s[2], s[3], s[4]);
        }

        // Seed Students
        const studs = [
          ["2023CSE01", "Aarav Sharma", "Male", "2004-05-15", 1, 4, 8, "A", "aarav.sharma@gmail.com", "+919111111111", "12, MG Road, Bangalore", "Sanjay Sharma", "+919222222222", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE02", "Ananya Iyer", "Female", "2004-09-22", 1, 4, 8, "A", "ananya.iyer@gmail.com", "+919111111112", "45, Jayanagar, Bangalore", "Kalyan Iyer", "+919222222223", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE03", "Kabir Verma", "Male", "2004-02-10", 1, 4, 8, "A", "kabir.verma@gmail.com", "+919111111113", "78, Indiranagar, Bangalore", "Ramesh Verma", "+919222222224", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE04", "Diya Patel", "Female", "2004-12-05", 1, 4, 8, "A", "diya.patel@gmail.com", "+919111111114", "11, Koramangala, Bangalore", "Bharat Patel", "+919222222225", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE05", "Rohan Das", "Male", "2004-07-19", 1, 4, 8, "A", "rohan.das@gmail.com", "+919111111115", "302, Whitefield, Bangalore", "Amit Das", "+919222222226", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE06", "Sneha Reddy", "Female", "2004-03-30", 1, 4, 8, "A", "sneha.reddy@gmail.com", "+919111111116", "88, HSR Layout, Bangalore", "Prabhakar Reddy", "+919222222227", "https://images.unsplash.com/photo-1534751516642-a131ffd473fd?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE07", "Vihaan Rao", "Male", "2004-10-12", 1, 4, 8, "A", "vihaan.rao@gmail.com", "+919111111117", "55, Electronic City, Bangalore", "Srinivas Rao", "+919222222228", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE08", "Meera Joshi", "Female", "2004-06-25", 1, 4, 8, "A", "meera.joshi@gmail.com", "+919111111118", "19, Bannerghatta Road, Bangalore", "Dinesh Joshi", "+919222222229", "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE09", "Aditya Sen", "Male", "2004-01-14", 1, 4, 8, "A", "aditya.sen@gmail.com", "+919111111119", "104, Outer Ring Road, Bangalore", "Nitin Sen", "+919222222230", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"],
          ["2023CSE10", "Ishaan Gupta", "Male", "2004-08-08", 1, 4, 8, "A", "ishaan.gupta@gmail.com", "+919111111120", "42, Marathahalli, Bangalore", "Anil Gupta", "+919222222231", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"]
        ];
        for (const s of studs) {
          await dbHelper.run(`
            INSERT INTO students (
              roll_number, full_name, gender, dob, department_id, year, semester, section, email, phone, address, parent_name, parent_phone, photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, ...s);
        }

        // Seed Attendance Header
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const twoDaysAgoStr = new Date(Date.now() - 172800000).toISOString().split("T")[0];

        const a1 = await dbHelper.run("INSERT INTO attendance (date, department_id, semester, section, subject_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", todayStr, 1, 8, "A", 1, 1, new Date().toISOString());
        const a2 = await dbHelper.run("INSERT INTO attendance (date, department_id, semester, section, subject_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", yesterdayStr, 1, 8, "A", 2, 1, new Date(Date.now() - 86400000).toISOString());
        const a3 = await dbHelper.run("INSERT INTO attendance (date, department_id, semester, section, subject_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", twoDaysAgoStr, 1, 8, "A", 3, 1, new Date(Date.now() - 172800000).toISOString());

        // Seed Details
        // Session 1
        const s1Details = [
          [a1.lastInsertRowid, 1, "Present", "On time"], [a1.lastInsertRowid, 2, "Present", "On time"], [a1.lastInsertRowid, 3, "Absent", "Unexcused"], [a1.lastInsertRowid, 4, "Present", "On time"],
          [a1.lastInsertRowid, 5, "Late", "Bus delay"], [a1.lastInsertRowid, 6, "Present", "On time"], [a1.lastInsertRowid, 7, "Present", "On time"], [a1.lastInsertRowid, 8, "Absent", "Fever"],
          [a1.lastInsertRowid, 9, "Present", "On time"], [a1.lastInsertRowid, 10, "Present", "On time"]
        ];
        for (const sd of s1Details) {
          await dbHelper.run("INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES (?, ?, ?, ?)", ...sd);
        }

        // Session 2
        const s2Details = [
          [a2.lastInsertRowid, 1, "Present", ""], [a2.lastInsertRowid, 2, "Present", ""], [a2.lastInsertRowid, 3, "Present", ""], [a2.lastInsertRowid, 4, "Present", ""], [a2.lastInsertRowid, 5, "Present", ""],
          [a2.lastInsertRowid, 6, "Present", ""], [a2.lastInsertRowid, 7, "Present", ""], [a2.lastInsertRowid, 8, "Absent", "Fever"], [a2.lastInsertRowid, 9, "Present", ""], [a2.lastInsertRowid, 10, "Late", "Rain delay"]
        ];
        for (const sd of s2Details) {
          await dbHelper.run("INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES (?, ?, ?, ?)", ...sd);
        }

        // Session 3
        const s3Details = [
          [a3.lastInsertRowid, 1, "Present", ""], [a3.lastInsertRowid, 2, "Present", ""], [a3.lastInsertRowid, 3, "Absent", "Family travel"], [a3.lastInsertRowid, 4, "Present", ""],
          [a3.lastInsertRowid, 5, "Present", ""], [a3.lastInsertRowid, 6, "Present", ""], [a3.lastInsertRowid, 7, "Present", ""], [a3.lastInsertRowid, 8, "Present", ""], [a3.lastInsertRowid, 9, "Absent", "Unexcused"],
          [a3.lastInsertRowid, 10, "Present", ""]
        ];
        for (const sd of s3Details) {
          await dbHelper.run("INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES (?, ?, ?, ?)", ...sd);
        }

        console.log("Cloud SQL database successfully seeded.");
      }
    } catch (e) {
      console.error("Failed to seed or verify Cloud SQL database:", e);
    }
  } else {
    // SQLite initialization & schema setup
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        department_id INTEGER,
        profile_pic TEXT,
        photo TEXT
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        department_id INTEGER,
        year INTEGER,
        semester INTEGER
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT UNIQUE,
        full_name TEXT,
        gender TEXT,
        dob TEXT,
        department_id INTEGER,
        year INTEGER,
        semester INTEGER,
        section TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        photo TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        department_id INTEGER,
        semester INTEGER,
        section TEXT,
        subject_id INTEGER,
        created_by INTEGER,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attendance_id INTEGER,
        student_id INTEGER,
        status TEXT,
        remarks TEXT,
        FOREIGN KEY (attendance_id) REFERENCES attendance (id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT PRIMARY KEY,
        token TEXT,
        expires INTEGER
      );
    `);

    // Check if seeding is required
    const deptCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM departments").get() as { count: number };
    if (deptCount.count === 0) {
      console.log("Seeding SQLite database with default academic data...");
      
      // Seed Departments
      const insertDept = sqliteDb.prepare("INSERT INTO departments (code, name, description) VALUES (?, ?, ?)");
      const depts = [
        ["CSE", "Computer Science & Engineering", "Computing theory, algorithms, software engineering, and artificial intelligence."],
        ["ECE", "Electronics & Communication Engineering", "Electronics hardware, communication links, IoT systems, and signal processing."],
        ["ME", "Mechanical Engineering", "Design, thermal systems, manufacturing, and mechanics."],
        ["EE", "Electrical Engineering", "Power networks, electrical drives, and control systems."]
      ];
      depts.forEach(d => insertDept.run(d[0], d[1], d[2]));

      // Seed Faculty
      const insertFaculty = sqliteDb.prepare("INSERT INTO faculty (name, email, password, phone, department_id, profile_pic, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
      insertFaculty.run(
        "Dr. Rajesh Sharma", "rajesh.cse@college.edu", "admin", "+919876543210", 1,
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      );
      insertFaculty.run(
        "Dr. Priya Nair", "priya.ece@college.edu", "admin", "+919876543211", 2,
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
      );

      // Seed Subjects
      const insertSubject = sqliteDb.prepare("INSERT INTO subjects (code, name, department_id, year, semester) VALUES (?, ?, ?, ?, ?)");
      const subs = [
        ["CS-401", "Cryptography & Network Security", 1, 4, 8],
        ["CS-402", "Cloud Computing Architecture", 1, 4, 8],
        ["CS-403", "Neural Networks & Deep Learning", 1, 4, 8],
        ["CS-404", "Software Project Management", 1, 4, 8],
        ["EC-401", "Wireless Communications", 2, 4, 8],
        ["EC-402", "Embedded Systems & IoT", 2, 4, 8]
      ];
      subs.forEach(s => insertSubject.run(s[0], s[1], s[2], s[3], s[4]));

      // Seed Students
      const insertStudent = sqliteDb.prepare(`
        INSERT INTO students (
          roll_number, full_name, gender, dob, department_id, year, semester, section, email, phone, address, parent_name, parent_phone, photo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const studs = [
        ["2023CSE01", "Aarav Sharma", "Male", "2004-05-15", 1, 4, 8, "A", "aarav.sharma@gmail.com", "+919111111111", "12, MG Road, Bangalore", "Sanjay Sharma", "+919222222222", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE02", "Ananya Iyer", "Female", "2004-09-22", 1, 4, 8, "A", "ananya.iyer@gmail.com", "+919111111112", "45, Jayanagar, Bangalore", "Kalyan Iyer", "+919222222223", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE03", "Kabir Verma", "Male", "2004-02-10", 1, 4, 8, "A", "kabir.verma@gmail.com", "+919111111113", "78, Indiranagar, Bangalore", "Ramesh Verma", "+919222222224", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE04", "Diya Patel", "Female", "2004-12-05", 1, 4, 8, "A", "diya.patel@gmail.com", "+919111111114", "11, Koramangala, Bangalore", "Bharat Patel", "+919222222225", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE05", "Rohan Das", "Male", "2004-07-19", 1, 4, 8, "A", "rohan.das@gmail.com", "+919111111115", "302, Whitefield, Bangalore", "Amit Das", "+919222222226", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE06", "Sneha Reddy", "Female", "2004-03-30", 1, 4, 8, "A", "sneha.reddy@gmail.com", "+919111111116", "88, HSR Layout, Bangalore", "Prabhakar Reddy", "+919222222227", "https://images.unsplash.com/photo-1534751516642-a131ffd473fd?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE07", "Vihaan Rao", "Male", "2004-10-12", 1, 4, 8, "A", "vihaan.rao@gmail.com", "+919111111117", "55, Electronic City, Bangalore", "Srinivas Rao", "+919222222228", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE08", "Meera Joshi", "Female", "2004-06-25", 1, 4, 8, "A", "meera.joshi@gmail.com", "+919111111118", "19, Bannerghatta Road, Bangalore", "Dinesh Joshi", "+919222222229", "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE09", "Aditya Sen", "Male", "2004-01-14", 1, 4, 8, "A", "aditya.sen@gmail.com", "+919111111119", "104, Outer Ring Road, Bangalore", "Nitin Sen", "+919222222230", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"],
        ["2023CSE10", "Ishaan Gupta", "Male", "2004-08-08", 1, 4, 8, "A", "ishaan.gupta@gmail.com", "+919111111120", "42, Marathahalli, Bangalore", "Anil Gupta", "+919222222231", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"]
      ];
      studs.forEach(s => insertStudent.run(...s));

      // Seed Attendance Session Headers
      const insertAttendance = sqliteDb.prepare("INSERT INTO attendance (date, department_id, semester, section, subject_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      insertAttendance.run(new Date().toISOString().split("T")[0], 1, 8, "A", 1, 1, new Date().toISOString());
      insertAttendance.run(new Date(Date.now() - 86400000).toISOString().split("T")[0], 1, 8, "A", 2, 1, new Date(Date.now() - 86400000).toISOString());
      insertAttendance.run(new Date(Date.now() - 172800000).toISOString().split("T")[0], 1, 8, "A", 3, 1, new Date(Date.now() - 172800000).toISOString());

      // Seed Attendance Details
      const insertDetail = sqliteDb.prepare("INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES (?, ?, ?, ?)");
      // Session 1
      const s1Details = [
        [1, 1, "Present", "On time"], [1, 2, "Present", "On time"], [1, 3, "Absent", "Unexcused"], [1, 4, "Present", "On time"],
        [1, 5, "Late", "Bus delay"], [1, 6, "Present", "On time"], [1, 7, "Present", "On time"], [1, 8, "Absent", "Fever"],
        [1, 9, "Present", "On time"], [1, 10, "Present", "On time"]
      ];
      s1Details.forEach(sd => insertDetail.run(...sd));

      // Session 2
      const s2Details = [
        [2, 1, "Present", ""], [2, 2, "Present", ""], [2, 3, "Present", ""], [2, 4, "Present", ""], [2, 5, "Present", ""],
        [2, 6, "Present", ""], [2, 7, "Present", ""], [2, 8, "Absent", "Fever"], [2, 9, "Present", ""], [2, 10, "Late", "Rain delay"]
      ];
      s2Details.forEach(sd => insertDetail.run(...sd));

      // Session 3
      const s3Details = [
        [3, 1, "Present", ""], [3, 2, "Present", ""], [3, 3, "Absent", "Family travel"], [3, 4, "Present", ""],
        [3, 5, "Present", ""], [3, 6, "Present", ""], [3, 7, "Present", ""], [3, 8, "Present", ""], [3, 9, "Absent", "Unexcused"],
        [3, 10, "Present", ""]
      ];
      s3Details.forEach(sd => insertDetail.run(...sd));
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // Initialize and Seed Database
  await initDatabase();

  // ==========================================
  // API ROUTES
  // ==========================================

  // Authentication Endpoints
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await dbHelper.get("SELECT * FROM faculty WHERE LOWER(email) = LOWER(?)", email);
      if (user && verifyPassword(password, user.password)) {
        // Upgrade legacy plain-text password to hashed
        if (user.password === password) {
          const hashed = hashPassword(password);
          await dbHelper.run("UPDATE faculty SET password = ? WHERE id = ?", hashed, user.id);
          user.password = hashed;
        }

        // Ensure compatibility properties are populated
        if (!user.full_name) user.full_name = user.name || "Faculty Member";
        if (!user.username) {
          user.username = user.email ? user.email.split("@")[0] : "faculty";
        }
        if (!user.photo && user.profile_pic) user.photo = user.profile_pic;
        if (!user.profile_pic && user.photo) user.profile_pic = user.photo;

        const token = generateToken(user.id, user.email);
        const { password: _, ...safeUser } = user;

        res.json({ success: true, user: { ...safeUser, token } });
      } else {
        res.status(401).json({ success: false, message: "Invalid email or password" });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/auth/google-login", async (req, res) => {
    const { email, name, photo } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required for Google login" });
    }
    try {
      let user = await dbHelper.get("SELECT * FROM faculty WHERE LOWER(email) = LOWER(?)", email);
      const defaultPic = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
      
      if (!user) {
        // Auto-register faculty on-the-fly
        const resolvedName = name || "Faculty Member";
        const randomPassword = Math.random().toString(36).substring(2, 12);
        const hashedPassword = hashPassword(randomPassword);
        const userPic = photo || defaultPic;

        const info = await dbHelper.run(`
          INSERT INTO faculty (name, email, password, phone, department_id, profile_pic, photo)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, resolvedName, email, hashedPassword, "", 1, userPic, userPic);

        user = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", info.lastInsertRowid);
      }

      // Ensure compatibility properties are populated
      if (!user.full_name) user.full_name = user.name || "Faculty Member";
      if (!user.username) {
        user.username = user.email ? user.email.split("@")[0] : "faculty";
      }
      if (!user.photo && user.profile_pic) user.photo = user.profile_pic;
      if (!user.profile_pic && user.photo) user.profile_pic = user.photo;

      // Update photo if Google photo is provided and currently using default or empty
      if (photo && (user.photo === defaultPic || !user.photo)) {
        await dbHelper.run("UPDATE faculty SET photo = ?, profile_pic = ? WHERE id = ?", photo, photo, user.id);
        user.photo = photo;
        user.profile_pic = photo;
      }

      const token = generateToken(user.id, user.email);
      const { password: _, ...safeUser } = user;

      res.json({ success: true, user: { ...safeUser, token } });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, full_name, username, email, password, phone, department_id } = req.body;
    try {
      const exists = await dbHelper.get("SELECT id FROM faculty WHERE LOWER(email) = LOWER(?)", email);
      if (exists) {
        return res.status(400).json({ success: false, message: "Email is already registered" });
      }

      const resolvedName = full_name || name || "Faculty Member";
      const resolvedUsername = username || (email ? email.split("@")[0] : "faculty");
      const phoneVal = phone || "";
      const deptIdVal = Number(department_id) || 1;
      const defaultPic = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      // Hash password on registration
      const hashedPassword = hashPassword(password);

      const info = await dbHelper.run(`
        INSERT INTO faculty (name, email, password, phone, department_id, profile_pic, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, resolvedName, email, hashedPassword, phoneVal, deptIdVal, defaultPic, defaultPic);

      const newUser = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", info.lastInsertRowid);
      newUser.full_name = newUser.name;
      newUser.username = resolvedUsername;

      const token = generateToken(newUser.id, newUser.email);
      const { password: _, ...safeUser } = newUser;

      res.json({ success: true, user: { ...safeUser, token } });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Forgot Password Initiator
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
      // Find faculty user case-insensitively
      const user = await dbHelper.get("SELECT * FROM faculty WHERE LOWER(email) = LOWER(?)", email);
      if (!user) {
        return res.status(400).json({ success: false, message: "No registered faculty member found with this email" });
      }

      // Generate a secure 6-digit random code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      // Store or replace verification code in password_resets table
      const existing = await dbHelper.get("SELECT email FROM password_resets WHERE LOWER(email) = LOWER(?)", email);
      if (existing) {
        await dbHelper.run("UPDATE password_resets SET token = ?, expires = ? WHERE LOWER(email) = LOWER(?)", resetCode, expiresAt, email);
      } else {
        await dbHelper.run("INSERT INTO password_resets (email, token, expires) VALUES (?, ?, ?)", email.toLowerCase(), resetCode, expiresAt);
      }

      console.log(`[PASSWORD RESET SYSTEM] Generated reset code for ${email}: ${resetCode}`);

      // Attempt to send email via SMTP if configured
      let emailSent = false;
      let emailError = null;

      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        try {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === "465",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });

          const fromAddress = process.env.SMTP_FROM || `"Attendance Console Help" <${process.env.SMTP_USER}>`;
          
          await transporter.sendMail({
            from: fromAddress,
            to: email,
            subject: "University Attendance Console - Password Recovery Code",
            html: `
              <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; background-color: #ffffff;">
                <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; text-align: center;">
                  <h2 style="margin: 0; color: #1e3a8a; font-size: 20px;">Password Reset Request</h2>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Official Campus Support</p>
                </div>
                <p>Hello,</p>
                <p>We received a password recovery request for your Faculty account on the University Attendance Portal.</p>
                <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                  <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Your One-Time Recovery Code</span>
                  <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${resetCode}</span>
                </div>
                <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This code is strictly confidential and will expire in <strong>15 minutes</strong>. If you did not request this recovery, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">University Attendance Console • Secure Identity Dispatcher</p>
              </div>
            `,
          });
          emailSent = true;
        } catch (err: any) {
          console.error("Nodemailer SMTP dispatch failed:", err);
          emailError = err.message;
        }
      }

      return res.json({
        success: true,
        message: "A password recovery notification has been dispatched.",
        emailSent,
        sandboxHelp: !emailSent ? {
          code: resetCode,
          info: "SMTP is not configured in .env. We printed the code to the terminal, and here is a simulation preview.",
        } : null
      });

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // Forgot Password Reset/Verify
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, reset code, and new password are required" });
    }

    try {
      const resetEntry = await dbHelper.get("SELECT * FROM password_resets WHERE LOWER(email) = LOWER(?)", email);
      if (!resetEntry) {
        return res.status(400).json({ success: false, message: "No active recovery request found for this email" });
      }

      // Verify expiration
      if (Date.now() > Number(resetEntry.expires)) {
        await dbHelper.run("DELETE FROM password_resets WHERE LOWER(email) = LOWER(?)", email);
        return res.status(400).json({ success: false, message: "Recovery code has expired. Please request a new one." });
      }

      // Verify code
      if (resetEntry.token.trim() !== code.trim()) {
        return res.status(400).json({ success: false, message: "Incorrect password recovery code" });
      }

      // Code matches! Hash new password and update faculty user
      const hashedPass = hashPassword(newPassword);
      await dbHelper.run("UPDATE faculty SET password = ? WHERE LOWER(email) = LOWER(?)", hashedPass, email);

      // Clean up reset entry
      await dbHelper.run("DELETE FROM password_resets WHERE LOWER(email) = LOWER(?)", email);

      return res.json({ success: true, message: "Password updated successfully. You can now sign in." });

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // ==========================================
  // SECURE MIDDLEWARE BINDINGS
  // ==========================================
  // Apply token verification to all subsequent protected endpoints
  app.use("/api/departments", (req: any, res: any, next: any) => {
    if (req.method === "GET") {
      return next();
    }
    authenticateToken(req, res, next);
  });
  app.use("/api/subjects", authenticateToken);
  app.use("/api/students", authenticateToken);
  app.use("/api/attendance", authenticateToken);
  app.use("/api/analytics", authenticateToken);
  app.use("/api/faculty", authenticateToken);
  app.use("/api/auth/profile", authenticateToken);
  app.use("/api/reports", authenticateToken);

  app.put("/api/auth/profile/:id", async (req: any, res: any) => {
    const id = Number(req.params.id);
    if (req.user.userId !== id) {
      return res.status(403).json({ success: false, message: "Unauthorized. You can only update your own profile." });
    }
    const { name, email, phone, department_id, profile_pic, password } = req.body;
    try {
      const user = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", id);
      if (!user) return res.status(404).json({ success: false, message: "Faculty profile not found" });

      const newName = name || user.name;
      const newEmail = email || user.email;
      const newPhone = phone !== undefined ? phone : user.phone;
      const newDeptId = department_id ? Number(department_id) : user.department_id;
      const newPic = profile_pic || user.profile_pic;
      const newPassword = password ? hashPassword(password) : user.password;

      await dbHelper.run(`
        UPDATE faculty
        SET name = ?, email = ?, phone = ?, department_id = ?, profile_pic = ?, photo = ?, password = ?
        WHERE id = ?
      `, newName, newEmail, newPhone, newDeptId, newPic, newPic, newPassword, id);

      const updatedUser = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", id);
      updatedUser.full_name = updatedUser.name;
      updatedUser.username = updatedUser.email ? updatedUser.email.split("@")[0] : "faculty";

      const { password: _, ...safeUser } = updatedUser;
      res.json({ success: true, user: safeUser });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Faculty Profile Updates
  app.post("/api/faculty/update", async (req: any, res: any) => {
    const { id, full_name, username, email, phone, department_id, photo } = req.body;
    try {
      let user: any = null;
      if (id) {
        user = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", Number(id));
      } else if (email) {
        user = await dbHelper.get("SELECT * FROM faculty WHERE email = ?", email);
      }

      if (!user) {
        return res.status(404).json({ success: false, message: "Faculty member not found" });
      }

      if (user.id !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Unauthorized. You can only update your own profile." });
      }

      const userId = user.id;
      const newName = full_name || user.name;
      const newEmail = email || user.email;
      const newPhone = phone !== undefined ? phone : user.phone;
      const newDeptId = department_id ? Number(department_id) : user.department_id;
      const newPic = photo || user.profile_pic;

      await dbHelper.run(`
        UPDATE faculty
        SET name = ?, email = ?, phone = ?, department_id = ?, profile_pic = ?, photo = ?
        WHERE id = ?
      `, newName, newEmail, newPhone, newDeptId, newPic, newPic, userId);

      const updatedUser = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", userId);
      updatedUser.full_name = updatedUser.name;
      updatedUser.username = username !== undefined ? username : (updatedUser.email ? updatedUser.email.split("@")[0] : "faculty");

      const { password: _, ...safeUser } = updatedUser;
      res.json({ success: true, user: safeUser });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Faculty Password Adjustment
  app.post("/api/faculty/change-password", async (req: any, res: any) => {
    const { id, current_password, new_password } = req.body;
    try {
      if (!id) {
        return res.status(400).json({ success: false, message: "Faculty user ID required" });
      }

      if (Number(id) !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Unauthorized. You can only change your own password." });
      }

      const user = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", Number(id));
      if (!user) {
        return res.status(404).json({ success: false, message: "Faculty member not found" });
      }

      if (!verifyPassword(current_password, user.password)) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }

      const hashedNewPassword = hashPassword(new_password);
      await dbHelper.run("UPDATE faculty SET password = ? WHERE id = ?", hashedNewPassword, id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Department CRUD
  app.get("/api/departments", async (req, res) => {
    const { search } = req.query;
    try {
      let result;
      if (search) {
        const q = `%${String(search).toLowerCase()}%`;
        result = await dbHelper.all("SELECT * FROM departments WHERE LOWER(name) LIKE ? OR LOWER(code) LIKE ?", q, q);
      } else {
        result = await dbHelper.all("SELECT * FROM departments");
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/departments", async (req, res) => {
    const { code, name, description } = req.body;
    try {
      const codeUpper = code.toUpperCase();
      const exists = await dbHelper.get("SELECT id FROM departments WHERE UPPER(code) = ?", codeUpper);
      if (exists) {
        return res.status(400).json({ success: false, message: "Department code already exists" });
      }

      const info = await dbHelper.run("INSERT INTO departments (code, name, description) VALUES (?, ?, ?)", codeUpper, name, description || "");
      const newDept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", info.lastInsertRowid);
      res.json({ success: true, department: newDept });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { code, name, description } = req.body;
    try {
      const dept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", id);
      if (!dept) return res.status(404).json({ success: false, message: "Department not found" });

      let codeUpper = dept.code;
      if (code) {
        codeUpper = code.toUpperCase();
        const exists = await dbHelper.get("SELECT id FROM departments WHERE UPPER(code) = ? AND id != ?", codeUpper, id);
        if (exists) {
          return res.status(400).json({ success: false, message: "Department code already in use" });
        }
      }

      const finalName = name || dept.name;
      const finalDesc = description !== undefined ? description : dept.description;

      await dbHelper.run("UPDATE departments SET code = ?, name = ?, description = ? WHERE id = ?", codeUpper, finalName, finalDesc, id);
      const updatedDept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", id);
      res.json({ success: true, department: updatedDept });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      await dbHelper.run("DELETE FROM departments WHERE id = ?", id);
      await dbHelper.run("DELETE FROM subjects WHERE department_id = ?", id);
      await dbHelper.run(`
        DELETE FROM attendance_details WHERE student_id IN (
          SELECT id FROM students WHERE department_id = ?
        )
      `, id);
      await dbHelper.run("DELETE FROM students WHERE department_id = ?", id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Subject CRUD
  app.get("/api/subjects", async (req, res) => {
    const { search } = req.query;
    try {
      let result;
      if (search) {
        const q = `%${String(search).toLowerCase()}%`;
        result = await dbHelper.all("SELECT * FROM subjects WHERE LOWER(name) LIKE ? OR LOWER(code) LIKE ?", q, q);
      } else {
        result = await dbHelper.all("SELECT * FROM subjects");
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    const { code, name, department_id, year, semester } = req.body;
    try {
      const codeUpper = code.toUpperCase();
      const exists = await dbHelper.get("SELECT id FROM subjects WHERE UPPER(code) = ?", codeUpper);
      if (exists) {
        return res.status(400).json({ success: false, message: "Subject code already exists" });
      }

      const info = await dbHelper.run(`
        INSERT INTO subjects (code, name, department_id, year, semester)
        VALUES (?, ?, ?, ?, ?)
      `, codeUpper, name, Number(department_id), Number(year), Number(semester));

      const newSub = await dbHelper.get("SELECT * FROM subjects WHERE id = ?", info.lastInsertRowid);
      res.json({ success: true, subject: newSub });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { code, name, department_id, year, semester } = req.body;
    try {
      const sub = await dbHelper.get("SELECT * FROM subjects WHERE id = ?", id);
      if (!sub) return res.status(404).json({ success: false, message: "Subject not found" });

      let codeUpper = sub.code;
      if (code) {
        codeUpper = code.toUpperCase();
        const exists = await dbHelper.get("SELECT id FROM subjects WHERE UPPER(code) = ? AND id != ?", codeUpper, id);
        if (exists) {
          return res.status(400).json({ success: false, message: "Subject code already in use" });
        }
      }

      const finalName = name || sub.name;
      const finalDeptId = department_id !== undefined ? Number(department_id) : sub.department_id;
      const finalYear = year !== undefined ? Number(year) : sub.year;
      const finalSem = semester !== undefined ? Number(semester) : sub.semester;

      await dbHelper.run(`
        UPDATE subjects
        SET code = ?, name = ?, department_id = ?, year = ?, semester = ?
        WHERE id = ?
      `, codeUpper, finalName, finalDeptId, finalYear, finalSem, id);

      const updatedSub = await dbHelper.get("SELECT * FROM subjects WHERE id = ?", id);
      res.json({ success: true, subject: updatedSub });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      await dbHelper.run("DELETE FROM subjects WHERE id = ?", id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Student CRUD
  app.get("/api/students", async (req, res) => {
    const { search, department_id, year, semester, section } = req.query;
    try {
      let query = "SELECT * FROM students WHERE 1=1";
      const params: any[] = [];

      if (search) {
        query += " AND (LOWER(full_name) LIKE ? OR LOWER(roll_number) LIKE ? OR LOWER(email) LIKE ?)";
        const q = `%${String(search).toLowerCase()}%`;
        params.push(q, q, q);
      }
      if (department_id) {
        query += " AND department_id = ?";
        params.push(Number(department_id));
      }
      if (year) {
        query += " AND year = ?";
        params.push(Number(year));
      }
      if (semester) {
        query += " AND semester = ?";
        params.push(Number(semester));
      }
      if (section) {
        query += " AND UPPER(section) = ?";
        params.push(String(section).toUpperCase());
      }

      const result = await dbHelper.all(query, ...params);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      const student = await dbHelper.get("SELECT * FROM students WHERE id = ?", id);
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      // Calculate individual attendance rates
      const details = await dbHelper.all("SELECT * FROM attendance_details WHERE student_id = ?", id);
      const totalClasses = details.length;
      const attended = details.filter((d: any) => d.status === "Present" || d.status === "Late").length;
      const attendance_ratio = totalClasses > 0 ? Math.round((attended / totalClasses) * 1000) / 10 : 100.0;

      const history = await Promise.all(details.map(async (d: any) => {
        const header = await dbHelper.get("SELECT * FROM attendance WHERE id = ?", d.attendance_id);
        const sub = header ? await dbHelper.get("SELECT * FROM subjects WHERE id = ?", header.subject_id) : null;
        return {
          id: d.id,
          date: header ? header.date : "N/A",
          subject_code: sub ? sub.code : "N/A",
          subject_name: sub ? sub.name : "N/A",
          status: d.status,
          remarks: d.remarks || ""
        };
      }));

      res.json({
        student,
        attendance_ratio,
        total_classes: totalClasses,
        attended_classes: attended,
        history
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const s = req.body;
    try {
      const rollUpper = s.roll_number.toUpperCase();
      const emailLower = s.email.toLowerCase();

      const existsRoll = await dbHelper.get("SELECT id FROM students WHERE UPPER(roll_number) = ?", rollUpper);
      if (existsRoll) {
        return res.status(400).json({ success: false, message: "Roll number already assigned" });
      }

      const existsEmail = await dbHelper.get("SELECT id FROM students WHERE LOWER(email) = ?", emailLower);
      if (existsEmail) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }

      const phoneVal = s.phone || "";
      const addressVal = s.address || "";
      const parentNameVal = s.parent_name || "";
      const parentPhoneVal = s.parent_phone || "";
      const defaultPhoto = s.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      const info = await dbHelper.run(`
        INSERT INTO students (
          roll_number, full_name, gender, dob, department_id, year, semester, section, email, phone, address, parent_name, parent_phone, photo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, rollUpper, s.full_name, s.gender, s.dob, Number(s.department_id),
        Number(s.year), Number(s.semester), s.section.toUpperCase(),
        s.email, phoneVal, addressVal, parentNameVal, parentPhoneVal, defaultPhoto);

      const newStudent = await dbHelper.get("SELECT * FROM students WHERE id = ?", info.lastInsertRowid);
      res.json({ success: true, student: newStudent });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    const id = Number(req.params.id);
    const s = req.body;
    try {
      const stud = await dbHelper.get("SELECT * FROM students WHERE id = ?", id);
      if (!stud) return res.status(404).json({ success: false, message: "Student not found" });

      let rollUpper = stud.roll_number;
      if (s.roll_number) {
        rollUpper = s.roll_number.toUpperCase();
        const existsRoll = await dbHelper.get("SELECT id FROM students WHERE UPPER(roll_number) = ? AND id != ?", rollUpper, id);
        if (existsRoll) {
          return res.status(400).json({ success: false, message: "Roll number already in use" });
        }
      }

      let emailLower = stud.email;
      if (s.email) {
        emailLower = s.email.toLowerCase();
        const existsEmail = await dbHelper.get("SELECT id FROM students WHERE LOWER(email) = ? AND id != ?", emailLower, id);
        if (existsEmail) {
          return res.status(400).json({ success: false, message: "Email already in use" });
        }
      }

      const finalName = s.full_name || stud.full_name;
      const finalGender = s.gender || stud.gender;
      const finalDob = s.dob || stud.dob;
      const finalDeptId = s.department_id !== undefined ? Number(s.department_id) : stud.department_id;
      const finalYear = s.year !== undefined ? Number(s.year) : stud.year;
      const finalSem = s.semester !== undefined ? Number(s.semester) : stud.semester;
      const finalSec = s.section ? s.section.toUpperCase() : stud.section;
      const finalPhone = s.phone !== undefined ? s.phone : stud.phone;
      const finalAddr = s.address !== undefined ? s.address : stud.address;
      const finalPName = s.parent_name !== undefined ? s.parent_name : stud.parent_name;
      const finalPPhone = s.parent_phone !== undefined ? s.parent_phone : stud.parent_phone;
      const finalPhoto = s.photo || stud.photo;

      await dbHelper.run(`
        UPDATE students
        SET roll_number = ?, full_name = ?, gender = ?, dob = ?, department_id = ?, year = ?, semester = ?, section = ?, email = ?, phone = ?, address = ?, parent_name = ?, parent_phone = ?, photo = ?
        WHERE id = ?
      `, rollUpper, finalName, finalGender, finalDob, finalDeptId, finalYear, finalSem, finalSec, emailLower, finalPhone, finalAddr, finalPName, finalPPhone, finalPhoto, id);

      const updatedStudent = await dbHelper.get("SELECT * FROM students WHERE id = ?", id);
      res.json({ success: true, student: updatedStudent });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      await dbHelper.run("DELETE FROM students WHERE id = ?", id);
      await dbHelper.run("DELETE FROM attendance_details WHERE student_id = ?", id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Attendance Endpoints
  app.get("/api/attendance/session", async (req, res) => {
    const { date, department_id, semester, section, subject_id } = req.query;
    try {
      const header = await dbHelper.get(`
        SELECT * FROM attendance
        WHERE date = ? AND department_id = ? AND semester = ? AND UPPER(section) = ? AND subject_id = ?
      `, date, Number(department_id), Number(semester), String(section).toUpperCase(), Number(subject_id));

      if (header) {
        const details = await dbHelper.all("SELECT * FROM attendance_details WHERE attendance_id = ?", header.id);
        return res.json({ success: true, exists: true, header, details });
      } else {
        return res.json({ success: true, exists: false });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/attendance/save", async (req, res) => {
    const { date, department_id, semester, section, subject_id, created_by, records } = req.body;
    try {
      const sectionUpper = section.toUpperCase();
      const deptIdNum = Number(department_id);
      const semNum = Number(semester);
      const subIdNum = Number(subject_id);
      const createdByNum = Number(created_by) || 1;

      // Check if header exists
      let header = await dbHelper.get(`
        SELECT * FROM attendance
        WHERE date = ? AND department_id = ? AND semester = ? AND UPPER(section) = ? AND subject_id = ?
      `, date, deptIdNum, semNum, sectionUpper, subIdNum);

      let headerId: number;
      if (!header) {
        const info = await dbHelper.run(`
          INSERT INTO attendance (date, department_id, semester, section, subject_id, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, date, deptIdNum, semNum, sectionUpper, subIdNum, createdByNum, new Date().toISOString());
        headerId = info.lastInsertRowid;
        header = { id: headerId, date, department_id: deptIdNum, semester: semNum, section: sectionUpper, subject_id: subIdNum, created_by: createdByNum };
      } else {
        headerId = header.id;
      }

      // Save/update attendance details
      for (const rec of records) {
        const studentIdNum = Number(rec.student_id);
        const existing = await dbHelper.get("SELECT id FROM attendance_details WHERE attendance_id = ? AND student_id = ?", headerId, studentIdNum);
        if (existing) {
          await dbHelper.run("UPDATE attendance_details SET status = ?, remarks = ? WHERE id = ?", rec.status, rec.remarks || "", existing.id);
        } else {
          await dbHelper.run("INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES (?, ?, ?, ?)", headerId, studentIdNum, rec.status, rec.remarks || "");
        }
      }

      res.json({ success: true, header });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/attendance/history", async (req, res) => {
    try {
      const headers = await dbHelper.all("SELECT * FROM attendance");
      const result = await Promise.all(headers.map(async (h: any) => {
        const sub = await dbHelper.get("SELECT * FROM subjects WHERE id = ?", h.subject_id);
        const dept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", h.department_id);
        const creator = await dbHelper.get("SELECT * FROM faculty WHERE id = ?", h.created_by);

        const details = await dbHelper.all("SELECT * FROM attendance_details WHERE attendance_id = ?", h.id);
        const present = details.filter((d: any) => d.status === "Present").length;
        const absent = details.filter((d: any) => d.status === "Absent").length;
        const late = details.filter((d: any) => d.status === "Late").length;
        const total = details.length;

        return {
          id: h.id,
          date: h.date,
          department: dept ? dept.code : "N/A",
          semester: h.semester,
          section: h.section,
          subject: sub ? `${sub.code}: ${sub.name}` : "N/A",
          marked_by: creator ? creator.name : "System",
          summary: `Present: ${present}, Late: ${late}, Absent: ${absent} / Total: ${total}`
        };
      }));
      result.sort((a: any, b: any) => b.date.localeCompare(a.date));

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Analytics API
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const totalStudentsRes = await dbHelper.get("SELECT COUNT(*) as count FROM students");
      const totalStudents = Number(totalStudentsRes?.count || 0);

      const totalDepartmentsRes = await dbHelper.get("SELECT COUNT(*) as count FROM departments");
      const totalDepartments = Number(totalDepartmentsRes?.count || 0);

      const totalSubjectsRes = await dbHelper.get("SELECT COUNT(*) as count FROM subjects");
      const totalSubjects = Number(totalSubjectsRes?.count || 0);

      // Today's attendance
      const todayStr = new Date().toISOString().split("T")[0];
      const todayHeaders = await dbHelper.all("SELECT id FROM attendance WHERE date = ?", todayStr);
      const todayHeaderIds = todayHeaders.map((h: any) => h.id);

      let todayPresent = 0;
      let todayAbsent = 0;
      let todayLate = 0;

      if (todayHeaderIds.length > 0) {
        const placeholders = todayHeaderIds.map(() => "?").join(",");
        const todayDetails = await dbHelper.all(`SELECT status FROM attendance_details WHERE attendance_id IN (${placeholders})`, ...todayHeaderIds);
        todayPresent = todayDetails.filter((d: any) => d.status === "Present").length;
        todayAbsent = todayDetails.filter((d: any) => d.status === "Absent").length;
        todayLate = todayDetails.filter((d: any) => d.status === "Late").length;
      } else {
        const allD = await dbHelper.all("SELECT status FROM attendance_details");
        todayPresent = allD.filter((d: any) => d.status === "Present").length;
        todayAbsent = allD.filter((d: any) => d.status === "Absent").length;
        todayLate = allD.filter((d: any) => d.status === "Late").length;
      }

      const totalToday = todayPresent + todayAbsent + todayLate;
      const todayPercentage = totalToday > 0 ? Math.round(((todayPresent + todayLate) / totalToday) * 1000) / 10 : 85.5;

      // Overall history percentage
      const allDetails = await dbHelper.all("SELECT status FROM attendance_details");
      const presentCount = allDetails.filter((d: any) => d.status === "Present" || d.status === "Late").length;
      const overallPercentage = allDetails.length > 0 ? Math.round((presentCount / allDetails.length) * 1000) / 10 : 88.0;

      // Recent activities list
      const attendanceList = await dbHelper.all("SELECT * FROM attendance ORDER BY created_at DESC LIMIT 5");
      const recentActivities = await Promise.all(attendanceList.map(async (h: any) => {
        const sub = await dbHelper.get("SELECT * FROM subjects WHERE id = ?", h.subject_id);
        const dept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", h.department_id);
        return {
          time: new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + new Date(h.created_at).toLocaleDateString([], { day: "numeric", month: "short" }),
          text: `Attendance registered for ${sub ? sub.code : "Subject"} (${dept ? dept.code : "Dept"}) Semester ${h.semester} Section ${h.section}.`
        };
      }));

      // Chart analytics preparation
      // 1. Department averages
      const depts = await dbHelper.all("SELECT * FROM departments");
      const deptStats = await Promise.all(depts.map(async (dept: any) => {
        const studentIds = (await dbHelper.all("SELECT id FROM students WHERE department_id = ?", dept.id)).map((s: any) => s.id);
        let percentage = 85;
        if (studentIds.length > 0) {
          const placeholders = studentIds.map(() => "?").join(",");
          const details = await dbHelper.all(`SELECT status FROM attendance_details WHERE student_id IN (${placeholders})`, ...studentIds);
          const attended = details.filter((d: any) => d.status === "Present" || d.status === "Late").length;
          percentage = details.length > 0 ? Math.round((attended / details.length) * 100) : 85;
        }
        return { code: dept.code, name: dept.name, percentage };
      }));

      // 2. Subject averages
      const subs = await dbHelper.all("SELECT * FROM subjects");
      const subStats = await Promise.all(subs.map(async (sub: any) => {
        const headerIds = (await dbHelper.all("SELECT id FROM attendance WHERE subject_id = ?", sub.id)).map((h: any) => h.id);
        let percentage = 90;
        if (headerIds.length > 0) {
          const placeholders = headerIds.map(() => "?").join(",");
          const details = await dbHelper.all(`SELECT status FROM attendance_details WHERE attendance_id IN (${placeholders})`, ...headerIds);
          const attended = details.filter((d: any) => d.status === "Present" || d.status === "Late").length;
          percentage = details.length > 0 ? Math.round((attended / details.length) * 100) : 90;
        }
        return { code: sub.code, name: sub.name, percentage };
      }));

      // 3. Last 7 days trend
      const trendRows = await dbHelper.all(`
        SELECT date, 
               SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) as attended,
               COUNT(*) as total
        FROM attendance_details ad
        JOIN attendance a ON ad.attendance_id = a.id
        GROUP BY date
        ORDER BY date ASC
        LIMIT 7
      `);

      const trendStats = trendRows.map((r: any) => ({
        date: r.date,
        percentage: Number(r.total) > 0 ? Math.round((Number(r.attended) / Number(r.total)) * 100) : 85
      }));

      // If no trend data, put a fallback trend
      if (trendStats.length === 0) {
        trendStats.push({ date: todayStr, percentage: todayPercentage });
      }

      res.json({
        totalStudents,
        totalDepartments,
        totalSubjects,
        today_present: todayPresent,
        today_absent: todayAbsent,
        today_late: todayLate,
        today_percentage: todayPercentage,
        overall_percentage: overallPercentage,
        recentActivities,
        deptStats,
        subStats,
        trendStats
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/reports/sheet", async (req, res) => {
    const { department_id, semester, subject_id, start_date } = req.query;
    try {
      if (!department_id || !semester || !subject_id) {
        return res.status(400).json({ success: false, message: "Missing filters" });
      }

      const deptIdNum = Number(department_id);
      const semNum = Number(semester);
      const subIdNum = Number(subject_id);

      const students = await dbHelper.all("SELECT * FROM students WHERE department_id = ? AND semester = ?", deptIdNum, semNum);

      let headersQuery = "SELECT id FROM attendance WHERE department_id = ? AND semester = ? AND subject_id = ?";
      const headersParams: any[] = [deptIdNum, semNum, subIdNum];

      if (start_date) {
        headersQuery += " AND date >= ?";
        headersParams.push(String(start_date));
      }

      const headers = await dbHelper.all(headersQuery, ...headersParams);
      const headerIds = headers.map((h: any) => h.id);
      const totalLectures = headerIds.length;

      const report_data = await Promise.all(students.map(async (student: any) => {
        let attended = 0;
        let absent = 0;
        let late = 0;

        if (totalLectures > 0) {
          const placeholders = headerIds.map(() => "?").join(",");
          const sDetails = await dbHelper.all(`
            SELECT status FROM attendance_details
            WHERE student_id = ? AND attendance_id IN (${placeholders})
          `, student.id, ...headerIds);

          attended = sDetails.filter((d: any) => d.status === "Present").length;
          absent = sDetails.filter((d: any) => d.status === "Absent").length;
          late = sDetails.filter((d: any) => d.status === "Late").length;
        }

        const totalAttended = attended + late;
        const percentage = totalLectures > 0 ? Math.round((totalAttended / totalLectures) * 1000) / 10 : 100.0;

        return {
          roll_number: student.roll_number,
          name: student.full_name,
          total_lectures: totalLectures,
          attended,
          late,
          absent,
          percentage,
          eligibility: percentage >= 75 ? "Eligible" : "Shortage (Blocked)"
        };
      }));

      res.json(report_data);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/source-code", async (req, res) => {
    try {
      const folderPath = path.join(process.cwd(), "flask_project");
      const filesToRead = ["app.py", "models.py", "forms.py", "config.py", "database.sql", "requirements.txt", "README.md"];
      const fileList = [];

      for (const file of filesToRead) {
        const filePath = path.join(folderPath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf-8");
          fileList.push({ name: file, content });
        }
      }

      res.json(fileList);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/firebase-config", async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let config: any = {};
      
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        } catch (err) {
          console.warn("Failed to parse firebase-applet-config.json", err);
        }
      }

      // Inject or override with environment variables to keep keys secure
      if (process.env.FIREBASE_API_KEY) {
        config.apiKey = process.env.FIREBASE_API_KEY;
      }
      if (process.env.FIREBASE_PROJECT_ID) {
        config.projectId = process.env.FIREBASE_PROJECT_ID;
      }
      if (process.env.FIREBASE_APP_ID) {
        config.appId = process.env.FIREBASE_APP_ID;
      }
      if (process.env.FIREBASE_AUTH_DOMAIN) {
        config.authDomain = process.env.FIREBASE_AUTH_DOMAIN;
      }
      if (process.env.FIREBASE_STORAGE_BUCKET) {
        config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      }
      if (process.env.FIREBASE_MESSAGING_SENDER_ID) {
        config.messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
      }

      if (Object.keys(config).length === 0) {
        return res.status(404).json({ success: false, message: "Configuration not found" });
      }

      res.json(config);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT OR PRODUCTION STATIC ROUTING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Attendance System backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
