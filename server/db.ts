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

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    projectId TEXT NOT NULL DEFAULT '',
    attendeeIds TEXT NOT NULL DEFAULT '',
    agenda TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    actionItems TEXT NOT NULL DEFAULT '',
    decisions TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    projectId TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL
  );
`);

// ─── SEED DATA (only on first run when DB is empty) ──────────
const count = (db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }).c;
if (count === 0) {
  console.log('🌱 Seeding database with initial data...');

  const insertEmp = db.prepare('INSERT INTO employees (id, name, role, email, status, joinedDate, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertProj = db.prepare('INSERT INTO projects (id, name, startDate, deadline, priority, ownerId, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertTask = db.prepare('INSERT INTO tasks (id, projectId, assignedToId, title, description, status, priority, dueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertUpdate = db.prepare('INSERT INTO daily_updates (id, employeeId, projectId, taskTitle, date, yesterday, today, blockers, progress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  const seed = db.transaction(() => {
    // Employees
    insertEmp.run('c1bdcb65-', 'Rahul A', 'VP Eng', 'testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.39899135697841437');
    insertEmp.run('303a5afd-', 'Sumit K', 'Backend', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.29022238484490437');
    insertEmp.run('900a4f12-', 'RK', 'VP Eng', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.6478583505046894');
    insertEmp.run('d19e744f-', 'Shasvat Sheth', 'Frontend ', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.8599616879791022');
    insertEmp.run('ccd80edd-', 'Vaibhav', 'Backend', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.46582069843763796');
    insertEmp.run('74df6729-', 'Riya soni', 'Backend', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.3909764024478858');
    insertEmp.run('77f2836b-', 'Rohit Soni', 'Frontend', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.46452091235553417');
    insertEmp.run('70ca20f5-', 'Rishi Akbari', 'Flutter Dev', 'Testing@123', 'Active', '2026-02-18', 'https://picsum.photos/200?random=0.44728757864409674');

    // Projects
    insertProj.run('75e02359-', 'ClaimIQ', '2026-02-18', '2026-02-20', 'Medium', 'e1', 'Active', 'AI powered fraud detection platform');
    insertProj.run('ad62e875-', 'HIMS v2', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');
    insertProj.run('b550ef6a-', 'GMC', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');
    insertProj.run('9663d98e-', 'Facility App', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');
    insertProj.run('d342295d-', 'SDK', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');
    insertProj.run('6fbfe05c-', 'Manorama', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');
    insertProj.run('fcd32337-', 'Manorama', '2026-02-18', '2026-03-18', 'Medium', 'e1', 'Active', '');

    // Tasks
    insertTask.run('35cccca8-', '75e02359-', 'c1bdcb65-', 'Annotation', 'Added via Task Manager', 'In Progress', 'Medium', '2026-02-18', '2026-02-18T07:06:13.524Z', '2026-02-18T07:22:40.178Z');
    insertTask.run('c3d081d1-', 'ad62e875-', '900a4f12-', 'HIMS v2 issues and sub domain for onboarding and hospital access', 'Added via Task Manager', 'In Progress', 'Medium', '2026-02-20', '2026-02-18T07:07:42.270Z', '2026-02-18T07:22:36.861Z');
    insertTask.run('246bd9eb-', 'ad62e875-', '303a5afd-', 'HIMS v2 issues and sub domain for onboarding and hospital access', 'Added via Task Manager', 'In Progress', 'Medium', '2026-02-20', '2026-02-18T07:07:54.923Z', '2026-02-18T07:22:33.433Z');
    insertTask.run('23f44aa4-', 'ad62e875-', 'd19e744f-', 'Master Changes Active Deactive hospital', 'Added via Task Manager', 'In Progress', 'Medium', '2026-02-20', '2026-02-18T07:08:26.911Z', '2026-02-18T07:22:30.710Z');
    insertTask.run('a1068fb5-', '9663d98e-', '70ca20f5-', 'Patient Registration App', 'Added via Task Manager', 'In Progress', 'Medium', '2026-02-20', '2026-02-18T07:09:44.093Z', '2026-02-18T07:22:26.470Z');
    insertTask.run('9f71fe49-', 'd342295d-', '74df6729-', 'M2, M3 Backend', 'Assigned via Task Assignment', 'In Progress', 'Medium', '2026-02-20', '2026-02-18T07:24:15.877Z', '2026-02-18T11:02:08.183Z');
    insertTask.run('d383ab0c-', 'fcd32337-', '900a4f12-', 'Manorama STT issue RK will check and if it is from our end will resolve it ', '', 'Todo', 'Medium', '2026-02-20', '2026-02-18T08:35:15.495Z', '2026-02-18T08:39:20.083Z');

    // Daily Updates
    insertUpdate.run('6a8baa64-', 'c1bdcb65-', '75e02359-', 'working on the annotation', '2026-02-18', 'was working on this feature only ', 'will be working on this feature where we provide option of pdf annotation and scan( ( ClaimIQ > Hospital side > Template >Pdf annotation and scan wala  ( hospital ))', null, 50, '2026-02-18T06:56:02.316Z');
  });

  seed();
  console.log('✅ Seed data loaded');
}

console.log('📦 Database ready');

export default db;
