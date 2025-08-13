import { useState, useEffect, useCallback } from 'react';
import { firebaseTeamService } from '../services/firebaseTeamService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseTeams = () => {
  const { firestore, isConfigured } = useFirebase();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Carrega todos os times
  const loadTeams = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Carrega dados do localStorage ou usa dados de exemplo
        const localTeams = localStorage.getItem('teams');
        if (localTeams) {
          setTeams(JSON.parse(localTeams));
        } else {
          // Dados de exemplo para times
          const exampleTeams = [
            {
              id: '1',
              name: 'Team Alpha',
              tag: 'ALPHA',
              game: 'League of Legends',
              region: 'BR',
              status: 'active',
              members: ['player1', 'player2', 'player3'],
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Team Beta',
              tag: 'BETA',
              game: 'Valorant',
              region: 'NA',
              status: 'active',
              members: ['player4', 'player5'],
              createdAt: new Date().toISOString()
            }
          ];
          setTeams(exampleTeams);
          localStorage.setItem('teams', JSON.stringify(exampleTeams));
        }
        return;
      }
      
      const teamsData = await firebaseTeamService.getAllTeams();
      setTeams(teamsData);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar times:', err);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, firestore]);

  // Adiciona um novo time
  const addTeam = useCallback(async (teamData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Salva no localStorage quando Firebase não está configurado
        const newTeam = {
          ...teamData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const currentTeams = JSON.parse(localStorage.getItem('teams') || '[]');
        const updatedTeams = [newTeam, ...currentTeams];
        localStorage.setItem('teams', JSON.stringify(updatedTeams));
        setTeams(updatedTeams);
        
        return newTeam;
      }
      
      const newTeam = await firebaseTeamService.addTeam(teamData);
      
      // Se não estiver usando tempo real, atualiza manualmente
      if (!realTimeEnabled) {
        setTeams(prev => [newTeam, ...prev]);
      }
      
      return newTeam;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao adicionar time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConfigured, firestore]);

  // Atualiza um time
  const updateTeam = useCallback(async (teamId, teamData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Atualiza no localStorage quando Firebase não está configurado
        const currentTeams = JSON.parse(localStorage.getItem('teams') || '[]');
        const updatedTeams = currentTeams.map(team => 
          team.id === teamId 
            ? { ...team, ...teamData, updatedAt: new Date().toISOString() }
            : team
        );
        localStorage.setItem('teams', JSON.stringify(updatedTeams));
        setTeams(updatedTeams);
        
        const updatedTeam = updatedTeams.find(team => team.id === teamId);
        return updatedTeam;
      }
      
      const updatedTeam = await firebaseTeamService.updateTeam(teamId, teamData);
      
      if (!realTimeEnabled) {
        setTeams(prev => prev.map(team => 
          team.id === teamId ? updatedTeam : team
        ));
      }
      
      return updatedTeam;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConfigured, firestore]);

  // Remove um time
  const deleteTeam = useCallback(async (teamId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Remove do localStorage quando Firebase não está configurado
        const currentTeams = JSON.parse(localStorage.getItem('teams') || '[]');
        const updatedTeams = currentTeams.filter(team => team.id !== teamId);
        localStorage.setItem('teams', JSON.stringify(updatedTeams));
        setTeams(updatedTeams);
        return;
      }
      
      await firebaseTeamService.deleteTeam(teamId);
      
      if (!realTimeEnabled) {
        setTeams(prev => prev.filter(team => team.id !== teamId));
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao remover time:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConfigured, firestore]);

  // Ativa/desativa listener em tempo real
  const toggleRealTime = useCallback((enabled) => {
    setRealTimeEnabled(enabled);
  }, []);

  // Listener em tempo real
  useEffect(() => {
    if (!realTimeEnabled || !isConfigured || !firestore) {
      return;
    }

    const unsubscribe = firebaseTeamService.onTeamsChange((teamsData) => {
      setTeams(teamsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [realTimeEnabled, isConfigured, firestore]);

  // Carrega dados iniciais
  useEffect(() => {
    if (!realTimeEnabled) {
      loadTeams();
    }
  }, [loadTeams, realTimeEnabled]);

  return {
    teams,
    loading,
    error,
    realTimeEnabled,
    loadTeams,
    addTeam,
    updateTeam,
    deleteTeam,
    toggleRealTime
  };
};

export const useFirebaseTeamFilters = () => {
  const [filters, setFilters] = useState({
    game: '',
    region: '',
    status: '',
    searchTerm: ''
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      game: '',
      region: '',
      status: '',
      searchTerm: ''
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
};