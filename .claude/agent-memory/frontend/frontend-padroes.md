---
name: frontend-padroes
description: Padrões de UI/estado do app RollFlow (Expo) criados na fase "App"
metadata:
  type: project
---

- Feedback: use `notify.error/success/info`, `confirmAction()` e `apiError()` de `src/utils/notify.ts` (nunca `Alert.alert`, trava na web). Host montado em `_layout.tsx` (`components/Feedback.tsx`).
- UI compartilhada em `src/components/ui.tsx` (Screen, Header, Button, Field, Chip, Badge, Loading, ErrorState, Empty, cardStyle). Formatação em `src/utils/format.ts`.
- Sessão persistida em `store/authStore.ts` (flag `hydrated`); guarda de rota no `_layout.tsx`. Helpers `isManagement`/`isStaff`.
- Abas por papel via `href: null` no `_layout`; telas escondidas: login, checkin, progression, student/[id].
- Cores só de `theme/colors.ts`; textos PT-BR; detalhe de turma é painel expansível em classes.tsx.
