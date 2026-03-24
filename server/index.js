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

app.listen(PORT, () => {
  console.log(`[mymind] server running on http://localhost:${PORT}`);
});
