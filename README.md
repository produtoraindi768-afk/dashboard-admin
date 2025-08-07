# StreamerHub Dashboard

Um painel web completo para gerenciamento de streamers com funcionalidades modernas e design responsivo.

## 🚀 Demonstração

**URL de Produção:** https://jreqiila.manus.space

## 📋 Funcionalidades

### ✅ Implementadas

#### 1. Página de Cadastro de Streamers
- **Formulário completo** com validação de campos
- **Campos obrigatórios:** Nome, Plataforma, URL da Stream, Categoria
- **Campo opcional:** URL do Avatar
- **Plataformas suportadas:** Twitch, YouTube, Kick, Facebook Gaming, TikTok Live, Instagram Live, Outro
- **Categorias disponíveis:** FPS, Just Chatting, MOBA, RPG, Strategy, Sports, Music, Art, IRL, Variety, Outro
- **Lista de streamers cadastrados** com opções para editar e remover
- **Validação de URLs** específica por plataforma
- **Mensagens de sucesso e erro** em tempo real

#### 2. Página de Gerenciamento de Status
- **Controle online/offline** com switches interativos
- **Filtros avançados:** Status, Plataforma, Categoria, Busca por texto
- **Estatísticas em tempo real:** Total, Online, Offline, Taxa de atividade
- **Ordenação** por nome, plataforma, categoria, status, última atualização
- **Interface responsiva** com cards informativos

#### 3. Dashboard Principal
- **Visão geral** com estatísticas principais
- **Cards de streamers online** em tempo real
- **Cadastros recentes** com timestamps
- **Distribuição por plataforma** com gráficos de progresso
- **Navegação rápida** para outras seções

#### 4. API Preview
- **Documentação completa** da API REST
- **Visualização de dados JSON** em tempo real
- **Endpoints simulados:** GET, POST, PUT, DELETE
- **Filtros de API:** status, plataforma, categoria
- **Funcionalidades:** Copiar JSON, Download, Refresh
- **Exemplos de uso** com código

#### 5. Layout e Design
- **Sidebar responsiva** com navegação intuitiva
- **Design moderno** usando TailwindCSS e shadcn/ui
- **Tema consistente** com cores e tipografia profissionais
- **Ícones Lucide** para melhor UX
- **Animações suaves** e micro-interações
- **Mobile-first** com breakpoints responsivos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19.1.0** - Biblioteca principal
- **React Router DOM 7.6.1** - Roteamento
- **TailwindCSS 4.1.7** - Estilização
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **Vite 6.3.5** - Build tool

### Gerenciamento de Estado
- **React Hooks** - useState, useEffect, useCallback, useMemo
- **Custom Hooks** - useStreamers, useStreamerStatistics, useStreamerFilters
- **LocalStorage** - Persistência de dados

### Validação e Formatação
- **Validação customizada** - URLs, campos obrigatórios
- **Formatação de dados** - Datas, URLs, estatísticas
- **Sanitização** - Limpeza de inputs

## 📁 Estrutura do Projeto

```
streamer-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   └── Sidebar.jsx      # Navegação lateral
│   ├── pages/
│   │   ├── Dashboard.jsx    # Página principal
│   │   ├── StreamerRegistration.jsx  # Cadastro
│   │   ├── StatusManagement.jsx      # Gerenciamento
│   │   └── ApiPreview.jsx   # Preview da API
│   ├── services/
│   │   └── streamerService.js  # Lógica de negócio
│   ├── hooks/
│   │   └── useStreamers.js  # Hooks customizados
│   ├── utils/
│   │   ├── validation.js    # Validações
│   │   └── formatters.js    # Formatação
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Entry point
├── public/                 # Arquivos estáticos
├── dist/                   # Build de produção
└── package.json           # Dependências
```

## 🔧 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 20.18.0+
- npm ou pnpm

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd streamer-dashboard

# Instale as dependências
npm install
# ou
pnpm install
```

### Desenvolvimento
```bash
# Inicie o servidor de desenvolvimento
npm run dev
# ou
pnpm run dev

# Acesse http://localhost:5173
```

### Build para Produção
```bash
# Gere o build otimizado
npm run build
# ou
pnpm run build

# Os arquivos estarão em dist/
```

## 📊 API REST Simulada

### Endpoints Disponíveis

#### Streamers
- `GET /api/streamers` - Lista todos os streamers
- `GET /api/streamers?status=online` - Filtra por status
- `GET /api/streamers?platform=Twitch` - Filtra por plataforma
- `GET /api/streamers/:id` - Obtém streamer específico
- `POST /api/streamers` - Cria novo streamer
- `PUT /api/streamers/:id` - Atualiza streamer
- `DELETE /api/streamers/:id` - Remove streamer

#### Estatísticas
- `GET /api/statistics` - Obtém estatísticas gerais

### Exemplo de Resposta
```json
{
  "data": [
    {
      "id": "1754513149579",
      "name": "Alanzoka",
      "platform": "Twitch",
      "streamUrl": "https://twitch.tv/alanzoka",
      "avatarUrl": "",
      "category": "Variety",
      "isOnline": false,
      "createdAt": "2025-08-06T20:45:49.579Z",
      "lastStatusUpdate": "2025-08-06T20:45:49.579Z"
    }
  ],
  "total": 1,
  "timestamp": "2025-08-06T20:46:37.682Z"
}
```

## 🔮 Funcionalidades Futuras (Preparadas para Escalabilidade)

### Planejadas para Implementação
1. **Ranking de Visualizações**
   - Integração com APIs das plataformas
   - Histórico de viewers
   - Gráficos de performance

2. **Integração com APIs Reais**
   - Twitch API para dados em tempo real
   - YouTube API para estatísticas
   - Kick API para informações de stream

3. **Sistema de Login/Admin**
   - Autenticação de usuários
   - Níveis de permissão
   - Gestão de múltiplos administradores

4. **Histórico de Status**
   - Timeline de quando streamers ficaram online/offline
   - Relatórios de atividade
   - Análise de padrões

5. **Notificações**
   - Alertas quando streamers ficam online
   - Webhooks para integração externa
   - Sistema de notificações push

6. **Backup e Sincronização**
   - Backup automático dos dados
   - Sincronização entre dispositivos
   - Importação/exportação de dados

## 🎨 Design System

### Cores Principais
- **Primary:** oklch(0.205 0 0) - Preto elegante
- **Secondary:** oklch(0.97 0 0) - Cinza claro
- **Success:** Verde para status online
- **Warning:** Amarelo para alertas
- **Destructive:** Vermelho para ações de remoção

### Tipografia
- **Font Family:** Sistema padrão (Inter, sans-serif)
- **Tamanhos:** 12px, 14px, 16px, 18px, 24px, 32px, 48px
- **Pesos:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Componentes
- **Cards:** Bordas arredondadas, sombras sutis
- **Buttons:** Estados hover e focus bem definidos
- **Forms:** Validação visual em tempo real
- **Navigation:** Sidebar colapsível e responsiva

## 📱 Responsividade

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Adaptações
- **Sidebar:** Overlay em mobile, fixa em desktop
- **Cards:** Stack vertical em mobile, grid em desktop
- **Formulários:** Campos em coluna única em mobile
- **Tabelas:** Scroll horizontal quando necessário

## 🔒 Segurança e Validação

### Validações Implementadas
- **URLs:** Verificação de formato e compatibilidade com plataforma
- **Campos obrigatórios:** Validação em tempo real
- **Sanitização:** Limpeza de inputs para prevenir XSS
- **Tamanho de dados:** Limites para nomes e URLs

### Boas Práticas
- **Escape de HTML:** Prevenção de injeção de código
- **Validação client-side:** Feedback imediato ao usuário
- **Tratamento de erros:** Mensagens claras e acionáveis

## 📈 Performance

### Otimizações Implementadas
- **Code Splitting:** Carregamento sob demanda
- **Lazy Loading:** Componentes carregados quando necessário
- **Memoização:** React.memo, useMemo, useCallback
- **Bundle Size:** Otimizado com Vite e tree-shaking

### Métricas
- **Bundle Size:** ~406KB (gzipped: ~127KB)
- **CSS Size:** ~88KB (gzipped: ~14KB)
- **Build Time:** ~4.5s

## 🧪 Testes

### Testes Realizados
- **Funcionalidade de cadastro:** ✅ Aprovado
- **Validação de formulários:** ✅ Aprovado
- **Navegação entre páginas:** ✅ Aprovado
- **API simulada:** ✅ Aprovado
- **Responsividade:** ✅ Aprovado
- **Deploy em produção:** ✅ Aprovado

## 📞 Suporte

Para dúvidas ou sugestões sobre o projeto:
- Acesse a seção "Ajuda" no dashboard
- Consulte a documentação da API
- Verifique os exemplos de uso fornecidos

## 📄 Licença

Este projeto foi desenvolvido como demonstração de um dashboard moderno para gerenciamento de streamers.

---

**Desenvolvido com ❤️ usando React, TailwindCSS e shadcn/ui**

