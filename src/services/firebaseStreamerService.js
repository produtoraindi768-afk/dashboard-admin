// Serviço para gerenciar streamers usando Firebase Firestore
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
  serverTimestamp
} from 'firebase/firestore';

// Nome da coleção no Firestore
const COLLECTION_NAME = 'streamers';

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

// Função para obter a coleção de streamers
const getStreamersCollection = () => {
  const db = getFirestore();
  return collection(db, COLLECTION_NAME);
};

// Estrutura de dados para um streamer
export const createStreamer = (data) => ({
  name: data.name || '',
  platform: data.platform || '',
  streamUrl: data.streamUrl || '',
  avatarUrl: data.avatarUrl || '',
  category: data.category || '',
  isOnline: false,
  isFeatured: false,
  createdAt: serverTimestamp(),
  lastStatusUpdate: serverTimestamp(),
  ...data
});

// Plataformas disponíveis
export const PLATFORMS = [
  'Twitch',
  'YouTube',
  'Kick',
  'Facebook Gaming',
  'TikTok Live',
  'Instagram Live',
  'Outro'
];

// Categorias disponíveis
export const CATEGORIES = [
  'FPS',
  'Just Chatting',
  'MOBA',
  'RPG',
  'Strategy',
  'Sports',
  'Music',
  'Art',
  'IRL',
  'Variety',
  'Outro'
];

class FirebaseStreamerService {
  constructor() {
    // A referência da coleção será obtida dinamicamente
  }

  // Inicializa o serviço com a instância do Firestore
  initialize(db) {
    setFirestoreInstance(db);
  }

  getCollectionRef() {
    return getStreamersCollection();
  }

  // Obtém todos os streamers
  async getAllStreamers() {
    try {
      if (!firestoreInstance) {
        // Fallback para localStorage
        const localData = localStorage.getItem('streamers');
        if (localData) {
          return JSON.parse(localData);
        }
        // Dados de exemplo se não houver dados locais
        return [
          {
            id: '1',
            name: 'Streamer Exemplo',
            platform: 'Twitch',
            streamUrl: 'https://twitch.tv/exemplo',
            avatarUrl: '',
            category: 'FPS',
            isOnline: false,
            createdAt: new Date().toISOString(),
            lastStatusUpdate: new Date().toISOString()
          }
        ];
      }
      
      const collectionRef = this.getCollectionRef();
      const querySnapshot = await getDocs(query(collectionRef, orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao carregar streamers:', error);
      throw error;
    }
  }

  // Obtém um streamer por ID
  async getStreamerById(id) {
    try {
      const db = getFirestore();
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastStatusUpdate: data.lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      } else {
        throw new Error('Streamer não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar streamer:', error);
      throw error;
    }
  }

  // Adiciona um novo streamer
  async addStreamer(streamerData) {
    try {
      const collectionRef = this.getCollectionRef();
      const newStreamer = createStreamer(streamerData);
      const docRef = await addDoc(collectionRef, newStreamer);
      
      // Retorna o streamer criado com o ID
      return {
        id: docRef.id,
        ...newStreamer,
        createdAt: new Date().toISOString(),
        lastStatusUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao adicionar streamer:', error);
      throw error;
    }
  }

  // Atualiza um streamer existente
  async updateStreamer(id, updates) {
    try {
      const db = getFirestore();
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        lastStatusUpdate: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Retorna o streamer atualizado
      return await this.getStreamerById(id);
    } catch (error) {
      console.error('Erro ao atualizar streamer:', error);
      throw error;
    }
  }

  // Remove um streamer
  async deleteStreamer(id) {
    try {
      const db = getFirestore();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Erro ao remover streamer:', error);
      throw error;
    }
  }

  // Atualiza o status online/offline de um streamer
  async updateStreamerStatus(id, isOnline) {
    return this.updateStreamer(id, { isOnline });
  }

  // Filtra streamers por status
  async getStreamersByStatus(status) {
    try {
      const collectionRef = this.getCollectionRef();
      let q;
      
      switch (status) {
        case 'online':
          q = query(collectionRef, where('isOnline', '==', true), orderBy('lastStatusUpdate', 'desc'));
          break;
        case 'offline':
          q = query(collectionRef, where('isOnline', '==', false), orderBy('lastStatusUpdate', 'desc'));
          break;
        default:
          return await this.getAllStreamers();
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao filtrar streamers por status:', error);
      throw error;
    }
  }

  // Filtra streamers por plataforma
  async getStreamersByPlatform(platform) {
    try {
      const collectionRef = this.getCollectionRef();
      const q = query(collectionRef, where('platform', '==', platform), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao filtrar streamers por plataforma:', error);
      throw error;
    }
  }

  // Filtra streamers por categoria
  async getStreamersByCategory(category) {
    try {
      const collectionRef = this.getCollectionRef();
      const q = query(collectionRef, where('category', '==', category), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao filtrar streamers por categoria:', error);
      throw error;
    }
  }

  // Busca streamers por nome (busca textual)
  async searchStreamers(searchTerm) {
    try {
      // Firestore não tem busca full-text nativa, então fazemos busca client-side
      const allStreamers = await this.getAllStreamers();
      const lowercaseQuery = searchTerm.toLowerCase();
      
      return allStreamers.filter(streamer =>
        streamer.name.toLowerCase().includes(lowercaseQuery) ||
        streamer.platform.toLowerCase().includes(lowercaseQuery) ||
        streamer.category.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Erro ao buscar streamers:', error);
      throw error;
    }
  }

  // Obtém estatísticas dos streamers
  async getStatistics() {
    try {
      if (!firestoreInstance) {
        // Fallback para localStorage
        const localData = localStorage.getItem('streamers');
        const streamers = localData ? JSON.parse(localData) : [];
        
        return {
          total: streamers.length,
          online: streamers.filter(s => s.isOnline).length,
          offline: streamers.filter(s => !s.isOnline).length,
          byPlatform: PLATFORMS.reduce((acc, platform) => {
            acc[platform] = streamers.filter(s => s.platform === platform).length;
            return acc;
          }, {}),
          byCategory: CATEGORIES.reduce((acc, category) => {
            acc[category] = streamers.filter(s => s.category === category).length;
            return acc;
          }, {})
        };
      }
      
      const streamers = await this.getAllStreamers();
      
      return {
        total: streamers.length,
        online: streamers.filter(s => s.isOnline).length,
        offline: streamers.filter(s => !s.isOnline).length,
        byPlatform: PLATFORMS.reduce((acc, platform) => {
          acc[platform] = streamers.filter(s => s.platform === platform).length;
          return acc;
        }, {}),
        byCategory: CATEGORIES.reduce((acc, category) => {
          acc[category] = streamers.filter(s => s.category === category).length;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // Escuta mudanças em tempo real
  onStreamersChange(callback) {
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const streamers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      callback(streamers);
    }, (error) => {
      console.error('Erro ao escutar mudanças:', error);
    });
  }

  // Exporta dados para JSON
  async exportData() {
    try {
      const streamers = await this.getAllStreamers();
      return {
        streamers,
        exportedAt: new Date().toISOString(),
        version: '2.0',
        source: 'firebase'
      };
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  // Importa dados para o Firebase
  async importData(data) {
    try {
      if (data.streamers && Array.isArray(data.streamers)) {
        const promises = data.streamers.map(streamer => {
          const { id, ...streamerData } = streamer;
          return this.addStreamer(streamerData);
        });
        
        await Promise.all(promises);
        return true;
      }
      throw new Error('Formato de dados inválido');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
export const firebaseStreamerService = new FirebaseStreamerService();

// API REST compatível com Firebase
export const firebaseStreamerAPI = {
  // GET /api/streamers
  getStreamers: async (filters = {}) => {
    try {
      let streamers;
      
      if (filters.status && filters.status !== 'all') {
        streamers = await firebaseStreamerService.getStreamersByStatus(filters.status);
      } else {
        streamers = await firebaseStreamerService.getAllStreamers();
      }
      
      if (filters.platform) {
        streamers = streamers.filter(s => s.platform === filters.platform);
      }
      
      if (filters.category) {
        streamers = streamers.filter(s => s.category === filters.category);
      }
      
      if (filters.search) {
        const searchResults = await firebaseStreamerService.searchStreamers(filters.search);
        streamers = searchResults;
      }
      
      return {
        data: streamers,
        total: streamers.length,
        timestamp: new Date().toISOString(),
        source: 'firebase'
      };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/streamers/:id
  getStreamer: async (id) => {
    try {
      const streamer = await firebaseStreamerService.getStreamerById(id);
      return { data: streamer };
    } catch (error) {
      throw error;
    }
  },

  // POST /api/streamers
  createStreamer: async (data) => {
    try {
      const streamer = await firebaseStreamerService.addStreamer(data);
      return { data: streamer };
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/streamers/:id
  updateStreamer: async (id, data) => {
    try {
      const streamer = await firebaseStreamerService.updateStreamer(id, data);
      return { data: streamer };
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/streamers/:id
  deleteStreamer: async (id) => {
    try {
      await firebaseStreamerService.deleteStreamer(id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/statistics
  getStatistics: async () => {
    try {
      const stats = await firebaseStreamerService.getStatistics();
      return {
        data: stats,
        timestamp: new Date().toISOString(),
        source: 'firebase'
      };
    } catch (error) {
      throw error;
    }
  }
};

export default firebaseStreamerService;