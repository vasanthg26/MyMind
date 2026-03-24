import { useState } from 'react';

const PRIORITY_COLOR = { p1: 'var(--priority-p1)', p2: 'var(--priority-p2)', p3: 'var(--priority-p3)' };

const TYPE_ICON = {
  url: '⊕',
  note: '◈',
  snippet: '▣',
  default: '◈'
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  searchBar: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)'
  },
  searchInput: {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: '12px',
    padding: '5px 8px',
    boxSizing: 'border-box'
  },
  filters: {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap'
  },
  filterBtn: {
    fontSize: '10px',
    padding: '2px 7px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  filterBtnActive: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    boxShadow: 'var(--glow)'
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  item: {
    padding: '8px 10px',
    marginBottom: '4px',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: 'var(--bg)'
  },
  itemActive: {
    borderColor: 'var(--accent)',
    boxShadow: 'var(--glow)'
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '3px'
  },
  typeIcon: {
    fontSize: '11px',
    color: 'var(--text-faint)'
  },
  itemTitle: {
    fontSize: '12px',
    color: 'var(--text)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemMeta: {
    fontSize: '10px',
    color: 'var(--text-faint)',
    display: 'flex',
    gap: '6px'
  },
  tag: {
    color: 'var(--text-faint)'
  },
  cluster: {
    color: 'var(--accent)',
    opacity: 0.7
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
    padding: '20px 12px'
  },
  count: {
    fontSize: '10px',
    color: 'var(--text-faint)',
    padding: '4px 12px'
  }
};

export default function KBList({ items, clusters, selectedId, onSelect, searchQuery, onSearchChange }) {
  const [clusterFilter, setClusterFilter] = useState('all');

  const filtered = items.filter(item => {
    const matchesCluster = clusterFilter === 'all' || item.cluster_id === clusterFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) ||
      (item.summary || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q));
    return matchesCluster && matchesSearch;
  });

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          placeholder="> search kb..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div style={styles.filters}>
        <button
          style={{ ...styles.filterBtn, ...(clusterFilter === 'all' ? styles.filterBtnActive : {}) }}
          onClick={() => setClusterFilter('all')}
        >
          all
        </button>
        {clusters.map(c => (
          <button
            key={c.id}
            style={{ ...styles.filterBtn, ...(clusterFilter === c.id ? styles.filterBtnActive : {}) }}
            onClick={() => setClusterFilter(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div style={styles.count}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</div>

      <div style={styles.list}>
        {filtered.length === 0 && (
          <div style={styles.empty}>
            {searchQuery ? 'no results' : 'no knowledge items'}
          </div>
        )}
        {filtered.map(item => {
          const cluster = clusters.find(c => c.id === item.cluster_id);
          return (
            <div
              key={item.id}
              style={{ ...styles.item, ...(selectedId === item.id ? styles.itemActive : {}) }}
              onClick={() => onSelect(item)}
            >
              <div style={styles.itemHeader}>
                <span style={styles.typeIcon}>{TYPE_ICON[item.type] || TYPE_ICON.default}</span>
                <span style={styles.itemTitle}>{item.title}</span>
              </div>
              <div style={styles.itemMeta}>
                {cluster && <span style={styles.cluster}>{cluster.name}</span>}
                {(item.tags || []).slice(0, 2).map(t => (
                  <span key={t} style={styles.tag}>#{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
