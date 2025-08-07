import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { firebaseTeamService } from '../services/firebaseTeamService';

const useFirebaseTeamStatistics = () => {
  const { db } = useFirebase();
  const [statistics, setStatistics] = useState({
    teams: {
      total: 0,
      byGame: {},
      byRegion: {},
      byStatus: {},
      recent: []
    },
    tournaments: {
      total: 0,
      byGame: {},
      byStatus: {},
      byFormat: {},
      upcoming: []
    },
    summary: {
      totalTeams: 0,
      totalTournaments: 0,
      activeTournaments: 0,
      upcomingTournaments: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Inicializar o serviço
  useEffect(() => {
    if (db) {
      firebaseTeamService.initialize(db);
    }
  }, [db]);

  // Carregar estatísticas
  const loadStatistics = useCallback(async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const stats = await firebaseTeamService.getCombinedStatistics();
      setStatistics(stats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Carregar estatísticas iniciais
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Atualizar estatísticas automaticamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadStatistics();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [loadStatistics]);

  // Buscar estatísticas específicas de equipes
  const getTeamStatistics = useCallback(async () => {
    try {
      setError(null);
      const teamStats = await firebaseTeamService.getTeamStatistics();
      return teamStats;
    } catch (err) {
      console.error('Erro ao buscar estatísticas de equipes:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Buscar estatísticas específicas de torneios
  const getTournamentStatistics = useCallback(async () => {
    try {
      setError(null);
      const tournamentStats = await firebaseTeamService.getTournamentStatistics();
      return tournamentStats;
    } catch (err) {
      console.error('Erro ao buscar estatísticas de torneios:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Forçar atualização das estatísticas
  const refreshStatistics = useCallback(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Verificar se as estatísticas estão desatualizadas (mais de 10 minutos)
  const isStale = useCallback(() => {
    if (!lastUpdated) return true;
    const now = new Date();
    const diffMinutes = (now - lastUpdated) / (1000 * 60);
    return diffMinutes > 10;
  }, [lastUpdated]);

  // Obter resumo das estatísticas principais
  const getSummary = useCallback(() => {
    return {
      totalTeams: statistics.summary.totalTeams,
      totalTournaments: statistics.summary.totalTournaments,
      activeTournaments: statistics.summary.activeTournaments,
      upcomingTournaments: statistics.summary.upcomingTournaments,
      topGames: {
        teams: Object.entries(statistics.teams.byGame)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        tournaments: Object.entries(statistics.tournaments.byGame)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      },
      recentTeams: statistics.teams.recent.slice(0, 5),
      upcomingTournaments: statistics.tournaments.upcoming.slice(0, 5)
    };
  }, [statistics]);

  // Obter estatísticas por período (se implementado no futuro)
  const getStatisticsByPeriod = useCallback(async (period = '30d') => {
    // Placeholder para implementação futura
    // Poderia filtrar por data de criação
    try {
      setError(null);
      // Por enquanto, retorna as estatísticas atuais
      return statistics;
    } catch (err) {
      console.error('Erro ao buscar estatísticas por período:', err);
      setError(err.message);
      throw err;
    }
  }, [statistics]);

  return {
    statistics,
    loading,
    error,
    lastUpdated,
    loadStatistics,
    getTeamStatistics,
    getTournamentStatistics,
    refreshStatistics,
    isStale: isStale(),
    summary: getSummary(),
    getStatisticsByPeriod
  };
};

export default useFirebaseTeamStatistics;