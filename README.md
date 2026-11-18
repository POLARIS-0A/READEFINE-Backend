# READIFY Backend

Express (JavaScript, ES modules) API for READEFINE. Supabase provides authentication,
published chapters, and learner progress; Gemini powers the answer checker.

## Setup

```bash
npm install
npm run dev    # http://localhost:3000/api/health
```

Requires Node 20+. Optional overrides: `PORT` (default `3000`) and `CORS_ORIGIN`
(comma-separated frontend origins; defaults include `http://localhost:5500` and
`http://localhost:5173`). Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY` in `.env` using `.env.sample` as a template.
Keep the secret key in the backend only.

## Deploying (e.g. Render)

The `.env` file is gitignored and is **not** deployed. Set the environment variables in your
hosting provider's dashboard instead (Render: **Environment** → **Add Environment Variable**):
`PORT` (Render sets this automatically), `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL`. The `start` script runs
`node src/server.js` without `--env-file`, so it relies on those injected variables.

Serve `READIFINE-Frontend` from a local web server (for example, VS Code Live Server on port
`5500`) rather than opening the HTML files as `file://` URLs. The frontend calls
`http://localhost:3000/api` by default; set `window.READIFINE_API_URL` before loading `api.js`
to use a different backend URL.

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
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/chapters` | List published chapters |
| GET/POST | `/api/progress` | Read or save learner progress (Bearer token required) |
| POST | `/api/exam/check` | Check an answer with Gemini |
