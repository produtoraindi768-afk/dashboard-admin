// Serviço para gerenciar streamers usando localStorage
const STORAGE_KEY = 'streamers_data';

// Estrutura de dados para um streamer
export const createStreamer = (data) => ({
  id: Date.now().toString(),
  name: data.name || '',
  platform: data.platform || '',
  streamUrl: data.streamUrl || '',
  avatarUrl: data.avatarUrl || '',
  category: data.category || '',
  isOnline: false,
  isFeatured: false,
  createdAt: new Date().toISOString(),
  lastStatusUpdate: new Date().toISOString(),
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

class StreamerService {
  constructor() {
    this.initializeStorage();
  }

  // Inicializa o localStorage se não existir
  initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }

  // Obtém todos os streamers
  getAllStreamers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return JSON.parse(data) || [];
    } catch (error) {
      console.error('Erro ao carregar streamers:', error);
      return [];
    }
  }

  // Obtém um streamer por ID
  getStreamerById(id) {
    const streamers = this.getAllStreamers();
    return streamers.find(streamer => streamer.id === id);
  }

  // Adiciona um novo streamer
  addStreamer(streamerData) {
    try {
      const streamers = this.getAllStreamers();
      const newStreamer = createStreamer(streamerData);
      streamers.push(newStreamer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(streamers));
      return newStreamer;
    } catch (error) {
      console.error('Erro ao adicionar streamer:', error);
      throw error;
    }
  }

  // Atualiza um streamer existente
  updateStreamer(id, updates) {
    try {
      const streamers = this.getAllStreamers();
      const index = streamers.findIndex(streamer => streamer.id === id);
      
      if (index === -1) {
        throw new Error('Streamer não encontrado');
      }

      streamers[index] = {
        ...streamers[index],
        ...updates,
        lastStatusUpdate: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(streamers));
      return streamers[index];
    } catch (error) {
      console.error('Erro ao atualizar streamer:', error);
      throw error;
    }
  }

  // Remove um streamer
  deleteStreamer(id) {
    try {
      const streamers = this.getAllStreamers();
      const filteredStreamers = streamers.filter(streamer => streamer.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredStreamers));
      return true;
    } catch (error) {
      console.error('Erro ao remover streamer:', error);
      throw error;
    }
  }

  // Atualiza o status online/offline de um streamer
  updateStreamerStatus(id, isOnline) {
    return this.updateStreamer(id, { isOnline });
  }

  // Filtra streamers por status
  getStreamersByStatus(status) {
    const streamers = this.getAllStreamers();
    
    switch (status) {
      case 'online':
        return streamers.filter(streamer => streamer.isOnline);
      case 'offline':
        return streamers.filter(streamer => !streamer.isOnline);
      default:
        return streamers;
    }
  }

  // Filtra streamers por plataforma
  getStreamersByPlatform(platform) {
    const streamers = this.getAllStreamers();
    return streamers.filter(streamer => streamer.platform === platform);
  }

  // Filtra streamers por categoria
  getStreamersByCategory(category) {
    const streamers = this.getAllStreamers();
    return streamers.filter(streamer => streamer.category === category);
  }

  // Busca streamers por nome
  searchStreamers(query) {
    const streamers = this.getAllStreamers();
    const lowercaseQuery = query.toLowerCase();
    
    return streamers.filter(streamer =>
      streamer.name.toLowerCase().includes(lowercaseQuery) ||
      streamer.platform.toLowerCase().includes(lowercaseQuery) ||
      streamer.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Obtém estatísticas dos streamers
  getStatistics() {
    const streamers = this.getAllStreamers();
    
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

  // Exporta dados para JSON
  exportData() {
    return {
      streamers: this.getAllStreamers(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Importa dados de JSON
  importData(data) {
    try {
      if (data.streamers && Array.isArray(data.streamers)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.streamers));
        return true;
      }
      throw new Error('Formato de dados inválido');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  }

  // Limpa todos os dados
  clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.initializeStorage();
  }
}

// Instância singleton do serviço
export const streamerService = new StreamerService();

// API simulada para compatibilidade REST
export const streamerAPI = {
  // GET /api/streamers
  getStreamers: async (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let streamers = streamerService.getAllStreamers();
        
        if (filters.status) {
          streamers = streamerService.getStreamersByStatus(filters.status);
        }
        
        if (filters.platform) {
          streamers = streamers.filter(s => s.platform === filters.platform);
        }
        
        if (filters.category) {
          streamers = streamers.filter(s => s.category === filters.category);
        }
        
        if (filters.search) {
          streamers = streamerService.searchStreamers(filters.search);
        }
        
        resolve({
          data: streamers,
          total: streamers.length,
          timestamp: new Date().toISOString()
        });
      }, 100);
    });
  },

  // GET /api/streamers/:id
  getStreamer: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const streamer = streamerService.getStreamerById(id);
        if (streamer) {
          resolve({ data: streamer });
        } else {
          reject(new Error('Streamer não encontrado'));
        }
      }, 100);
    });
  },

  // POST /api/streamers
  createStreamer: async (data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const streamer = streamerService.addStreamer(data);
          resolve({ data: streamer });
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  },

  // PUT /api/streamers/:id
  updateStreamer: async (id, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const streamer = streamerService.updateStreamer(id, data);
          resolve({ data: streamer });
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  },

  // DELETE /api/streamers/:id
  deleteStreamer: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          streamerService.deleteStreamer(id);
          resolve({ success: true });
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  },

  // GET /api/statistics
  getStatistics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: streamerService.getStatistics(),
          timestamp: new Date().toISOString()
        });
      }, 100);
    });
  }
};

