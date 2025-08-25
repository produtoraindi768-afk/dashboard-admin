# Guia do Battlefy Match Updater

## Visão Geral

O **Battlefy Match Updater** é um serviço TypeScript que substitui o script Python `bot.py` original, fornecendo uma solução mais robusta e integrada para atualizar dados de partidas do Battlefy.

## Principais Funcionalidades

### 🔄 Atualização Automática de Partidas
- Verifica se o torneio existe e está ativo
- Valida se as partidas pertencem ao torneio correto
- Atualiza ou cria novos registros no Firebase
- Mantém histórico de atualizações

### 🛡️ Validação de Dados
- Confirma que `tournamentId` das partidas corresponde ao torneio
- Trata campos `undefined` com valores padrão
- Logs detalhados para debugging

### 🔍 Debug da API
- Testa múltiplos endpoints da API Battlefy
- Fornece informações detalhadas sobre respostas
- Identifica problemas de conectividade ou autenticação

## Como Usar

### 1. Na Interface Web

1. **Acesse a página**: Navegue para "Tournament Data Import"
2. **Configure IDs**: Insira o `Tournament ID` e `Stage ID`
3. **Atualizar Partidas**: Clique no botão "Atualizar Partidas"
4. **Debug (opcional)**: Use "Debug API" para investigar problemas

### 2. Programaticamente

```typescript
import { battlefyMatchUpdater } from '../services/battlefyMatchUpdater';

// Atualizar partidas
const result = await battlefyMatchUpdater.updateTournamentMatches(
  'tournament_id',
  'stage_id'
);

if (result.success) {
  console.log(`${result.matchesCount} partidas atualizadas`);
} else {
  console.error(result.message);
}

// Debug da API
await battlefyMatchUpdater.debugApiEndpoints('tournament_id', 'stage_id');
```

## Estrutura de Dados

### BattlefyMatch
```typescript
interface BattlefyMatch {
  _id: string;                    // ID único da partida
  tournamentId: string;           // ID do torneio (validado)
  stageId: string;               // ID do stage
  round: number;                 // Rodada da partida
  matchNumber: number;           // Número da partida
  state: 'pending' | 'ready' | 'in_progress' | 'complete' | 'cancelled';
  scheduledTime?: string;        // Horário agendado
  teams: (BattlefyTeam | null)[]; // Times participantes
  results?: {                    // Resultados (se disponível)
    finalScore: string;
    duration?: string;
    winner?: string;
  };
}
```

### BattlefyTeam
```typescript
interface BattlefyTeam {
  _id: string;                   // ID único do time
  name?: string;                 // Nome do time
  score?: number;                // Pontuação
  result?: 'win' | 'loss' | 'draw'; // Resultado
}
```

## Dados Salvos no Firebase

Cada partida é salva na coleção `battlefy_matches` com:

```javascript
{
  battlefyId: string,        // ID original do Battlefy
  tournamentId: string,      // ID do torneio (validado)
  stageId: string,          // ID do stage
  round: number,            // Rodada
  matchNumber: number,      // Número da partida
  state: string,            // Estado atual
  scheduledTime: string,    // Horário agendado
  teams: array,             // Times e pontuações
  results: object,          // Resultados (se disponível)
  lastUpdated: string,      // Timestamp da última atualização
  rawData: object           // Dados brutos da API
}
```

## Endpoints Testados

O serviço testa automaticamente estes endpoints:

1. `https://api.battlefy.com/tournaments/{tournamentId}`
2. `https://api.battlefy.com/tournaments/{tournamentId}/stages`
3. `https://api.battlefy.com/stages/{stageId}`
4. `https://api.battlefy.com/stages/{stageId}/matches`
5. `https://api.battlefy.com/tournaments/{tournamentId}/teams`
6. `https://api.battlefy.com/tournaments/{tournamentId}/matches`

## Tratamento de Erros

### Erros Comuns
- **404**: Torneio ou stage não encontrado
- **403**: Acesso negado (possível necessidade de autenticação)
- **401**: Não autorizado
- **Timeout**: Problemas de conectividade

### Logs de Debug
Todos os logs são exibidos no console do navegador:
- ✅ Sucesso
- ❌ Erro
- 🔍 Debug
- ⚠️ Aviso
- 📡 Requisição
- 💾 Salvamento

## Diferenças do Script Python

| Aspecto | Python (bot.py) | TypeScript (battlefyMatchUpdater) |
|---------|-----------------|----------------------------------|
| **Integração** | Script isolado | Integrado ao React/Firebase |
| **Tipagem** | Dinâmica | Estática (TypeScript) |
| **Validação** | Básica | Robusta com verificação de torneio |
| **Persistência** | Arquivo JSON | Firebase Firestore |
| **Interface** | Console | Interface web + console |
| **Tratamento de Erros** | Básico | Avançado com retry e logs |
| **Atualizações** | Manual | Automática com detecção de mudanças |

## Próximos Passos

1. **Agendamento**: Implementar atualização automática periódica
2. **Notificações**: Alertas quando partidas são atualizadas
3. **Histórico**: Manter versões anteriores dos dados
4. **Cache**: Implementar cache para reduzir chamadas à API
5. **Webhooks**: Receber atualizações em tempo real do Battlefy

## Troubleshooting

### Problema: Nenhuma partida encontrada
**Solução**: 
1. Verifique se os IDs estão corretos
2. Use o "Debug API" para testar endpoints
3. Confirme se o torneio está ativo

### Problema: Erro de autenticação
**Solução**:
1. Alguns torneios podem ser privados
2. Verifique se o torneio é público
3. Considere implementar autenticação se necessário

### Problema: Dados não aparecem na interface
**Solução**:
1. Clique em "Atualizar" após a importação
2. Verifique o console para erros
3. Confirme a conexão com Firebase

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs no console do navegador
2. Use a função "Debug API" para diagnosticar
3. Consulte a documentação do Firebase
4. Verifique a documentação da API Battlefy