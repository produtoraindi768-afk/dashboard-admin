# Configuração do Firebase - Regras de Segurança

## Problema de Permissões

Se você está recebendo o erro "Missing or insufficient permissions", isso significa que as regras de segurança do Firestore estão bloqueando o acesso aos dados.

## Solução: Configurar Regras do Firestore

### 1. Acesse o Console do Firebase
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `dashboard-f0217`
3. No menu lateral, clique em "Firestore Database"
4. Clique na aba "Rules" (Regras)

### 2. Configure as Regras de Segurança

Para desenvolvimento e teste, substitua as regras atuais por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita para todos os documentos (APENAS PARA DESENVOLVIMENTO)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Para Produção (Mais Seguro)

Quando estiver pronto para produção, use regras mais restritivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite acesso apenas à coleção de streamers
    match /streamers/{streamerId} {
      allow read, write: if true;
    }
    
    // Bloqueia acesso a outras coleções
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Publique as Regras

1. Após editar as regras, clique em "Publish" (Publicar)
2. Aguarde alguns segundos para as regras serem aplicadas
3. Teste novamente a aplicação

## Estrutura de Dados Esperada

O sistema criará automaticamente a coleção `streamers` com documentos no formato:

```json
{
  "name": "Nome do Streamer",
  "platform": "twitch",
  "username": "username",
  "status": "online",
  "category": "Jogos",
  "viewers": 1500,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Verificação

Após configurar as regras:

1. Acesse a página "Configurações" no dashboard
2. Clique em "Testar Conexão"
3. Se aparecer "Conexão bem-sucedida!", o Firebase está configurado corretamente
4. Você pode então migrar seus dados do localStorage para o Firestore

## Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique se as regras do Firestore foram publicadas
- Confirme que as credenciais no arquivo `firebase.js` estão corretas
- Aguarde alguns minutos após publicar as regras

### Erro: "Firebase: Error (auth/api-key-not-valid)"
- Verifique se a `apiKey` no arquivo `firebase.js` está correta
- Confirme se o projeto ID está correto

### Erro: "Firebase: No Firebase App '[DEFAULT]' has been created"
- Verifique se o arquivo `firebase.js` está sendo importado corretamente
- Confirme se todas as configurações estão preenchidas

## Próximos Passos

1. Configure as regras do Firestore conforme descrito acima
2. Teste a conexão na página de configurações
3. Migre seus dados existentes do localStorage
4. O sistema passará a usar o Firebase como banco principal

---

**Importante**: As regras de desenvolvimento (`allow read, write: if true`) permitem acesso total aos dados. Use apenas durante o desenvolvimento e configure regras mais restritivas para produção.