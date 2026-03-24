const express = require('express');
const db = require('../db/queries');
const taskWorker = require('../agent/taskWorker');

const router = express.Router();

// GET /api/tasks
router.get('/', (_req, res) => {
  try {
    const tasks = db.getAllTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/graveyard
router.get('/graveyard', (_req, res) => {
  try {
    const tasks = db.getGraveyardTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const task = db.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  try {
    const task = db.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: 'not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  try {
    db.deleteTask(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/done
router.post('/:id/done', async (req, res) => {
  try {
    const { effort } = req.body;
    const task = db.completeTask(req.params.id, effort);
    if (!task) return res.status(404).json({ error: 'not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/subtask
router.post('/:id/subtask', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });
    const { title } = req.body;
    const subtasks = [...(task.subtasks || []), { title, done: false }];
    const updated = db.updateTask(req.params.id, { subtasks });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id/subtask/:index
router.put('/:id/subtask/:index', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });
    const idx = parseInt(req.params.index);
    const subtasks = [...(task.subtasks || [])];
    if (!subtasks[idx]) return res.status(404).json({ error: 'subtask not found' });
    subtasks[idx] = { ...subtasks[idx], ...req.body };
    const updated = db.updateTask(req.params.id, { subtasks });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id/kb
router.get('/:id/kb', (req, res) => {
  try {
    const items = db.getLinkedKBForTask(req.params.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/kb/:kbId
router.post('/:id/kb/:kbId', (req, res) => {
  try {
    db.linkTaskKB(req.params.id, req.params.kbId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/effort
router.post('/:id/effort', async (req, res) => {
  try {
    const result = await taskWorker.effortTag(req.params.id, req.body.effort);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
