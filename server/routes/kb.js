const express = require('express');
const multer = require('multer');
const db = require('../db/queries');
const kbWorker = require('../agent/kbWorker');
const { parseBookmarks } = require('../services/bookmarkParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/kb
router.get('/', (_req, res) => {
  try {
    res.json(db.getAllKBItems());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kb/clusters
router.get('/clusters', (_req, res) => {
  try {
    const clusters = db.getAllClusters();
    // Attach item counts
    const withCounts = clusters.map(c => ({
      ...c,
      count: db.getKBByCluster(c.name).length
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kb/search
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const results = db.searchKBKeyword(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kb/:id
router.get('/:id', (req, res) => {
  try {
    const item = db.getKBById(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kb
router.post('/', async (req, res) => {
  try {
    const item = db.createKBItem(req.body);
    if (req.body.cluster) db.upsertCluster(req.body.cluster);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/kb/:id
router.put('/:id', (req, res) => {
  try {
    const item = db.updateKBItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/kb/:id
router.delete('/:id', (req, res) => {
  try {
    const item = db.getKBById(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    // Remove from DB (no explicit delete query needed — add one)
    const database = require('../db/schema').getDb();
    database.prepare('DELETE FROM knowledge_items WHERE id = ?').run(req.params.id);
    database.prepare('DELETE FROM task_kb_links WHERE kb_id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kb/fetch-url
router.post('/fetch-url', async (req, res) => {
  try {
    const { url, cluster } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });
    const result = await kbWorker.addUrl(url, cluster);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kb/import — multipart bookmark HTML upload
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const html = req.file.buffer.toString('utf8');
    const parsed = parseBookmarks(html);

    // Flatten all URLs
    const allUrls = parsed.flatMap(cluster =>
      cluster.items.map(item => ({ ...item, cluster: cluster.cluster }))
    );

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    let done = 0;
    const total = allUrls.length;

    res.write(`data: ${JSON.stringify({ type: 'start', total })}\n\n`);

    for (let i = 0; i < allUrls.length; i += 3) {
      const batch = allUrls.slice(i, i + 3);
      await Promise.all(batch.map(async ({ url, title, cluster }) => {
        try {
          const result = await kbWorker.addUrl(url, cluster);
          done++;
          res.write(`data: ${JSON.stringify({ type: 'progress', done, total, title, result })}\n\n`);
        } catch {
          done++;
          res.write(`data: ${JSON.stringify({ type: 'progress', done, total, title, error: true })}\n\n`);
        }
      }));
    }

    res.write(`data: ${JSON.stringify({ type: 'done', total })}\n\n`);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kb/:id/tasks
router.get('/:id/tasks', (req, res) => {
  try {
    const tasks = db.getLinkedTasksForKB(req.params.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
