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

  // Buscar todas as partidas
  async getAllMatches() {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.firestore, this.collectionName),
          orderBy('createdAt', 'desc')
        )
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

  // Buscar partidas por torneio
  async getMatchesByTournament(tournamentId) {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tournamentId', '==', tournamentId),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
        status: 'finished',
        finishedAt: serverTimestamp(),
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