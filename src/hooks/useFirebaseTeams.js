import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseTeamService } from '../services/firebaseTeamService';
import { useFirebase } from '../contexts/FirebaseContext';

export const useFirebaseTeams = () => {
  const { firestore, isConfigured } = useFirebase();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Mapear dados das equipes do Battlefy
  const mapBattlefyTeams = useCallback((docs) => {
    return docs.map((doc) => {
      const data = doc.data();
      let players = [];
      
      // Parse dos jogadores se estiver em formato string
      if (typeof data.players === 'string') {
        try {
          // Remove [object Object] e tenta fazer parse do rawData
          if (data.rawData && typeof data.rawData === 'object') {
            players = data.rawData.players || [];
          }
        } catch (e) {
          console.warn('Erro ao fazer parse dos jogadores:', e);
          players = [];
        }
      } else if (Array.isArray(data.players)) {
        players = data.players;
      }
      
      // Extrair nomes dos jogadores
      const memberNames = players.map(player => {
        if (typeof player === 'object' && player !== null) {
          return player.inGameName || player.username || player.name || 'Jogador';
        }
        return player || 'Jogador';
      }).filter(name => name && name !== 'Jogador');
      
      // Determinar capitão (primeiro jogador ou jogador com role de captain)
      let captain = '';
      if (players.length > 0) {
        const captainPlayer = players.find(p => p && p.isCaptain) || players[0];
        if (captainPlayer && typeof captainPlayer === 'object') {
          captain = captainPlayer.inGameName || captainPlayer.username || captainPlayer.name || '';
        }
      }
      
      // Avatar da equipe (priorizar logoUrl do rawData)
      let avatar = '';
      if (data.rawData) {
        // Se rawData é string, tentar fazer parse
        let rawDataParsed = data.rawData;
        if (typeof data.rawData === 'string') {
          try {
            rawDataParsed = JSON.parse(data.rawData);
          } catch {
            rawDataParsed = {};
          }
        }
        
        // Priorizar rawData.persistentTeam.logoUrl (estrutura real do Battlefy)
        if (rawDataParsed.persistentTeam && rawDataParsed.persistentTeam.logoUrl) {
          avatar = rawDataParsed.persistentTeam.logoUrl;
        } else {
          // Fallback para outras possíveis estruturas
          avatar = rawDataParsed.logoUrl || rawDataParsed.logo || rawDataParsed.avatar || '';
        }
      }
      
      return {
        id: doc.id,
        battlefyId: data.battlefyId,
        name: data.name || 'Equipe sem nome',
        tag: data.name ? data.name.substring(0, 4).toUpperCase() : 'TEAM',
        game: 'League of Legends', // Assumindo LoL por padrão
        region: 'BR', // Assumindo BR por padrão
        description: `Equipe importada do Battlefy - Torneio: ${data.tournamentId}`,
        members: memberNames,
        captain: captain,
        contactEmail: '',
        discordServer: '',
        avatar: avatar,
        isActive: true,
        source: 'battlefy',
        tournamentId: data.tournamentId,
        importedAt: data.importedAt,
        updatedAt: data.updatedAt,
        createdAt: data.importedAt
      };
    });
  }, []);
  
  // Combinar equipes sem duplicação
  const combineTeams = useCallback((seedTeams, battlefyTeams) => {
    const combined = [...seedTeams];
    const existingNames = new Set(seedTeams.map(team => team.name.toLowerCase()));
    
    // Agrupar equipes Battlefy por nome para pegar a mais recente
    const battlefyByName = new Map();
    battlefyTeams.forEach(team => {
      const nameKey = team.name.toLowerCase();
      const existing = battlefyByName.get(nameKey);
      
      if (!existing || new Date(team.updatedAt) > new Date(existing.updatedAt)) {
        battlefyByName.set(nameKey, team);
      }
    });
    
    // Adicionar equipes Battlefy que não existem nas seed
    battlefyByName.forEach(team => {
      if (!existingNames.has(team.name.toLowerCase())) {
        combined.push(team);
      }
    });
    
    return combined;
  }, []);

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
      
      // Carregar equipes seed
      const seedTeams = await firebaseTeamService.getAllTeams();
      
      // Carregar equipes Battlefy
      const battlefyTeamsRef = collection(firestore, 'battlefy_teams');
      const battlefyQuery = query(battlefyTeamsRef, orderBy('updatedAt', 'desc'));
      const battlefySnapshot = await getDocs(battlefyQuery);
      const battlefyTeams = mapBattlefyTeams(battlefySnapshot.docs);
      
      // Combinar equipes sem duplicação
      const combinedTeams = combineTeams(seedTeams, battlefyTeams);
      
      setTeams(combinedTeams);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar times:', err);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, firestore, mapBattlefyTeams, combineTeams]);

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

    const unsubscribeSeed = firebaseTeamService.onTeamsChange(async (seedTeams) => {
      try {
        // Carregar equipes Battlefy
        const battlefyTeamsRef = collection(firestore, 'battlefy_teams');
        const battlefyQuery = query(battlefyTeamsRef, orderBy('updatedAt', 'desc'));
        const battlefySnapshot = await getDocs(battlefyQuery);
        const battlefyTeams = mapBattlefyTeams(battlefySnapshot.docs);
        
        // Combinar equipes sem duplicação
        const combinedTeams = combineTeams(seedTeams, battlefyTeams);
        
        setTeams(combinedTeams);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar equipes Battlefy em tempo real:', err);
        setTeams(seedTeams); // Fallback para apenas equipes seed
        setLoading(false);
      }
    });

    return unsubscribeSeed;
  }, [realTimeEnabled, isConfigured, firestore, mapBattlefyTeams, combineTeams]);

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