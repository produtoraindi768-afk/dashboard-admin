# Deploy no Vercel - Guia Completo

## Status Atual
✅ **Problemas Resolvidos:**
- `vercel.json` corrigido (estava com problemas de codificação)
- Build local funcionando perfeitamente
- Configuração do Vite otimizada para produção
- Manual chunks configurado para melhor performance

## Configurações Necessárias

### 1. Variáveis de Ambiente no Vercel
Configure as seguintes variáveis no painel do Vercel:

```
VITE_FIREBASE_API_KEY=AIzaSyBqJ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y
VITE_FIREBASE_AUTH_DOMAIN=dashboard-f0217.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dashboard-f0217
VITE_FIREBASE_STORAGE_BUCKET=dashboard-f0217.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=791615571
VITE_FIREBASE_APP_ID=1:791615571:web:abc123def456ghi789
```

### 2. Configurações de Build
- **Framework Preset:** Vite
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install`

### 3. Arquivos de Configuração

#### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### package.json (scripts relevantes)
```json
{
  "scripts": {
    "build": "vite build",
    "build:vercel": "vite build"
  }
}
```

## Próximos Passos

1. **Commit e Push das Correções:**
   ```bash
   git add .
   git commit -m "fix: corrigir vercel.json e otimizar build para produção"
   git push origin main
   ```

2. **Redeploy no Vercel:**
   - O Vercel deve detectar automaticamente as mudanças
   - Ou force um novo deploy no painel do Vercel

3. **Verificar Deploy:**
   - Aguardar o build completar
   - Testar a aplicação no domínio do Vercel
   - Verificar se todas as funcionalidades estão funcionando

## Otimizações Implementadas

- **Code Splitting:** Separação em chunks (vendor, firebase, ui)
- **Base Path:** Configurado para `/` (padrão para Vercel)
- **Build Output:** Otimizado para produção
- **Rewrites:** SPA routing configurado corretamente

## Troubleshooting

Se ainda houver problemas:

1. **Verificar Logs do Build no Vercel**
2. **Confirmar Variáveis de Ambiente**
3. **Testar Build Local:** `pnpm build && pnpm preview`
4. **Verificar Domínios Configurados no Firebase**
