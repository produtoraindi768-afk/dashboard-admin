// Serviço para gerenciar equipes e torneios usando Firebase Firestore
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
  limit
} from 'firebase/firestore';

// Nomes das coleções no Firestore
const TEAMS_COLLECTION = 'teams';
const TOURNAMENTS_COLLECTION = 'tournaments';

// Variável para armazenar a instância do Firestore
let firestoreInstance = null;

// Função para definir a instância do Firestore
export const setFirestoreInstance = (db) => {
  firestoreInstance = db;
};

// Função para obter a instância do Firestore
const getFirestore = () => {
  if (!firestoreInstance) {
    throw new Error('Firestore não inicializado. Configure o Firebase primeiro.');
  }
  return firestoreInstance;
};

// Opções predefinidas
export const GAMES = [
  'League of Legends',
  'Counter-Strike 2',
  'Valorant',
  'Dota 2',
  'Overwatch 2',
  'Rocket League',
  'Fortnite',
  'Apex Legends',
  'Rainbow Six Siege',
  'FIFA 24',
  'Call of Duty',
  'Free Fire',
  'Mobile Legends',
  'Outro'
];

export const REGIONS = [
  'Brasil',
  'América do Norte',
  'América do Sul',
  'Europa',
  'Ásia',
  'Oceania',
  'África',
  'Global'
];

export const TOURNAMENT_FORMATS = [
  'Eliminação Simples',
  'Eliminação Dupla',
  'Round Robin',
  'Swiss',
  'Liga',
  'Playoffs',
  'Battle Royale',
  'Outro'
];

export const TOURNAMENT_STATUS = [
  'Inscrições Abertas',
  'Inscrições Fechadas',
  'Em Andamento',
  'Finalizado',
  'Cancelado',
  'Adiado'
];

export const TEAM_STATUS = [
  'Ativo',
  'Inativo',
  'Procurando Jogadores',
  'Dissolvido'
];

// Estrutura de dados para uma equipe
export const createTeam = (data) => ({
  name: data.name || '',
  tag: data.tag || '',
  game: data.game || '',
  region: data.region || '',
  description: data.description || '',
  avatar: data.avatar || '',
  captain: data.captain || '',
  members: data.members || [],
  contactEmail: data.contactEmail || '',
  discordServer: data.discordServer || '',
  status: data.status || 'Ativo',
  isActive: data.isActive !== undefined ? data.isActive : true,
  achievements: data.achievements || [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

// Estrutura de dados para um torneio
export const createTournament = (data) => ({
  name: data.name || '',
  game: data.game || '',
  format: data.format || '',
  region: data.region || '',
  description: data.description || '',
  bannerUrl: data.bannerUrl || '',
  organizer: data.organizer || '',
  maxTeams: data.maxTeams || 16,
  registeredTeams: data.registeredTeams || [],
  prizePool: data.prizePool || '',
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  registrationDeadline: data.registrationDeadline || null,
  rules: data.rules || '',
  contactEmail: data.contactEmail || '',
  discordServer: data.discordServer || '',
  status: data.status || 'Inscrições Abertas',
  isActive: data.isActive !== undefined ? data.isActive : true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

class FirebaseTeamService {
  constructor() {
    this.unsubscribers = new Map();
  }

  initialize(db) {
    setFirestoreInstance(db);
  }

  getTeamsCollectionRef() {
    const db = getFirestore();
    return collection(db, TEAMS_COLLECTION);
  }

  getTournamentsCollectionRef() {
    const db = getFirestore();
    return collection(db, TOURNAMENTS_COLLECTION);
  }

  // ===== MÉTODOS PARA EQUIPES =====

  async getAllTeams() {
    try {
      if (!firestoreInstance) {
        // Fallback para localStorage
        const localData = localStorage.getItem('teams');
        if (localData) {
          return JSON.parse(localData);
        }
        // Dados de exemplo se não houver dados locais
        return [
          {
            id: '1',
            name: 'Team Exemplo',
            tag: 'EX',
            game: 'League of Legends',
            region: 'Brasil',
            description: 'Equipe de exemplo',
            members: ['Jogador1', 'Jogador2', 'Jogador3', 'Jogador4', 'Jogador5'],
            captain: 'Jogador1',
            contactEmail: 'contato@teamexemplo.com',
            discordServer: '',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      const teamsRef = this.getTeamsCollectionRef();
      const q = query(teamsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      throw error;
    }
  }

  async getTeamById(id) {
    try {
      const db = getFirestore();
      const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, id));
      
      if (teamDoc.exists()) {
        return {
          id: teamDoc.id,
          ...teamDoc.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      throw error;
    }
  }

  async addTeam(teamData) {
    try {
      const teamsRef = this.getTeamsCollectionRef();
      const team = createTeam(teamData);
      const docRef = await addDoc(teamsRef, team);
      
      return {
        id: docRef.id,
        ...team
      };
    } catch (error) {
      console.error('Erro ao adicionar equipe:', error);
      throw error;
    }
  }

  async updateTeam(id, updates) {
    try {
      const db = getFirestore();
      const teamRef = doc(db, TEAMS_COLLECTION, id);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(teamRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      throw error;
    }
  }

  async deleteTeam(id) {
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, TEAMS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      throw error;
    }
  }

  async getTeamsByGame(game) {
    try {
      const teamsRef = this.getTeamsCollectionRef();
      const q = query(
        teamsRef, 
        where('game', '==', game),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar equipes por jogo:', error);
      throw error;
    }
  }

  async getTeamsByRegion(region) {
    try {
      const teamsRef = this.getTeamsCollectionRef();
      const q = query(
        teamsRef, 
        where('region', '==', region),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar equipes por região:', error);
      throw error;
    }
  }

  // ===== MÉTODOS PARA TORNEIOS =====

  async getAllTournaments() {
    try {
      if (!firestoreInstance) {
        // Fallback para localStorage
        const localData = localStorage.getItem('tournaments');
        if (localData) {
          return JSON.parse(localData);
        }
        // Dados de exemplo se não houver dados locais
        return [
          {
            id: '1',
            name: 'Torneio Exemplo',
            game: 'League of Legends',
            format: 'Eliminação Simples',
            maxTeams: 16,
            registeredTeams: 0,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            prizePool: 'R$ 1.000',
            description: 'Torneio de exemplo para demonstração',
            rules: 'Regras padrão do jogo',
            status: 'Inscrições Abertas',
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      const tournamentsRef = this.getTournamentsCollectionRef();
      const q = query(tournamentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar torneios:', error);
      throw error;
    }
  }

  async getTournamentById(id) {
    try {
      const db = getFirestore();
      const tournamentDoc = await getDoc(doc(db, TOURNAMENTS_COLLECTION, id));
      
      if (tournamentDoc.exists()) {
        return {
          id: tournamentDoc.id,
          ...tournamentDoc.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar torneio:', error);
      throw error;
    }
  }

  async addTournament(tournamentData) {
    try {
      const tournamentsRef = this.getTournamentsCollectionRef();
      const tournament = createTournament(tournamentData);
      const docRef = await addDoc(tournamentsRef, tournament);
      
      return {
        id: docRef.id,
        ...tournament
      };
    } catch (error) {
      console.error('Erro ao adicionar torneio:', error);
      throw error;
    }
  }

  async updateTournament(id, updates) {
    try {
      const db = getFirestore();
      const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, id);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(tournamentRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Erro ao atualizar torneio:', error);
      throw error;
    }
  }

  async deleteTournament(id) {
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar torneio:', error);
      throw error;
    }
  }

  async getTournamentsByGame(game) {
    try {
      const tournamentsRef = this.getTournamentsCollectionRef();
      const q = query(
        tournamentsRef, 
        where('game', '==', game),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar torneios por jogo:', error);
      throw error;
    }
  }

  async getTournamentsByStatus(status) {
    try {
      const tournamentsRef = this.getTournamentsCollectionRef();
      const q = query(
        tournamentsRef, 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar torneios por status:', error);
      throw error;
    }
  }

  async getUpcomingTournaments() {
    try {
      const tournamentsRef = this.getTournamentsCollectionRef();
      const now = new Date();
      const q = query(
        tournamentsRef,
        where('startDate', '>', now),
        orderBy('startDate', 'asc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar próximos torneios:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE ESTATÍSTICAS =====

  async getTeamStatistics() {
    try {
      const teams = await this.getAllTeams();
      
      const stats = {
        total: teams.length,
        byGame: {},
        byRegion: {},
        byStatus: {},
        recent: teams.slice(0, 5)
      };

      teams.forEach(team => {
        // Por jogo
        stats.byGame[team.game] = (stats.byGame[team.game] || 0) + 1;
        
        // Por região
        stats.byRegion[team.region] = (stats.byRegion[team.region] || 0) + 1;
        
        // Por status
        stats.byStatus[team.status] = (stats.byStatus[team.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas de equipes:', error);
      throw error;
    }
  }

  async getTournamentStatistics() {
    try {
      const tournaments = await this.getAllTournaments();
      
      const stats = {
        total: tournaments.length,
        byGame: {},
        byStatus: {},
        byFormat: {},
        upcoming: await this.getUpcomingTournaments()
      };

      tournaments.forEach(tournament => {
        // Por jogo
        stats.byGame[tournament.game] = (stats.byGame[tournament.game] || 0) + 1;
        
        // Por status
        stats.byStatus[tournament.status] = (stats.byStatus[tournament.status] || 0) + 1;
        
        // Por formato
        stats.byFormat[tournament.format] = (stats.byFormat[tournament.format] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas de torneios:', error);
      throw error;
    }
  }

  async getCombinedStatistics() {
    try {
      const [teamStats, tournamentStats] = await Promise.all([
        this.getTeamStatistics(),
        this.getTournamentStatistics()
      ]);

      return {
        teams: teamStats,
        tournaments: tournamentStats,
        summary: {
          totalTeams: teamStats.total,
          totalTournaments: tournamentStats.total,
          activeTournaments: tournamentStats.byStatus['Em Andamento'] || 0,
          upcomingTournaments: tournamentStats.upcoming.length
        }
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas combinadas:', error);
      throw error;
    }
  }

  // ===== LISTENERS EM TEMPO REAL =====

  onTeamsChange(callback) {
    try {
      const teamsRef = this.getTeamsCollectionRef();
      const q = query(teamsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const teams = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(teams);
      });

      this.unsubscribers.set('teams', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener de equipes:', error);
      throw error;
    }
  }

  onTournamentsChange(callback) {
    try {
      const tournamentsRef = this.getTournamentsCollectionRef();
      const q = query(tournamentsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tournaments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(tournaments);
      });

      this.unsubscribers.set('tournaments', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener de torneios:', error);
      throw error;
    }
  }

  // Limpar todos os listeners
  cleanup() {
    this.unsubscribers.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribers.clear();
  }
}

// Instância singleton do serviço
export const firebaseTeamService = new FirebaseTeamService();

// API simplificada para uso direto
export const firebaseTeamAPI = {
  // Equipes
  getTeams: async (filters = {}) => {
    if (filters.game) {
      return await firebaseTeamService.getTeamsByGame(filters.game);
    }
    if (filters.region) {
      return await firebaseTeamService.getTeamsByRegion(filters.region);
    }
    return await firebaseTeamService.getAllTeams();
  },

  getTeam: async (id) => {
    return await firebaseTeamService.getTeamById(id);
  },

  createTeam: async (data) => {
    return await firebaseTeamService.addTeam(data);
  },

  updateTeam: async (id, data) => {
    return await firebaseTeamService.updateTeam(id, data);
  },

  deleteTeam: async (id) => {
    return await firebaseTeamService.deleteTeam(id);
  },

  // Torneios
  getTournaments: async (filters = {}) => {
    if (filters.game) {
      return await firebaseTeamService.getTournamentsByGame(filters.game);
    }
    if (filters.status) {
      return await firebaseTeamService.getTournamentsByStatus(filters.status);
    }
    return await firebaseTeamService.getAllTournaments();
  },

  getTournament: async (id) => {
    return await firebaseTeamService.getTournamentById(id);
  },

  createTournament: async (data) => {
    return await firebaseTeamService.addTournament(data);
  },

  updateTournament: async (id, data) => {
    return await firebaseTeamService.updateTournament(id, data);
  },

  deleteTournament: async (id) => {
    return await firebaseTeamService.deleteTournament(id);
  },

  // Estatísticas
  getStatistics: async () => {
    return await firebaseTeamService.getCombinedStatistics();
  }
};

export default firebaseTeamService;