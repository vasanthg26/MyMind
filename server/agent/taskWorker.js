const { callLLM } = require('../llm/router');
const db = require('../db/queries');

const today = () => new Date().toISOString().slice(0, 10);

// ─── Format helpers ────────────────────────────────────────────────────────

function priorityBadge(p) {
  const map = { p1: '[ P1 ]', p2: '[ P2 ]', p3: '[ P3 ]' };
  return map[p] || '[ P2 ]';
}

function statusIcon(s) {
  const map = { active: '● ACTIVE', todo: '○ TODO', done: '✓ DONE', graveyard: '☠ GRAVEYARD' };
  return map[s] || '○ TODO';
}

function formatTaskCard(task) {
  const subtaskLines = (task.subtasks || []).map((s, i) =>
    `    ${i + 1}. [${s.done ? '✓' : ' '}] ${s.title}`
  ).join('\n');

  const tagLine = (task.tags || []).join(' ');

  return [
    '────────────────────',
    `  title    : ${task.title}`,
    `  priority : ${priorityBadge(task.priority)}`,
    `  status   : ${statusIcon(task.status)}`,
    `  due      : ${task.due_date || '—'}`,
    `  energy   : [ ${(task.energy || 'shallow').toUpperCase()} ]`,
    `  tags     : ${tagLine || '—'}`,
    task.subtasks?.length ? `  subtasks :\n${subtaskLines}` : null,
    '────────────────────'
  ].filter(Boolean).join('\n');
}

// ─── Operations ───────────────────────────────────────────────────────────────

async function createTask(message) {
  const llmResult = await callLLM('create_task', { message });
  const task = db.createTask({
    title: llmResult.title,
    priority: llmResult.priority || 'p2',
    due_date: llmResult.due_date,
    tags: llmResult.tags || [],
    subtasks: (llmResult.subtasks || []).map(s =>
      typeof s === 'string' ? { title: s, done: false } : s
    ),
    energy: llmResult.energy || 'shallow',
    status: 'todo'
  });

  // Auto-link relevant KB items
  const allKB = db.getAllKBItems();
  const taskBlob = `${task.title} ${(task.tags || []).join(' ')}`.toLowerCase();
  const linked = allKB.filter(kb => {
    const kbBlob = `${kb.title} ${(kb.tags || []).join(' ')} ${kb.cluster}`.toLowerCase();
    return kbBlob.split(' ').some(w => w.length > 3 && taskBlob.includes(w));
  }).slice(0, 3);

  for (const kb of linked) {
    db.linkTaskKB(task.id, kb.id);
  }

  const tagLine = (task.tags || []).join(' ');
  const subtaskLines = (task.subtasks || []).map((s, i) =>
    `    ${i + 1}. ${s.title}`
  ).join('\n');

  const display = [
    'agent ● thinking...',
    '────────────────────',
    'created',
    '────────────────────',
    `  title    : ${task.title}`,
    `  priority : ${priorityBadge(task.priority)}`,
    `  due      : ${task.due_date || '—'}`,
    `  energy   : [ ${(task.energy || 'shallow').toUpperCase()} ]`,
    `  tags     : ${tagLine || '—'}`,
    task.subtasks?.length ? `  subtasks :\n${subtaskLines}` : null,
    `  kb       : ${linked.length} note${linked.length !== 1 ? 's' : ''} linked`,
    '────────────────────',
    '[ enter ] confirm  [ e ] edit  [ esc ] cancel'
  ].filter(Boolean).join('\n');

  return { type: 'task_created', task, linked_kb: linked, display };
}

async function listTasks(args) {
  const filter = args?.trim().toLowerCase();
  let tasks;
  let label;

  if (filter === 'p1') { tasks = db.getTasksByPriority('p1'); label = 'P1 tasks'; }
  else if (filter === 'p2') { tasks = db.getTasksByPriority('p2'); label = 'P2 tasks'; }
  else if (filter === 'p3') { tasks = db.getTasksByPriority('p3'); label = 'P3 tasks'; }
  else if (filter === 'active') { tasks = db.getTasksByStatus('active'); label = 'active tasks'; }
  else if (filter === 'done') { tasks = db.getTasksByStatus('done'); label = 'completed tasks'; }
  else {
    tasks = db.getAllTasks().filter(t => t.status !== 'done' && t.status !== 'graveyard');
    label = 'all tasks';
  }

  const lines = tasks.length
    ? tasks.map(t => `  ${priorityBadge(t.priority)} ${statusIcon(t.status)}  ${t.title}  ${t.due_date ? `[${t.due_date}]` : ''}`)
    : ['  (none)'];

  const display = [
    `── ${label} (${tasks.length}) ──`,
    ...lines,
    '────────────────────'
  ].join('\n');

  return { type: 'task_list', tasks, display };
}

async function doneTask(titleOrId) {
  const all = db.getAllTasks();
  const task = all.find(t => t.id === titleOrId || t.title.toLowerCase().includes((titleOrId || '').toLowerCase()));
  if (!task) return { type: 'error', display: `  ✗ task not found: "${titleOrId}"` };

  const updated = db.completeTask(task.id);
  return {
    type: 'task_done',
    task: updated,
    display: `✓ done\n  "${task.title}"\n────────────────────\n  effort: [ ] quick  [ ] as expected  [ ] harder than thought`
  };
}

async function killTask(titleOrId) {
  const all = db.getAllTasks();
  const task = all.find(t => t.id === titleOrId || t.title.toLowerCase().includes((titleOrId || '').toLowerCase()));
  if (!task) return { type: 'error', display: `  ✗ task not found: "${titleOrId}"` };

  db.deleteTask(task.id);
  return { type: 'task_killed', display: `☠ killed\n  "${task.title}"` };
}

async function focusMode() {
  const tasks = db.getAllTasks().filter(t => t.status !== 'done' && t.status !== 'graveyard');

  // Get linked KB counts
  const tasksWithKB = tasks.map(t => ({
    ...t,
    linkedKBCount: db.getLinkedKBForTask(t.id).length
  }));

  const result = await callLLM('focus_mode', { tasks: tasksWithKB, linkedKBCount: 0 });

  const focusTask = tasks.find(t => t.id === result.task_id) || tasks[0];
  const linkedKB = focusTask ? db.getLinkedKBForTask(focusTask.id) : [];

  const kbLines = linkedKB.map(k => `    ◈ ${k.title}`).join('\n');

  const display = [
    '── focus mode ──',
    '',
    result.task_id ? `  ▶ ${result.title}` : '  ✓ no active tasks',
    '',
    `  why     : ${result.reasoning}`,
    `  est.    : ~${result.estimated_minutes} min`,
    `  energy  : [ ${(result.energy || 'shallow').toUpperCase()} ]`,
    linkedKB.length ? `  kb ready:\n${kbLines}` : null,
    '',
    '────────────────────',
    focusTask ? '[ start session ]  [ skip ]' : ''
  ].filter(s => s !== null).join('\n');

  return { type: 'focus_mode', task: focusTask, linked_kb: linkedKB, result, display };
}

async function morningBriefing() {
  const tasks = db.getAllTasks();
  const result = await callLLM('morning_briefing', { tasks });

  const taskLines = (result.today_tasks || []).map(t =>
    `  ${priorityBadge(t.priority)} ${t.title}${t.due_date ? `  [${t.due_date}]` : ''}`
  ).join('\n');

  const display = [
    `── morning briefing — ${today()} ──`,
    '',
    `  yesterday : ${result.yesterday_summary}`,
    '',
    `  today (${(result.today_tasks || []).length}) :`,
    taskLines || '    (none)',
    '',
    `  focus     : ${result.focus_suggestion}`,
    `  total     : ${result.total_tasks} open tasks`,
    '',
    '────────────────────'
  ].join('\n');

  return { type: 'morning_briefing', result, display };
}

async function graveyardList() {
  const tasks = db.getGraveyardTasks();

  const lines = tasks.length
    ? tasks.map(t => {
        const daysOld = Math.floor((Date.now() - new Date(t.updated_at).getTime()) / 86400000);
        return `  ☠ ${priorityBadge(t.priority)}  ${t.title}  [${daysOld}d inactive]`;
      })
    : ['  (no abandoned tasks)'];

  const display = [
    `── graveyard (${tasks.length}) ──`,
    ...lines,
    '────────────────────',
    tasks.length ? '[ revive ] [ kill ] [ snooze 30d ]' : ''
  ].filter(Boolean).join('\n');

  return { type: 'graveyard', tasks, display };
}

async function snoozeTask(titleOrId, days) {
  const all = db.getAllTasks();
  const task = all.find(t => t.id === titleOrId || t.title.toLowerCase().includes((titleOrId || '').toLowerCase()));
  if (!task) return { type: 'error', display: `  ✗ task not found: "${titleOrId}"` };

  const d = parseInt(days) || 7;
  const updated = db.snoozeTask(task.id, d);
  return {
    type: 'task_snoozed',
    task: updated,
    display: `  ⏸ snoozed "${task.title}" for ${d} days\n  resumes: ${updated.snoozed_until}`
  };
}

async function effortTag(taskId, effort) {
  const task = db.getTaskById(taskId);
  if (!task) return { type: 'error', display: '  ✗ task not found' };

  const validEffort = ['quick', 'as_expected', 'harder_than_thought'].includes(effort) ? effort : 'as_expected';
  const updated = db.updateTask(taskId, { energy: validEffort });
  return {
    type: 'effort_tagged',
    task: updated,
    display: `  ✓ effort tagged: [ ${validEffort.replace('_', ' ')} ]`
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function handle(message, context) {
  const raw = message.trim();

  // Strip /task prefix
  const body = raw.replace(/^\/task\s*/i, '').trim();
  const lower = body.toLowerCase();

  if (lower === 'list' || lower === '') return listTasks('');
  if (lower.startsWith('list ')) return listTasks(lower.slice(5).trim());
  if (lower.startsWith('done ')) return doneTask(body.slice(5).trim());
  if (lower.startsWith('kill ')) return killTask(body.slice(5).trim());
  if (lower === 'focus') return focusMode();
  if (lower === 'briefing' || lower === 'morning') return morningBriefing();
  if (lower === 'graveyard') return graveyardList();
  if (lower.startsWith('snooze ')) {
    const parts = body.slice(7).trim().split(/\s+/);
    const days = parts[parts.length - 1].replace(/d$/i, '');
    const title = parts.slice(0, -1).join(' ');
    return snoozeTask(title, days);
  }

  // Default: create task from natural language
  return createTask(body || raw);
}

module.exports = { handle, createTask, listTasks, doneTask, killTask, focusMode, morningBriefing, graveyardList, snoozeTask, effortTag, formatTaskCard };
