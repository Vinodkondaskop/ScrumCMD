import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// ─── EMPLOYEES ───────────────────────────────────────────────
app.get('/api/employees', (_req, res) => {
    const rows = db.prepare('SELECT * FROM employees').all();
    res.json(rows);
});

app.post('/api/employees', (req, res) => {
    const { name, role, email, status, joinedDate, avatarUrl } = req.body;
    const id = uuidv4().slice(0, 9);
    db.prepare('INSERT INTO employees (id, name, role, email, status, joinedDate, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, name, role, email, status, joinedDate, avatarUrl || null);
    res.status(201).json({ id, name, role, email, status, joinedDate, avatarUrl });
});

app.patch('/api/employees/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE employees SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
});

app.delete('/api/employees/:id', (req, res) => {
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    // Clear task assignments for deleted employee
    db.prepare("UPDATE tasks SET assignedToId = '' WHERE assignedToId = ?").run(req.params.id);
    res.json({ success: true });
});

// ─── PROJECTS ────────────────────────────────────────────────
app.get('/api/projects', (_req, res) => {
    const rows = db.prepare('SELECT * FROM projects').all();
    res.json(rows);
});

app.post('/api/projects', (req, res) => {
    const { name, startDate, deadline, priority, ownerId, status, description } = req.body;
    const id = uuidv4().slice(0, 9);
    db.prepare('INSERT INTO projects (id, name, startDate, deadline, priority, ownerId, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, name, startDate, deadline, priority, ownerId, status, description);
    res.status(201).json({ id, name, startDate, deadline, priority, ownerId, status, description });
});

app.patch('/api/projects/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
});

app.delete('/api/projects/:id', (req, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM tasks WHERE projectId = ?').run(req.params.id);
    res.json({ success: true });
});

// ─── TASKS ───────────────────────────────────────────────────
app.get('/api/tasks', (_req, res) => {
    const rows = db.prepare('SELECT * FROM tasks').all();
    res.json(rows);
});

app.post('/api/tasks', (req, res) => {
    const { projectId, assignedToId, title, description, status, priority, dueDate } = req.body;
    const id = uuidv4().slice(0, 9);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO tasks (id, projectId, assignedToId, title, description, status, priority, dueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, projectId, assignedToId, title, description, status, priority, dueDate, now, now);
    res.status(201).json({ id, projectId, assignedToId, title, description, status, priority, dueDate, createdAt: now, updatedAt: now });
});

app.patch('/api/tasks/:id/status', (req, res) => {
    const { status } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, req.params.id);
    res.json({ success: true });
});

app.put('/api/tasks/:id', (req, res) => {
    const { title, description, assignedToId, projectId, priority, dueDate, status } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE tasks SET title = ?, description = ?, assignedToId = ?, projectId = ?, priority = ?, dueDate = ?, status = ?, updatedAt = ? WHERE id = ?')
        .run(title, description || '', assignedToId, projectId, priority, dueDate, status, now, req.params.id);
    res.json({ id: req.params.id, title, description, assignedToId, projectId, priority, dueDate, status, updatedAt: now });
});

app.delete('/api/tasks/:id', (req, res) => {
    db.prepare('DELETE FROM task_notes WHERE taskId = ?').run(req.params.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ─── TASK NOTES ──────────────────────────────────────────────
app.get('/api/tasks/:id/notes', (req, res) => {
    const rows = db.prepare('SELECT * FROM task_notes WHERE taskId = ? ORDER BY createdAt DESC').all(req.params.id);
    res.json(rows);
});

app.post('/api/tasks/:id/notes', (req, res) => {
    const { content } = req.body;
    const id = uuidv4().slice(0, 9);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO task_notes (id, taskId, content, createdAt) VALUES (?, ?, ?, ?)').run(id, req.params.id, content, now);
    res.status(201).json({ id, taskId: req.params.id, content, createdAt: now });
});

// ─── DAILY UPDATES ───────────────────────────────────────────
app.get('/api/daily-updates', (_req, res) => {
    const rows = db.prepare('SELECT * FROM daily_updates ORDER BY createdAt DESC').all();
    res.json(rows);
});

app.post('/api/daily-updates', (req, res) => {
    const { employeeId, projectId, taskTitle, date, yesterday, today, blockers, progress } = req.body;
    const id = uuidv4().slice(0, 9);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO daily_updates (id, employeeId, projectId, taskTitle, date, yesterday, today, blockers, progress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, employeeId, projectId, taskTitle, date, yesterday, today, blockers || null, progress, now);

    // Auto-update task status if a matching task exists
    const matchingTask = db.prepare('SELECT id FROM tasks WHERE LOWER(title) = LOWER(?) AND projectId = ?').get(taskTitle, projectId) as { id: string } | undefined;
    if (matchingTask) {
        const updatedNow = new Date().toISOString();
        if (blockers) {
            db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run('Blocked', updatedNow, matchingTask.id);
        } else if (progress === 100) {
            db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run('Done', updatedNow, matchingTask.id);
        } else {
            db.prepare('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?').run('In Progress', updatedNow, matchingTask.id);
        }
    }

    // Auto-create blocker if reported
    if (blockers) {
        const blockerId = uuidv4().slice(0, 9);
        const reportedDate = new Date().toISOString().split('T')[0];
        db.prepare('INSERT INTO blockers (id, employeeId, projectId, taskTitle, description, reportedDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(blockerId, employeeId, projectId, taskTitle, blockers, reportedDate, 'Open');
    }

    res.status(201).json({ id, employeeId, projectId, taskTitle, date, yesterday, today, blockers, progress, createdAt: now });
});

// ─── BLOCKERS ────────────────────────────────────────────────
app.get('/api/blockers', (_req, res) => {
    const rows = db.prepare('SELECT * FROM blockers').all();
    res.json(rows);
});

app.patch('/api/blockers/:id/resolve', (req, res) => {
    const resolvedDate = new Date().toISOString();
    db.prepare('UPDATE blockers SET status = ?, resolvedDate = ? WHERE id = ?').run('Resolved', resolvedDate, req.params.id);
    res.json({ success: true });
});

// ─── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 ScrumCMD API server running at http://localhost:${PORT}`);
});
