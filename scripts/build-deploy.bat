@echo off
chcp 65001 > nul
echo 🚀 Preparando aplicação para deploy no EasyPanel...
echo.

REM Passo 1: Build
echo 📦 Executando build da aplicação...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro no build!
    exit /b 1
)

echo ✅ Build concluído
echo.

REM Passo 2: Preparar deploy
echo 🔧 Preparando arquivos de deploy...
node scripts/prepare-deploy.js

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro na preparação!
    exit /b 1
)

echo.

REM Passo 3: Instruções para criar ZIP manualmente
echo 📦 Criando arquivo ZIP...
echo.
echo ⚠️  ATENÇÃO: O Windows não possui comando zip nativo.
echo.
echo Por favor, siga estas instruções:
echo 1. Abra a pasta 'dist' no Windows Explorer
echo 2. Selecione TODOS os arquivos dentro de 'dist'
echo 3. Clique com botão direito → "Enviar para" → "Pasta compactada"
echo 4. Renomeie para 'dist.zip' e mova para a pasta raiz do projeto
echo.
echo OU use PowerShell:
echo Compress-Archive -Path dist\* -DestinationPath dist.zip -Force
echo.

pause
echo.

echo ✨ Preparação completa!
echo.
echo 📋 Próximos passos:
echo 1. Crie o arquivo dist.zip conforme instruções acima
echo 2. Acesse o EasyPanel
echo 3. Crie um novo serviço do tipo 'Aplicativo'
echo 4. Faça upload do arquivo 'dist.zip'
echo 5. Configure as variáveis de ambiente (veja DEPLOY.md)
echo 6. Configure Build Command: npm install --production
echo 7. Configure Start Command: npm start
echo 8. Inicie o serviço
echo.
echo 📖 Para mais detalhes, consulte DEPLOY.md
echo.
pause
