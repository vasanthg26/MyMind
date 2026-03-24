import { useState } from 'react';

const PRIORITY_LABEL = { p1: '[ P1 ]', p2: '[ P2 ]', p3: '[ P3 ]' };
const PRIORITY_COLOR = { p1: 'var(--priority-p1)', p2: 'var(--priority-p2)', p3: 'var(--priority-p3)' };
const STATUS_ICON = { active: '●', todo: '○', done: '✓', graveyard: '☠' };

const styles = {
  container: {
    width: '240px',
    minWidth: '240px',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '10px 12px 8px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  count: {
    fontSize: '11px',
    color: 'var(--text-faint)'
  },
  filters: {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap'
  },
  filterBtn: {
    fontSize: '10px',
    padding: '2px 7px',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all 0.1s'
  },
  filterBtnActive: {
    borderColor: 'var(--border-accent)',
    color: 'var(--accent)',
    background: 'var(--accent-bg)'
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0'
  },
  item: {
    padding: '8px 12px',
    cursor: 'pointer',
    borderLeft: '2px solid transparent',
    transition: 'all 0.1s ease',
    borderBottom: '1px solid var(--border)'
  },
  itemHovered: {
    background: 'var(--bg-hover)'
  },
  itemSelected: {
    background: 'var(--bg-selected)',
    borderLeftColor: 'var(--border-accent)'
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '3px'
  },
  statusIcon: {
    fontSize: '10px',
    width: '12px',
    flexShrink: 0
  },
  title: {
    fontSize: '12px',
    color: 'var(--text)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  titleDone: {
    color: 'var(--done)',
    textDecoration: 'line-through'
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingLeft: '18px'
  },
  priority: {
    fontSize: '10px',
    fontWeight: '600'
  },
  due: {
    fontSize: '10px',
    color: 'var(--text-muted)'
  },
  dueOverdue: {
    color: 'var(--priority-p1)'
  },
  empty: {
    padding: '20px 12px',
    color: 'var(--text-muted)',
    fontSize: '11px',
    textAlign: 'center'
  }
};

const FILTERS = ['all', 'active', 'p1', 'p2', 'p3', 'done'];

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

export default function TaskList({ tasks, selectedId, onSelect }) {
  const [filter, setFilter] = useState('all');
  const [hovered, setHovered] = useState(null);

  const filtered = tasks.filter(t => {
    if (filter === 'all') return t.status !== 'done' && t.status !== 'graveyard';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'active') return t.status === 'active';
    if (['p1', 'p2', 'p3'].includes(filter)) return t.priority === filter && t.status !== 'done';
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>tasks</span>
        <span style={styles.count}>{filtered.length}</span>
      </div>

      <div style={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 && (
          <div style={styles.empty}>no tasks</div>
        )}
        {filtered.map(task => {
          const isSelected = task.id === selectedId;
          const isHov = hovered === task.id;
          const overdue = isOverdue(task.due_date, task.status);

          return (
            <div
              key={task.id}
              style={{
                ...styles.item,
                ...(isSelected ? styles.itemSelected : isHov ? styles.itemHovered : {})
              }}
              onClick={() => onSelect(task)}
              onMouseEnter={() => setHovered(task.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={styles.itemTop}>
                <span
                  style={{
                    ...styles.statusIcon,
                    color: task.status === 'active' ? 'var(--accent)'
                      : task.status === 'done' ? 'var(--done)'
                      : 'var(--text-muted)'
                  }}
                >
                  {STATUS_ICON[task.status] || '○'}
                </span>
                <span style={{ ...styles.title, ...(task.status === 'done' ? styles.titleDone : {}) }}>
                  {task.title}
                </span>
              </div>
              <div style={styles.itemMeta}>
                <span style={{ ...styles.priority, color: PRIORITY_COLOR[task.priority] }}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                {task.due_date && (
                  <span style={{ ...styles.due, ...(overdue ? styles.dueOverdue : {}) }}>
                    {overdue ? '⚠ ' : ''}{task.due_date}
                  </span>
                )}
                {(task.tags || []).slice(0, 1).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
