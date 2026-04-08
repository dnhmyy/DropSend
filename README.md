# DropSend

A lightweight, self-hosted file sharing utility focused on speed, privacy, and simplicity.

DropSend provides a streamlined way to transfer files across the web without the friction of account creation or complex management. It is designed to be deployed on personal infrastructure, keeping data under your control with local storage and automated lifecycle management.

## Core Features

- **Anonymous Sharing**: Instant uploads and link generation without registration.
- **Automatic Expiry**: Files can be configured to self-delete after specific intervals (1 hour, 24 hours, or 7 days) to maintain storage efficiency.
- **High Capacity**: Supports large file transfers up to 1GB by default.
- **Privacy by Design**: No tracking or metadata persistence. All data stays on your server.

## Security & Architecture

The application is built with a security-first mindset, incorporating several layers of protection:

- **Traffic Control**: Integrated IP-based rate limiting to mitigate brute-force and resource exhaustion attacks.
- **Hardened Headers**: Strict implementation of Content-Security-Policy (CSP), HSTS, and XSS protection.
- **Secure Cleanup**: A protected administrative endpoint handles the automated removal of expired files, ensuring your storage remains clean without manual intervention.
- **Environment Isolation**: Designed for containerized deployment using non-root execution patterns.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite managed via Prisma ORM
- **Styling**: Modern Vanilla CSS for a zero-dependency UI
