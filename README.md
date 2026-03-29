# DropSend

Minimalist, self-hosted file sharing. No accounts, fast uploads, automatic expiry.

## Features

*   **No Auth**: Upload and share instantly.
*   **Auto Expiry**: Links expire after a set time (1h, 24h, 1w) or remain permanent.
*   **1GB Limit**: Large file support out of the box.
*   **Privacy-First**: No tracking, no metadata leaks, files stored locally.
*   **Hardened Security**:
    *   IP-based rate limiting on all endpoints.
    *   Strict Content-Security-Policy (CSP).
    *   HSTS and XSS protection headers.
    *   Isolated Docker environment (non-root).

## Stack

*   Next.js 15 (App Router)
*   Prisma + SQLite
*   Vanilla CSS

## Setup (Docker)

The fastest way to deploy is via Docker Compose.

1.  **Clone this repo**.
2.  **Set up environment**:
    Create a `.env` file from the example below. Change `CLEANUP_SECRET` to something strong.
    ```env
    DATABASE_URL="file:/app/data/prod.db"
    CLEANUP_SECRET="generate_a_strong_token_here"
    NEXT_PUBLIC_BASE_URL="http://your-domain.com:8001"
    ```
3.  **Run**:
    ```bash
    docker-compose up -d
    ```
    Access at `http://localhost:8001`.

## Local Development

1.  `npm install`
2.  `npx prisma db push`
3.  `npm run dev`

## File Cleanup

Expired files are purged via a protected API endpoint. Set up a cron job to keep your storage clean:

`POST /api/cleanup`

Send the secret using either:

*   `Authorization: Bearer YOUR_CLEANUP_SECRET`
*   `x-cleanup-secret: YOUR_CLEANUP_SECRET`

**Example Cron (hourly)**:
```bash
0 * * * * curl -s -X POST "http://localhost:8001/api/cleanup" -H "Authorization: Bearer your_secret" > /dev/null
```
