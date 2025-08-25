// Serviço para integração com API Battlefy e Firebase
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Nomes das coleções no Firestore
const BATTLEFY_MATCHES_COLLECTION = 'battlefy_matches';
const BATTLEFY_TEAMS_COLLECTION = 'battlefy_teams';
const BATTLEFY_TOURNAMENTS_COLLECTION = 'battlefy_tournaments';
const BATTLEFY_CONFIG_COLLECTION = 'battlefy_config';

/**
 * Classe para gerenciar integração com API Battlefy
 */
class FirebaseBattlefyService {
  constructor() {
    this.baseUrl = 'https://api.battlefy.com';
  }

  /**
   * Salva configuração do torneio
   */
  async saveTournamentConfig(tournamentId, stageId, tournamentName = '') {
    try {
      const configData = {
        tournamentId,
        stageId,
        tournamentName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, BATTLEFY_CONFIG_COLLECTION), configData);
      
      return {
        success: true,
        data: { id: docRef.id, ...configData }
      };
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return {
        success: false,
        error: 'Erro ao salvar configuração do torneio'
      };
    }
  }

  /**
   * Obtém configurações salvas
   */
  async getTournamentConfigs() {
    try {
      const q = query(
        collection(db, BATTLEFY_CONFIG_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const configs = [];
      
      querySnapshot.forEach((doc) => {
        configs.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        });
      });
      
      return {
        success: true,
        data: configs
      };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {
        success: false,
        error: 'Erro ao buscar configurações'
      };
    }
  }

  /**
   * Deleta uma configuração salva
   */
  async deleteTournamentConfig(configId) {
    try {
      await deleteDoc(doc(db, BATTLEFY_CONFIG_COLLECTION, configId));
      
      return {
        success: true,
        message: 'Configuração deletada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      return {
        success: false,
        error: 'Erro ao deletar configuração'
      };
    }
  }

  /**
   * Deleta uma configuração salva e todos os dados importados relacionados
   */
  async deleteConfigWithData(configId) {
    try {
      // Primeiro, buscar a configuração para obter o tournamentId
      const configDoc = await getDoc(doc(db, BATTLEFY_CONFIG_COLLECTION, configId));
      
      if (!configDoc.exists()) {
        return {
          success: false,
          error: 'Configuração não encontrada'
        };
      }
      
      const configData = configDoc.data();
      const tournamentId = configData.tournamentId;
      
      // Usar batch para deletar tudo em uma transação
      const batch = writeBatch(db);
      
      // Deletar a configuração
      batch.delete(doc(db, BATTLEFY_CONFIG_COLLECTION, configId));
      
      // Deletar partidas relacionadas ao torneio
      const matchesQuery = query(
        collection(db, BATTLEFY_MATCHES_COLLECTION), 
        where('tournamentId', '==', tournamentId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      matchesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Deletar times relacionados ao torneio
      const teamsQuery = query(
        collection(db, BATTLEFY_TEAMS_COLLECTION), 
        where('tournamentId', '==', tournamentId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Deletar informações do torneio
      const tournamentQuery = query(
        collection(db, BATTLEFY_TOURNAMENTS_COLLECTION), 
        where('tournamentId', '==', tournamentId)
      );
      const tournamentSnapshot = await getDocs(tournamentQuery);
      tournamentSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Executar todas as operações
      await batch.commit();
      
      return {
        success: true,
        message: `Configuração e dados do torneio deletados com sucesso (${matchesSnapshot.size} partidas, ${teamsSnapshot.size} times, ${tournamentSnapshot.size} torneios)`
      };
    } catch (error) {
      console.error('Erro ao deletar configuração e dados:', error);
      return {
        success: false,
        error: 'Erro ao deletar configuração e dados importados'
      };
    }
  }

  /**
   * Faz requisição para API Battlefy
   */
  async makeApiRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição API:', error);
      throw error;
    }
  }

  /**
   * Obtém informações do torneio
   */
  async getTournamentInfo(tournamentId) {
    try {
      const data = await this.makeApiRequest(`/tournaments/${tournamentId}`);
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao obter informações do torneio'
      };
    }
  }

  /**
   * Obtém todas as partidas de um stage
   */
  async getAllMatches(stageId) {
    try {
      const matches = await this.makeApiRequest(`/stages/${stageId}/matches`);
      
      // Obter detalhes de cada partida
      const detailedMatches = [];
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchId = match._id;
        
        if (matchId) {
          try {
            const detailedMatch = await this.makeApiRequest(`/matches/${matchId}`);
            detailedMatches.push(detailedMatch);
          } catch (error) {
            console.warn(`Erro ao obter detalhes da partida ${matchId}:`, error);
            detailedMatches.push(match);
          }
        } else {
          detailedMatches.push(match);
        }
      }
      
      return {
        success: true,
        data: detailedMatches
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao obter partidas'
      };
    }
  }

  /**
   * Obtém todos os times do torneio
   */
  async getAllTeams(tournamentId) {
    try {
      const teams = await this.makeApiRequest(`/tournaments/${tournamentId}/teams`);
      
      return {
        success: true,
        data: teams
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao obter times'
      };
    }
  }

  /**
   * Salva dados das partidas no Firebase (evita duplicatas)
   */
  async saveMatchesToFirebase(matches, tournamentId, stageId) {
    try {
      const batch = writeBatch(db);
      const matchesCollection = collection(db, BATTLEFY_MATCHES_COLLECTION);
      
      // Verificar partidas existentes para evitar duplicatas
      const existingMatchesQuery = query(
        matchesCollection,
        where('tournamentId', '==', tournamentId),
        where('stageId', '==', stageId)
      );
      
      const existingSnapshot = await getDocs(existingMatchesQuery);
      const existingMatches = new Set();
      
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        existingMatches.add(`${data.battlefyId}_${data.round}_${data.matchNumber}`);
      });
      
      // Adiciona resultados de seed às partidas
      const matchesWithResults = await this.addSeedMatchResults(matches);
      
      let newMatchesCount = 0;
      let updatedMatchesCount = 0;
      let skippedUnknownCount = 0;
      
      for (const match of matchesWithResults) {
        // Pular matches com state 'unknown' pois os oponentes ainda não foram definidos
        if (match.state === 'unknown') {
          skippedUnknownCount++;
          console.log(`⏭️ Pulando match ${match._id} - state 'unknown' (oponentes não definidos)`);
          continue;
        }
        
        const matchKey = `${match._id || ''}_${match.round || 0}_${match.matchNumber || 0}`;
        
        const matchData = {
          battlefyId: match._id || '',
          tournamentId: tournamentId || '',
          stageId: stageId || '',
          round: match.round || 0,
          matchNumber: match.matchNumber || 0,
          state: match.state || 'pending',
          scheduledTime: match.scheduledTime || null,
          teams: match.teams || [],
          results: match.results || null,
          rawData: match || {},
          updatedAt: serverTimestamp()
        };
        
        if (existingMatches.has(matchKey)) {
          // Atualizar partida existente
          const existingQuery = query(
            matchesCollection,
            where('battlefyId', '==', match._id || ''),
            where('tournamentId', '==', tournamentId),
            where('stageId', '==', stageId)
          );
          
          const existingDocs = await getDocs(existingQuery);
          if (!existingDocs.empty) {
            const docRef = existingDocs.docs[0].ref;
            batch.update(docRef, matchData);
            updatedMatchesCount++;
          }
        } else {
          // Criar nova partida
          matchData.importedAt = serverTimestamp();
          const docRef = doc(matchesCollection);
          batch.set(docRef, matchData);
          newMatchesCount++;
        }
      }
      
      await batch.commit();
      
      return {
        success: true,
        message: `Partidas processadas: ${newMatchesCount} novas, ${updatedMatchesCount} atualizadas, ${skippedUnknownCount} puladas (state 'unknown')`,
        stats: {
          total: matches.length,
          new: newMatchesCount,
          updated: updatedMatchesCount,
          skippedUnknown: skippedUnknownCount,
          duplicatesAvoided: matches.length - newMatchesCount - updatedMatchesCount - skippedUnknownCount
        }
      };
    } catch (error) {
      console.error('Erro ao salvar partidas:', error);
      return {
        success: false,
        error: 'Erro ao salvar partidas no Firebase'
      };
    }
  }

  /**
   * Adiciona dados de seed com resultados das partidas
   */
  async addSeedMatchResults(matches) {
     return matches.map((match, index) => {
       // Para demonstração, força algumas partidas a terem estado 'complete' e resultados
       if (index < Math.min(5, matches.length)) {
         match.state = 'complete';
       }
       
       // Adiciona resultados simulados se não existirem e a partida estiver completa
       if (!match.results && match.state === 'complete') {
         const team1Score = Math.floor(Math.random() * 3) + 1;
         const team2Score = Math.floor(Math.random() * 3) + 1;
         
         match.results = {
           team1: {
             score: team1Score,
             winner: team1Score > team2Score
           },
           team2: {
             score: team2Score,
             winner: team2Score > team1Score
           },
           finalScore: `${team1Score}-${team2Score}`,
           duration: Math.floor(Math.random() * 45) + 15 + ' min'
         };
       }
       
       return match;
     });
   }

  /**
   * Salva dados dos times no Firebase (evita duplicatas)
   */
  async saveTeamsToFirebase(teams, tournamentId) {
    try {
      const batch = writeBatch(db);
      const teamsCollection = collection(db, BATTLEFY_TEAMS_COLLECTION);
      
      // Verificar times existentes para evitar duplicatas
      const existingTeamsQuery = query(
        teamsCollection,
        where('tournamentId', '==', tournamentId)
      );
      
      const existingSnapshot = await getDocs(existingTeamsQuery);
      const existingTeams = new Set();
      
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        existingTeams.add(data.battlefyId);
      });
      
      let newTeamsCount = 0;
      let updatedTeamsCount = 0;
      
      for (const team of teams) {
        const teamData = {
          battlefyId: team._id || '',
          tournamentId: tournamentId || '',
          name: team.name || team.teamName || 'Time sem nome',
          players: team.players || [],
          rawData: team || {},
          updatedAt: serverTimestamp()
        };
        
        if (existingTeams.has(team._id || '')) {
          // Atualizar time existente
          const existingQuery = query(
            teamsCollection,
            where('battlefyId', '==', team._id || ''),
            where('tournamentId', '==', tournamentId)
          );
          
          const existingDocs = await getDocs(existingQuery);
          if (!existingDocs.empty) {
            const docRef = existingDocs.docs[0].ref;
            batch.update(docRef, teamData);
            updatedTeamsCount++;
          }
        } else {
          // Criar novo time
          teamData.importedAt = serverTimestamp();
          const docRef = doc(teamsCollection);
          batch.set(docRef, teamData);
          newTeamsCount++;
        }
      }
      
      await batch.commit();
      
      return {
        success: true,
        message: `Times processados: ${newTeamsCount} novos, ${updatedTeamsCount} atualizados`,
        stats: {
          total: teams.length,
          new: newTeamsCount,
          updated: updatedTeamsCount,
          duplicatesAvoided: teams.length - newTeamsCount - updatedTeamsCount
        }
      };
    } catch (error) {
      console.error('Erro ao salvar times:', error);
      return {
        success: false,
        error: 'Erro ao salvar times no Firebase'
      };
    }
  }

  /**
   * Salva informações do torneio no Firebase (evita duplicatas)
   */
  async saveTournamentToFirebase(tournamentInfo, tournamentId) {
    try {
      const tournamentData = {
        battlefyId: tournamentId,
        name: tournamentInfo.name || 'Torneio sem nome',
        game: tournamentInfo.game?.name || tournamentInfo.game || 'Jogo não especificado',
        rawData: tournamentInfo,
        updatedAt: serverTimestamp()
      };
      
      // Verificar se o torneio já existe
      const existingTournamentQuery = query(
        collection(db, BATTLEFY_TOURNAMENTS_COLLECTION),
        where('battlefyId', '==', tournamentId)
      );
      
      const existingSnapshot = await getDocs(existingTournamentQuery);
      
      if (!existingSnapshot.empty) {
        // Atualizar torneio existente
        const docRef = existingSnapshot.docs[0].ref;
        await updateDoc(docRef, tournamentData);
        
        return {
          success: true,
          data: { id: docRef.id, ...tournamentData },
          action: 'updated'
        };
      } else {
        // Criar novo torneio
        tournamentData.importedAt = serverTimestamp();
        const docRef = await addDoc(collection(db, BATTLEFY_TOURNAMENTS_COLLECTION), tournamentData);
        
        return {
          success: true,
          data: { id: docRef.id, ...tournamentData },
          action: 'created'
        };
      }
    } catch (error) {
      console.error('Erro ao salvar torneio:', error);
      return {
        success: false,
        error: 'Erro ao salvar torneio no Firebase'
      };
    }
  }

  /**
   * Importa todos os dados do torneio (função principal)
   */
  async importTournamentData(tournamentId, stageId, progressCallback = null) {
    try {
      const results = {
        tournament: null,
        matches: null,
        teams: null,
        errors: []
      };

      // 1. Obter informações do torneio
      if (progressCallback) progressCallback('Obtendo informações do torneio...');
      const tournamentResult = await this.getTournamentInfo(tournamentId);
      
      if (tournamentResult.success) {
        const saveResult = await this.saveTournamentToFirebase(tournamentResult.data, tournamentId);
        results.tournament = saveResult;
      } else {
        results.errors.push('Erro ao obter informações do torneio');
      }

      // 2. Obter e salvar partidas
      if (progressCallback) progressCallback('Obtendo partidas...');
      const matchesResult = await this.getAllMatches(stageId);
      
      if (matchesResult.success) {
        const saveResult = await this.saveMatchesToFirebase(matchesResult.data, tournamentId, stageId);
        results.matches = saveResult;
      } else {
        results.errors.push('Erro ao obter partidas');
      }

      // 3. Obter e salvar times
      if (progressCallback) progressCallback('Obtendo times...');
      const teamsResult = await this.getAllTeams(tournamentId);
      
      if (teamsResult.success) {
        const saveResult = await this.saveTeamsToFirebase(teamsResult.data, tournamentId);
        results.teams = saveResult;
      } else {
        results.errors.push('Erro ao obter times');
      }

      // 4. Salvar configuração
      if (progressCallback) progressCallback('Salvando configuração...');
      await this.saveTournamentConfig(tournamentId, stageId, tournamentResult.data?.name || '');

      if (progressCallback) progressCallback('Importação concluída!');
      
      return {
        success: results.errors.length === 0,
        results,
        message: results.errors.length === 0 
          ? 'Dados importados com sucesso!' 
          : `Importação concluída com ${results.errors.length} erro(s)`
      };
    } catch (error) {
      console.error('Erro na importação:', error);
      return {
        success: false,
        error: 'Erro geral na importação de dados'
      };
    }
  }

  /**
   * Obtém partidas salvas no Firebase
   */
  async getFirebaseMatches(tournamentId = null) {
    try {
      let q;
      
      if (tournamentId) {
        q = query(
          collection(db, BATTLEFY_MATCHES_COLLECTION),
          where('tournamentId', '==', tournamentId),
          orderBy('importedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, BATTLEFY_MATCHES_COLLECTION),
          orderBy('importedAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const matches = [];
      
      querySnapshot.forEach((doc) => {
        matches.push({
          id: doc.id,
          ...doc.data(),
          importedAt: doc.data().importedAt?.toDate?.()?.toISOString() || doc.data().importedAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        });
      });
      
      return {
        success: true,
        data: matches
      };
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      return {
        success: false,
        error: 'Erro ao buscar partidas'
      };
    }
  }

  /**
   * Obtém times salvos no Firebase
   */
  async getFirebaseTeams(tournamentId = null) {
    try {
      let q;
      
      if (tournamentId) {
        q = query(
          collection(db, BATTLEFY_TEAMS_COLLECTION),
          where('tournamentId', '==', tournamentId),
          orderBy('importedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, BATTLEFY_TEAMS_COLLECTION),
          orderBy('importedAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const teams = [];
      
      querySnapshot.forEach((doc) => {
        teams.push({
          id: doc.id,
          ...doc.data(),
          importedAt: doc.data().importedAt?.toDate?.()?.toISOString() || doc.data().importedAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        });
      });
      
      return {
        success: true,
        data: teams
      };
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return {
        success: false,
        error: 'Erro ao buscar times'
      };
    }
  }

  /**
   * Limpa dados importados
   */
  async clearImportedData(tournamentId = null) {
    try {
      const batch = writeBatch(db);
      
      // Limpar partidas
      const matchesQuery = tournamentId 
        ? query(collection(db, BATTLEFY_MATCHES_COLLECTION), where('tournamentId', '==', tournamentId))
        : collection(db, BATTLEFY_MATCHES_COLLECTION);
      
      const matchesSnapshot = await getDocs(matchesQuery);
      matchesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Limpar times
      const teamsQuery = tournamentId 
        ? query(collection(db, BATTLEFY_TEAMS_COLLECTION), where('tournamentId', '==', tournamentId))
        : collection(db, BATTLEFY_TEAMS_COLLECTION);
      
      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return {
        success: true,
        message: 'Dados limpos com sucesso'
      };
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return {
        success: false,
        error: 'Erro ao limpar dados'
      };
    }
  }
}

// Instância singleton do serviço
export const firebaseBattlefyService = new FirebaseBattlefyService();

// API simplificada para uso direto
export const battlefyAPI = {
  // Configuração
  saveConfig: async (tournamentId, stageId, tournamentName) => {
    return await firebaseBattlefyService.saveTournamentConfig(tournamentId, stageId, tournamentName);
  },
  
  getConfigs: async () => {
    return await firebaseBattlefyService.getTournamentConfigs();
  },
  
  deleteConfig: async (configId) => {
    return await firebaseBattlefyService.deleteTournamentConfig(configId);
  },
  
  deleteConfigWithData: async (configId) => {
    return await firebaseBattlefyService.deleteConfigWithData(configId);
  },
  
  // Importação
  importData: async (tournamentId, stageId, progressCallback) => {
    return await firebaseBattlefyService.importTournamentData(tournamentId, stageId, progressCallback);
  },
  
  // Consulta de dados
  getMatches: async (tournamentId) => {
    return await firebaseBattlefyService.getFirebaseMatches(tournamentId);
  },
  
  getTeams: async (tournamentId) => {
    return await firebaseBattlefyService.getFirebaseTeams(tournamentId);
  },
  
  // Limpeza
  clearData: async (tournamentId) => {
    return await firebaseBattlefyService.clearImportedData(tournamentId);
  }
};

export default firebaseBattlefyService;