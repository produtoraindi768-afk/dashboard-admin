# Como Testar a Funcionalidade de Embed de Vídeos

## Passo a Passo para Testar

### 1. Acessar o Sistema
1. Abra o navegador em: http://localhost:5173
2. Faça login no sistema (se necessário)
3. Navegue até **"Gerenciar Notícias"**

### 2. Criar/Editar uma Notícia
1. Clique em **"Nova Notícia"** ou edite uma existente
2. Preencha os campos básicos (Título, Conteúdo, etc.)
3. Role até a seção **"Conteúdo HTML (para estilização no portal)"**

### 3. Testar Incorporação de Vídeos

#### Opção A: Vídeo do YouTube (Método Rápido)
1. Na barra de ferramentas do editor, clique no botão com ícone de **Play** ▶️
2. Cole uma URL do YouTube, exemplo:
   ```
   https://www.youtube.com/watch?v=9ATChqaD2M&t=1s
   ```
3. O vídeo será incorporado automaticamente

#### Opção B: Vídeo Universal (Método Avançado)
1. Na barra de ferramentas do editor, clique no botão com ícone de **Video** 📹
2. No modal que abrir:
   - **Aba Básico**: Cole a URL do vídeo
   - **Aba Avançado**: Configure dimensões se necessário
3. Clique em **"Incorporar Vídeo"**

### 4. URLs de Teste

#### YouTube
```
https://www.youtube.com/watch?v=9ATChqaD2M&t=1s
https://youtu.be/9ATChqaD2M
```

#### Vimeo
```
https://vimeo.com/123456789
```

#### Twitch
```
https://www.twitch.tv/ninja
```

### 5. Verificar o Resultado

#### No Editor
- O vídeo deve aparecer incorporado no editor
- Deve ser possível reproduzir o vídeo
- O vídeo deve ser responsivo

#### No Preview
1. Role até a seção **"Preview do Conteúdo HTML"**
2. O vídeo deve aparecer formatado corretamente
3. Teste a responsividade redimensionando a janela

### 6. Salvar e Testar
1. Clique em **"Salvar Notícia"**
2. Visualize a notícia salva
3. Confirme que o vídeo está funcionando

## Funcionalidades a Testar

### ✅ Checklist de Testes

- [ ] **Incorporação do YouTube**: URL do YouTube é convertida em player
- [ ] **Incorporação do Vimeo**: URL do Vimeo é convertida em player
- [ ] **Incorporação do Twitch**: URL do Twitch é convertida em player
- [ ] **Preview em Tempo Real**: Vídeo aparece no modal antes de incorporar
- [ ] **Responsividade**: Vídeo se adapta ao tamanho da tela
- [ ] **Controles do Player**: Play, pause, volume funcionam
- [ ] **Múltiplos Vídeos**: Possível adicionar vários vídeos na mesma notícia
- [ ] **Edição**: Possível editar notícia com vídeos incorporados
- [ ] **Salvamento**: Vídeos são salvos corretamente no banco de dados
- [ ] **Visualização**: Vídeos aparecem na visualização final da notícia

### 🔧 Configurações Avançadas a Testar

- [ ] **Largura 100%**: Vídeo ocupa toda a largura disponível
- [ ] **Largura Fixa**: Vídeos com larguras específicas (800px, 640px, 480px)
- [ ] **Altura Personalizada**: Alterar altura do vídeo (200px - 800px)
- [ ] **Detecção Automática**: Sistema detecta automaticamente o tipo de vídeo
- [ ] **Tipo Manual**: Forçar tipo específico de vídeo

### 🚨 Cenários de Erro a Testar

- [ ] **URL Inválida**: Sistema mostra erro para URLs malformadas
- [ ] **Vídeo Privado**: Sistema lida com vídeos não públicos
- [ ] **URL Inexistente**: Sistema lida com URLs que não existem
- [ ] **Rede Offline**: Sistema funciona quando não há conexão

## Exemplos de URLs para Teste

### URLs Válidas
```
# YouTube
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ

# Vimeo
https://vimeo.com/148751763

# Twitch
https://www.twitch.tv/shroud
```

### URLs Inválidas (para testar tratamento de erro)
```
# URLs malformadas
https://youtube.com/invalid
https://not-a-video-site.com/video
texto-sem-url
```

## Resultado Esperado

Após a implementação, você deve conseguir:

1. **Incorporar vídeos facilmente** no conteúdo HTML das notícias
2. **Ver preview em tempo real** antes de incorporar
3. **Configurar dimensões** dos vídeos
4. **Suportar múltiplas plataformas** (YouTube, Vimeo, Twitch)
5. **Ter vídeos responsivos** que funcionam em mobile
6. **Salvar e carregar** notícias com vídeos incorporados

## Troubleshooting

### Vídeo não aparece
- Verifique se a URL está correta
- Teste a URL diretamente no navegador
- Verifique se o vídeo é público

### Erro no modal
- Recarregue a página
- Verifique o console do navegador (F12)
- Teste com uma URL diferente

### Vídeo muito pequeno/grande
- Use a aba "Avançado" no modal
- Ajuste largura para "100%" para responsividade
- Ajuste altura conforme necessário
