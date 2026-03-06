# 7301N – Web-to-PDF API

A self-hosted REST + WebSocket API that converts any public web page into a
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
   - [Scraped-data storage](#post-apiscraped-data)
   - [Server-Sent Events](#get-events)
   - [Channel management](#get-channelcreate)
   - [Static file downloads](#get-downloadsfilen)
   - [WebSocket interface](#websocket-ws)
6. [Query-parameter reference](#query-parameter-reference)
7. [Environment variables](#environment-variables)
8. [Project structure](#project-structure)
9. [Known limitations](#known-limitations)

---

## Overview

`7301N-API3-Web-To-Pdf` accepts a URL via a simple HTTP `GET` request,
renders the page inside a headless Chrome instance, and returns the path to
the generated PDF.  PDFs are stored in a `downloads/` directory at the
project root and served as static files on the `/downloads` path.

Additional features:

- **Scraped-data storage** – a companion `POST` endpoint accepts raw HTML
  snapshots captured by a browser extension or scraper and persists them as
  JSON files.
- **Server-Sent Events** – a streaming `/events` endpoint for progress
  feedback.
- **WebSocket channel bus** – real-time pub/sub channels that clients can
  subscribe to for live state updates.

---

## Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │              Express HTTP Server               │
                    │                  (port 7301)                   │
                    │                                                │
 Client ──HTTP──▶  │  GET  /pdf/generate          → pdf.route       │
                    │  POST /api/scraped-data      → scrap.route     │
                    │  GET  /events                → events.route    │
                    │  GET  /channel/create        → channel.route   │
                    │  GET  /downloads/:file       → express.static  │
                    │                                                │
 Client ──WS───▶   │  ws://…  subscribe/unsubscribe → ChannelManager│
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

| Path | Responsibility |
|------|---------------|
| `src/index.ts` | Express + HTTP server bootstrap; WebSocket wiring |
| `src/modules/browser/browserManager.ts` | Singleton Puppeteer browser; session lifecycle |
| `src/modules/pdf/generatePdf.validation.ts` | Query-string validation & normalisation |
| `src/utils/channelManager.ts` | In-memory pub/sub channel bus |
| `src/utils/downloadDir.ts` | Resolves & ensures the `downloads/` directory |
| `src/routes/pdf.route.ts` | `GET /pdf/generate` handler |
| `src/routes/scrap.route.ts` | `POST /api/scraped-data` handler |
| `src/routes/events.route.ts` | `GET /events` SSE handler |
| `src/routes/channel.route.ts` | `GET /channel/create` stub |
| `src/middleware/globalErrorHandler.ts` | Catches unhandled errors; returns JSON |
| `src/middleware/notFound.ts` | Returns 404 JSON for unknown routes |
| `src/types/index.ts` | Shared TypeScript types |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| Yarn | ≥ 1.22 |
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
`setup-nginx-domain-demo-win.conf`.  To activate it:

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

### `POST /api/scraped-data`

Stores an HTML snapshot together with its source URL.

**Request body** (JSON)

```json
{
  "url": "https://example.com",
  "html": "<html>…</html>"
}
```

**Success response** `200 OK`

```json
{
  "error": false,
  "message": "Data stored successfully",
  "data": {
    "url": "https://example.com",
    "scrapedAt": "2024-04-05T10:30:00.000Z",
    "html": "<html>…</html>"
  }
}
```

Files are written to `data/<timestamp>-<sanitised-url>.json` at the project
root.

---

### `GET /events`

Server-Sent Events stream.  Sends 10 progress messages at random intervals
(up to 1 second each) and then closes the connection.

**Example** (browser)

```js
const source = new EventSource('http://localhost:7301/events');
source.onmessage = (e) => console.log(JSON.parse(e.data));
// { message: "Message 1" } … { message: "Process complete" }
```

---

### `GET /channel/create`

**Status:** Not yet implemented.  Returns `501 Not Implemented`.

Channel management is handled via the WebSocket interface.

---

### `GET /downloads/:filename`

Serves generated PDF files as static assets.

```
GET /downloads/MyPage-1712345678.pdf
```

---

### WebSocket (`ws://`)

Connect to the same port as the HTTP server.  After connecting, send JSON
messages to subscribe or unsubscribe from named channels.

#### Subscribe

```json
{ "type": "subscribe", "channelId": "my-channel-id" }
```

On subscribe, if the channel already exists, the server immediately pushes a
`channelState` event:

```json
{ "type": "channelState", "channel": { "id": "my-channel-id", … } }
```

#### Unsubscribe

```json
{ "type": "unsubscribe", "channelId": "my-channel-id" }
```

#### Server events

| `type` | Payload | Description |
|--------|---------|-------------|
| `channelState` | `{ channel }` | Full channel snapshot sent on subscribe |
| `channelCreated` | `{ channel }` | A new channel was created |
| `channelUpdated` | `{ channel }` | Channel data was updated |
| `channelRemoved` | `{ channelId }` | A channel was deleted |

---

## Query-parameter reference

All parameters are passed as URL query strings to `GET /pdf/generate`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | **required** | Full URL of the web page to convert |
| `id` | `string` | **required** | Unique session identifier |
| `size` | `A3\|A4\|A5\|Legal\|Letter` | `A4` | Paper format |
| `landscape` | `"true"\|"false"` | `false` | Landscape orientation |
| `scale` | `number` (70–150) | `100` | Rendering scale percentage |
| `printBackground` | `"true"\|"false"` | `true` | Include CSS backgrounds |
| `printHeaderFooter` | `"true"\|"false"` | `false` | Show date/URL header and page-number footer |
| `margin` | `number` ≥ 0 | `0` | Global margin (px) applied to all sides |
| `marginTop` | `number` ≥ 0 | `margin` | Top margin override (px) |
| `marginRight` | `number` ≥ 0 | `margin` | Right margin override (px) |
| `marginBottom` | `number` ≥ 0 | `margin` | Bottom margin override (px) |
| `marginLeft` | `number` ≥ 0 | `margin` | Left margin override (px) |
| `autoPrint` | `"true"\|"false"` | `false` | *(reserved)* Auto-print trigger |
| `adjustSinglePage` | `"true"\|"false"` | `false` | *(reserved)* Single-page fit |

**Example**

```
GET /pdf/generate?url=https://example.com&id=sess-001&size=A4&landscape=false&scale=100&printBackground=true&margin=10
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | *(unset)* | Set to `development` to include error stack traces in API responses |

---

## Project structure

```
.
├── Dockerfile                        # Two-stage Docker build
├── package.json
├── tsconfig.json
├── setup-nginx-build.sh              # Nginx activation script
├── setup-nginx-domain-demo-win.conf  # Sample Nginx vhost config
├── downloads/                        # Generated PDFs (git-ignored)
├── data/                             # Stored HTML snapshots (git-ignored)
└── src/
    ├── index.ts                      # Application entry point
    ├── middleware/
    │   ├── globalErrorHandler.ts
    │   └── notFound.ts
    ├── modules/
    │   ├── browser/
    │   │   └── browserManager.ts     # Puppeteer singleton
    │   └── pdf/
    │       └── generatePdf.validation.ts
    ├── routes/
    │   ├── pdf.route.ts
    │   ├── scrap.route.ts
    │   ├── events.route.ts
    │   └── channel.route.ts
    ├── types/
    │   └── index.ts
    └── utils/
        ├── channelManager.ts
        └── downloadDir.ts
```

---

## Known limitations

- **Single browser process** – all PDF requests share one Puppeteer
  browser instance.  Under high concurrency, requests will queue behind
  each other.
- **No authentication** – all endpoints are publicly accessible.  Deploy
  behind an API gateway or add middleware if authentication is required.
- **In-memory channels** – channel state is lost on server restart.
- **`/channel/create` REST endpoint** – not yet implemented; channel
  management is WebSocket-only for now.
- **`/events` demo stream** – the SSE endpoint is a demonstration that
  sends a fixed sequence of 10 messages.  It is not wired to real
  processing progress.
