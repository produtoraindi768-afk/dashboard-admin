import { useState, useEffect, useCallback, useMemo } from 'react';
import { FirebaseNewsService } from '../services/firebaseNewsService';

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    published: 0,
    drafts: 0
  });

  // Carregar todas as notícias
  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await FirebaseNewsService.getAllNews();
      if (response.success) {
        setNews(response.data);
      } else {
        setError(response.error || 'Erro ao carregar notícias');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar notícias');
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStatistics = useCallback(async () => {
    try {
      const response = await FirebaseNewsService.getNewsStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  // Criar nova notícia
  const createNews = useCallback(async (newsData) => {
    try {
      setError(null);
      const response = await FirebaseNewsService.createNews(newsData);
      if (response.success) {
        await loadNews();
        await loadStatistics();
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao criar notícia';
      setError(errorMsg);
      console.error('Erro ao criar notícia:', err);
      return { success: false, error: errorMsg };
    }
  }, [loadNews, loadStatistics]);

  // Atualizar notícia
  const updateNews = useCallback(async (id, updates) => {
    try {
      setError(null);
      const response = await FirebaseNewsService.updateNews(id, updates);
      if (response.success) {
        await loadNews();
        await loadStatistics();
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao atualizar notícia';
      setError(errorMsg);
      console.error('Erro ao atualizar notícia:', err);
      return { success: false, error: errorMsg };
    }
  }, [loadNews, loadStatistics]);

  // Excluir notícia
  const deleteNews = useCallback(async (id) => {
    try {
      setError(null);
      const response = await FirebaseNewsService.deleteNews(id);
      if (response.success) {
        await loadNews();
        await loadStatistics();
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao excluir notícia';
      setError(errorMsg);
      console.error('Erro ao excluir notícia:', err);
      return { success: false, error: errorMsg };
    }
  }, [loadNews, loadStatistics]);

  // Buscar notícias
  const searchNews = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await FirebaseNewsService.searchNews(query);
      if (response.success) {
        setNews(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Erro ao buscar notícias');
      console.error('Erro ao buscar notícias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar por status
  const filterByStatus = useCallback(async (status) => {
    try {
      setLoading(true);
      setError(null);
      if (status === 'all') {
        await loadNews();
      } else {
        const response = await FirebaseNewsService.getNewsByStatus(status);
        if (response.success) {
          setNews(response.data);
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      setError('Erro ao filtrar notícias');
      console.error('Erro ao filtrar notícias:', err);
    } finally {
      setLoading(false);
    }
  }, [loadNews]);

  // Obter notícia por ID
  const getNewsById = useCallback(async (id) => {
    try {
      const response = await FirebaseNewsService.getNewsById(id);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Erro ao obter notícia:', err);
      return { success: false, error: 'Erro ao obter notícia' };
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadNews();
    loadStatistics();
  }, [loadNews, loadStatistics]);

  // Memoizar valores computados
  const publishedNews = useMemo(() => {
    return news.filter(item => item.status === 'published');
  }, [news]);

  const draftNews = useMemo(() => {
    return news.filter(item => item.status === 'draft');
  }, [news]);

  return {
    news,
    publishedNews,
    draftNews,
    loading,
    error,
    statistics,
    createNews,
    updateNews,
    deleteNews,
    searchNews,
    filterByStatus,
    getNewsById,
    loadNews,
    loadStatistics
  };
};

export default useNews;