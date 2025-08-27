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
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { useFirebaseTeams } from '../hooks/useFirebaseTeams';
import { GAMES, REGIONS } from '../services/firebaseTeamService';
import { formatDate, formatRelativeTime, generateDefaultAvatar } from '../utils/formatters';

const TeamManagement = () => {
  const { teams, loading, error, updateTeam, deleteTeam, toggleRealTime } = useFirebaseTeams();
  
  // Estados
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    const matchesSearch = team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.captain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = !filterGame || filterGame === 'all' || team.game === filterGame;
    const matchesRegion = !filterRegion || filterRegion === 'all' || team.region === filterRegion;
    const matchesStatus = !filterStatus || filterStatus === 'all' || 
      (filterStatus === 'active' && team.isActive !== false) ||
      (filterStatus === 'inactive' && team.isActive === false);
    return matchesSearch && matchesGame && matchesRegion && matchesStatus;
  });

  // Iniciar edição
  const startEdit = (team) => {
    setEditingTeam(team.id);
    setFormData({
      name: team.name || '',
      tag: team.tag || '',
      game: team.game || '',
      region: team.region || '',
      description: team.description || '',
      members: team.members || [],
      captain: team.captain || '',
      contactEmail: team.contactEmail || '',
      discordServer: team.discordServer || '',
      avatar: team.avatar || '',
      isActive: team.isActive !== false
    });
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditingTeam(null);
    setFormData({});
  };

  // Manipular mudanças no formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manipular membros da equipe
  const handleMemberChange = (index, value) => {
    const newMembers = [...(formData.members || [])];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMember = () => {
    setFormData(prev => ({ 
      ...prev, 
      members: [...(prev.members || []), '']
    }));
  };

  const removeMember = (index) => {
    if ((formData.members || []).length > 1) {
      const newMembers = (formData.members || []).filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, members: newMembers }));
    }
  };

  // Salvar alterações
  const handleSave = async (teamId) => {
    setSubmitLoading(true);
    
    try {
      const teamData = {
        ...formData,
        members: (formData.members || []).filter(m => m.trim()),
        tag: formData.tag?.toUpperCase()
      };

      await updateTeam(teamId, teamData);
      setSuccessMessage('Equipe atualizada com sucesso!');
      setEditingTeam(null);
      setFormData({});
    } catch (err) {
      console.error('Erro ao atualizar equipe:', err);
      alert('Erro ao atualizar equipe: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
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

  // Alternar status da equipe
  const toggleTeamStatus = async (team) => {
    try {
      await updateTeam(team.id, { isActive: !team.isActive });
      setSuccessMessage(`Equipe ${team.isActive ? 'desativada' : 'ativada'} com sucesso!`);
    } catch (err) {
      alert('Erro ao alterar status da equipe: ' + err.message);
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
            Edite e gerencie as equipes cadastradas
          </p>
        </div>
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, tag ou capitão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Jogo</Label>
              <Select value={filterGame} onValueChange={setFilterGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os jogos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os jogos</SelectItem>
                  {GAMES.map(game => (
                    <SelectItem key={game.value} value={game.value}>
                      {game.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Região</Label>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Equipes */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredTeams.map((team) => {
            const defaultAvatar = generateDefaultAvatar(team.name);
            
            return (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.avatar} alt={team.name} />
                      <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor}`}>
                        {defaultAvatar.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {team.name}
                        <Badge variant={team.isActive !== false ? "default" : "secondary"}>
                          {team.isActive !== false ? "Ativo" : "Inativo"}
                        </Badge>
                        {team.source === 'battlefy' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Battlefy
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {team.tag} • {GAMES.find(g => g.value === team.game)?.label || team.game} • 
                        {REGIONS.find(r => r.value === team.region)?.label || team.region}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.source !== 'battlefy' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTeamStatus(team)}
                        >
                          {team.isActive !== false ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(team)}
                          disabled={editingTeam === team.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(team.id, team.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {team.source === 'battlefy' && (
                      <Badge variant="secondary" className="text-xs">
                        Importado do Battlefy
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {editingTeam === team.id ? (
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Equipe</Label>
                        <Input
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Nome da equipe"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tag</Label>
                        <Input
                          value={formData.tag || ''}
                          onChange={(e) => handleInputChange('tag', e.target.value)}
                          placeholder="TAG"
                          maxLength={10}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Jogo</Label>
                        <Select value={formData.game || ''} onValueChange={(value) => handleInputChange('game', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o jogo" />
                          </SelectTrigger>
                          <SelectContent>
                            {GAMES.map(game => (
                              <SelectItem key={game.value} value={game.value}>
                                {game.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Região</Label>
                        <Select value={formData.region || ''} onValueChange={(value) => handleInputChange('region', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a região" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map(region => (
                              <SelectItem key={region.value} value={region.value}>
                                {region.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Capitão</Label>
                        <Input
                          value={formData.captain || ''}
                          onChange={(e) => handleInputChange('captain', e.target.value)}
                          placeholder="Nome do capitão"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email de Contato</Label>
                        <Input
                          type="email"
                          value={formData.contactEmail || ''}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descrição da equipe..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Discord Server</Label>
                      <Input
                        value={formData.discordServer || ''}
                        onChange={(e) => handleInputChange('discordServer', e.target.value)}
                        placeholder="Link do servidor Discord"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Avatar da Equipe</Label>
                      <Input
                        value={formData.avatar || ''}
                        onChange={(e) => handleInputChange('avatar', e.target.value)}
                        placeholder="URL da imagem do avatar da equipe"
                        type="url"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Membros da Equipe</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addMember}>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Membro
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(formData.members || ['']).map((member, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={member}
                              onChange={(e) => handleMemberChange(index, e.target.value)}
                              placeholder={`Membro ${index + 1}`}
                            />
                            {(formData.members || []).length > 1 && (
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
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`isActive-${team.id}`}
                        checked={formData.isActive !== false}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor={`isActive-${team.id}`} className="text-sm font-medium text-gray-700">
                        Equipe Ativa
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSave(team.id)}
                        disabled={submitLoading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {submitLoading ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={submitLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <div className="space-y-3">
                    {team.description && (
                      <p className="text-sm text-muted-foreground">{team.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Capitão:</strong> {team.captain || 'Não informado'}
                      </div>
                      <div>
                        <strong>Email:</strong> {team.contactEmail || 'Não informado'}
                      </div>
                      {team.source === 'battlefy' && (
                        <>
                          <div>
                            <strong>Battlefy ID:</strong> {team.battlefyId || 'Não informado'}
                          </div>
                          <div>
                            <strong>Torneio:</strong> {team.tournamentId || 'Não informado'}
                          </div>
                        </>
                      )}
                      {team.discordServer && (
                        <div className="md:col-span-2">
                          <strong>Discord:</strong> 
                          <a href={team.discordServer} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                            {team.discordServer}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {team.members && team.members.length > 0 && (
                      <div>
                        <strong className="text-sm">Membros:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.members.map((member, index) => (
                            <Badge key={index} variant="outline">
                              {member}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {team.createdAt && (
                      <div className="text-xs text-muted-foreground">
                        {team.source === 'battlefy' ? 'Importado em:' : 'Criado em:'} {formatDate(team.createdAt)}
                        {team.source === 'battlefy' && team.updatedAt && team.updatedAt !== team.createdAt && (
                          <span className="ml-2">
                            • Atualizado em: {formatDate(team.updatedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeamManagement;