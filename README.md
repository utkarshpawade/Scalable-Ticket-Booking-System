# Scalable Ticket Booking Platform

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-1.25-009639?logo=nginx&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

> A microservices-based movie and ticket booking platform built with Node.js, Python, Next.js, and Docker Compose. Handles concurrent seat reservations at scale through distributed Redis seat-locking, an orchestration-based Saga pattern for atomic bookings, and asynchronous message-driven workflows via RabbitMQ.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Microservices Breakdown](#microservices-breakdown)
  - [User Service](#1-user-service)
  - [Catalog Service](#2-catalog-service)
  - [Seat Service](#3-seat-service)
  - [Booking Service](#4-booking-service)
  - [Recommendation Service](#5-recommendation-service)
- [Data Flow Diagrams](#data-flow-diagrams)
  - [User Login](#user-login-flow)
  - [Browse Events with Cache](#browse-events-cache-flow)
  - [Seat Hold](#seat-hold-flow)
  - [Booking Confirmation (Saga)](#booking-confirmation-saga-flow)
  - [Recommendation Generation](#recommendation-generation-flow)
  - [Failure & Rollback](#failurerollback-flow)
- [Class & Domain Diagrams](#class--domain-diagrams)
- [Database Schemas](#database-schemas)
- [Message Broker Design](#message-broker-rabbitmq-design)
- [API Gateway Routing](#api-gateway-nginx-routing)
- [Authentication & Authorization](#authentication--authorization)
- [Concurrency & Scaling Strategy](#concurrency--scaling-strategy)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Development (without Docker)](#local-development-without-docker)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

Traditional monolithic ticketing systems struggle with the thundering-herd problem: a popular concert goes on sale, thousands of users simultaneously attempt to book the same seats, and the database becomes a bottleneck—leading to oversold seats, stale reads, and degraded user experience.

This platform decouples the domain into five independently deployable microservices, each owning its data store and communicating via REST (synchronous) or RabbitMQ (asynchronous). The critical insight is that **seat availability is inherently a real-time, high-contention resource**: it lives in Redis, not a relational database, so lock/unlock operations are single-digit-millisecond atomic operations backed by Lua scripts. The relational database only sees a confirmed write *after* the seat is atomically secured.

**Why microservices here?**

| Concern | Monolith problem | Microservice solution |
|---|---|---|
| Seat contention | Row-level DB locks under heavy load | Redis atomic Lua-script locks, no DB pressure |
| Read-heavy catalog | App + DB tier scale together | Catalog service scales independently; Redis caches responses |
| Booking atomicity | Single-DB transaction | Orchestration Saga across services with compensation |
| ML recommendations | Blocked by JS runtime | Python/FastAPI service with pandas/numpy, fully isolated |
| Resilience | One bug takes down everything | Per-service fault boundaries |

---

## Key Features

- **JWT Authentication** — signup, login, token issuance and validation via user-service.
- **Event Catalog with Redis Caching** — movie listings with full-text search, genre filters, and paginated showtimes; Redis layer (60 s TTL) absorbs read traffic.
- **Real-Time Seat Availability** — Socket.io rooms per showtime broadcast `seat_status_changed` events to all connected clients instantly.
- **Distributed Seat Locking (Redis + TTL)** — all-or-nothing atomic seat acquisition using Lua scripts; 10-minute TTL auto-releases held seats on client abandonment.
- **Orchestration Saga for Booking** — booking-service orchestrates LOCK → PAY → CONFIRM steps with automatic compensation rollback and a 30-second recovery worker for stuck transactions.
- **Transactional Outbox** — events are written to the `outbox` table atomically with the booking row, guaranteeing at-least-once delivery without dual-write risk.
- **Idempotent Booking API** — client-supplied `idempotencyKey` prevents duplicate bookings on network retries.
- **Content-Based Recommendations** — Python service builds genre-preference vectors from user history and ranks unseen movies by cosine similarity.
- **Horizontal Scalability** — all backend services are stateless; Redis and PostgreSQL are the only stateful boundaries.
- **API Gateway with Rate Limiting** — Nginx front-proxies all traffic, applies per-IP rate limiting on booking endpoints (10 req/s, burst 20).

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14 | SSR/CSR React framework, page routing |
| React | 18 | Component model, concurrent rendering |
| TypeScript | 5.x | Type safety across components and API client |
| Tailwind CSS | 3.x | Utility-first styling |
| Axios | — | HTTP client with interceptors |
| Socket.io-client | 4.x | Real-time seat map updates |

### Backend

| Service | Language | Framework | Purpose |
|---|---|---|---|
| user-service | TypeScript | Express | Auth, JWT issuance, user profiles |
| catalog-service | TypeScript | Express | Movie & showtime CRUD, cached browsing |
| seat-service | TypeScript | Express + Socket.io | Seat lock/release, real-time broadcast |
| booking-service | TypeScript | Express | Saga orchestration, booking persistence |
| recommendation-service | Python | FastAPI | Content-based movie recommendations |

### Databases

| Store | Version | Used by | Why |
|---|---|---|---|
| PostgreSQL | 16 | user-service, booking-service | ACID transactions, complex relational queries, JSONB for saga state |
| MongoDB | 7 | catalog-service, recommendation-service | Flexible schema for movies/showtimes; document model matches catalog shape |
| Redis | 7 | seat-service (locks), catalog-service (cache) | Sub-millisecond atomic ops via Lua; TTL-native expiry for locks and cache |

### Infrastructure & DevOps

| Tool | Purpose |
|---|---|
| Docker Compose | Single-command full-stack orchestration |
| Nginx 1.25 | API gateway, reverse proxy, rate limiting, WebSocket upgrade |
| RabbitMQ 3.13 | Topic exchange for async events between seat and booking services |

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    Browser["Browser / Next.js\n(localhost:3000)"]

    subgraph Gateway["API Gateway"]
        Nginx["Nginx\n:8080"]
    end

    subgraph Services["Backend Microservices"]
        US["user-service\n:4001"]
        CS["catalog-service\n:4002"]
        SS["seat-service\n:4003"]
        BS["booking-service\n:4004"]
        RS["recommendation-service\n:4005"]
    end

    subgraph DataStores["Data Stores"]
        PG[("PostgreSQL\n:5432")]
        MG[("MongoDB\n:27017")]
        RD[("Redis\n:6379")]
        RMQ["RabbitMQ\n:5672 / :15672"]
    end

    Browser -->|"HTTP/WS"| Nginx
    Nginx -->|"/api/users/"| US
    Nginx -->|"/api/catalog/"| CS
    Nginx -->|"/api/seats/ + /socket.io/"| SS
    Nginx -->|"/api/bookings/ (rate-limited)"| BS
    Nginx -->|"/api/recommend/"| RS

    US --> PG
    BS --> PG

    CS --> MG
    RS --> MG

    CS -->|"read/write cache"| RD
    SS -->|"seat locks + sold flags"| RD

    SS -->|"seat.lock.succeeded/failed"| RMQ
    BS -->|"seat.lock.requested\nseat.release.requested\nbooking.confirmed"| RMQ
    RMQ -->|"commands"| SS
    RMQ -->|"replies + events"| BS

    Browser <-->|"Socket.io\nseat_status_changed"| SS
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| **Next.js Frontend** | Renders movie grid, interactive seat map, checkout panel. Connects to Socket.io for live seat updates. All API calls go through Nginx. |
| **Nginx API Gateway** | Single ingress point. Terminates client connections, proxies to the correct upstream, enforces rate limits, upgrades WebSocket connections. |
| **user-service** | Manages user accounts, password hashing (bcrypt), and JWT issuance. Acts as the identity authority—other services validate tokens directly. |
| **catalog-service** | Owns the `movies` and `showtimes` collections in MongoDB. Caches hot read paths in Redis. Exposes admin endpoints for ingesting content. |
| **seat-service** | The concurrency boundary. Owns all seat-lock state in Redis using atomic Lua scripts. Publishes seat events to RabbitMQ and broadcasts real-time updates via Socket.io. |
| **booking-service** | Orchestrates the booking Saga. Publishes commands to RabbitMQ, awaits RPC replies, persists state to PostgreSQL, and uses the transactional outbox for guaranteed event delivery. |
| **recommendation-service** | Reads catalog data from MongoDB, builds user genre-preference vectors, and ranks unseen movies by cosine similarity. Fully isolated Python service. |

### Polyglot Persistence Rationale

| Service | Store | Rationale |
|---|---|---|
| user-service | PostgreSQL | Users and auth tokens demand ACID. Strong schema, FK integrity, row-level security. |
| catalog-service | MongoDB | Movies and showtimes are richly nested documents (cast arrays, seat-map grids). MongoDB's document model fits naturally; no join overhead for nested reads. |
| catalog-service | Redis | Catalog reads are heavily repeated and rarely change. A 60 s TTL cache absorbs 90%+ of read traffic without staling significantly. |
| seat-service | Redis | Seat lock state must support sub-millisecond atomic CAS operations. Redis Lua scripts are the only practical path to lock + TTL atomicity at this latency. |
| booking-service | PostgreSQL | Bookings are financial records. ACID, JSONB for saga state, array columns for seat IDs, and transactional outbox all require a relational store. |
| recommendation-service | MongoDB (shared catalog DB) | Recommendations are generated from catalog data already in MongoDB. Reading the same DB avoids cross-service data sync entirely. |

---

## Microservices Breakdown

### 1. User Service

**Responsibility:** Identity and authentication. Manages user records, password hashing, JWT issuance, and token validation.

**Port:** `4001`  
**Language:** TypeScript / Express  
**Data Store:** PostgreSQL (`users` table)

#### REST API

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/healthz` | Health check | No |
| `POST` | `/login` | Authenticate user; returns JWT token | No |
| `GET` | `/me` | Return authenticated user profile | Bearer JWT |

#### Key Modules

| Module | Purpose |
|---|---|
| `src/index.ts` | Express server bootstrap, DB connection, route mounting |
| JWT middleware | Validates `Authorization: Bearer <token>` header on protected routes |
| bcrypt layer | Password hashing on signup / comparison on login |

#### Dependencies on Other Services

None — user-service is a leaf node. Other services validate JWTs locally using the shared `JWT_SECRET`.

---

### 2. Catalog Service

**Responsibility:** Movie and showtime catalog. CRUD for content, full-text search, genre filtering, paginated listing. All hot read paths are accelerated by Redis.

**Port:** `4002`  
**Language:** TypeScript / Express  
**Data Store:** MongoDB (`movies`, `showtimes` collections) + Redis (read cache)

#### REST API

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/healthz` | Health check | No |
| `GET` | `/movies` | List movies. Query: `page`, `limit`, `genre`, `search` | No |
| `GET` | `/movies/:id` | Movie detail with associated showtimes | No |
| `GET` | `/showtimes/:id` | Single showtime detail | No |
| `POST` | `/admin/movies` | Create movie | No (admin auth planned) |
| `PUT` | `/admin/movies/:id` | Update movie | No (admin auth planned) |
| `POST` | `/admin/showtimes` | Create showtime | No (admin auth planned) |

#### Key Modules

| Module | Purpose |
|---|---|
| `src/index.ts` | Server bootstrap, Mongoose connect, Redis connect |
| `src/models/Movie.ts` | Mongoose schemas for `Movie` and `Showtime` |
| Redis caching layer | `GETEX` / `SET EX` with wildcard invalidation on write |

#### Cache Key Format

```
catalog:movies:{genre?}:{search?}:{page}:{limit}
catalog:movie:{id}
catalog:showtime:{id}
```

#### Dependencies on Other Services

None — reads its own MongoDB. seat-service reads showtime seat maps to initialise lock state.

---

### 3. Seat Service

**Responsibility:** Distributed seat-lock authority. Owns all lock and sold state in Redis. Broadcasts real-time seat status changes to connected browsers via Socket.io. Participates in the booking Saga as a command executor over RabbitMQ.

**Port:** `4003`  
**Language:** TypeScript / Express + Socket.io  
**Data Store:** Redis (locks + sold flags)  
**Message Broker:** RabbitMQ (subscriber on `seat.commands` queue)

#### REST API

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/healthz` | Health check | No |
| `GET` | `/showtimes/:id/seats` | Returns locked and sold seat IDs for a showtime | No |
| `POST` | `/showtimes/:id/lock` | Atomically lock seats. Body: `{ seatIds, userId }` | No |
| `POST` | `/showtimes/:id/release` | Release held seats. Body: `{ seatIds, lockToken }` | No |

#### Socket.io Events

| Direction | Event | Payload |
|---|---|---|
| Server → Client | `seat_status_changed` | `{ showtimeId, seatIds, status: 'LOCKED'\|'AVAILABLE'\|'SOLD', at }` |
| Client → Server | `join:showtime` | `{ showtimeId }` |
| Client → Server | `leave:showtime` | `{ showtimeId }` |

Clients join room `showtime:{showtimeId}` and receive targeted broadcasts.

#### Key Modules

| Module | Purpose |
|---|---|
| `src/index.ts` | Express + Socket.io server, RabbitMQ consumer bootstrap |
| `src/SeatLockService.ts` | Atomic lock/release/commit using Redis Lua scripts; deadlock prevention via deterministic seat ordering |

#### Redis Key Patterns

| Key | Value | TTL |
|---|---|---|
| `seat:lock:{showtimeId}:{seatId}` | lock token (UUID) | 600 s (10 min) |
| `seat:sold:{showtimeId}:{seatId}` | lock token | No expiry |

#### RabbitMQ (Consumer)

| Routing Key | Action |
|---|---|
| `seat.lock.requested` | Acquire locks; reply `seat.lock.succeeded` or `seat.lock.failed` |
| `seat.release.requested` | Release locks; broadcast `AVAILABLE` |
| `seat.commit.requested` | Promote locks to sold; broadcast `SOLD` |

#### Dependencies on Other Services

Receives commands from **booking-service** via RabbitMQ. No direct HTTP calls to other services.

---

### 4. Booking Service

**Responsibility:** Booking lifecycle orchestration. Runs the Saga state machine (LOCK → PAY → CONFIRM), persists all state to PostgreSQL, and emits domain events via the transactional outbox.

**Port:** `4004`  
**Language:** TypeScript / Express  
**Data Store:** PostgreSQL (`bookings`, `outbox`, `saga_compensation_failures` tables)  
**Message Broker:** RabbitMQ (publisher + RPC client)

#### REST API

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/healthz` | Health check | No |
| `POST` | `/bookings` | Initiate booking Saga. Body: `{ userId, showtimeId, seatIds, amount, idempotencyKey }`. Returns `{ bookingId }` | No |
| `GET` | `/bookings/:id` | Full booking details | No |
| `GET` | `/users/:uid/bookings` | User's booking history (last 50, descending) | No |

#### Saga State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /bookings
    PENDING --> SEATS_LOCKED : seat.lock.succeeded
    PENDING --> FAILED : seat.lock.failed / timeout (5s)
    SEATS_LOCKED --> PAYMENT_PROCESSING : payment.requested
    PAYMENT_PROCESSING --> CONFIRMED : payment.succeeded
    PAYMENT_PROCESSING --> FAILED : payment.failed / timeout (15s)
    FAILED --> FAILED : compensate (release seats, refund)
    CONFIRMED --> [*]
    FAILED --> [*]
    PENDING --> EXPIRED : recovery worker (30s)
    SEATS_LOCKED --> EXPIRED : recovery worker
    PAYMENT_PROCESSING --> EXPIRED : recovery worker
```

#### Key Modules

| Module | Purpose |
|---|---|
| `src/index.ts` | Server bootstrap, PostgreSQL connect, RabbitMQ connect, recovery worker scheduling |
| `src/BookingSaga.ts` | Orchestration Saga: state transitions, RPC command publishing, compensation logic, timeout handling |
| Recovery worker | Runs every 30 s; expires bookings stuck in `PENDING`, `SEATS_LOCKED`, or `PAYMENT_PROCESSING` past their `expires_at` |

#### Dependencies on Other Services

- **seat-service** (via RabbitMQ RPC): seat lock, release, commit
- Payment service (via RabbitMQ RPC, planned)

---

### 5. Recommendation Service

**Responsibility:** Personalised movie recommendations using content-based filtering over user booking/rating history.

**Port:** `4005`  
**Language:** Python / FastAPI  
**Data Store:** MongoDB (reads from shared `catalog.movies` collection)

#### REST API

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/healthz` | Health check | No |
| `POST` | `/recommendations` | Generate personalised recommendations. Body: `RecommendRequest` | No |
| `GET` | `/recommendations/popular?limit=10` | Top movies by global popularity | No |

#### Request / Response Models

```python
# Request
{
  "user_id": "string",
  "history": [
    { "movie_id": "string", "rating": 0.0 }
  ],
  "top_n": 10
}

# Response
[
  {
    "movie_id": "string",
    "title": "string",
    "genres": ["string"],
    "score": 0.95
  }
]
```

#### Algorithm

1. Build a user genre-preference vector weighted by past ratings.
2. For each unseen movie, construct a genre indicator vector.
3. Rank by cosine similarity between user vector and movie vector.
4. Return top N.

#### Key Modules

| Module | Purpose |
|---|---|
| `main.py` | FastAPI app, route definitions, MongoDB (motor) async client |
| `app/engine.py` | Content-based filtering logic using pandas and numpy |

#### Dependencies on Other Services

Reads `catalog.movies` from MongoDB directly. No inter-service HTTP calls at runtime.

---

## Data Flow Diagrams

### User Login Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Frontend
    participant GW as Nginx Gateway
    participant US as user-service
    participant PG as PostgreSQL

    User->>FE: Enter email & password
    FE->>GW: POST /api/users/login
    GW->>US: POST /login
    US->>PG: SELECT * FROM users WHERE email = ?
    PG-->>US: User row (password_hash)
    US->>US: bcrypt.compare(password, hash)
    alt Credentials valid
        US->>US: jwt.sign({ userId, email, role })
        US-->>GW: 200 { token, user }
        GW-->>FE: 200 { token, user }
        FE->>FE: Store JWT in localStorage/cookie
        FE-->>User: Redirect to home
    else Invalid
        US-->>GW: 401 Unauthorized
        GW-->>FE: 401
        FE-->>User: Show error message
    end
```

---

### Browse Events / Cache Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Frontend
    participant GW as Nginx Gateway
    participant CS as catalog-service
    participant RD as Redis
    participant MG as MongoDB

    User->>FE: Open movie listings
    FE->>GW: GET /api/catalog/movies?genre=Action&page=1
    GW->>CS: GET /movies?genre=Action&page=1
    CS->>CS: Build cache key: catalog:movies:Action::1:20

    CS->>RD: GET catalog:movies:Action::1:20
    alt Cache HIT
        RD-->>CS: Serialised JSON response
        CS-->>GW: 200 { items, total, page, limit }
    else Cache MISS
        RD-->>CS: nil
        CS->>MG: db.movies.find({ genres: "Action" }).skip(0).limit(20)
        MG-->>CS: Movie documents
        CS->>RD: SETEX catalog:movies:Action::1:20 60 <json>
        CS-->>GW: 200 { items, total, page, limit }
    end
    GW-->>FE: Response
    FE-->>User: Render movie grid
```

---

### Seat Hold Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Frontend
    participant GW as Nginx Gateway
    participant SS as seat-service
    participant RD as Redis
    participant RMQ as RabbitMQ
    participant Others as Other clients (Socket.io)

    User->>FE: Click seats A3, A4 on seat map
    FE->>GW: POST /api/seats/showtimes/{id}/lock\n{ seatIds: ["A3","A4"], userId }
    GW->>SS: POST /showtimes/{id}/lock

    SS->>SS: Sort seatIds (deadlock prevention)
    loop For each seatId (Lua script)
        SS->>RD: SET seat:lock:{showtimeId}:{seatId} {token} NX PX 600000
        alt Seat already locked
            RD-->>SS: nil (lock failed)
            SS->>RD: DEL all locks acquired so far
            SS-->>GW: 409 { success: false, reason: "seat unavailable" }
            GW-->>FE: 409
            FE-->>User: "Seats no longer available"
        end
    end
    RD-->>SS: OK (all seats locked)
    SS->>RMQ: Publish seat.lock.succeeded (topic: booking.events)
    SS->>SS: io.to("showtime:{id}").emit("seat_status_changed")
    SS-->>GW: 200 { success: true, lockToken, expiresAt }
    GW-->>FE: 200
    FE-->>User: Seats highlighted, countdown timer starts
    RMQ-->>Others: seat_status_changed broadcast
    Others-->>Others: Seat map greyed out for other users

    Note over RD: After 600s with no confirmation
    RD->>RD: Key TTL expires automatically
    SS->>SS: (on next GET /seats) report seats as AVAILABLE
```

---

### Booking Confirmation (Saga) Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Frontend
    participant GW as Nginx Gateway
    participant BS as booking-service
    participant PG as PostgreSQL
    participant RMQ as RabbitMQ
    participant SS as seat-service
    participant RD as Redis
    participant PS as payment-service (planned)

    User->>FE: Confirm booking
    FE->>GW: POST /api/bookings/bookings\n{ userId, showtimeId, seatIds, amount, idempotencyKey }
    GW->>BS: POST /bookings (rate-limited: 10 req/s)

    BS->>PG: Check idempotency_key (UNIQUE constraint)
    alt Duplicate request
        PG-->>BS: Unique violation
        BS-->>GW: 200 { bookingId } (existing)
    end

    BS->>PG: INSERT bookings (status=PENDING, expires_at=now+10min)
    BS->>BS: BookingSaga.start()

    Note over BS,SS: Step 1 — Lock seats (RPC over RabbitMQ, 5s timeout)
    BS->>RMQ: seat.lock.requested (correlationId, replyTo)
    RMQ->>SS: seat.lock.requested
    SS->>RD: Lua lock all seatIds
    SS->>RMQ: seat.lock.succeeded (correlationId)
    RMQ->>BS: seat.lock.succeeded
    BS->>PG: UPDATE bookings SET status=SEATS_LOCKED

    Note over BS,PS: Step 2 — Process payment (RPC, 15s timeout)
    BS->>RMQ: payment.requested
    RMQ->>PS: payment.requested
    PS->>RMQ: payment.succeeded
    RMQ->>BS: payment.succeeded
    BS->>PG: UPDATE bookings SET status=CONFIRMED, payment_ref=...

    Note over BS,RMQ: Step 3 — Commit seats as SOLD
    BS->>RMQ: seat.commit.requested
    RMQ->>SS: seat.commit.requested
    SS->>RD: SET seat:sold:{id}:{seat} (no TTL)
    SS->>SS: Broadcast seat_status_changed (SOLD)

    BS->>PG: INSERT outbox (booking.confirmed event)
    BS-->>GW: 200 { bookingId }
    GW-->>FE: 200
    FE-->>User: Booking confirmation screen
```

---

### Recommendation Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Next.js Frontend
    participant GW as Nginx Gateway
    participant RS as recommendation-service
    participant MG as MongoDB

    User->>FE: Open "For You" section
    FE->>GW: POST /api/recommend/recommendations\n{ user_id, history: [{movie_id, rating}], top_n: 10 }
    GW->>RS: POST /recommendations

    RS->>RS: Build user genre-preference vector\nfrom history ratings
    RS->>MG: db.movies.find({ _id: { $nin: seen } })
    MG-->>RS: Candidate movie documents
    RS->>RS: Compute cosine_similarity(user_vec, movie_vec)\nfor each candidate
    RS->>RS: Sort descending; take top_n
    RS-->>GW: 200 [{ movie_id, title, genres, score }]
    GW-->>FE: Response
    FE-->>User: Render personalised carousel
```

---

### Failure / Rollback Flow

```mermaid
sequenceDiagram
    autonumber
    participant BS as booking-service
    participant PG as PostgreSQL
    participant RMQ as RabbitMQ
    participant SS as seat-service
    participant RD as Redis

    Note over BS: Scenario A — Seat lock timeout (5s exceeded)
    BS->>BS: Saga timeout fires
    BS->>PG: UPDATE bookings SET status=FAILED,\nsaga_state.failedStep='LOCK'
    BS-->>BS: No seats to release (lock never acquired)

    Note over BS: Scenario B — Payment failure
    RMQ->>BS: payment.failed
    BS->>BS: Saga.compensate()
    BS->>RMQ: seat.release.requested
    RMQ->>SS: seat.release.requested
    SS->>RD: DEL seat:lock:{id}:{seatId} (compare-and-delete Lua)
    SS->>SS: Broadcast seat_status_changed (AVAILABLE)
    BS->>PG: UPDATE bookings SET status=FAILED,\nsaga_state.reason='payment_declined'

    Note over BS: Scenario C — Recovery worker (expired bookings)
    loop Every 30 seconds
        BS->>PG: SELECT * FROM bookings\nWHERE status IN (PENDING, SEATS_LOCKED, PAYMENT_PROCESSING)\nAND expires_at < NOW()
        PG-->>BS: Stuck bookings
        loop Per stuck booking
            BS->>RMQ: seat.release.requested (if SEATS_LOCKED)
            BS->>PG: UPDATE bookings SET status=EXPIRED
        end
    end

    Note over RD: Scenario D — Client abandons (no confirm)
    RD->>RD: seat:lock TTL (600s) auto-expires
    Note over RD: Next GET /seats will show AVAILABLE
```

---

## Class / Domain Diagrams

### Core Domain Models

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String passwordHash
        +String fullName
        +String phone
        +String role
        +Boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Movie {
        +ObjectId id
        +String title
        +String[] genres
        +Number durationMin
        +Number rating
        +String[] cast
        +String posterUrl
        +String trailerUrl
        +String description
        +Date releaseDate
        +String[] languages
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Showtime {
        +ObjectId id
        +ObjectId movieId
        +ObjectId theaterId
        +String screenId
        +Date startsAt
        +Date endsAt
        +Number basePrice
        +String currency
        +String language
        +String format
        +SeatRow[] seatMap
        +Number soldCount
        +Number capacity
        +Number version
    }

    class SeatRow {
        +String row
        +Seat[] seats
    }

    class Seat {
        +String id
        +String type
        +Number price
    }

    class SeatHold {
        +String lockToken
        +String showtimeId
        +String seatId
        +String userId
        +DateTime expiresAt
    }

    class Booking {
        +UUID id
        +UUID userId
        +String showtimeId
        +String[] seatIds
        +Decimal totalAmount
        +String currency
        +BookingStatus status
        +Object sagaState
        +String idempotencyKey
        +String paymentRef
        +String lockToken
        +DateTime createdAt
        +DateTime expiresAt
    }

    class Recommendation {
        +String movieId
        +String title
        +String[] genres
        +Float score
    }

    User "1" --> "0..*" Booking : places
    Booking "0..*" --> "1" Showtime : for
    Showtime "0..*" --> "1" Movie : screens
    Showtime "1" --> "1..*" SeatRow : hasLayout
    SeatRow "1" --> "1..*" Seat : contains
    Seat "0..1" --> "0..1" SeatHold : heldBy
    User "1" --> "0..*" Recommendation : receives
```

---

### Booking Service — Internal Structure

```mermaid
classDiagram
    class BookingController {
        +createBooking(req, res)
        +getBooking(req, res)
        +getUserBookings(req, res)
    }

    class BookingSaga {
        -bookingId UUID
        -pgClient Client
        -amqpChannel Channel
        -pendingReplies Map
        +start(payload) Promise~void~
        +compensate(step) Promise~void~
        -publishRPC(routingKey, payload, timeout) Promise~any~
        -lockSeats(showtimeId, seatIds) Promise~string~
        -requestPayment(amount, userId) Promise~string~
        -commitSeats(showtimeId, seatIds, lockToken) Promise~void~
        -releaseSeats(showtimeId, seatIds, lockToken) Promise~void~
    }

    class RecoveryWorker {
        -pgClient Client
        -amqpChannel Channel
        +run() void
        -expireStuckBookings() Promise~void~
    }

    class OutboxPublisher {
        -pgClient Client
        -amqpChannel Channel
        +poll() Promise~void~
        +publishEvent(aggregateType, aggregateId, eventType, payload) Promise~void~
    }

    BookingController --> BookingSaga : creates per request
    BookingSaga --> OutboxPublisher : writes events
    RecoveryWorker --> BookingSaga : triggers compensation
```

---

### Seat Service — Internal Structure

```mermaid
classDiagram
    class SeatController {
        +getSeats(req, res)
        +lockSeats(req, res)
        +releaseSeats(req, res)
    }

    class SeatLockService {
        -redis IORedis
        +acquireLocks(showtimeId, seatIds, userId) Promise~LockResult~
        +releaseLocks(showtimeId, seatIds, lockToken) Promise~void~
        +commitLocks(showtimeId, seatIds, lockToken) Promise~void~
        +getStatus(showtimeId) Promise~SeatStatus~
        -luaLock(key, token, ttl) Promise~boolean~
        -luaCompareDelete(key, token) Promise~boolean~
    }

    class RabbitMQConsumer {
        -channel Channel
        -lockService SeatLockService
        -io Server
        +start() Promise~void~
        -handleLockRequested(msg) Promise~void~
        -handleReleaseRequested(msg) Promise~void~
        -handleCommitRequested(msg) Promise~void~
    }

    class SocketBroadcaster {
        -io Server
        +broadcastSeatChange(showtimeId, seatIds, status) void
    }

    SeatController --> SeatLockService : delegates
    RabbitMQConsumer --> SeatLockService : delegates
    RabbitMQConsumer --> SocketBroadcaster : triggers broadcast
    SeatController --> SocketBroadcaster : triggers broadcast
```

---

## Database Schemas

### PostgreSQL

<details>
<summary>Full DDL — users, bookings, outbox, saga_compensation_failures</summary>

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'partner');
CREATE TYPE booking_status AS ENUM (
    'PENDING', 'SEATS_LOCKED', 'PAYMENT_PROCESSING',
    'CONFIRMED', 'FAILED', 'CANCELLED', 'EXPIRED'
);
CREATE TYPE outbox_status AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120),
    phone           VARCHAR(20),
    role            VARCHAR(20) DEFAULT 'customer',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Bookings
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    showtime_id         VARCHAR(64) NOT NULL,
    seat_ids            TEXT[] NOT NULL,
    total_amount        NUMERIC(10, 2) NOT NULL,
    currency            CHAR(3) DEFAULT 'USD',
    status              booking_status DEFAULT 'PENDING',
    saga_state          JSONB DEFAULT '{}',
    idempotency_key     VARCHAR(128) UNIQUE,
    payment_ref         VARCHAR(128),
    lock_token          VARCHAR(128),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_bookings_user_status   ON bookings(user_id, status);
CREATE INDEX idx_bookings_showtime      ON bookings(showtime_id);
CREATE INDEX idx_bookings_expires       ON bookings(expires_at)
    WHERE status IN ('PENDING', 'SEATS_LOCKED', 'PAYMENT_PROCESSING');

-- Saga compensation failure audit log
CREATE TABLE saga_compensation_failures (
    id          BIGSERIAL PRIMARY KEY,
    booking_id  UUID REFERENCES bookings(id),
    step        VARCHAR(40),
    error       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scf_booking ON saga_compensation_failures(booking_id);

-- Transactional outbox
CREATE TABLE outbox (
    id              BIGSERIAL PRIMARY KEY,
    aggregate_type  VARCHAR(50) NOT NULL,
    aggregate_id    UUID NOT NULL,
    event_type      VARCHAR(80) NOT NULL,
    payload         JSONB NOT NULL,
    headers         JSONB DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'PENDING',
    attempts        INT DEFAULT 0,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending    ON outbox(status, next_attempt_at) WHERE status = 'PENDING';
CREATE INDEX idx_outbox_aggregate  ON outbox(aggregate_type, aggregate_id);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

</details>

---

### MongoDB

<details>
<summary>Collection: movies — sample document</summary>

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "title": "Inception",
  "genres": ["Sci-Fi", "Thriller", "Action"],
  "durationMin": 148,
  "rating": 8.8,
  "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
  "posterUrl": "https://cdn.example.com/posters/inception.jpg",
  "trailerUrl": "https://youtube.com/watch?v=...",
  "description": "A thief who steals corporate secrets through dream-sharing technology...",
  "releaseDate": "2010-07-16T00:00:00.000Z",
  "languages": ["English", "Hindi"],
  "status": "now_showing",
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-10T08:00:00.000Z"
}
```

</details>

<details>
<summary>Collection: showtimes — sample document</summary>

```json
{
  "_id": "64f2b3c4d5e6f7a8b9c0d2e3",
  "movieId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "theaterId": "64f0a1b2c3d4e5f6a7b8c9d0",
  "screenId": "SCREEN-1",
  "startsAt": "2024-01-15T18:30:00.000Z",
  "endsAt": "2024-01-15T21:00:00.000Z",
  "basePrice": 250,
  "currency": "INR",
  "language": "English",
  "format": "IMAX",
  "seatMap": [
    {
      "row": "A",
      "seats": [
        { "id": "A1", "type": "STD", "price": 250 },
        { "id": "A2", "type": "STD", "price": 250 }
      ]
    },
    {
      "row": "E",
      "seats": [
        { "id": "E1", "type": "PRM", "price": 350 },
        { "id": "E2", "type": "VIP", "price": 500 }
      ]
    }
  ],
  "soldCount": 12,
  "capacity": 60,
  "version": 5,
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-14T20:00:00.000Z"
}
```

</details>

---

### Redis Key Reference

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `seat:lock:{showtimeId}:{seatId}` | UUID lock token | 600 s | Temporary seat hold during checkout |
| `seat:sold:{showtimeId}:{seatId}` | UUID lock token | None | Permanently sold seat marker |
| `catalog:movies:{genre}:{search}:{page}:{limit}` | JSON string | 60 s | Cached movie listing response |
| `catalog:movie:{id}` | JSON string | 60 s | Cached single movie + showtimes |
| `catalog:showtime:{id}` | JSON string | 60 s | Cached single showtime |

---

## Message Broker (RabbitMQ) Design

### Exchange & Queue Topology

```mermaid
graph LR
    BS["booking-service\n(Producer)"]
    SS["seat-service\n(Producer + Consumer)"]
    EX["Exchange: booking.events\ntype: topic\ndurable: true"]
    Q1["Queue: seat.commands\ndurable: true"]
    Q2["Queue: booking.replies.{uuid}\nexclusive, auto-delete"]

    BS -->|"seat.lock.requested\nseat.release.requested\nseat.commit.requested\npayment.requested"| EX
    SS -->|"seat.lock.succeeded\nseat.lock.failed"| EX
    EX -->|"seat.lock.*\nseat.release.*\nseat.commit.*"| Q1
    EX -->|"seat.lock.succeeded\nseat.lock.failed"| Q2
    Q1 --> SS
    Q2 --> BS
```

### Routing Key Directory

| Routing Key | Producer | Consumer | Description |
|---|---|---|---|
| `seat.lock.requested` | booking-service | seat-service | Request to atomically lock a set of seats |
| `seat.lock.succeeded` | seat-service | booking-service | RPC reply: locks acquired; includes `lockToken` |
| `seat.lock.failed` | seat-service | booking-service | RPC reply: one or more seats unavailable |
| `seat.release.requested` | booking-service | seat-service | Release previously locked seats |
| `seat.commit.requested` | booking-service | seat-service | Promote locks to permanent sold state |
| `payment.requested` | booking-service | payment-service (planned) | Initiate payment charge |
| `payment.succeeded` | payment-service | booking-service | Payment authorised; includes `paymentRef` |
| `payment.failed` | payment-service | booking-service | Payment declined |
| `booking.confirmed` | booking-service | analytics, notifications (planned) | Booking successfully completed |
| `booking.failed` | booking-service | analytics (planned) | Booking could not be completed |

### Event Payload Schemas

<details>
<summary>seat.lock.requested</summary>

```json
{
  "correlationId": "uuid-v4",
  "replyTo": "booking.replies.uuid-v4",
  "showtimeId": "64f2b3c4...",
  "seatIds": ["A3", "A4"],
  "userId": "uuid-v4",
  "lockDurationMs": 600000
}
```

</details>

<details>
<summary>seat.lock.succeeded</summary>

```json
{
  "correlationId": "uuid-v4",
  "lockToken": "uuid-v4",
  "showtimeId": "64f2b3c4...",
  "seatIds": ["A3", "A4"],
  "expiresAt": "2024-01-15T18:40:00.000Z"
}
```

</details>

<details>
<summary>seat.lock.failed</summary>

```json
{
  "correlationId": "uuid-v4",
  "reason": "seat_unavailable",
  "conflictingSeatIds": ["A3"]
}
```

</details>

<details>
<summary>booking.confirmed</summary>

```json
{
  "bookingId": "uuid-v4",
  "userId": "uuid-v4",
  "showtimeId": "64f2b3c4...",
  "seatIds": ["A3", "A4"],
  "totalAmount": 500,
  "currency": "INR",
  "paymentRef": "pay_abc123",
  "confirmedAt": "2024-01-15T18:32:10.000Z"
}
```

</details>

---

## API Gateway (Nginx) Routing

Nginx listens on port **8080** (mapped from container port 80) and proxies to internal Docker network hostnames.

| Path Prefix | Upstream | Notes |
|---|---|---|
| `/api/users/` | `user-service:4001` | Auth endpoints |
| `/api/catalog/` | `catalog-service:4002` | Movie/showtime browsing |
| `/api/seats/` | `seat-service:4003` | Seat availability & locking |
| `/api/bookings/` | `booking-service:4004` | Rate-limited: 10 req/s, burst 20 |
| `/api/recommend/` | `recommendation-service:4005` | Recommendations |
| `/ws/seats/` | `seat-service:4003` | WebSocket upgrade (`Upgrade: websocket`) |
| `/socket.io/` | `seat-service:4003` | Socket.io (WebSocket + polling) |
| `/healthz` | Nginx internal | Returns `200 OK` directly |

**Rate Limiting Zone:** `booking_rl` — `limit_req_zone $binary_remote_addr zone=booking_rl:10m rate=10r/s`

**Forwarded Headers:** `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`

**Client max body size:** 2 MB

---

## Authentication & Authorization

### JWT Flow

```mermaid
sequenceDiagram
    participant Client
    participant US as user-service
    participant Any as Any Protected Service

    Client->>US: POST /api/users/login { email, password }
    US->>US: bcrypt.compare(password, hash)
    US->>US: jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' })
    US-->>Client: { token: "eyJ...", user: {...} }

    Client->>Any: GET /api/.../protected\nAuthorization: Bearer eyJ...
    Any->>Any: jwt.verify(token, JWT_SECRET)
    Any-->>Client: 200 or 401
```

### Token Structure

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": {
    "userId": "uuid-v4",
    "email": "user@example.com",
    "role": "customer",
    "iat": 1705305600,
    "exp": 1705392000
  }
}
```

### Protected Routes Summary

| Route | Service | Required role |
|---|---|---|
| `GET /api/users/me` | user-service | Any authenticated |
| `POST /api/catalog/admin/*` | catalog-service | `admin` (planned middleware) |
| `POST /api/bookings/bookings` | booking-service | Any authenticated (planned) |

> **Note:** Full JWT middleware enforcement on booking and admin routes is the next auth milestone (see [Roadmap](#roadmap)).

---

## Concurrency & Scaling Strategy

### Preventing Double-Booking

The seat-service uses **Lua scripts executed atomically on Redis** — the Redis single-threaded command execution model guarantees that no two clients can simultaneously acquire the same seat:

```lua
-- Pseudo-code of lock Lua script
local key = KEYS[1]           -- seat:lock:{showtimeId}:{seatId}
local token = ARGV[1]
local ttl = tonumber(ARGV[2])
if redis.call("EXISTS", key) == 0 then
    redis.call("SET", key, token, "PX", ttl)
    return 1
end
return 0
```

**All-or-nothing semantics:** If acquiring N seats, any failure causes all previously acquired locks for that request to be immediately deleted. No partial holds are persisted.

**Deadlock prevention:** `seatIds` are sorted deterministically before acquiring locks. Two concurrent requests for overlapping sets always acquire in the same order, preventing circular waits.

### Redis TTL Auto-Expiry

Seat locks carry a 600-second TTL. If a user abandons checkout or the booking saga fails before committing, Redis expires the key automatically — no explicit cleanup needed. The recovery worker handles the PostgreSQL side.

### Idempotency

Every booking request requires a client-generated `idempotencyKey` (UUID). PostgreSQL's `UNIQUE` constraint on `bookings.idempotency_key` makes duplicate requests safe: the second request returns the existing `bookingId` immediately.

### Horizontal Scaling

| Service | Stateful? | Scale-out approach |
|---|---|---|
| user-service | No (JWT) | Add replicas behind Nginx upstream |
| catalog-service | No (Redis external) | Add replicas; Redis cache is shared |
| seat-service | Redis state | Single instance per showtime OR use Redis Cluster for sharding by `showtimeId` |
| booking-service | No (PG + RMQ) | Add replicas; RabbitMQ delivers to one consumer (work queue) |
| recommendation-service | No | Add replicas behind Nginx upstream |

**seat-service scaling note:** Redis is the stateful source of truth. Multiple seat-service instances can safely run if they share the same Redis. Socket.io broadcast requires Redis adapter (`socket.io-redis`) when running multiple instances.

### Eventual Consistency

The booking saga ensures **eventual consistency** across services:
- Seat locks in Redis are the optimistic reservation.
- The PostgreSQL booking row is the durable record.
- RabbitMQ delivers compensation commands at-least-once; all operations are idempotent (compare-and-delete Lua).
- The transactional outbox guarantees events are not lost if the service crashes between DB write and RabbitMQ publish.

---

## Project Structure

```
Scalable Ticket Booking/
├── docker-compose.yml             # Full stack: 5 services + 4 datastores + nginx
├── .gitignore
├── nginx/
│   └── nginx.conf                 # Reverse proxy, rate limiting, WS upgrade
├── postgres/
│   └── init.sql                   # Schema DDL + seed data
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Movie grid home page
│   ├── components/
│   │   ├── MovieCard.tsx          # Movie display card
│   │   ├── SeatMap.tsx            # Interactive seat grid + Socket.io
│   │   └── CheckoutPanel.tsx      # Order summary & booking form
│   └── lib/
│       └── api.ts                 # Axios API client (all services)
└── services/
    ├── user-service/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       └── index.ts           # Express server, JWT, bcrypt, pg
    ├── catalog-service/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts           # Express server, Mongoose, Redis
    │       └── models/
    │           └── Movie.ts       # Movie + Showtime Mongoose schemas
    ├── seat-service/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts           # Express + Socket.io, RabbitMQ consumer
    │       └── SeatLockService.ts # Atomic Redis lock/release/commit
    ├── booking-service/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts           # Express, pg, RabbitMQ, recovery worker
    │       └── BookingSaga.ts     # Orchestration saga state machine
    └── recommendation-service/
        ├── requirements.txt       # fastapi, uvicorn, motor, pandas, numpy
        ├── main.py                # FastAPI app, routes, MongoDB client
        └── app/
            └── engine.py         # Content-based filtering engine
```

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|---|---|
| Docker | 24.x |
| Docker Compose | v2.20+ (`docker compose` v2 syntax) |
| Node.js (local dev only) | 20 LTS |
| Python (local dev only) | 3.11+ |

### Environment Variables

All variables are pre-configured in `docker-compose.yml` for local development. For production, supply these via your secrets manager.

<details>
<summary>user-service</summary>

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4001` | HTTP listen port |
| `POSTGRES_URL` | `postgres://ticket:ticketpass@postgres:5432/bookings` | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-prod` | HS256 signing secret — **change in production** |

</details>

<details>
<summary>catalog-service</summary>

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4002` | HTTP listen port |
| `MONGO_URL` | `mongodb://ticket:ticketpass@mongo:27017/catalog?authSource=admin` | MongoDB connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `CACHE_TTL_SEC` | `60` | Redis cache TTL in seconds |

</details>

<details>
<summary>seat-service</summary>

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4003` | HTTP listen port |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `RABBITMQ_URL` | `amqp://ticket:ticketpass@rabbitmq:5672` | RabbitMQ AMQP URL |

</details>

<details>
<summary>booking-service</summary>

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4004` | HTTP listen port |
| `POSTGRES_URL` | `postgres://ticket:ticketpass@postgres:5432/bookings` | PostgreSQL connection string |
| `RABBITMQ_URL` | `amqp://ticket:ticketpass@rabbitmq:5672` | RabbitMQ AMQP URL |
| `SEAT_SERVICE_URL` | `http://seat-service:4003` | Internal seat-service base URL |

</details>

<details>
<summary>recommendation-service</summary>

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4005` | HTTP listen port |
| `MONGO_URL` | `mongodb://ticket:ticketpass@mongo:27017/catalog?authSource=admin` | MongoDB connection string |

</details>

<details>
<summary>frontend</summary>

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8080/api` | API gateway base URL (browser-visible) |

</details>

---

### Launch with Docker Compose

```bash
# Clone the repository
git clone https://github.com/<your-username>/scalable-ticket-booking.git
cd scalable-ticket-booking

# Start all services (detached)
docker compose up -d --build

# Tail logs for all services
docker compose logs -f

# Tail a specific service
docker compose logs -f booking-service
```

> First boot takes 1–3 minutes. RabbitMQ and MongoDB need time to initialise before dependent services connect. Services use `depends_on: condition: service_healthy` checks where applicable.

### Access Points

| Interface | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| RabbitMQ Management UI | http://localhost:15672 (user: `ticket` / `ticketpass`) |
| PostgreSQL | `localhost:5432` (user: `ticket` / `ticketpass` / db: `bookings`) |
| MongoDB | `localhost:27017` (user: `ticket` / `ticketpass`) |
| Redis | `localhost:6379` |

### Seed Data

The PostgreSQL schema (`postgres/init.sql`) is applied automatically on first container start and includes a seed admin user. To seed movie and showtime data into MongoDB:

```bash
# Enter the catalog-service container
docker compose exec catalog-service sh

# Run seed script (if present) or use the admin endpoints
curl -X POST http://localhost:4002/admin/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Inception","genres":["Sci-Fi","Thriller"],"durationMin":148,"rating":8.8,"status":"now_showing"}'
```

### Verify All Services Are Healthy

```bash
for svc in users catalog seats bookings recommend; do
  echo -n "$svc: "
  curl -s http://localhost:8080/api/$svc/healthz
  echo
done
```

---

## Local Development (without Docker)

You will need PostgreSQL, MongoDB, Redis, and RabbitMQ running locally (or via Docker for infrastructure only):

```bash
# Start only infrastructure
docker compose up -d postgres mongo redis rabbitmq
```

### TypeScript Services

```bash
# Install dependencies and run in dev mode (repeat per service)
cd services/user-service
npm install
POSTGRES_URL=postgres://ticket:ticketpass@localhost:5432/bookings \
JWT_SECRET=dev-secret \
PORT=4001 \
npm run dev

# In separate terminals, repeat for catalog-service, seat-service, booking-service
```

### Python Recommendation Service

```bash
cd services/recommendation-service
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
MONGO_URL=mongodb://ticket:ticketpass@localhost:27017/catalog?authSource=admin \
PORT=4005 \
uvicorn main:app --reload --port 4005
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE=http://localhost:8080/api npm run dev
# Opens on http://localhost:3000
```

---

## Testing

### Unit Tests

Each service's business logic (saga state machine, seat lock service, recommendation engine) should be unit-tested in isolation with mocked external dependencies.

```bash
# Example: booking-service
cd services/booking-service
npm test
```

Key units to test:

| Service | Unit | What to assert |
|---|---|---|
| seat-service | `SeatLockService.acquireLocks` | All-or-nothing semantics on partial failure |
| booking-service | `BookingSaga` | State transitions, timeout compensation, idempotency |
| catalog-service | Redis cache layer | Cache hit returns without DB call; miss populates cache |
| recommendation-service | `engine.py` | Correct cosine similarity ranking; empty history edge case |

### Integration Tests

Run against a live Docker Compose stack. Recommended approach: spin up the full stack in CI, seed test data, and execute HTTP tests against the gateway.

```bash
docker compose up -d
# Wait for health checks
sleep 15
# Run integration suite
npm run test:integration
```

Critical integration scenarios:

- Concurrent seat lock attempts for the same seats (only one should succeed)
- Full booking saga happy path end-to-end
- Saga compensation: payment failure → seats released
- Redis cache invalidation after catalog write
- Idempotent booking: same `idempotencyKey` returns same `bookingId`

### End-to-End Tests

Use [Playwright](https://playwright.dev/) against the Next.js frontend:

```bash
cd frontend
npx playwright test
```

Key E2E flows:
1. Browse movies → select showtime → pick seats → confirm booking
2. Two browsers selecting the same seat (second should see seat locked)
3. Booking history page shows confirmed booking

---

## Deployment Notes

### Docker Compose → Kubernetes

The Docker Compose setup maps cleanly to Kubernetes primitives:

| Docker Compose concept | Kubernetes equivalent |
|---|---|
| `service:` | `Deployment` + `Service` |
| `depends_on` | Init containers or readiness probes |
| `environment:` | `ConfigMap` + `Secret` |
| `volumes:` | `PersistentVolumeClaim` |
| Named network | Cluster DNS (`service-name.namespace.svc.cluster.local`) |
| Nginx container | `Ingress` controller (nginx-ingress or Traefik) |

**Recommended migration path:**

1. Containerise each service (already done).
2. Write a `Deployment` + `ClusterIP Service` per microservice.
3. Deploy PostgreSQL and MongoDB using the official Helm charts (Bitnami).
4. Deploy Redis using `redis-operator` or Bitnami chart.
5. Deploy RabbitMQ using `rabbitmq-cluster-operator`.
6. Replace Nginx container with `nginx-ingress` controller + `Ingress` resources.
7. Store secrets in Kubernetes `Secret` objects or an external vault (HashiCorp Vault / AWS Secrets Manager).

**For seat-service horizontal scaling:** add the `socket.io-redis` adapter to share Socket.io room state across replicas via Redis pub/sub. Configure the `HorizontalPodAutoscaler` to scale on CPU or RabbitMQ queue depth.

---

## Roadmap

| Priority | Feature | Notes |
|---|---|---|
| High | JWT enforcement on all protected routes | Middleware in booking/catalog services |
| High | Payment service integration | Stripe/Razorpay, completes the Saga |
| High | WebSocket seat countdown timer | Broadcast TTL remaining for held seats |
| Medium | Admin dashboard (Next.js) | Movie/showtime management UI |
| Medium | Observability stack | Prometheus + Grafana dashboards; OpenTelemetry traces |
| Medium | CI/CD pipeline | GitHub Actions: lint → test → build → push to registry |
| Medium | Kubernetes manifests | Helm charts per service |
| Low | Notification service | Email/SMS booking confirmation via SendGrid/Twilio |
| Low | Collaborative filtering | Upgrade recommendations from content-based to matrix factorisation |
| Low | Seat-hold WebSocket expiry push | Real-time countdown pushed to browser |
| Low | Multi-region Redis | Redis Cluster sharded by `showtimeId` for global scale |

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a conventional commit message: `feat(booking): add payment retry logic`
4. Push and open a pull request against `main`.
5. Ensure all existing tests pass and new behaviour is covered.
6. One approval required to merge.

### Code Style

- TypeScript services: ESLint + Prettier (standard config)
- Python service: `black` + `ruff`
- Commit messages: [Conventional Commits](https://www.conventionalcommits.org/)

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Author

**Utkarsh Pawade**  
[utkarshpawade2@gmail.com](mailto:utkarshpawade2@gmail.com)  
[GitHub](https://github.com/utkarshpawade2)

---

*Built to demonstrate production-grade microservices architecture: polyglot persistence, distributed locking, saga orchestration, and real-time updates — all running locally with a single `docker compose up`.*
