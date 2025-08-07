// Simulação de API para notícias
let newsData = [
  {
    id: '1',
    title: 'Bem-vindos ao SAFEzone Dashboard',
    content: 'Estamos felizes em apresentar a nova plataforma de gerenciamento de streamers e equipes. Esta é uma notícia de exemplo para demonstrar as funcionalidades do sistema.',
    featuredImage: 'https://via.placeholder.com/600x300/3b82f6/ffffff?text=SAFEzone+News',
    publishDate: '2024-01-15',
    status: 'published',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    title: 'Nova Funcionalidade: Gerenciamento de Times',
    content: 'Agora você pode criar e gerenciar times de esports diretamente no dashboard. Organize seus streamers em equipes e acompanhe o desempenho de cada grupo.',
    featuredImage: 'https://via.placeholder.com/600x300/10b981/ffffff?text=Teams+Update',
    publishDate: '2024-01-20',
    status: 'published',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    id: '3',
    title: 'Próximas Atualizações',
    content: 'Em breve teremos novas funcionalidades incluindo sistema de torneios, estatísticas avançadas e muito mais. Fique ligado!',
    featuredImage: '',
    publishDate: '2024-01-25',
    status: 'draft',
    createdAt: new Date('2024-01-25').toISOString(),
    updatedAt: new Date('2024-01-25').toISOString()
  }
];

// Função para gerar ID único
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Simular delay de rede
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API simulada para notícias
export const newsService = {
  // Obter todas as notícias
  async getAllNews() {
    await delay(300);
    return {
      success: true,
      data: newsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  },

  // Obter notícia por ID
  async getNewsById(id) {
    await delay(200);
    const news = newsData.find(item => item.id === id);
    if (news) {
      return {
        success: true,
        data: news
      };
    }
    return {
      success: false,
      error: 'Notícia não encontrada'
    };
  },

  // Criar nova notícia
  async createNews(newsItem) {
    await delay(400);
    
    // Validação básica
    if (!newsItem.title || !newsItem.content || !newsItem.publishDate) {
      return {
        success: false,
        error: 'Título, conteúdo e data de publicação são obrigatórios'
      };
    }

    const newNews = {
      id: generateId(),
      title: newsItem.title,
      content: newsItem.content,
      featuredImage: newsItem.featuredImage || '',
      publishDate: newsItem.publishDate,
      status: newsItem.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newsData.push(newNews);
    
    return {
      success: true,
      data: newNews
    };
  },

  // Atualizar notícia existente
  async updateNews(id, updates) {
    await delay(400);
    
    const index = newsData.findIndex(item => item.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Notícia não encontrada'
      };
    }

    // Validação básica
    if (updates.title !== undefined && !updates.title) {
      return {
        success: false,
        error: 'Título é obrigatório'
      };
    }
    if (updates.content !== undefined && !updates.content) {
      return {
        success: false,
        error: 'Conteúdo é obrigatório'
      };
    }
    if (updates.publishDate !== undefined && !updates.publishDate) {
      return {
        success: false,
        error: 'Data de publicação é obrigatória'
      };
    }

    const updatedNews = {
      ...newsData[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    newsData[index] = updatedNews;
    
    return {
      success: true,
      data: updatedNews
    };
  },

  // Excluir notícia
  async deleteNews(id) {
    await delay(300);
    
    const index = newsData.findIndex(item => item.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Notícia não encontrada'
      };
    }

    const deletedNews = newsData[index];
    newsData.splice(index, 1);
    
    return {
      success: true,
      data: deletedNews
    };
  },

  // Obter notícias por status
  async getNewsByStatus(status) {
    await delay(250);
    const filteredNews = newsData.filter(item => item.status === status);
    return {
      success: true,
      data: filteredNews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  },

  // Buscar notícias por título
  async searchNews(query) {
    await delay(200);
    const filteredNews = newsData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase())
    );
    return {
      success: true,
      data: filteredNews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  },

  // Obter estatísticas das notícias
  async getNewsStatistics() {
    await delay(150);
    const total = newsData.length;
    const published = newsData.filter(item => item.status === 'published').length;
    const drafts = newsData.filter(item => item.status === 'draft').length;
    
    return {
      success: true,
      data: {
        total,
        published,
        drafts
      }
    };
  }
};

export default newsService;