import { useState, useEffect, useCallback, useMemo } from 'react';
import { getFirebaseMatchService } from '../services/firebaseMatchService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseMatches = () => {
  const { firestore, isConfigured } = useFirebase();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Carrega todas as partidas
  const loadMatches = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para dados locais quando Firebase não está configurado
        const localMatches = localStorage.getItem('matches');
        if (localMatches) {
          setMatches(JSON.parse(localMatches));
        } else {
          // Dados de exemplo para partidas
          const exampleMatches = [
            {
              id: '1',
              tournamentId: 'example-1',
              tournamentName: 'Torneio Exemplo 1',
              team1: {
                id: '1',
                name: 'Team Alpha',
                tag: 'ALPHA',
                logo: null
              },
              team2: {
                id: '2', 
                name: 'Team Beta',
                tag: 'BETA',
                logo: null
              },
              scheduledDate: new Date().toISOString(),
              status: 'scheduled', // scheduled, live, finished, cancelled
              format: 'MD3', // MD1, MD3, MD5
              game: 'League of Legends',
              maps: [
                { name: 'Summoner\'s Rift', winner: null },
                { name: 'Summoner\'s Rift', winner: null },
                { name: 'Summoner\'s Rift', winner: null }
              ],
              result: {
                team1Score: 0,
                team2Score: 0,
                winner: null
              },
              isFeatured: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              tournamentId: 'example-1',
              tournamentName: 'Torneio Exemplo 1',
              team1: {
                id: '1',
                name: 'Team Alpha',
                tag: 'ALPHA',
                logo: null
              },
              team2: {
                id: '2',
                name: 'Team Beta',
                tag: 'BETA', 
                logo: null
              },
              scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'finished',
              format: 'MD5',
              game: 'Valorant',
              maps: [
                { name: 'Bind', winner: 'team1' },
                { name: 'Haven', winner: 'team2' },
                { name: 'Split', winner: 'team1' },
                { name: 'Ascent', winner: 'team1' },
                { name: 'Icebox', winner: null }
              ],
              result: {
                team1Score: 3,
                team2Score: 1,
                winner: 'team1'
              },
              isFeatured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          setMatches(exampleMatches);
          localStorage.setItem('matches', JSON.stringify(exampleMatches));
        }
        setLoading(false);
        return;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      let matchesData;
      
      if (filters.tournamentId) {
        matchesData = await matchService.getMatchesByTournament(filters.tournamentId);
      } else if (filters.status) {
        matchesData = await matchService.getMatchesByStatus(filters.status);
      } else {
        matchesData = await matchService.getAllMatches();
      }
      
      setMatches(matchesData);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar partidas:', err);
    } finally {
      setLoading(false);
    }
  }, [firestore, isConfigured]);

  // Criar nova partida
  const createMatch = useCallback(async (matchData) => {
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage
        const newMatch = {
          id: Date.now().toString(),
          ...matchData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const currentMatches = JSON.parse(localStorage.getItem('matches') || '[]');
        const updatedMatches = [newMatch, ...currentMatches];
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        setMatches(updatedMatches);
        return newMatch.id;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      const matchId = await matchService.createMatch(matchData);
      await loadMatches();
      return matchId;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao criar partida:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches]);

  // Atualizar partida
  const updateMatch = useCallback(async (matchId, updateData) => {
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage
        const currentMatches = JSON.parse(localStorage.getItem('matches') || '[]');
        const updatedMatches = currentMatches.map(match => 
          match.id === matchId 
            ? { ...match, ...updateData, updatedAt: new Date().toISOString() }
            : match
        );
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        setMatches(updatedMatches);
        return true;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      await matchService.updateMatch(matchId, updateData);
      await loadMatches();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar partida:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches]);

  // Deletar partida
  const deleteMatch = useCallback(async (matchId) => {
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage
        const currentMatches = JSON.parse(localStorage.getItem('matches') || '[]');
        const updatedMatches = currentMatches.filter(match => match.id !== matchId);
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        setMatches(updatedMatches);
        return true;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      await matchService.deleteMatch(matchId);
      await loadMatches();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao deletar partida:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches]);

  // Atualizar resultado da partida
  const updateMatchResult = useCallback(async (matchId, result) => {
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage
        const currentMatches = JSON.parse(localStorage.getItem('matches') || '[]');
        const updatedMatches = currentMatches.map(match => 
          match.id === matchId 
            ? { 
                ...match, 
                result, 
                updatedAt: new Date().toISOString() 
              }
            : match
        );
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        setMatches(updatedMatches);
        return true;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      await matchService.updateMatchResult(matchId, result);
      await loadMatches();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar resultado:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches]);

  // Toggle destaque da partida
  const toggleMatchFeatured = useCallback(async (matchId, isFeatured) => {
    setError(null);
    
    try {
      if (!isConfigured || !firestore) {
        // Fallback para localStorage
        const currentMatches = JSON.parse(localStorage.getItem('matches') || '[]');
        const updatedMatches = currentMatches.map(match => 
          match.id === matchId 
            ? { ...match, isFeatured, updatedAt: new Date().toISOString() }
            : match
        );
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        setMatches(updatedMatches);
        return true;
      }
      
      const matchService = getFirebaseMatchService(firestore);
      await matchService.toggleMatchFeatured(matchId, isFeatured);
      await loadMatches();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar destaque:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches]);

  // Ativar/desativar tempo real
  const toggleRealTime = useCallback((enabled) => {
    setRealTimeEnabled(enabled);
    
    if (enabled && isConfigured && firestore) {
      const matchService = getFirebaseMatchService(firestore);
      return matchService.subscribeToMatches((matchesData) => {
        setMatches(matchesData);
      });
    }
  }, [firestore, isConfigured]);

  // Carregar partidas na inicialização
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Estatísticas das partidas
  const statistics = useMemo(() => {
    const total = matches.length;
    const scheduled = matches.filter(m => m.status === 'scheduled').length;
    const live = matches.filter(m => m.status === 'live').length;
    const finished = matches.filter(m => m.status === 'finished').length;
    const featured = matches.filter(m => m.isFeatured).length;
    
    return {
      total,
      scheduled,
      live,
      finished,
      featured
    };
  }, [matches]);

  return {
    matches,
    loading,
    error,
    statistics,
    realTimeEnabled,
    loadMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    updateMatchResult,
    toggleMatchFeatured,
    toggleRealTime
  };
};

export default useFirebaseMatches;