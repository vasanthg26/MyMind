import { useEffect, useState } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'mymind-briefing-date';
const PRIORITY_COLOR = { p1: 'var(--priority-p1)', p2: 'var(--priority-p2)', p3: 'var(--priority-p3)' };

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--glow-strong)',
    width: '520px',
    maxWidth: '90vw',
    padding: '22px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  header: {
    fontSize: '11px',
    color: 'var(--accent)',
    marginBottom: '4px'
  },
  date: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '16px'
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '10px',
    marginBottom: '14px'
  },
  section: {
    marginBottom: '14px'
  },
  sectionLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px'
  },
  yesterday: {
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: '1.6'
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 0',
    fontSize: '12px'
  },
  priority: {
    fontSize: '10px',
    fontWeight: '600'
  },
  taskTitle: {
    flex: 1,
    color: 'var(--text)'
  },
  taskDue: {
    fontSize: '10px',
    color: 'var(--text-muted)'
  },
  focus: {
    background: 'var(--bg)',
    border: '1px solid var(--border-accent)',
    padding: '10px',
    fontSize: '12px',
    color: 'var(--accent)',
    boxShadow: 'var(--glow)',
    lineHeight: '1.6'
  },
  stat: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '8px'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '14px'
  },
  loading: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    padding: '20px'
  }
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MorningBriefing({ onDismiss }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data } = await axios.get('/api/agent/briefing');
      setBriefing(data);
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, todayStr());
    onDismiss();
  }

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.panel}>
          <div style={styles.loading} className="pulse">daemon ● preparing morning briefing...</div>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  const r = briefing.result || {};

  return (
    <div style={styles.overlay}>
      <div style={styles.panel} className="fade-in">
        <div style={styles.header}>── morning briefing ──</div>
        <div style={styles.date}>{todayStr()}</div>
        <div style={styles.divider}>────────────────────────────────────</div>

        {/* Yesterday */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>yesterday</div>
          <div style={styles.yesterday}>{r.yesterday_summary || '—'}</div>
        </div>

        {/* Today's tasks */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>today — {(r.today_tasks || []).length} tasks</div>
          {(r.today_tasks || []).length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(no tasks)</div>
          )}
          {(r.today_tasks || []).map((t, i) => (
            <div key={t.id || i} style={styles.taskRow}>
              <span style={{ ...styles.priority, color: PRIORITY_COLOR[t.priority] }}>
                [{(t.priority || 'p2').toUpperCase()}]
              </span>
              <span style={styles.taskTitle}>{t.title}</span>
              {t.due_date && <span style={styles.taskDue}>{t.due_date}</span>}
            </div>
          ))}
        </div>

        {/* Focus suggestion */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>focus suggestion</div>
          <div style={styles.focus}>{r.focus_suggestion || '—'}</div>
        </div>

        <div style={styles.stat}>
          {r.total_tasks} open task{r.total_tasks !== 1 ? 's' : ''} total
        </div>

        <div style={styles.actions}>
          <button className="btn-accent" onClick={dismiss}>[ let&apos;s go ]</button>
          <button onClick={dismiss}>[ dismiss ]</button>
        </div>
      </div>
    </div>
  );
}

// Check if briefing should be shown today
export function shouldShowBriefing() {
  const last = localStorage.getItem(STORAGE_KEY);
  return last !== todayStr();
}
