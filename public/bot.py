import requests
import json
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Desativar avisos de SSL
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# IDs do torneio
tournament_id = "68a3db0a4f64b2003f7b4c3f"
stage_id = "68a64aec397e4d002b97de80"

def debug_api_endpoints():
    """Debug completo dos endpoints da API"""
    print("🔍 INICIANDO DEBUG DETALHADO DA API BATTLEFY")
    print("=" * 60)
    
    # Testar vários endpoints possíveis
    endpoints = [
        f"https://api.battlefy.com/tournaments/{tournament_id}",
        f"https://api.battlefy.com/tournaments/{tournament_id}/stages",
        f"https://api.battlefy.com/stages/{stage_id}",
        f"https://api.battlefy.com/stages/{stage_id}/matches",
        f"https://api.battlefy.com/tournaments/{tournament_id}/teams",
        f"https://api.battlefy.com/tournaments/{tournament_id}/matches",
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Testando: {endpoint}")
            response = requests.get(endpoint, verify=False, timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Tamanho resposta: {len(str(data))} caracteres")
                
                if isinstance(data, list):
                    print(f"   Itens na lista: {len(data)}")
                    if data and isinstance(data[0], dict):
                        print(f"   Campos do primeiro item: {list(data[0].keys())}")
                elif isinstance(data, dict):
                    print(f"   Campos disponíveis: {list(data.keys())}")
                    
                    # Mostrar alguns valores importantes
                    for key in ['name', 'title', 'teams', 'matches', 'bracket']:
                        if key in data:
                            value = data[key]
                            if isinstance(value, list):
                                print(f"   {key}: {len(value)} itens")
                            else:
                                print(f"   {key}: {value}")
            
            elif response.status_code == 404:
                print("   ❌ Endpoint não encontrado")
            elif response.status_code == 403:
                print("   🔒 Acesso proibido -可能需要 autenticação")
            elif response.status_code == 401:
                print("   🔐 Não autorizado")
                
        except Exception as e:
            print(f"   💥 Erro: {str(e)}")

def get_detailed_matches_alternative():
    """Tentativa alternativa de obter partidas detalhadas"""
    print("\n" + "=" * 60)
    print("🔄 TENTANDO MÉTODOS ALTERNATIVOS")
    print("=" * 60)
    
    # Tentar com headers diferentes
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': f'https://battlefy.com/tournaments/{tournament_id}'
    }
    
    # Tentar endpoint de matches com query parameters
    try:
        url = f"https://api.battlefy.com/stages/{stage_id}/matches?populate=teams"
        print(f"🎯 Tentando: {url}")
        
        response = requests.get(url, headers=headers, verify=False, timeout=15)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            matches = response.json()
            print(f"   Partidas encontradas: {len(matches)}")
            
            # Analisar cada partida
            for i, match in enumerate(matches[:5]):  # Mostrar apenas 5 primeiras
                print(f"\n   Partida {i+1}:")
                print(f"     ID: {match.get('_id')}")
                print(f"     Round: {match.get('round')}")
                print(f"     Número: {match.get('matchNumber')}")
                print(f"     Estado: {match.get('state')}")
                
                teams = match.get('teams', [])
                print(f"     Times: {len(teams)}")
                
                for j, team in enumerate(teams):
                    if team:
                        print(f"       Time {j+1}: ID={team.get('_id')}, Score={team.get('score')}, Result={team.get('result')}")
                        # Tentar obter mais detalhes do time
                        if team.get('_id'):
                            team_url = f"https://api.battlefy.com/teams/{team.get('_id')}"
                            team_resp = requests.get(team_url, headers=headers, verify=False, timeout=5)
                            if team_resp.status_code == 200:
                                team_data = team_resp.json()
                                print(f"         Nome: {team_data.get('name')}")
            
            return matches
        else:
            print(f"   ❌ Falha na requisição")
            return []
            
    except Exception as e:
        print(f"   💥 Erro: {str(e)}")
        return []

def check_tournament_status():
    """Verificar se o torneio está ativo e disponível"""
    print("\n" + "=" * 60)
    print("🏆 VERIFICANDO STATUS DO TORNEIO")
    print("=" * 60)
    
    try:
        url = f"https://api.battlefy.com/tournaments/{tournament_id}"
        response = requests.get(url, verify=False, timeout=10)
        
        if response.status_code == 200:
            tournament = response.json()
            print("✅ Torneio encontrado:")
            print(f"   Nome: {tournament.get('name')}")
            print(f"   Jogo: {tournament.get('game')}")
            print(f"   Status: {tournament.get('status')}")
            print(f"   Data início: {tournament.get('startTime')}")
            print(f"   Data fim: {tournament.get('endTime')}")
            print(f"   Tipo: {tournament.get('tournamentType')}")
            
            # Verificar se há stages
            stages = tournament.get('stages', [])
            print(f"   Stages: {len(stages)}")
            for stage in stages:
                print(f"     Stage: {stage.get('name')} (ID: {stage.get('_id')})")
                
        else:
            print(f"❌ Não foi possível acessar o torneio: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Erro ao verificar torneio: {str(e)}")

# Executar debug completo
if __name__ == "__main__":
    debug_api_endpoints()
    check_tournament_status()
    detailed_matches = get_detailed_matches_alternative()
    
    print("\n" + "=" * 60)
    print("📋 RESUMO DA INVESTIGAÇÃO")
    print("=" * 60)
    
    if detailed_matches:
        print("✅ Dados detalhados obtidos com sucesso!")
        print(f"   Total de partidas: {len(detailed_matches)}")
        
        # Salvar os dados obtidos
        with open('DEBUGGED_MATCHES.json', 'w', encoding='utf-8') as f:
            json.dump(detailed_matches, f, indent=2, ensure_ascii=False)
        print("💾 Dados salvos em: DEBUGGED_MATCHES.json")
        
    else:
        print("❌ Não foi possível obter dados detalhados.")
        print("   Possíveis causas:")
        print("   - Torneio não está ativo ou foi removido")
        print("   - API mudou e requer autenticação")
        print("   - Dados ainda não foram preenchidos")
        print("   - IDs do torneio/stage podem estar incorretos")