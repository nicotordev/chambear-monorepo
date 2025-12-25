# Chambear AI Backend

Chambear AI Backend is a Bun + Express API backed by Postgres/Prisma. It exposes job-related endpoints that feed downstream AI workflows (search, scraping, enrichment) and stores normalized job data.

## Project structure

```
.
├── src/
│   ├── index.ts                # Express app bootstrap + healthcheck
│   ├── routes/
│   │   └── jobs.ts              # CRUD endpoints for jobs
│   ├── scraping/
│   │   ├── clients/             # Bright Data, search, and AI clients
│   │   ├── steps/               # Pipeline steps (search/filter/scrape/normalize/persist)
│   │   ├── workflows/           # End-to-end scraping workflows
│   │   ├── config.ts            # Scraping env helpers
│   │   ├── index.ts             # Scraping exports
│   │   └── types.ts             # Shared scraping types
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client setup (Postgres adapter)
│   │   └── generated/           # Prisma client output (auto-generated)
│   └── types/
│       └── prisma.ts            # Prisma client typing wrapper
├── prisma/
│   ├── schema.prisma            # Data model (Jobs, Users, Applications, etc.)
│   └── migrations/              # Prisma migrations
├── .env.example                 # Environment variable template
├── package.json                 # Scripts + dependencies
├── bun.lock                     # Bun lockfile
└── tsconfig.json                # TypeScript config
```

## Tech stack

- Runtime: Bun
- API: Express
- ORM: Prisma + Postgres
- Auth: Clerk (Express middleware)
- Validation: Zod

## Setup

1) Install dependencies

```bash
bun install
```

2) Configure environment variables

```bash
cp .env.example .env
```

3) Generate Prisma client and push schema

```bash
bun run prisma:generate
bun run prisma:push
```

4) Start the API

```bash
bun run dev
```

## API overview

- `GET /health` - healthcheck
- `GET /jobs` - list jobs (auth required)
- `GET /jobs/:id` - job detail (auth required)
- `POST /jobs` - create job (auth required)
- `PUT /jobs/:id` - update job (auth required)
- `DELETE /jobs/:id` - delete job (auth required)

## Scraping pipeline (how it works)

This backend is designed to run a repeatable pipeline that takes search intent and turns it into normalized job records.

1) Search jobs using Google dorks (queries focused on job boards and company sites).
2) Filter and score candidate URLs with AI (keep only relevant job pages).
3) Scrape URLs via Bright Data (sync for small batches, async for discovery/large batches).
4) Normalize raw scrape payloads into the Job schema.
5) Persist jobs to Postgres and store raw payloads in `Job.rawData`.

Key workflow and extension points:
- `src/scraping/workflows/job-scrape.ts` - orchestrates the pipeline.
- `src/scraping/steps/search.ts` - search step (Google dorks provider integration).
- `src/scraping/steps/filter.ts` - AI URL filtering step.
- `src/scraping/steps/scrape.ts` - Bright Data scraping step.
- `src/scraping/steps/normalize.ts` - transform provider data to `JobCreateInput`.
- `src/scraping/steps/persist.ts` - write jobs to the database.

Environment variables expected by the scraping modules:
- `BRIGHTDATA_API_KEY`
- `BRIGHTDATA_DATASET_ID`
- `OPENAI_API_KEY`
- `SEARCH_API_KEY`

## Scraping overview (Bright Data Web Scraper API)

We use Bright Data’s Web Scraper API for automated data collection. It supports synchronous and asynchronous flows with different limits and delivery options.

- Web Scraper API: https://brightdata.com/cp/scrapers/browse
- Docs: https://docs.brightdata.com/
- LLM navigation file: https://docs.brightdata.com/llms.txt

### Synchronous scraping (`/scrape`)

Use for quick, single-URL requests that must return data immediately.

- Real-time response
- Best for small inputs (up to 20 URLs)
- 1-minute timeout; auto-switches to async if exceeded

### Asynchronous scraping (`/trigger`)

Use for high-volume, multi-page, or discovery tasks.

- Returns a `snapshot_id` immediately
- Supports large batches (inputs file up to 1GB)
- Required for discovery-style crawling and multi-page extraction

### Delivery options

- Webhook delivery (JSON, NDJSON, JSON lines, CSV; optional compression)
- External storage delivery (S3, GCS, Snowflake, etc.)
- API download for smaller results

### Management APIs

- List snapshots
- Monitor progress
- Cancel snapshot
- Monitor delivery

Links:
- Get snapshot list: https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/get-snapshots
- Monitor progress: https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/monitor-progress
- Cancel snapshot: https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/cancel-snapshot
- Monitor delivery: https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/monitor-delivery

### System limitations

| Category         | Limit |
|------------------|-------|
| Input            | up to 1GB |
| Webhook delivery | up to 1GB |
| API download     | up to 5GB |
| Delivery API     | unlimited |

### Rate limits & concurrency

| Method                      | Rate-limit |
|----------------------------|------------|
| Up to 20 inputs per request | up to 1500 concurrent requests |
| Over 20 inputs per request  | up to 100 concurrent requests |

## AI directives (scraping workflow)

- Primary workflow: search jobs in Google using dorks -> filter URLs with AI -> scrape URLs -> save jobs.
- Use `llms.txt` from Bright Data docs to discover current API endpoints and schemas.
- Prefer synchronous `/scrape` for simple, single-URL cases; use asynchronous `/trigger` for discovery, multi-page, or large batches.
- Respect rate limits; batch inputs whenever possible.
- Persist raw scrape payloads in `Job.rawData` and normalize into first-class fields (title, company, location, etc.).
- Ensure all writes go through authenticated endpoints and validated schemas.

## Notes

- `src/lib/generated` is Prisma output and should not be edited manually.
- `jobs` endpoints require Clerk auth (`requireAuth`).
- Use `JobSource.EXTERNAL_API` for Bright Data imports.
