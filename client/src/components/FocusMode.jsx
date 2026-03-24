import { useState, useEffect } from 'react';
import axios from 'axios';

const styles = {
  container: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '10px'
  },
  taskBlock: {
    background: 'var(--bg)',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--glow)',
    padding: '12px'
  },
  taskTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--accent)',
    marginBottom: '10px'
  },
  row: {
    display: 'flex',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '12px'
  },
  label: {
    color: 'var(--text-muted)',
    width: '70px',
    flexShrink: 0
  },
  value: {
    color: 'var(--text)',
    flex: 1
  },
  kbSection: {
    marginTop: '8px'
  },
  kbLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px'
  },
  kbItem: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    padding: '2px 0'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  loading: {
    color: 'var(--text-muted)',
    fontSize: '12px'
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
    paddingTop: '20px'
  }
};

export default function FocusMode({ onSelectTask }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/agent/focus');
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading} className="pulse">daemon ● analyzing tasks...</div>
      </div>
    );
  }

  if (!result?.task) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>── focus mode ──</span>
        </div>
        <div style={styles.empty}>
          ✓ all caught up<br />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>no active tasks</span>
        </div>
      </div>
    );
  }

  const { task, linked_kb, result: r } = result;
  const energy = r?.energy || task?.energy || 'shallow';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>── focus mode ──</span>
        <button style={{ fontSize: '10px', padding: '2px 6px' }} onClick={load}>↻</button>
      </div>

      <div style={styles.divider}>────────────────────</div>

      <div style={styles.taskBlock}>
        <div style={styles.taskTitle}>▶ {task.title}</div>

        <div style={styles.row}>
          <span style={styles.label}>why</span>
          <span style={styles.value}>{r?.reasoning || 'highest priority available'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>est.</span>
          <span style={styles.value}>~{r?.estimated_minutes || 30} min</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>energy</span>
          <span style={{
            ...styles.value,
            color: energy === 'deep' ? 'var(--priority-p1)' : energy === 'quick' ? 'var(--priority-p3)' : 'var(--priority-p2)'
          }}>
            [ {energy.toUpperCase()} ]
          </span>
        </div>

        {(linked_kb || []).length > 0 && (
          <div style={styles.kbSection}>
            <div style={styles.kbLabel}>kb ready ({linked_kb.length})</div>
            {linked_kb.map(k => (
              <div key={k.id} style={styles.kbItem}>◈ {k.title}</div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button className="btn-accent" onClick={() => onSelectTask && onSelectTask(task)}>
          [ start session ]
        </button>
        <button onClick={load}>[ skip ]</button>
      </div>
    </div>
  );
}
