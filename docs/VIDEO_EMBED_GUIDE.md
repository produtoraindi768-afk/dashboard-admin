# Guia de Incorporação de Vídeos

## Funcionalidade Adicionada

Foi adicionada a funcionalidade de incorporar vídeos diretamente no editor de texto rico (RichTextEditor) usado na seção "Conteúdo HTML" do gerenciamento de notícias.

## Recursos Disponíveis

### 1. Suporte a Múltiplas Plataformas
- **YouTube**: Vídeos do YouTube são automaticamente detectados e incorporados
- **Vimeo**: Suporte completo para vídeos do Vimeo
- **Twitch**: Incorporação de streams e vídeos do Twitch
- **Embeds Genéricos**: Qualquer iframe de vídeo pode ser incorporado

### 2. Interface Intuitiva
- **Botão YouTube**: Incorporação rápida de vídeos do YouTube (ícone Play)
- **Botão Vídeo Universal**: Modal avançado para todos os tipos de vídeo (ícone Video)
- **Preview em Tempo Real**: Visualização do vídeo antes de incorporar
- **Configurações Avançadas**: Controle de largura, altura e tipo de embed

### 3. Responsividade
- Vídeos se adaptam automaticamente ao tamanho da tela
- Proporção 16:9 mantida por padrão
- Suporte a diferentes tamanhos (100%, 800px, 640px, 480px)

## Como Usar

### Método 1: Incorporação Rápida do YouTube
1. Clique no botão com ícone de "Play" na barra de ferramentas
2. Cole a URL do vídeo do YouTube
3. O vídeo será incorporado automaticamente

### Método 2: Incorporação Avançada (Recomendado)
1. Clique no botão com ícone de "Video" na barra de ferramentas
2. No modal que abrir:
   - **Aba Básico**: Cole a URL do vídeo e veja o preview
   - **Aba Avançado**: Configure tipo, largura e altura
3. Clique em "Incorporar Vídeo"

## URLs Suportadas

### YouTube
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
```

### Vimeo
```
https://vimeo.com/VIDEO_ID
```

### Twitch
```
https://www.twitch.tv/CHANNEL_NAME
```

### Embeds Genéricos
Qualquer URL de iframe que funcione em um navegador.

## Exemplo de Uso na Prática

1. **Acesse**: Gerenciar Notícias → Criar/Editar Notícia
2. **Vá para**: Seção "Conteúdo HTML (para estilização no portal)"
3. **Clique**: No botão de vídeo na barra de ferramentas
4. **Cole**: A URL do vídeo (ex: https://www.youtube.com/watch?v=9ATChqaD2M&t=1s)
5. **Configure**: Tamanho se necessário
6. **Incorpore**: O vídeo será adicionado ao conteúdo

## Resultado Final

O vídeo será incorporado no conteúdo HTML da notícia e ficará visível:
- No preview do editor
- Na visualização da notícia no portal
- Responsivo em dispositivos móveis
- Com controles nativos do player

## Benefícios

- **Engajamento**: Vídeos aumentam o tempo de permanência na página
- **Versatilidade**: Suporte a múltiplas plataformas
- **Facilidade**: Interface simples e intuitiva
- **Qualidade**: Preview antes de incorporar
- **Responsividade**: Funciona em todos os dispositivos

## Troubleshooting

### Vídeo não aparece
- Verifique se a URL está correta
- Certifique-se de que o vídeo é público
- Teste a URL em um navegador

### Vídeo muito pequeno/grande
- Use a aba "Avançado" para ajustar dimensões
- Recomendado: 100% de largura para responsividade

### Erro de incorporação
- Alguns vídeos podem ter restrições de embed
- Tente usar a URL direta do player (embed URL)

## Tecnologias Utilizadas

- **TipTap**: Editor de texto rico
- **@tiptap/extension-youtube**: Extensão oficial para YouTube
- **VideoEmbed**: Extensão customizada para outros vídeos
- **React**: Interface do usuário
- **CSS Responsivo**: Adaptação a diferentes telas
