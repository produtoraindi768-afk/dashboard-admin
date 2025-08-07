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
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Nome da coleção no Firestore
const COLLECTION_NAME = 'news';

/**
 * Serviço Firebase para gerenciamento de notícias
 */
export class FirebaseNewsService {
  /**
   * Busca todas as notícias
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Lista de notícias
   */
  static async getAllNews(options = {}) {
    try {
      const newsCollection = collection(db, COLLECTION_NAME);
      let newsQuery = query(newsCollection, orderBy('createdAt', 'desc'));
      
      // Aplicar filtros se fornecidos
      if (options.status && options.status !== 'all') {
        newsQuery = query(
          newsCollection, 
          where('status', '==', options.status),
          orderBy('createdAt', 'desc')
        );
      }
      
      if (options.limit) {
        newsQuery = query(newsQuery, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(newsQuery);
      const news = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        news.push({
          id: doc.id,
          ...data,
          // Converter timestamps do Firebase para strings
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishDate: data.publishDate || new Date().toISOString().split('T')[0]
        });
      });
      
      return {
        success: true,
        data: news
      };
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícias'
      };
    }
  }
  
  /**
   * Busca uma notícia por ID
   * @param {string} id - ID da notícia
   * @returns {Promise<Object>} Notícia encontrada
   */
  static async getNewsById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            publishDate: data.publishDate || new Date().toISOString().split('T')[0]
          }
        };
      } else {
        return {
          success: false,
          error: 'Notícia não encontrada'
        };
      }
    } catch (error) {
      console.error('Erro ao buscar notícia:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícia'
      };
    }
  }
  
  /**
   * Cria uma nova notícia
   * @param {Object} newsData - Dados da notícia
   * @returns {Promise<Object>} Resultado da operação
   */
  static async createNews(newsData) {
    try {
      // Validação básica
      if (!newsData.title || !newsData.content) {
        return {
          success: false,
          error: 'Título e conteúdo são obrigatórios'
        };
      }
      
      const now = serverTimestamp();
      const docData = {
        title: newsData.title.trim(),
        content: newsData.content.trim(),
        contentHtml: newsData.contentHtml || newsData.content.trim().replace(/\n/g, '<br>'),
        excerpt: newsData.excerpt || newsData.content.trim().substring(0, 200) + '...',
        featuredImage: newsData.featuredImage || '',
        publishDate: newsData.publishDate || new Date().toISOString().split('T')[0],
        status: newsData.status || 'draft',
        author: newsData.author || 'SAFEzone Admin',
        category: newsData.category || 'Geral',
        tags: newsData.tags || [],
        slug: newsData.slug || newsData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        seoTitle: newsData.seoTitle || newsData.title.trim(),
        seoDescription: newsData.seoDescription || newsData.content.trim().substring(0, 160),
        readingTime: Math.ceil(newsData.content.trim().split(' ').length / 200), // Estimativa de tempo de leitura
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...docData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao criar notícia:', error);
      return {
        success: false,
        error: 'Erro ao criar notícia'
      };
    }
  }
  
  /**
   * Atualiza uma notícia existente
   * @param {string} id - ID da notícia
   * @param {Object} newsData - Novos dados da notícia
   * @returns {Promise<Object>} Resultado da operação
   */
  static async updateNews(id, newsData) {
    try {
      // Validação básica
      if (!newsData.title || !newsData.content) {
        return {
          success: false,
          error: 'Título e conteúdo são obrigatórios'
        };
      }
      
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Verificar se o documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Notícia não encontrada'
        };
      }
      
      const updateData = {
        title: newsData.title.trim(),
        content: newsData.content.trim(),
        contentHtml: newsData.contentHtml || newsData.content.trim().replace(/\n/g, '<br>'),
        excerpt: newsData.excerpt || newsData.content.trim().substring(0, 200) + '...',
        featuredImage: newsData.featuredImage || '',
        publishDate: newsData.publishDate || new Date().toISOString().split('T')[0],
        status: newsData.status || 'draft',
        author: newsData.author || 'SAFEzone Admin',
        category: newsData.category || 'Geral',
        tags: newsData.tags || [],
        slug: newsData.slug || newsData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        seoTitle: newsData.seoTitle || newsData.title.trim(),
        seoDescription: newsData.seoDescription || newsData.content.trim().substring(0, 160),
        readingTime: Math.ceil(newsData.content.trim().split(' ').length / 200),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      return {
        success: true,
        data: {
          id,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar notícia:', error);
      return {
        success: false,
        error: 'Erro ao atualizar notícia'
      };
    }
  }
  
  /**
   * Exclui uma notícia
   * @param {string} id - ID da notícia
   * @returns {Promise<Object>} Resultado da operação
   */
  static async deleteNews(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Verificar se o documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Notícia não encontrada'
        };
      }
      
      await deleteDoc(docRef);
      
      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      return {
        success: false,
        error: 'Erro ao excluir notícia'
      };
    }
  }
  
  /**
   * Busca notícias por status
   * @param {string} status - Status das notícias
   * @returns {Promise<Object>} Lista de notícias filtradas
   */
  static async getNewsByStatus(status) {
    return this.getAllNews({ status });
  }
  
  /**
   * Busca notícias por texto (título ou conteúdo)
   * @param {string} searchQuery - Texto de busca
   * @returns {Promise<Object>} Lista de notícias encontradas
   */
  static async searchNews(searchQuery) {
    try {
      if (!searchQuery || !searchQuery.trim()) {
        return this.getAllNews();
      }
      
      // Firebase não suporta busca full-text nativa, então vamos buscar todas e filtrar
      const allNewsResult = await this.getAllNews();
      
      if (!allNewsResult.success) {
        return allNewsResult;
      }
      
      const searchTerm = searchQuery.toLowerCase().trim();
      const filteredNews = allNewsResult.data.filter(news => 
        news.title.toLowerCase().includes(searchTerm) ||
        news.content.toLowerCase().includes(searchTerm)
      );
      
      return {
        success: true,
        data: filteredNews
      };
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return {
        success: false,
        error: 'Erro ao buscar notícias'
      };
    }
  }
  
  /**
   * Obtém estatísticas das notícias
   * @returns {Promise<Object>} Estatísticas
   */
  static async getNewsStatistics() {
    try {
      const allNewsResult = await this.getAllNews();
      
      if (!allNewsResult.success) {
        return {
          success: false,
          error: 'Erro ao carregar estatísticas'
        };
      }
      
      const news = allNewsResult.data;
      const total = news.length;
      const published = news.filter(item => item.status === 'published').length;
      const drafts = news.filter(item => item.status === 'draft').length;
      
      return {
        success: true,
        data: {
          total,
          published,
          drafts
        }
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        success: false,
        error: 'Erro ao carregar estatísticas'
      };
    }
  }
  
  /**
   * Obtém notícias recentes (últimas 10)
   * @returns {Promise<Object>} Lista de notícias recentes
   */
  static async getRecentNews() {
    return this.getAllNews({ limit: 10 });
  }
  
  /**
   * Obtém apenas notícias publicadas
   * @returns {Promise<Object>} Lista de notícias publicadas
   */
  static async getPublishedNews() {
    return this.getNewsByStatus('published');
  }
  
  /**
   * Busca notícias por categoria
   * @param {string} category - Categoria das notícias
   * @returns {Promise<Object>} Lista de notícias da categoria
   */
  static async getNewsByCategory(category) {
    try {
      const newsCollection = collection(db, COLLECTION_NAME);
      const newsQuery = query(
        newsCollection,
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(newsQuery);
      const news = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        news.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishDate: data.publishDate || new Date().toISOString().split('T')[0]
        });
      });
      
      return {
        success: true,
        data: news
      };
    } catch (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícias da categoria'
      };
    }
  }
  
  /**
   * Busca notícias por tag
   * @param {string} tag - Tag das notícias
   * @returns {Promise<Object>} Lista de notícias com a tag
   */
  static async getNewsByTag(tag) {
    try {
      const newsCollection = collection(db, COLLECTION_NAME);
      const newsQuery = query(
        newsCollection,
        where('tags', 'array-contains', tag),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(newsQuery);
      const news = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        news.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishDate: data.publishDate || new Date().toISOString().split('T')[0]
        });
      });
      
      return {
        success: true,
        data: news
      };
    } catch (error) {
      console.error('Erro ao buscar notícias por tag:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícias da tag'
      };
    }
  }
  
  /**
   * Busca notícia por slug (para URLs amigáveis no portal)
   * @param {string} slug - Slug da notícia
   * @returns {Promise<Object>} Notícia encontrada
   */
  static async getNewsBySlug(slug) {
    try {
      const newsCollection = collection(db, COLLECTION_NAME);
      const newsQuery = query(
        newsCollection,
        where('slug', '==', slug),
        where('status', '==', 'published')
      );
      
      const querySnapshot = await getDocs(newsQuery);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Notícia não encontrada'
        };
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        success: true,
        data: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishDate: data.publishDate || new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      console.error('Erro ao buscar notícia por slug:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícia'
      };
    }
  }
  
  /**
   * Obtém todas as categorias disponíveis
   * @returns {Promise<Object>} Lista de categorias
   */
  static async getCategories() {
    try {
      const allNewsResult = await this.getPublishedNews();
      
      if (!allNewsResult.success) {
        return allNewsResult;
      }
      
      const categories = [...new Set(allNewsResult.data.map(news => news.category))]
        .filter(category => category)
        .sort();
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return {
        success: false,
        error: 'Erro ao carregar categorias'
      };
    }
  }
  
  /**
   * Obtém todas as tags disponíveis
   * @returns {Promise<Object>} Lista de tags
   */
  static async getTags() {
    try {
      const allNewsResult = await this.getPublishedNews();
      
      if (!allNewsResult.success) {
        return allNewsResult;
      }
      
      const allTags = allNewsResult.data
        .flatMap(news => news.tags || [])
        .filter(tag => tag);
      
      const uniqueTags = [...new Set(allTags)].sort();
      
      return {
        success: true,
        data: uniqueTags
      };
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      return {
        success: false,
        error: 'Erro ao carregar tags'
      };
    }
  }
  
  /**
   * Endpoint otimizado para portal - retorna dados essenciais para listagem
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Lista otimizada de notícias
   */
  static async getNewsForPortal(options = {}) {
    try {
      const { category, tag, limit: limitCount = 10 } = options;
      
      let newsQuery;
      const newsCollection = collection(db, COLLECTION_NAME);
      
      if (category) {
        newsQuery = query(
          newsCollection,
          where('category', '==', category),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else if (tag) {
        newsQuery = query(
          newsCollection,
          where('tags', 'array-contains', tag),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        newsQuery = query(
          newsCollection,
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(newsQuery);
      const news = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Retorna apenas campos essenciais para o portal
        news.push({
          id: doc.id,
          title: data.title,
          excerpt: data.excerpt,
          featuredImage: data.featuredImage,
          publishDate: data.publishDate,
          author: data.author,
          category: data.category,
          tags: data.tags,
          slug: data.slug,
          readingTime: data.readingTime,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        });
      });
      
      return {
        success: true,
        data: news
      };
    } catch (error) {
      console.error('Erro ao buscar notícias para portal:', error);
      return {
        success: false,
        error: 'Erro ao carregar notícias'
      };
    }
  }
  
  /**
   * Endpoint para detalhes completos de uma notícia no portal
   * @param {string} slug - Slug da notícia
   * @returns {Promise<Object>} Detalhes completos da notícia
   */
  static async getNewsDetailForPortal(slug) {
    try {
      const result = await this.getNewsBySlug(slug);
      
      if (!result.success) {
        return result;
      }
      
      // Retorna todos os campos para exibição completa
      return {
        success: true,
        data: {
          ...result.data,
          // Garante que o contentHtml esteja disponível para renderização
          contentHtml: result.data.contentHtml || result.data.content.replace(/\n/g, '<br>')
        }
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes da notícia:', error);
      return {
        success: false,
        error: 'Erro ao carregar detalhes da notícia'
      };
    }
  }
}

export default FirebaseNewsService;