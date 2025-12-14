# 🔧 Guia de Correção - Deploy na Vercel (Erro 401)

## Problema Identificado
O erro 401 ao tentar fazer login pode ser causado por vários fatores. Este guia ajuda a identificar e corrigir o problema.

## ✅ Checklist de Verificação

### 1. Variáveis de Ambiente na Vercel

Acesse: **Settings → Environment Variables** no painel da Vercel

Verifique se TODAS estas variáveis estão configuradas:

#### ✅ NEXTAUTH_URL
- **Valor correto:** `https://sacrumpatrimonio.vercel.app`
- **⚠️ IMPORTANTE:** Deve ser a URL completa com `https://`
- **⚠️ NÃO use:** `http://` ou URL sem protocolo
- **⚠️ Verifique:** Se você tem domínio customizado, use o domínio customizado

#### ✅ NEXTAUTH_SECRET
- **Valor:** Uma string aleatória longa e segura
- **Como gerar:**
  ```bash
  openssl rand -base64 32
  ```
- **⚠️ IMPORTANTE:** Deve ser diferente do ambiente de desenvolvimento
- **⚠️ Verifique:** Se está definida para todos os ambientes (Production, Preview, Development)

#### ✅ DATABASE_URL ou POSTGRES_URL
- **Valor:** A connection string do banco de dados Vercel Postgres
- **Formato:** `postgresql://usuario:senha@host:porta/banco?schema=public`
- **⚠️ IMPORTANTE:** Se você criou o banco na Vercel, a variável `POSTGRES_URL` é criada automaticamente
- **⚠️ Verifique:** Se está definida para todos os ambientes

#### ✅ PRISMA_DATABASE_URL (Opcional)
- Se você estiver usando `PRISMA_DATABASE_URL`, certifique-se de que está configurada

### 2. Verificar se o Banco foi Seedado

O banco de dados precisa ter os usuários criados. Verifique:

#### Opção A: Via API (Mais Rápido)
1. Acesse: `https://sacrumpatrimonio.vercel.app/api/seed`
2. Faça uma requisição POST (pode usar o navegador com extensão ou Postman)
3. Se retornar `adminExists: true`, o banco já foi seedado
4. Se retornar sucesso, os usuários foram criados

#### Opção B: Via Vercel CLI
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Conectar ao projeto
vercel link

# Baixar variáveis de ambiente
vercel env pull .env.local

# Executar seed
npm run prisma:seed
```

#### Opção C: Via Prisma Studio (Recomendado)
```bash
# Baixar variáveis de ambiente
vercel env pull .env.local

# Abrir Prisma Studio
npm run prisma:studio
```

No Prisma Studio, verifique se existe o usuário:
- **Email:** `admin@paroquia.com`
- **Senha (hash):** Deve existir um hash bcrypt

### 3. Verificar Conexão com o Banco

#### Verificar Logs da Vercel
1. Acesse: **Deployments** → Selecione o último deployment → **Logs**
2. Procure por erros relacionados a:
   - `DATABASE_URL não está definida`
   - `Error connecting to database`
   - `Prisma Client initialization`

#### Testar Conexão Manualmente
Se você tem acesso ao banco, pode testar a conexão:
```bash
# Com as variáveis de ambiente configuradas
vercel env pull .env.local
npx prisma db pull
```

### 4. Verificar Build Script

O script `vercel-build` no `package.json` deve executar:
```json
"vercel-build": "prisma migrate deploy && prisma generate && prisma db seed && next build"
```

**⚠️ IMPORTANTE:** 
- Se o seed falhar durante o build, o build pode continuar
- Verifique os logs do build para ver se o seed foi executado com sucesso
- Se o seed falhar, execute manualmente após o deploy

### 5. Verificar Migrations

Certifique-se de que as migrations foram executadas:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar Variáveis de Ambiente
1. Acesse o painel da Vercel
2. Vá em **Settings → Environment Variables**
3. Verifique se todas as variáveis estão configuradas
4. **⚠️ CRÍTICO:** Verifique se `NEXTAUTH_URL` está como `https://sacrumpatrimonio.vercel.app` (não `http://`)

### Passo 2: Verificar se o Banco foi Seedado
1. Acesse: `https://sacrumpatrimonio.vercel.app/api/seed`
2. Faça uma requisição POST
3. Se retornar que o admin já existe, o problema não é o seed
4. Se retornar erro ou criar novos usuários, o seed estava faltando

### Passo 3: Verificar Logs
1. Acesse **Deployments** → Último deployment → **Logs**
2. Procure por:
   - `[NextAuth]` - Logs de autenticação
   - `[Prisma]` - Logs de conexão com banco
   - Erros relacionados a `DATABASE_URL` ou `NEXTAUTH_SECRET`

### Passo 4: Testar Login
1. Acesse: `https://sacrumpatrimonio.vercel.app/login`
2. Tente fazer login com:
   - **Email:** `admin@paroquia.com`
   - **Senha:** `admin123`
3. Abra o DevTools (F12) → **Network**
4. Veja a requisição para `/api/auth/signin` ou `/api/auth/[...nextauth]`
5. Verifique o status code e a resposta

## 🛠️ Soluções Comuns

### Problema: NEXTAUTH_URL incorreto
**Solução:**
1. Vá em **Settings → Environment Variables**
2. Edite `NEXTAUTH_URL`
3. Certifique-se de que é: `https://sacrumpatrimonio.vercel.app`
4. **⚠️ IMPORTANTE:** Após alterar, faça um novo deploy ou aguarde alguns minutos

### Problema: Banco não foi seedado
**Solução:**
1. Execute o seed via API: `POST https://sacrumpatrimonio.vercel.app/api/seed`
2. Ou via CLI:
   ```bash
   vercel env pull .env.local
   npm run prisma:seed
   ```

### Problema: NEXTAUTH_SECRET faltando ou incorreto
**Solução:**
1. Gere um novo secret:
   ```bash
   openssl rand -base64 32
   ```
2. Vá em **Settings → Environment Variables**
3. Adicione ou atualize `NEXTAUTH_SECRET`
4. Faça um novo deploy

### Problema: DATABASE_URL não configurada
**Solução:**
1. Vá em **Storage** → Selecione seu banco
2. Copie a connection string
3. Vá em **Settings → Environment Variables**
4. Adicione `DATABASE_URL` com a connection string
5. Ou use `POSTGRES_URL` (se criado via Vercel Postgres)

## 📝 Credenciais de Teste

Após o seed, use estas credenciais:

**Administrador:**
- Email: `admin@paroquia.com`
- Senha: `admin123`

**Usuário Comum:**
- Email: `joao@paroquia.com`
- Senha: `usuario123`

## 🔄 Após Fazer Correções

1. **Aguarde alguns minutos** para as variáveis de ambiente serem propagadas
2. **Faça um novo deploy** (ou aguarde o próximo push)
3. **Teste novamente** o login
4. **Verifique os logs** se ainda houver problemas

## 📞 Próximos Passos

Se após seguir este guia o problema persistir:

1. Verifique os logs completos do deployment
2. Verifique os logs em tempo real (Vercel → Logs)
3. Teste a conexão com o banco manualmente
4. Verifique se há erros no console do navegador (F12)

## ✅ Checklist Final

- [ ] `NEXTAUTH_URL` configurado como `https://sacrumpatrimonio.vercel.app`
- [ ] `NEXTAUTH_SECRET` configurado e é uma string longa e aleatória
- [ ] `DATABASE_URL` ou `POSTGRES_URL` configurada
- [ ] Migrations executadas (`prisma migrate deploy`)
- [ ] Seed executado (usuários criados no banco)
- [ ] Novo deploy feito após alterações
- [ ] Logs verificados para erros

