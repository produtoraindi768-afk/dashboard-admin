import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Edit,
  Search,
  Filter
} from 'lucide-react';
import { useFirebaseTeams } from '../hooks/useFirebaseTeams';
import { GAMES, REGIONS } from '../services/firebaseTeamService';
import { formatDate, formatRelativeTime, generateDefaultAvatar } from '../utils/formatters';

const TeamRegistration = () => {
  const { teams, loading, error, addTeam, updateTeam, deleteTeam, toggleRealTime } = useFirebaseTeams();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: '',
    region: '',
    description: '',
    members: [''],
    captain: '',
    contactEmail: '',
    discordServer: '',
    avatar: '',
    isActive: true
  });
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  // Ativar tempo real quando o componente monta
  useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);

  // Limpar mensagens após 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filtrar equipes
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = !filterGame || filterGame === 'all' || team.game === filterGame;
    const matchesRegion = !filterRegion || filterRegion === 'all' || team.region === filterRegion;
    return matchesSearch && matchesGame && matchesRegion;
  });

  // Manipular mudanças no formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manipular membros da equipe
  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMember = () => {
    setFormData(prev => ({ ...prev, members: [...prev.members, ''] }));
  };

  const removeMember = (index) => {
    if (formData.members.length > 1) {
      const newMembers = formData.members.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, members: newMembers }));
    }
  };

  // Validar formulário
  const validateForm = () => {
    if (!formData.name.trim()) return 'Nome da equipe é obrigatório';
    if (!formData.tag.trim()) return 'Tag da equipe é obrigatória';
    if (!formData.game) return 'Jogo é obrigatório';
    if (!formData.region) return 'Região é obrigatória';
    if (!formData.captain.trim()) return 'Capitão é obrigatório';
    if (!formData.contactEmail.trim()) return 'Email de contato é obrigatório';
    if (formData.members.filter(m => m.trim()).length === 0) return 'Pelo menos um membro é obrigatório';
    return null;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitLoading(true);
    
    try {
      const teamData = {
        ...formData,
        members: formData.members.filter(m => m.trim()),
        tag: formData.tag.toUpperCase()
      };

      if (editingId) {
        await updateTeam(editingId, teamData);
        setSuccessMessage('Equipe atualizada com sucesso!');
      } else {
        await addTeam(teamData);
        setSuccessMessage('Equipe cadastrada com sucesso!');
      }
      
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar equipe:', err);
      alert('Erro ao salvar equipe: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      tag: '',
      game: '',
      region: '',
      description: '',
      members: [''],
      captain: '',
      contactEmail: '',
      discordServer: '',
      avatar: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Editar equipe
  const handleEdit = (team) => {
    setFormData({
      name: team.name || '',
      tag: team.tag || '',
      game: team.game || '',
      region: team.region || '',
      description: team.description || '',
      members: team.members && team.members.length > 0 ? team.members : [''],
      captain: team.captain || '',
      contactEmail: team.contactEmail || '',
      discordServer: team.discordServer || '',
      avatar: team.avatar || '',
      isActive: team.isActive !== false
    });
    setEditingId(team.id);
    setShowForm(true);
  };

  // Deletar equipe
  const handleDelete = async (id, teamName) => {
    if (window.confirm(`Tem certeza que deseja deletar a equipe "${teamName}"?`)) {
      try {
        await deleteTeam(id);
        setSuccessMessage('Equipe deletada com sucesso!');
      } catch (err) {
        alert('Erro ao deletar equipe: ' + err.message);
      }
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando equipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Equipes</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie equipes de esports
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar' : 'Nova Equipe'}
        </Button>
      </div>

      {/* Mensagens */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editingId ? 'Editar Equipe' : 'Nova Equipe'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Atualize as informações da equipe' : 'Preencha os dados para cadastrar uma nova equipe'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Equipe *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Team Alpha"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag da Equipe *</Label>
                  <Input
                    id="tag"
                    value={formData.tag}
                    onChange={(e) => handleInputChange('tag', e.target.value.toUpperCase())}
                    placeholder="Ex: ALPHA"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game">Jogo *</Label>
                  <Select value={formData.game} onValueChange={(value) => handleInputChange('game', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o jogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {GAMES.map((game) => (
                        <SelectItem key={game} value={game}>{game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Região *</Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição da equipe, objetivos, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar da Equipe</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  placeholder="URL da imagem do avatar da equipe"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label>Membros da Equipe *</Label>
                {formData.members.map((member, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder={`Membro ${index + 1}`}
                    />
                    {formData.members.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMember(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addMember}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="captain">Capitão *</Label>
                  <Input
                    id="captain"
                    value={formData.captain}
                    onChange={(e) => handleInputChange('captain', e.target.value)}
                    placeholder="Nome do capitão"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contato *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discordServer">Servidor Discord</Label>
                <Input
                  id="discordServer"
                  value={formData.discordServer}
                  onChange={(e) => handleInputChange('discordServer', e.target.value)}
                  placeholder="https://discord.gg/..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Equipe Ativa
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitLoading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterGame} onValueChange={setFilterGame}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por jogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os jogos</SelectItem>
                {GAMES.map((game) => (
                  <SelectItem key={game} value={game}>{game}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as regiões</SelectItem>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Equipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipes Cadastradas ({filteredTeams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma equipe encontrada</p>
              {!showForm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowForm(true)}
                >
                  Cadastrar Primeira Equipe
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeams.map((team) => {
                const defaultAvatar = generateDefaultAvatar(team.name);
                
                return (
                <div key={team.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.avatar} alt={team.name} />
                      <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor}`}>
                        {defaultAvatar.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{team.name}</h3>
                        <Badge variant="outline">{team.tag}</Badge>
                        <Badge variant={team.isActive !== false ? "default" : "secondary"}>
                          {team.isActive !== false ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground mb-2">
                        <div><strong>Jogo:</strong> {team.game}</div>
                        <div><strong>Região:</strong> {team.region}</div>
                        <div><strong>Capitão:</strong> {team.captain}</div>
                        <div><strong>Membros:</strong> {team.members?.length || 0}</div>
                      </div>
                      
                      {team.description && (
                        <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {team.members?.map((member, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Cadastrada {formatRelativeTime(team.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(team)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(team.id, team.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default TeamRegistration;