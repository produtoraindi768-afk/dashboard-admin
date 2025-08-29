import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Trophy, Users, MapPin, Clock, Target, Image, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BattlefyAdvancedEditModal = ({ match, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    // Campos básicos
    battlefyId: '',
    matchNumber: 0,
    round: 0,
    state: 'pending',
    
    // Dados dos times
    top: {
      teamID: '',
      seedNumber: 0,
      score: 0,
      winner: false,
      disqualified: false,
      readyAt: ''
    },
    bottom: {
      teamID: '',
      seedNumber: 0,
      score: 0,
      winner: false,
      disqualified: false,
      readyAt: ''
    },
    
    // Informações da partida
    isComplete: false,
    isBye: false,
    doubleLoss: false,
    inConsolationBracket: false,
    matchType: 'winner',
    
    // Datas
    createdAt: '',
    completedAt: '',
    updatedAt: '',
    scheduledTime: null,
    
    // Screenshots
    screenshots: {
      top: {
        'game-1': []
      },
      bottom: {
        'game-1': []
      }
    },
    
    // Próxima partida
    next: {
      winner: {
        matchID: '',
        position: 'top',
        roundNumber: 0
      }
    },
    
    // Stats
    stats: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('top');
  const [selectedGame, setSelectedGame] = useState('game-1');

  useEffect(() => {
    console.log('Modal recebeu match:', match);
    if (match && match.rawData) {
      const rawData = match.rawData;
      console.log('rawData encontrado:', rawData);
      setFormData({
        _id: rawData._id || '',
        tournamentId: rawData.tournamentId || '',
        stageId: rawData.stageId || '',
        matchNumber: rawData.matchNumber || 0,
        round: rawData.round || 0,
        state: rawData.state || 'pending',
        
        top: {
          teamID: rawData.top?.teamID || '',
          seedNumber: rawData.top?.seedNumber || 0,
          score: rawData.top?.score || 0,
          winner: rawData.top?.winner || false,
          disqualified: rawData.top?.disqualified || false,
          readyAt: rawData.top?.readyAt || ''
        },
        bottom: {
          teamID: rawData.bottom?.teamID || '',
          seedNumber: rawData.bottom?.seedNumber || 0,
          score: rawData.bottom?.score || 0,
          winner: rawData.bottom?.winner || false,
          disqualified: rawData.bottom?.disqualified || false,
          readyAt: rawData.bottom?.readyAt || ''
        },
        
        isComplete: rawData.isComplete || false,
        isBye: rawData.isBye || false,
        doubleLoss: rawData.doubleLoss || false,
        inConsolationBracket: rawData.inConsolationBracket || false,
        matchType: rawData.matchType || 'winner',
        
        createdAt: rawData.createdAt || '',
        completedAt: rawData.completedAt || '',
        updatedAt: rawData.updatedAt || '',
        scheduledTime: rawData.scheduledTime || null,
        
        screenshots: rawData.screenshots || {
          top: { 'game-1': [] },
          bottom: { 'game-1': [] }
        },
        
        next: rawData.next || {
          winner: {
            matchID: '',
            position: 'top',
            roundNumber: 0
          }
        },
        
        stats: rawData.stats || []
      });
    } else {
      console.log('rawData não encontrado ou match inválido');
    }
  }, [match]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função de validação
  const validateForm = () => {
    const newErrors = {};

    // Validar campos obrigatórios
     if (!formData._id?.trim()) {
       newErrors._id = 'ID da partida é obrigatório';
     }
    
    if (typeof formData.matchNumber !== 'number' || formData.matchNumber < 0) {
      newErrors.matchNumber = 'Número da partida deve ser um número válido';
    }

    if (typeof formData.round !== 'number' || formData.round < 0) {
      newErrors.round = 'Rodada deve ser um número válido';
    }

    // Validar pontuações dos times
    if (formData.top && typeof formData.top.score !== 'number') {
      newErrors.topScore = 'Pontuação do time superior deve ser um número';
    }

    if (formData.bottom && typeof formData.bottom.score !== 'number') {
      newErrors.bottomScore = 'Pontuação do time inferior deve ser um número';
    }

    // Validar URLs de screenshots
    const validateScreenshots = (screenshots, teamName) => {
      if (screenshots) {
        Object.entries(screenshots).forEach(([game, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((url, index) => {
              if (url && !isValidUrl(url)) {
                newErrors[`${teamName}_${game}_${index}`] = `URL inválida para ${teamName} - ${game}`;
              }
            });
          }
        });
      }
    };

    validateScreenshots(formData.screenshots?.top, 'time_superior');
    validateScreenshots(formData.screenshots?.bottom, 'time_inferior');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para validar URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const matchId = match.id || match.battlefyId || match.rawData?._id;
      console.log('🔍 Debug handleSubmit - match object:', match);
      console.log('🔍 Debug handleSubmit - extracted matchId:', matchId);
      console.log('🔍 Debug handleSubmit - formData:', formData);
      
      const updatedMatch = {
        ...match,
        id: matchId, // Garantir que o ID está presente
        rawData: {
          ...match.rawData,
          ...formData,
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('🔍 Debug handleSubmit - updatedMatch being sent:', updatedMatch);
      
      await onSave(updatedMatch);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar partida:', error);
      setErrors({ general: 'Erro ao salvar partida. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpar erros quando o modal é fechado
  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleTeamDataChange = (team, field, value) => {
    setFormData(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: value
      }
    }));
  };

  const handleWinnerChange = (team, isWinner) => {
    setFormData(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        winner: isWinner
      },
      [team === 'top' ? 'bottom' : 'top']: {
        ...prev[team === 'top' ? 'bottom' : 'top'],
        winner: !isWinner
      }
    }));
  };

  const addScreenshot = () => {
    if (!newScreenshotUrl.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      screenshots: {
        ...prev.screenshots,
        [selectedTeam]: {
          ...prev.screenshots[selectedTeam],
          [selectedGame]: [
            ...(prev.screenshots[selectedTeam]?.[selectedGame] || []),
            newScreenshotUrl.trim()
          ]
        }
      }
    }));
    
    setNewScreenshotUrl('');
  };

  const removeScreenshot = (team, game, index) => {
    setFormData(prev => ({
      ...prev,
      screenshots: {
        ...prev.screenshots,
        [team]: {
          ...prev.screenshots[team],
          [game]: prev.screenshots[team]?.[game]?.filter((_, i) => i !== index) || []
        }
      }
    }));
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Editar Partida Battlefy - Avançado
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6">
              {errors.general && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {errors.general}
                </div>
              )}
              
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="battlefyId">Battlefy ID</Label>
                        <Input
                          id="battlefyId"
                          value={formData._id}
                          onChange={(e) => setFormData(prev => ({ ...prev, _id: e.target.value }))}
                          disabled
                          className="bg-muted"
                        />
                        {errors._id && (
                           <p className="text-sm text-destructive mt-1">{errors._id}</p>
                         )}
                      </div>
                      <div>
                        <Label htmlFor="matchNumber">Número da Partida</Label>
                        <Input
                          id="matchNumber"
                          type="number"
                          value={formData.matchNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, matchNumber: parseInt(e.target.value) || 0 }))}
                        />
                        {errors.matchNumber && (
                          <p className="text-sm text-destructive mt-1">{errors.matchNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="round">Rodada</Label>
                        <Input
                          id="round"
                          type="number"
                          value={formData.round}
                          onChange={(e) => setFormData(prev => ({ ...prev, round: parseInt(e.target.value) || 0 }))}
                        />
                        {errors.round && (
                          <p className="text-sm text-destructive mt-1">{errors.round}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="ready">Pronto</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="complete">Completo</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tournamentId">ID do Torneio</Label>
                        <Input
                          id="tournamentId"
                          value={formData.tournamentId}
                          onChange={(e) => setFormData(prev => ({ ...prev, tournamentId: e.target.value }))}
                          className="bg-muted"
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor="stageId">ID do Estágio</Label>
                        <Input
                          id="stageId"
                          value={formData.stageId}
                          onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value }))}
                          className="bg-muted"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="matchType">Tipo da Partida</Label>
                        <Select value={formData.matchType} onValueChange={(value) => setFormData(prev => ({ ...prev, matchType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="winner">Winner</SelectItem>
                            <SelectItem value="loser">Loser</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scheduledTime">Horário Agendado</Label>
                        <Input
                          id="scheduledTime"
                          type="datetime-local"
                          value={formData.scheduledTime ? new Date(formData.scheduledTime).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isComplete"
                          checked={formData.isComplete}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isComplete: checked }))}
                        />
                        <Label htmlFor="isComplete">Partida Completa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isBye"
                          checked={formData.isBye}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBye: checked }))}
                        />
                        <Label htmlFor="isBye">Bye</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="doubleLoss"
                          checked={formData.doubleLoss}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, doubleLoss: checked }))}
                        />
                        <Label htmlFor="doubleLoss">Double Loss</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="inConsolationBracket"
                          checked={formData.inConsolationBracket}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inConsolationBracket: checked }))}
                        />
                        <Label htmlFor="inConsolationBracket">Consolation Bracket</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teams" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Top */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Time Top
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="topTeamID">Team ID</Label>
                        <Input
                          id="topTeamID"
                          value={formData.top.teamID}
                          onChange={(e) => handleTeamDataChange('top', 'teamID', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="topSeedNumber">Seed</Label>
                          <Input
                            id="topSeedNumber"
                            type="number"
                            value={formData.top.seedNumber}
                            onChange={(e) => handleTeamDataChange('top', 'seedNumber', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="topScore">Score</Label>
                          <Input
                            id="topScore"
                            type="number"
                            value={formData.top.score}
                            onChange={(e) => handleTeamDataChange('top', 'score', parseInt(e.target.value) || 0)}
                          />
                          {errors.topScore && (
                            <p className="text-sm text-destructive mt-1">{errors.topScore}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="topReadyAt">Ready At</Label>
                        <Input
                          id="topReadyAt"
                          type="datetime-local"
                          value={formData.top.readyAt ? new Date(formData.top.readyAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleTeamDataChange('top', 'readyAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="topWinner"
                            checked={formData.top.winner}
                            onCheckedChange={(checked) => handleWinnerChange('top', checked)}
                          />
                          <Label htmlFor="topWinner">Vencedor</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="topDisqualified"
                            checked={formData.top.disqualified}
                            onCheckedChange={(checked) => handleTeamDataChange('top', 'disqualified', checked)}
                          />
                          <Label htmlFor="topDisqualified">Desqualificado</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Bottom */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Time Bottom
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="bottomTeamID">Team ID</Label>
                        <Input
                          id="bottomTeamID"
                          value={formData.bottom.teamID}
                          onChange={(e) => handleTeamDataChange('bottom', 'teamID', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="bottomSeedNumber">Seed</Label>
                          <Input
                            id="bottomSeedNumber"
                            type="number"
                            value={formData.bottom.seedNumber}
                            onChange={(e) => handleTeamDataChange('bottom', 'seedNumber', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bottomScore">Score</Label>
                          <Input
                            id="bottomScore"
                            type="number"
                            value={formData.bottom.score}
                            onChange={(e) => handleTeamDataChange('bottom', 'score', parseInt(e.target.value) || 0)}
                          />
                          {errors.bottomScore && (
                            <p className="text-sm text-destructive mt-1">{errors.bottomScore}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bottomReadyAt">Ready At</Label>
                        <Input
                          id="bottomReadyAt"
                          type="datetime-local"
                          value={formData.bottom.readyAt ? new Date(formData.bottom.readyAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleTeamDataChange('bottom', 'readyAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="bottomWinner"
                            checked={formData.bottom.winner}
                            onCheckedChange={(checked) => handleWinnerChange('bottom', checked)}
                          />
                          <Label htmlFor="bottomWinner">Vencedor</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="bottomDisqualified"
                            checked={formData.bottom.disqualified}
                            onCheckedChange={(checked) => handleTeamDataChange('bottom', 'disqualified', checked)}
                          />
                          <Label htmlFor="bottomDisqualified">Desqualificado</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="screenshots" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Screenshots da Partida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="game-1">Game 1</SelectItem>
                          <SelectItem value="game-2">Game 2</SelectItem>
                          <SelectItem value="game-3">Game 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="URL da screenshot"
                        value={newScreenshotUrl}
                        onChange={(e) => setNewScreenshotUrl(e.target.value)}
                      />
                      <Button type="button" onClick={addScreenshot}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formData.screenshots[selectedTeam]?.[selectedGame]?.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="flex-1 text-sm truncate">{url}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScreenshot(selectedTeam, selectedGame, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Configurações Avançadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="createdAt">Criado em</Label>
                        <Input
                          id="createdAt"
                          type="datetime-local"
                          value={formData.createdAt ? new Date(formData.createdAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, createdAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="completedAt">Completado em</Label>
                        <Input
                          id="completedAt"
                          type="datetime-local"
                          value={formData.completedAt ? new Date(formData.completedAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, completedAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Próxima Partida (Vencedor)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="nextMatchID">Match ID</Label>
                          <Input
                            id="nextMatchID"
                            value={formData.next.winner.matchID}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              next: {
                                ...prev.next,
                                winner: {
                                  ...prev.next.winner,
                                  matchID: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="nextPosition">Posição</Label>
                          <Select 
                            value={formData.next.winner.position} 
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              next: {
                                ...prev.next,
                                winner: {
                                  ...prev.next.winner,
                                  position: value
                                }
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="nextRound">Rodada</Label>
                          <Input
                            id="nextRound"
                            type="number"
                            value={formData.next.winner.roundNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              next: {
                                ...prev.next,
                                winner: {
                                  ...prev.next.winner,
                                  roundNumber: parseInt(e.target.value) || 0
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BattlefyAdvancedEditModal;