# registry.swibe.dev

Swibe Plugin Registry — Edge Worker

## Deploy to Cloudflare

```bash
npm install -g wrangler
wrangler login
wrangler deploy registry/worker.js
```

## Endpoints

```
GET /              — Registry info
GET /packages      — All packages
GET /packages/:name — Specific package
GET /plugins       — All plugins
GET /search?q=     — Search
```

## Local test

```bash
wrangler dev registry/worker.js
```
