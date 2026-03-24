import { useState } from 'react';
import axios from 'axios';

const PRIORITY_COLOR = { p1: 'var(--priority-p1)', p2: 'var(--priority-p2)', p3: 'var(--priority-p3)' };
const PRIORITY_LABEL = { p1: '[ P1 ]', p2: '[ P2 ]', p3: '[ P3 ]' };
const STATUS_LABEL = { active: '● ACTIVE', todo: '○ TODO', done: '✓ DONE', graveyard: '☠ GRAVEYARD' };
const ENERGY_COLOR = { deep: 'var(--priority-p1)', shallow: 'var(--priority-p2)', quick: 'var(--priority-p3)' };

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid var(--border)'
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-faint)',
    fontSize: '12px'
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid var(--border)'
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-bright)',
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  meta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  metaItem: {
    fontSize: '11px',
    color: 'var(--text-muted)'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px'
  },
  section: {
    marginBottom: '16px'
  },
  sectionLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px'
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '10px 0',
    color: 'var(--text-faint)',
    fontSize: '10px'
  },
  desc: {
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: '1.6'
  },
  subtaskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    cursor: 'pointer'
  },
  subtaskCheck: {
    width: '14px',
    height: '14px',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'all 0.1s'
  },
  subtaskCheckDone: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    background: 'var(--accent-bg)'
  },
  subtaskTitle: {
    fontSize: '12px',
    color: 'var(--text)'
  },
  subtaskTitleDone: {
    color: 'var(--done)',
    textDecoration: 'line-through'
  },
  addSubtaskRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px'
  },
  addSubtaskInput: {
    flex: 1,
    padding: '3px 7px',
    fontSize: '12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)'
  },
  kbItem: {
    padding: '6px 8px',
    border: '1px solid var(--border)',
    marginBottom: '4px',
    cursor: 'pointer',
    transition: 'all 0.1s'
  },
  kbTitle: {
    fontSize: '11px',
    color: 'var(--text)',
    marginBottom: '2px'
  },
  kbMeta: {
    fontSize: '10px',
    color: 'var(--text-muted)'
  },
  actions: {
    display: 'flex',
    gap: '6px',
    padding: '10px 16px',
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap'
  },
  tag: {
    fontSize: '11px',
    color: 'var(--text-muted)'
  }
};

export default function TaskDetail({ task, linkedKB, onUpdate, onComplete, onDelete, onToggleSubtask, onAddSubtask }) {
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');

  if (!task) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <span>select a task</span>
        </div>
      </div>
    );
  }

  const doneCount = (task.subtasks || []).filter(s => s.done).length;
  const totalCount = (task.subtasks || []).length;

  function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  }

  function handleTitleSave() {
    if (titleVal.trim() && titleVal !== task.title) {
      onUpdate(task.id, { title: titleVal.trim() });
    }
    setEditingTitle(false);
  }

  function cycleStatus() {
    const cycle = { todo: 'active', active: 'todo', done: 'todo' };
    onUpdate(task.id, { status: cycle[task.status] || 'todo' });
  }

  function cyclePriority() {
    const cycle = { p1: 'p2', p2: 'p3', p3: 'p1' };
    onUpdate(task.id, { priority: cycle[task.priority] || 'p2' });
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
            style={{ ...styles.title, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-accent)', width: '100%', outline: 'none' }}
          />
        ) : (
          <div
            style={styles.title}
            onDoubleClick={() => { setEditingTitle(true); setTitleVal(task.title); }}
            title="Double-click to edit"
          >
            {task.title}
          </div>
        )}

        <div style={styles.meta}>
          <span
            style={{ ...styles.metaItem, color: PRIORITY_COLOR[task.priority], cursor: 'pointer' }}
            onClick={cyclePriority}
            title="Click to cycle priority"
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
          <span
            style={{ ...styles.metaItem, cursor: 'pointer', color: task.status === 'active' ? 'var(--accent)' : undefined }}
            onClick={cycleStatus}
            title="Click to cycle status"
          >
            {STATUS_LABEL[task.status] || '○ TODO'}
          </span>
          {task.due_date && (
            <span style={styles.metaItem}>{task.due_date}</span>
          )}
          <span style={{ ...styles.metaItem, color: ENERGY_COLOR[task.energy] }}>
            [ {(task.energy || 'shallow').toUpperCase()} ]
          </span>
          {(task.tags || []).map(tag => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Description */}
        {task.description && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>description</div>
            <div style={styles.desc}>{task.description}</div>
          </div>
        )}

        {/* Subtasks */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            subtasks — {doneCount}/{totalCount}
            {totalCount > 0 && (
              <span style={{ marginLeft: '8px', color: 'var(--text-faint)' }}>
                {'█'.repeat(Math.round((doneCount / totalCount) * 10))}{'░'.repeat(10 - Math.round((doneCount / totalCount) * 10))}
              </span>
            )}
          </div>

          {(task.subtasks || []).map((sub, idx) => (
            <div key={idx} style={styles.subtaskRow} onClick={() => onToggleSubtask(task.id, idx, !sub.done)}>
              <div style={{ ...styles.subtaskCheck, ...(sub.done ? styles.subtaskCheckDone : {}) }}>
                {sub.done ? '✓' : ''}
              </div>
              <span style={{ ...styles.subtaskTitle, ...(sub.done ? styles.subtaskTitleDone : {}) }}>
                {sub.title}
              </span>
            </div>
          ))}

          <div style={styles.addSubtaskRow}>
            <input
              style={styles.addSubtaskInput}
              placeholder="+ add subtask"
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
            />
            <button onClick={handleAddSubtask} className="btn-accent">+</button>
          </div>
        </div>

        {/* Linked KB */}
        {(linkedKB || []).length > 0 && (
          <div style={styles.section}>
            <div style={styles.divider}>────────────────────</div>
            <div style={styles.sectionLabel}>linked knowledge ({linkedKB.length})</div>
            {linkedKB.map(item => (
              <div key={item.id} style={styles.kbItem}>
                <div style={styles.kbTitle}>◈ {item.title}</div>
                <div style={styles.kbMeta}>{item.cluster} · {(item.tags || []).join(' ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          className="btn-accent"
          onClick={() => onComplete(task.id)}
          disabled={task.status === 'done'}
        >
          ✓ done
        </button>
        <button onClick={() => onUpdate(task.id, { status: task.status === 'active' ? 'todo' : 'active' })}>
          {task.status === 'active' ? '⏸ pause' : '▶ start'}
        </button>
        <button className="btn-danger" onClick={() => onDelete(task.id)}>☠ kill</button>
      </div>
    </div>
  );
}
