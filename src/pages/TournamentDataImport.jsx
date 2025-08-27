import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { 
  Download, 
  Upload, 
  Settings, 
  Database, 
  Trophy, 
  Users, 
  Swords,
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { battlefyAPI } from '../services/firebaseBattlefyService';
import { battlefyMatchUpdater } from '../services/battlefyMatchUpdater';

const TournamentDataImport = () => {
  // Estados para configuração
  const [tournamentId, setTournamentId] = useState('68a3db0a4f64b2003f7b4c3f');
  const [stageId, setStageId] = useState('68a64aec397e4d002b97de80');
  const [tournamentName, setTournamentName] = useState('');
  
  // Estados para importação
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [importResults, setImportResults] = useState(null);
  
  // Estados para dados
  const [configs, setConfigs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Estados de carregamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para atualização de partidas
  const [isUpdatingMatches, setIsUpdatingMatches] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  
  // Estados para atualização de torneios
  const [isUpdatingTournament, setIsUpdatingTournament] = useState(false);
  const [tournamentUpdateProgress, setTournamentUpdateProgress] = useState(0);
  const [tournamentUpdateStatus, setTournamentUpdateStatus] = useState('');
  const [tournamentUpdateResults, setTournamentUpdateResults] = useState(null);
  const [selectedConfigForUpdate, setSelectedConfigForUpdate] = useState(null);

  // Carregar configurações salvas ao montar o componente
  useEffect(() => {
    loadConfigs();
  }, []);

  /**
   * Carrega configurações salvas
   */
  const loadConfigs = async () => {
    try {
      const result = await battlefyAPI.getConfigs();
      if (result.success) {
        setConfigs(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  /**
   * Salva configuração atual
   */
  const saveConfig = async () => {
    if (!tournamentId.trim() || !stageId.trim()) {
      setError('Tournament ID e Stage ID são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await battlefyAPI.saveConfig(tournamentId, stageId, tournamentName);
      
      if (result.success) {
        setSuccess('Configuração salva com sucesso!');
        await loadConfigs();
      } else {
        setError(result.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      setError('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega configuração selecionada
   */
  const loadConfig = (config) => {
    setTournamentId(config.tournamentId);
    setStageId(config.stageId);
    setTournamentName(config.tournamentName || '');
    setSuccess('Configuração carregada!');
  };

  /**
   * Deleta configuração salva
   */
  const deleteConfig = async (configId, deleteData = false) => {
    const message = deleteData 
      ? 'Tem certeza que deseja deletar esta configuração E TODOS OS DADOS IMPORTADOS (partidas, times, torneios)? Esta ação não pode ser desfeita!'
      : 'Tem certeza que deseja deletar apenas esta configuração? Os dados importados serão mantidos.';
    
    if (!confirm(message)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = deleteData 
        ? await battlefyAPI.deleteConfigWithData(configId)
        : await battlefyAPI.deleteConfig(configId);
      
      if (result.success) {
        setSuccess(result.message || 'Configuração deletada com sucesso!');
        await loadConfigs();
        
        // Se deletou os dados também, recarregar a lista de dados
        if (deleteData) {
          setMatches([]);
          setTeams([]);
        }
      } else {
        setError(result.error || 'Erro ao deletar configuração');
      }
    } catch (error) {
      setError('Erro ao deletar configuração');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mostra opções de exclusão para o usuário
   */
  const showDeleteOptions = (configId) => {
    const choice = confirm(
      'Escolha uma opção:\n\n' +
      'OK = Deletar APENAS a configuração (manter dados importados)\n' +
      'Cancelar = Ver opção para deletar configuração + dados'
    );
    
    if (choice) {
      // Deletar apenas configuração
      deleteConfig(configId, false);
    } else {
      // Perguntar se quer deletar configuração + dados
      const deleteWithData = confirm(
        'Deseja deletar a configuração E TODOS OS DADOS IMPORTADOS?\n\n' +
        'ATENÇÃO: Esta ação irá remover permanentemente:\n' +
        '• A configuração salva\n' +
        '• Todas as partidas importadas\n' +
        '• Todos os times importados\n' +
        '• Informações do torneio\n\n' +
        'Esta ação NÃO PODE ser desfeita!'
      );
      
      if (deleteWithData) {
        deleteConfig(configId, true);
      }
    }
  };

  /**
   * Inicia importação de dados
   */
  const startImport = async () => {
    if (!tournamentId.trim() || !stageId.trim()) {
      setError('Tournament ID e Stage ID são obrigatórios');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus('Iniciando importação...');
    setError('');
    setImportResults(null);

    try {
      const result = await battlefyAPI.importData(
        tournamentId, 
        stageId, 
        (status) => {
          setImportStatus(status);
          setImportProgress(prev => Math.min(prev + 25, 90));
        }
      );
      
      setImportProgress(100);
      setImportResults(result);
      
      if (result.success) {
        setImportStatus('Importação concluída com sucesso!');
        setSuccess('Dados importados com sucesso!');
        await loadData();
      } else {
        setImportStatus('Importação concluída com erros');
        setError(result.error || 'Erro na importação');
      }
    } catch (error) {
      setImportStatus('Erro na importação');
      setError('Erro ao importar dados');
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Carrega dados importados
   */
  const loadData = async () => {
    try {
      const [matchesResult, teamsResult] = await Promise.all([
        battlefyAPI.getMatches(tournamentId),
        battlefyAPI.getTeams(tournamentId)
      ]);
      
      if (matchesResult.success) {
        setMatches(matchesResult.data);
      }
      
      if (teamsResult.success) {
        setTeams(teamsResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  /**
   * Limpa dados importados
   */
  const clearData = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados importados?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await battlefyAPI.clearData(tournamentId);
      
      if (result.success) {
        setSuccess('Dados limpos com sucesso!');
        setMatches([]);
        setTeams([]);
      } else {
        setError(result.error || 'Erro ao limpar dados');
      }
    } catch (error) {
      setError('Erro ao limpar dados');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza partidas usando o novo serviço TypeScript
   */
  const updateMatches = async () => {
    if (!tournamentId.trim() || !stageId.trim()) {
      setError('Tournament ID e Stage ID são obrigatórios');
      return;
    }

    setIsUpdatingMatches(true);
    setUpdateStatus('Verificando torneio...');
    setError('');
    setSuccess('');

    try {
      // Usar o novo serviço TypeScript para atualizar partidas
      const result = await battlefyMatchUpdater.updateTournamentMatches(tournamentId, stageId);
      
      if (result.success) {
        setUpdateStatus('Atualização concluída!');
        setSuccess(`${result.message} (${result.matchesCount} partidas)`);
        
        // Recarregar dados após atualização
        await loadData();
      } else {
        setUpdateStatus('Erro na atualização');
        setError(result.message || 'Erro ao atualizar partidas');
      }
    } catch (error) {
      console.error('Erro ao atualizar partidas:', error);
      setUpdateStatus('Erro na atualização');
      setError('Erro ao atualizar partidas: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUpdatingMatches(false);
      setUpdateStatus('');
    }
  };

  /**
   * Atualiza dados do torneio sem duplicar
   */
  const updateTournament = async () => {
    if (!tournamentId.trim() || !stageId.trim()) {
      setError('Tournament ID e Stage ID são obrigatórios');
      return;
    }

    setIsUpdatingTournament(true);
    setSelectedConfigForUpdate(null);
    setTournamentUpdateProgress(0);
    setTournamentUpdateStatus('Iniciando atualização...');
    setError('');
    setTournamentUpdateResults(null);

    try {
      const result = await battlefyAPI.updateTournament(
        tournamentId, 
        stageId, 
        (status) => {
          setTournamentUpdateStatus(status);
          setTournamentUpdateProgress(prev => Math.min(prev + 25, 90));
        }
      );
      
      setTournamentUpdateProgress(100);
      setTournamentUpdateResults(result);
      
      if (result.success) {
        setTournamentUpdateStatus('Atualização concluída com sucesso!');
        setSuccess('Torneio atualizado com sucesso!');
        await loadData();
      } else {
        setTournamentUpdateStatus('Atualização concluída com erros');
        setError(result.error || 'Erro na atualização');
      }
    } catch (error) {
      setTournamentUpdateStatus('Erro na atualização');
      setError('Erro ao atualizar torneio');
    } finally {
      setIsUpdatingTournament(false);
      setSelectedConfigForUpdate(null);
    }
  };

  /**
   * Atualiza um torneio específico da lista de configurações
   */
  const updateSpecificTournament = async (config) => {
    setIsUpdatingTournament(true);
    setSelectedConfigForUpdate(config);
    setTournamentUpdateProgress(0);
    setTournamentUpdateStatus(`Iniciando atualização de "${config.tournamentName || 'Torneio sem nome'}"...`);
    setError('');
    setSuccess('');
    setTournamentUpdateResults(null);

    try {
      const result = await battlefyAPI.updateTournament(
        config.tournamentId, 
        config.stageId, 
        (status) => {
          setTournamentUpdateStatus(status);
          setTournamentUpdateProgress(prev => Math.min(prev + 25, 90));
        }
      );
      
      setTournamentUpdateProgress(100);
      setTournamentUpdateResults(result);
      
      if (result.success) {
        setTournamentUpdateStatus(`"${config.tournamentName || 'Torneio'}" atualizado com sucesso!`);
        setSuccess(`Torneio "${config.tournamentName || 'sem nome'}" atualizado com sucesso!`);
        await loadData();
      } else {
        setTournamentUpdateStatus('Atualização concluída com erros');
        setError(result.error || 'Erro na atualização');
      }
    } catch (error) {
      setTournamentUpdateStatus('Erro na atualização');
      setError(`Erro ao atualizar torneio "${config.tournamentName || 'sem nome'}": ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsUpdatingTournament(false);
      setSelectedConfigForUpdate(null);
    }
  };

  /**
   * Debug da API Battlefy
   */
  const debugApi = async () => {
    if (!tournamentId.trim() || !stageId.trim()) {
      setError('Tournament ID e Stage ID são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await battlefyMatchUpdater.debugApiEndpoints(tournamentId, stageId);
      setSuccess('Debug executado! Verifique o console para detalhes.');
    } catch (error) {
      console.error('Erro no debug:', error);
      setError('Erro ao executar debug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importação Battlefy</h1>
        <p className="text-muted-foreground">
          Configure e importe dados de torneios da API Battlefy para o Firebase
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração do Torneio
            </CardTitle>
            <CardDescription>
              Configure os IDs do torneio e stage para importação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tournamentId">Tournament ID *</Label>
              <Input
                id="tournamentId"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="68a3db0a4f64b2003f7b4c3f"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stageId">Stage ID *</Label>
              <Input
                id="stageId"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                placeholder="68a64aec397e4d002b97de80"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournamentName">Nome do Torneio (opcional)</Label>
              <Input
                id="tournamentName"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Nome do torneio"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveConfig} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                Salvar Config
              </Button>
              
              <Button 
                onClick={startImport} 
                disabled={isImporting || !tournamentId || !stageId}
                variant="default"
                className="flex-1"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Importar Dados
              </Button>
            </div>
            
            {/* Informações da API */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Como obter os IDs:</span>
              </div>
              <p className="text-xs text-muted-foreground">
                1. Acesse o torneio no Battlefy<br/>
                2. Tournament ID: último segmento da URL do torneio<br/>
                3. Stage ID: inspecione a página e procure por "stageId"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status da Importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Status da Importação
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso da importação de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">{importStatus}</p>
              </div>
            )}
            
            {importResults && (
              <div className="space-y-3">
                <h4 className="font-medium">Resultados da Importação:</h4>
                
                {importResults.results.tournament && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Torneio</span>
                    <Badge variant={importResults.results.tournament.success ? "default" : "destructive"}>
                      {importResults.results.tournament.success ? 'Sucesso' : 'Erro'}
                    </Badge>
                  </div>
                )}
                
                {importResults.results.matches && (
                  <div className="p-2 bg-muted rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Partidas</span>
                      <Badge variant={importResults.results.matches.success ? "default" : "destructive"}>
                        {importResults.results.matches.success ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    {importResults.results.matches.stats && (
                      <div className="text-xs text-muted-foreground">
                        Total: {importResults.results.matches.stats.total} | 
                        Novas: {importResults.results.matches.stats.new} | 
                        Atualizadas: {importResults.results.matches.stats.updated} | 
                        Duplicatas evitadas: {importResults.results.matches.stats.duplicatesAvoided}
                      </div>
                    )}
                  </div>
                )}
                
                {importResults.results.teams && (
                  <div className="p-2 bg-muted rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Times</span>
                      <Badge variant={importResults.results.teams.success ? "default" : "destructive"}>
                        {importResults.results.teams.success ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    {importResults.results.teams.stats && (
                      <div className="text-xs text-muted-foreground">
                        Total: {importResults.results.teams.stats.total} | 
                        Novos: {importResults.results.teams.stats.new} | 
                        Atualizados: {importResults.results.teams.stats.updated} | 
                        Duplicatas evitadas: {importResults.results.teams.stats.duplicatesAvoided}
                      </div>
                    )}
                  </div>
                )}
                
                {importResults.results.errors.length > 0 && (
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="text-sm font-medium text-destructive mb-1">Erros:</p>
                    {importResults.results.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive">• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={loadData} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
                
                <Button 
                  onClick={clearData} 
                  variant="destructive" 
                  size="sm"
                  disabled={loading}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Dados
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={updateMatches} 
                  variant="default" 
                  size="sm"
                  disabled={isUpdatingMatches || !tournamentId || !stageId}
                  className="flex-1"
                >
                  {isUpdatingMatches ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="h-4 w-4" />
                  )}
                  Atualizar Partidas
                </Button>
                
                <Button 
                  onClick={debugApi} 
                  variant="outline" 
                  size="sm"
                  disabled={loading || !tournamentId || !stageId}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4" />
                  Debug API
                </Button>
              </div>
              
              {/* Status da atualização de partidas */}
              {isUpdatingMatches && updateStatus && (
                <div className="p-2 bg-muted rounded text-sm text-center">
                  {updateStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Atualização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Atualizar Torneio
            </CardTitle>
            <CardDescription>
              Atualize dados de torneios já importados sem duplicar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progresso da atualização */}
            {isUpdatingTournament && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{tournamentUpdateProgress}%</span>
                </div>
                <Progress value={tournamentUpdateProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">{tournamentUpdateStatus}</p>
              </div>
            )}
            
            {/* Resultados da atualização */}
            {tournamentUpdateResults && (
              <div className="space-y-3">
                <h4 className="font-medium">Resultados da Atualização:</h4>
                
                {tournamentUpdateResults.results.tournament && (
                   <div className="flex items-center justify-between p-2 bg-muted rounded">
                     <span className="text-sm">Torneio</span>
                     <Badge variant={
                       !tournamentUpdateResults.results.tournament.success ? "destructive" :
                       tournamentUpdateResults.results.tournament.action === 'updated' ? "default" :
                       tournamentUpdateResults.results.tournament.action === 'no_changes' ? "secondary" : "default"
                     }>
                       {tournamentUpdateResults.results.tournament.action === 'updated' ? 'Atualizado' : 
                        tournamentUpdateResults.results.tournament.action === 'no_changes' ? 'Sem mudanças' : 
                        tournamentUpdateResults.results.tournament.action === 'created' ? 'Criado' : 'Erro'}
                     </Badge>
                   </div>
                 )}
                
                {tournamentUpdateResults.results.matches && (
                  <div className="p-2 bg-muted rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Partidas</span>
                      <Badge variant={tournamentUpdateResults.results.matches.success ? "default" : "destructive"}>
                        {tournamentUpdateResults.results.matches.success ? 'Atualizadas' : 'Erro'}
                      </Badge>
                    </div>
                    {tournamentUpdateResults.results.matches.stats && (
                       <div className="text-xs text-muted-foreground">
                         Total: {tournamentUpdateResults.results.matches.stats.total} | 
                         Novas: {tournamentUpdateResults.results.matches.stats.new} | 
                         Atualizadas: {tournamentUpdateResults.results.matches.stats.updated} | 
                         {tournamentUpdateResults.results.matches.stats.skippedUnknown > 0 && `Puladas: ${tournamentUpdateResults.results.matches.stats.skippedUnknown} | `}
                         Sem mudanças: {tournamentUpdateResults.results.matches.stats.total - tournamentUpdateResults.results.matches.stats.new - tournamentUpdateResults.results.matches.stats.updated - (tournamentUpdateResults.results.matches.stats.skippedUnknown || 0)}
                       </div>
                     )}
                  </div>
                )}
                
                {tournamentUpdateResults.results.teams && (
                  <div className="p-2 bg-muted rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Times</span>
                      <Badge variant={tournamentUpdateResults.results.teams.success ? "default" : "destructive"}>
                        {tournamentUpdateResults.results.teams.success ? 'Atualizados' : 'Erro'}
                      </Badge>
                    </div>
                    {tournamentUpdateResults.results.teams.stats && (
                       <div className="text-xs text-muted-foreground">
                         Total: {tournamentUpdateResults.results.teams.stats.total} | 
                         Novos: {tournamentUpdateResults.results.teams.stats.new} | 
                         Atualizados: {tournamentUpdateResults.results.teams.stats.updated} | 
                         Sem mudanças: {tournamentUpdateResults.results.teams.stats.duplicatesAvoided || 0}
                       </div>
                     )}
                  </div>
                )}
                
                {tournamentUpdateResults.results.errors && tournamentUpdateResults.results.errors.length > 0 && (
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="text-sm font-medium text-destructive mb-1">Erros:</p>
                    {tournamentUpdateResults.results.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive">• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Botões de ação */}
            <div className="space-y-2">
              <Button 
                onClick={updateTournament} 
                disabled={isUpdatingTournament || !tournamentId || !stageId}
                className="w-full"
              >
                {isUpdatingTournament ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar Torneio
              </Button>
              
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Sobre a Atualização:</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  • Atualiza dados sem criar duplicatas<br/>
                  • Mantém dados existentes e adiciona novos<br/>
                  • Requer que o torneio já tenha sido importado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Salvas */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configurações Salvas
            </CardTitle>
            <CardDescription>
              Configurações de torneios salvos anteriormente. Clique no botão de atualização para atualizar um torneio específico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {configs.map((config) => (
                <div key={config.id} className="p-3 border rounded-lg">
                  <div className="space-y-2">
                    <h4 className="font-medium truncate">
                      {config.tournamentName || 'Torneio sem nome'}
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Tournament: {config.tournamentId.substring(0, 8)}...</p>
                      <p>Stage: {config.stageId.substring(0, 8)}...</p>
                      <p>Criado: {new Date(config.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => loadConfig(config)} 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        Carregar
                      </Button>
                      <Button 
                        onClick={() => updateSpecificTournament(config)} 
                        size="sm" 
                        variant="default"
                        disabled={isUpdatingTournament}
                        className="px-2"
                        title="Atualizar este torneio"
                      >
                        {isUpdatingTournament && selectedConfigForUpdate?.id === config.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                      <Button 
                        onClick={() => showDeleteOptions(config.id)} 
                        size="sm" 
                        variant="destructive"
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de Atualização Individual */}
      {selectedConfigForUpdate && isUpdatingTournament && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Atualizando Torneio Específico
            </CardTitle>
            <CardDescription className="text-blue-600">
              Atualizando "{selectedConfigForUpdate.tournamentName || 'Torneio sem nome'}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{tournamentUpdateProgress}%</span>
              </div>
              <Progress value={tournamentUpdateProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{tournamentUpdateStatus}</p>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1 p-2 bg-white/50 rounded">
              <p><strong>Tournament ID:</strong> {selectedConfigForUpdate.tournamentId.substring(0, 12)}...</p>
              <p><strong>Stage ID:</strong> {selectedConfigForUpdate.stageId.substring(0, 12)}...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Importados */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Partidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Partidas Importadas
              <Badge variant="secondary">{matches.length}</Badge>
              {matches.filter(m => m.results).length > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {matches.filter(m => m.results).length} com resultados
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {matches.slice(0, 10).map((match) => (
                  <div key={match.id} className="p-3 border rounded text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Round {match.round}</span>
                      <Badge variant="outline" size="sm">{match.state}</Badge>
                    </div>
                    
                    {/* Informações básicas da partida */}
                    <p className="text-xs text-muted-foreground mb-2">
                      Match #{match.matchNumber} • {match.teams?.length || 0} times
                    </p>
                    
                    {/* Resultados se disponíveis */}
                    {match.results && (
                      <div className="mt-2 p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-green-600">
                            Resultado: {match.results.finalScore}
                          </span>
                          <span className="text-muted-foreground">
                            {match.results.duration}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className={match.results.team1.winner ? 'font-semibold text-green-600' : 'text-muted-foreground'}>
                            Time 1: {match.results.team1.score}
                          </span>
                          <span className={match.results.team2.winner ? 'font-semibold text-green-600' : 'text-muted-foreground'}>
                            Time 2: {match.results.team2.score}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {matches.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{matches.length - 10} partidas adicionais
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma partida importada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Times Importados
              <Badge variant="secondary">{teams.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {teams.slice(0, 10).map((team) => (
                  <div key={team.id} className="p-2 border rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{team.name}</span>
                      <Badge variant="outline" size="sm">
                        {team.players?.length || 0} jogadores
                      </Badge>
                    </div>
                  </div>
                ))}
                {teams.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{teams.length - 10} times adicionais
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum time importado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TournamentDataImport;