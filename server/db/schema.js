const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'mymind.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT DEFAULT '',
      priority     TEXT DEFAULT 'p2',
      status       TEXT DEFAULT 'todo',
      due_date     TEXT,
      tags         TEXT DEFAULT '[]',
      subtasks     TEXT DEFAULT '[]',
      session_log  TEXT DEFAULT '[]',
      energy       TEXT DEFAULT 'shallow',
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      snoozed_until TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      content     TEXT DEFAULT '',
      summary     TEXT DEFAULT '',
      key_points  TEXT DEFAULT '[]',
      source_url  TEXT DEFAULT '',
      cluster     TEXT DEFAULT 'General',
      tags        TEXT DEFAULT '[]',
      embedding   TEXT DEFAULT '[]',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_kb_links (
      task_id    TEXT NOT NULL,
      kb_id      TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (task_id, kb_id)
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id          TEXT PRIMARY KEY,
      name        TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      tags        TEXT DEFAULT '[]',
      created_at  TEXT NOT NULL
    );
  `);

  console.log('[db] schema initialized');
}

function seedIfEmpty() {
  const database = getDb();
  const count = database.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const thisWeek = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();

  const insertTask = database.prepare(`
    INSERT INTO tasks (id, title, description, priority, status, due_date, tags, subtasks, session_log, energy, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Task 1: Fix nyValidateAmt bug — P1, active, due today
  insertTask.run(
    uuidv4(),
    'Fix nyValidateAmt bug',
    'Amount validation failing for NY state records in batch process.',
    'p1', 'active', today,
    JSON.stringify(['#PeopleSoft', '#Bug']),
    JSON.stringify([
      { title: 'Reproduce the bug in dev', done: true },
      { title: 'Trace validation logic in nyValidateAmt function', done: true },
      { title: 'Apply fix and unit test', done: false },
      { title: 'Deploy to QA and verify', done: false }
    ]),
    JSON.stringify([{ at: now, note: 'Started investigation' }]),
    'deep', now, now
  );

  // Task 2: Deploy TraceLens v2 — P1, todo, due tomorrow
  insertTask.run(
    uuidv4(),
    'Deploy TraceLens v2',
    'Production deployment of TraceLens v2 with new parser and UI.',
    'p1', 'todo', tomorrow,
    JSON.stringify(['#TraceLens', '#DevOps']),
    JSON.stringify([
      { title: 'Run full test suite', done: false },
      { title: 'Build production bundle', done: false },
      { title: 'Deploy to Railway and verify', done: false }
    ]),
    JSON.stringify([]),
    'deep', now, now
  );

  // Task 3: Refactor TraceLens parser — P2, todo, this week
  insertTask.run(
    uuidv4(),
    'Refactor TraceLens parser',
    'Clean up the PeopleCode trace parser for better performance and maintainability.',
    'p2', 'todo', thisWeek,
    JSON.stringify(['#TraceLens', '#Refactor']),
    JSON.stringify([
      { title: 'Audit current parser bottlenecks', done: false },
      { title: 'Redesign token stream handling', done: false },
      { title: 'Rewrite line-by-line parser', done: false },
      { title: 'Benchmark before/after', done: false }
    ]),
    JSON.stringify([]),
    'deep', now, now
  );

  // Task 4: Document IB Handler pattern — P2, todo, next week
  insertTask.run(
    uuidv4(),
    'Document IB Handler pattern',
    'Write up the standard pattern for Integration Broker async handlers.',
    'p2', 'todo', nextWeek,
    JSON.stringify(['#IB', '#Docs']),
    JSON.stringify([
      { title: 'Review existing IB handler implementations', done: false },
      { title: 'Draft pattern documentation', done: false },
      { title: 'Add code examples', done: false }
    ]),
    JSON.stringify([]),
    'shallow', now, now
  );

  // Task 5: Research PeopleTools JAR — P3, graveyard (10 days old)
  insertTask.run(
    uuidv4(),
    'Research PeopleTools JAR',
    'Investigate PeopleTools JAR file options for custom Java extensions.',
    'p3', 'todo', null,
    JSON.stringify(['#PeopleSoft', '#Research']),
    JSON.stringify([]),
    JSON.stringify([]),
    'shallow', tenDaysAgo, tenDaysAgo
  );

  // Seed clusters
  const insertCluster = database.prepare(`
    INSERT OR IGNORE INTO clusters (id, name, description, tags, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCluster.run(uuidv4(), 'App Packages', 'PeopleCode App Package patterns and best practices', JSON.stringify(['#AppPackages', '#PeopleCode']), now);
  insertCluster.run(uuidv4(), 'Integration Broker', 'IB messaging patterns, handlers, and configuration', JSON.stringify(['#IB', '#Integration']), now);
  insertCluster.run(uuidv4(), 'PeopleCode Tracing', 'Trace flags, log analysis, and debugging tools', JSON.stringify(['#Tracing', '#Debug']), now);

  // Seed KB items
  const insertKB = database.prepare(`
    INSERT INTO knowledge_items (id, type, title, content, summary, key_points, source_url, cluster, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertKB.run(
    uuidv4(), 'url',
    'App Package Best Practices — PeopleSoft Wiki',
    'App packages provide object-oriented programming in PeopleCode. Use base classes for shared logic. Always implement interfaces explicitly. Avoid deep inheritance trees — prefer composition.',
    'Best practices for structuring PeopleCode App Packages including class hierarchy, interface implementation, and composition patterns.',
    JSON.stringify(['Use base classes for shared logic', 'Prefer composition over deep inheritance', 'Implement interfaces explicitly', 'Keep package hierarchy shallow']),
    'https://docs.oracle.com/en/peoplesoft/app-packages',
    'App Packages',
    JSON.stringify(['#AppPackages', '#PeopleCode', '#BestPractices']),
    now, now
  );

  insertKB.run(
    uuidv4(), 'note',
    'Base class pattern tip',
    'When building App Package hierarchies, always put shared state in the base class constructor and use protected methods for internal logic that subclasses may override.',
    'Pattern tip for base class design in App Package hierarchies.',
    JSON.stringify(['Put shared state in base class constructor', 'Use protected methods for overridable logic', 'Document required overrides with throw new Exception()']),
    '',
    'App Packages',
    JSON.stringify(['#AppPackages', '#Pattern']),
    now, now
  );

  insertKB.run(
    uuidv4(), 'url',
    'Async vs Sync Integration Broker Guide',
    'Synchronous IB operations block until response is received. Async operations queue messages for later delivery. Use async for fire-and-forget and high-volume scenarios. Sync required when caller needs response data.',
    'Guide to choosing between synchronous and asynchronous Integration Broker messaging patterns in PeopleSoft.',
    JSON.stringify(['Sync blocks until response', 'Async queues for later delivery', 'Use async for high-volume', 'Sync when caller needs response']),
    'https://docs.oracle.com/en/peoplesoft/integration-broker',
    'Integration Broker',
    JSON.stringify(['#IB', '#Async', '#Sync']),
    now, now
  );

  insertKB.run(
    uuidv4(), 'note',
    'PS_PT handler tip',
    'When implementing PS_PT message handlers, always check the transaction status before processing. Use GetMessageInstance() to get the inbound message and verify the pub/sub contract.',
    'Key tip for PS_PT IB handler implementation pattern.',
    JSON.stringify(['Check transaction status first', 'Use GetMessageInstance() for inbound', 'Verify pub/sub contract']),
    '',
    'Integration Broker',
    JSON.stringify(['#IB', '#Handler', '#PeopleSoft']),
    now, now
  );

  insertKB.run(
    uuidv4(), 'url',
    'PeopleCode Trace Flag Values Reference',
    'Trace flags control what gets logged during PeopleCode execution. Flag 1: SQL statements. Flag 2: SQL fetch calls. Flag 64: PeopleCode statements. Flag 128: PeopleCode list. Flag 256: PeopleCode detail.',
    'Reference for PeopleCode trace flag bit values and their effects on trace output.',
    JSON.stringify(['Flag 1 = SQL statements', 'Flag 64 = PeopleCode statements', 'Flag 128 = PeopleCode list', 'Flag 256 = PeopleCode detail', 'Combine flags with bitwise OR']),
    'https://docs.oracle.com/en/peoplesoft/tracing',
    'PeopleCode Tracing',
    JSON.stringify(['#Tracing', '#PeopleCode', '#Debug', '#Reference']),
    now, now
  );

  console.log('[db] seed data inserted');
}

module.exports = { getDb, initSchema, seedIfEmpty };
