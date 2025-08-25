import requests
import json
import csv
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Desativar avisos de SSL
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# IDs do torneio
tournament_id = "68a3db0a4f64b2003f7b4c3f"
stage_id = "68a64aec397e4d002b97de80"

def get_all_matches_with_details():
    """Obtém TODAS as partidas com detalhes completos"""
    print("=== OBTENDO TODAS AS PARTIDAS DA BRACKET ===")
    
    try:
        # Obter a lista de partidas
        response = requests.get(
            f"https://api.battlefy.com/stages/{stage_id}/matches",
            verify=False,
            timeout=15
        )
        
        if response.status_code == 200:
            matches = response.json()
            print(f"✓ Encontradas {len(matches)} partidas")
            
            # Obter detalhes de CADA partida individualmente
            detailed_matches = []
            
            for i, match in enumerate(matches):
                match_id = match.get('_id')
                if match_id:
                    try:
                        # Obter detalhes completos da partida
                        detail_response = requests.get(
                            f"https://api.battlefy.com/matches/{match_id}",
                            verify=False,
                            timeout=10
                        )
                        
                        if detail_response.status_code == 200:
                            detailed_match = detail_response.json()
                            detailed_matches.append(detailed_match)
                            print(f"✓ Partida {i+1}/{len(matches)}: Detalhes obtidos")
                        else:
                            detailed_matches.append(match)
                            print(f"⚠ Partida {i+1}/{len(matches)}: Sem detalhes extras")
                    
                    except Exception as e:
                        detailed_matches.append(match)
                        print(f"✗ Partida {i+1}/{len(matches)}: Erro ao obter detalhes - {str(e)}")
                
                else:
                    detailed_matches.append(match)
                    print(f"⚠ Partida {i+1}/{len(matches)}: Sem ID")
            
            return detailed_matches
        
        else:
            print(f"✗ Erro ao obter partidas: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"✗ Erro geral: {str(e)}")
        return []

def get_all_teams():
    """Obtém todos os times do torneio"""
    print("\n=== OBTENDO TODOS OS TIMES ===")
    
    try:
        response = requests.get(
            f"https://api.battlefy.com/tournaments/{tournament_id}/teams",
            verify=False,
            timeout=15
        )
        
        if response.status_code == 200:
            teams = response.json()
            print(f"✓ Encontrados {len(teams)} times")
            return teams
        else:
            print(f"✗ Erro ao obter times: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"✗ Erro: {str(e)}")
        return []

def get_tournament_info():
    """Obtém informações do torneio"""
    print("\n=== INFORMAÇÕES DO TORNEIO ===")
    
    try:
        response = requests.get(
            f"https://api.battlefy.com/tournaments/{tournament_id}",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        return {}
    except:
        return {}

def save_complete_bracket_data(matches, teams, tournament_info):
    """Salva TODOS os dados da bracket de forma completa"""
    print("\n=== SALVANDO DADOS COMPLETOS ===")
    
    # 1. Salvar JSON completo
    complete_data = {
        'tournament_info': tournament_info,
        'teams': teams,
        'matches': matches,
        'total_matches': len(matches),
        'total_teams': len(teams)
    }
    
    with open('COMPLETE_BRACKET_DATA.json', 'w', encoding='utf-8') as f:
        json.dump(complete_data, f, indent=2, ensure_ascii=False)
    print("✓ JSON completo salvo: COMPLETE_BRACKET_DATA.json")
    
    # 2. Salvar partidas em formato detalhado
    matches_detailed = []
    for match in matches:
        match_data = {
            'match_id': match.get('_id'),
            'round': match.get('round'),
            'match_number': match.get('matchNumber'),
            'state': match.get('state'),
            'scheduled_time': match.get('scheduledTime'),
            'teams': []
        }
        
        # Processar times da partida
        for team in match.get('teams', []):
            if team and isinstance(team, dict):
                team_data = {
                    'team_id': team.get('_id'),
                    'score': team.get('score'),
                    'result': team.get('result'),
                    'name': None,
                    'players': []
                }
                
                # Buscar nome do time na lista de times
                for t in teams:
                    if t.get('_id') == team.get('_id'):
                        team_data['name'] = t.get('name') or t.get('teamName')
                        team_data['players'] = t.get('players', [])
                        break
                
                match_data['teams'].append(team_data)
        
        matches_detailed.append(match_data)
    
    with open('DETAILED_MATCHES.json', 'w', encoding='utf-8') as f:
        json.dump(matches_detailed, f, indent=2, ensure_ascii=False)
    print("✓ Partidas detalhadas salvas: DETAILED_MATCHES.json")
    
    # 3. Salvar CSV com todas as partidas
    with open('ALL_MATCHES_CSV.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([
            'Match_ID', 'Round', 'Match_Number', 'Status', 
            'Scheduled_Time', 'Team1_ID', 'Team1_Name', 'Team1_Score',
            'Team2_ID', 'Team2_Name', 'Team2_Score', 'Winner'
        ])
        
        for match in matches_detailed:
            teams = match['teams']
            team1 = teams[0] if len(teams) > 0 else {}
            team2 = teams[1] if len(teams) > 1 else {}
            
            # Determinar vencedor
            winner = None
            if team1.get('score') is not None and team2.get('score') is not None:
                if team1.get('score') > team2.get('score'):
                    winner = team1.get('name', 'Team1')
                elif team2.get('score') > team1.get('score'):
                    winner = team2.get('name', 'Team2')
                else:
                    winner = 'Empate'
            
            writer.writerow([
                match['match_id'],
                match['round'],
                match['match_number'],
                match['state'],
                match['scheduled_time'],
                team1.get('team_id'),
                team1.get('name'),
                team1.get('score'),
                team2.get('team_id'),
                team2.get('name'),
                team2.get('score'),
                winner
            ])
    
    print("✓ CSV com todas as partidas salvo: ALL_MATCHES_CSV.csv")
    
    # 4. Salvar lista de times com jogadores
    with open('TEAMS_WITH_PLAYERS.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Team_ID', 'Team_Name', 'Player_Name', 'InGame_Name', 'Username'])
        
        for team in teams:
            team_name = team.get('name') or team.get('teamName') or f"Time_{team.get('_id')[:8]}"
            for player in team.get('players', []):
                writer.writerow([
                    team.get('_id'),
                    team_name,
                    player.get('name'),
                    player.get('inGameName'),
                    player.get('username')
                ])
    
    print("✓ Times com jogadores salvos: TEAMS_WITH_PLAYERS.csv")

def generate_summary_report(matches, teams):
    """Gera um relatório resumido"""
    print("\n=== RELATÓRIO RESUMIDO ===")
    
    total_matches = len(matches)
    total_teams = len(teams)
    
    # Contar partidas por status
    status_count = {}
    for match in matches:
        status = match.get('state', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1
    
    # Contar jogadores totais
    total_players = 0
    for team in teams:
        total_players += len(team.get('players', []))
    
    print(f"Total de Partidas: {total_matches}")
    print(f"Total de Times: {total_teams}")
    print(f"Total de Jogadores: {total_players}")
    print("\nStatus das Partidas:")
    for status, count in status_count.items():
        print(f"  {status}: {count} partidas")
    
    # Salvar relatório
    report = {
        'total_matches': total_matches,
        'total_teams': total_teams,
        'total_players': total_players,
        'match_status': status_count,
        'teams_sample': [{
            'name': team.get('name') or team.get('teamName'),
            'player_count': len(team.get('players', []))
        } for team in teams[:5]]  # Primeiros 5 times
    }
    
    with open('BRACKET_SUMMARY.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("✓ Relatório resumido salvo: BRACKET_SUMMARY.json")

def main():
    """Função principal"""
    print("🎯 EXTRAÇÃO COMPLETA DA BRACKET")
    print("=" * 50)
    
    # 1. Obter todas as partidas com detalhes
    all_matches = get_all_matches_with_details()
    
    if not all_matches:
        print("❌ Nenhuma partida encontrada. Verifique a conexão.")
        return
    
    # 2. Obter todos os times
    all_teams = get_all_teams()
    
    # 3. Obter informações do torneio
    tournament_info = get_tournament_info()
    
    # 4. Salvar TODOS os dados
    save_complete_bracket_data(all_matches, all_teams, tournament_info)
    
    # 5. Gerar relatório
    generate_summary_report(all_matches, all_teams)
    
    # 6. Mostrar preview
    print("\n" + "=" * 50)
    print("📊 PRÉVIA DOS DADOS")
    print("=" * 50)
    
    print(f"✅ Partidas processadas: {len(all_matches)}")
    print(f"✅ Times encontrados: {len(all_teams)}")
    
    # Mostrar primeiras 3 partidas
    print("\n🔍 Primeiras 3 partidas:")
    for i, match in enumerate(all_matches[:3]):
        print(f"\nPartida {i+1}:")
        print(f"  Round: {match.get('round')}")
        print(f"  Número: {match.get('matchNumber')}")
        print(f"  Status: {match.get('state')}")
        print(f"  Times: {len(match.get('teams', []))}")
        
        for j, team in enumerate(match.get('teams', [])):
            if team and isinstance(team, dict):
                print(f"    Time {j+1}: ID={team.get('_id')}, Score={team.get('score')}")
    
    print(f"\n🎉 Extração concluída! Verifique os arquivos salvos:")
    print("   - COMPLETE_BRACKET_DATA.json (Todos os dados)")
    print("   - DETAILED_MATCHES.json (Partidas detalhadas)")
    print("   - ALL_MATCHES_CSV.csv (Partidas em CSV)")
    print("   - TEAMS_WITH_PLAYERS.csv (Times e jogadores)")
    print("   - BRACKET_SUMMARY.json (Relatório resumido)")

if __name__ == "__main__":
    main()