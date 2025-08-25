import { collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Interfaces para tipagem TypeScript
interface BattlefyTeam {
  _id: string;
  name?: string;
  score?: number;
  result?: 'win' | 'loss' | 'draw';
}

interface BattlefyMatch {
  _id: string;
  tournamentId: string;
  stageId: string;
  round: number;
  matchNumber: number;
  state: 'pending' | 'ready' | 'in_progress' | 'complete' | 'cancelled' | 'unknown';
  scheduledTime?: string;
  teams: (BattlefyTeam | null)[];
  results?: {
    finalScore: string;
    duration?: string;
    winner?: string;
  };
}

interface BattlefyTournament {
  _id: string;
  name: string;
  game: string;
  status: string;
  startTime?: string;
  endTime?: string;
  tournamentType?: string;
  stages?: Array<{
    _id: string;
    name: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class BattlefyMatchUpdater {
  private readonly baseUrl = 'https://api.battlefy.com';
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  /**
   * Faz requisição para a API do Battlefy com tratamento de erros
   */
  private async makeApiRequest<T>(url: string): Promise<ApiResponse<T>> {
    try {
      console.log(`🔍 Fazendo requisição para: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        // Note: fetch não tem verify=false como requests do Python
        // mas geralmente não é necessário para APIs públicas
      });

      console.log(`📡 Status da resposta: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      const data = await response.json();
      console.log(`✅ Dados recebidos: ${JSON.stringify(data).length} caracteres`);

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error(`💥 Erro na requisição:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica se o torneio existe e está ativo
   */
  async checkTournamentStatus(tournamentId: string): Promise<ApiResponse<BattlefyTournament>> {
    console.log(`\n🏆 VERIFICANDO STATUS DO TORNEIO: ${tournamentId}`);
    console.log('='.repeat(60));

    const url = `${this.baseUrl}/tournaments/${tournamentId}`;
    const response = await this.makeApiRequest<BattlefyTournament>(url);

    if (response.success && response.data) {
      const tournament = response.data;
      console.log('✅ Torneio encontrado:');
      console.log(`   Nome: ${tournament.name}`);
      console.log(`   Jogo: ${tournament.game}`);
      console.log(`   Status: ${tournament.status}`);
      console.log(`   Data início: ${tournament.startTime}`);
      console.log(`   Data fim: ${tournament.endTime}`);
      console.log(`   Tipo: ${tournament.tournamentType}`);

      if (tournament.stages) {
        console.log(`   Stages: ${tournament.stages.length}`);
        tournament.stages.forEach(stage => {
          console.log(`     Stage: ${stage.name} (ID: ${stage._id})`);
        });
      }
    } else {
      console.log(`❌ Não foi possível acessar o torneio: ${response.error}`);
    }

    return response;
  }

  /**
   * Busca partidas detalhadas de um stage específico
   */
  async getDetailedMatches(tournamentId: string, stageId: string): Promise<ApiResponse<BattlefyMatch[]>> {
    console.log(`\n🔄 BUSCANDO PARTIDAS DETALHADAS`);
    console.log('='.repeat(60));
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Stage ID: ${stageId}`);

    // Primeiro, verificar se o torneio existe
    const tournamentCheck = await this.checkTournamentStatus(tournamentId);
    if (!tournamentCheck.success) {
      return {
        success: false,
        error: `Torneio não encontrado: ${tournamentCheck.error}`
      };
    }

    // Tentar diferentes endpoints para obter as partidas
    const endpoints = [
      `${this.baseUrl}/stages/${stageId}/matches?populate=teams`,
      `${this.baseUrl}/stages/${stageId}/matches`,
      `${this.baseUrl}/tournaments/${tournamentId}/matches`
    ];

    for (const url of endpoints) {
      console.log(`🎯 Tentando endpoint: ${url}`);
      const response = await this.makeApiRequest<BattlefyMatch[]>(url);

      if (response.success && response.data) {
        const matches = response.data;
        console.log(`✅ Partidas encontradas: ${matches.length}`);

        // Validar se as partidas pertencem ao torneio correto
        const validMatches = matches.filter(match => {
          const belongsToTournament = match.tournamentId === tournamentId;
          if (!belongsToTournament) {
            console.log(`⚠️ Partida ${match._id} não pertence ao torneio ${tournamentId}`);
          }
          return belongsToTournament;
        });

        console.log(`✅ Partidas válidas para o torneio: ${validMatches.length}`);

        // Log das primeiras 5 partidas para debug
        validMatches.slice(0, 5).forEach((match, i) => {
          console.log(`\n   Partida ${i + 1}:`);
          console.log(`     ID: ${match._id}`);
          console.log(`     Tournament ID: ${match.tournamentId}`);
          console.log(`     Round: ${match.round}`);
          console.log(`     Número: ${match.matchNumber}`);
          console.log(`     Estado: ${match.state}`);
          console.log(`     Times: ${match.teams.length}`);

          match.teams.forEach((team, j) => {
            if (team) {
              console.log(`       Time ${j + 1}: ID=${team._id}, Score=${team.score}, Result=${team.result}`);
            }
          });
        });

        return {
          success: true,
          data: validMatches
        };
      }
    }

    return {
      success: false,
      error: 'Nenhum endpoint retornou dados válidos'
    };
  }

  /**
   * Salva ou atualiza partidas no Firebase
   */
  async saveMatchesToFirebase(matches: BattlefyMatch[], tournamentId: string): Promise<void> {
    console.log(`\n💾 SALVANDO ${matches.length} PARTIDAS NO FIREBASE`);
    console.log('='.repeat(60));

    const matchesCollection = collection(db, 'battlefy_matches');
    let savedCount = 0;
    let updatedCount = 0;
    let skippedUnknownCount = 0;

    for (const match of matches) {
      try {
        // Pular matches com state 'unknown' pois os oponentes ainda não foram definidos
        if (match.state === 'unknown') {
          skippedUnknownCount++;
          console.log(`⏭️ Pulando match ${match._id} - state 'unknown' (oponentes não definidos)`);
          continue;
        }
        // Verificar se a partida já existe
        const existingQuery = query(
          matchesCollection,
          where('battlefyId', '==', match._id)
        );
        const existingDocs = await getDocs(existingQuery);

        const matchData = {
          battlefyId: match._id || 'unknown',
          tournamentId: match.tournamentId || tournamentId,
          stageId: match.stageId || 'unknown',
          round: match.round || 0,
          matchNumber: match.matchNumber || 0,
          state: match.state || 'pending',
          scheduledTime: match.scheduledTime || null,
          teams: match.teams || [],
          results: match.results || null,
          lastUpdated: new Date().toISOString(),
          rawData: match
        };

        if (existingDocs.empty) {
          // Criar nova partida
          const docRef = doc(matchesCollection);
          await setDoc(docRef, matchData);
          savedCount++;
          console.log(`✅ Nova partida salva: ${match._id}`);
        } else {
          // Atualizar partida existente
          const docRef = existingDocs.docs[0].ref;
          await updateDoc(docRef, matchData);
          updatedCount++;
          console.log(`🔄 Partida atualizada: ${match._id}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao salvar partida ${match._id}:`, error);
      }
    }

    console.log(`\n📊 RESUMO DO SALVAMENTO:`);
    console.log(`   Novas partidas: ${savedCount}`);
    console.log(`   Partidas atualizadas: ${updatedCount}`);
    console.log(`   Partidas puladas (state 'unknown'): ${skippedUnknownCount}`);
    console.log(`   Total processado: ${savedCount + updatedCount}`);
    console.log(`   Total analisado: ${savedCount + updatedCount + skippedUnknownCount}`);
  }

  /**
   * Função principal para atualizar dados das partidas
   */
  async updateTournamentMatches(tournamentId: string, stageId: string): Promise<{
    success: boolean;
    message: string;
    matchesCount?: number;
  }> {
    console.log(`\n🚀 INICIANDO ATUALIZAÇÃO DE PARTIDAS`);
    console.log('='.repeat(60));
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Stage ID: ${stageId}`);

    try {
      // 1. Verificar status do torneio
      const tournamentResponse = await this.checkTournamentStatus(tournamentId);
      if (!tournamentResponse.success) {
        return {
          success: false,
          message: `Erro ao verificar torneio: ${tournamentResponse.error}`
        };
      }

      // 2. Buscar partidas detalhadas
      const matchesResponse = await this.getDetailedMatches(tournamentId, stageId);
      if (!matchesResponse.success || !matchesResponse.data) {
        return {
          success: false,
          message: `Erro ao buscar partidas: ${matchesResponse.error}`
        };
      }

      const matches = matchesResponse.data;
      if (matches.length === 0) {
        return {
          success: false,
          message: 'Nenhuma partida encontrada para este torneio/stage'
        };
      }

      // 3. Salvar no Firebase
      await this.saveMatchesToFirebase(matches, tournamentId);

      console.log(`\n✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!`);
      console.log(`   Total de partidas processadas: ${matches.length}`);

      return {
        success: true,
        message: `Atualização concluída! ${matches.length} partidas processadas.`,
        matchesCount: matches.length
      };

    } catch (error) {
      console.error(`💥 Erro durante a atualização:`, error);
      return {
        success: false,
        message: `Erro durante a atualização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Debug completo dos endpoints da API (equivalente ao Python)
   */
  async debugApiEndpoints(tournamentId: string, stageId: string): Promise<void> {
    console.log(`\n🔍 INICIANDO DEBUG DETALHADO DA API BATTLEFY`);
    console.log('='.repeat(60));

    const endpoints = [
      `${this.baseUrl}/tournaments/${tournamentId}`,
      `${this.baseUrl}/tournaments/${tournamentId}/stages`,
      `${this.baseUrl}/stages/${stageId}`,
      `${this.baseUrl}/stages/${stageId}/matches`,
      `${this.baseUrl}/tournaments/${tournamentId}/teams`,
      `${this.baseUrl}/tournaments/${tournamentId}/matches`,
    ];

    for (const endpoint of endpoints) {
      const response = await this.makeApiRequest(endpoint);
      
      console.log(`\n📡 Testando: ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.success && response.data) {
        const data = response.data;
        console.log(`   Tamanho resposta: ${JSON.stringify(data).length} caracteres`);
        
        if (Array.isArray(data)) {
          console.log(`   Itens na lista: ${data.length}`);
          if (data.length > 0 && typeof data[0] === 'object') {
            console.log(`   Campos do primeiro item: ${Object.keys(data[0])}`);
          }
        } else if (typeof data === 'object') {
          console.log(`   Campos disponíveis: ${Object.keys(data)}`);
          
          // Mostrar alguns valores importantes
          const importantKeys = ['name', 'title', 'teams', 'matches', 'bracket'];
          importantKeys.forEach(key => {
            if (key in data) {
              const value = (data as any)[key];
              if (Array.isArray(value)) {
                console.log(`   ${key}: ${value.length} itens`);
              } else {
                console.log(`   ${key}: ${value}`);
              }
            }
          });
        }
      } else {
        console.log(`   ❌ Erro: ${response.error}`);
      }
    }
  }
}

// Exportar instância singleton
export const battlefyMatchUpdater = new BattlefyMatchUpdater();
export default BattlefyMatchUpdater;