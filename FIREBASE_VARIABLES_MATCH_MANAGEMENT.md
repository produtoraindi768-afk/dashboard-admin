# Variáveis Enviadas para o Firebase - MatchManagement.jsx

Este documento lista todas as variáveis e estruturas de dados que são enviadas para o Firebase através do componente MatchManagement.



## 2. Atualização de Partida (updateMatch)

### Estrutura: `updateData`
```javascript
const updateData = {
  // Mesma estrutura do matchData, mas para atualização
  tournamentId: string,
  team1Id: string,
  team2Id: string,
  scheduledDate: string,
  format: string,
  game: string,
  isFeatured: boolean,
  tournamentName: string,
  team1: { /* mesma estrutura */ },
  team2: { /* mesma estrutura */ },
  resultMD3: { /* mesma estrutura */ },
  resultMD5: { /* mesma estrutura */ }
}
```

### Atualização de Status
```javascript
// Para atualização apenas do status
{
  status: string  // 'scheduled', 'live', 'finished', 'cancelled'
}
```

## 3. Atualização de Resultado (updateMatchResult)

### Estrutura: `resultData`
```javascript
const resultData = {
  // Resultado básico
  team1Score: number,            // Pontuação do time 1
  team2Score: number,            // Pontuação do time 2
  winner: string | null,         // Vencedor ('team1', 'team2' ou null)
  maps: array,                   // Array de mapas com resultados
  
  // Campos condicionais baseados no formato
  // Se formato === 'MD3'
  resultMD3: {
    team1Score: number,          // Pontuação MD3 do time 1
    team2Score: number,          // Pontuação MD3 do time 2
    winner: string | null        // Vencedor MD3
  },
  
  // Se formato === 'MD5'
  resultMD5: {
    team1Score: number,          // Pontuação MD5 do time 1
    team2Score: number,          // Pontuação MD5 do time 2
    winner: string | null        // Vencedor MD5
  }
}
```

## 4. Toggle de Destaque (toggleMatchFeatured)

### Parâmetros:
```javascript
// Função chamada com:
matchId: string,               // ID da partida
isFeatured: boolean            // Novo status de destaque
```

## 5. Exclusão de Partida (deleteMatch)

### Parâmetros:
```javascript
// Função chamada com:
matchId: string                // ID da partida a ser excluída
```

## 6. Estados do Formulário

### Estado `newMatch` (para criação):
```javascript
{
  tournamentId: '',
  team1Id: '',
  team2Id: '',
  scheduledDate: '',
  format: 'MD3',                 // Valor padrão
  game: 'League of Legends',     // Valor padrão
  maps: [],
  isFeatured: false,             // Valor padrão
  team1ScoreMD3: 0,             // Valor padrão
  team2ScoreMD3: 0,             // Valor padrão
  team1ScoreMD5: 0,             // Valor padrão
  team2ScoreMD5: 0              // Valor padrão
}
```

### Estado `editMatch` (para edição):
```javascript
{
  // Mesma estrutura do newMatch
  // Valores são preenchidos com dados da partida existente
}
```

### Estado `matchResult` (para resultados):
```javascript
{
  team1Score: 0,
  team2Score: 0,
  winner: null,
  maps: [],
  team1ScoreMD3: 0,
  team2ScoreMD3: 0,
  team1ScoreMD5: 0,
  team2ScoreMD5: 0
}
```

## 7. Validações Aplicadas

### Validações de Criação/Edição:
- `tournamentId`: Obrigatório
- `team1Id`: Obrigatório
- `team2Id`: Obrigatório e diferente de team1Id
- `scheduledDate`: Obrigatório e não pode ser no passado

### Cálculos Automáticos:
- `maps`: Gerado automaticamente baseado no formato (1, 3 ou 5 mapas)
- `winner` em resultMD3/MD5: Calculado automaticamente baseado nas pontuações
- `tournamentName`: Obtido do objeto tournament selecionado
- Dados de `team1` e `team2`: Obtidos dos objetos team selecionados

## 8. Operações Firebase Utilizadas

1. **createMatch(matchData)** - Criar nova partida
2. **updateMatch(matchId, updateData)** - Atualizar partida existente
3. **updateMatchResult(matchId, resultData)** - Atualizar resultado da partida
4. **deleteMatch(matchId)** - Excluir partida
5. **toggleMatchFeatured(matchId, isFeatured)** - Alternar status de destaque
6. **toggleRealTime(true)** - Ativar atualizações em tempo real

## 9. Dependências Externas

O componente depende de dados de:
- **Teams** (via useFirebaseTeams): Para obter informações dos times
- **Tournaments** (via useFirebaseTournaments): Para obter informações dos torneios
- **Matches** (via useFirebaseMatches): Para operações CRUD das partidas