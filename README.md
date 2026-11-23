<div align="center">

# 🎟️ EventFlow App

### Event-Driven Ticketing Platform Built with NestJS Microservices

**A scalable, distributed backend built with NestJS, Apache Kafka, PostgreSQL, Drizzle ORM, Redis, Swagger, and Jest.**

![NestJS](https://img.shields.io/badge/NestJS_12-TypeScript-E0234E?logo=nestjs&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Driven-231F20?logo=apachekafka&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-Database-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logoColor=black)
![Redis](https://img.shields.io/badge/Redis_7-Caching_%26_Rate_Limiting-DC382D?logo=redis&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_Bearer_Auth-85EA2D?logo=swagger&logoColor=black)
![Jest](https://img.shields.io/badge/Jest-146_Tests_Passing-C21325?logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

**Status:** 🚀 Core Microservices, Event Streaming, Security Hardening & Full Unit Test Suite Complete

[Architecture](#️-system-architecture) •
[Backend Flows](#-how-the-backend-works-step-by-step) •
[Database ERD](#️-database-schema-erd) •
[Visual UI & Dashboards](#️-visual-ui--local-dashboards) •
[API Reference](#-api-endpoints-via-api-gateway) •
[Testing Chart](#-testing--coverage-chart) •
[Quick Start](#-getting-started)

</div>

---

## 📖 Overview

**EventFlow App** is an event-driven microservices platform for managing authentication, events, transactional ticket purchasing/check-in, and asynchronous email notifications.

Responsibilities are separated into 5 independent NestJS applications communicating **synchronously** through an **API Gateway** and **asynchronously** via **Apache Kafka**, backed by **PostgreSQL + Drizzle ORM**, **Redis**, **MailHog**, and 3 shared monorepo libraries (`@app/common`, `@app/database`, `@app/kafka`).

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        Browser["Web / Mobile Client"]
        SwaggerUI["Swagger UI (:3000/docs)"]
    end

    subgraph Edge["API Gateway (:3000)"]
        SecMW["CORS + Security Headers"]
        ValPipe["Global ValidationPipe"]
        JwtGuard["Passport JWT AuthGuard"]
        Router["Gateway Controllers & HTTP Proxy"]
        SecMW --> ValPipe --> JwtGuard --> Router
    end

    subgraph Services["Internal Microservices"]
        Auth["Auth Service (:3001)"]
        Events["Events Service (:3003)"]
        Tickets["Tickets Service (:3004)"]
        Notif["Notifications Service (:3006)"]
    end

    subgraph Messaging["Event Streaming Backbone"]
        ZK["Zookeeper (:2181)"]
        Kafka[("Apache Kafka (:9092)")]
        KafkaUI["Kafka UI (:8080)"]
        ZK --- Kafka
        Kafka --- KafkaUI
    end

    subgraph DataInfra["Data & Local Infrastructure"]
        PG[("PostgreSQL 17 (:5432)")]
        PgAdmin["pgAdmin 4 (:5050)"]
        Redis[("Redis 7 (:6379)")]
        MailHog["MailHog SMTP (:1025) & Inbox (:8025)"]
        PG --- PgAdmin
    end

    subgraph Libs["Shared Monorepo Libraries"]
        Common["@app/common (DTOs, Ports, Types)"]
        DBLib["@app/database (Drizzle Schemas)"]
        KafkaLib["@app/kafka (Dynamic Module, Topics)"]
    end

    Browser --> SecMW
    SwaggerUI --> SecMW

    Router -->|"POST /register, /login, GET /profile"| Auth
    Router -->|"Verified x-user-id & x-user-role"| Events
    Router -->|"Verified x-user-id"| Tickets

    Auth --> PG
    Events --> PG
    Tickets --> PG

    Auth -->|"user-registered, user-logged-in"| Kafka
    Events -->|"event-created, event-updated, event-published, event-canceled"| Kafka
    Tickets -->|"ticket-purchased, ticket-cancelled, ticket-checked-in"| Kafka

    Kafka -->|"Consumer Group"| Notif
    Notif -->|"Nodemailer HTML Emails"| MailHog

    Libs -.-> Edge
    Libs -.-> Services
```

---

## 🔄 How the Backend Works (Step-by-Step)

### 1. Request Security Pipeline (Inside API Gateway)

Every incoming HTTP request passes through a strict pipeline before touching any internal microservice:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Incoming HTTP Request  (e.g. POST /tickets/purchase)                        │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  1. Security Headers & CORS           │ X-Frame-Options: DENY, nosniff, CORS │
│  2. Global ValidationPipe             │ whitelist + transform + forbidExtra  │
│  3. AuthGuard('jwt') + JwtStrategy    │ Verifies Bearer JWT signature & exp  │
│  4. Identity Extraction (req.user)    │ Reads trusted userId & role from JWT │
│  5. Internal HTTP Proxy (Axios)       │ Injects x-user-id / x-user-role      │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Internal Microservice (:3001 / :3003 / :3004)  ──►  PostgreSQL + Kafka      │
└──────────────────────────────────────────────────────────────────────────────┘
```

> Clients **cannot spoof** `x-user-id` or `x-user-role` headers at the gateway — protected routes strictly read `req.user` from the verified JWT.

---

### 2. User Registration & Welcome Email Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant GW as API Gateway (:3000)
    participant Auth as Auth Service (:3001)
    participant PG as PostgreSQL (:5432)
    participant Kafka as Apache Kafka (:9092)
    participant Notif as Notifications Service (:3006)
    participant Mail as MailHog (:1025 / :8025)

    User->>GW: POST /auth/register { email, password, name }
    GW->>GW: Validate RegisterDTO
    GW->>Auth: POST /register
    Auth->>PG: SELECT user WHERE email = ?
    alt Email already exists
        Auth-->>GW: 409 Conflict
        GW-->>User: 409 User already exists
    else New user
        Auth->>Auth: bcrypt.hash(password, 10)
        Auth->>PG: INSERT INTO users RETURNING *
        PG-->>Auth: New User (UUID)
        Auth-)Kafka: Emit topic "user-registered" { userId, email, name }
        Auth-->>GW: 201 { message, userId }
        GW-->>User: 201 Created
        Kafka->>Notif: Consume "user-registered"
        Notif->>Mail: SMTP Send "Welcome to EventFlow" HTML email
        Note over Mail: Visible in MailHog UI at localhost:8025
    end
```

---

### 3. Transactional Ticket Purchase Flow (Race-Condition Safe)

When multiple users attempt to buy the last remaining tickets simultaneously, the Tickets Service uses a **PostgreSQL Transaction with Row-Level Locking (`SELECT ... FOR UPDATE`)** to guarantee zero overselling:

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant GW as API Gateway (:3000)
    participant Tkt as Tickets Service (:3004)
    participant PG as PostgreSQL (:5432)
    participant Kafka as Apache Kafka (:9092)
    participant Notif as Notifications Service (:3006)
    participant Mail as MailHog (:1025)

    Buyer->>GW: POST /tickets/purchase (Authorization: Bearer JWT)
    GW->>GW: Verify JWT -> extract req.user.userId
    GW->>Tkt: POST /purchase + header x-user-id
    Tkt->>PG: BEGIN TRANSACTION
    Tkt->>PG: SELECT * FROM events WHERE id = ? FOR UPDATE (Row Lock)
    alt Event missing or not PUBLISHED
        Tkt->>PG: ROLLBACK
        Tkt-->>GW: 404 / 400 Error
        GW-->>Buyer: Error response
    else Event PUBLISHED
        Tkt->>PG: SELECT COALESCE(SUM(quantity), 0) FROM tickets WHERE status = CONFIRMED
        alt quantity > remaining capacity
            Tkt->>PG: ROLLBACK
            Tkt-->>GW: 400 Only X tickets remaining
            GW-->>Buyer: 400 Bad Request
        else Tickets available
            Tkt->>Tkt: Generate 12-char hex ticketCode & compute totalPrice
            Tkt->>PG: INSERT INTO tickets (status = CONFIRMED)
            Tkt->>PG: SELECT email FROM users WHERE id = userId
            Tkt->>PG: COMMIT
            Tkt-)Kafka: Emit "ticket-purchased" { ticketId, ticketCode, eventTitle, email, quantity, totalPrice }
            Tkt-->>GW: 201 { message, ticket, remainingTickets }
            GW-->>Buyer: 201 Tickets purchased successfully
            Kafka->>Notif: Consume "ticket-purchased"
            Notif->>Mail: SMTP Send Confirmation Email with Ticket Code
        end
    end
```

---

### 4. Domain Lifecycle State Machines

#### Event Lifecycle (`events.status`)
```mermaid
stateDiagram-v2
    [*] --> DRAFT : POST /events (Organizer)
    DRAFT --> DRAFT : PATCH /events/:id (Organizer / Admin)
    DRAFT --> PUBLISHED : PATCH /events/:id/publish -> Kafka "event-published"
    PUBLISHED --> PUBLISHED : PATCH /events/:id (Organizer / Admin)
    DRAFT --> CANCELED : PATCH /events/:id/cancel -> Kafka "event-canceled"
    PUBLISHED --> CANCELED : PATCH /events/:id/cancel -> Kafka "event-canceled"
    CANCELED --> [*]
```

#### Ticket Lifecycle (`tickets.status`)
```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : POST /tickets/purchase (Tx + FOR UPDATE) -> Kafka "ticket-purchased"
    CONFIRMED --> CHECKED_IN : POST /tickets/check-in (Organizer only) -> Kafka "ticket-checked-in"
    CONFIRMED --> CANCELLED : PATCH /tickets/:id/cancel (Owner only) -> Kafka "ticket-cancelled"
    CHECKED_IN --> [*] : Cannot be cancelled once checked in
    CANCELLED --> [*] : Cannot be checked in or cancelled again
```

---

## 🗄️ Database Schema (ERD)

Managed with **Drizzle ORM** in [`libs/database/src/schema/`](libs/database/src/schema):

```mermaid
erDiagram
    USERS ||--o{ EVENTS : "organizes (organizer_id)"
    USERS ||--o{ TICKETS : "purchases (userId)"
    EVENTS ||--o{ TICKETS : "has (event_id)"

    USERS {
        uuid id PK
        varchar email UK "not null"
        varchar password "bcrypt hash"
        varchar name "not null"
        role_enum role "admin | user | ORGANIZER"
        timestamp created_at
        timestamp updated_at
    }

    EVENTS {
        uuid id PK
        varchar title "not null"
        text description
        timestamp date "not null"
        varchar location "not null"
        integer capacity "not null"
        integer price "default 0"
        events_status status "DRAFT | PUBLISHED | CANCELED"
        uuid organizer_id FK "references users.id"
        timestamp create_at
        timestamp update_at
    }

    TICKETS {
        uuid id PK
        uuid event_id FK "references events.id"
        uuid userId FK "references users.id"
        integer quantity "default 1"
        integer total_price "not null"
        ticket_status status "PENDING | CONFIRMED | CHECKED_IN | CANCELLED"
        varchar ticket_code UK "12-char hex"
        timestamp purchased_at
        timestamp checked_in_at
        timestamp create_at
        timestamp update_at
    }
```

---

## 🖥️ Visual UI & Local Dashboards

When running locally, EventFlow provides **4 interactive web UIs** to test and observe every single layer in real time:

| Dashboard | Local URL | What You Can Inspect |
| --- | --- | --- |
| 📘 **API Gateway Swagger UI** | [http://localhost:3000/docs](http://localhost:3000/docs) | Interactive OpenAPI testing with **Authorize 🔒 (Bearer JWT)** across Auth, Events & Tickets |
| 📊 **Kafka UI** | [http://localhost:8080](http://localhost:8080) | Live Kafka brokers, topics (`user-registered`, `event-*`, `ticket-*`), JSON message payloads & consumer lag |
| 📬 **MailHog Web Inbox** | [http://localhost:8025](http://localhost:8025) | Rendered HTML welcome, ticket confirmation & cancellation emails sent via SMTP `:1025` |
| 🐘 **pgAdmin 4** | [http://localhost:5050](http://localhost:5050) | PostgreSQL 17 tables (`users`, `events`, `tickets`), constraints & SQL queries |

<details>
<summary><strong>🔍 Preview: What Happens Across the UIs During a Full Flow (Click to expand)</strong></summary>

```text
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  1. Swagger UI (:3000/docs) │    │  2. Terminal (start:all)    │
│  ┌───────────────────────┐  │    │  [api-gateway        ] 3000 │
│  │ POST /auth/register   │  │───►│  [auth-service       ] 3001 │
│  │ POST /auth/login      │  │    │  [events-service     ] 3003 │
│  │ [🔒 Authorize: JWT]   │  │    │  [tickets-service    ] 3004 │
│  │ POST /events          │  │    │  [notifications-serv.] 3006 │
│  │ POST /tickets/purchase│  │    │  -> Received Kafka Event!   │
│  └───────────────────────┘  │    └──────────────┬──────────────┘
└─────────────────────────────┘                   │
                                                  ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  4. MailHog Inbox (:8025)   │    │  3. Kafka UI (:8080)        │
│  ┌───────────────────────┐  │    │  Topics:                    │
│  │ 🎉 Welcome to EventFlow│ ◄────│  • user-registered     [1]  │
│  │ 🎉 Ticket Confirmed!  │  │    │  • event-published     [1]  │
│  │   Code: A1B2C3D4E5F6  │  │    │  • ticket-purchased    [1]  │
│  │   Total: $100.00      │  │    │  • ticket-checked-in   [1]  │
│  └───────────────────────┘  │    └─────────────────────────────┘
└─────────────────────────────┘
```

</details>

---

## ✨ Services & Infrastructure Ports

| Service / Container | Port | Swagger / UI | Responsibilities |
| --- | --- | --- | --- |
| 🌐 **API Gateway** | `3000` | `http://localhost:3000/docs` | Single entry point, JWT auth, routing, CORS, security headers |
| 🔐 **Auth Service** | `3001` | `http://localhost:3001/docs` | Registration (`bcrypt`), login, JWT signing, user profile, Kafka producer |
| 📅 **Events Service** | `3003` | `http://localhost:3003/docs` | Event CRUD, organizer/admin RBAC, publish & cancel lifecycle |
| 🎫 **Tickets Service** | `3004` | `http://localhost:3004/docs` | Transactional ticket purchase, cancellation, ticket code check-in |
| 🔔 **Notifications Service** | `3006` | `http://localhost:3006/docs` | Kafka consumer & Nodemailer HTML email notifications |
| 🐘 **PostgreSQL 17** | `5432` | `http://localhost:5050` (pgAdmin) | Relational database (`eventflow_db`) |
| ⚡ **Redis 7** | `6379` | — | Caching & rate limiting store |
| 📨 **Apache Kafka** | `9092` | `http://localhost:8080` (Kafka UI) | Event streaming broker (with Zookeeper on `:2181`) |
| 📬 **MailHog** | `1025` | `http://localhost:8025` | Local SMTP server & inbox viewer |

---

## 🔗 API Endpoints (via API Gateway)

<details open>
<summary><strong>🔐 Auth (<code>/auth</code>)</strong></summary>

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a new user & emit `user-registered` |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/auth/profile` | Bearer JWT | Get authenticated user profile |

</details>

<details open>
<summary><strong>📅 Events (<code>/events</code>)</strong></summary>

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/events` | Public | List all `PUBLISHED` events |
| `GET` | `/events/organizer/:organizerId` | Public | List events by organizer ID |
| `GET` | `/events/:id` | Public | Get single event details |
| `POST` | `/events` | Bearer JWT | Create a new draft event |
| `GET` | `/events/my-events` | Bearer JWT | Get events created by the authenticated user |
| `PATCH` | `/events/:id` | Bearer JWT | Update event (organizer or `admin`) |
| `PATCH` | `/events/:id/publish` | Bearer JWT | Publish event & emit `event-published` |
| `PATCH` | `/events/:id/cancel` | Bearer JWT | Cancel event & emit `event-canceled` |

</details>

<details open>
<summary><strong>🎫 Tickets (<code>/tickets</code>)</strong></summary>

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/tickets/purchase` | Bearer JWT | Purchase tickets (atomic transaction + `FOR UPDATE` lock) |
| `GET` | `/tickets/my-tickets` | Bearer JWT | List authenticated user's tickets |
| `GET` | `/tickets/event/:eventId` | Bearer JWT | List all tickets for an event (organizer only) |
| `POST` | `/tickets/check-in` | Bearer JWT | Check in a ticket by `ticketCode` (organizer only) |
| `GET` | `/tickets/:id` | Bearer JWT | Get single ticket owned by the user |
| `PATCH` | `/tickets/:id/cancel` | Bearer JWT | Cancel ticket (`status = CANCELLED`) & emit `ticket-cancelled` |

</details>

<details>
<summary><strong>🔔 Notifications Service Kafka Consumers (<code>:3006</code>)</strong></summary>

| Pattern / Route | Topic / Endpoint | Action |
| --- | --- | --- |
| `GET` | `/health` | Returns service health status |
| `@EventPattern` | `user-registered` | Sends welcome HTML email |
| `@EventPattern` | `ticket-purchased` | Sends ticket confirmation email with code & formatted price |
| `@EventPattern` | `ticket-cancelled` | Sends ticket cancellation notice |
| `@EventPattern` | `event-canceled` | Sends event cancellation notice to organizer |

</details>

---

## 🔒 Security & Production Hardening

- **JWT Verification at the Gateway:** Protected Event & Ticket routes enforce `@UseGuards(AuthGuard('jwt'))` and extract `userId`/`role` exclusively from `req.user` (preventing client-side `x-user-id` / `x-user-role` spoofing).
- **Fail-Fast Production Secrets:** Startup throws immediately if `JWT_SECRET` is unset when `NODE_ENV=production`.
- **Gateway Hardening:** CORS via `CORS_ORIGIN`, `x-powered-by` disabled, security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`), and Swagger disabled by default in `NODE_ENV=production`.
- **Concurrency Safety:** Ticket purchases run inside a PostgreSQL transaction with `.for('update')` row locking to prevent overselling.
- **Strict Input Validation:** Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`).
- **Environment-Driven Service Discovery:** Gateway uses `AUTH_SERVICE_URL`, `EVENTS_SERVICE_URL`, and `TICKETS_SERVICE_URL`.

---

## 🧪 Testing & Coverage Chart

The monorepo contains **21 unit test suites** with **146 passing unit tests** covering controllers, services, JWT strategies, Drizzle DB interactions, Kafka event emissions, Nodemailer email delivery, RBAC checks, and error propagation.

```mermaid
xychart-beta
    title "Unit Tests Distribution Across EventFlow Monorepo (Total: 146 Tests)"
    x-axis ["api-gateway", "tickets-svc", "events-svc", "notif-svc", "auth-svc", "shared-libs"]
    y-axis "Passing Unit Tests" 0 --> 60
    bar [53, 29, 24, 20, 17, 3]
```

| Package | Test Suites | Passing Tests | What Is Covered |
| --- | :---: | :---: | --- |
| `apps/api-gateway` | 8 | **53** | App, Auth/Events/Tickets controllers & HTTP proxies, JWT strategy, 503 & downstream error handling |
| `apps/tickets-service` | 2 | **29** | Transactional purchase, capacity limits, check-in, cancel guards, organizer RBAC, Kafka emits |
| `apps/events-service` | 2 | **24** | Event CRUD, publish/cancel lifecycle, organizer & lowercase `admin` RBAC, Kafka emits |
| `apps/notifications-service` | 3 | **20** | Kafka `@EventPattern` handlers, HTML escaping, missing-email guards, Nodemailer MailHog & TLS config |
| `apps/auth-service` | 3 | **17** | Register (`bcrypt`), conflict check, login, JWT signing, profile lookup, Kafka init & fallback |
| `libs/*` (`common`, `database`, `kafka`) | 3 | **3** | Shared library service initialization |
| **Total** | **21** | **146** | **100% passing + 0 TypeScript errors (`tsc -b --noEmit`)** |

```bash
# Run all unit tests
pnpm test

# Run tests with coverage report
pnpm test:cov

# Type-check all apps, libraries, and *.spec.ts files
npx tsc -b --noEmit
```

---

## 📁 Project Structure

```text
eventsflow-app/
├── apps/
│   ├── api-gateway/              # Port 3000 — HTTP gateway, JWT auth, Swagger, routing
│   ├── auth-service/             # Port 3001 — Users, bcrypt, JWT signing, Kafka producer
│   ├── events-service/           # Port 3003 — Events CRUD & lifecycle, Kafka producer
│   ├── tickets-service/          # Port 3004 — Transactional ticketing & check-in, Kafka producer
│   └── notifications-service/    # Port 3006 — Kafka consumer & Nodemailer email service
├── libs/
│   ├── common/                   # Shared DTOs, response interfaces, service port constants
│   ├── database/                 # Drizzle PostgreSQL client & schemas (users, events, tickets)
│   └── kafka/                    # Dynamic KafkaModule & topic constants
├── scripts/
│   └── start-all.js              # Cross-platform multi-service runner (dev / build / prod)
├── docker-compose.yml            # PostgreSQL 17, pgAdmin, Redis, Zookeeper, Kafka, Kafka UI, MailHog
├── drizzle.config.ts             # Drizzle ORM PostgreSQL config
├── jest.config.ts                # Jest config with tsconfig path mapping
├── tsconfig.json                 # Solution-style TS config
├── tsconfig.spec.json            # Dedicated TS config for *.spec.ts & test files
├── .env.example                  # Environment variable keys template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20+ LTS)
- **pnpm**
- **Docker** & **Docker Compose**

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, KAFKA_BROKER=localhost:9092, SMTP_HOST=localhost, SMTP_PORT=1025, etc.
```

### 3. Start Local Infrastructure (PostgreSQL, pgAdmin, Redis, Kafka, Kafka UI, MailHog)
```bash
pnpm run docker:up
```

### 4. Push Database Schema
```bash
pnpm run db:push
```

### 5. Run All Microservices
Start all 5 apps in parallel with colored logs in a single command:
```bash
pnpm run start:all
```

Or run them individually:
```bash
pnpm run start:gateway
pnpm run start:auth
pnpm run start:events
pnpm run start:tickets
pnpm run start:notifications
```

Build & start all apps in production mode:
```bash
pnpm run build:all
pnpm run start:all:prod
```

---

## 🗺️ Roadmap

- [x] Initialize NestJS monorepo workspace and shared libraries (`@app/common`, `@app/database`, `@app/kafka`)
- [x] Configure PostgreSQL 17 and Drizzle ORM schemas (`users`, `events`, `tickets`)
- [x] Set up Docker Compose stack (PostgreSQL, pgAdmin, Redis, Zookeeper, Kafka, Kafka UI, MailHog)
- [x] Build Auth Service (register, login, profile, JWT, bcrypt, Kafka events)
- [x] Build Events Service (CRUD, publish/cancel lifecycle, organizer & admin RBAC)
- [x] Build Tickets Service (transactional purchase with `FOR UPDATE` row lock, cancellation, check-in)
- [x] Build Notifications Service (Kafka consumers + HTML email delivery via Nodemailer/MailHog)
- [x] Build API Gateway with JWT guards, Swagger OpenAPI + Bearer Auth, CORS, and security headers
- [x] Add single-command multi-service runner (`pnpm run start:all`, `build:all`, `start:all:prod`)
- [x] Add comprehensive unit test coverage across all services & libraries (21 suites / 146 tests)
- [x] Configure dedicated `tsconfig.spec.json` for IDE & CLI test type-checking
- [ ] Wire Redis-backed rate limiting (`@nestjs/throttler`) in API Gateway
- [ ] Add production `Dockerfile`s and `docker-compose.prod.yml`
- [ ] Add end-to-end (E2E) integration tests against live Postgres & Kafka
- [ ] Explore optional Next.js frontend (Pro scope)

---

## 🤝 Contributing

Ideas, bug reports, and contributions are welcome. Please open an issue to discuss substantial changes before submitting a pull request.

---

<div align="center">

**Built to explore practical, scalable, event-driven backend architecture.** 🚀

</div>
