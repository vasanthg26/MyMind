require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema, seedIfEmpty } = require('./db/schema');

const tasksRouter = require('./routes/tasks');
const kbRouter = require('./routes/kb');
const agentRouter = require('./routes/agent');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Init DB
initSchema();
seedIfEmpty();

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/kb', kbRouter);
app.use('/api/agent', agentRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[mymind] server running on http://localhost:${PORT}`);
});
