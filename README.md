# READIFY Backend

Express (JavaScript, ES modules) API for READIFY. No database is connected yet; see `schema.md`
for the planned Supabase schema.

## Setup

```bash
npm install
npm run dev    # http://localhost:3000/api/health
```

Requires Node 20+. Optional overrides: `PORT` (default `3000`) and `CORS_ORIGIN`
(default `http://localhost:5173`, comma-separated for multiple).

## Structure

```
src/
  server.js                 # starts the HTTP server
  app.js                    # express app: middleware, routes, error handling
  config/
    env.js                  # app configuration (port, CORS origin)
  routes/                   # URL -> controller mapping, one file per feature
    index.js                # mounts all feature routes under /api
  controllers/              # handle req/res, call services
  services/                 # business logic (and database queries later)
  middlewares/
    error.middleware.js     # 404 + JSON error responses
  utils/
    ApiError.js             # throw ApiError.notFound(...) etc. for HTTP errors
```

### Adding a feature (e.g. chapters)

1. `services/chapter.service.js`: business logic
2. `controllers/chapter.controller.js`: reads `req`, calls the service, sends the response
3. `routes/chapter.routes.js`: maps URLs to controllers
4. Mount it in `routes/index.js`: `router.use('/chapters', chapterRoutes)`

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
