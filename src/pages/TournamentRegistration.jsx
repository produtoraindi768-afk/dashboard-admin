import React, { useState, useEffect } from 'react';
import { useFirebaseTournaments, useFirebaseTournamentFilters } from '../hooks/useFirebaseTournaments';
import { TOURNAMENT_FORMATS, TOURNAMENT_STATUS, GAMES } from '../services/firebaseTeamService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { AlertCircle, Plus, Search, Filter, Calendar, Trophy, Users, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const TournamentRegistration = () => {
  const {
    tournaments,
    loading,
    error,
    addTournament,
    updateTournament,
    deleteTournament
  } = useFirebaseTournaments();

  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  } = useFirebaseTournamentFilters();

  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    game: '',
    format: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    prizePool: '',
    entryFee: '',
    rules: '',
    status: 'Inscrições Abertas',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      game: '',
      format: '',
      description: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      maxParticipants: '',
      prizePool: '',
      entryFee: '',
      rules: '',
      status: 'Inscrições Abertas',
      isActive: true
    });
    setEditingTournament(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tournamentData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        prizePool: parseFloat(formData.prizePool) || 0,
        entryFee: parseFloat(formData.entryFee) || 0,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: new Date(formData.registrationDeadline)
      };

      if (editingTournament) {
        await updateTournament(editingTournament.id, tournamentData);
      } else {
        await addTournament(tournamentData);
      }
      
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar torneio:', err);
    }
  };

  const handleEdit = (tournament) => {
    setFormData({
      name: tournament.name || '',
      game: tournament.game || '',
      format: tournament.format || '',
      description: tournament.description || '',
      startDate: tournament.startDate ? (tournament.startDate.toDate ? tournament.startDate.toDate().toISOString().split('T')[0] : new Date(tournament.startDate).toISOString().split('T')[0]) : '',
      endDate: tournament.endDate ? (tournament.endDate.toDate ? tournament.endDate.toDate().toISOString().split('T')[0] : new Date(tournament.endDate).toISOString().split('T')[0]) : '',
      registrationDeadline: tournament.registrationDeadline ? (tournament.registrationDeadline.toDate ? tournament.registrationDeadline.toDate().toISOString().split('T')[0] : new Date(tournament.registrationDeadline).toISOString().split('T')[0]) : '',
      maxParticipants: tournament.maxParticipants?.toString() || '',
      prizePool: tournament.prizePool?.toString() || '',
      entryFee: tournament.entryFee?.toString() || '',
      rules: tournament.rules || '',
      status: tournament.status || 'Inscrições Abertas',
      isActive: tournament.isActive !== undefined ? tournament.isActive : true
    });
    setEditingTournament(tournament);
    setShowForm(true);
  };

  const handleDelete = async (tournamentId) => {
    if (window.confirm('Tem certeza que deseja excluir este torneio?')) {
      try {
        await deleteTournament(tournamentId);
      } catch (err) {
        console.error('Erro ao excluir torneio:', err);
      }
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesGame = !filters.game || filters.game === 'all' || tournament.game === filters.game;
    const matchesFormat = !filters.format || filters.format === 'all' || tournament.format === filters.format;
    const matchesStatus = !filters.status || filters.status === 'all' || tournament.status === filters.status;
    const matchesSearch = !filters.searchTerm || 
      tournament.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesGame && matchesFormat && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Inscrições Abertas': 'bg-blue-100 text-blue-800',
      'Inscrições Fechadas': 'bg-yellow-100 text-yellow-800',
      'Em Andamento': 'bg-green-100 text-green-800',
      'Finalizado': 'bg-gray-100 text-gray-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Adiado': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Se for um Timestamp do Firebase
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('pt-BR');
    }
    
    // Se for uma string ou objeto Date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    return dateObj.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    if (!value) return 'Gratuito';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Torneios</h1>
          <p className="text-gray-600 mt-2">
            Gerencie torneios de esports e competições
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Torneio
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome ou descrição..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="game-filter">Jogo</Label>
              <Select value={filters.game} onValueChange={(value) => updateFilter('game', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os jogos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os jogos</SelectItem>
                  {GAMES.map(game => (
                    <SelectItem key={game} value={game}>{game}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="format-filter">Formato</Label>
              <Select value={filters.format} onValueChange={(value) => updateFilter('format', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os formatos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formatos</SelectItem>
                  {TOURNAMENT_FORMATS.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {TOURNAMENT_STATUS.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTournament ? 'Editar Torneio' : 'Novo Torneio'}
            </CardTitle>
            <CardDescription>
              {editingTournament ? 'Atualize as informações do torneio' : 'Preencha os dados do novo torneio'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Torneio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="game">Jogo *</Label>
                  <Select value={formData.game} onValueChange={(value) => setFormData({...formData, game: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o jogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {GAMES.map(game => (
                        <SelectItem key={game} value={game}>{game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="format">Formato *</Label>
                  <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_FORMATS.map(format => (
                        <SelectItem key={format} value={format}>{format}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_STATUS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="registrationDeadline">Prazo de Inscrição</Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prizePool">Premiação (R$)</Label>
                  <Input
                    id="prizePool"
                    type="number"
                    step="0.01"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({...formData, prizePool: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="entryFee">Taxa de Inscrição (R$)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({...formData, entryFee: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="rules">Regras</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({...formData, rules: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Torneio Ativo
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingTournament ? 'Atualizar' : 'Criar Torneio')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Torneios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && tournaments.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p>Carregando torneios...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">
              {hasActiveFilters ? 'Nenhum torneio encontrado com os filtros aplicados.' : 'Nenhum torneio cadastrado ainda.'}
            </p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <CardDescription>{tournament.game}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                    <Badge className={tournament.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {tournament.isActive !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tournament.description || 'Sem descrição'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span>{tournament.format}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{tournament.maxParticipants || 'Ilimitado'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{formatCurrency(tournament.prizePool)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(tournament)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(tournament.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentRegistration;