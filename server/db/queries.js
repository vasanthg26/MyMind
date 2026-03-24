const { getDb } = require('./schema');
const { v4: uuidv4 } = require('uuid');

// ─── Tasks ───────────────────────────────────────────────────────────────────

function getAllTasks() {
  return getDb().prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all().map(parseTask);
}

function getTaskById(id) {
  const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? parseTask(row) : null;
}

function getTasksByStatus(status) {
  return getDb().prepare('SELECT * FROM tasks WHERE status = ? ORDER BY updated_at DESC').all(status).map(parseTask);
}

function getTasksByPriority(priority) {
  return getDb().prepare('SELECT * FROM tasks WHERE priority = ? AND status != ? ORDER BY updated_at DESC')
    .all(priority, 'done').map(parseTask);
}

function getGraveyardTasks() {
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  return getDb().prepare(
    "SELECT * FROM tasks WHERE status NOT IN ('done', 'graveyard') AND updated_at < ? ORDER BY updated_at ASC"
  ).all(cutoff).map(parseTask);
}

function createTask(data) {
  const now = new Date().toISOString();
  const id = uuidv4();
  const row = {
    id,
    title: data.title || 'Untitled',
    description: data.description || '',
    priority: data.priority || 'p2',
    status: data.status || 'todo',
    due_date: data.due_date || null,
    tags: JSON.stringify(data.tags || []),
    subtasks: JSON.stringify(data.subtasks || []),
    session_log: JSON.stringify(data.session_log || []),
    energy: data.energy || 'shallow',
    created_at: now,
    updated_at: now,
    snoozed_until: data.snoozed_until || null
  };

  getDb().prepare(`
    INSERT INTO tasks (id, title, description, priority, status, due_date, tags, subtasks, session_log, energy, created_at, updated_at, snoozed_until)
    VALUES (@id, @title, @description, @priority, @status, @due_date, @tags, @subtasks, @session_log, @energy, @created_at, @updated_at, @snoozed_until)
  `).run(row);

  return getTaskById(id);
}

function updateTask(id, updates) {
  const now = new Date().toISOString();
  const task = getTaskById(id);
  if (!task) return null;

  const merged = { ...task, ...updates, updated_at: now };
  getDb().prepare(`
    UPDATE tasks SET
      title = @title,
      description = @description,
      priority = @priority,
      status = @status,
      due_date = @due_date,
      tags = @tags,
      subtasks = @subtasks,
      session_log = @session_log,
      energy = @energy,
      updated_at = @updated_at,
      snoozed_until = @snoozed_until
    WHERE id = @id
  `).run({
    ...merged,
    tags: JSON.stringify(merged.tags),
    subtasks: JSON.stringify(merged.subtasks),
    session_log: JSON.stringify(merged.session_log)
  });

  return getTaskById(id);
}

function deleteTask(id) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
  getDb().prepare('DELETE FROM task_kb_links WHERE task_id = ?').run(id);
}

function completeTask(id, effortTag) {
  return updateTask(id, { status: 'done', energy: effortTag || undefined });
}

function snoozeTask(id, days) {
  const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return updateTask(id, { snoozed_until: until, updated_at: new Date().toISOString() });
}

// ─── KB Items ─────────────────────────────────────────────────────────────────

function getAllKBItems() {
  return getDb().prepare('SELECT * FROM knowledge_items ORDER BY updated_at DESC').all().map(parseKB);
}

function getKBById(id) {
  const row = getDb().prepare('SELECT * FROM knowledge_items WHERE id = ?').get(id);
  return row ? parseKB(row) : null;
}

function getKBByCluster(cluster) {
  return getDb().prepare('SELECT * FROM knowledge_items WHERE cluster = ? ORDER BY updated_at DESC').all(cluster).map(parseKB);
}

function createKBItem(data) {
  const now = new Date().toISOString();
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO knowledge_items (id, type, title, content, summary, key_points, source_url, cluster, tags, embedding, created_at, updated_at)
    VALUES (@id, @type, @title, @content, @summary, @key_points, @source_url, @cluster, @tags, @embedding, @created_at, @updated_at)
  `).run({
    id,
    type: data.type || 'note',
    title: data.title || 'Untitled',
    content: data.content || '',
    summary: data.summary || '',
    key_points: JSON.stringify(data.key_points || []),
    source_url: data.source_url || '',
    cluster: data.cluster || 'General',
    tags: JSON.stringify(data.tags || []),
    embedding: JSON.stringify(data.embedding || []),
    created_at: now,
    updated_at: now
  });
  return getKBById(id);
}

function updateKBItem(id, updates) {
  const now = new Date().toISOString();
  const item = getKBById(id);
  if (!item) return null;
  const merged = { ...item, ...updates, updated_at: now };
  getDb().prepare(`
    UPDATE knowledge_items SET
      title = @title, content = @content, summary = @summary,
      key_points = @key_points, source_url = @source_url,
      cluster = @cluster, tags = @tags, updated_at = @updated_at
    WHERE id = @id
  `).run({
    ...merged,
    key_points: JSON.stringify(merged.key_points),
    tags: JSON.stringify(merged.tags)
  });
  return getKBById(id);
}

function searchKBKeyword(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const all = getAllKBItems();
  return all
    .map(item => {
      const blob = `${item.title} ${item.summary} ${item.content} ${(item.tags || []).join(' ')}`.toLowerCase();
      const score = terms.filter(t => blob.includes(t)).length / terms.length;
      return { ...item, score };
    })
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ─── Clusters ─────────────────────────────────────────────────────────────────

function getAllClusters() {
  return getDb().prepare('SELECT * FROM clusters ORDER BY name ASC').all().map(parseCluster);
}

function upsertCluster(name) {
  const existing = getDb().prepare('SELECT * FROM clusters WHERE name = ?').get(name);
  if (existing) return parseCluster(existing);
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare('INSERT INTO clusters (id, name, created_at) VALUES (?, ?, ?)').run(id, name, now);
  return { id, name, created_at: now };
}

// ─── Task-KB Links ─────────────────────────────────────────────────────────────

function linkTaskKB(taskId, kbId) {
  const now = new Date().toISOString();
  getDb().prepare('INSERT OR IGNORE INTO task_kb_links (task_id, kb_id, created_at) VALUES (?, ?, ?)').run(taskId, kbId, now);
}

function getLinkedKBForTask(taskId) {
  const links = getDb().prepare('SELECT kb_id FROM task_kb_links WHERE task_id = ?').all(taskId);
  return links.map(l => getKBById(l.kb_id)).filter(Boolean);
}

function getLinkedTasksForKB(kbId) {
  const links = getDb().prepare('SELECT task_id FROM task_kb_links WHERE kb_id = ?').all(kbId);
  return links.map(l => getTaskById(l.task_id)).filter(Boolean);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTask(row) {
  return {
    ...row,
    tags: safeJSON(row.tags, []),
    subtasks: safeJSON(row.subtasks, []),
    session_log: safeJSON(row.session_log, [])
  };
}

function parseKB(row) {
  return {
    ...row,
    key_points: safeJSON(row.key_points, []),
    tags: safeJSON(row.tags, []),
    embedding: safeJSON(row.embedding, [])
  };
}

function parseCluster(row) {
  return {
    ...row,
    tags: safeJSON(row.tags, [])
  };
}

function safeJSON(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}

module.exports = {
  getAllTasks, getTaskById, getTasksByStatus, getTasksByPriority,
  getGraveyardTasks, createTask, updateTask, deleteTask, completeTask, snoozeTask,
  getAllKBItems, getKBById, getKBByCluster, createKBItem, updateKBItem, searchKBKeyword,
  getAllClusters, upsertCluster,
  linkTaskKB, getLinkedKBForTask, getLinkedTasksForKB
};
