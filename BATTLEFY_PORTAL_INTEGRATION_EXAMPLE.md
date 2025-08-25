# Exemplo de Integração - Portal Battlefy

Este documento fornece exemplos práticos de como acessar e utilizar os dados do Battlefy importados no Firebase.

## Configuração Firebase

```javascript
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase-config';

// Nomes das coleções
const COLLECTIONS = {
  MATCHES: 'battlefy_matches',
  TEAMS: 'battlefy_teams', 
  TOURNAMENTS: 'battlefy_tournaments',
  CONFIG: 'battlefy_config'
};
```

## Exemplos de Consultas

### 1. Buscar Todos os Torneios

```javascript
async function getAllTournaments() {
  try {
    const q = query(
      collection(db, COLLECTIONS.TOURNAMENTS),
      orderBy('importedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const tournaments = [];
    
    snapshot.forEach(doc => {
      tournaments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return tournaments;
  } catch (error) {
    console.error('Erro ao buscar torneios:', error);
    return [];
  }
}
```

### 2. Buscar Partidas de um Torneio Específico

```javascript
async function getMatchesByTournament(tournamentId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MATCHES),
      where('tournamentId', '==', tournamentId),
      orderBy('round', 'asc'),
      orderBy('matchNumber', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const matches = [];
    
    snapshot.forEach(doc => {
      matches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return matches;
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return [];
  }
}
```

### 3. Buscar Partidas Finalizadas com Resultados

```javascript
async function getCompletedMatches(tournamentId = null) {
  try {
    let q;
    
    if (tournamentId) {
      q = query(
        collection(db, COLLECTIONS.MATCHES),
        where('tournamentId', '==', tournamentId),
        where('state', '==', 'complete'),
        orderBy('round', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.MATCHES),
        where('state', '==', 'complete'),
        orderBy('importedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const matches = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.results) { // Apenas partidas com resultados
        matches.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return matches;
  } catch (error) {
    console.error('Erro ao buscar partidas finalizadas:', error);
    return [];
  }
}
```

### 4. Buscar Times de um Torneio

```javascript
async function getTeamsByTournament(tournamentId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.TEAMS),
      where('tournamentId', '==', tournamentId),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const teams = [];
    
    snapshot.forEach(doc => {
      teams.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return teams;
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    return [];
  }
}
```

### 5. Buscar Configurações Ativas

```javascript
async function getActiveConfigs() {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONFIG),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const configs = [];
    
    snapshot.forEach(doc => {
      configs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return configs;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return [];
  }
}
```

## Exemplos de Componentes React

### 1. Lista de Torneios

```jsx
import React, { useState, useEffect } from 'react';

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      const data = await getAllTournaments();
      setTournaments(data);
      setLoading(false);
    };

    fetchTournaments();
  }, []);

  if (loading) return <div>Carregando torneios...</div>;

  return (
    <div className="tournament-list">
      <h2>Torneios Battlefy</h2>
      {tournaments.map(tournament => (
        <div key={tournament.id} className="tournament-card">
          <h3>{tournament.name}</h3>
          <p>Jogo: {tournament.game}</p>
          <p>Importado em: {new Date(tournament.importedAt.toDate()).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};
```

### 2. Tabela de Partidas

```jsx
import React, { useState, useEffect } from 'react';

const MatchesTable = ({ tournamentId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const data = await getMatchesByTournament(tournamentId);
      setMatches(data);
      setLoading(false);
    };

    if (tournamentId) {
      fetchMatches();
    }
  }, [tournamentId]);

  if (loading) return <div>Carregando partidas...</div>;

  return (
    <table className="matches-table">
      <thead>
        <tr>
          <th>Rodada</th>
          <th>Partida</th>
          <th>Status</th>
          <th>Resultado</th>
          <th>Times</th>
        </tr>
      </thead>
      <tbody>
        {matches.map(match => (
          <tr key={match.id}>
            <td>{match.round}</td>
            <td>#{match.matchNumber}</td>
            <td>
              <span className={`status ${match.state}`}>
                {match.state}
              </span>
            </td>
            <td>
              {match.results ? (
                <span className="result">
                  {match.results.finalScore}
                  <small>({match.results.duration})</small>
                </span>
              ) : (
                '-'
              )}
            </td>
            <td>{match.teams.length} times</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 3. Card de Resultados

```jsx
const MatchResultCard = ({ match }) => {
  if (!match.results) return null;

  return (
    <div className="match-result-card">
      <div className="match-header">
        <h4>Round {match.round} - Match #{match.matchNumber}</h4>
        <span className="duration">{match.results.duration}</span>
      </div>
      
      <div className="score-display">
        <div className={`team ${match.results.team1.winner ? 'winner' : ''}`}>
          <span className="team-name">Time 1</span>
          <span className="score">{match.results.team1.score}</span>
        </div>
        
        <div className="vs">VS</div>
        
        <div className={`team ${match.results.team2.winner ? 'winner' : ''}`}>
          <span className="team-name">Time 2</span>
          <span className="score">{match.results.team2.score}</span>
        </div>
      </div>
      
      <div className="final-score">
        Resultado Final: {match.results.finalScore}
      </div>
    </div>
  );
};
```

## Filtros e Buscas Avançadas

### 1. Filtrar por Estado da Partida

```javascript
// Partidas pendentes
const pendingMatches = await query(
  collection(db, COLLECTIONS.MATCHES),
  where('state', '==', 'pending')
);

// Partidas ao vivo
const liveMatches = await query(
  collection(db, COLLECTIONS.MATCHES),
  where('state', '==', 'live')
);
```

### 2. Filtrar por Rodada

```javascript
// Partidas da primeira rodada
const firstRoundMatches = await query(
  collection(db, COLLECTIONS.MATCHES),
  where('tournamentId', '==', tournamentId),
  where('round', '==', 1)
);
```

### 3. Buscar por Período

```javascript
// Torneios importados hoje
const today = new Date();
today.setHours(0, 0, 0, 0);

const todayTournaments = await query(
  collection(db, COLLECTIONS.TOURNAMENTS),
  where('importedAt', '>=', today)
);
```

## Observações Importantes

1. **Índices Firebase**: Certifique-se de criar índices compostos para consultas complexas
2. **Paginação**: Para grandes volumes, implemente paginação usando `limit()` e `startAfter()`
3. **Cache**: Considere usar cache local para melhorar performance
4. **Real-time**: Use `onSnapshot()` para atualizações em tempo real
5. **Tratamento de Erros**: Sempre implemente tratamento de erros adequado

## Estrutura de Dados Resumida

```javascript
// Exemplo de dados retornados
const exampleData = {
  tournament: {
    id: "doc_id",
    battlefyId: "battlefy_tournament_id",
    name: "Championship 2024",
    game: "League of Legends"
  },
  
  match: {
    id: "doc_id",
    battlefyId: "battlefy_match_id",
    tournamentId: "tournament_id",
    round: 1,
    matchNumber: 3,
    state: "complete",
    results: {
      team1: { score: 2, winner: true },
      team2: { score: 1, winner: false },
      finalScore: "2-1",
      duration: "28 min"
    }
  },
  
  team: {
    id: "doc_id",
    battlefyId: "battlefy_team_id",
    tournamentId: "tournament_id",
    name: "Team Alpha",
    players: []
  }
};
```