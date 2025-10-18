import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function prepareDeployment() {
  console.log('🚀 Preparando aplicação para deploy...\n');

  // 1. Criar package.json para produção
  console.log('📦 Criando package.json de produção...');
  const productionPackage = {
    name: "wp-plugins-marketplace",
    version: "1.0.0",
    type: "module",
    scripts: {
      start: "NODE_ENV=production node index.js"
    },
    dependencies: {
      "@neondatabase/serverless": "^0.10.4",
      "connect-pg-simple": "^10.0.0",
      "dotenv": "^17.2.3",
      "drizzle-orm": "^0.39.1",
      "drizzle-zod": "^0.8.0",
      "express": "^4.21.2",
      "express-session": "^1.18.1",
      "memoizee": "^0.4.17",
      "multer": "^2.0.2",
      "openid-client": "^6.8.1",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "stripe": "^19.1.0",
      "zod": "^3.24.2"
    }
  };

  await fs.writeFile(
    path.join(distDir, 'package.json'),
    JSON.stringify(productionPackage, null, 2)
  );
  console.log('✅ package.json criado\n');

  // 2. Copiar pasta uploads se existir
  console.log('📁 Copiando diretório uploads...');
  const uploadsSource = path.join(rootDir, 'uploads');
  const uploadsTarget = path.join(distDir, 'uploads');
  
  try {
    await fs.access(uploadsSource);
    // Usar fs.cp com opção recursive para copiar diretórios aninhados
    await fs.cp(uploadsSource, uploadsTarget, { recursive: true });
    console.log('✅ Diretório uploads copiado\n');
  } catch (error) {
    console.log('⚠️  Diretório uploads não encontrado ou vazio\n');
  }

  // 3. Criar arquivo .env.example
  console.log('📝 Criando .env.example...');
  const envExample = `# Configuração do Banco de Dados
DATABASE_URL=postgresql://user:password@host:5432/database

# Configuração da Porta
PORT=5000

# Configuração do Node
NODE_ENV=production

# Configuração Stripe (opcional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Configuração Replit OAuth (opcional)
REPLIT_CLIENT_ID=
REPLIT_CLIENT_SECRET=
`;

  await fs.writeFile(
    path.join(distDir, '.env.example'),
    envExample
  );
  console.log('✅ .env.example criado\n');

  // 4. Criar README de deploy
  console.log('📄 Criando README de deploy...');
  const readme = `# WP Plugins Marketplace - Guia de Deploy

## Preparação para Deploy no EasyPanel

### Passo 1: Configurar Variáveis de Ambiente

Antes de fazer o deploy, configure as seguintes variáveis de ambiente no EasyPanel:

\`\`\`
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=5000
NODE_ENV=production
\`\`\`

Variáveis opcionais para pagamentos e autenticação:
\`\`\`
STRIPE_SECRET_KEY=sua_chave_stripe
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
REPLIT_CLIENT_ID=seu_client_id (se usar OAuth Replit)
REPLIT_CLIENT_SECRET=seu_client_secret (se usar OAuth Replit)
\`\`\`

### Passo 2: Fazer Upload do ZIP

1. Faça o upload do arquivo \`dist.zip\` no EasyPanel
2. O EasyPanel irá extrair os arquivos automaticamente
3. Configure o comando de build: \`npm install --production\`
4. Configure o comando de start: \`npm start\`

### Passo 3: Configurar Banco de Dados

1. Crie um banco de dados PostgreSQL no EasyPanel (ou use um externo)
2. Configure a variável DATABASE_URL com a string de conexão
3. Execute as migrations (se necessário):
   - Acesse o terminal do container
   - Execute: \`npx drizzle-kit push\` (requer drizzle-kit como dev dependency)

### Estrutura de Arquivos

\`\`\`
dist/
├── index.js          # Servidor backend compilado
├── public/           # Arquivos estáticos do frontend
├── uploads/          # Diretório para uploads (criado automaticamente)
├── package.json      # Dependências de produção
├── .env.example      # Exemplo de configuração
└── README.md         # Este arquivo
\`\`\`

### Comandos Disponíveis

- \`npm start\`: Inicia o servidor em modo produção
- Servidor roda na porta 5000 (ou PORT definido nas variáveis de ambiente)

### Notas Importantes

1. **Banco de Dados**: Certifique-se que o banco PostgreSQL está acessível
2. **Uploads**: O diretório \`uploads/\` será criado automaticamente se não existir
3. **SSL**: Configure SSL no proxy reverso do EasyPanel se necessário
4. **Domínio**: Configure seu domínio personalizado nas configurações do EasyPanel

### Troubleshooting

**Erro de conexão com banco:**
- Verifique se DATABASE_URL está configurado corretamente
- Teste a conexão com o banco de dados

**Erro ao iniciar servidor:**
- Verifique os logs no EasyPanel
- Certifique-se que todas as variáveis de ambiente estão configuradas

**Problemas com uploads:**
- Verifique permissões do diretório uploads/
- Certifique-se que o volume está montado corretamente
`;

  await fs.writeFile(
    path.join(distDir, 'README.md'),
    readme
  );
  console.log('✅ README.md criado\n');

  console.log('✨ Preparação concluída!\n');
  console.log('📋 Próximos passos:');
  console.log('1. Navegue até a pasta dist/');
  console.log('2. Comprima todo o conteúdo em um arquivo ZIP');
  console.log('3. Faça upload do ZIP no EasyPanel');
  console.log('4. Configure as variáveis de ambiente');
  console.log('5. Inicie a aplicação\n');
}

prepareDeployment().catch(console.error);
