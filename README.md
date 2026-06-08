# RollFlow

Plataforma SaaS Premium para Gestão de Academias e Artes Marciais.

## Estrutura do Projeto

- `/backend`: API REST em Node.js (Express, Prisma, PostgreSQL).
- `/frontend`: Aplicativo multiplataforma (Web, Android, iOS) usando Expo Router e React Native.

## Tecnologias

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL, JWT Auth, Docker.
- **Frontend**: React Native, Expo, Zustand, Axios.

## Como Rodar

### 1. Iniciar Serviços com Docker (Recomendado)

O projeto possui um arquivo `docker-compose.yml` na raiz que sobe tanto o **Banco de Dados (PostgreSQL)** quanto o **Backend (Node.js)** automaticamente.

```bash
docker-compose up -d --build
```
Isso iniciará:
- Banco de Dados na porta local `5433` (internamente 5432).
- Servidor Backend na porta `3333`.

### 2. Sincronizar o Banco de Dados

Para garantir que a base de dados tenha as tabelas atualizadas, rode:

```bash
cd backend
npx prisma db push
```

### 3. Rodar o App (Frontend)

Em um terminal separado, inicie o servidor Expo para Web ou Mobile:

```bash
cd frontend
npm install
npm run web
```
Acesse no navegador: `http://localhost:8081`

### Funcionalidades Implementadas
- Gestão de Academias (Multi-tenant).
- Controle de Usuários (Master, Admin, Aluno).
- Gestão Financeira, Assinaturas e Inadimplência.
- Check-in automatizado com bloqueio de catraca/presença para devedores.
- Feed e Comunidade da academia.
