# 7301N – Web-to-PDF API

A self-hosted REST API that converts any public web page into a
PDF file using a headless Chromium browser (Puppeteer).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
   - [Development](#development)
   - [Production build](#production-build)
   - [Docker](#docker)
   - [Nginx reverse-proxy](#nginx-reverse-proxy)
5. [API Reference](#api-reference)
   - [PDF generation](#get-pdfgenerate)
   - [Static file downloads](#get-downloadsfilen)
6. [Query-parameter reference](#query-parameter-reference)
7. [Environment variables](#environment-variables)
8. [Project structure](#project-structure)
9. [Known limitations](#known-limitations)
10. [License](#license)

---

## Overview

`7301N-API3-Web-To-Pdf` accepts a URL via a simple HTTP `GET` request,
renders the page inside a headless Chrome instance, and returns the path to
the generated PDF. PDFs are stored in a `downloads/` directory at the
project root and served as static files on the `/downloads` path.

Additional features:

- **Static file serving** – generated PDFs are served on the `/downloads`
  path.

---

## Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │              Express HTTP Server               │
                    │            (port from PORT env var)            │
                    │                                                │
 Client ──HTTP──▶  │  GET  /pdf/generate          → pdf.route       │
                    │  GET  /downloads/:file       → express.static  │
                    └────────────────┬──────────────────────────────┘
                                     │
                                     ▼
                           ┌─────────────────┐
                           │  BrowserManager  │
                           │  (Puppeteer /    │
                           │   Chromium)      │
                           └─────────────────┘
                                     │ generates
                                     ▼
                           downloads/<title>.pdf
```

### Key modules

| Path                                        | Responsibility                                 |
| ------------------------------------------- | ---------------------------------------------- |
| `src/index.ts`                              | Express + HTTP server bootstrap                |
| `src/config.ts`                             | Centralised environment configuration          |
| `src/middleware/apiKeyAuth.ts`              | API key authentication guard                   |
| `src/modules/browser/browserManager.ts`     | Singleton Puppeteer browser; session lifecycle |
| `src/modules/pdf/generatePdf.validation.ts` | Query-string validation & normalisation        |
| `src/utils/downloadDir.ts`                  | Resolves & ensures the `downloads/` directory  |
| `src/routes/pdf.route.ts`                   | `GET /pdf/generate` handler                    |
| `src/middleware/globalErrorHandler.ts`      | Catches unhandled errors; returns JSON         |
| `src/middleware/notFound.ts`                | Returns 404 JSON for unknown routes            |
| `src/types/index.ts`                        | Shared TypeScript types                        |

---

## Prerequisites

| Tool              | Version                              |
| ----------------- | ------------------------------------ |
| Node.js           | ≥ 20                                 |
| Yarn              | ≥ 1.22                               |
| Chromium / Chrome | installed automatically by Puppeteer |

---

## Getting Started

### Development

```bash
# 1. Install dependencies
yarn install

# 2. (First time) Download the Puppeteer-managed Chromium browser
npx puppeteer browsers install chrome

# 3. Start the dev server with hot-reload
yarn dev
# → http://localhost:7301
```

### Production build

```bash
yarn build   # compiles TypeScript → dist/
yarn start   # runs node dist/index.js
```

### Docker

```bash
# Build image
docker build -t web-to-pdf .

# Run container (maps port 7301)
docker run -p 7301:7301 web-to-pdf
```

The `Dockerfile` uses a two-stage build:

1. **Build stage** – installs all dependencies, downloads Chromium, and
   compiles TypeScript.
2. **Runtime stage** – copies only `dist/`, `node_modules/`, and the
   Puppeteer Chromium cache into a slim `node:22-slim` image.

### Nginx reverse-proxy

A sample configuration is provided in
`setup-nginx-domain-demo-win.conf`. To activate it:

```bash
bash setup-nginx-build.sh
# or manually:
sudo cp setup-nginx-domain-demo-win.conf /etc/nginx/sites-available/api3.bikiran.win
sudo ln -s /etc/nginx/sites-available/api3.bikiran.win /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## API Reference

### `GET /pdf/generate`

Converts a web page to a PDF and saves it to `downloads/`.

**Query parameters** – see the full [query-parameter reference](#query-parameter-reference) below.

**Success response** `200 OK`

```json
{
  "error": false,
  "message": "PDF generated successfully",
  "pdfUrl": "/downloads/MyPage-1712345678.pdf"
}
```

**Error response** `400 Bad Request` (validation failure)

```json
{
  "error": true,
  "message": {
    "url": "url is required and must be a string"
  }
}
```

**Error response** `500 Internal Server Error`

```json
{
  "error": true,
  "message": "Failed to generate PDF. <details>"
}
```

---

### `GET /downloads/:filename`

Serves generated PDF files as static assets.

```
GET /downloads/MyPage-1712345678.pdf
```

---

## Query-parameter reference

All parameters are passed as URL query strings to `GET /pdf/generate`.

| Parameter           | Type                        | Default      | Description                                 |
| ------------------- | --------------------------- | ------------ | ------------------------------------------- |
| `url`               | `string`                    | **required** | Full URL of the web page to convert         |
| `id`                | `string`                    | **required** | Unique session identifier                   |
| `size`              | `A3\|A4\|A5\|Legal\|Letter` | `A4`         | Paper format                                |
| `landscape`         | `"true"\|"false"`           | `false`      | Landscape orientation                       |
| `scale`             | `number` (70–150)           | `100`        | Rendering scale percentage                  |
| `printBackground`   | `"true"\|"false"`           | `true`       | Include CSS backgrounds                     |
| `printHeaderFooter` | `"true"\|"false"`           | `false`      | Show date/URL header and page-number footer |
| `margin`            | `number` ≥ 0                | `0`          | Global margin (px) applied to all sides     |
| `marginTop`         | `number` ≥ 0                | `margin`     | Top margin override (px)                    |
| `marginRight`       | `number` ≥ 0                | `margin`     | Right margin override (px)                  |
| `marginBottom`      | `number` ≥ 0                | `margin`     | Bottom margin override (px)                 |
| `marginLeft`        | `number` ≥ 0                | `margin`     | Left margin override (px)                   |
| `autoPrint`         | `"true"\|"false"`           | `false`      | _(reserved)_ Auto-print trigger             |
| `adjustSinglePage`  | `"true"\|"false"`           | `false`      | _(reserved)_ Single-page fit                |

**Example**

```
GET /pdf/generate?url=https://example.com&id=sess-001&size=A4&landscape=false&scale=100&printBackground=true&margin=10
```

---

## Environment variables

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

| Variable                | Default      | Description                                                           |
| ----------------------- | ------------ | --------------------------------------------------------------------- |
| `NODE_ENV`              | `production` | Set to `development` to include error stack traces in API responses   |
| `PORT`                  | `7301`       | Port the HTTP server listens on                                       |
| `HOST`                  | `0.0.0.0`    | Network interface to bind to                                          |
| `API_KEY`               | _(empty)_    | API key for authentication. Leave empty to disable auth (open access) |
| `CORS_ORIGINS`          | `*`          | Comma-separated allowed origins, or `*` for all                       |
| `RATE_LIMIT_MAX`        | `20`         | Max requests per IP per window                                        |
| `RATE_LIMIT_WINDOW_MIN` | `1`          | Rate-limit window duration in minutes                                 |
| `VIEWPORT_WIDTH`        | `1920`       | Puppeteer viewport width (px)                                         |
| `VIEWPORT_HEIGHT`       | `2080`       | Puppeteer viewport height (px)                                        |
| `PAGE_LOAD_TIMEOUT`     | `30000`      | Max time (ms) to wait for page navigation                             |
| `PAGE_CREATE_TIMEOUT`   | `10000`      | Max time (ms) to wait for new browser tab creation                    |
| `POST_LOAD_DELAY`       | `2000`       | Delay (ms) after page load before PDF generation                      |
| `HEADLESS`              | `true`       | Run Puppeteer in headless mode                                        |
| `JSON_BODY_LIMIT`       | `10mb`       | Max JSON request body size                                            |

### Authentication

When `API_KEY` is set, all `/pdf/*` endpoints require a valid key via:

- **Header**: `x-api-key: <your-key>`
- **Query param**: `?apiKey=<your-key>`

The UI pages (landing page & playground) automatically detect whether auth
is enabled and will prompt for the API key when needed.

---

## Project structure

```
.
├── .env.example                      # Environment variable template
├── Dockerfile                        # Two-stage Docker build
├── package.json
├── tsconfig.json
├── setup-nginx-build.sh              # Nginx activation script
├── setup-nginx-domain-demo-win.conf  # Sample Nginx vhost config
├── downloads/                        # Generated PDFs (git-ignored)
└── src/
    ├── index.ts                      # Application entry point
    ├── config.ts                     # Centralised env-based configuration
    ├── middleware/
    │   ├── apiKeyAuth.ts             # API key authentication middleware
    │   ├── globalErrorHandler.ts
    │   └── notFound.ts
    ├── modules/
    │   ├── browser/
    │   │   └── browserManager.ts     # Puppeteer singleton
    │   └── pdf/
    │       └── generatePdf.validation.ts
    ├── routes/
    │   └── pdf.route.ts
    ├── types/
    │   └── index.ts
    └── utils/
        └── downloadDir.ts
```

---

## Security

The API ships with multiple security layers that can be activated via
environment variables:

| Feature                 | How to enable                                                  |
| ----------------------- | -------------------------------------------------------------- |
| **API key auth**        | Set `API_KEY` env var                                          |
| **Rate limiting**       | Enabled by default (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MIN`) |
| **CORS restrictions**   | Set `CORS_ORIGINS` to specific origins                         |
| **Helmet HTTP headers** | Always on (CSP, HSTS, X-Frame-Options, etc.)                   |

---

## Known limitations

- **Single browser process** – all PDF requests share one Puppeteer
  browser instance. Under high concurrency, requests will queue behind
  each other.

---

## License

This project is licensed under the [MIT License](LICENSE).
