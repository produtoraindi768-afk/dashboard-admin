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
    setLoading(true);
    setError(null);
    
    try {
      // Se Firebase não estiver configurado, usa dados locais
      if (!isConfigured || !firestore) {
        const localData = localStorage.getItem('streamers_data');
        if (localData) {
          const parsedData = JSON.parse(localData);
          setStreamers(parsedData);
        } else {
          // Dados de exemplo se não houver dados locais
          const exampleData = [
            {
              id: '1',
              name: 'Exemplo Streamer 1',
              platform: 'twitch',
              streamUrl: 'https://twitch.tv/exemplo1',
              avatarUrl: '',
              category: 'games',
              isOnline: true,
              isFeatured: true,
              viewers: 1250,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Exemplo Streamer 2',
              platform: 'youtube',
              streamUrl: 'https://youtube.com/@exemplo2',
              avatarUrl: '',
              category: 'music',
              isOnline: false,
              isFeatured: false,
              viewers: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          setStreamers(exampleData);
        }
        setLoading(false);
        return;
      }
      
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
  const { isConfigured } = useFirebase();
  const [statistics, setStatistics] = useState({
    total: 0,
    online: 0,
    offline: 0,
    platforms: {},
    categories: {},
    totalViewers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Se Firebase não estiver configurado, calcula estatísticas dos dados locais
      if (!isConfigured) {
        const localData = localStorage.getItem('streamers_data');
        if (localData) {
          const streamers = JSON.parse(localData);
          const stats = {
            total: streamers.length,
            online: streamers.filter(s => s.isOnline).length,
            offline: streamers.filter(s => !s.isOnline).length,
            platforms: {},
            categories: {},
            totalViewers: streamers.reduce((sum, s) => sum + (s.viewers || 0), 0)
          };
          
          // Calcula estatísticas por plataforma
          streamers.forEach(s => {
            stats.platforms[s.platform] = (stats.platforms[s.platform] || 0) + 1;
            stats.categories[s.category] = (stats.categories[s.category] || 0) + 1;
          });
          
          setStatistics(stats);
        } else {
          // Estatísticas de exemplo
          setStatistics({
            total: 2,
            online: 1,
            offline: 1,
            platforms: { twitch: 1, youtube: 1 },
            categories: { games: 1, music: 1 },
            totalViewers: 1250
          });
        }
        setLoading(false);
        return;
      }
      
      const response = await firebaseStreamerAPI.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

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