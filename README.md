# Club do Rafa

Sistema web para gestao de barbearia com areas de cliente, profissional e gestor/admin.

## Tecnologias

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Hook Form e Zod
- Backend: Node.js, Express, TypeScript, Prisma ORM e PostgreSQL

## Instalar o frontend

```bash
cd frontend
npm install
```

Crie o arquivo `frontend/.env` a partir do exemplo:

```bash
cp .env.example .env
```

Exemplo:

```env
VITE_API_URL="http://localhost:3333/api"
```

Para iniciar:

```bash
npm run dev
```

O frontend abre em `http://localhost:5173`.

## Instalar o backend

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env` a partir do exemplo:

```bash
cp .env.example .env
```

Exemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/club_do_rafa?schema=public"
JWT_SECRET="troque-essa-chave"
PORT=3333
FRONTEND_URL="http://localhost:5173"
```

## Configurar PostgreSQL

Instale e inicie o PostgreSQL localmente. Ajuste usuario, senha, host e porta no `DATABASE_URL`.

Para criar o banco configurado no `.env`:

```bash
cd backend
npm run db:create
```

## Rodar migrations

Em desenvolvimento:

```bash
cd backend
npm run prisma:migrate
```

Para aplicar migrations ja criadas:

```bash
cd backend
npx prisma migrate deploy
```

Gere o client Prisma quando necessario:

```bash
npm run prisma:generate
```

## Rodar seed

```bash
cd backend
npm run prisma:seed
```

Login padrao admin:

- Email: `admin@clubdorafa.com`
- Senha: `123456`

Logins de teste:

- Cliente: `lucas.lima@email.com` / `123456`
- Barbeiro Rafael: `rafael@clubdorafa.com` / `123456`
- Barbeiro Samuca: `samuca@clubdorafa.com` / `123456`

## Iniciar backend

```bash
cd backend
npm run dev
```

A API fica disponivel em `http://localhost:3333` e `http://localhost:3333/api`.

## Rotas principais

Frontend:

- `/`: pagina publica
- `/login`: login
- `/cadastro`: cadastro de cliente
- `/cliente`: area do cliente
- `/colaborador`: area do profissional
- `/admin`: painel do gestor/admin
- `/perfil`: perfil do cliente
- `/premios`: premios do clube
- `/pagamento/:appointmentId`: pagamento de agendamento

API:

- `POST /api/auth/register`: cadastro de cliente
- `POST /api/auth/login`: login
- `GET /api/auth/me`: usuario autenticado
- `/api/users`: usuarios, protegido; gestao completa apenas admin
- `/api/services`: servicos
- `/api/professionals`: profissionais
- `/api/products`: estoque
- `/api/plans`: planos
- `/api/rewards`: premios
- `/api/appointments`: agendamentos
- `/api/payments`: pagamentos
- `/api/reward-redemptions`: resgates de premios

Envie o token JWT nas rotas protegidas:

```http
Authorization: Bearer <token>
```

## Regras de acesso

- Cliente acessa `/cliente`, `/perfil`, `/premios` e pagamentos dos seus agendamentos.
- Profissional acessa `/colaborador` e ve apenas a propria agenda.
- Admin acessa `/admin` e gerencia agenda, financeiro, catalogo, marketing e equipe.
- Usuarios sem login sao redirecionados para `/login`.
- Usuarios com role errada sao redirecionados para a area correta.
