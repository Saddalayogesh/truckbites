# 🚚 TruckBites

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk)](https://openjdk.org/projects/jdk/25/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

**TruckBites** is a full-stack microservices platform for food truck discovery, online ordering, and vendor management. Customers can browse nearby trucks by cuisine and location, place orders, make payments, and leave reviews. Vendors manage their trucks, menus, and orders through a real-time dashboard. Admins oversee the entire system through a centralized admin panel.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Service Matrix](#-service-matrix)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start (Docker Compose)](#-quick-start-docker-compose)
- [Development Setup](#-development-setup)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [RabbitMQ Event Flow](#-rabbitmq-event-flow)

---

## 🏗 Architecture Overview

```mermaid
graph TD
    subgraph Clients
        FE[React Frontend<br/>:5173]
        PM[Postman / API Clients]
    end

    subgraph Gateway
        GW[API Gateway<br/>:8080]
    end

    subgraph "Service Discovery & Config"
        EU[Eureka Server<br/>:8761]
        CS[Config Server<br/>:8888]
    end

    subgraph Auth
        AUTH[Auth Service<br/>:8081]
        AUTH_DB[(Auth MySQL<br/>:3308)]
    end

    subgraph Users
        USER[User Service<br/>:8082]
        USER_DB[(User MySQL<br/>:3309)]
    end

    subgraph "Trucks & Reviews"
        TRUCK[Truck Service<br/>:8083]
        TRUCK_DB[(Truck MySQL<br/>:3310)]
    end

    subgraph Menu
        MENU[Menu Service<br/>:8084]
        MENU_DB[(Menu MySQL<br/>:3311)]
    end

    subgraph Orders
        ORDER[Order Service<br/>:8085]
        ORDER_DB[(Order MySQL<br/>:3312)]
    end

    subgraph Payments
        PAY[Payment Service<br/>:8086]
        PAY_DB[(Payment MySQL<br/>:3313)]
    end

    subgraph Notifications
        NOTIF[Notification Service<br/>:8087]
    end

    subgraph Analytics
        ANALYTICS[Analytics Service<br/>:8088]
        ANALYTICS_DB[(reads Order MySQL)]
    end

    subgraph Message Broker
        RMQ[RabbitMQ<br/>:5672 / :15672]
    end

    subgraph Mail
        BREVO[Brevo SMTP]
    end

    FE -->|REST / GraphQL| GW
    PM -->|REST| GW

    GW -->|/api/auth/**| AUTH
    GW -->|/api/users/**| USER
    GW -->|/api/trucks/**| TRUCK
    GW -->|/api/menu/**| MENU
    GW -->|/api/orders/**| ORDER
    GW -->|/api/payments/**| PAY
    GW -->|/api/notifications/**| NOTIF
    GW -->|/api/analytics/**| ANALYTICS

    AUTH --> AUTH_DB
    USER --> USER_DB
    TRUCK --> TRUCK_DB
    MENU --> MENU_DB
    ORDER --> ORDER_DB
    PAY --> PAY_DB
    ANALYTICS -.->|read-only| ORDER_DB

    MENU -.->|Feign| TRUCK
    ORDER -.->|Feign| TRUCK
    ORDER -.->|Feign| MENU
    TRUCK -.->|Feign| ORDER
    ANALYTICS -.->|Feign| TRUCK

    ORDER --x|order.placed| RMQ
    PAY --x|order.paid| RMQ
    NOTIF x--|order.placed<br/>order.paid| RMQ

    NOTIF -.->|SMTP| BREVO

    AUTH -.->|Register| EU
    USER -.->|Register| EU
    TRUCK -.->|Register| EU
    MENU -.->|Register| EU
    ORDER -.->|Register| EU
    PAY -.->|Register| EU
    NOTIF -.->|Register| EU
    ANALYTICS -.->|Register| EU
    GW -.->|Discover| EU

    CS -.->|Serves config| AUTH
    CS -.->|Serves config| USER
    CS -.->|Serves config| TRUCK
    CS -.->|Serves config| MENU
    CS -.->|Serves config| ORDER
    CS -.->|Serves config| PAY
    CS -.->|Serves config| NOTIF
    CS -.->|Serves config| ANALYTICS

    style GW fill:#6272a4,color:#fff
    style EU fill:#6DB33F,color:#fff
    style CS fill:#6DB33F,color:#fff
    style RMQ fill:#FF6600,color:#fff
    style BREVO fill:#0b5cff,color:#fff
```

### Startup Order

Containers start in strict dependency order, managed by Docker Compose `depends_on` conditions:

```
1.  eureka-server, rabbitmq              (infrastructure, parallel)
2.  config-server                        (after eureka)
3.  auth-mysql, user-mysql, truck-mysql, (6 databases, parallel)
    menu-mysql, order-mysql, payment-mysql
4.  auth-service, user-service, truck-service, (tier-1 services, parallel)
    payment-service, notification-service
5.  menu-service, order-service,          (tier-2 with Feign deps)
    analytics-service
6.  api-gateway                           (last - depends on all)
```

---

## 📊 Service Matrix

| # | Service | Port | Database | Persistence | Auth Required | Role(s) |
|---|---------|------|----------|-------------|---------------|--------|
| 1 | **API Gateway** | `8080` | — | — | Depends on route | — |
| 2 | **Auth Service** | `8081` | `auth-mysql:3308` | JPA (Evolve) | Mixed | Public / ADMIN |
| 3 | **User Service** | `8082` | `user-mysql:3309` | JPA (Evolve) | ✅ All | Any auth |
| 4 | **Truck Service** | `8083` | `truck-mysql:3310` | JPA (Evolve) | Mixed | Public / VENDOR / ADMIN |
| 5 | **Menu Service** | `8084` | `menu-mysql:3311` | JPA (Evolve) | Mixed | Public / VENDOR |
| 6 | **Order Service** | `8085` | `order-mysql:3312` | JPA (Evolve) | Mixed | CUSTOMER / VENDOR / ADMIN |
| 7 | **Payment Service** | `8086` | `payment-mysql:3313` | JPA (Evolve) | ✅ All | Any auth |
| 8 | **Notification Service** | `8087` | — | None (events only) | Mixed | — |
| 9 | **Analytics Service** | `8088` | `order-mysql` (read-only) | JdbcTemplate | ✅ All | VENDOR only |

### Infrastructure

| Component | Port | Description |
|-----------|------|-------------|
| Eureka Server | `8761` | Service discovery (Spring Cloud Netflix Eureka) |
| Config Server | `8888` | Centralized configuration (Spring Cloud Config) |
| RabbitMQ | `5672` / `15672` | Message broker (AMQP + Management UI) |
| Brevo | external | SMTP relay for transactional email notifications |

---

## 🛠 Tech Stack

### Backend
- **Java 25** + **Spring Boot 3.5.5** + **Spring Cloud 2025.0.0**
- **Spring Cloud Netflix Eureka** — service discovery
- **Spring Cloud Config** — centralized config (native profile,
  serves from `./config-repo/`)
- **Spring Cloud Gateway** — API gateway (load-balanced routing via `lb://`)
- **Spring Data JPA** + **MySQL 8** — persistence (one DB per service)
- **Spring Security** + **JWT** (HMAC-SHA256) — authentication & role-based
  authorization (`CUSTOMER`, `VENDOR`, `ADMIN`)
- **Spring Cloud OpenFeign** — inter-service HTTP calls with
  **Resilience4j** circuit breakers and fallback factories
- **Spring Cloud Stream / RabbitMQ** — async event-driven communication
- **Spring Boot Starter Mail** — SMTP email sending via Brevo
- **SpringDoc OpenAPI** — Swagger UI at `/swagger-ui.html` per service
- **Lombok** — boilerplate reduction

### Frontend
- **React 19** (Vite) with **Tailwind CSS 4**
- **Recharts** — sales analytics charts
- **Axios** — HTTP client with JWT interceptors
- **React Router** — client-side routing with protected routes

### DevOps
- **Docker Compose** — 17-container local deployment
- **Multi-stage Dockerfiles** (Maven build → JRE runtime)
- **Healthchecks** on all databases and RabbitMQ

---

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x+
- [Java 25](https://jdk.java.net/25/) (for local development without Docker)
- [Node.js 22+](https://nodejs.org/) (for frontend development)
- [Maven 3.9+](https://maven.apache.org/) (for building services locally)

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/truckbites.git
cd truckbites

# REQUIRED: copy and customize env vars (JWT_SECRET must be set)
cp .env.example .env
# Then generate your own secret and paste it into .env:
#   openssl rand -hex 32
```

> **Note:** `.env` is **required** — `JWT_SECRET` has no default and the stack
> refuses to start without it (a known tutorial secret was removed from the
> codebase for security). `BREVO_SMTP_LOGIN` / `BREVO_SMTP_KEY` are only
> needed if you want the notification service to send emails. Without them, the
> notification service still starts but skips email sending.

> **⚠️ Important:** if you previously exported `JWT_SECRET` in your shell, clear
> it first — a stale export overrides `.env`:
>
> ```bash
> unset JWT_SECRET   # or export JWT_SECRET=<your new value>
> ```
