import { useState, useEffect, useCallback } from 'react';
import { firebaseStreamerService, firebaseStreamerAPI } from '../services/firebaseStreamerService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseStreamers = () => {
  const { firestore, isConfigured } = useFirebase();
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Carrega todos os streamers
  const loadStreamers = useCallback(async (filters = {}) => {
    if (!isConfigured || !firestore) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await firebaseStreamerAPI.getStreamers(filters);
      setStreamers(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar streamers:', err);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, firestore]);

  // Adiciona um novo streamer
  const addStreamer = useCallback(async (streamerData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await firebaseStreamerAPI.createStreamer(streamerData);
      
      // Se não estiver usando tempo real, atualiza manualmente
      if (!realTimeEnabled) {
        setStreamers(prev => [response.data, ...prev]);
      }
      
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao adicionar streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled]);

  // Atualiza um streamer existente
  const updateStreamer = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await firebaseStreamerAPI.updateStreamer(id, updates);
      
      // Se não estiver usando tempo real, atualiza manualmente
      if (!realTimeEnabled) {
        setStreamers(prev => 
          prev.map(streamer => 
            streamer.id === id ? response.data : streamer
          )
        );
      }
      
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled]);

  // Remove um streamer
  const deleteStreamer = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await firebaseStreamerAPI.deleteStreamer(id);
      
      // Se não estiver usando tempo real, atualiza manualmente
      if (!realTimeEnabled) {
        setStreamers(prev => prev.filter(streamer => streamer.id !== id));
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao remover streamer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled]);

  // Atualiza o status de um streamer
  const updateStreamerStatus = useCallback(async (id, isOnline) => {
    try {
      await updateStreamer(id, { isOnline });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      throw err;
    }
  }, [updateStreamer]);

  // Habilita/desabilita atualizações em tempo real
  const toggleRealTime = useCallback((enabled) => {
    setRealTimeEnabled(enabled);
  }, []);

  // Configura listener em tempo real
  useEffect(() => {
    let unsubscribe;
    
    if (realTimeEnabled && isConfigured) {
      setLoading(true);
      
      unsubscribe = firebaseStreamerService.onStreamersChange((newStreamers) => {
        setStreamers(newStreamers);
        setLoading(false);
      });
    } else if (isConfigured) {
      // Carrega dados uma vez se tempo real estiver desabilitado
      loadStreamers();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [realTimeEnabled, loadStreamers, isConfigured]);

  return {
    streamers,
    loading,
    error,
    realTimeEnabled,
    loadStreamers,
    addStreamer,
    updateStreamer,
    deleteStreamer,
    updateStreamerStatus,
    toggleRealTime,
    // Funções de utilidade
    refreshStreamers: () => loadStreamers(),
    clearError: () => setError(null)
  };
};

export const useFirebaseStreamerStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await firebaseStreamerAPI.getStatistics();
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

// Hook para filtros de streamers (mesmo do original)
export const useFirebaseStreamerFilters = () => {
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

// Hook para migração de dados do localStorage para Firebase
export const useDataMigration = () => {
  const { firestore, isConfigured } = useFirebase();
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState(null);
  const [migrationSuccess, setMigrationSuccess] = useState(false);

  const migrateFromLocalStorage = useCallback(async () => {
    if (!isConfigured || !firestore) {
      setMigrationError('Firebase não configurado');
      return;
    }
    
    setMigrating(true);
    setMigrationError(null);
    setMigrationSuccess(false);
    
    try {
      // Obtém dados do localStorage
      const localData = localStorage.getItem('streamers_data');
      
      if (!localData) {
        throw new Error('Nenhum dado encontrado no localStorage');
      }
      
      const streamers = JSON.parse(localData);
      
      if (!Array.isArray(streamers) || streamers.length === 0) {
        throw new Error('Dados inválidos ou vazios no localStorage');
      }
      
      // Migra cada streamer para o Firebase
      const migrationPromises = streamers.map(async (streamer) => {
        const { id, ...streamerData } = streamer;
        return await firebaseStreamerService.addStreamer(streamerData);
      });
      
      await Promise.all(migrationPromises);
      
      setMigrationSuccess(true);
      
      // Opcionalmente, limpa o localStorage após migração bem-sucedida
      // localStorage.removeItem('streamers_data');
      
    } catch (err) {
      setMigrationError(err.message);
      console.error('Erro na migração:', err);
    } finally {
      setMigrating(false);
    }
  }, [isConfigured, firestore]);

  const clearMigrationStatus = useCallback(() => {
    setMigrationError(null);
    setMigrationSuccess(false);
  }, []);

  return {
    migrating,
    migrationError,
    migrationSuccess,
    migrateFromLocalStorage,
    clearMigrationStatus
  };
};