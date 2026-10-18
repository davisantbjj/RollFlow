# RollFlow — resumo para agentes (leia isto em vez de reexplorar o código)

SaaS para academias de Jiu-Jitsu. Um app Expo (Android/iOS/Web) + API Node. Visão de produto: `contexto.txt`.
Usuário é iniciante, fala português: mensagens/textos de UI em PT-BR. **Nunca faça git commit/push** — o usuário faz os commits.

## Rodar (tudo em Docker)
- `docker compose up --watch` na raiz. Já deve estar rodando — não suba de novo.
- API: http://localhost:3333 (health: `/health`). App web: http://localhost:8081. Banco: localhost:5433 (postgres/postgres, db `rollflow`).
- O `--watch` sincroniza `backend/src`, `backend/prisma` (reinicia o container: roda `prisma generate` + `prisma db push`), `frontend/src|store|theme|assets`. Mudou `package.json` → imagem é reconstruída sozinha.
- Instalar pacote: rode no host (`npm install x` no backend / `npx expo install x` no frontend) para atualizar package.json/lock; o watch reconstrói o container.
- Comandos dentro do container (Git Bash precisa do prefixo): `MSYS_NO_PATHCONV=1 docker compose exec -T backend <cmd>`
- Seed: `MSYS_NO_PATHCONV=1 docker compose exec -T backend npx prisma db seed`. Logs: `docker compose logs backend --tail 30`.
- Sem migrations ainda: schema muda via `db push`.

## Backend (`backend/`) — Express 5 + Prisma 7 (adapter pg) + Zod 4 + JWT
- `src/index.ts`: app, `export const prisma`, monta rotas. Rotas em `src/routes/*.ts`, lógica em `src/controllers/*Controller.ts` (classes com métodos `static async`, try/catch + `res.status(500).json({ error: 'Erro interno do servidor' })`, log `console.error('[Ctrl.metodo]', error)`).
- `middlewares/authMiddleware.ts`: `authenticate`, `authorizeRole([...])`, `AuthRequest` com `req.user = { id, role, academyId }`.
- `middlewares/validateBody.ts`: `validateBody(schema)`, `validateParams(schema)`. Schemas Zod todos em `src/schemas/index.ts`.
- `prisma/schema.prisma`: Academy, User (role MASTER|ADMIN|PROFESSOR|ALUNO|RESPONSAVEL, beltColor/beltDegree, isBlocked, guardianId), Class, ClassTeacher, Enrollment, Attendance, Plan, Subscription, Payment, Post, Comment, Like, Evaluation, ProgressionRule, BeltHistory.
- Rotas existentes: `/auth` (login, register), `/academies`, `/users` (GET /, GET /profile), `/classes` (CRUD parcial, enroll, students), `/attendance` (check-in, por turma, histórico), `/plans`, `/payments` (subscribe, subscriptions), `/progression` (student/:id, promote, rules), `/evaluation`.
- Seed: `prisma/seed.ts`. Logins: `mestre@rollflow.com` / `aluno@rollflow.com`, senha `123456`.
- Segurança multi-tenant tem falhas conhecidas — **fica para a última fase**, não é o foco agora (mas não piore: use sempre `req.user.academyId` em código novo).

## Frontend (`frontend/`) — Expo SDK 56, Expo Router (file-based em `src/app`), Zustand, Axios
- **Expo mudou**: consulte https://docs.expo.dev/versions/v56.0.0/ antes de usar APIs do Expo.
- `src/app/_layout.tsx`: Tabs (index, classes, feed, finance, profile); telas escondidas com `href: null`.
- Telas: `index` (home), `login`, `classes`, `checkin`, `feed` (mock), `finance` (mock), `profile`, `progression`.
- `src/services/api.ts`: axios com token e logout em 401; base `EXPO_PUBLIC_API_URL`.
- `store/authStore.ts`: Zustand { user, token, login, logout } — sem persistência ainda.
- Estilo: `theme/colors.ts` (`Colors.black/dark/card/border/gold/text/muted/red/green/blue`), `StyleSheet.create`, visual dark premium (referência: `rollflow.html`). Componente: `src/components/BeltCard.tsx`.
