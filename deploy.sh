#!/bin/bash

# Script de Deploy para App Cefaleia
# Executa na VPS para fazer deploy da aplicação

echo "🚀 Iniciando deploy do App Cefaleia..."

# Definir diretório do projeto
PROJECT_DIR="/root/app-cefaleia"

# Criar diretório se não existir
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Criando diretório do projeto..."
    mkdir -p "$PROJECT_DIR"
fi

# Entrar no diretório
cd "$PROJECT_DIR"

# Clonar ou atualizar repositório
if [ ! -d ".git" ]; then
    echo "📥 Clonando repositório..."
    git clone https://github.com/pardinithales/app-cefaleia.git .
else
    echo "🔄 Atualizando repositório..."
    git pull origin main
fi

# Verificar se a rede do Traefik existe
if ! docker network ls | grep -q traefik-network; then
    echo "🌐 Criando rede do Traefik..."
    docker network create traefik-network
fi

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose down

# Construir e iniciar novos containers
echo "🏗️ Construindo imagem Docker..."
docker-compose build --no-cache

echo "🚀 Iniciando containers..."
docker-compose up -d

# Verificar status
echo "✅ Verificando status dos containers..."
docker-compose ps

echo "🎉 Deploy concluído!"
echo "📊 Acesse em: https://cefaleia.pardinithales.com"
echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Reiniciar: docker-compose restart"
echo "  - Parar: docker-compose down" 