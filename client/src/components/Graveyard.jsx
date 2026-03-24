import { useState, useEffect } from 'react';
import axios from 'axios';

const PRIORITY_COLOR = { p1: 'var(--priority-p1)', p2: 'var(--priority-p2)', p3: 'var(--priority-p3)' };

const styles = {
  container: {
    padding: '14px 16px',
    height: '100%',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  title: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  count: {
    fontSize: '11px',
    color: 'var(--text-faint)'
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '10px',
    marginBottom: '10px'
  },
  item: {
    border: '1px solid var(--border)',
    padding: '10px',
    marginBottom: '8px',
    background: 'var(--bg)'
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  skull: {
    color: 'var(--text-faint)',
    fontSize: '12px'
  },
  itemTitle: {
    fontSize: '12px',
    color: 'var(--done)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  daysOld: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  },
  itemActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  itemMeta: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginBottom: '6px'
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
    paddingTop: '20px'
  },
  loading: {
    color: 'var(--text-muted)',
    fontSize: '12px'
  }
};

export default function Graveyard({ onRevive }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/tasks/graveyard');
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function revive(task) {
    await axios.put(`/api/tasks/${task.id}`, { status: 'todo', updated_at: new Date().toISOString() });
    if (onRevive) onRevive(task);
    load();
  }

  async function kill(task) {
    await axios.delete(`/api/tasks/${task.id}`);
    load();
  }

  async function snooze(task) {
    await axios.post('/api/agent', { message: `/task snooze ${task.title} 30d` });
    load();
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading} className="pulse">loading graveyard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>── graveyard ──</span>
        <span style={styles.count}>{tasks.length}</span>
      </div>
      <div style={styles.divider}>────────────────────</div>

      {tasks.length === 0 && (
        <div style={styles.empty}>no abandoned tasks<br />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>tasks inactive 7+ days appear here</span>
        </div>
      )}

      {tasks.map(task => {
        const daysOld = Math.floor((Date.now() - new Date(task.updated_at).getTime()) / 86400000);
        return (
          <div key={task.id} style={styles.item}>
            <div style={styles.itemHeader}>
              <span style={styles.skull}>☠</span>
              <span style={{ ...styles.skull, color: PRIORITY_COLOR[task.priority], fontSize: '10px' }}>
                [{task.priority.toUpperCase()}]
              </span>
              <span style={styles.itemTitle}>{task.title}</span>
              <span style={styles.daysOld}>{daysOld}d</span>
            </div>
            <div style={styles.itemMeta}>
              {(task.tags || []).join(' ')}
            </div>
            <div style={styles.itemActions}>
              <button className="btn-accent" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => revive(task)}>
                [ revive ]
              </button>
              <button style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => snooze(task)}>
                [ snooze 30d ]
              </button>
              <button className="btn-danger" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => kill(task)}>
                [ kill ]
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
