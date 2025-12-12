# 🚀 Guia de Deploy na Vercel - Passo a Passo

## ✅ Você já tem:
- ✅ Banco de dados criado no Vercel Postgres
- ✅ URLs de conexão fornecidas pela Vercel

## 📋 Próximos Passos:

### 1️⃣ Fazer o Primeiro Deploy do Projeto

**⚠️ IMPORTANTE:** O projeto precisa estar deployado na Vercel ANTES de aparecer na lista para conectar ao banco!

1. **No painel da Vercel:**
   - Clique em **"Add New Project"** ou **"New Project"**
   - Conecte seu repositório GitHub (`patrimonio_igreja`)
   - A Vercel detectará automaticamente que é um projeto Next.js

2. **Configure o projeto:**
   - Framework Preset: **Next.js** (deve detectar automaticamente)
   - Root Directory: **./** (raiz)
   - Build Command: **npm run build** (padrão)
   - Output Directory: **.next** (padrão)
   - Install Command: **npm install** (padrão)

3. **Adicione as variáveis de ambiente ANTES do primeiro deploy:**
   - Clique em **"Environment Variables"** antes de fazer o deploy
   - Adicione as seguintes variáveis:
     ```
     DATABASE_URL=postgres://dd13ffd2217ab5488c6c6a153e6c3823f67bca65ee8204ac86b496650d8801a4:sk_LJCEoQkAVzaydVxmXxofC@db.prisma.io:5432/postgres?sslmode=require
     NEXTAUTH_URL=https://seu-projeto.vercel.app
     NEXTAUTH_SECRET=uma-string-secreta-muito-longa
     ```
   - ⚠️ **IMPORTANTE:** 
     - Marque todas as variáveis para **Production**, **Preview** e **Development**
     - Para `NEXTAUTH_URL`, você pode usar um placeholder por enquanto (ex: `https://placeholder.vercel.app`) e atualizar depois com a URL real
     - Para gerar `NEXTAUTH_SECRET`: `openssl rand -base64 32`

4. **Faça o deploy:**
   - Clique em **"Deploy"**
   - Aguarde o build completar
   - ⚠️ **Nota:** O primeiro deploy pode falhar se tentar conectar ao banco antes das migrações. Isso é normal! Após executar as migrações (passo 4), faça um novo deploy.
   - ⚠️ **Importante:** Certifique-se de que está usando Next.js 16.0.10 ou superior (versões anteriores têm vulnerabilidade CVE-2025-66478)

### 2️⃣ Conectar o Banco ao Projeto (Após o Deploy)

Agora que o projeto está deployado, você pode conectá-lo ao banco:

1. No painel da Vercel, vá até a página do banco de dados (`database-sacrum-patrimonio`)
2. Clique no botão **"Connect Project"** (Conectar Projeto)
3. Agora o projeto `patrimonio_igreja` deve aparecer na lista
4. Selecione o projeto
5. Isso vai automaticamente adicionar/atualizar as variáveis de ambiente no projeto

### 3️⃣ Adicionar Variáveis de Ambiente Manualmente (Se necessário)

Se preferir adicionar manualmente ou se o "Connect Project" não funcionar:

1. Vá no painel do seu projeto na Vercel
2. Acesse **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis (use os valores que a Vercel forneceu):

```
DATABASE_URL=postgres://dd13ffd2217ab5488c6c6a153e6c3823f67bca65ee8204ac86b496650d8801a4:sk_LJCEoQkAVzaydVxmXxofC@db.prisma.io:5432/postgres?sslmode=require
```

**OU** (se preferir usar a URL do Prisma Accelerate):

```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19MSkNFb1FrQVZ6YXlkVnhtWHhvZkMiLCJhcGlfa2V5IjoiMDFLQzhBNjlTUFFURTBZN0tTSjNZWFhLVksiLCJ0ZW5hbnRfaWQiOiJkZDEzZmZkMjIxN2FiNTQ4OGM2YzZhMTUzZTZjMzgyM2Y2N2JjYTY1ZWU4MjA0YWM4NmI0OTY2NTBkODgwMWE0IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjUxMDMzYzMtZWQ4Mi00MjM4LTk3MjAtZGE2NWVkZGFiYWM5In0.h92C6dgtCvMGg9rYwxHuZMxBiokV9M7V542z7pgfq-Q
```

4. Adicione também:

```
NEXTAUTH_URL=https://seu-projeto.vercel.app
NEXTAUTH_SECRET=uma-string-secreta-muito-longa
```

**Para gerar o NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

⚠️ **IMPORTANTE:** 
- Marque todas as variáveis para **Production**, **Preview** e **Development**
- Use a URL normal (`postgres://...`) para `DATABASE_URL`, não a `PRISMA_DATABASE_URL` (essa é apenas para Prisma Accelerate)

### 4️⃣ Executar Migrações do Banco de Dados

Após configurar as variáveis, você precisa executar as migrações para criar as tabelas no banco.

#### Opção A: Via Vercel CLI (Recomendado)

1. Instale o Vercel CLI (se ainda não tiver):
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Conecte ao projeto:
```bash
vercel link
```

4. Baixe as variáveis de ambiente:
```bash
vercel env pull .env.local
```

5. Execute as migrações:
```bash
npx prisma migrate deploy
```

6. (Opcional) Execute o seed para popular dados iniciais:
```bash
npm run prisma:seed
```

#### Opção B: Via Terminal do Prisma Studio

1. Configure a variável `DATABASE_URL` localmente no arquivo `.env.local`:
```env
DATABASE_URL=postgres://dd13ffd2217ab5488c6c6a153e6c3823f67bca65ee8204ac86b496650d8801a4:sk_LJCEoQkAVzaydVxmXxofC@db.prisma.io:5432/postgres?sslmode=require
```

2. Execute as migrações:
```bash
npx prisma migrate deploy
```

3. (Opcional) Execute o seed:
```bash
npm run prisma:seed
```

### 5️⃣ Atualizar NEXTAUTH_URL e Fazer Novo Deploy

Após o primeiro deploy, você receberá a URL do projeto (ex: `https://patrimonio-igreja.vercel.app`):

1. Vá em **Settings** → **Environment Variables** do projeto
2. Atualize `NEXTAUTH_URL` com a URL real do seu projeto
3. Faça um novo deploy (ou aguarde o redeploy automático se já conectou ao GitHub)

### 6️⃣ Verificar o Deploy

1. Após o deploy, acesse a URL fornecida pela Vercel (ex: `https://seu-projeto.vercel.app`)
2. Teste o login
3. Verifique se os dados estão sendo salvos no banco


## 🔧 Troubleshooting

### Erro: "Missing DATABASE_URL"
- Verifique se a variável está configurada no painel da Vercel
- Certifique-se de que está marcada para o ambiente correto (Production/Preview/Development)

### Erro: "Migration failed"
- Execute `npx prisma migrate deploy` localmente conectado ao banco da Vercel
- Verifique se há migrações pendentes

### Erro: "Connection refused"
- Verifique se está usando a URL correta (com `sslmode=require`)
- A URL deve começar com `postgres://` (não `postgresql://`)

### Erro de autenticação NextAuth
- Verifique se `NEXTAUTH_SECRET` está configurado
- Verifique se `NEXTAUTH_URL` está correto (deve ser a URL do projeto na Vercel)

## 📝 Checklist Final

- [ ] Banco de dados criado na Vercel
- [ ] Variáveis de ambiente configuradas no projeto
- [ ] Migrações executadas (`prisma migrate deploy`)
- [ ] Seed executado (opcional)
- [ ] Deploy realizado com sucesso
- [ ] Aplicação funcionando corretamente
- [ ] Login testado
- [ ] Dados sendo salvos no banco

## 🎉 Pronto!

Seu sistema está no ar! A cada push no GitHub, a Vercel fará um novo deploy automaticamente.
