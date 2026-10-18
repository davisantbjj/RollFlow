# Contrato da API — Fase "App" (backend implementa, frontend consome)

Regras gerais:
- Todas as rotas exigem `Authorization: Bearer <token>`, exceto `/auth/*`.
- A academia vem SEMPRE do token (`req.user.academyId`) — nunca do body em rotas novas.
- Erros: `{ "error": "mensagem em PT-BR" }`. Datas em ISO string. Valores em reais (number), como hoje.
- "Staff" = MASTER, ADMIN, PROFESSOR. "Gestão" = MASTER, ADMIN.

## Schema (mudanças)
- `Academy.blockAfterDays Int @default(5)` — dias de atraso até bloquear.
- `Payment.dueDate DateTime` — vencimento daquela cobrança.

## Dashboard
`GET /dashboard` (Gestão) →
```json
{ "activeStudents": 12, "classesCount": 3, "attendanceThisMonth": 84,
  "monthRevenue": 2040.0, "overdueCount": 2, "overdueTotal": 340.0, "pendingCount": 5 }
```

## Feed
- `GET /posts` (todos) → lista da academia, fixados primeiro, depois mais novos:
```json
[{ "id": "...", "content": "...", "imageUrl": null, "isPinned": false, "createdAt": "...",
   "author": { "id": "...", "name": "...", "role": "PROFESSOR", "beltColor": "PRETA" },
   "likesCount": 3, "commentsCount": 1, "likedByMe": true }]
```
- `POST /posts` (Staff) `{ content, imageUrl?, isPinned? }` → post no formato acima.
- `DELETE /posts/:id` (autor ou Gestão) → 204.
- `PATCH /posts/:id/pin` (Gestão) `{ isPinned }` → post.
- `POST /posts/:id/like` (todos) → alterna curtida → `{ "liked": true, "likesCount": 4 }`.
- `GET /posts/:id/comments` → `[{ id, content, createdAt, author: { id, name } }]` (mais antigos primeiro).
- `POST /posts/:id/comments` (todos) `{ content }` → comentário.

## Financeiro (manual, sem gateway por enquanto)
- `POST /payments/subscribe` (existente) passa a criar também o 1º `Payment` PENDING (amount = plan.price, dueDate = hoje).
- `GET /payments/me` (todos) → assinatura atual do usuário logado:
```json
{ "subscription": { "id": "...", "status": "ACTIVE", "dueDate": "...", "plan": { "id": "...", "name": "...", "price": 170, "interval": "MONTHLY" } } | null,
  "payments": [{ "id": "...", "amount": 170, "status": "PENDING", "dueDate": "...", "paymentDate": null, "isOverdue": false }] }
```
- `GET /payments/overview` (Gestão) →
```json
{ "monthRevenue": 2040, "overdueTotal": 340, "overdueCount": 2, "pendingCount": 5,
  "payments": [{ "id": "...", "amount": 170, "status": "PENDING", "dueDate": "...", "isOverdue": true,
                 "user": { "id": "...", "name": "..." }, "plan": { "id": "...", "name": "..." } }] }
```
  (`payments` = PENDING da academia, atrasados primeiro.)
- `POST /payments/:id/pay` (Gestão) → marca PAID (paymentDate = agora), assinatura volta a ACTIVE, avança `subscription.dueDate` 1 intervalo, cria o próximo Payment PENDING, desbloqueia o usuário se não restar atraso. → `{ "payment": {...}, "nextPayment": {...} }`
- Job (no start da API e a cada 1h): Payment PENDING com `dueDate + academy.blockAfterDays < agora` → subscription OVERDUE e `user.isBlocked = true`.
- `GET /plans` (existente). `PUT /plans/:id` (Gestão) `{ name?, description?, price?, interval? }`. `DELETE /plans/:id` (Gestão) → desativa (`isActive=false`), 204.

## Turmas
- `PUT /classes/:classId` (Gestão) `{ name?, description?, dayOfWeek?, startTime?, endTime?, maxStudents? }` → turma.
- `DELETE /classes/:classId` (Gestão) → 204 (remove matrículas/professores/presenças da turma junto).
- `GET /classes/:classId` (Staff) → `{ ...turma, teachers: [{ id, name }], students: [{ id, name, beltColor, beltDegree, isBlocked }] }`
- `POST /classes/:classId/teachers` (Gestão) `{ teacherId }` → 201. `DELETE /classes/:classId/teachers/:teacherId` → 204.
- `DELETE /classes/:classId/enroll/:studentId` (Gestão) → 204.
- `GET /classes` (existente) passa a incluir `teachers: [{ id, name }]` em cada turma.

## Usuários
- `POST /users` (Gestão) `{ name, email, password, role (ADMIN|PROFESSOR|ALUNO|RESPONSAVEL), phone?, guardianId? }` → cria na academia do token. → usuário sem senha.
- `GET /users/:id` (Staff, ou o próprio) → usuário + `academy {id,name}` + `dependents [{id,name,beltColor,beltDegree}]` + `subscription` atual (ou null).
- `PUT /users/:id` (Gestão, ou o próprio só `name`/`phone`) `{ name?, phone?, role?, guardianId? }` → usuário.
- `PATCH /users/:id/block` (Gestão) `{ isBlocked }` → usuário.
- `GET /users/me/dependents` (RESPONSAVEL) → `[{ id, name, beltColor, beltDegree }]`.
- Responsável pode ler `/progression/student/:id`, `/evaluation/student/:id` e `/attendance/history/:id` dos seus dependentes.

## Check-in
- `POST /attendance` (existente): se já houver presença do aluno na mesma turma no mesmo dia → 409 `{ error: "Presença já registrada hoje" }`.

## Login
- `POST /auth/login` (existente) resposta inalterada.
