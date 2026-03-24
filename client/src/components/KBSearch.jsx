import { useState, useCallback } from 'react';
import axios from 'axios';

const styles = {
  container: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
    overflowY: 'auto'
  },
  header: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  searchRow: {
    display: 'flex',
    gap: '6px'
  },
  input: {
    flex: 1,
    background: 'var(--bg)',
    border: '1px solid var(--border-accent)',
    color: 'var(--text)',
    fontSize: '12px',
    padding: '6px 8px',
    boxShadow: 'var(--glow)'
  },
  searchBtn: {
    padding: '6px 12px',
    fontSize: '11px',
    color: 'var(--accent)',
    border: '1px solid var(--border-accent)',
    background: 'transparent',
    cursor: 'pointer'
  },
  divider: {
    color: 'var(--text-faint)',
    fontSize: '10px'
  },
  count: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  result: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    padding: '10px',
    cursor: 'pointer'
  },
  resultActive: {
    borderColor: 'var(--accent)',
    boxShadow: 'var(--glow)'
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '5px'
  },
  resultTitle: {
    fontSize: '12px',
    color: 'var(--text)',
    flex: 1
  },
  resultScore: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  },
  resultSnippet: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  highlighted: {
    color: 'var(--accent)',
    background: 'rgba(0,255,65,0.08)'
  },
  tags: {
    display: 'flex',
    gap: '4px',
    marginTop: '5px',
    flexWrap: 'wrap'
  },
  tag: {
    fontSize: '10px',
    color: 'var(--text-faint)'
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
    paddingTop: '10px'
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-faint)'
  },
  loading: {
    color: 'var(--text-muted)',
    fontSize: '12px'
  }
};

function highlight(text, query) {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={styles.highlighted}>{part}</mark>
      : part
  );
}

export default function KBSearch({ onSelect, selectedId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q) => {
    const term = (q !== undefined ? q : query).trim();
    if (!term) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await axios.get('/api/kb/search', { params: { q: term } });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') search();
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>── kb search ──</div>
      <div style={styles.divider}>────────────────────────────────────</div>

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          placeholder="> search by keyword, tag, or topic..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button style={styles.searchBtn} onClick={() => search()}>
          [ search ]
        </button>
      </div>

      {loading && (
        <div style={styles.loading} className="pulse">searching knowledge base...</div>
      )}

      {!loading && searched && (
        <div style={styles.count}>
          {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
        </div>
      )}

      {!loading && results.length === 0 && searched && (
        <div style={styles.empty}>no results found</div>
      )}

      {!loading && !searched && (
        <div style={styles.hint}>[ enter ] to search · searches title, summary, tags</div>
      )}

      <div style={styles.results}>
        {results.map(item => (
          <div
            key={item.id}
            style={{ ...styles.result, ...(selectedId === item.id ? styles.resultActive : {}) }}
            onClick={() => onSelect && onSelect(item)}
          >
            <div style={styles.resultHeader}>
              <span style={styles.resultTitle}>{highlight(item.title, query)}</span>
              {item.score !== undefined && (
                <span style={styles.resultScore}>score: {item.score.toFixed(2)}</span>
              )}
            </div>
            {item.summary && (
              <div style={styles.resultSnippet}>{highlight(item.summary, query)}</div>
            )}
            {(item.tags || []).length > 0 && (
              <div style={styles.tags}>
                {item.tags.map(t => (
                  <span key={t} style={styles.tag}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
