import requests
import re
import argparse
import sys
from pathlib import Path
import time

print("🔄 BATTLEFY AVATAR DOWNLOADER - INPUT FLEXÍVEL")
print("=" * 60)

class BattlefyDownloader:
    def __init__(self, tournament_id, stage_id):
        self.tournament_id = tournament_id.strip()
        self.stage_id = stage_id.strip()
        self.avatars_dir = Path("avatars")
        self.avatars_dir.mkdir(exist_ok=True)
        
    def baixar_avatares(self):
        print("1. 📥 Buscando dados do torneio...")
        dados = self._buscar_dados_torneio()
        
        if not dados:
            return False
            
        print("2. 🔍 Procurando URLs de avatar...")
        urls = self._encontrar_urls_avatar(dados)
        
        if not urls:
            print("❌ Nenhuma URL de avatar encontrada")
            return False
            
        print(f"3. 🚀 Baixando {len(urls)} avatares...")
        return self._baixar_avatares(urls)
    
    def _buscar_dados_torneio(self):
        url = f"https://dtmwra1jsgyb0.cloudfront.net/tournaments/{self.tournament_id}/teams"
        
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                print(f"✅ Dados recebidos ({len(response.text)} caracteres)")
                return response.text
            else:
                print(f"❌ Erro HTTP: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Erro de conexão: {e}")
            return None
    
    def _encontrar_urls_avatar(self, dados):
        padrao = r'https://firebasestorage\.googleapis\.com/v0/b/battlefy-2f59d\.appspot\.com/o/user-imgs%2F[a-f0-9]+%2F\d+\.(?:png|jpg|jpeg)\?alt=media&token=[a-f0-9-]+'
        
        urls = re.findall(padrao, dados)
        urls = list(set(urls))
        
        print(f"✅ Encontradas {len(urls)} URLs únicas")
        return urls
    
    def _baixar_avatares(self, urls):
        sucessos = 0
        
        for i, url in enumerate(urls, 1):
            print(f"   📥 [{i}/{len(urls)}] Baixando...")
            
            if self._baixar_avatar(url, i):
                sucessos += 1
                
            time.sleep(0.5)
            
        print(f"✅ {sucessos}/{len(urls)} avatares baixados com sucesso!")
        return sucessos > 0
    
    def _baixar_avatar(self, url, numero):
        try:
            user_id_match = re.search(r'user-imgs%2F([a-f0-9]+)%2F', url)
            if user_id_match:
                user_id = user_id_match.group(1)
                nome_arquivo = f"avatar_{user_id}.jpg"
            else:
                nome_arquivo = f"avatar_{numero:03d}.jpg"
                
            caminho = self.avatars_dir / nome_arquivo
            
            if caminho.exists():
                print(f"   ⏭️  {nome_arquivo} (já existe)")
                return True
                
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                with open(caminho, 'wb') as f:
                    f.write(response.content)
                print(f"   ✅ {nome_arquivo} ({len(response.content)} bytes)")
                return True
            else:
                print(f"   ❌ Erro HTTP: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            return False

def extrair_ids_da_url(url):
    """Extrai Tournament ID e Stage ID de uma URL do Battlefy"""
    padroes = [
        r'battlefy\.com/.*?/([a-f0-9]{24})/stage/([a-f0-9]{24})',
        r'tournament/([a-f0-9]{24}).*?stage/([a-f0-9]{24})',
        r'/([a-f0-9]{24})/.*?/([a-f0-9]{24})/bracket'
    ]
    
    for padrao in padroes:
        match = re.search(padrao, url, re.IGNORECASE)
        if match:
            return match.groups()
    
    return None, None

def validar_id(id_str):
    """Valida se o ID tem formato correto"""
    return bool(re.match(r'^[a-f0-9]{24}$', id_str))

def main():
    parser = argparse.ArgumentParser(description='Download avatares do Battlefy')
    parser.add_argument('--url', help='URL completa do torneio Battlefy')
    parser.add_argument('--tournament-id', help='Tournament ID')
    parser.add_argument('--stage-id', help='Stage ID')
    
    args = parser.parse_args()
    
    tournament_id = None
    stage_id = None
    
    # Método 1: URL completa
    if args.url:
        print(f"🌐 Analisando URL: {args.url}")
        tournament_id, stage_id = extrair_ids_da_url(args.url)
        
        if tournament_id and stage_id:
            print(f"✅ IDs extraídos: T={tournament_id}, S={stage_id}")
        else:
            print("❌ Não foi possível extrair IDs da URL")
            sys.exit(1)
    
    # Método 2: IDs individuais
    elif args.tournament_id and args.stage_id:
        tournament_id = args.tournament_id
        stage_id = args.stage_id
        print(f"✅ Usando IDs fornecidos: T={tournament_id}, S={stage_id}")
    
    # Método 3: Input interativo
    else:
        print("🎯 Modo interativo - Digite os IDs:")
        print()
        
        while True:
            tournament_id = input("Tournament ID: ").strip()
            if validar_id(tournament_id):
                break
            print("❌ ID inválido! Deve ter 24 caracteres hexadecimais")
        
        while True:
            stage_id = input("Stage ID: ").strip()
            if validar_id(stage_id):
                break
            print("❌ ID inválido! Deve ter 24 caracteres hexadecimais")
    
    # Validar os IDs
    if not validar_id(tournament_id) or not validar_id(stage_id):
        print("❌ IDs inválidos!")
        sys.exit(1)
    
    print()
    print("🚀 Iniciando download...")
    print()
    
    downloader = BattlefyDownloader(tournament_id, stage_id)
    
    if downloader.baixar_avatares():
        print("\n🎉 DOWNLOAD CONCLUÍDO!")
        print("📁 Avatares salvos na pasta: avatars/")
    else:
        print("\n❌ FALHA NO DOWNLOAD")
    
    input("\n⏎ Pressione Enter para sair...")

if __name__ == "__main__":
    main()