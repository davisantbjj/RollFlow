# RollFlow - SaaS para Gestão de Academias de Lutas (BJJ)

Plataforma premium para gestão e engajamento de academias de artes marciais, com foco no acompanhamento da evolução do aluno, gestão financeira e operacional.

## 🌟 Melhorias e Adições à Ideia Original

A sua ideia original descrita no `contexto.txt` é excelente, com uma visão clara dos perfis de usuário e necessidades do nicho de Jiu-Jitsu. O protótipo HTML mostra um forte direcionamento para um design premium. Para elevar a plataforma a um nível ainda mais alto, proponho as seguintes adições:

1. **Gamificação Avançada**: Além das barras de progresso de faixa/grau, implementar um sistema de conquistas (badges) como "10 aulas seguidas", "Competidor", "Sempre no Horário". Isso aumenta drásticamente o engajamento diário do aluno.
2. **Assinaturas de Contratos e Termos Digitais**: Academias de lutas exigem termos de responsabilidade (waivers) e contratos de matrícula. Permitir que isso seja assinado digitalmente no onboarding do app reduz atrito e papelada.
3. **Loja da Academia (Pro Shop)**: Módulo simples para venda de kimonos, rash guards, faixas e suplementos pelo app, com opção de cobrar junto com a próxima mensalidade ou pagar na hora (PIX).
4. **Gestão de Competições**: Área para os professores organizarem turmas focadas em campeonatos, acompanharem quem vai competir em quais eventos, e histórico de medalhas.
5. **Videoteca (Conteúdo Premium)**: Módulo onde o professor/master pode postar vídeos de técnicas detalhadas (ex: "Posição da Semana"). O acesso pode ser incluído em planos mais caros, gerando receita extra para a academia.
6. **Painel Web (Dashboard Desktop)**: Embora o uso operacional (professor/aluno) seja 100% mobile, o Dono (Master) frequentemente precisa analisar métricas financeiras complexas ou emitir relatórios. Um dashboard Web focado no Master é fundamental.

## User Review Required

> [!IMPORTANT]  
> Precisamos definir o escopo do **MVP (Mínimo Produto Viável)**. Devemos incluir todas as funcionalidades de imediato ou focar primeiro na tríade essencial: **Presença, Financeiro e Evolução**?

## Open Questions

> [!WARNING]  
> 1. **Gateway de Pagamento**: Qual será o principal gateway utilizado? (Sugestões: MercadoPago, Stripe, ou Asaas, que são excelentes para recorrência no Brasil).
> 2. **Plataforma Web vs Mobile**: Você concorda em criarmos um Dashboard Web em React/Next.js focado especificamente no uso administrativo do dono da academia, mantendo o app mobile para alunos e professores?
> 3. **Infraestrutura**: Você prefere iniciar com serviços gerenciados como Supabase/Firebase (que aceleram o desenvolvimento do backend) ou construir uma API Node.js/PostgreSQL tradicional do zero?

## Arquitetura do Sistema

### 📱 Frontend Mobile (Alunos e Professores)
- **Framework**: React Native com Expo.
- **Estilização**: Foco absoluto em UI/UX Premium (Dark mode, neon highlights, glassmorphism) baseado no protótipo `rollflow.html`.
- **Gerenciamento de Estado**: Zustand.
- **Navegação**: React Navigation.

### 💻 Frontend Web (Dashboard do Master - Sugerido)
- **Framework**: Next.js (React).
- **Estilização**: Vanilla CSS de alta qualidade ou TailwindCSS, garantindo um visual tão polido quanto o app.

### 🌐 Backend e API
- **Tecnologia**: Node.js com TypeScript.
- **Framework**: Express ou NestJS.
- **ORM**: Prisma.
- **Autenticação**: JWT, suportando login social e multi-perfil.

### 🗄️ Banco de Dados e Infraestrutura
- **Banco**: PostgreSQL (ideal para dados financeiros e relatórios complexos).
- **Storage**: AWS S3 ou Cloudflare R2 (para fotos de perfil, feed e vídeos curtos).
- **Multi-tenant**: Isolamento lógico robusto usando a coluna `academy_id` em todas as tabelas (Row Level Security recomendado).

## Regras de Negócios Principais

### 1. Multi-Tenant e Perfis
- O sistema suportará múltiplas academias no mesmo banco de dados.
- Todo usuário (exceto administradores do SaaS) pertence a uma ou mais `academy_id`.
- **Hierarquia de Acesso**:
  - `Master`: Visão total financeira e administrativa da sua academia.
  - `Professor`: Acesso às suas turmas, chamadas e avaliações de alunos. Sem acesso financeiro.
  - `Aluno`: Visão apenas do seu progresso, pagamentos e interações no feed.
  - `Responsável`: Vinculado a perfis de Alunos menores; acesso à evolução e pagamentos, mas sem capacidade de postar no feed como o aluno.

### 2. Controle Financeiro
- Geração automática de mensalidades via *cron jobs* ou *webhooks* do gateway.
- **Regra de Inadimplência**: Configuração pelo Master de quantos dias de atraso geram bloqueio automático (ex: após 5 dias, a catraca digital no app bloqueia e o QR code de check-in não é gerado).

### 3. Sistema de Evolução (Progressão)
- O motor de graduação utilizará fórmulas customizáveis pelo Master.
- Parâmetros: `Tempo mínimo de faixa`, `Frequência mínima (X aulas)`, `Avaliação do Professor`.
- A barra de progresso no app do aluno reagirá em tempo real após cada aula confirmada (check-in).

## Proposed Changes (Fases de Implementação)

Planejaremos a execução nas seguintes fases:

### Fase 1: Fundação
- Setup do Monorepo ou repositórios independentes.
- Modelagem e criação do banco de dados PostgreSQL com Prisma.
- Implementação de autenticação e estrutura multi-tenant no Backend.

### Fase 2: Gestão Operacional e Mobile Core
- App Mobile: Criação das telas principais (Baseadas no `rollflow.html`).
- Backend: CRUD de Turmas, Aulas e Usuários.
- Funcionalidade de Chamada / Check-in.

### Fase 3: Evolução e Feed
- Motor de cálculo de progresso (Graus e Faixas).
- Timeline de feedbacks e feed de rede social interna.

### Fase 4: Financeiro e Web Dashboard
- Integração de gateway de pagamento.
- Painel Web (Next.js) para relatórios financeiros, controle de inadimplência e dashboards do Master.

## Verification Plan

### Automated Tests
- Testes unitários no backend (ex: Jest) para garantir a segurança da lógica multi-tenant (garantir que uma academia não acesse dados de outra).
- Testes da lógica de cálculo de progresso de faixas.

### Manual Verification
- O usuário (você) deverá revisar os fluxos no simulador/device físico (usando Expo Go).
- Validação de que a estética Premium, conforme os requisitos de design dinâmico e micro-interações, está sendo estritamente seguida em todas as telas criadas.
