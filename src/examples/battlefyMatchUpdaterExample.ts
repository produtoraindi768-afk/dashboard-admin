/**
 * Exemplo de uso do Battlefy Match Updater
 * 
 * Este arquivo demonstra como usar o serviço battlefyMatchUpdater
 * em diferentes cenários e componentes React.
 */

import { battlefyMatchUpdater } from '../services/battlefyMatchUpdater';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Exemplo 1: Atualização simples de partidas
export const simpleMatchUpdate = async () => {
  const tournamentId = '68a3db0a4f64b2003f7b4c3f';
  const stageId = '68a64aec397e4d002b97de80';

  try {
    console.log('🚀 Iniciando atualização de partidas...');
    
    const result = await battlefyMatchUpdater.updateTournamentMatches(
      tournamentId, 
      stageId
    );

    if (result.success) {
      console.log('✅ Sucesso:', result.message);
      console.log('📊 Partidas processadas:', result.matchesCount);
    } else {
      console.error('❌ Erro:', result.message);
    }
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
};

// Exemplo 2: Verificação de status do torneio
export const checkTournamentExample = async () => {
  const tournamentId = '68a3db0a4f64b2003f7b4c3f';

  try {
    const response = await battlefyMatchUpdater.checkTournamentStatus(tournamentId);
    
    if (response.success && response.data) {
      const tournament = response.data;
      console.log('🏆 Torneio encontrado:');
      console.log('   Nome:', tournament.name);
      console.log('   Jogo:', tournament.game);
      console.log('   Status:', tournament.status);
      console.log('   Stages:', tournament.stages?.length || 0);
    } else {
      console.log('❌ Torneio não encontrado:', response.error);
    }
  } catch (error) {
    console.error('💥 Erro ao verificar torneio:', error);
  }
};

// Exemplo 3: Debug completo da API
export const debugApiExample = async () => {
  const tournamentId = '68a3db0a4f64b2003f7b4c3f';
  const stageId = '68a64aec397e4d002b97de80';

  try {
    console.log('🔍 Iniciando debug da API Battlefy...');
    await battlefyMatchUpdater.debugApiEndpoints(tournamentId, stageId);
    console.log('✅ Debug concluído! Verifique os logs acima.');
  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
};

// Exemplo 4: Hook React personalizado para atualização de partidas
export const useBattlefyMatchUpdater = () => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const updateMatches = async (tournamentId: string, stageId: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    setUpdateStatus('Verificando torneio...');

    try {
      const result = await battlefyMatchUpdater.updateTournamentMatches(
        tournamentId, 
        stageId
      );

      if (result.success) {
        setSuccess(`Atualização concluída! ${result.matchesCount} partidas processadas.`);
        setUpdateStatus('Concluído');
      } else {
        setError(result.message || 'Erro na atualização');
        setUpdateStatus('Erro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao atualizar: ${errorMessage}`);
      setUpdateStatus('Erro');
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };

  const debugApi = async (tournamentId: string, stageId: string) => {
    try {
      await battlefyMatchUpdater.debugApiEndpoints(tournamentId, stageId);
      setSuccess('Debug executado! Verifique o console.');
    } catch (err) {
      setError('Erro ao executar debug');
    }
  };

  return {
    isUpdating,
    updateStatus,
    error,
    success,
    updateMatches,
    debugApi,
    clearMessages: () => {
      setError(null);
      setSuccess(null);
    }
  };
};

// Exemplo 5: Componente React que usa o serviço
export const BattlefyMatchUpdaterComponent: React.FC<{
  tournamentId: string;
  stageId: string;
}> = ({ tournamentId, stageId }) => {
  const {
    isUpdating,
    updateStatus,
    error,
    success,
    updateMatches,
    debugApi,
    clearMessages
  } = useBattlefyMatchUpdater();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => updateMatches(tournamentId, stageId)}
          disabled={isUpdating || !tournamentId || !stageId}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isUpdating ? 'Atualizando...' : 'Atualizar Partidas'}
        </button>
        
        <button
          onClick={() => debugApi(tournamentId, stageId)}
          disabled={isUpdating || !tournamentId || !stageId}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Debug API
        </button>
      </div>

      {updateStatus && (
        <div className="p-2 bg-blue-100 rounded text-sm">
          Status: {updateStatus}
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
          Erro: {error}
          <button 
            onClick={clearMessages}
            className="ml-2 text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {success && (
        <div className="p-2 bg-green-100 text-green-700 rounded text-sm">
          {success}
          <button 
            onClick={clearMessages}
            className="ml-2 text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
};

// Exemplo 6: Função para buscar partidas atualizadas do Firebase
export const getUpdatedMatches = async (tournamentId: string) => {
  try {
    const matchesCollection = collection(db, 'battlefy_matches');
    const q = query(
      matchesCollection,
      where('tournamentId', '==', tournamentId)
    );
    
    const querySnapshot = await getDocs(q);
    const matches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Encontradas ${matches.length} partidas para o torneio ${tournamentId}`);
    return matches;
  } catch (error) {
    console.error('❌ Erro ao buscar partidas:', error);
    return [];
  }
};

// Exemplo 7: Listener em tempo real para mudanças nas partidas
export const subscribeToMatchUpdates = (
  tournamentId: string,
  callback: (matches: any[]) => void
) => {
  const matchesCollection = collection(db, 'battlefy_matches');
  const q = query(
    matchesCollection,
    where('tournamentId', '==', tournamentId)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const matches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🔄 Partidas atualizadas: ${matches.length}`);
    callback(matches);
  }, (error) => {
    console.error('❌ Erro no listener de partidas:', error);
  });

  return unsubscribe;
};

// Exemplo 8: Função para atualização agendada (usar com cuidado)
export const scheduleMatchUpdates = (
  tournamentId: string,
  stageId: string,
  intervalMinutes: number = 5
) => {
  console.log(`⏰ Agendando atualizações a cada ${intervalMinutes} minutos`);
  
  const intervalId = setInterval(async () => {
    try {
      console.log('🔄 Executando atualização agendada...');
      const result = await battlefyMatchUpdater.updateTournamentMatches(
        tournamentId,
        stageId
      );
      
      if (result.success) {
        console.log(`✅ Atualização agendada concluída: ${result.matchesCount} partidas`);
      } else {
        console.log(`⚠️ Atualização agendada falhou: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 Erro na atualização agendada:', error);
    }
  }, intervalMinutes * 60 * 1000);

  // Retornar função para cancelar o agendamento
  return () => {
    clearInterval(intervalId);
    console.log('⏹️ Atualizações agendadas canceladas');
  };
};

// Exemplo 9: Validação de IDs antes da atualização
export const validateAndUpdate = async (
  tournamentId: string,
  stageId: string
) => {
  // Validar formato dos IDs
  const idRegex = /^[a-f0-9]{24}$/i;
  
  if (!idRegex.test(tournamentId)) {
    throw new Error('Tournament ID inválido. Deve ter 24 caracteres hexadecimais.');
  }
  
  if (!idRegex.test(stageId)) {
    throw new Error('Stage ID inválido. Deve ter 24 caracteres hexadecimais.');
  }

  // Verificar se o torneio existe antes de tentar atualizar
  const tournamentCheck = await battlefyMatchUpdater.checkTournamentStatus(tournamentId);
  
  if (!tournamentCheck.success) {
    throw new Error(`Torneio não encontrado: ${tournamentCheck.error}`);
  }

  // Proceder com a atualização
  return await battlefyMatchUpdater.updateTournamentMatches(tournamentId, stageId);
};

// Exemplo 10: Função utilitária para logs formatados
export const logMatchUpdateResult = (result: any) => {
  console.group('📊 Resultado da Atualização de Partidas');
  console.log('✅ Sucesso:', result.success);
  console.log('📝 Mensagem:', result.message);
  
  if (result.matchesCount !== undefined) {
    console.log('🎯 Partidas processadas:', result.matchesCount);
  }
  
  if (!result.success) {
    console.error('❌ Detalhes do erro:', result.message);
  }
  
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.groupEnd();
};