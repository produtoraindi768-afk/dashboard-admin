# Variáveis do Banco de Dados - Battlefy Import

Este documento lista todas as variáveis e estruturas de dados que são salvas no Firebase durante a importação de dados do Battlefy.

## Coleções Firebase

### 1. `battlefy_config` - Configurações de Torneios

**Estrutura de dados:**
```javascript
{
  tournamentId: string,        // ID do torneio no Battlefy
  stageId: string,            // ID do estágio no Battlefy
  tournamentName: string,     // Nome do torneio
  createdAt: timestamp,       // Data de criação
  updatedAt: timestamp,       // Data de atualização
  isActive: boolean          // Status ativo/inativo
}
```

**Campos principais:**
- `tournamentId` - Identificador único do torneio
- `stageId` - Identificador do estágio/fase do torneio
- `tournamentName` - Nome descritivo do torneio
- `isActive` - Indica se a configuração está ativa

---

### 2. `battlefy_tournaments` - Informações dos Torneios

**Estrutura de dados:**
```javascript
{
  battlefyId: string,         // ID original do Battlefy
  name: string,               // Nome do torneio
  game: string,               // Nome do jogo
  rawData: object,            // Dados completos da API Battlefy
  importedAt: timestamp,      // Data de importação
  updatedAt: timestamp        // Data de atualização
}
```

**Campos principais:**
- `battlefyId` - ID único do torneio no Battlefy
- `name` - Nome oficial do torneio
- `game` - Jogo do torneio (ex: "League of Legends", "Valorant")
- `rawData` - Objeto completo com todos os dados da API

---

### 3. `battlefy_matches` - Partidas do Torneio

**Estrutura de dados:**
```javascript
{
  battlefyId: string,         // ID da partida no Battlefy
  tournamentId: string,       // ID do torneio
  stageId: string,           // ID do estágio
  round: number,             // Número da rodada
  matchNumber: number,       // Número da partida
  state: string,             // Estado da partida (pending, live, complete)
  scheduledTime: string,     // Horário agendado
  teams: array,              // Array com os times da partida
  results: object,           // Resultados da partida (se disponível)
  rawData: object,           // Dados completos da API
  importedAt: timestamp,     // Data de importação
  updatedAt: timestamp       // Data de atualização
}
```

**Campos principais:**
- `battlefyId` - ID único da partida
- `tournamentId` - Referência ao torneio
- `stageId` - Referência ao estágio
- `round` - Rodada da partida (1, 2, 3...)
- `matchNumber` - Número sequencial da partida
- `state` - Status: "pending", "live", "complete" (matches com state "unknown" são ignorados na importação)
- `teams` - Array com informações dos times participantes

**Estrutura do campo `results` (quando disponível):**
```javascript
{
  team1: {
    score: number,           // Pontuação do time 1
    winner: boolean          // Se é o vencedor
  },
  team2: {
    score: number,           // Pontuação do time 2
    winner: boolean          // Se é o vencedor
  },
  finalScore: string,        // Placar final (ex: "2-1")
  duration: string           // Duração da partida (ex: "35 min")
}
```

---

### 4. `battlefy_teams` - Times do Torneio

**Estrutura de dados:**
```javascript
{
  battlefyId: string,         // ID do time no Battlefy
  tournamentId: string,       // ID do torneio
  name: string,               // Nome do time
  players: array,             // Array com jogadores
  rawData: object,            // Dados completos da API
  importedAt: timestamp,      // Data de importação
  updatedAt: timestamp        // Data de atualização
}
```

**Campos principais:**
- `battlefyId` - ID único do time no Battlefy
- `tournamentId` - Referência ao torneio
- `name` - Nome oficial do time
- `players` - Array com informações dos jogadores

---

## Campos de Sistema

### Timestamps Automáticos
- `importedAt` - Data/hora da importação inicial
- `updatedAt` - Data/hora da última atualização
- `createdAt` - Data/hora de criação do registro

### Campos de Referência
- `battlefyId` - ID original do Battlefy (presente em todas as coleções)
- `tournamentId` - Referência cruzada entre coleções
- `stageId` - Identificador do estágio/fase

---

## Estados das Partidas

### Valores possíveis para `state`:
- `"pending"` - Partida agendada, não iniciada
- `"live"` - Partida em andamento
- `"complete"` - Partida finalizada
- `"unknown"` - Estado não identificado

---

## Dados Brutos (rawData)

Todas as coleções incluem um campo `rawData` que contém:
- Dados completos retornados pela API do Battlefy
- Informações adicionais não mapeadas
- Metadados originais
- Estruturas complexas preservadas

---

## Exemplo de Uso

### Para importar no portal, você precisará:

1. **Configuração inicial:**
   - `tournamentId` e `stageId` do Battlefy
   - Nome descritivo do torneio

2. **Dados principais:**
   - Lista de partidas com estados e resultados
   - Lista de times participantes
   - Informações do torneio

3. **Campos de busca recomendados:**
   - `tournamentId` para filtrar por torneio
   - `state` para filtrar partidas por status
   - `round` para organizar por rodadas
   - `importedAt` para ordenar por data de importação

---

## Observações Importantes

- Todos os campos têm valores padrão para evitar erros de `undefined`
- Os resultados são gerados automaticamente para partidas com `state: "complete"`
- Os dados brutos (`rawData`) preservam toda informação original da API
- As referências cruzadas permitem relacionar partidas, times e torneios
- Timestamps são gerenciados automaticamente pelo Firebase