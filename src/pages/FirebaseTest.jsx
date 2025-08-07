import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Upload,
  Download
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useDataMigration } from '../hooks/useFirebaseStreamers';

const FirebaseTest = () => {
  const { firestore, isConfigured, error, testConnection } = useFirebase();
  const {
    migrating,
    migrationError,
    migrationSuccess,
    migrateFromLocalStorage,
    clearMigrationStatus
  } = useDataMigration();
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [localStorageData, setLocalStorageData] = useState(null);

  // Verifica dados do localStorage
  useEffect(() => {
    const localData = localStorage.getItem('streamers_data');
    if (localData) {
      try {
        const streamers = JSON.parse(localData);
        setLocalStorageData(streamers);
      } catch (err) {
        console.error('Erro ao carregar dados locais:', err);
      }
    }
  }, []);

  // Testa conexão com Firebase
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const result = await testConnection();
      setConnectionStatus(result);
    } catch (err) {
      setConnectionStatus({ success: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  // Exporta dados atuais
  const exportCurrentData = () => {
    if (localStorageData) {
      const dataToExport = {
        streamers: localStorageData,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        source: 'localStorage'
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `streamers-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firebase Status</h1>
        <p className="text-muted-foreground">
          Status da integração Firebase e migração de dados
        </p>
      </div>

      {/* Status do Firebase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Firebase
          </CardTitle>
          <CardDescription>
            Informações sobre a conexão e configuração do Firebase Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da configuração */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Configuração</h3>
              <p className="text-sm text-muted-foreground">
                Firebase configurado diretamente no código
              </p>
            </div>
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>

          {/* Erro do Firebase */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro no Firebase: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Teste de conexão */}
          <div className="space-y-2">
            <Button 
              onClick={handleTestConnection}
              disabled={testingConnection || !isConfigured}
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {testingConnection ? 'Testando...' : 'Testar Conexão'}
            </Button>

            {connectionStatus && (
              <Alert className={connectionStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {connectionStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={connectionStatus.success ? "text-green-800" : "text-red-800"}>
                  {connectionStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Migração de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Migração de Dados
          </CardTitle>
          <CardDescription>
            Migre seus dados existentes do localStorage para o Firebase Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status dos dados locais */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Dados Locais</h3>
              <p className="text-sm text-muted-foreground">
                {localStorageData 
                  ? `${localStorageData.length} streamers encontrados no localStorage`
                  : 'Nenhum dado encontrado no localStorage'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={localStorageData ? "default" : "secondary"}>
                {localStorageData ? `${localStorageData.length} registros` : 'Vazio'}
              </Badge>
              {localStorageData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCurrentData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup
                </Button>
              )}
            </div>
          </div>

          {/* Mensagens de status */}
          {migrationSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Migração concluída com sucesso! Todos os dados foram transferidos para o Firebase.
              </AlertDescription>
            </Alert>
          )}

          {migrationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro na migração: {migrationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={migrateFromLocalStorage}
              disabled={migrating || !localStorageData || !isConfigured}
            >
              {migrating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {migrating ? 'Migrando...' : 'Migrar para Firebase'}
            </Button>
            
            {(migrationSuccess || migrationError) && (
              <Button
                variant="outline"
                onClick={clearMigrationStatus}
              >
                Limpar Status
              </Button>
            )}
          </div>

          {/* Informações */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Informações:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Firebase está configurado diretamente no código</li>
              <li>Os dados serão migrados do localStorage para Firestore</li>
              <li>Após a migração, o sistema usará Firebase como banco principal</li>
              <li>Faça backup dos dados antes de migrar (recomendado)</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-800">⚠️ Erro de Permissões?</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Se você receber "Missing or insufficient permissions", precisa configurar as regras do Firestore:
            </p>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
              <li>Vá em Firestore Database → Rules</li>
              <li>Substitua as regras por: <code className="bg-yellow-100 px-1 rounded">allow read, write: if true;</code></li>
              <li>Clique em "Publish" e aguarde alguns minutos</li>
            </ol>
            <p className="text-xs text-yellow-600 mt-2">
              📄 Consulte o arquivo FIREBASE_SETUP.md para instruções detalhadas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseTest;