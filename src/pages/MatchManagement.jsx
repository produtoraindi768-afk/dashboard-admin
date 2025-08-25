import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  Star,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  Target,
  MapPin,
  Download
} from 'lucide-react';
import { useFirebaseMatches } from '../hooks/useFirebaseMatches';
import { useFirebaseTeams } from '../hooks/useFirebaseTeams';
import { useFirebaseTournaments } from '../hooks/useFirebaseTournaments';
import BattlefyMatchEditModal from '../components/BattlefyMatchEditModal';
import {
  formatRelativeTime,
  generateDefaultAvatar,
} from '../utils/formatters';

const MatchManagement = () => {
  const { matches, loading, error, statistics, createMatch, updateMatch, deleteMatch, updateMatchResult, toggleMatchFeatured, toggleRealTime } = useFirebaseMatches();
  const { teams } = useFirebaseTeams();
  const { tournaments } = useFirebaseTournaments();

  // Ativa tempo real automaticamente quando o componente monta
  React.useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);

  const [isUpdating, setIsUpdating] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editMatch, setEditMatch] = useState({
    tournamentId: '',
    team1Id: '',
    team2Id: '',
    scheduledDate: '',
    format: 'MD3',
    game: 'League of Legends',
    isFeatured: false,
    // Campos de resultado MD3/MD5
    team1ScoreMD3: 0,
    team2ScoreMD3: 0,
    team1ScoreMD5: 0,
    team2ScoreMD5: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para modal de edição do Battlefy
  const [isBattlefyEditModalOpen, setIsBattlefyEditModalOpen] = useState(false);
  const [selectedBattlefyMatch, setSelectedBattlefyMatch] = useState(null);

  // Form states
  const [newMatch, setNewMatch] = useState({
    tournamentId: '',
    team1Id: '',
    team2Id: '',
    scheduledDate: '',
    format: 'MD3',
    game: 'League of Legends',
    maps: [],
    isFeatured: false,
    // Campos de resultado MD3/MD5
    team1ScoreMD3: 0,
    team2ScoreMD3: 0,
    team1ScoreMD5: 0,
    team2ScoreMD5: 0
  });

  const [matchResult, setMatchResult] = useState({
    team1Score: 0,
    team2Score: 0,
    winner: null,
    maps: []
  });

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFeaturedChange = async (matchId, isFeatured) => {
    setIsUpdating(prev => ({ ...prev, [matchId]: true }));
    try {
      await toggleMatchFeatured(matchId, isFeatured);
      setSuccessMessage(`Partida ${isFeatured ? 'marcada como destaque' : 'removida do destaque'}`);
    } catch (err) {
      console.error('Erro ao atualizar destaque:', err);
    } finally {
      setIsUpdating(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // Validação do formulário
  const validateForm = () => {
    if (!newMatch.tournamentId) {
      setFormError('Selecione um torneio');
      return false;
    }
    if (!newMatch.team1Id) {
      setFormError('Selecione o primeiro time');
      return false;
    }
    if (!newMatch.team2Id) {
      setFormError('Selecione o segundo time');
      return false;
    }
    if (newMatch.team1Id === newMatch.team2Id) {
      setFormError('Os times devem ser diferentes');
      return false;
    }
    if (!newMatch.scheduledDate) {
      setFormError('Defina a data e hora da partida');
      return false;
    }
    
    // Verificar se a data não é no passado
    const selectedDate = new Date(newMatch.scheduledDate);
    const now = new Date();
    if (selectedDate < now) {
      setFormError('A data da partida não pode ser no passado');
      return false;
    }
    
    setFormError('');
    return true;
  };

  const handleCreateMatch = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    setFormError('');
    
    try {
      const tournament = tournaments.find(t => t.id === newMatch.tournamentId);
      const team1 = teams.find(t => t.id === newMatch.team1Id);
      const team2 = teams.find(t => t.id === newMatch.team2Id);

      if (!tournament || !team1 || !team2) {
        throw new Error('Torneio ou times não encontrados');
      }

      const mapsCount = newMatch.format === 'MD1' ? 1 : newMatch.format === 'MD3' ? 3 : 5;
      const maps = Array.from({ length: mapsCount }, (_, i) => ({
        name: `Mapa ${i + 1}`,
        winner: null
      }));

      const matchData = {
        ...newMatch,
        tournamentName: tournament.name,
        team1: {
          id: team1.id,
          name: team1.name,
          tag: team1.tag || null,
          logo: team1.logo || null,
          avatar: team1.avatar || null
        },
        team2: {
          id: team2.id,
          name: team2.name,
          tag: team2.tag || null,
          logo: team2.logo || null,
          avatar: team2.avatar || null
        },
        maps,
        status: 'scheduled',
        result: {
          team1Score: 0,
          team2Score: 0,
          winner: null
        },
        // Resultados MD3/MD5
        resultMD3: {
          team1Score: newMatch.team1ScoreMD3 || 0,
          team2Score: newMatch.team2ScoreMD3 || 0,
          winner: newMatch.team1ScoreMD3 > newMatch.team2ScoreMD3 ? 'team1' : 
                  newMatch.team2ScoreMD3 > newMatch.team1ScoreMD3 ? 'team2' : null
        },
        resultMD5: {
          team1Score: newMatch.team1ScoreMD5 || 0,
          team2Score: newMatch.team2ScoreMD5 || 0,
          winner: newMatch.team1ScoreMD5 > newMatch.team2ScoreMD5 ? 'team1' : 
                  newMatch.team2ScoreMD5 > newMatch.team1ScoreMD5 ? 'team2' : null
        }
      };

      await createMatch(matchData);
      setSuccessMessage('Partida criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewMatch({
        tournamentId: '',
        team1Id: '',
        team2Id: '',
        scheduledDate: '',
        format: 'MD3',
        game: 'League of Legends',
        maps: [],
        isFeatured: false,
        team1ScoreMD3: 0,
        team2ScoreMD3: 0,
        team1ScoreMD5: 0,
        team2ScoreMD5: 0
      });
    } catch (err) {
      console.error('Erro ao criar partida:', err);
      setFormError(err.message || 'Erro ao criar partida. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateResult = async () => {
    try {
      // Criar objeto de resultado com campos MD3/MD5
      const resultData = {
        ...matchResult,
        // Adicionar resultados MD3/MD5 se existirem
        ...(selectedMatch?.format === 'MD3' && {
          resultMD3: {
            team1Score: matchResult.team1ScoreMD3 || 0,
            team2Score: matchResult.team2ScoreMD3 || 0,
            winner: matchResult.team1ScoreMD3 > matchResult.team2ScoreMD3 ? 'team1' : 
                    matchResult.team2ScoreMD3 > matchResult.team1ScoreMD3 ? 'team2' : null
          }
        }),
        ...(selectedMatch?.format === 'MD5' && {
          resultMD5: {
            team1Score: matchResult.team1ScoreMD5 || 0,
            team2Score: matchResult.team2ScoreMD5 || 0,
            winner: matchResult.team1ScoreMD5 > matchResult.team2ScoreMD5 ? 'team1' : 
                    matchResult.team2ScoreMD5 > matchResult.team1ScoreMD5 ? 'team2' : null
          }
        })
      };
      
      await updateMatchResult(selectedMatch.id, resultData);
      setSuccessMessage('Resultado atualizado com sucesso!');
      setIsResultDialogOpen(false);
      setSelectedMatch(null);
      setMatchResult({
        team1Score: 0,
        team2Score: 0,
        winner: null,
        maps: [],
        team1ScoreMD3: 0,
        team2ScoreMD3: 0,
        team1ScoreMD5: 0,
        team2ScoreMD5: 0
      });
    } catch (err) {
      console.error('Erro ao atualizar resultado:', err);
      setFormError('Erro ao atualizar resultado da partida');
    }
  };

  // Validação do formulário de edição
  const validateEditForm = () => {
    if (!editMatch.tournamentId) {
      setFormError('Selecione um torneio');
      return false;
    }
    if (!editMatch.team1Id) {
      setFormError('Selecione o primeiro time');
      return false;
    }
    if (!editMatch.team2Id) {
      setFormError('Selecione o segundo time');
      return false;
    }
    if (editMatch.team1Id === editMatch.team2Id) {
      setFormError('Os times devem ser diferentes');
      return false;
    }
    if (!editMatch.scheduledDate) {
      setFormError('Defina a data e hora da partida');
      return false;
    }
    
    setFormError('');
    return true;
  };

  const handleEditMatch = async () => {
    if (!validateEditForm()) {
      return;
    }
    
    setIsCreating(true);
    setFormError('');
    
    try {
      const tournament = tournaments.find(t => t.id === editMatch.tournamentId);
      const team1 = teams.find(t => t.id === editMatch.team1Id);
      const team2 = teams.find(t => t.id === editMatch.team2Id);

      if (!tournament || !team1 || !team2) {
        throw new Error('Torneio ou times não encontrados');
      }

      const updateData = {
        ...editMatch,
        tournamentName: tournament.name,
        team1: {
          id: team1.id,
          name: team1.name,
          tag: team1.tag || null,
          logo: team1.logo || null,
          avatar: team1.avatar || null
        },
        team2: {
          id: team2.id,
          name: team2.name,
          tag: team2.tag || null,
          logo: team2.logo || null,
          avatar: team2.avatar || null
        },
        // Resultados MD3/MD5
        resultMD3: {
          team1Score: editMatch.team1ScoreMD3 || 0,
          team2Score: editMatch.team2ScoreMD3 || 0,
          winner: editMatch.team1ScoreMD3 > editMatch.team2ScoreMD3 ? 'team1' : 
                  editMatch.team2ScoreMD3 > editMatch.team1ScoreMD3 ? 'team2' : null
        },
        resultMD5: {
          team1Score: editMatch.team1ScoreMD5 || 0,
          team2Score: editMatch.team2ScoreMD5 || 0,
          winner: editMatch.team1ScoreMD5 > editMatch.team2ScoreMD5 ? 'team1' : 
                  editMatch.team2ScoreMD5 > editMatch.team1ScoreMD5 ? 'team2' : null
        }
      };

      await updateMatch(selectedMatch.id, updateData);
      setSuccessMessage('Partida atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Erro ao atualizar partida:', err);
      setFormError(err.message || 'Erro ao atualizar partida. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (match) => {
    setSelectedMatch(match);
    setEditMatch({
      tournamentId: match.tournamentId || '',
      team1Id: match.team1?.id || '',
      team2Id: match.team2?.id || '',
      scheduledDate: match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : '',
      format: match.format || 'MD3',
      game: match.game || 'League of Legends',
      isFeatured: match.isFeatured || false,
      team1ScoreMD3: match.resultMD3?.team1Score || 0,
      team2ScoreMD3: match.resultMD3?.team2Score || 0,
      team1ScoreMD5: match.resultMD5?.team1Score || 0,
      team2ScoreMD5: match.resultMD5?.team2Score || 0
    });
    setFormError('');
    setIsEditDialogOpen(true);
  };

  const handleDeleteMatch = async (matchId, source = 'manual') => {
    if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
      try {
        await deleteMatch(matchId, source);
        setSuccessMessage('Partida excluída com sucesso!');
      } catch (err) {
        console.error('Erro ao excluir partida:', err);
      }
    }
  };

  // Funções específicas para partidas do Battlefy
  const handleEditBattlefyMatch = (match) => {
    setSelectedBattlefyMatch(match);
    setIsBattlefyEditModalOpen(true);
  };

  const handleSaveBattlefyMatch = async (updatedMatch) => {
    try {
      await updateMatch(updatedMatch.id, {
        scheduledDate: updatedMatch.scheduledDate,
        status: updatedMatch.status,
        result: updatedMatch.result
      }, 'battlefy'); // Especificar que é uma partida do Battlefy
      setSuccessMessage('Partida do Battlefy atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar partida do Battlefy:', err);
      setError('Erro ao atualizar partida do Battlefy: ' + err.message);
    }
  };

  const closeBattlefyEditModal = () => {
    setIsBattlefyEditModalOpen(false);
    setSelectedBattlefyMatch(null);
  };

  const openResultDialog = (match) => {
    setSelectedMatch(match);
    setFormError(''); // Limpar erro anterior
    setMatchResult({
      team1Score: match.result?.team1Score || 0,
      team2Score: match.result?.team2Score || 0,
      winner: match.result?.winner || null,
      maps: match.maps || [],
      team1ScoreMD3: match.resultMD3?.team1Score || 0,
      team2ScoreMD3: match.resultMD3?.team2Score || 0,
      team1ScoreMD5: match.resultMD5?.team1Score || 0,
      team2ScoreMD5: match.resultMD5?.team2Score || 0
    });
    setIsResultDialogOpen(true);
  };

  const getStatusBadge = (status, matchId) => {
    const statusConfig = {
      scheduled: { label: 'Agendada', variant: 'secondary', icon: Calendar },
      live: { label: 'Ao Vivo', variant: 'destructive', icon: Play },
      finished: { label: 'Finalizada', variant: 'default', icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'outline', icon: Square }
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => openStatusDialog(matchId, status)}
        title="Clique para editar o status"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const openStatusDialog = (matchId, currentStatus) => {
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match);
    setSelectedStatus(currentStatus);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedMatch || !selectedStatus) return;
    
    setIsUpdating(prev => ({ ...prev, [selectedMatch.id]: true }));
    try {
      await updateMatch(selectedMatch.id, { status: selectedStatus });
      setSuccessMessage(`Status da partida atualizado para: ${getStatusLabel(selectedStatus)}`);
      setIsStatusDialogOpen(false);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setFormError('Erro ao atualizar status da partida');
    } finally {
      setIsUpdating(prev => ({ ...prev, [selectedMatch.id]: false }));
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Agendada',
      live: 'Ao Vivo', 
      finished: 'Finalizada',
      cancelled: 'Cancelada'
    };
    return labels[status] || 'Agendada';
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchesSearch = 
        match.team1?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.tournamentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.game?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [matches, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando partidas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Partidas</h1>
          <p className="text-muted-foreground">
            Gerencie confrontos, resultados e destaques das partidas
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Partida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Partida</DialogTitle>
              <DialogDescription>
                Configure os detalhes da nova partida
              </DialogDescription>
            </DialogHeader>
            
            {/* Mensagem de Erro do Formulário */}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament">Torneio *</Label>
                <Select value={newMatch.tournamentId} onValueChange={(value) => setNewMatch(prev => ({ ...prev, tournamentId: value }))}>
                  <SelectTrigger className={!newMatch.tournamentId && formError ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um torneio" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum torneio disponível
                      </SelectItem>
                    ) : (
                      tournaments.map(tournament => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="team1">Time 1 *</Label>
                <Select value={newMatch.team1Id} onValueChange={(value) => setNewMatch(prev => ({ ...prev, team1Id: value }))}>
                  <SelectTrigger className={!newMatch.team1Id && formError ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o primeiro time" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum time disponível
                      </SelectItem>
                    ) : (
                      teams.filter(team => team.id !== newMatch.team2Id).map(team => {
                        const defaultAvatar = generateDefaultAvatar(team.name);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={team.avatar} alt={team.name} />
                                <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor} text-xs`}>
                                  {defaultAvatar.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="team2">Time 2 *</Label>
                <Select value={newMatch.team2Id} onValueChange={(value) => setNewMatch(prev => ({ ...prev, team2Id: value }))}>
                  <SelectTrigger className={!newMatch.team2Id && formError ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o segundo time" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum time disponível
                      </SelectItem>
                    ) : (
                      teams.filter(team => team.id !== newMatch.team1Id).map(team => {
                        const defaultAvatar = generateDefaultAvatar(team.name);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={team.avatar} alt={team.name} />
                                <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor} text-xs`}>
                                  {defaultAvatar.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="scheduledDate">Data e Hora *</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={newMatch.scheduledDate}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className={!newMatch.scheduledDate && formError ? 'border-red-500' : ''}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <Label htmlFor="format">Formato</Label>
                <Select value={newMatch.format} onValueChange={(value) => setNewMatch(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MD1">MD1 (Melhor de 1)</SelectItem>
                    <SelectItem value="MD3">MD3 (Melhor de 3)</SelectItem>
                    <SelectItem value="MD5">MD5 (Melhor de 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="game">Jogo</Label>
                <Select value={newMatch.game} onValueChange={(value) => setNewMatch(prev => ({ ...prev, game: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="League of Legends">League of Legends</SelectItem>
                    <SelectItem value="Valorant">Valorant</SelectItem>
                    <SelectItem value="CS2">Counter-Strike 2</SelectItem>
                    <SelectItem value="Dota 2">Dota 2</SelectItem>
                    <SelectItem value="Fortnite">Fortnite</SelectItem>
                    <SelectItem value="Apex Legends">Apex Legends</SelectItem>
                    <SelectItem value="Overwatch 2">Overwatch 2</SelectItem>
                    <SelectItem value="Rocket League">Rocket League</SelectItem>
                    <SelectItem value="FIFA 24">FIFA 24</SelectItem>
                    <SelectItem value="Call of Duty">Call of Duty</SelectItem>
                    <SelectItem value="Rainbow Six Siege">Rainbow Six Siege</SelectItem>
                    <SelectItem value="Free Fire">Free Fire</SelectItem>
                    <SelectItem value="Mobile Legends">Mobile Legends</SelectItem>
                    <SelectItem value="PUBG">PUBG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campos de Resultado MD3/MD5 */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium">Resultado da Partida (Opcional)</Label>
                
                {/* Resultado MD3 */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Resultado MD3 (Melhor de 3)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="team1ScoreMD3" className="text-xs">Time 1</Label>
                      <Input
                        id="team1ScoreMD3"
                        type="number"
                        min="0"
                        max="3"
                        value={newMatch.team1ScoreMD3}
                        onChange={(e) => setNewMatch(prev => ({ ...prev, team1ScoreMD3: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team2ScoreMD3" className="text-xs">Time 2</Label>
                      <Input
                        id="team2ScoreMD3"
                        type="number"
                        min="0"
                        max="3"
                        value={newMatch.team2ScoreMD3}
                        onChange={(e) => setNewMatch(prev => ({ ...prev, team2ScoreMD3: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Resultado MD5 */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Resultado MD5 (Melhor de 5)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="team1ScoreMD5" className="text-xs">Time 1</Label>
                      <Input
                        id="team1ScoreMD5"
                        type="number"
                        min="0"
                        max="5"
                        value={newMatch.team1ScoreMD5}
                        onChange={(e) => setNewMatch(prev => ({ ...prev, team1ScoreMD5: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team2ScoreMD5" className="text-xs">Time 2</Label>
                      <Input
                        id="team2ScoreMD5"
                        type="number"
                        min="0"
                        max="5"
                        value={newMatch.team2ScoreMD5}
                        onChange={(e) => setNewMatch(prev => ({ ...prev, team2ScoreMD5: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={newMatch.isFeatured}
                  onCheckedChange={(checked) => setNewMatch(prev => ({ ...prev, isFeatured: checked }))}
                />
                <Label htmlFor="featured">Marcar como destaque</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormError('');
                }}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateMatch}
                disabled={isCreating || teams.length === 0 || tournaments.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Partida'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mensagem de Sucesso */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Partidas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
              {statistics.scheduled > 0 && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {statistics.scheduled}
                </Badge>
              )}
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.scheduled}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Ao Vivo</CardTitle>
              {statistics.live > 0 && (
                <Badge variant="destructive" className="h-5 text-xs animate-pulse">
                  {statistics.live}
                </Badge>
              )}
            </div>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{statistics.live}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.finished}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Destaque</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.featured}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por times, torneio ou jogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="live">Ao Vivo</SelectItem>
            <SelectItem value="finished">Finalizadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Partidas */}
      <Card>
        <CardHeader>
          <CardTitle>Partidas ({filteredMatches.length})</CardTitle>
          <CardDescription>
            Gerencie todas as partidas dos torneios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma partida encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira partida'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Times */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={match.team1?.avatar || match.team1?.logo} alt={match.team1?.name} />
                            <AvatarFallback className={`${generateDefaultAvatar(match.team1?.name || '').bgColor} ${generateDefaultAvatar(match.team1?.name || '').textColor} text-xs`}>
                              {generateDefaultAvatar(match.team1?.name || '').initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{match.team1?.name}</span>
                            {match.team1?.tag && (
                              <Badge variant="outline" className="text-xs w-fit">{match.team1.tag}</Badge>
                            )}
                          </div>
                        </div>
                        
                        <span className="text-muted-foreground font-bold">VS</span>
                        
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={match.team2?.avatar || match.team2?.logo} alt={match.team2?.name} />
                            <AvatarFallback className={`${generateDefaultAvatar(match.team2?.name || '').bgColor} ${generateDefaultAvatar(match.team2?.name || '').textColor} text-xs`}>
                              {generateDefaultAvatar(match.team2?.name || '').initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{match.team2?.name}</span>
                            {match.team2?.tag && (
                              <Badge variant="outline" className="text-xs w-fit">{match.team2.tag}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Resultado */}
                      {(match.status === 'finished' || match.status === 'live') && match.result && (
                        <div className="flex flex-col items-end gap-1">
                          {/* Resultado Geral */}
                          <div className="flex items-center gap-2 text-lg font-bold">
                            <span className={match.result.winner === 'team1' ? 'text-green-600' : 'text-muted-foreground'}>
                              {match.result.team1Score}
                            </span>
                            <span className="text-muted-foreground">-</span>
                            <span className={match.result.winner === 'team2' ? 'text-green-600' : 'text-muted-foreground'}>
                              {match.result.team2Score}
                            </span>
                            {match.status === 'live' && (
                              <Badge variant="destructive" className="ml-2 animate-pulse text-xs">
                                AO VIVO
                              </Badge>
                            )}
                          </div>
                          
                          {/* Resultado MD3/MD5 */}
                          {match.format === 'MD3' && match.resultMD3 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className={match.resultMD3.winner === 'team1' ? 'text-green-600' : 'text-muted-foreground'}>
                                {match.resultMD3.team1Score}
                              </span>
                              <span>-</span>
                              <span className={match.resultMD3.winner === 'team2' ? 'text-green-600' : 'text-muted-foreground'}>
                                {match.resultMD3.team2Score}
                              </span>
                              <span className="text-xs">(MD3)</span>
                            </div>
                          )}
                          
                          {match.format === 'MD5' && match.resultMD5 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className={match.resultMD5.winner === 'team1' ? 'text-green-600' : 'text-muted-foreground'}>
                                {match.resultMD5.team1Score}
                              </span>
                              <span>-</span>
                              <span className={match.resultMD5.winner === 'team2' ? 'text-green-600' : 'text-muted-foreground'}>
                                {match.resultMD5.team2Score}
                              </span>
                              <span className="text-xs">(MD5)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Switch de Destaque */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={match.isFeatured}
                          onCheckedChange={(checked) => handleFeaturedChange(match.id, checked)}
                          disabled={isUpdating[match.id]}
                        />
                        {isUpdating[match.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Star className={`h-4 w-4 ${match.isFeatured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center gap-1">
                        {match.status !== 'finished' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResultDialog(match)}
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => match.source === 'battlefy' ? handleEditBattlefyMatch(match) : openEditDialog(match)}
                          title={match.source === 'battlefy' ? 'Editar partida do Battlefy (limitado)' : 'Editar partida'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMatch(match.id, match.source)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações da Partida */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {match.tournamentName}
                    </div>
                    
                    {/* Identificação da origem da partida */}
                    {match.source === 'battlefy' && (
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4 text-blue-500" />
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          Importado do Battlefy
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(match.scheduledDate).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(match.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <Badge variant="outline">{match.format}</Badge>
                    <Badge variant="outline">{match.game}</Badge>
                    {getStatusBadge(match.status, match.id)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Resultado */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Resultado</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.team1?.name} vs ${selectedMatch.team2?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {/* Mensagem de Erro */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pontuação {selectedMatch?.team1?.name}</Label>
                <Input
                  type="number"
                  min="0"
                  value={matchResult.team1Score}
                  onChange={(e) => setMatchResult(prev => ({ ...prev, team1Score: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label>Pontuação {selectedMatch?.team2?.name}</Label>
                <Input
                  type="number"
                  min="0"
                  value={matchResult.team2Score}
                  onChange={(e) => setMatchResult(prev => ({ ...prev, team2Score: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            {/* Campos de Resultado MD3/MD5 */}
            {(selectedMatch?.format === 'MD3' || selectedMatch?.format === 'MD5') && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">Resultado {selectedMatch?.format}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pontuação {selectedMatch?.team1?.name} ({selectedMatch?.format})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={selectedMatch?.format === 'MD3' ? "3" : "5"}
                      value={selectedMatch?.format === 'MD3' ? matchResult.team1ScoreMD3 : matchResult.team1ScoreMD5}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (selectedMatch?.format === 'MD3') {
                          setMatchResult(prev => ({ ...prev, team1ScoreMD3: value }));
                        } else {
                          setMatchResult(prev => ({ ...prev, team1ScoreMD5: value }));
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Pontuação {selectedMatch?.team2?.name} ({selectedMatch?.format})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={selectedMatch?.format === 'MD3' ? "3" : "5"}
                      value={selectedMatch?.format === 'MD3' ? matchResult.team2ScoreMD3 : matchResult.team2ScoreMD5}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (selectedMatch?.format === 'MD3') {
                          setMatchResult(prev => ({ ...prev, team2ScoreMD3: value }));
                        } else {
                          setMatchResult(prev => ({ ...prev, team2ScoreMD5: value }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label>Vencedor</Label>
              <Select value={matchResult.winner || ''} onValueChange={(value) => setMatchResult(prev => ({ ...prev, winner: value || null }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vencedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team1">{selectedMatch?.team1?.name}</SelectItem>
                  <SelectItem value="team2">{selectedMatch?.team2?.name}</SelectItem>
                  <SelectItem value="draw">Empate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateResult}>
              Salvar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Status */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Status da Partida</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.team1?.name} vs ${selectedMatch.team2?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Status da Partida</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Agendada
                    </div>
                  </SelectItem>
                  <SelectItem value="live">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Ao Vivo
                    </div>
                  </SelectItem>
                  <SelectItem value="finished">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Finalizada
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Cancelada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={isUpdating[selectedMatch?.id] || !selectedStatus}
            >
              {isUpdating[selectedMatch?.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Partida</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da partida
            </DialogDescription>
          </DialogHeader>
          
          {/* Mensagem de Erro do Formulário */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tournament">Torneio *</Label>
              <Select value={editMatch.tournamentId} onValueChange={(value) => setEditMatch(prev => ({ ...prev, tournamentId: value }))}>
                <SelectTrigger className={!editMatch.tournamentId && formError ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione um torneio" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum torneio disponível
                    </SelectItem>
                  ) : (
                    tournaments.map(tournament => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-team1">Time 1 *</Label>
              <Select value={editMatch.team1Id} onValueChange={(value) => setEditMatch(prev => ({ ...prev, team1Id: value }))}>
                <SelectTrigger className={!editMatch.team1Id && formError ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o primeiro time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum time disponível
                    </SelectItem>
                  ) : (
                    teams.filter(team => team.id !== editMatch.team2Id).map(team => {
                        const defaultAvatar = generateDefaultAvatar(team.name);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={team.avatar} alt={team.name} />
                                <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor} text-xs`}>
                                  {defaultAvatar.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-team2">Time 2 *</Label>
              <Select value={editMatch.team2Id} onValueChange={(value) => setEditMatch(prev => ({ ...prev, team2Id: value }))}>
                <SelectTrigger className={!editMatch.team2Id && formError ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o segundo time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum time disponível
                    </SelectItem>
                  ) : (
                    teams.filter(team => team.id !== editMatch.team1Id).map(team => {
                        const defaultAvatar = generateDefaultAvatar(team.name);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={team.avatar} alt={team.name} />
                                <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor} text-xs`}>
                                  {defaultAvatar.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-scheduledDate">Data e Hora *</Label>
              <Input
                id="edit-scheduledDate"
                type="datetime-local"
                value={editMatch.scheduledDate}
                onChange={(e) => setEditMatch(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className={!editMatch.scheduledDate && formError ? 'border-red-500' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-format">Formato</Label>
              <Select value={editMatch.format} onValueChange={(value) => setEditMatch(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MD1">MD1 (Melhor de 1)</SelectItem>
                  <SelectItem value="MD3">MD3 (Melhor de 3)</SelectItem>
                  <SelectItem value="MD5">MD5 (Melhor de 5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-game">Jogo</Label>
              <Select value={editMatch.game} onValueChange={(value) => setEditMatch(prev => ({ ...prev, game: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="League of Legends">League of Legends</SelectItem>
                  <SelectItem value="Valorant">Valorant</SelectItem>
                  <SelectItem value="CS2">Counter-Strike 2</SelectItem>
                  <SelectItem value="Dota 2">Dota 2</SelectItem>
                  <SelectItem value="Fortnite">Fortnite</SelectItem>
                  <SelectItem value="Apex Legends">Apex Legends</SelectItem>
                  <SelectItem value="Overwatch 2">Overwatch 2</SelectItem>
                  <SelectItem value="Rocket League">Rocket League</SelectItem>
                  <SelectItem value="FIFA 24">FIFA 24</SelectItem>
                  <SelectItem value="Call of Duty">Call of Duty</SelectItem>
                  <SelectItem value="Rainbow Six Siege">Rainbow Six Siege</SelectItem>
                  <SelectItem value="Free Fire">Free Fire</SelectItem>
                  <SelectItem value="Mobile Legends">Mobile Legends</SelectItem>
                  <SelectItem value="PUBG">PUBG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Campos de Resultado MD3/MD5 */}
            {(editMatch.format === 'MD3' || editMatch.format === 'MD5') && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">Resultado {editMatch.format}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pontuação Time 1 ({editMatch.format})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editMatch.format === 'MD3' ? "3" : "5"}
                      value={editMatch.format === 'MD3' ? editMatch.team1ScoreMD3 : editMatch.team1ScoreMD5}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (editMatch.format === 'MD3') {
                          setEditMatch(prev => ({ ...prev, team1ScoreMD3: value }));
                        } else {
                          setEditMatch(prev => ({ ...prev, team1ScoreMD5: value }));
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Pontuação Time 2 ({editMatch.format})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editMatch.format === 'MD3' ? "3" : "5"}
                      value={editMatch.format === 'MD3' ? editMatch.team2ScoreMD3 : editMatch.team2ScoreMD5}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (editMatch.format === 'MD3') {
                          setEditMatch(prev => ({ ...prev, team2ScoreMD3: value }));
                        } else {
                          setEditMatch(prev => ({ ...prev, team2ScoreMD5: value }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-featured"
                checked={editMatch.isFeatured}
                onCheckedChange={(checked) => setEditMatch(prev => ({ ...prev, isFeatured: checked }))}
              />
              <Label htmlFor="edit-featured">Marcar como destaque</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setFormError('');
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditMatch}
              disabled={isCreating || teams.length === 0 || tournaments.length === 0}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição do Battlefy */}
      <BattlefyMatchEditModal
        match={selectedBattlefyMatch}
        isOpen={isBattlefyEditModalOpen}
        onClose={closeBattlefyEditModal}
        onSave={handleSaveBattlefyMatch}
      />
    </div>
  );
};

export default MatchManagement;