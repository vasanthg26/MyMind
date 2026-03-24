import { useState, useEffect } from 'react';
import axios from 'axios';

const styles = {
  container: {
    padding: '14px 16px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
    paddingTop: '30px'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-bright)',
    flex: 1,
    lineHeight: '1.4'
  },
  type: {
    fontSize: '10px',
    color: 'var(--text-faint)',
    border: '1px solid var(--border)',
    padding: '1px 6px',
    flexShrink: 0
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '10px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  sectionLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  summary: {
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: '1.7',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '10px'
  },
  keyPoints: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  keyPoint: {
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: '1.5',
    display: 'flex',
    gap: '6px'
  },
  bullet: {
    color: 'var(--accent)',
    flexShrink: 0
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  tag: {
    fontSize: '10px',
    color: 'var(--accent)',
    border: '1px solid var(--border-accent)',
    padding: '1px 6px',
    opacity: 0.8
  },
  url: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '6px 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cluster: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  clusterBadge: {
    color: 'var(--accent)',
    border: '1px solid var(--border-accent)',
    padding: '1px 6px',
    fontSize: '10px',
    opacity: 0.8
  },
  linkedTasks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  taskLink: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '5px 8px',
    cursor: 'pointer',
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  actions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    paddingTop: '4px'
  },
  meta: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  }
};

export default function KBDetail({ item, clusters, onSelectTask, onDelete }) {
  const [linkedTasks, setLinkedTasks] = useState([]);

  useEffect(() => {
    if (!item) return;
    setLinkedTasks([]);
    axios.get(`/api/kb/${item.id}/tasks`)
      .then(({ data }) => setLinkedTasks(data))
      .catch(() => setLinkedTasks([]));
  }, [item?.id]);

  if (!item) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>◈ select an item to view</div>
      </div>
    );
  }

  const cluster = clusters.find(c => c.id === item.cluster_id);
  const keyPoints = item.key_points || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>{item.title}</div>
        <span style={styles.type}>{item.type || 'note'}</span>
      </div>

      <div style={styles.divider}>────────────────────────────────────</div>

      {item.summary && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>summary</div>
          <div style={styles.summary}>{item.summary}</div>
        </div>
      )}

      {keyPoints.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>key points</div>
          <div style={styles.keyPoints}>
            {keyPoints.map((pt, i) => (
              <div key={i} style={styles.keyPoint}>
                <span style={styles.bullet}>▸</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(item.tags || []).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>tags</div>
          <div style={styles.tags}>
            {item.tags.map(t => (
              <span key={t} style={styles.tag}>#{t}</span>
            ))}
          </div>
        </div>
      )}

      {item.source_url && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>source</div>
          <div style={styles.url} title={item.source_url}>{item.source_url}</div>
        </div>
      )}

      {cluster && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>cluster</div>
          <div style={styles.cluster}>
            <span style={styles.clusterBadge}>{cluster.name}</span>
            {cluster.description && (
              <span style={{ fontSize: '11px' }}>{cluster.description}</span>
            )}
          </div>
        </div>
      )}

      {linkedTasks.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>linked tasks ({linkedTasks.length})</div>
          <div style={styles.linkedTasks}>
            {linkedTasks.map(t => (
              <div key={t.id} style={styles.taskLink} onClick={() => onSelectTask && onSelectTask(t)}>
                <span style={{ color: 'var(--text-faint)' }}>✦</span>
                <span>{t.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-faint)' }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedTasks.length === 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>tasks</div>
          <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>no linked tasks — use /kb link to connect</div>
        </div>
      )}

      <div style={styles.meta}>
        added {new Date(item.created_at).toLocaleDateString()}
        {item.word_count ? ` · ${item.word_count} words` : ''}
      </div>

      <div style={styles.actions}>
        <button className="btn-danger" style={{ fontSize: '10px', padding: '3px 10px' }} onClick={() => onDelete && onDelete(item)}>
          [ delete ]
        </button>
      </div>
    </div>
  );
}
