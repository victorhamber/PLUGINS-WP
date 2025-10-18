# Requirements Document

## Introduction

Este documento define os requisitos para corrigir o bug onde o popup/dialog de criação e atualização de plugins fecha automaticamente quando o usuário faz upload de uma imagem ou arquivo ZIP, impedindo que o usuário complete o processo de criação/atualização do plugin.

## Glossary

- **Plugin Dialog**: O componente de interface que permite criar ou editar plugins através de um formulário modal
- **Upload Process**: O processo de envio de arquivos (imagem ou ZIP) para o servidor
- **Form State**: O estado atual dos dados preenchidos no formulário do plugin
- **Dialog State**: O estado de abertura/fechamento do modal de plugin

## Requirements

### Requirement 1

**User Story:** Como administrador, eu quero que o dialog de plugin permaneça aberto durante uploads, para que eu possa completar o processo de criação/atualização sem perder meu progresso.

#### Acceptance Criteria

1. WHEN o usuário seleciona um arquivo de imagem no input, THE Plugin Dialog SHALL permanecer aberto durante todo o processo de upload
2. WHEN o usuário seleciona um arquivo ZIP no input, THE Plugin Dialog SHALL permanecer aberto durante todo o processo de upload
3. WHILE um upload está em progresso, THE Plugin Dialog SHALL bloquear tentativas de fechamento
4. WHEN um upload é concluído com sucesso, THE Plugin Dialog SHALL continuar aberto para permitir finalização do formulário
5. IF um upload falha, THEN THE Plugin Dialog SHALL continuar aberto e exibir mensagem de erro

### Requirement 2

**User Story:** Como administrador, eu quero feedback visual claro durante uploads, para que eu saiba o status do processo e não tente fechar o dialog prematuramente.

#### Acceptance Criteria

1. WHEN um upload inicia, THE Plugin Dialog SHALL exibir indicador visual de progresso
2. WHILE um upload está em progresso, THE Plugin Dialog SHALL desabilitar o botão de cancelar/fechar
3. WHEN um upload é concluído, THE Plugin Dialog SHALL exibir confirmação visual do sucesso
4. THE Plugin Dialog SHALL mostrar mensagens de status específicas para cada tipo de upload (imagem vs arquivo)

### Requirement 3

**User Story:** Como administrador, eu quero que o estado do formulário seja preservado durante uploads, para que eu não perca dados já preenchidos se algo der errado.

#### Acceptance Criteria

1. WHEN um upload inicia, THE Plugin Dialog SHALL preservar todos os dados já preenchidos no formulário
2. IF um upload falha, THEN THE Plugin Dialog SHALL manter todos os dados do formulário intactos
3. WHEN o usuário cancela um upload, THE Plugin Dialog SHALL manter o estado anterior do formulário
4. THE Plugin Dialog SHALL resetar inputs de arquivo após upload bem-sucedido sem afetar outros campos

### Requirement 4

**User Story:** Como administrador, eu quero controle manual sobre quando fechar o dialog, para que eu possa revisar todas as informações antes de finalizar.

#### Acceptance Criteria

1. THE Plugin Dialog SHALL fechar apenas quando o usuário clica explicitamente em "Cancelar" ou "X" (fora de uploads)
2. THE Plugin Dialog SHALL fechar automaticamente apenas após criação/atualização bem-sucedida do plugin
3. WHEN uploads estão em progresso, THE Plugin Dialog SHALL ignorar tentativas de fechamento via ESC ou clique fora
4. THE Plugin Dialog SHALL permitir fechamento normal quando nenhum upload está ativo