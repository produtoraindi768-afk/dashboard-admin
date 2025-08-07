import { useState, useEffect, useCallback } from 'react';
import { firebaseTeamService } from '../services/firebaseTeamService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseTournaments = () => {
  const { firestore, isConfigured } = useFirebase();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Carrega todos os torneios
  const loadTournaments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para dados locais quando Firebase não está configurado
        const localTournaments = localStorage.getItem('tournaments');
        if (localTournaments) {
          setTournaments(JSON.parse(localTournaments));
        } else {
          // Dados de exemplo se não houver dados locais
          const exampleTournaments = [
            {
              id: 'example-1',
              name: 'Torneio Exemplo 1',
              game: 'League of Legends',
              format: '5v5',
              status: 'Ativo',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              maxTeams: 16,
              registeredTeams: 8,
              prizePool: 'R$ 5.000',
              description: 'Torneio de exemplo para demonstração'
            }
          ];
          setTournaments(exampleTournaments);
        }
        setLoading(false);
        return;
      }
      
      const tournamentsData = await firebaseTeamService.getAllTournaments();
      setTournaments(tournamentsData);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar torneios:', err);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, firestore]);

  // Adiciona um novo torneio
  const addTournament = useCallback(async (tournamentData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage quando Firebase não está configurado
        const newTournament = {
          ...tournamentData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        const currentTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const updatedTournaments = [newTournament, ...currentTournaments];
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
        
        setTournaments(updatedTournaments);
        return newTournament;
      }
      
      const newTournament = await firebaseTeamService.addTournament(tournamentData);
      
      // Se não estiver usando tempo real, atualiza manualmente
      if (!realTimeEnabled) {
        setTournaments(prev => [newTournament, ...prev]);
      }
      
      return newTournament;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao adicionar torneio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConfigured, firestore]);

  // Atualiza um torneio
  const updateTournament = useCallback(async (tournamentId, tournamentData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage quando Firebase não está configurado
        const currentTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const updatedTournaments = currentTournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, ...tournamentData, updatedAt: new Date().toISOString() }
            : tournament
        );
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
        
        setTournaments(updatedTournaments);
        const updatedTournament = updatedTournaments.find(t => t.id === tournamentId);
        return updatedTournament;
      }
      
      const updatedTournament = await firebaseTeamService.updateTournament(tournamentId, tournamentData);
      
      if (!realTimeEnabled) {
        setTournaments(prev => prev.map(tournament => 
          tournament.id === tournamentId ? updatedTournament : tournament
        ));
      }
      
      return updatedTournament;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar torneio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realTimeEnabled, isConfigured, firestore]);

  // Remove um torneio
  const deleteTournament = useCallback(async (tournamentId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage quando Firebase não está configurado
        const currentTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const updatedTournaments = currentTournaments.filter(tournament => tournament.id !== tournamentId);
        localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
        
        setTournaments(updatedTournaments);
        return;
      }
      
      await firebaseTeamService.deleteTournament(tournamentId);
      
      if (!realTimeEnabled) {
        setTournaments(prev => prev.filter(tournament => tournament.id !== tournamentId));
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao remover torneio:', err);
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

    const unsubscribe = firebaseTeamService.onTournamentsChange((tournamentsData) => {
      setTournaments(tournamentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [realTimeEnabled, isConfigured, firestore]);

  // Carrega dados iniciais
  useEffect(() => {
    if (!realTimeEnabled) {
      loadTournaments();
    }
  }, [loadTournaments, realTimeEnabled]);

  return {
    tournaments,
    loading,
    error,
    realTimeEnabled,
    loadTournaments,
    addTournament,
    updateTournament,
    deleteTournament,
    toggleRealTime
  };
};

export const useFirebaseTournamentFilters = () => {
  const [filters, setFilters] = useState({
    game: '',
    format: '',
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
      format: '',
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