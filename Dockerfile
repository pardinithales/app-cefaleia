# Build stage
FROM node:18-alpine AS builder

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

# Instalar dumb-init para melhor gerenciamento de processos
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar node_modules do builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar arquivos da aplicação
COPY --chown=nodejs:nodejs . .

# Criar diretório para o banco de dados com permissões corretas
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Trocar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Usar dumb-init para iniciar a aplicação
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 