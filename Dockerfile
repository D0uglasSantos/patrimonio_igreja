# Dockerfile para produção do Sistema de Patrimônio da Paróquia

# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar resto dos arquivos
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Estágio 2: Produção
FROM node:20-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Instalar dependências de produção e Prisma
RUN npm ci --only=production
RUN npx prisma generate

# Alterar proprietário dos arquivos
RUN chown -R nextjs:nodejs /app

# Usar usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Script de inicialização
CMD ["node", "server.js"]

