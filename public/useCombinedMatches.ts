"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { getClientFirestore } from "@/lib/safeFirestore"

type TeamInfo = {
  id?: string
  name?: string
  logo?: string | null
  avatar?: string | null
}

type MatchData = {
  id: string
  source: 'seed' | 'battlefy' // Identificar a origem dos dados
  tournamentName?: string
  scheduledDate?: string
  completedAt?: string // Data de conclusão da partida (Battlefy)
  format?: string
  game?: string
  isFeatured?: boolean
  team1?: TeamInfo
  team2?: TeamInfo
  status?: 'scheduled' | 'ongoing' | 'finished'
  result?: {
    team1Score: number
    team2Score: number
    winner: null | 'team1' | 'team2'
  }
  resultMD3?: {
    team1Score: number
    team2Score: number
    winner: string | null
  }
  resultMD5?: {
    team1Score: number
    team2Score: number
    winner: string | null
  }
  // Campos específicos do Battlefy
  battlefyId?: string
  round?: number
  matchNumber?: number
  duration?: string
  finalScore?: string
  isBye?: boolean // Indica se é uma partida bye (sem oponente)
  matchType?: 'winner' | 'loser' // Indica se é Winner Bracket ou Loser Bracket
}

interface UseCombinedMatchesReturn {
  matches: MatchData[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Função para mapear status do banco para status da aplicação
function mapStatus(status: string): 'scheduled' | 'ongoing' | 'finished' {
  switch (status?.toLowerCase()) {
    case 'upcoming':
    case 'scheduled':
    case 'pending':
      return 'scheduled'
    case 'live':
    case 'ongoing':
      return 'ongoing'
    case 'finished':
    case 'completed':
    case 'complete':
      return 'finished'
    default:
      return 'scheduled'
  }
}

// Mapear dados das partidas seed (coleção 'matches')
function mapSeedMatches(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>
): MatchData[] {
  return docs.map((d) => {
    const raw = d.data() as Record<string, unknown>
    const team1Raw = (raw.team1 ?? {}) as Record<string, unknown>
    const team2Raw = (raw.team2 ?? {}) as Record<string, unknown>
    
    const team1: TeamInfo = {
      id: (typeof raw.team1Id === "string" ? raw.team1Id : typeof team1Raw.id === "string" ? team1Raw.id : undefined),
      name: typeof team1Raw.name === "string" ? team1Raw.name : "",
      logo: (team1Raw.logo as string | null) ?? (team1Raw.avatar as string | null) ?? null,
      avatar: (team1Raw.avatar as string | null) ?? (team1Raw.logo as string | null) ?? null,
    }
    
    const team2: TeamInfo = {
      id: (typeof raw.team2Id === "string" ? raw.team2Id : typeof team2Raw.id === "string" ? team2Raw.id : undefined),
      name: typeof team2Raw.name === "string" ? team2Raw.name : "",
      logo: (team2Raw.logo as string | null) ?? (team2Raw.avatar as string | null) ?? null,
      avatar: (team2Raw.avatar as string | null) ?? (team2Raw.logo as string | null) ?? null,
    }

    // Mapear resultado
    const resultRaw = (raw.result ?? {}) as Record<string, unknown>
    const result = {
      team1Score: typeof resultRaw.team1Score === "number" ? resultRaw.team1Score : 0,
      team2Score: typeof resultRaw.team2Score === "number" ? resultRaw.team2Score : 0,
      winner: (resultRaw.winner as 'team1' | 'team2' | null) ?? null,
    }

    // Mapear resultMD3
    const resultMD3Raw = (raw.resultMD3 ?? {}) as Record<string, unknown>
    const resultMD3 = {
      team1Score: typeof resultMD3Raw.team1Score === "number" ? resultMD3Raw.team1Score : 0,
      team2Score: typeof resultMD3Raw.team2Score === "number" ? resultMD3Raw.team2Score : 0,
      winner: typeof resultMD3Raw.winner === "string" ? resultMD3Raw.winner : null,
    }

    // Mapear resultMD5
    const resultMD5Raw = (raw.resultMD5 ?? {}) as Record<string, unknown>
    const resultMD5 = {
      team1Score: typeof resultMD5Raw.team1Score === "number" ? resultMD5Raw.team1Score : 0,
      team2Score: typeof resultMD5Raw.team2Score === "number" ? resultMD5Raw.team2Score : 0,
      winner: typeof resultMD5Raw.winner === "string" ? resultMD5Raw.winner : null,
    }
    
    return {
      id: d.id,
      source: 'seed' as const,
      tournamentName: typeof raw.tournamentName === "string" ? raw.tournamentName : undefined,
      scheduledDate: typeof raw.scheduledDate === "string" ? raw.scheduledDate : undefined,
      format: typeof raw.format === "string" ? raw.format : undefined,
      game: typeof raw.game === "string" ? raw.game : undefined,
      isFeatured: Boolean(raw.isFeatured),
      team1,
      team2,
      status: mapStatus(raw.status as string),
      result,
      resultMD3,
      resultMD5,
    }
  })
}

// Mapear dados das partidas do Battlefy (coleção 'battlefy_matches')
function mapBattlefyMatches(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  teamsMap?: Map<string, any>,
  tournamentsMap?: Map<string, any>
): MatchData[] {
  return docs.map((d) => {
    const raw = d.data() as Record<string, unknown>
    
    // Extrair dados do rawData se disponível
    let rawDataParsed: Record<string, unknown> = {}
    if (typeof raw.rawData === "object" && raw.rawData !== null) {
      rawDataParsed = raw.rawData as Record<string, unknown>
    } else if (typeof raw.rawData === "string") {
      try {
        rawDataParsed = JSON.parse(raw.rawData)
      } catch {
        rawDataParsed = {}
      }
    }
    
    // Extrair informações dos times do rawData (top/bottom)
    const topTeam = rawDataParsed.top as Record<string, unknown> || {}
    const bottomTeam = rawDataParsed.bottom as Record<string, unknown> || {}
    
    // Buscar dados dos times usando teamID do rawData
    const topTeamId = typeof topTeam.teamID === "string" ? topTeam.teamID : undefined
    const bottomTeamId = typeof bottomTeam.teamID === "string" ? bottomTeam.teamID : undefined
    
    const topTeamData = topTeamId && teamsMap ? teamsMap.get(topTeamId) : null
    const bottomTeamData = bottomTeamId && teamsMap ? teamsMap.get(bottomTeamId) : null
    
    // Verificar se é uma partida bye (sem oponente)
    const isBye = rawDataParsed.isBye === true || 
                  (topTeam.isBye === true || bottomTeam.isBye === true) ||
                  (!topTeamId && !bottomTeamId) ||
                  (topTeamId && !bottomTeamId) ||
                  (!topTeamId && bottomTeamId)
    
    // Se não encontrar pelos teamIDs, tentar buscar times do mesmo torneio
    let fallbackTeam1Data: any = null
    let fallbackTeam2Data: any = null
    
    if (!topTeamData && !bottomTeamData && teamsMap && teamsMap.size >= 2 && !isBye) {
      const tournamentTeams = Array.from(teamsMap.values()).filter(
        team => team.tournamentId === raw.tournamentId
      )
      
      if (tournamentTeams.length >= 2) {
        const matchIndex = (raw.matchNumber as number) || 0
        fallbackTeam1Data = tournamentTeams[matchIndex % tournamentTeams.length]
        fallbackTeam2Data = tournamentTeams[(matchIndex + 1) % tournamentTeams.length]
      }
    }
    
    // Para partidas bye, configurar apenas o time presente
    const team1: TeamInfo = {
      id: topTeamId || fallbackTeam1Data?.battlefyId,
      name: topTeamData?.name || fallbackTeam1Data?.name || (isBye ? "Time Classificado" : "Time 1"),
      logo: (() => {
        // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
        if (topTeamData?.logoUrl && topTeamData?.tournamentId === raw.tournamentId) {
          return topTeamData.logoUrl
        }
        // Fallback para outros campos
        return topTeamData?.logo || fallbackTeam1Data?.logoUrl || fallbackTeam1Data?.logo || null
      })(),
      avatar: (() => {
        // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
        if (topTeamData?.logoUrl && topTeamData?.tournamentId === raw.tournamentId) {
          return topTeamData.logoUrl
        }
        // Fallback para outros campos
        return topTeamData?.avatar || fallbackTeam1Data?.logoUrl || fallbackTeam1Data?.avatar || null
      })(),
    }
    
    const team2: TeamInfo | undefined = isBye ? undefined : {
      id: bottomTeamId || fallbackTeam2Data?.battlefyId,
      name: bottomTeamData?.name || fallbackTeam2Data?.name || "Time 2",
      logo: (() => {
        // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
        if (bottomTeamData?.logoUrl && bottomTeamData?.tournamentId === raw.tournamentId) {
          return bottomTeamData.logoUrl
        }
        // Fallback para outros campos
        return bottomTeamData?.logo || fallbackTeam2Data?.logoUrl || fallbackTeam2Data?.logo || null
      })(),
      avatar: (() => {
        // Priorizar logoUrl da coleção battlefy_teams se for do mesmo torneio
        if (bottomTeamData?.logoUrl && bottomTeamData?.tournamentId === raw.tournamentId) {
          return bottomTeamData.logoUrl
        }
        // Fallback para outros campos
        return bottomTeamData?.avatar || fallbackTeam2Data?.logoUrl || fallbackTeam2Data?.avatar || null
      })(),
    }

    // Extrair resultados do rawData
    const rawResults = rawDataParsed.results as Record<string, unknown> || {}
    
    // Para partidas bye, configurar automaticamente como vitória do time presente
    let winner: 'team1' | 'team2' | null = null
    let team1Score = 0
    let team2Score = 0
    
    if (isBye) {
      // Partida bye: time presente ganha automaticamente
      winner = 'team1'
      team1Score = 1
      team2Score = 0
    } else {
      // Extrair scores dos times do top/bottom do rawData
      team1Score = typeof topTeam.score === "number" ? topTeam.score : 0
      team2Score = typeof bottomTeam.score === "number" ? bottomTeam.score : 0
      
      // Determinar vencedor baseado no campo winner dos times
      if (typeof topTeam.winner === "boolean" && topTeam.winner) {
        winner = 'team1'
      } else if (typeof bottomTeam.winner === "boolean" && bottomTeam.winner) {
        winner = 'team2'
      }
    }
    
    const result = {
      team1Score,
      team2Score,
      winner,
    }
    
    return {
      id: d.id,
      source: 'battlefy' as const,
      battlefyId: typeof raw.battlefyId === "string" ? raw.battlefyId : undefined,
      tournamentName: (() => {
        // Primeiro tenta usar o tournamentName do documento
        if (typeof raw.tournamentName === "string" && raw.tournamentName !== "Torneio Battlefy") {
          return raw.tournamentName
        }
        // Se não, busca na coleção battlefy_config usando tournamentId
        if (typeof raw.tournamentId === "string" && tournamentsMap) {
          const tournamentConfig = tournamentsMap.get(raw.tournamentId)
          if (tournamentConfig?.tournamentName) {
            return tournamentConfig.tournamentName
          }
        }
        // Fallback padrão
        return "Torneio Battlefy"
      })(),
      scheduledDate: (typeof rawDataParsed.scheduledTime === "string" ? rawDataParsed.scheduledTime : 
                     typeof raw.scheduledTime === "string" ? raw.scheduledTime : undefined),
      completedAt: typeof rawDataParsed.completedAt === "string" ? rawDataParsed.completedAt : undefined,
      format: "Battlefy",
      game: "League of Legends", // Padrão para Battlefy
      isFeatured: false, // Battlefy matches não são featured por padrão
      team1,
      team2,
      status: (() => {
        if (isBye) return 'finished'
        if (rawDataParsed.isComplete === true) return 'finished'
        return mapStatus((rawDataParsed.state as string) || (raw.state as string))
      })(),
      result: (winner !== null || isBye) ? result : undefined,
      round: typeof rawDataParsed.roundNumber === "number" ? rawDataParsed.roundNumber : (typeof raw.round === "number" ? raw.round : undefined),
      matchNumber: typeof rawDataParsed.matchNumber === "number" ? rawDataParsed.matchNumber : (typeof raw.matchNumber === "number" ? raw.matchNumber : undefined),
      duration: (() => {
        if (isBye) return "Bye"
        if (rawDataParsed.completedAt && rawDataParsed.createdAt) {
          const completed = new Date(rawDataParsed.completedAt as string)
          const created = new Date(rawDataParsed.createdAt as string)
          const diffMs = completed.getTime() - created.getTime()
          const diffMins = Math.floor(diffMs / 60000)
          return `${diffMins}min`
        }
        return typeof rawResults.duration === "string" ? rawResults.duration : undefined
      })(),
      finalScore: (() => {
        if (isBye) return "1-0 (Bye)"
        if (team1Score > 0 || team2Score > 0) {
          return `${team1Score}-${team2Score}`
        }
        return typeof rawResults.finalScore === "string" ? rawResults.finalScore : undefined
      })(),
      isBye,
      matchType: rawDataParsed.matchType || topTeam.matchType || bottomTeam.matchType || undefined,
    }
  })
}

export function useCombinedMatches(): UseCombinedMatchesReturn {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMatches = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const db = getClientFirestore()
      
      if (!db) {
        throw new Error("Firebase não configurado")
      }

      // Buscar partidas seed (coleção 'matches')
      const seedQuery = query(collection(db, "matches"))
      const seedSnap = await getDocs(seedQuery)
      const seedMatches = mapSeedMatches(seedSnap.docs)

      // Buscar partidas do Battlefy (coleção 'battlefy_matches')
      let battlefyMatches: MatchData[] = []
      try {
        const battlefyQuery = query(collection(db, "battlefy_matches"))
        const battlefySnap = await getDocs(battlefyQuery)
        
        // Buscar times Battlefy (coleção 'battlefy_teams')
        const teamsQuery = query(collection(db, "battlefy_teams"))
        const teamsSnap = await getDocs(teamsQuery)
        const teamsMap = new Map<string, any>()
        teamsSnap.docs.forEach(doc => {
          const teamData = doc.data()
          if (teamData.battlefyId) {
            // Extrair logoUrl do rawData se disponível
            let logoUrl = null
            if (teamData.rawData && typeof teamData.rawData === 'object') {
              // Priorizar rawData.persistentTeam.logoUrl (estrutura real do Battlefy)
              if (teamData.rawData.persistentTeam && teamData.rawData.persistentTeam.logoUrl) {
                logoUrl = teamData.rawData.persistentTeam.logoUrl
              } else {
                // Fallback para outras possíveis estruturas
                logoUrl = teamData.rawData.logoUrl || teamData.rawData.logo
              }
            }
            
            teamsMap.set(teamData.battlefyId, {
              ...teamData,
              logoUrl: logoUrl
            })
          }
        })
        
        // Buscar configurações de torneios Battlefy (coleção 'battlefy_config')
        const tournamentsQuery = query(collection(db, "battlefy_config"))
        const tournamentsSnap = await getDocs(tournamentsQuery)
        const tournamentsMap = new Map<string, any>()
        tournamentsSnap.docs.forEach(doc => {
          const tournamentData = doc.data()
          if (tournamentData.tournamentId) {
            tournamentsMap.set(tournamentData.tournamentId, tournamentData)
          }
        })
        
        battlefyMatches = mapBattlefyMatches(battlefySnap.docs, teamsMap, tournamentsMap)
      } catch (battlefyError) {
        console.warn("Erro ao carregar partidas do Battlefy (coleção pode não existir):", battlefyError)
        // Continua sem as partidas do Battlefy se a coleção não existir
      }
      
      // Combinar ambas as fontes
      const allMatches = [...seedMatches, ...battlefyMatches]
      
      // Ordenar por data no cliente - separar partidas finalizadas das agendadas
      const sortedData = allMatches.sort((a, b) => {
        // Primeiro critério: partidas finalizadas (com completedAt) vêm primeiro
        const aIsFinished = a.status === 'finished' && a.completedAt
        const bIsFinished = b.status === 'finished' && b.completedAt
        
        if (aIsFinished && !bIsFinished) return -1
        if (!aIsFinished && bIsFinished) return 1
        
        // Segundo critério: ordenar por data (completedAt para finalizadas, scheduledDate para outras)
        const dateA = a.completedAt || a.scheduledDate || ''
        const dateB = b.completedAt || b.scheduledDate || ''
        return dateB.localeCompare(dateA)
      })
      
      setMatches(sortedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar partidas"
      setError(errorMessage)
      console.error("Erro ao carregar partidas:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    loadMatches()
  }

  useEffect(() => {
    loadMatches()
  }, [])

  return {
    matches,
    isLoading,
    error,
    refetch,
  }
}