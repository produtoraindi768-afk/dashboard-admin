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
      console.log(`🔍 Buscando partidas da API Battlefy para stage ${stageId}`);
      const matches = await this.makeApiRequest(`/stages/${stageId}/matches`);
      console.log(`📊 API retornou ${matches.length} partidas básicas`);
      
      // Obter detalhes de cada partida
      const detailedMatches = [];
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchId = match._id;
        
        if (matchId) {
          try {
            const detailedMatch = await this.makeApiRequest(`/matches/${matchId}`);
            
            // Log detalhado dos dados recebidos da API
            console.log(`🔍 Match ${matchId} da API:`, {
              state: detailedMatch.state,
              hasResults: !!detailedMatch.results,
              teams: detailedMatch.teams?.map(t => t.name || 'Unknown'),
              round: detailedMatch.round,
              matchNumber: detailedMatch.matchNumber
            });
            
            detailedMatches.push(detailedMatch);
          } catch (error) {
            console.warn(`Erro ao obter detalhes da partida ${matchId}:`, error);
            detailedMatches.push(match);
          }
        } else {
          detailedMatches.push(match);
        }
      }
      
      // Resumo dos estados das partidas recebidas
      const statesSummary = detailedMatches.reduce((acc, match) => {
        const state = match.state || 'unknown';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`📈 Resumo dos estados das partidas da API:`, statesSummary);
      
      return {
        success: true,
        data: detailedMatches
      };
    } catch (error) {
      console.error(`❌ Erro ao obter partidas da API:`, error);
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
      
      // Adiciona resultados de seed às partidas de forma inteligente
      const matchesWithResults = await this.addSeedMatchResults(matches, tournamentId, stageId);
      
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
          // Verificar se a partida existente precisa ser atualizada
          const existingQuery = query(
            matchesCollection,
            where('battlefyId', '==', match._id || ''),
            where('tournamentId', '==', tournamentId),
            where('stageId', '==', stageId)
          );
          
          const existingDocs = await getDocs(existingQuery);
          if (!existingDocs.empty) {
            const existingDoc = existingDocs.docs[0];
            const existingData = existingDoc.data();
            
            // Verificar se há mudanças significativas
            const stateChanged = existingData.state !== matchData.state;
            const timeChanged = existingData.scheduledTime !== matchData.scheduledTime;
            const teamsChanged = JSON.stringify(existingData.teams || []) !== JSON.stringify(matchData.teams || []);
            
            // Comparação especial para resultados - priorizar dados reais do Battlefy
            let resultsChanged = false;
            if (matchData.results && !existingData.results) {
              resultsChanged = true; // Novos resultados do Battlefy
            } else if (matchData.results && existingData.results) {
              // Se existem resultados de seed e chegaram dados reais do Battlefy
              if (existingData.results.seedGenerated && !matchData.results.seedGenerated) {
                resultsChanged = true;
              } else {
                // Comparação normal de resultados
                resultsChanged = JSON.stringify(existingData.results) !== JSON.stringify(matchData.results);
              }
            }
            
            const rawDataChanged = JSON.stringify(existingData.rawData || {}) !== JSON.stringify(matchData.rawData || {});
            
            const hasChanges = stateChanged || timeChanged || teamsChanged || resultsChanged || rawDataChanged;
            
            if (hasChanges) {
              const docRef = existingDoc.ref;
              batch.update(docRef, matchData);
              updatedMatchesCount++;
              
              // Log detalhado das mudanças
              const changes = [];
              if (stateChanged) changes.push(`state: ${existingData.state} → ${matchData.state}`);
              if (timeChanged) changes.push(`scheduledTime: ${existingData.scheduledTime} → ${matchData.scheduledTime}`);
              if (teamsChanged) changes.push('teams');
              if (resultsChanged) {
                const oldResults = existingData.results?.seedGenerated ? 'seed' : (existingData.results ? 'real' : 'none');
                const newResults = matchData.results?.seedGenerated ? 'seed' : (matchData.results ? 'real' : 'none');
                changes.push(`results: ${oldResults} → ${newResults}`);
              }
              if (rawDataChanged) changes.push('rawData');
              
              console.log(`🔄 Atualizando match ${match._id}: ${changes.join(', ')}`);
            } else {
              console.log(`✅ Match ${match._id} sem mudanças - dados preservados`);
            }
            // Se não há mudanças, não faz nada (não conta como atualizada)
          }
        } else {
          // Criar nova partida
          matchData.importedAt = serverTimestamp();
          const docRef = doc(matchesCollection);
          batch.set(docRef, matchData);
          newMatchesCount++;
          
          // Log para novas partidas
          const seedInfo = matchData.results?.seedGenerated ? ' (com seed)' : '';
          console.log(`➕ Nova match ${match._id}: state=${matchData.state}${seedInfo}`);
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
   * Adiciona dados de seed com resultados das partidas de forma inteligente
   * Verifica dados existentes no Firebase antes de aplicar mudanças
   */
  async addSeedMatchResults(matches, tournamentId, stageId) {
    try {
      // Buscar partidas existentes no Firebase para comparação
      const matchesCollection = collection(db, BATTLEFY_MATCHES_COLLECTION);
      const existingMatchesQuery = query(
        matchesCollection,
        where('tournamentId', '==', tournamentId),
        where('stageId', '==', stageId)
      );
      
      const existingSnapshot = await getDocs(existingMatchesQuery);
      const existingMatchesMap = new Map();
      
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        existingMatchesMap.set(data.battlefyId, data);
      });
      
      return matches.map((match, index) => {
        const existingMatch = existingMatchesMap.get(match._id);
        
        // Se a partida já existe no Firebase, verificar se deve preservar ou atualizar
        if (existingMatch) {
          // Só preservar dados de seed (gerados artificialmente)
          // Permitir que dados reais do Battlefy sempre sobrescrevam
          const shouldPreserveState = existingMatch.results?.seedGenerated && !match.state;
          const shouldPreserveResults = existingMatch.results?.seedGenerated && !match.results;
          
          if (shouldPreserveState) {
            match.state = existingMatch.state;
            console.log(`🔄 Preservando estado de seed para match ${match._id}: ${existingMatch.state}`);
          }
          
          if (shouldPreserveResults) {
            match.results = existingMatch.results;
            console.log(`🔄 Preservando resultados de seed para match ${match._id}`);
          }
          
          // Se dados do Battlefy estão disponíveis, eles têm prioridade
          if (match.state && match.state !== existingMatch.state) {
            console.log(`🆕 Atualizando estado do Battlefy para match ${match._id}: ${existingMatch.state} → ${match.state}`);
          }
          
          if (match.results && JSON.stringify(match.results) !== JSON.stringify(existingMatch.results)) {
            console.log(`🆕 Atualizando resultados do Battlefy para match ${match._id}`);
          }
        } else {
          // Para novas partidas, aplicar lógica de seed apenas se necessário
          // Para demonstração, força algumas partidas a terem estado 'complete' e resultados
          if (index < Math.min(5, matches.length) && (!match.state || match.state === 'pending')) {
            match.state = 'complete';
            console.log(`🌱 Aplicando seed: match ${match._id} definido como 'complete'`);
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
              duration: Math.floor(Math.random() * 45) + 15 + ' min',
              seedGenerated: true // Marca que foi gerado por seed
            };
            
            console.log(`🌱 Aplicando seed: resultados gerados para match ${match._id} - ${match.results.finalScore}`);
          }
        }
        
        return match;
      });
    } catch (error) {
      console.error('Erro ao processar dados de seed:', error);
      // Em caso de erro, retorna as partidas sem modificação
      return matches;
    }
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
          // Verificar se o time existente precisa ser atualizado
          const existingQuery = query(
            teamsCollection,
            where('battlefyId', '==', team._id || ''),
            where('tournamentId', '==', tournamentId)
          );
          
          const existingDocs = await getDocs(existingQuery);
          if (!existingDocs.empty) {
            const existingDoc = existingDocs.docs[0];
            const existingData = existingDoc.data();
            
            // Verificar se há mudanças significativas
            const hasChanges = (
              existingData.name !== teamData.name ||
              JSON.stringify(existingData.players) !== JSON.stringify(teamData.players) ||
              JSON.stringify(existingData.rawData) !== JSON.stringify(teamData.rawData)
            );
            
            if (hasChanges) {
              const docRef = existingDoc.ref;
              batch.update(docRef, teamData);
              updatedTeamsCount++;
            }
            // Se não há mudanças, não faz nada (não conta como atualizado)
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
        // Comparar dados existentes com novos dados
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data();
        
        // Verificar se há mudanças significativas
        const hasChanges = (
          existingData.name !== tournamentData.name ||
          existingData.game !== tournamentData.game ||
          JSON.stringify(existingData.rawData) !== JSON.stringify(tournamentData.rawData)
        );
        
        if (hasChanges) {
          // Atualizar torneio existente apenas se houver mudanças
          const docRef = existingDoc.ref;
          await updateDoc(docRef, tournamentData);
          
          return {
            success: true,
            data: { id: docRef.id, ...tournamentData },
            action: 'updated'
          };
        } else {
          // Nenhuma mudança detectada
          return {
            success: true,
            data: { id: existingDoc.id, ...existingData },
            action: 'no_changes'
          };
        }
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
   * Atualiza dados de um torneio existente sem duplicar
   */
  async updateTournamentData(tournamentId, stageId, progressCallback = null) {
    try {
      const results = {
        tournament: null,
        matches: null,
        teams: null,
        errors: [],
        updated: true
      };

      // Verificar se o torneio existe na configuração com o mesmo tournamentId e stageId
      const configQuery = query(
        collection(db, BATTLEFY_CONFIG_COLLECTION),
        where('tournamentId', '==', tournamentId),
        where('stageId', '==', stageId)
      );
      const configSnapshot = await getDocs(configQuery);
      
      if (configSnapshot.empty) {
        return {
          success: false,
          error: 'Torneio com este Tournament ID e Stage ID não encontrado nas configurações. Verifique os IDs ou importe o torneio primeiro.',
          results
        };
      }
      
      console.log(`🔄 Iniciando atualização do torneio ${tournamentId} com stage ${stageId}`);

      // 1. Atualizar informações do torneio
      if (progressCallback) progressCallback('Atualizando informações do torneio...');
      console.log(`📊 Buscando informações do torneio ${tournamentId}...`);
      const tournamentResult = await this.getTournamentInfo(tournamentId);
      
      if (tournamentResult.success) {
        console.log(`💾 Salvando informações do torneio...`);
        const saveResult = await this.saveTournamentToFirebase(tournamentResult.data, tournamentId);
        results.tournament = saveResult;
        console.log(`✅ Torneio: ${saveResult.action === 'updated' ? 'Atualizado' : saveResult.action === 'no_changes' ? 'Sem mudanças' : 'Criado'}`);
      } else {
        console.error(`❌ Erro ao obter informações do torneio`);
        results.errors.push('Erro ao obter informações do torneio');
      }

      // 2. Atualizar partidas
      if (progressCallback) progressCallback('Atualizando partidas...');
      console.log(`🎮 Buscando partidas do stage ${stageId}...`);
      const matchesResult = await this.getAllMatches(stageId);
      
      if (matchesResult.success) {
        console.log(`💾 Salvando ${matchesResult.data.length} partidas...`);
        const saveResult = await this.saveMatchesToFirebase(matchesResult.data, tournamentId, stageId);
        results.matches = saveResult;
        console.log(`✅ Partidas: ${saveResult.stats.new} novas, ${saveResult.stats.updated} atualizadas, ${saveResult.stats.skippedUnknown || 0} puladas`);
      } else {
        console.error(`❌ Erro ao obter partidas`);
        results.errors.push('Erro ao obter partidas');
      }

      // 3. Atualizar times
      if (progressCallback) progressCallback('Atualizando times...');
      console.log(`👥 Buscando times do torneio ${tournamentId}...`);
      const teamsResult = await this.getAllTeams(tournamentId);
      
      if (teamsResult.success) {
        console.log(`💾 Salvando ${teamsResult.data.length} times...`);
        const saveResult = await this.saveTeamsToFirebase(teamsResult.data, tournamentId);
        results.teams = saveResult;
        console.log(`✅ Times: ${saveResult.stats.new} novos, ${saveResult.stats.updated} atualizados`);
      } else {
        console.error(`❌ Erro ao obter times`);
        results.errors.push('Erro ao obter times');
      }

      if (progressCallback) progressCallback('Atualização concluída!');
      
      return {
        success: true,
        results,
        message: 'Torneio atualizado com sucesso!'
      };
    } catch (error) {
      console.error('Erro na atualização do torneio:', error);
      return {
        success: false,
        error: 'Erro ao atualizar dados do torneio',
        results: { errors: [error.message] }
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
  
  // Atualização
  updateTournament: async (tournamentId, stageId, progressCallback) => {
    return await firebaseBattlefyService.updateTournamentData(tournamentId, stageId, progressCallback);
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