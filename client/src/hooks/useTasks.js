import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTask = useCallback(async (taskData) => {
    const { data } = await axios.post('/api/tasks', taskData);
    setTasks(prev => [data, ...prev]);
    return data;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    const { data } = await axios.put(`/api/tasks/${id}`, updates);
    setTasks(prev => prev.map(t => t.id === id ? data : t));
    return data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await axios.delete(`/api/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const completeTask = useCallback(async (id, effort) => {
    const { data } = await axios.post(`/api/tasks/${id}/done`, { effort });
    setTasks(prev => prev.map(t => t.id === id ? data : t));
    return data;
  }, []);

  const toggleSubtask = useCallback(async (taskId, index, done) => {
    const { data } = await axios.put(`/api/tasks/${taskId}/subtask/${index}`, { done });
    setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    return data;
  }, []);

  const addSubtask = useCallback(async (taskId, title) => {
    const { data } = await axios.post(`/api/tasks/${taskId}/subtask`, { title });
    setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    return data;
  }, []);

  const tagEffort = useCallback(async (taskId, effort) => {
    const { data } = await axios.post(`/api/tasks/${taskId}/effort`, { effort });
    setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    return data;
  }, []);

  return {
    tasks,
    loading,
    error,
    reload: load,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    toggleSubtask,
    addSubtask,
    tagEffort
  };
}
