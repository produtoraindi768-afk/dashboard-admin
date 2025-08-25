import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Função auxiliar para mapear dados do Battlefy
const mapBattlefyMatch = async (doc, firestore) => {
  const data = doc.data();
  
  // Buscar nomes dos times diretamente dos dados da partida
  let team1Name = 'Time 1 (TBD)';
  let team2Name = 'Time 2 (TBD)';
  let team1Id = null;
  let team2Id = null;
  
  // Primeiro, tentar obter nomes dos times diretamente dos dados da partida
  if (data.teams && data.teams.length >= 2) {
    const team1 = data.teams[0];
    const team2 = data.teams[1];
    
    if (team1 && team1.name) {
      team1Name = team1.name;
      team1Id = team1._id || team1.battlefyId;
    }
    
    if (team2 && team2.name) {
      team2Name = team2.name;
      team2Id = team2._id || team2.battlefyId;
    }
  }
  
  // Se não conseguiu obter os nomes, tentar buscar na coleção battlefy_teams
  if ((team1Name === 'Time 1 (TBD)' || team2Name === 'Time 2 (TBD)') && data.tournamentId) {
    try {
      const teamsQuery = query(
        collection(firestore, 'battlefy_teams'),
        where('tournamentId', '==', data.tournamentId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Tentar corresponder times por ID se disponível
      if (team1Id && teams.length > 0) {
        const matchedTeam1 = teams.find(team => team.battlefyId === team1Id);
        if (matchedTeam1 && matchedTeam1.name) {
          team1Name = matchedTeam1.name;
        }
      }
      
      if (team2Id && teams.length > 0) {
        const matchedTeam2 = teams.find(team => team.battlefyId === team2Id);
        if (matchedTeam2 && matchedTeam2.name) {
          team2Name = matchedTeam2.name;
        }
      }
      
      // Se ainda não conseguiu, usar os primeiros times disponíveis
      if (team1Name === 'Time 1 (TBD)' && teams.length >= 1) {
        team1Name = teams[0].name || `Time 1 - Match ${data.matchNumber}`;
      }
      if (team2Name === 'Time 2 (TBD)' && teams.length >= 2) {
        team2Name = teams[1].name || `Time 2 - Match ${data.matchNumber}`;
      }
    } catch (error) {
      console.warn('Erro ao buscar nomes dos times:', error);
    }
  }
  
  // Buscar nome do torneio
  let tournamentName = `Torneio Battlefy - Match ${data.matchNumber}`;
  if (data.tournamentId) {
    try {
      const tournamentQuery = query(
        collection(firestore, 'battlefy_tournaments'),
        where('battlefyId', '==', data.tournamentId)
      );
      const tournamentSnapshot = await getDocs(tournamentQuery);
      if (!tournamentSnapshot.empty) {
        const tournament = tournamentSnapshot.docs[0].data();
        tournamentName = tournament.name || tournamentName;
      }
    } catch (error) {
      console.warn('Erro ao buscar nome do torneio:', error);
    }
  }
  
  return {
    id: doc.id,
    battlefyId: data.battlefyId,
    tournamentId: data.tournamentId,
    tournamentName: tournamentName,
    team1: {
      id: team1Id || `battlefy_team_1_${doc.id}`,
      name: team1Name,
      tag: null,
      logo: null,
      avatar: null
    },
    team2: {
      id: team2Id || `battlefy_team_2_${doc.id}`,
      name: team2Name,
      tag: null,
      logo: null,
      avatar: null
    },
    scheduledDate: data.scheduledTime || new Date().toISOString(),
    format: 'MD3',
    game: 'Battlefy Tournament',
    status: data.state === 'complete' ? 'finished' : data.state === 'pending' ? 'scheduled' : data.state === 'live' ? 'live' : 'scheduled',
    isFeatured: false,
    result: data.results ? {
      team1Score: data.results.team1 ? data.results.team1.score || 0 : 0,
      team2Score: data.results.team2 ? data.results.team2.score || 0 : 0,
      winner: data.results.team1 && data.results.team1.winner ? 'team1' : 
              data.results.team2 && data.results.team2.winner ? 'team2' : null,
      finalScore: data.results.finalScore || null,
      duration: data.results.duration || null
    } : null,
    source: 'battlefy',
    createdAt: data.importedAt || data.createdAt,
    updatedAt: data.updatedAt,
    matchNumber: data.matchNumber,
    round: data.round,
    stageId: data.stageId
  };
};

class FirebaseMatchService {
  constructor(firestore) {
    this.firestore = firestore;
    this.collectionName = 'matches';
  }

  // Criar nova partida
  async createMatch(matchData) {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), {
        ...matchData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      throw error;
    }
  }

  // Buscar todas as partidas (incluindo do Battlefy)
  async getAllMatches() {
    try {
      // Buscar partidas criadas manualmente
      const manualMatchesSnapshot = await getDocs(
        query(
          collection(this.firestore, this.collectionName),
          orderBy('createdAt', 'desc')
        )
      );
      
      const manualMatches = manualMatchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'manual' // Identificar origem
      }));

      // Buscar partidas do Battlefy
      const battlefyMatchesSnapshot = await getDocs(
        query(
          collection(this.firestore, 'battlefy_matches'),
          orderBy('importedAt', 'desc')
        )
      );
      
      const battlefyMatches = await Promise.all(
        battlefyMatchesSnapshot.docs.map(doc => mapBattlefyMatch(doc, this.firestore))
      );

      // Combinar e ordenar por data de criação
      const allMatches = [...manualMatches, ...battlefyMatches];
      allMatches.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.importedAt);
        const dateB = new Date(b.createdAt || b.importedAt);
        return dateB - dateA;
      });

      return allMatches;
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      throw error;
    }
  }

  // Buscar partida por ID
  async getMatchById(matchId) {
    try {
      const docRef = doc(this.firestore, this.collectionName, matchId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Partida não encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar partida:', error);
      throw error;
    }
  }

  // Atualizar partida
  async updateMatch(matchId, updateData) {
    try {
      const docRef = doc(this.firestore, this.collectionName, matchId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar partida:', error);
      throw error;
    }
  }

  // Deletar partida
  async deleteMatch(matchId) {
    try {
      const docRef = doc(this.firestore, this.collectionName, matchId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Erro ao deletar partida:', error);
      throw error;
    }
  }

  // Atualizar partida do Battlefy
  async updateBattlefyMatch(matchId, updateData) {
    try {
      const docRef = doc(this.firestore, 'battlefy_matches', matchId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar partida do Battlefy:', error);
      throw error;
    }
  }

  // Deletar partida do Battlefy
  async deleteBattlefyMatch(matchId) {
    try {
      const docRef = doc(this.firestore, 'battlefy_matches', matchId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Erro ao deletar partida do Battlefy:', error);
      throw error;
    }
  }

  // Atualizar partida (detecta automaticamente a origem)
  async updateMatchAuto(matchId, updateData, source) {
    try {
      if (source === 'battlefy') {
        return await this.updateBattlefyMatch(matchId, updateData);
      } else {
        return await this.updateMatch(matchId, updateData);
      }
    } catch (error) {
      console.error('Erro ao atualizar partida:', error);
      throw error;
    }
  }

  // Deletar partida (detecta automaticamente a origem)
  async deleteMatchAuto(matchId, source) {
    try {
      if (source === 'battlefy') {
        return await this.deleteBattlefyMatch(matchId);
      } else {
        return await this.deleteMatch(matchId);
      }
    } catch (error) {
      console.error('Erro ao deletar partida:', error);
      throw error;
    }
  }

  // Buscar partidas por torneio (incluindo do Battlefy)
  async getMatchesByTournament(tournamentId) {
    try {
      // Buscar partidas manuais por torneio
      const manualMatchesSnapshot = await getDocs(
        query(
          collection(this.firestore, this.collectionName),
          where('tournamentId', '==', tournamentId),
          orderBy('scheduledDate', 'asc')
        )
      );
      
      const manualMatches = manualMatchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'manual'
      }));

      // Buscar partidas do Battlefy por torneio
      const battlefyMatchesSnapshot = await getDocs(
        query(
          collection(this.firestore, 'battlefy_matches'),
          where('tournamentId', '==', tournamentId),
          orderBy('importedAt', 'desc')
        )
      );
      
      const battlefyMatches = await Promise.all(
        battlefyMatchesSnapshot.docs.map(doc => mapBattlefyMatch(doc, this.firestore))
      );

      // Combinar e ordenar
      const allMatches = [...manualMatches, ...battlefyMatches];
      allMatches.sort((a, b) => {
        const dateA = new Date(a.scheduledDate || a.startTime);
        const dateB = new Date(b.scheduledDate || b.startTime);
        return dateA - dateB;
      });

      return allMatches;
    } catch (error) {
      console.error('Erro ao buscar partidas do torneio:', error);
      throw error;
    }
  }

  // Buscar partidas por status
  async getMatchesByStatus(status) {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('status', '==', status),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar partidas por status:', error);
      throw error;
    }
  }

  // Listener em tempo real para partidas
  subscribeToMatches(callback, filters = {}) {
    try {
      let q = collection(this.firestore, this.collectionName);
      
      if (filters.tournamentId) {
        q = query(q, where('tournamentId', '==', filters.tournamentId));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('scheduledDate', 'asc'));
      
      return onSnapshot(q, (querySnapshot) => {
        const matches = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(matches);
      });
    } catch (error) {
      console.error('Erro ao configurar listener de partidas:', error);
      throw error;
    }
  }

  // Atualizar resultado da partida
  async updateMatchResult(matchId, result) {
    try {
      const docRef = doc(this.firestore, this.collectionName, matchId);
      await updateDoc(docRef, {
        result,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar resultado:', error);
      throw error;
    }
  }

  // Marcar partida como destaque
  async toggleMatchFeatured(matchId, isFeatured) {
    try {
      const docRef = doc(this.firestore, this.collectionName, matchId);
      await updateDoc(docRef, {
        isFeatured,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar destaque da partida:', error);
      throw error;
    }
  }
}

// Instância singleton
let firebaseMatchService = null;

export const getFirebaseMatchService = (firestore) => {
  if (!firebaseMatchService && firestore) {
    firebaseMatchService = new FirebaseMatchService(firestore);
  }
  return firebaseMatchService;
};

export { FirebaseMatchService };
export default firebaseMatchService;