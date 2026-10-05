# Server Monitor

A NestJS-based monitoring and incident-response prototype for collecting logs from remote servers, analysing anomalies, creating tickets, and optionally resolving issues automatically through AI-assisted SSH commands.

This repository is structured as a small monorepo with:

- `apps/nest-app`: the main API backend
- `apps/dummy-log-generator`: a sample log producer used to simulate incoming server logs

## What the project does

The application is designed around a simple operational workflow:

1. A user configures a remote server and log source.
2. A log-analysis job is created and tied to that server.
3. Logs are ingested by the API.
4. The app creates anomaly records for abnormal entries.
5. Ticketing events are emitted and translated into ticket payloads.
6. An LLM evaluates whether a ticket can be resolved automatically via SSH.
7. If the configuration allows it and the plan is safe, the system attempts remediation.

The project combines:

- NestJS + TypeORM for the backend
- SQLite for local persistence
- Swagger for API docs
- Event-driven anomaly and ticket workflows
- OpenAI via the AI SDK for contextual analysis and remediation planning
- Node SSH for remote command execution
- Vitest for automated tests

## Architecture overview

The main app is in `apps/nest-app` and includes the following modules:

- `auth`: global app guard and current-user middleware-like behavior
- `users`: user access model
- `remote-servers`: stores remote server metadata and SSH configuration
- `log-sources`: stores the configured log sources for a user
- `log-analysis`: manages jobs and anomaly generation from incoming logs
- `ticketing`: translates anomalies into ticketing provider payloads
- `queries`: fetches contextual data needed for ticket and remediation decisions
- `llm`: LLM access layer using the OpenAI SDK

The event flow is centered on anomaly creation and ticket creation events. Once an anomaly is created, the ticketing workflow gathers relevant context and may trigger a monitoring/remediation flow that decides whether a safe SSH command can fix the issue.

## Tech stack

- Node.js
- TypeScript
- NestJS 11
- TypeORM
- better-sqlite3
- Swagger
- OpenAI AI SDK
- Node SSH
- Vitest
- pnpm workspaces

## Repository layout

```text
.
├── apps/
│   ├── dummy-log-generator/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── index.js
│   │   └── README.md
│   └── nest-app/
│       ├── src/
│       ├── test/
│       ├── package.json
│       ├── README.md
│       ├── tsconfig.json
│       └── vitest*.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20+
- pnpm
- An OpenAI API key available in the environment if you want the AI-based anomaly and remediation flow to run

## Getting started

From the repository root:

```bash
pnpm install
```

This workspace is configured as a pnpm monorepo, so dependencies for both apps are managed from the root.

## Run the API

Start the Nest app in development mode:

```bash
cd apps/nest-app
pnpm run start:dev
```

The API listens on port `3000` by default and exposes Swagger at:

```text
http://localhost:3000/api
```

You can also run a production-style build:

```bash
cd apps/nest-app
pnpm run build
pnpm run start:prod
```

## Run the dummy log generator

The dummy generator emits sample log lines for testing the ingest flow:

```bash
cd apps/dummy-log-generator
pnpm install
pnpm run start
```

It serves sample endpoints and can emit normal logs plus error-heavy scenarios. This is intended for local validation of ingestion and anomaly creation.

## Core API flow

The backend exposes a set of authenticated controller routes using a default demo user in the current implementation.

### Authentication

```http
GET /auth/me
```

### Remote servers

```http
GET    /remote-servers
POST   /remote-servers
GET    /remote-servers/:id
PATCH  /remote-servers/:id
DELETE /remote-servers/:id
```

### Log sources

```http
GET    /log-sources
POST   /log-sources
GET    /log-sources/:id
PATCH  /log-sources/:id
DELETE /log-sources/:id
```

### Log analysis jobs

```http
GET    /log-analysis-jobs
POST   /log-analysis-jobs
GET    /log-analysis-jobs/:id
PATCH  /log-analysis-jobs/:id
DELETE /log-analysis-jobs/:id
```

### Log ingestion

```http
POST /log-analysis/ingest/:jobId
```

This accepts an array of structured log objects and converts them into anomaly records tied to the job.

## Example local workflow

A typical demo flow looks like this:

1. Start the API.
2. Start the dummy log generator.
3. Create a remote server entry with SSH configuration if you want remediation support.
4. Create a log source and a log analysis job.
5. Send generated logs to the ingest endpoint for that job.
6. Watch for anomalies and created tickets in the application flow.
7. If the environment and server config allow it, the monitoring service may decide to run a safe SSH command.

## Testing

Run the unit and integration tests from `apps/nest-app`:

```bash
cd apps/nest-app
pnpm run test
pnpm run test:watch
pnpm run test:integration
pnpm run test:e2e
```

The project includes a mix of service-level tests and integration/e2e coverage around anomaly and ticket creation flows.

## Important implementation notes

- The project currently uses a global app guard that injects a default demo user instead of real authentication.
- The database is configured as SQLite and uses `synchronize: true`, which is convenient for local development and demos.
- The AI-assisted troubleshooting flow depends on `OPENAI_API_KEY` being available in the runtime environment.
- The monitoring logic is intentionally conservative: it only attempts SSH remediation when the configured server state and the LLM decision permit it.

## Current status

This repository is best understood as a functional prototype / demo application for server monitoring and automated incident handling, not a full production SaaS platform. It demonstrates the core architecture and event-driven flow rather than a hardened production deployment setup.

## License

This project does not currently declare a full OSS license in the package metadata, so license status should be clarified before public redistribution or production deployment.
