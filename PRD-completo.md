# PRD Completo — Plataforma de Plugins WordPress com Marketplace, Assinaturas e Afiliados

## Visão Geral
- Aplicação full‑stack para venda e distribuição de plugins WordPress.
- Suporta assinaturas, licenças, downloads, checkout com múltiplos provedores de pagamento, cupons, sistema de afiliados multi‑nível, analytics, alertas, e administração completa.
- Frontend em `React + Vite`; backend em `Node.js + Express` com `Drizzle ORM` (PostgreSQL).
- Notificações em tempo real e robusta camada de segurança e compliance.

## Objetivos de Negócio
- Comercializar plugins com planos `mensal`, `anual` e `vitalício`.
- Gerenciar assinaturas, licenças e downloads com controle de domínio.
- Otimizar receita com cupons, promoções e pricing analytics.
- Atrair e gerir afiliados, com comissões e pagamentos escaláveis.
- Fornecer relatórios e alertas de desempenho.
- Garantir segurança, auditoria e conformidade (privacidade, antifraude).

## Escopo
- Loja e vitrine de plugins; página de detalhes e fluxo de checkout.
- Área do usuário: assinaturas, licenças, downloads.
- Área administrativa: usuários, plugins, configurações, cupons, provedores de pagamento, alertas e relatórios.
- Sistema de afiliados: links de referência, tracking, comissões e payout.
- Analytics: coleta de eventos, relatórios, versões, compartilhamentos, alertas.

## Personas
- Visitante: navega na loja e visualiza plugins.
- Usuário: compra, gerencia licenças e faz downloads.
- Admin: gerencia catálogo, usuários, configurações e integrações.
- Afiliado: divulga, acompanha métricas e recebe comissões.
- Dono de plugin: configura regras específicas do programa de afiliados.

## Principais Fluxos
- Descoberta → Detalhe do plugin → Checkout → Assinatura → Licença → Download.
- Afiliado → Link → Tracking → Conversão → Comissão → Payout.
- Admin → Configurações → Provedores de pagamento → Upload de plugins/imagens → Relatórios/Alertas.

## Frontend (Páginas)
- `Landing`, `Store`, `PluginDetail`, `Dashboard`, `Downloads`, `Licenses`, `Subscriptions`, `AuthPage`, `not-found`.
- Admin: `AdminPlugins`, `AdminUsers`, `AdminSettings`, `AdminCoupons`, `AdminPaymentProviders`, `AdminReports`, `AdminAlerts`.

## Componentes Principais
- Afiliados: dashboards, preferências, links, ranking, performance, segurança.
- Checkout e confirmação de pedido; gerenciamento de payout e histórico de comissões.
- UI: ampla biblioteca de componentes (botões, tabelas, diálogos, toasts, etc.).

## Backend (Módulos)
- Autenticação: `auth.ts`, sessões (`sessions`).
- Catálogo: `storage.ts` e rotas em `routes.ts` para plugins.
- Assinaturas/Licenças/Downloads: criação, validação, ativação de domínio, registro de download.
- Pagamentos: `paymentService.ts`, `paymentProcessors.ts`, `paymentMethodService.ts`, `processedWebhookEvents`, `paymentProviders`.
- Cupons: CRUD e uso (`coupons`, `coupon_usages`).
- Afiliados: APIs e serviços (`affiliateApi.ts`, `commissionApi.ts`, `payoutApi.ts`, etc.).
- Marketing: `marketingMaterials.ts` e materiais por plugin.
- Analytics: `analytics.ts`, `analytics_pricing.ts`, relatórios, versões, shares, alertas e eventos.
- Relatórios/Agendamentos: `reporting.ts`, `payoutScheduler.ts`.
- Segurança/Compliance: `security.ts`, `securityMiddleware.ts`, `csrfProtection.ts`, `auditLogging.ts`, `fraudDetection.ts`.
- Uploads: `upload.ts`, `uploadImage.ts` com estáticos em `/uploads`.
- Dev: `vite.ts`, integração com Vite.
## API — Endpoints Principais
- `GET /api/health`: healthcheck.
- Auth:
  - `GET /api/auth/user`: dados do usuário autenticado.
- Plugins:
  - `GET /api/plugins`: lista de plugins ativos.
  - `GET /api/plugins/:slug`: detalhes do plugin por slug.
- Assinaturas:
  - `GET /api/subscriptions`: assinaturas do usuário.
  - `POST /api/subscriptions`: cria assinatura (gera licença automática).
  - `DELETE /api/subscriptions/:id`: cancela assinatura.
- Licenças:
  - `GET /api/licenses`: licenças do usuário.
  - `POST /api/licenses/validate`: valida uma licença e domínio.
  - `POST /api/licenses/activate`: ativa domínio em uma licença.
- Downloads:
  - `GET /api/downloads/:pluginId`: download de plugin (requer assinatura ativa).
- Admin — Plugins:
  - `GET /api/admin/plugins`: lista completa.
  - `POST /api/admin/plugins/upload`: upload de arquivo `.zip`.
  - `POST /api/admin/plugins/upload-image`: upload de imagem do plugin.
  - `POST /api/admin/plugins`: cria plugin.
  - `PUT /api/admin/plugins/:id`: atualiza plugin.
  - `DELETE /api/admin/plugins/:id`: remove plugin.
- Admin — Usuários:
  - `GET /api/admin/users`: lista usuários.
  - `PUT /api/admin/users/:id`: atualiza permissões (`isAdmin`).
- Admin — Configurações:
  - `GET /api/admin/settings`: lista (mascara segredos).
  - `POST /api/admin/settings`: upsert em lote.
- Checkout/Pagamentos:
  - `POST /api/checkout/create-payment`: cria pagamento com `PaymentServiceFactory`.
- Observação: Endpoints adicionais para cupons, afiliados, comissões, payouts, relatórios, alertas e analytics são definidos em `routes.ts` e módulos dedicados (ver anexos).## Modelo de Dados (Drizzle ORM / PostgreSQL)
- `sessions`: armazenamento de sessão (sid, sess, expire).
- `users`: perfis de usuário (admin, stripe ids, timestamps).
- `plugins`: metadados, pricing (mensal/anual/vitalício), dono, status.
- `subscriptions`: relação usuário↔plugin, plano, status e datas.
- `licenses`: chave única, domínios, status, ativação/expiração, vínculo assinatura.
- `downloads`: histórico de downloads por usuário e plugin.
- `settings`: chave/valor com flag de segredo.
- `processed_webhook_events`: idempotência de webhooks de pagamento.
- `payment_providers`: provedores com `config` JSON, flags `isActive/isDefault`.
- `coupons`: código, tipo, valor, limites e aplicabilidade por plugins.
- `coupon_usages`: uso por usuário/assinatura, montantes e timestamps.
- Afiliados:
  - `affiliates`: perfil, status, taxa, hierarquia, ganhos/métricas.
  - `referral_links`: link e parâmetros, métricas (cliques, conversões).
  - `referral_tracking`: sessão, IP, agente, landing/referrer, status conversão.
  - `commissions`: valores, tipo, status, tier, vínculos.
  - `affiliate_payouts`: lote, valores, método, status, transação.
  - `affiliate_program_settings`: regras globais/por plugin (cookie, tiers, mínimo).
  - `affiliate_marketing_materials`: tipo, título, arquivos e métricas.
  - `plugin_affiliate_settings`: regras por plugin (enabled, taxa, aprovados/bloqueados).
- Analytics:
  - `analytics_events`: eventos com `metadata`, sessão, IP, user agent.
  - `seller_analytics_cache`: cache de métricas por período.
  - `analytics_reports`: relatórios com config, formato, agendamento.
  - `analytics_report_runs`: execuções, status, snapshot, erro.
  - `analytics_report_versions`: versionamento de relatórios.
  - `analytics_report_shares`: compartilhamentos (usuário, email, link público).
  - `analytics_alerts`: regras de alerta (condição, operador, canais).
  - `analytics_alert_events`: eventos gerados (status, contexto).
- Segurança/Compliance:
  - `audit_logs`: trilha de auditoria (entidade, ação, diff, metadados).
  - `suspicious_activities`: atividades suspeitas com `riskScore` e flags.
  - `fraud_detection_rules`: regras dinâmicas com condições e risco.
  - `privacy_requests`: pedidos de privacidade (LGPD/GDPR).
  - `compliance_reports`: relatórios de conformidade (período, status, detalhes).
  - `device_fingerprints`: hash, risco, flagged, contagem/tempos.
  - `ip_reputation`: reputação de IP, risco e bloqueios (quando habilitado).## Regras de Negócio
- Assinaturas: status `active/expired/cancelled/pending`; `autoRenew` e integração com provedores.
- Licenças: validação de chave, status, expiração; ativação de domínio respeitando `maxDomains`.
- Downloads: somente para usuários com assinatura ativa do `pluginId` solicitado.
- Checkout: preço calculado por plano; metadados informados ao gateway; moeda `BRL`.
- Cupons: tipos `percentage/fixed`; limites de uso (global/por usuário), período de validade e plugins aplicáveis.
- Afiliados:
  - Códigos únicos, hierarquia e tiers; cookie duration e política de atribuição.
  - Comissões por conversão; status `pending/approved/paid/cancelled`.
  - Payout mínimo e agendamento; métodos: PayPal, transferência bancária, cripto.
- Analytics:
  - Coleta de eventos com `metadata`; relatórios com versões e compartilhamento.
  - Alertas por condições (limiar/tendência/anomalia) com canais (email/webhook).
- Admin: máscara de segredos em `/api/admin/settings`; validações com Zod.

## Segurança e Middleware
- Cabeçalhos de segurança e limites de tamanho de requisição.
- Rate limiting:
  - Geral e rotas sensíveis (auth, uploads, admin, validações).
- `validateRequest`: bloqueio de padrões suspeitos (XSS, SQLi, path traversal, comandos).
- CSRF: proteção para ações críticas quando habilitada.
- Auditoria: `audit_logs` para mudanças em entidades.
- Antifraude: `suspicious_activities`, `fraud_detection_rules`, device fingerprint e reputação de IP.

## Notificações em Tempo Real
- WebSocket para métricas/analytics e centro de notificações.
- Broadcast de eventos e métricas consolidadas.

## Integrações de Pagamento
- Provedores em `payment_providers` (ex.: `stripe`, `mercadopago`, `hotmart`, `monetizze`, `yampi`, `custom`).
- Fábrica `PaymentServiceFactory` com roteamento por `type` e `isDefault`.
- Webhooks com idempotência em `processed_webhook_events`.

## Configuração e Ambientes
- `.env`: `PORT=5004`, `HOST=0.0.0.0`, `BASE_URL`, `CLIENT_URL`, `PUBLIC_BASE_URL`.
- Servidor: `Express` ouvindo em `0.0.0.0:5004` (por padrão via env).
- Cache: fallback para `node-cache` quando Redis não está configurado.

## Monitoramento e Logs
- Logs: `logs/api-access.log`, `logs/combined.log`, `logs/error.log`, `logs/security.log`.
- Métricas de performance e alertas analytics.

## UX/Frontend
- Fluxos alinhados às páginas listadas; componentes de UI reutilizáveis.
- Consentimento: `ConsentBanner`; notificações: `NotificationCenter`, `RealtimeNotifications`.

## Requisitos Não Funcionais
- Performance: rate limits e caching; consultas indexadas no banco.
- Segurança: validações robustas, auditoria e conformidade com privacidade.
- Observabilidade: logs detalhados e alertas de analytics.
- Escalabilidade: multi‑provedores, tiers de afiliados, cache e filas agendadas.
## Anexos — Módulos do Backend e Responsabilidades
- `server/index.ts`: bootstrapping, host/port, integração Vite e sockets.
- `server/routes.ts`: registro de todas as rotas HTTP.
- `server/auth.ts`: sessão/autenticação, guards `isAuthenticated/isAdmin`.
- `server/storage.ts`: acesso a dados (plugins, usuários, assinaturas, licenças, downloads, settings).
- `server/upload.ts` / `server/uploadImage.ts`: upload de arquivos e imagens; integração com `/uploads`.
- `server/paymentService.ts`: fábrica e serviços de pagamento.
- `server/paymentProcessors.ts`: integração com gateways (impl. por `type`).
- `server/paymentMethodService.ts`: métodos de pagamento do afiliado/payout.
- `server/commissionApi.ts`: criação e gestão de comissões.
- `server/commissionCalculation.ts`: regras de cálculo de comissão.
- `server/commissionStatusManagement.ts`: transições de status.
- `server/payoutApi.ts`: APIs de pagamentos a afiliados.
- `server/payoutCalculation.ts`: cálculo de lote/valores.
- `server/payoutProcessing.ts`: processamento e transações.
- `server/payoutScheduler.ts`: agendamento de payouts.
- `server/affiliateApi.ts`: cadastro/gestão de afiliados.
- `server/affiliateManagement.ts`: políticas e preferências.
- `server/pluginOwnerAffiliateApi.ts`: controles para donos de plugins.
- `server/marketingMaterials.ts`: materiais de marketing e métricas.
- `server/fraudDetection.ts` / `server/fraudDetectionApi.ts`: regras e APIs antifraude.
- `server/referralLinks.ts` / `server/referralConversion.ts` / `server/referralMaintenance.ts`: geração/gestão de links e tracking, manutenção.
- `server/realtimeNotifications.ts`: hub de notificações em tempo real.
- `server/analytics.ts`: métricas (receita, funil, segmentação, etc.).
- `server/analytics_pricing.ts`: pricing analytics, AB test e recomendações.
- `server/reporting.ts`: execução de relatórios e agendamento.
- `server/alerts.ts`: teste e disparo de alertas.
- `server/monitoring.ts`: métricas e monitoramento.
- `server/logger.ts`: logging de aplicação.
- `server/securityMiddleware.ts` / `server/middleware/security.ts`: cabeçalhos, rate limit e validação.
- `server/middleware/validation.ts`: validações (Zod) e sanitização.
- `server/csrfProtection.ts`: proteção contra CSRF.
- `server/swagger.ts`: documentação da API.
- `server/db.ts`: conexão, pool e utilitários.
- `server/vite.ts`: configuração de dev com Vite/HMR.
## Anexos — Páginas/Componentes de Frontend
- Páginas:
  - `Landing`, `Store`, `PluginDetail`, `Dashboard`, `Downloads`, `Licenses`, `Subscriptions`, `AuthPage`, `not-found`.
  - Admin: `AdminPlugins`, `AdminUsers`, `AdminSettings`, `AdminCoupons`, `AdminPaymentProviders`, `AdminReports`, `AdminAlerts`.
- Componentes relevantes:
  - Afiliados: `AffiliateDashboard`, `AffiliatePerformanceDashboard`, `AffiliatePreferences`, `AffiliateProfileEdit`, `AffiliateSecuritySettings`, `ReferralLinkManager`, `CommissionTrackingHistory`, `PluginAffiliate*`, `PluginOwnerAffiliateDashboard`.
  - Pagamentos/Checkout: `CheckoutForm`, `OrderConfirmation`, `PayoutManagement`.
  - UI base: `ui/*` (accordion, alert, button, card, dialog, table, toast, etc.).
  - Notificações/Tempo real: `NotificationCenter`, `RealtimeNotifications`.
  - Outras utilidades: `ConsentBanner`, `ThemeToggle`, `ErrorBoundary`, `GlobalMapErrorTap`, `LoadingSpinner`, `AuthStatusTest`, `TestValidation`.

## Considerações de Implementação
- Validação server‑side via `Zod` (e `drizzle-zod`) em rotas críticas.
- Paths de arquivos normalizados ao servir downloads (`path.join`).
- Uploads retornam URLs relativas compatíveis com rota estática `/uploads`.
- Redirecionamento raiz: `GET /` → `/dashboard` quando autenticado.
- Documentação e swagger: planejar exposição segura em ambiente admin/dev.

## Roadmap e Próximos Passos
- Finalizar documentação de todos endpoints REST em `swagger.ts`.
- Configurar Redis para cache distribuído e filas de processamento.
- Fortalecer CSRF e rate limits por rota sensível.
- Completar dashboards admin com métricas agregadas e relatórios versionados.
- Ampliar integrações de gateways e testar webhooks com idempotência.
