import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'scrumcmd.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    joinedDate TEXT NOT NULL,
    avatarUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    startDate TEXT NOT NULL,
    deadline TEXT NOT NULL,
    priority TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    assignedToId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Todo',
    priority TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_updates (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    taskTitle TEXT NOT NULL,
    date TEXT NOT NULL,
    yesterday TEXT NOT NULL,
    today TEXT NOT NULL,
    blockers TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blockers (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    taskTitle TEXT NOT NULL,
    description TEXT NOT NULL,
    reportedDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    resolvedDate TEXT
  );

  CREATE TABLE IF NOT EXISTS task_notes (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

console.log('📦 Database ready');

export default db;
