# 🏛️ Sistema de Patrimônio de Bens da Paróquia

Sistema completo de gestão de bens e patrimônio para paróquias, desenvolvido com Next.js 14+, TypeScript, Prisma, PostgreSQL e NextAuth.js.

**Desenvolvido por:** Douglas Santos – DAST Technologies  
**Data:** 12/11/2025

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Desenvolvimento](#desenvolvimento)
- [Produção](#produção)
- [Deploy com Docker](#deploy-com-docker)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Credenciais de Teste](#credenciais-de-teste)

---

## 🎯 Sobre o Projeto

Sistema web para gestão eficiente do patrimônio de bens de uma paróquia, permitindo:
- Cadastro e controle de bens
- Registro de retiradas e devoluções
- Gerenciamento de empréstimos por pastoral
- Relatórios detalhados e exportáveis
- Controle de acesso por perfil (Administrador/Comum)

---

## ✨ Funcionalidades

### 👥 Autenticação e Autorização
- ✅ Login com email e senha
- ✅ Dois níveis de acesso: ADM e COMUM
- ✅ Proteção de rotas com middleware
- ✅ Logout com confirmação

### 📦 Gestão de Bens
- ✅ Cadastrar bens (nome, código, estado, valor, foto)
- ✅ Listar bens com filtros (estado, disponibilidade)
- ✅ Visualizar detalhes e histórico
- ✅ Busca por nome ou código
- ✅ Status: Novo, Usado, Quebrado

### 📤📥 Empréstimos
- ✅ Registrar retirada de bem
- ✅ Vincular empréstimo a pastoral
- ✅ Informar motivo e estado do bem
- ✅ Registrar devolução
- ✅ Atualizar estado após devolução

### 📊 Relatórios
- ✅ Relatório de bens (com filtros)
- ✅ Relatório de empréstimos (por pastoral/período)
- ✅ Relatório de pastorais
- ✅ Exportação para Excel

### ⚙️ Administração (ADM)
- ✅ Cadastrar usuários
- ✅ Gerenciar pastorais
- ✅ Visualizar todas as operações

---

## 🚀 Tecnologias

### Frontend
- **Next.js 14+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Componentes)
- **Lucide React** (Ícones)

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL**
- **NextAuth.js** (Autenticação)
- **bcrypt** (Hash de senhas)
- **Zod** (Validação)

### DevOps
- **Docker & Docker Compose**
- **ESLint**
- **TypeScript**

---

## 📋 Pré-requisitos

- Node.js 20+ 
- npm ou yarn
- PostgreSQL 15+ (ou Docker)
- Git

---

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd patrimonio_igreja
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/patrimonio_paroquia?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui-gere-com-openssl-rand-base64-32"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Configure o banco de dados

```bash
# Executar migrations
npm run prisma:migrate

# Gerar Prisma Client
npm run prisma:generate

# Popular banco com dados de teste
npm run prisma:seed
```

---

## 💻 Desenvolvimento

### Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Scripts disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Prisma Studio (GUI para o banco)
npm run prisma:studio

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Seed do banco
npm run prisma:seed

# Linter
npm run lint
```

---

## 🏭 Produção

### Build local

```bash
# 1. Build da aplicação
npm run build

# 2. Iniciar
npm start
```

### Variáveis de ambiente para produção

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/patrimonio_paroquia?schema=public"
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="<secret-forte-gerado>"
NODE_ENV="production"
```

---

## 🐳 Deploy com Docker

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Build e iniciar todos os serviços
docker-compose up -d

# 2. Verificar logs
docker-compose logs -f app

# 3. Parar serviços
docker-compose down

# 4. Parar e remover volumes
docker-compose down -v
```

O sistema estará disponível em: [http://localhost:3000](http://localhost:3000)

### Opção 2: Docker Manual

```bash
# 1. Build da imagem
docker build -t patrimonio-paroquia .

# 2. Criar rede
docker network create patrimonio_network

# 3. Iniciar PostgreSQL
docker run -d \
  --name patrimonio_db \
  --network patrimonio_network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=patrimonio_paroquia \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# 4. Iniciar aplicação
docker run -d \
  --name patrimonio_app \
  --network patrimonio_network \
  -e DATABASE_URL="postgresql://postgres:postgres@patrimonio_db:5432/patrimonio_paroquia?schema=public" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="<seu-secret>" \
  -p 3000:3000 \
  patrimonio-paroquia
```

### Deploy em Produção (VPS/Cloud)

1. **Configurar variáveis de ambiente no servidor**
2. **Usar Docker Compose com secrets**
3. **Configurar proxy reverso (Nginx/Caddy)**
4. **Configurar SSL/TLS (Let's Encrypt)**
5. **Configurar backups automáticos do banco**

---

## 🚀 Deploy na Vercel

**⚠️ Importante:** A Vercel não suporta Docker para bancos de dados. Você precisa usar um serviço de banco de dados gerenciado.

### Opções de Banco de Dados para Vercel

#### Opção 1: Vercel Postgres (Recomendado - Mais Fácil)
1. No painel da Vercel, vá em **Storage** → **Create Database** → **Postgres**
2. Escolha um plano (há um plano gratuito)
3. A Vercel criará automaticamente a variável `POSTGRES_URL` no formato correto
4. Use `POSTGRES_URL` como `DATABASE_URL` nas variáveis de ambiente

#### Opção 2: Supabase (Gratuito e Popular)
1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **Database** → copie a **Connection String**
4. Use essa string como `DATABASE_URL` na Vercel

#### Opção 3: Neon (Gratuito e Rápido)
1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Copie a **Connection String** do dashboard
4. Use essa string como `DATABASE_URL` na Vercel

#### Opção 4: Railway (Fácil de usar)
1. Crie uma conta em [railway.app](https://railway.app)
2. Crie um novo projeto → **New** → **Database** → **PostgreSQL**
3. Copie a **DATABASE_URL** das variáveis de ambiente
4. Use essa string como `DATABASE_URL` na Vercel

### Passo a Passo do Deploy

1. **Conecte seu repositório GitHub à Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Clique em **Add New Project**
   - Selecione seu repositório

2. **Configure as Variáveis de Ambiente**
   - No painel do projeto, vá em **Settings** → **Environment Variables**
   - Adicione as seguintes variáveis:
     ```
     DATABASE_URL=postgresql://usuario:senha@host:porta/banco?schema=public
     NEXTAUTH_URL=https://seu-dominio.vercel.app
     NEXTAUTH_SECRET=uma-string-secreta-aleatoria-muito-longa
     ```
   - ⚠️ **IMPORTANTE:** Use uma string aleatória longa para `NEXTAUTH_SECRET` (pode gerar com: `openssl rand -base64 32`)

3. **Execute as Migrações do Banco**
   - Após o primeiro deploy, você precisa executar as migrações
   - Opções:
     - **Opção A:** Use o Vercel CLI localmente:
       ```bash
       npx vercel env pull .env.local
       npx prisma migrate deploy
       ```
     - **Opção B:** Adicione um script no `package.json`:
       ```json
       "vercel-build": "prisma migrate deploy && next build"
       ```
     - **Opção C:** Use o Prisma Studio ou execute via terminal conectado ao banco

4. **Execute o Seed (Opcional)**
   - Se quiser popular o banco com dados iniciais:
   ```bash
   npx prisma db seed
   ```

5. **Deploy Automático**
   - A Vercel fará deploy automaticamente a cada push no branch `main`
   - Você pode configurar branches de preview também

### Troubleshooting

- **Erro "Missing DATABASE_URL":** Verifique se a variável está configurada corretamente no painel da Vercel
- **Erro de migração:** Execute `prisma migrate deploy` manualmente após o primeiro deploy
- **Erro de conexão:** Verifique se o banco de dados permite conexões externas (firewall/whitelist)

---

## 📁 Estrutura do Projeto

```
patrimonio_igreja/
├── app/                          # Aplicação Next.js (App Router)
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth
│   │   ├── bens/                 # CRUD de bens
│   │   ├── emprestimos/          # Empréstimos
│   │   ├── usuarios/             # Usuários
│   │   ├── pastorais/            # Pastorais
│   │   └── relatorios/           # Relatórios
│   ├── dashboard/                # Páginas protegidas
│   │   ├── bens/                 # Gestão de bens
│   │   ├── emprestimos/          # Retirada/Devolução
│   │   ├── relatorios/           # Relatórios
│   │   ├── usuarios/             # Admin: Usuários
│   │   └── pastorais/            # Admin: Pastorais
│   ├── login/                    # Página de login
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página inicial
│   ├── providers.tsx             # Providers (Session, Toast)
│   └── globals.css               # Estilos globais
├── components/                   # Componentes React
│   ├── ui/                       # Componentes shadcn/ui
│   ├── Navbar.tsx                # Navegação
│   └── BemCard.tsx               # Card de bem
├── lib/                          # Bibliotecas e utilitários
│   ├── prisma.ts                 # Cliente Prisma
│   ├── auth.ts                   # Funções de autenticação
│   ├── validations.ts            # Schemas Zod
│   └── permissions.ts            # Verificação de permissões
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema do banco
│   └── seed.ts                   # Seed de dados
├── types/                        # Definições de tipos
│   └── next-auth.d.ts            # Tipos NextAuth
├── public/                       # Arquivos estáticos
├── .env                          # Variáveis de ambiente (não versionar)
├── .env.example                  # Template de env
├── Dockerfile                    # Dockerfile para produção
├── docker-compose.yml            # Orquestração Docker
├── next.config.ts                # Configuração Next.js
├── tsconfig.json                 # Configuração TypeScript
├── tailwind.config.ts            # Configuração Tailwind
├── components.json               # Configuração shadcn/ui
└── README.md                     # Este arquivo
```

---

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Bens
- `GET /api/bens` - Listar bens
- `POST /api/bens` - Criar bem (ADM)
- `GET /api/bens/[id]` - Detalhes do bem
- `PUT /api/bens/[id]` - Atualizar bem (ADM)
- `DELETE /api/bens/[id]` - Deletar bem (ADM)

### Empréstimos
- `GET /api/emprestimos` - Listar empréstimos
- `POST /api/emprestimos` - Registrar retirada
- `PUT /api/emprestimos/[id]/devolucao` - Registrar devolução

### Usuários (ADM)
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário

### Pastorais
- `GET /api/pastorais` - Listar pastorais
- `POST /api/pastorais` - Criar pastoral (ADM)

### Relatórios
- `GET /api/relatorios?tipo=bens&formato=json` - Relatório JSON
- `GET /api/relatorios?tipo=emprestimos&formato=excel` - Exportar Excel

---

## 🔑 Credenciais de Teste

Após executar o seed (`npm run prisma:seed`), use:

### Administrador
- **Email:** admin@paroquia.com
- **Senha:** admin123

### Usuário Comum
- **Email:** joao@paroquia.com
- **Senha:** usuario123

---

## 📝 Fluxos de Uso (Conforme PRD)

### 1️⃣ Login
1. Acessar `/login`
2. Inserir email e senha
3. Redirecionar para `/dashboard`

### 2️⃣ Cadastrar Bem (ADM)
1. No dashboard, clicar em "Cadastrar Bem"
2. Preencher formulário
3. Salvar → Bem adicionado

### 3️⃣ Retirar Bem
1. Na lista, selecionar bem disponível
2. Clicar em "Retirar"
3. Preencher pastoral, motivo, estado
4. Confirmar → Bem marcado como emprestado

### 4️⃣ Devolver Bem
1. Na lista, selecionar bem emprestado
2. Clicar em "Devolver"
3. Informar estado de devolução
4. Confirmar → Bem marcado como disponível

### 5️⃣ Gerar Relatório
1. Acessar "Relatórios"
2. Selecionar tipo e filtros
3. Gerar → Visualizar ou exportar Excel

---

## 🛠️ Solução de Problemas

### Erro de conexão com banco de dados
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Verificar logs
docker-compose logs db
```

### Prisma Client desatualizado
```bash
npm run prisma:generate
```

### Erro de build
```bash
# Limpar cache
rm -rf .next
npm run build
```

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de gestão paroquial.

---

## 👨‍💻 Autor

**Douglas Santos**  
DAST Technologies  
Data: 12/11/2025

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato.

---

**🎉 Sistema pronto para uso!**
