import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { getFirebaseMatchService } from '../services/firebaseMatchService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseMatches = () => {
  const { firestore, isConfigured } = useFirebase();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Função para mapear status do banco para status da aplicação
  const mapStatus = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
      case 'scheduled':
      case 'pending':
        return 'scheduled';
      case 'live':
      case 'ongoing':
        return 'ongoing';
      case 'finished':
      case 'completed':
      case 'complete':
        return 'finished';
      default:
        return 'scheduled';
    }
  }, []);

  // Mapear dados das partidas seed (coleção 'matches')
  const mapSeedMatches = useCallback((docs) => {
    return docs.map((d) => {
      const raw = d.data();
      const team1Raw = raw.team1 || {};
      const team2Raw = raw.team2 || {};
      
      const team1 = {
        id: raw.team1Id || team1Raw.id,
        name: team1Raw.name || '',
        logo: team1Raw.logo || team1Raw.avatar || null,
        avatar: team1Raw.avatar || team1Raw.logo || null,
      };
      
      const team2 = {
        id: raw.team2Id || team2Raw.id,
        name: team2Raw.name || '',
        logo: team2Raw.logo || team2Raw.avatar || null,
        avatar: team2Raw.avatar || team2Raw.logo || null,
      };

      // Mapear resultado
      const resultRaw = raw.result || {};
      const result = {
        team1Score: resultRaw.team1Score || 0,
        team2Score: resultRaw.team2Score || 0,
        winner: resultRaw.winner || null,
      };

      // Mapear resultMD3
      const resultMD3Raw = raw.resultMD3 || {};
      const resultMD3 = {
        team1Score: resultMD3Raw.team1Score || 0,
        team2Score: resultMD3Raw.team2Score || 0,
        winner: resultMD3Raw.winner || null,
      };

      // Mapear resultMD5
      const resultMD5Raw = raw.resultMD5 || {};
      const resultMD5 = {
        team1Score: resultMD5Raw.team1Score || 0,
        team2Score: resultMD5Raw.team2Score || 0,
        winner: resultMD5Raw.winner || null,
      };
      
      return {
        id: d.id,
        source: 'seed',
        tournamentName: raw.tournamentName,
        scheduledDate: raw.scheduledDate,
        format: raw.format,
        game: raw.game,
        isFeatured: Boolean(raw.isFeatured),
        team1,
        team2,
        status: mapStatus(raw.status),
        result,
        resultMD3,
        resultMD5,
      };
    });
  }, [mapStatus]);

  // Mapear dados das partidas do Battlefy (coleção 'battlefy_matches')
  const mapBattlefyMatches = useCallback((docs, teamsMap, tournamentsMap) => {
    return docs.map((d) => {
      const raw = d.data();
      
      // Extrair dados do rawData se disponível
      let rawDataParsed = {};
      if (typeof raw.rawData === 'object' && raw.rawData !== null) {
        rawDataParsed = raw.rawData;
      } else if (typeof raw.rawData === 'string') {
        try {
          rawDataParsed = JSON.parse(raw.rawData);
        } catch {
          rawDataParsed = {};
        }
      }
      
      // Extrair informações dos times do rawData (top/bottom)
      const topTeam = rawDataParsed.top || {};
      const bottomTeam = rawDataParsed.bottom || {};
      
      // Buscar dados dos times usando teamID do rawData
      const topTeamId = topTeam.teamID;
      const bottomTeamId = bottomTeam.teamID;
      
      const topTeamData = topTeamId && teamsMap ? teamsMap.get(topTeamId) : null;
      const bottomTeamData = bottomTeamId && teamsMap ? teamsMap.get(bottomTeamId) : null;
      
      // Verificar se é uma partida bye (sem oponente)
      const isBye = rawDataParsed.isBye === true || 
                    (topTeam.isBye === true || bottomTeam.isBye === true) ||
                    (!topTeamId && !bottomTeamId) ||
                    (topTeamId && !bottomTeamId) ||
                    (!topTeamId && bottomTeamId);
      
      // Se não encontrar pelos teamIDs, tentar buscar times do mesmo torneio
      let fallbackTeam1Data = null;
      let fallbackTeam2Data = null;
      
      if (!topTeamData && !bottomTeamData && teamsMap && teamsMap.size >= 2 && !isBye) {
        const tournamentTeams = Array.from(teamsMap.values()).filter(
          team => team.tournamentId === raw.tournamentId
        );
        
        if (tournamentTeams.length >= 2) {
          const matchIndex = raw.matchNumber || 0;
          fallbackTeam1Data = tournamentTeams[matchIndex % tournamentTeams.length];
          fallbackTeam2Data = tournamentTeams[(matchIndex + 1) % tournamentTeams.length];
        }
      }
      
      // Para partidas bye, configurar apenas o time presente
      const team1 = {
        id: topTeamId || fallbackTeam1Data?.battlefyId,
        name: topTeamData?.name || fallbackTeam1Data?.name || (isBye ? 'Time Classificado' : 'Time 1'),
        logo: (() => {
          // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
          if (topTeamData?.logoUrl && topTeamData?.tournamentId === raw.tournamentId) {
            return topTeamData.logoUrl;
          }
          // Fallback para outros campos
          return topTeamData?.logo || fallbackTeam1Data?.logoUrl || fallbackTeam1Data?.logo || null;
        })(),
        avatar: (() => {
          // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
          if (topTeamData?.logoUrl && topTeamData?.tournamentId === raw.tournamentId) {
            return topTeamData.logoUrl;
          }
          // Fallback para outros campos
          return topTeamData?.avatar || fallbackTeam1Data?.logoUrl || fallbackTeam1Data?.avatar || null;
        })(),
      };
      
      const team2 = isBye ? undefined : {
        id: bottomTeamId || fallbackTeam2Data?.battlefyId,
        name: bottomTeamData?.name || fallbackTeam2Data?.name || 'Time 2',
        logo: (() => {
          // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
          if (bottomTeamData?.logoUrl && bottomTeamData?.tournamentId === raw.tournamentId) {
            return bottomTeamData.logoUrl;
          }
          // Fallback para outros campos
          return bottomTeamData?.logo || fallbackTeam2Data?.logoUrl || fallbackTeam2Data?.logo || null;
        })(),
        avatar: (() => {
          // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
          if (bottomTeamData?.logoUrl && bottomTeamData?.tournamentId === raw.tournamentId) {
            return bottomTeamData.logoUrl;
          }
          // Fallback para outros campos
          return bottomTeamData?.avatar || fallbackTeam2Data?.logoUrl || fallbackTeam2Data?.avatar || null;
        })(),
      };

      // Extrair resultados do rawData com melhor tratamento
      const rawResults = rawDataParsed.results || {};
      
      // Para partidas bye, configurar automaticamente como vitória do time presente
      let winner = null;
      let team1Score = 0;
      let team2Score = 0;
      let finalScore = null;
      let duration = null;
      
      if (isBye) {
        // Partida bye: time presente ganha automaticamente
        winner = 'team1';
        team1Score = 1;
        team2Score = 0;
        finalScore = '1-0';
      } else {
        // Extrair scores dos times do top/bottom do rawData
        team1Score = parseInt(topTeam.score) || 0;
        team2Score = parseInt(bottomTeam.score) || 0;
        
        // Determinar vencedor baseado no campo winner dos times
        if (topTeam.winner === true) {
          winner = 'team1';
        } else if (bottomTeam.winner === true) {
          winner = 'team2';
        } else if (team1Score > team2Score) {
          winner = 'team1';
        } else if (team2Score > team1Score) {
          winner = 'team2';
        }
        
        // Construir finalScore se houver scores
        if (team1Score > 0 || team2Score > 0) {
          finalScore = `${team1Score}-${team2Score}`;
        }
        
        // Extrair duração se disponível no rawData
        if (rawDataParsed.duration) {
          duration = rawDataParsed.duration;
        } else if (rawDataParsed.completedAt && rawDataParsed.startedAt) {
          // Calcular duração se temos início e fim
          const startTime = new Date(rawDataParsed.startedAt);
          const endTime = new Date(rawDataParsed.completedAt);
          const durationMs = endTime - startTime;
          if (durationMs > 0) {
            const minutes = Math.floor(durationMs / 60000);
            duration = `${minutes}m`;
          }
        }
      }
      
      const result = {
        team1Score,
        team2Score,
        winner,
        finalScore,
        duration,
      };
      
      return {
        id: d.id,
        source: 'battlefy',
        battlefyId: raw.battlefyId,
        tournamentName: (() => {
          // Primeiro tenta usar o tournamentName do documento
          if (raw.tournamentName && raw.tournamentName !== 'Torneio Battlefy') {
            return raw.tournamentName;
          }
          // Se não, busca na coleção battlefy_config usando tournamentId
          if (raw.tournamentId && tournamentsMap) {
            const tournamentConfig = tournamentsMap.get(raw.tournamentId);
            if (tournamentConfig?.tournamentName) {
              return tournamentConfig.tournamentName;
            }
          }
          // Fallback padrão
          return 'Torneio Battlefy';
        })(),
        scheduledDate: rawDataParsed.scheduledTime || raw.scheduledTime,
        completedAt: rawDataParsed.completedAt,
        format: 'Battlefy',
        game: 'League of Legends', // Padrão para Battlefy
        isFeatured: false, // Battlefy matches não são featured por padrão
        team1,
        team2,
        status: (() => {
          if (isBye) return 'finished';
          if (rawDataParsed.isComplete === true) return 'finished';
          return mapStatus(rawDataParsed.state || raw.state);
        })(),
        result: (winner !== null || isBye) ? result : undefined,
        round: rawDataParsed.roundNumber || raw.round,
        matchNumber: rawDataParsed.matchNumber || raw.matchNumber,
        duration: (() => {
          if (isBye) return 'Bye';
          if (rawDataParsed.completedAt && rawDataParsed.createdAt) {
            const completed = new Date(rawDataParsed.completedAt);
            const created = new Date(rawDataParsed.createdAt);
            const diffMs = completed.getTime() - created.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            return `${diffMins}min`;
          }
          return rawResults.duration;
        })(),
        finalScore: (() => {
          if (isBye) return '1-0 (Bye)';
          if (team1Score > 0 || team2Score > 0) {
            return `${team1Score}-${team2Score}`;
          }
          return rawResults.finalScore;
        })(),
        isBye,
        matchType: rawDataParsed.matchType || topTeam.matchType || bottomTeam.matchType,
      };
    });
  }, [mapStatus]);

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
              source: 'seed',
              tournamentName: 'Torneio Exemplo 1',
              team1: {
                id: '1',
                name: 'Team Alpha',
                logo: null,
                avatar: null
              },
              team2: {
                id: '2', 
                name: 'Team Beta',
                logo: null,
                avatar: null
              },
              scheduledDate: new Date().toISOString(),
              status: 'scheduled',
              format: 'MD3',
              game: 'League of Legends',
              result: {
                team1Score: 0,
                team2Score: 0,
                winner: null
              },
              isFeatured: true
            },
            {
              id: '2',
              source: 'seed',
              tournamentName: 'Torneio Exemplo 1',
              team1: {
                id: '1',
                name: 'Team Alpha',
                logo: null,
                avatar: null
              },
              team2: {
                id: '2',
                name: 'Team Beta',
                logo: null,
                avatar: null
              },
              scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'finished',
              format: 'MD5',
              game: 'Valorant',
              result: {
                team1Score: 3,
                team2Score: 1,
                winner: 'team1'
              },
              isFeatured: false
            }
          ];
          setMatches(exampleMatches);
          localStorage.setItem('matches', JSON.stringify(exampleMatches));
        }
        setLoading(false);
        return;
      }
      
      // Buscar partidas seed (coleção 'matches')
      const seedQuery = query(collection(firestore, 'matches'));
      const seedSnap = await getDocs(seedQuery);
      const seedMatches = mapSeedMatches(seedSnap.docs);

      // Buscar partidas do Battlefy (coleção 'battlefy_matches')
      let battlefyMatches = [];
      try {
        const battlefyQuery = query(collection(firestore, 'battlefy_matches'));
        const battlefySnap = await getDocs(battlefyQuery);
        
        // Buscar times Battlefy (coleção 'battlefy_teams')
        const teamsQuery = query(collection(firestore, 'battlefy_teams'));
        const teamsSnap = await getDocs(teamsQuery);
        const teamsMap = new Map();
        teamsSnap.docs.forEach(doc => {
          const teamData = doc.data();
          if (teamData.battlefyId) {
            // Extrair logoUrl do rawData se disponível
            let logoUrl = null;
            if (teamData.rawData && typeof teamData.rawData === 'object') {
              // Priorizar rawData.persistentTeam.logoUrl (estrutura real do Battlefy)
              if (teamData.rawData.persistentTeam && teamData.rawData.persistentTeam.logoUrl) {
                logoUrl = teamData.rawData.persistentTeam.logoUrl;
              } else {
                // Fallback para outras possíveis estruturas
                logoUrl = teamData.rawData.logoUrl || teamData.rawData.logo;
              }
            }
            
            teamsMap.set(teamData.battlefyId, {
              ...teamData,
              logoUrl: logoUrl
            });
          }
        });
        
        // Buscar configurações de torneios Battlefy (coleção 'battlefy_config')
        const tournamentsQuery = query(collection(firestore, 'battlefy_config'));
        const tournamentsSnap = await getDocs(tournamentsQuery);
        const tournamentsMap = new Map();
        tournamentsSnap.docs.forEach(doc => {
          const tournamentData = doc.data();
          if (tournamentData.tournamentId) {
            tournamentsMap.set(tournamentData.tournamentId, tournamentData);
          }
        });
        
        battlefyMatches = mapBattlefyMatches(battlefySnap.docs, teamsMap, tournamentsMap);
      } catch (battlefyError) {
        console.warn('Erro ao carregar partidas do Battlefy (coleção pode não existir):', battlefyError);
        // Continua sem as partidas do Battlefy se a coleção não existir
      }
      
      // Combinar ambas as fontes
      const allMatches = [...seedMatches, ...battlefyMatches];
      
      // Aplicar filtros se fornecidos
      let filteredMatches = allMatches;
      if (filters.tournamentId) {
        filteredMatches = allMatches.filter(match => 
          match.tournamentId === filters.tournamentId || 
          match.tournamentName?.includes(filters.tournamentId)
        );
      }
      if (filters.status) {
        filteredMatches = filteredMatches.filter(match => match.status === filters.status);
      }
      
      // Ordenar por data no cliente - separar partidas finalizadas das agendadas
      const sortedData = filteredMatches.sort((a, b) => {
        // Primeiro critério: partidas finalizadas (com completedAt) vêm primeiro
        const aIsFinished = a.status === 'finished' && a.completedAt;
        const bIsFinished = b.status === 'finished' && b.completedAt;
        
        if (aIsFinished && !bIsFinished) return -1;
        if (!aIsFinished && bIsFinished) return 1;
        
        // Segundo critério: ordenar por data (completedAt para finalizadas, scheduledDate para outras)
        const dateA = a.completedAt || a.scheduledDate || '';
        const dateB = b.completedAt || b.scheduledDate || '';
        return dateB.localeCompare(dateA);
      });
      
      setMatches(sortedData);
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
  const updateMatch = useCallback(async (matchId, updateData, source = null) => {
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
      
      // Se source não foi fornecido, tentar detectar pela partida atual
      let detectedSource = source;
      if (!detectedSource) {
        const currentMatch = matches.find(m => m.id === matchId);
        detectedSource = currentMatch?.source || 'manual';
      }
      
      // Usar função apropriada baseada na fonte
      if (detectedSource === 'battlefy') {
        await matchService.updateMatchAuto(matchId, updateData, 'battlefy');
      } else {
        await matchService.updateMatch(matchId, updateData);
      }
      
      await loadMatches();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar partida:', err);
      throw err;
    }
  }, [firestore, isConfigured, loadMatches, matches]);

  // Deletar partida
  const deleteMatch = useCallback(async (matchId, source = 'manual') => {
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
      await matchService.deleteMatchAuto(matchId, source);
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