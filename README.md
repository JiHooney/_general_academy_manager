# General Academic Manager (GAM)

> **Global scheduling service for teachers and students** — monorepo with Web (Next.js), Mobile (Expo), and API (NestJS + Prisma + PostgreSQL + Redis).

---

## Architecture

```
_general_academic_manager/
├── apps/
│   ├── api/          # NestJS 10 + Prisma 5 — REST API (port 4000)
│   ├── web/          # Next.js 14 App Router — Web client (port 3000)
│   └── mobile/       # Expo 51 + Expo Router — iOS & Android client
├── packages/
│   ├── shared/       # TypeScript types, Zod schemas, constants
│   └── i18n/         # Locale JSON files (en, ko, ja, zh-Hant, zh-Hans, fr)
├── docker-compose.yml
└── turbo.json
```

**Stack:**
| Layer | Technology |
|---|---|
| API | NestJS 10, Prisma 5, JWT (access 15m / refresh 7d) |
| Database | PostgreSQL 15 (Docker) |
| Queue | Redis 7 + BullMQ (Docker) |
| Web | Next.js 14, Tailwind CSS, React Query v5, next-intl |
| Mobile | Expo 51, Expo Router 3.5, expo-secure-store |
| Monorepo | pnpm workspaces + Turborepo 2 |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm i -g pnpm`
- **Docker Desktop** (for Postgres + Redis)

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone https://github.com/JiHooney/_general_academy_manager.git
cd _general_academic_manager
pnpm install
```

### 2. Configure environment variables

```bash
# Root docker env
cp .env.example .env

# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Edit each `.env` file and fill in secrets (JWT secrets, etc.).

### 3. Start Docker services (Postgres + Redis)

```bash
pnpm db:up
# Runs: docker compose up -d
```

### 4. Run database migrations

```bash
pnpm db:migrate
# Runs: pnpm --filter @gam/api prisma migrate dev
```

### 5. Seed the database

```bash
pnpm db:seed
```

This creates:

| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@example.com` | `Password123!` |
| Student | `student@example.com` | `Password123!` |

Also creates: **Demo Academy** org → **Main Studio** → **English 101** classroom (Asia/Seoul timezone) and a 30-day invite code.

### 6. Start all apps in parallel

```bash
pnpm dev
```

| Service | URL |
|---|---|
| API | http://localhost:4000 |
| Swagger / API Docs | http://localhost:4000/docs |
| Web | http://localhost:3000 |
| Mobile | Expo Dev Client (scan QR) |

---

## Individual App Commands

```bash
# Start only the API
pnpm --filter @gam/api dev

# Start only the Web app
pnpm --filter @gam/web dev

# Start only the Mobile app
pnpm --filter @gam/mobile dev

# Open Prisma Studio (DB browser)
pnpm db:studio

# Build all apps
pnpm build
```

---

## Key Features

- **Auth** — JWT httpOnly cookies (web) + Bearer token via SecureStore (mobile), refresh rotation
- **RBAC** — Per-classroom roles: `admin`, `teacher`, `student`
- **Booking & Conflict Detection** — Booking requests with `$transaction`-level overlap check; returns `409 schedule.conflict` on conflict
- **Invite Codes** — Random 8-char hex codes with expiry, max-uses, revoke
- **Calendar** — Month-view calendar (web) and event list (mobile); teacher availability recommendation
- **Notifications** — DB-backed inbox + BullMQ queue for async/push delivery
- **Support Tickets** — Basic classroom-scoped support ticket system
- **i18n** — 6 locales: English, Korean, Japanese, Traditional Chinese, Simplified Chinese, French

---

## API Overview

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/signup` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` `GET /auth/me` |
| Studios | `POST /studios` `GET /studios` `GET /studios/:id` |
| Classrooms | `POST /studios/:id/classrooms` `GET /classrooms` `GET /classrooms/:id` `GET /classrooms/:id/teachers` |
| Invites | `POST /classrooms/:id/invites` `POST /invites/join` `POST /classrooms/:id/invites/:inviteId/revoke` |
| Calendar | `GET /classrooms/:id/calendar` `POST /classrooms/:id/teachers/recommend` |
| Requests | `POST /classrooms/:id/requests` `PATCH /requests/:id/accept` `PATCH /requests/:id/reject` `PATCH /requests/:id/cancel` |
| Appointments | `PATCH /appointments/:id` `DELETE /appointments/:id` |
| Notifications | `GET /notifications` `POST /notifications/:id/read` |
| Tickets | `POST /classrooms/:id/tickets` `GET /classrooms/:id/tickets` `PATCH /tickets/:id` |

Full interactive docs at **http://localhost:4000/docs** (Swagger UI).

---

## Troubleshooting

**Docker not running:**
```bash
docker ps   # ensure Docker Desktop is running
pnpm db:up
```

**Port already in use:**
- API default port: `4000` — change via `PORT` in `apps/api/.env`
- Web default port: `3000` — passes through Next.js

**pnpm version mismatch:**
```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
```

**Prisma client out of sync:**
```bash
pnpm --filter @gam/api exec prisma generate
```

**Reset database (drops all data):**
```bash
pnpm --filter @gam/api exec prisma migrate reset
```

---

## License

MIT

## Author

JiHooney

간단한 학사 관리 프로젝트 템플릿입니다.

## 설명

이 저장소는 개인 학사(일정, 과제, 성적 등) 관리를 위한 기본 구조를 담습니다.

## 빠른 시작

필수: `git`이 설치되어 있어야 합니다.

1. 로컬에서 변경사항을 커밋하려면:

```bash
git add README.md
git commit -m "Add README"
```

2. 원격(`origin`)에 `main` 브랜치로 푸시:

```bash
# 이미 원격을 추가했다면
git branch -M main
git push -u origin main

# 만약 처음 커밋이 없다면 전체 파일을 커밋합니다
git add .
git commit -m "Initial commit"
git push -u origin main
```

## 구조 (예시)

- `README.md` : 프로젝트 소개
- `docs/` : 문서
- `src/` : 소스 코드

## 라이선스

원하시는 라이선스를 선택해 추가하세요.

## 작성자

JiHooney
