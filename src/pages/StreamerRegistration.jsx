import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  User, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useFirebaseStreamers } from '../hooks/useFirebaseStreamers';
import { PLATFORMS, CATEGORIES } from '../services/firebaseStreamerService';
import { validateStreamerData, sanitizeStreamerData } from '../utils/validation';
import { 
  formatDate, 
  formatPlatform, 
  formatUrl, 
  generateDefaultAvatar,
  truncateText 
} from '../utils/formatters';

const StreamerRegistration = () => {
  const { streamers, loading, error, addStreamer, updateStreamer, deleteStreamer, toggleRealTime } = useFirebaseStreamers();

  // Ativa tempo real automaticamente quando o componente monta
  React.useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    streamUrl: '',
    avatarUrl: '',
    category: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Limpa mensagens após um tempo
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Atualiza campo do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpa erro do campo quando usuário começa a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Valida e submete formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const sanitizedData = sanitizeStreamerData(formData);
      const validation = validateStreamerData(sanitizedData);

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }

      if (editingId) {
        await updateStreamer(editingId, sanitizedData);
        setSuccessMessage('Streamer atualizado com sucesso!');
        setEditingId(null);
      } else {
        await addStreamer(sanitizedData);
        setSuccessMessage('Streamer cadastrado com sucesso!');
      }

      // Limpa formulário
      setFormData({
        name: '',
        platform: '',
        streamUrl: '',
        avatarUrl: '',
        category: ''
      });
      setShowForm(false);
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inicia edição de streamer
  const handleEdit = (streamer) => {
    setFormData({
      name: streamer.name,
      platform: streamer.platform,
      streamUrl: streamer.streamUrl,
      avatarUrl: streamer.avatarUrl || '',
      category: streamer.category
    });
    setEditingId(streamer.id);
    setFormErrors({});
    setShowForm(true);
  };

  // Cancela edição
  const handleCancelEdit = () => {
    setFormData({
      name: '',
      platform: '',
      streamUrl: '',
      avatarUrl: '',
      category: ''
    });
    setEditingId(null);
    setFormErrors({});
    setShowForm(false);
  };

  // Remove streamer
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este streamer?')) {
      try {
        await deleteStreamer(id);
        setSuccessMessage('Streamer removido com sucesso!');
      } catch (err) {
        setFormErrors({ submit: err.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Streamers</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie streamers do sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar' : 'Novo Streamer'}
        </Button>
      </div>

      {/* Mensagens de sucesso e erro */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulário de Cadastro */}
      {showForm && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Editar Streamer' : 'Novo Streamer'}
          </CardTitle>
          <CardDescription>
            {editingId 
              ? 'Atualize as informações do streamer' 
              : 'Preencha os dados para cadastrar um novo streamer'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Streamer *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite o nome do streamer"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Plataforma */}
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma *</Label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(value) => handleInputChange('platform', value)}
                >
                  <SelectTrigger className={formErrors.platform ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.platform && (
                  <p className="text-sm text-red-600">{formErrors.platform}</p>
                )}
              </div>

              {/* URL da Stream */}
              <div className="space-y-2">
                <Label htmlFor="streamUrl">URL da Stream *</Label>
                <Input
                  id="streamUrl"
                  type="url"
                  value={formData.streamUrl}
                  onChange={(e) => handleInputChange('streamUrl', e.target.value)}
                  placeholder="https://..."
                  className={formErrors.streamUrl ? 'border-red-500' : ''}
                />
                {formErrors.streamUrl && (
                  <p className="text-sm text-red-600">{formErrors.streamUrl}</p>
                )}
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-600">{formErrors.category}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="avatarUrl">URL do Avatar (opcional)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                  placeholder="https://..."
                  className={formErrors.avatarUrl ? 'border-red-500' : ''}
                />
                {formErrors.avatarUrl && (
                  <p className="text-sm text-red-600">{formErrors.avatarUrl}</p>
                )}
              </div>
            </div>

            {/* Erro de submissão */}
            {formErrors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Atualizar' : 'Cadastrar'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Lista de Streamers */}
      <Card>
        <CardHeader>
          <CardTitle>Streamers Cadastrados</CardTitle>
          <CardDescription>
            {streamers.length} streamer{streamers.length !== 1 ? 's' : ''} cadastrado{streamers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : streamers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum streamer cadastrado ainda</p>
              <p className="text-sm">Use o formulário acima para adicionar o primeiro streamer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {streamers.map((streamer) => {
                const platformInfo = formatPlatform(streamer.platform);
                const defaultAvatar = generateDefaultAvatar(streamer.name);
                
                return (
                  <div key={streamer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={streamer.avatarUrl} alt={streamer.name} />
                        <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor}`}>
                          {defaultAvatar.initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{streamer.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={platformInfo.color}>
                                {platformInfo.name}
                              </Badge>
                              <Badge variant="outline">
                                {streamer.category}
                              </Badge>
                              <Badge variant={streamer.isOnline ? "default" : "secondary"}>
                                {streamer.isOnline ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(streamer.streamUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(streamer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(streamer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>URL: {formatUrl(streamer.streamUrl)}</p>
                          <p>Cadastrado em: {formatDate(streamer.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamerRegistration;

