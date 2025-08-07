import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { formatDate } from '../utils/formatters';

const NewsPage = () => {
  const {
    news,
    loading,
    error,
    statistics,
    createNews,
    updateNews,
    deleteNews,
    searchNews,
    filterByStatus,
    loadNews
  } = useNews();

  // Estados do formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contentHtml: '',
    excerpt: '',
    author: '',
    category: '',
    tags: [],
    slug: '',
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    readingTime: 5,
    status: 'draft',
    publishDate: new Date().toISOString().split('T')[0]
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados de filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  // Estados de visualização
  const [viewingNews, setViewingNews] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      content: '',
      contentHtml: '',
      excerpt: '',
      author: '',
      category: '',
      tags: [],
      slug: '',
      featuredImage: '',
      seoTitle: '',
      seoDescription: '',
      readingTime: 5,
      status: 'draft',
      publishDate: new Date().toISOString().split('T')[0]
    });
    setEditingNews(null);
    setFormError('');
  }, []);

  // Abrir formulário para criação
  const handleCreate = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  // Abrir formulário para edição
  const handleEdit = useCallback((newsItem) => {
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      contentHtml: newsItem.contentHtml || '',
      excerpt: newsItem.excerpt || '',
      author: newsItem.author || '',
      category: newsItem.category || '',
      tags: newsItem.tags || [],
      slug: newsItem.slug || '',
      featuredImage: newsItem.featuredImage || '',
      seoTitle: newsItem.seoTitle || '',
      seoDescription: newsItem.seoDescription || '',
      readingTime: newsItem.readingTime || 5,
      status: newsItem.status,
      publishDate: newsItem.publishDate
    });
    setEditingNews(newsItem);
    setFormError('');
    setIsFormOpen(true);
  }, []);

  // Submeter formulário
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('Título e conteúdo são obrigatórios');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      let result;
      if (editingNews) {
        result = await updateNews(editingNews.id, formData);
      } else {
        result = await createNews(formData);
      }

      if (result.success) {
        setIsFormOpen(false);
        resetForm();
      } else {
        setFormError(result.error || 'Erro ao salvar notícia');
      }
    } catch (err) {
      setFormError('Erro inesperado ao salvar notícia');
    } finally {
      setFormLoading(false);
    }
  }, [formData, editingNews, createNews, updateNews, resetForm]);

  // Excluir notícia
  const handleDelete = useCallback(async (id) => {
    const result = await deleteNews(id);
    if (result.success) {
      setDeleteConfirm(null);
    }
  }, [deleteNews]);

  // Buscar notícias
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      await loadNews();
      return;
    }

    setIsSearching(true);
    await searchNews(searchQuery);
    setIsSearching(false);
  }, [searchQuery, searchNews, loadNews]);

  // Filtrar por status
  const handleStatusFilter = useCallback(async (status) => {
    setStatusFilter(status);
    await filterByStatus(status);
  }, [filterByStatus]);

  // Limpar busca
  const handleClearSearch = useCallback(async () => {
    setSearchQuery('');
    setStatusFilter('all');
    await loadNews();
  }, [loadNews]);

  // Notícias filtradas para exibição
  const displayedNews = useMemo(() => {
    return news || [];
  }, [news]);

  // Função para obter cor do status
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // Função para obter ícone do status
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-3 w-3" />;
      case 'draft':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  }, []);

  if (loading && !news.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando notícias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notícias</h1>
          <p className="text-muted-foreground">
            Gerencie notícias e novidades da plataforma
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Notícia
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              Total de notícias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.published}</div>
            <p className="text-xs text-muted-foreground">
              Visíveis publicamente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.drafts}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando publicação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título ou conteúdo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicadas</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                variant="outline"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleClearSearch} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagem de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Notícias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedNews.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma notícia encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando sua primeira notícia'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Notícia
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          displayedNews.map((newsItem) => (
            <Card key={newsItem.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Imagem no topo com tamanho fixo */}
              {newsItem.featuredImage ? (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={newsItem.featuredImage} 
                    alt={newsItem.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2">{newsItem.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(newsItem.status)} flex items-center gap-1 shrink-0`}
                      >
                        {getStatusIcon(newsItem.status)}
                        {newsItem.status === 'published' ? 'Publicada' : 'Rascunho'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(newsItem.createdAt)}
                      </span>
                      {newsItem.author && (
                        <span className="flex items-center gap-1">
                          por {newsItem.author}
                        </span>
                      )}
                      {newsItem.category && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {newsItem.category}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingNews(newsItem)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(newsItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(newsItem)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3 mb-3">
                  {newsItem.excerpt || newsItem.content}
                </p>
                
                {newsItem.tags && newsItem.tags.length > 0 && (
                  <div className="mb-3">
                    {newsItem.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-1 mb-1">
                        #{tag}
                      </span>
                    ))}
                    {newsItem.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{newsItem.tags.length - 3} mais</span>
                    )}
                  </div>
                )}
                
                {newsItem.readingTime && (
                  <div className="text-xs text-muted-foreground">
                    {newsItem.readingTime} min de leitura
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
            </DialogTitle>
            <DialogDescription>
              {editingNews 
                ? 'Atualize as informações da notícia'
                : 'Preencha os dados para criar uma nova notícia'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da notícia"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo/Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Breve descrição da notícia para listagens"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo da notícia"
                rows={8}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Imagem de Destaque (URL)</Label>
              <Input
                id="featuredImage"
                type="url"
                value={formData.featuredImage}
                onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Nome do autor"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Esports, Streaming, Tecnologia"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags ? formData.tags.join(', ') : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  placeholder="Ex: twitch, youtube, gaming"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL amigável)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="Ex: nova-funcionalidade-streaming"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="featuredImage">URL da Imagem Destacada</Label>
              <Input
                id="featuredImage"
                type="url"
                value={formData.featuredImage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishDate">Data de Publicação *</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contentHtml">Conteúdo HTML (para estilização no portal)</Label>
              <Textarea
                id="contentHtml"
                value={formData.contentHtml || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contentHtml: e.target.value }))}
                placeholder="Conteúdo com formatação HTML para o portal..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Use HTML para formatação rica (ex: &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, etc.)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">Título SEO</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Título otimizado para SEO"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="readingTime">Tempo de Leitura (min)</Label>
                <Input
                  id="readingTime"
                  type="number"
                  value={formData.readingTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, readingTime: parseInt(e.target.value) || 0 }))}
                  placeholder="5"
                  min="1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seoDescription">Descrição SEO</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Descrição otimizada para mecanismos de busca"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  editingNews ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={!!viewingNews} onOpenChange={() => setViewingNews(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingNews && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <DialogTitle className="text-xl">{viewingNews.title}</DialogTitle>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(viewingNews.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(viewingNews.status)}
                    {viewingNews.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
                <DialogDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Publicação: {formatDate(viewingNews.publishDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Criada: {formatDate(viewingNews.createdAt)}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {viewingNews.featuredImage && (
                  <img 
                    src={viewingNews.featuredImage} 
                    alt={viewingNews.title}
                    className="w-full h-64 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {viewingNews.content}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a notícia "{deleteConfirm?.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(deleteConfirm.id)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsPage;