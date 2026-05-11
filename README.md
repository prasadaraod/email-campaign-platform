# 📧 Email Campaign Platform

A production-grade email campaign platform built with Node.js, Express,
PostgreSQL, BullMQ, and SendGrid.

## Tech Stack

- **Runtime** — Node.js + TypeScript
- **Framework** — Express.js
- **Database** — PostgreSQL 16 (Docker)
- **Queue** — BullMQ + Redis (Docker)
- **Email** — SendGrid
- **Auth** — JWT
- **Validation** — Zod

---

## Prerequisites

- [Node.js v18+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/prasadaraod/email-campaign-platform.git
cd email-campaign-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Update `.env` with your values — especially `SENDGRID_API_KEY` and
`EMAIL_FROM`.

### 4. Start Docker services

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 5. Run migrations + seed

```bash
npm run migrate
npm run seed
```

Default credentials after seeding:
- **Email** — `prasad@example.com`
- **Password** — `password123`

### 6. Start the API server

```bash
npm run dev
```

### 7. Start the workers (open a second terminal)

```bash
npm run worker
```

---

## NPM Scripts

```bash
npm run dev              # Start API server in development mode
npm run worker           # Start BullMQ workers
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start compiled production server

# Quick recovery after accidental data loss
npm run migrate && npm run seed
```

---

## Docker Commands

```bash
# Start all services
docker compose -f docker/docker-compose.yml up -d

# Check all running containers
docker compose -f docker/docker-compose.yml ps

# View logs for a specific service
docker compose -f docker/docker-compose.yml logs postgres
docker compose -f docker/docker-compose.yml logs redis

# Restart a single service
docker compose -f docker/docker-compose.yml restart postgres

# ✅ SAFE — stops containers, all data is preserved
docker compose -f docker/docker-compose.yml stop

# ✅ SAFE — removes containers, volumes and data are preserved
docker compose -f docker/docker-compose.yml down

# ❌ DANGER — removes containers AND volumes (all data wiped)
docker compose -f docker/docker-compose.yml down -v
```

---

## Database Commands

```bash
# Connect to PostgreSQL inside Docker
docker exec -it campaign_postgres psql -U campaign_user -d campaign_db
```

Once inside the psql prompt:

```sql
\dt             -- list all tables
\d users        -- describe the users table
\d campaigns    -- describe the campaigns table
SELECT * FROM users;
\q              -- exit psql
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Contacts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/contacts` | Create contact | ✅ |
| GET | `/api/contacts` | List contacts (paginated) | ✅ |
| GET | `/api/contacts/:id` | Get single contact | ✅ |
| PUT | `/api/contacts/:id` | Update contact | ✅ |
| DELETE | `/api/contacts/:id` | Unsubscribe contact | ✅ |
| POST | `/api/contacts/import` | Bulk import contacts | ✅ |

### Campaigns

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/campaigns` | Create campaign | ✅ |
| GET | `/api/campaigns` | List all campaigns | ✅ |
| GET | `/api/campaigns/:id` | Get single campaign | ✅ |
| PUT | `/api/campaigns/:id` | Update campaign | ✅ |
| POST | `/api/campaigns/:id/send` | Launch campaign | ✅ |
| GET | `/api/campaigns/:id/stats` | Get campaign stats | ✅ |

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| API Server | http://localhost:3000 | Main REST API |
| Health Check | http://localhost:3000/health | Server status |
| Redis UI | http://localhost:8081 | BullMQ queue monitor |
| PostgreSQL | localhost:5432 | Database |

---

## Project Structure

```
src/
├── api/
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── routes/             # Express route definitions
│   └── validators/         # Zod schemas
├── config/                 # DB, Redis, SendGrid configuration
├── db/
│   ├── migrations/         # SQL migration files
│   └── seed.ts             # Database seeder
├── services/               # Business logic layer
├── workers/
│   ├── processors/         # BullMQ job processors
│   └── queues/             # Queue definitions
└── utils/                  # Logger, error classes, helpers
```

---

## License

ISC