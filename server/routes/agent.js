const express = require('express');
const orchestrator = require('../agent/orchestrator');
const taskWorker = require('../agent/taskWorker');
const db = require('../db/queries');

const router = express.Router();

// POST /api/agent
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const result = await orchestrator.route(message, context || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, display: `  ✗ agent error: ${err.message}` });
  }
});

// GET /api/agent/focus
router.get('/focus', async (_req, res) => {
  try {
    const result = await taskWorker.focusMode();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/briefing
router.get('/briefing', async (_req, res) => {
  try {
    const result = await taskWorker.morningBriefing();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/snapshot
router.get('/snapshot', async (req, res) => {
  try {
    const { lastTaskId } = req.query;

    if (lastTaskId) {
      const task = db.getTaskById(lastTaskId);
      if (task) {
        const linked = db.getLinkedKBForTask(lastTaskId);
        const doneCount = (task.subtasks || []).filter(s => s.done).length;
        const totalCount = (task.subtasks || []).length;
        return res.json({
          type: 'context_snapshot',
          task,
          linked_kb: linked,
          display: [
            '── context snapshot ──',
            `  last session : "${task.title}"`,
            `  progress     : ${doneCount}/${totalCount} subtasks`,
            `  status       : ${task.status}`,
            `  kb linked    : ${linked.length} notes`,
            '────────────────────',
            '[ resume ] [ new task ]'
          ].join('\n')
        });
      }
    }

    // Find most recently active task
    const active = db.getTasksByStatus('active')[0];
    if (active) {
      const linked = db.getLinkedKBForTask(active.id);
      return res.json({
        type: 'context_snapshot',
        task: active,
        linked_kb: linked,
        display: [
          '── context snapshot ──',
          `  active task : "${active.title}"`,
          `  status      : ● ACTIVE`,
          `  kb linked   : ${linked.length} notes`,
          '────────────────────',
          '[ resume ] [ new task ]'
        ].join('\n')
      });
    }

    res.json({ type: 'context_snapshot', task: null, display: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
