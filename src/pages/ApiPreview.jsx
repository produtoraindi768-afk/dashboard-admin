import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Download, 
  RefreshCw, 
  Code, 
  Database, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useStreamers, useStreamerStatistics } from '../hooks/useStreamers';
import { streamerAPI } from '../services/streamerService';

const ApiPreview = () => {
  const { streamers, loading: streamersLoading, refreshStreamers } = useStreamers();
  const { statistics, loading: statsLoading, refreshStatistics } = useStreamerStatistics();
  const [copiedEndpoint, setCopiedEndpoint] = useState('');
  const [apiData, setApiData] = useState({});
  const [loadingEndpoints, setLoadingEndpoints] = useState({});

  // Simula endpoints da API
  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/streamers',
      description: 'Obtém todos os streamers',
      example: 'GET /api/streamers?status=online&platform=Twitch'
    },
    {
      method: 'GET',
      path: '/api/streamers/:id',
      description: 'Obtém um streamer específico',
      example: 'GET /api/streamers/123'
    },
    {
      method: 'POST',
      path: '/api/streamers',
      description: 'Cria um novo streamer',
      example: 'POST /api/streamers'
    },
    {
      method: 'PUT',
      path: '/api/streamers/:id',
      description: 'Atualiza um streamer',
      example: 'PUT /api/streamers/123'
    },
    {
      method: 'DELETE',
      path: '/api/streamers/:id',
      description: 'Remove um streamer',
      example: 'DELETE /api/streamers/123'
    },
    {
      method: 'GET',
      path: '/api/statistics',
      description: 'Obtém estatísticas dos streamers',
      example: 'GET /api/statistics'
    }
  ];

  // Carrega dados da API simulada
  const loadApiData = async (endpoint) => {
    setLoadingEndpoints(prev => ({ ...prev, [endpoint]: true }));
    
    try {
      let data;
      switch (endpoint) {
        case 'streamers':
          data = await streamerAPI.getStreamers();
          break;
        case 'streamers-online':
          data = await streamerAPI.getStreamers({ status: 'online' });
          break;
        case 'streamers-offline':
          data = await streamerAPI.getStreamers({ status: 'offline' });
          break;
        case 'statistics':
          data = await streamerAPI.getStatistics();
          break;
        default:
          data = { error: 'Endpoint não encontrado' };
      }
      
      setApiData(prev => ({ ...prev, [endpoint]: data }));
    } catch (error) {
      setApiData(prev => ({ ...prev, [endpoint]: { error: error.message } }));
    } finally {
      setLoadingEndpoints(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  // Carrega dados iniciais
  useEffect(() => {
    loadApiData('streamers');
    loadApiData('statistics');
  }, []);

  // Copia texto para clipboard
  const copyToClipboard = async (text, endpoint) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(''), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Baixa dados como JSON
  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Formata JSON para exibição
  const formatJson = (data) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Preview</h1>
        <p className="text-muted-foreground">
          Visualize os dados da API REST em formato JSON
        </p>
      </div>

      {/* Informações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentação da API
          </CardTitle>
          <CardDescription>
            Endpoints disponíveis para integração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      endpoint.method === 'GET' ? 'default' :
                      endpoint.method === 'POST' ? 'secondary' :
                      endpoint.method === 'PUT' ? 'outline' : 'destructive'
                    }>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(endpoint.example, `endpoint-${index}`)}
                  >
                    {copiedEndpoint === `endpoint-${index}` ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
                <code className="text-xs text-muted-foreground block mt-1">
                  Exemplo: {endpoint.example}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados da API */}
      <Tabs defaultValue="streamers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="streamers">Todos os Streamers</TabsTrigger>
          <TabsTrigger value="online">Online</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Todos os Streamers */}
        <TabsContent value="streamers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    GET /api/streamers
                  </CardTitle>
                  <CardDescription>
                    Lista completa de streamers cadastrados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadApiData('streamers')}
                    disabled={loadingEndpoints.streamers}
                  >
                    {loadingEndpoints.streamers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formatJson(apiData.streamers), 'streamers-json')}
                  >
                    {copiedEndpoint === 'streamers-json' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadJson(apiData.streamers, 'streamers')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
                {apiData.streamers ? formatJson(apiData.streamers) : 'Carregando...'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streamers Online */}
        <TabsContent value="online">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    GET /api/streamers?status=online
                  </CardTitle>
                  <CardDescription>
                    Streamers atualmente online
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadApiData('streamers-online')}
                    disabled={loadingEndpoints['streamers-online']}
                  >
                    {loadingEndpoints['streamers-online'] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formatJson(apiData['streamers-online']), 'online-json')}
                  >
                    {copiedEndpoint === 'online-json' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadJson(apiData['streamers-online'], 'streamers-online')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
                {apiData['streamers-online'] ? formatJson(apiData['streamers-online']) : 'Carregando...'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streamers Offline */}
        <TabsContent value="offline">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    GET /api/streamers?status=offline
                  </CardTitle>
                  <CardDescription>
                    Streamers atualmente offline
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadApiData('streamers-offline')}
                    disabled={loadingEndpoints['streamers-offline']}
                  >
                    {loadingEndpoints['streamers-offline'] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formatJson(apiData['streamers-offline']), 'offline-json')}
                  >
                    {copiedEndpoint === 'offline-json' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadJson(apiData['streamers-offline'], 'streamers-offline')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
                {apiData['streamers-offline'] ? formatJson(apiData['streamers-offline']) : 'Carregando...'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    GET /api/statistics
                  </CardTitle>
                  <CardDescription>
                    Estatísticas gerais dos streamers
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadApiData('statistics')}
                    disabled={loadingEndpoints.statistics}
                  >
                    {loadingEndpoints.statistics ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formatJson(apiData.statistics), 'stats-json')}
                  >
                    {copiedEndpoint === 'stats-json' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadJson(apiData.statistics, 'statistics')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
                {apiData.statistics ? formatJson(apiData.statistics) : 'Carregando...'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Como Usar a API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta é uma API simulada que usa localStorage para demonstração. 
                Em produção, você implementaria endpoints reais em seu backend.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Exemplos de Uso:</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-3 rounded">
                  <code>fetch('/api/streamers')</code>
                  <p className="text-muted-foreground mt-1">Obtém todos os streamers</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <code>fetch('/api/streamers?status=online&platform=Twitch')</code>
                  <p className="text-muted-foreground mt-1">Filtra streamers online da Twitch</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <code>fetch('/api/statistics')</code>
                  <p className="text-muted-foreground mt-1">Obtém estatísticas dos streamers</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiPreview;

