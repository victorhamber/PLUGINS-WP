#!/bin/bash

echo "🚀 Preparando aplicação para deploy no EasyPanel..."
echo ""

# Passo 1: Build
echo "📦 Executando build da aplicação..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi

echo "✅ Build concluído"
echo ""

# Passo 2: Preparar deploy
echo "🔧 Preparando arquivos de deploy..."
node scripts/prepare-deploy.js

if [ $? -ne 0 ]; then
    echo "❌ Erro na preparação!"
    exit 1
fi

echo ""

# Passo 3: Criar ZIP
echo "📦 Criando arquivo ZIP..."
cd dist
zip -r ../dist.zip . > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar ZIP!"
    cd ..
    exit 1
fi

cd ..
echo "✅ Arquivo dist.zip criado com sucesso!"
echo ""

echo "✨ Preparação completa!"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse o EasyPanel"
echo "2. Crie um novo serviço do tipo 'Aplicativo'"
echo "3. Faça upload do arquivo 'dist.zip'"
echo "4. Configure as variáveis de ambiente (veja DEPLOY.md)"
echo "5. Configure Build Command: npm install --production"
echo "6. Configure Start Command: npm start"
echo "7. Inicie o serviço"
echo ""
echo "📖 Para mais detalhes, consulte DEPLOY.md"
