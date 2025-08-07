import { useState, useEffect, useCallback } from 'react';
import { streamerService, streamerAPI } from '../services/streamerService';

export const useStreamers = () => {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carrega todos os streamers
  const loadStreamers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await streamerAPI.getStreamers(filters);
      setStreamers(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar streamers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Adiciona um novo streamer
  const addStreamer = useCallback(async (streamerData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await streamerAPI.createStreamer(streamerData);
      setStreamers(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao adicionar streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um streamer existente
  const updateStreamer = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await streamerAPI.updateStreamer(id, updates);
      setStreamers(prev => 
        prev.map(streamer => 
          streamer.id === id ? response.data : streamer
        )
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove um streamer
  const deleteStreamer = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await streamerAPI.deleteStreamer(id);
      setStreamers(prev => prev.filter(streamer => streamer.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Erro ao remover streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza o status de um streamer
  const updateStreamerStatus = useCallback(async (id, isOnline) => {
    try {
      await updateStreamer(id, { isOnline });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      throw err;
    }
  }, [updateStreamer]);

  // Carrega streamers na inicialização
  useEffect(() => {
    loadStreamers();
  }, [loadStreamers]);

  return {
    streamers,
    loading,
    error,
    loadStreamers,
    addStreamer,
    updateStreamer,
    deleteStreamer,
    updateStreamerStatus,
    // Funções de utilidade
    refreshStreamers: () => loadStreamers(),
    clearError: () => setError(null)
  };
};

export const useStreamerStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await streamerAPI.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStatistics: loadStatistics
  };
};

// Hook para filtros de streamers
export const useStreamerFilters = () => {
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'online', 'offline'
    platform: '',
    category: '',
    search: ''
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      platform: '',
      category: '',
      search: ''
    });
  }, []);

  const hasActiveFilters = useCallback(() => {
    return filters.status !== 'all' || 
           filters.platform !== '' || 
           filters.category !== '' || 
           filters.search !== '';
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters()
  };
};

