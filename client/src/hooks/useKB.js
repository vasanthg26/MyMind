import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useKB() {
  const [items, setItems] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const itemsRes = await axios.get('/api/kb');
      setItems(itemsRes.data);
    } catch (err) {
      setError(err.message);
    }
    try {
      const clustersRes = await axios.get('/api/kb/clusters');
      setClusters(clustersRes.data);
    } catch {
      // clusters are non-critical; items already loaded
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const createItem = useCallback(async (itemData) => {
    const { data } = await axios.post('/api/kb', itemData);
    setItems(prev => [data, ...prev]);
    return data;
  }, []);

  const updateItem = useCallback(async (id, updates) => {
    const { data } = await axios.put(`/api/kb/${id}`, updates);
    setItems(prev => prev.map(i => i.id === id ? data : i));
    return data;
  }, []);

  const deleteItem = useCallback(async (id) => {
    await axios.delete(`/api/kb/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const searchItems = useCallback(async (query) => {
    if (!query.trim()) return items;
    const { data } = await axios.get(`/api/kb/search?q=${encodeURIComponent(query)}`);
    return data;
  }, [items]);

  const fetchUrl = useCallback(async (url, cluster) => {
    const { data } = await axios.post('/api/kb/fetch-url', { url, cluster });
    if (data.item) {
      setItems(prev => [data.item, ...prev]);
      await loadItems(); // refresh clusters
    }
    return data;
  }, [loadItems]);

  const getLinkedTasks = useCallback(async (kbId) => {
    const { data } = await axios.get(`/api/kb/${kbId}/tasks`);
    return data;
  }, []);

  return {
    items,
    clusters,
    loading,
    error,
    reload: loadItems,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    fetchUrl,
    getLinkedTasks
  };
}
