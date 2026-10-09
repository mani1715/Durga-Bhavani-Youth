# Durga Bhavani Youth — Garuvupalem (దుర్గాభవాని యూత్ — గరువుపాలెం)
## Railway Production Deployment Guide (1 Repo, 2 Services)

---

### Architecture Overview

This project is configured as a monorepo designed for Railway deployment with **ONE GitHub repository** connected to **TWO Railway services**:

```
GitHub Repository (Root)
│
├── /backend  ──────────────►  Railway Service 1: Backend API (FastAPI)
│                                  • Connects to Supabase PostgreSQL (SSL)
│                                  • Connects to Supabase Storage (festival-public / festival-private)
│                                  • Binds to 0.0.0.0 via Railway $PORT
│                                  • Health check: /health & /api/health
│
└── /frontend ──────────────►  Railway Service 2: Frontend Client (React + Vite)
                                   • Production static build (dist/)
                                   • Node.js production server with SPA fallback (server.mjs)
                                   • Connects to Backend via VITE_API_URL or server reverse-proxy
                                   • Binds to 0.0.0.0 via Railway $PORT
                                   • Health check: /health
```

---

### Service 1: Backend Service Configuration

* **Railway Root Directory**: `/backend`
* **Builder**: `Nixpacks` (or `Procfile`)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
  *(Also configured via `backend/Procfile` and `backend/railway.json`)*
* **FastAPI App Import Path**: `app.main:app` (since the root directory is `/backend`)
* **Health Check Path**: `/health` (also available at `/api/health`)

#### Backend Environment Variables

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Auto | *(Injected automatically by Railway)* | Port assigned dynamically by Railway |
| `PROJECT_NAME` | Optional | `31వ దేవీ శరన్నవరాత్రి మహోత్సవములు | గరువుపాలెం` | Platform identification string |
| `DATABASE_URL` | **Yes** | `postgresql://postgres.[ref]:[pwd]@[host]:5432/postgres?sslmode=require` | Supabase PostgreSQL pooled connection URL |
| `DB_POOL_SIZE` | Optional | `10` | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | Optional | `5` | Maximum overflow connections |
| `SUPABASE_URL` | **Yes** | `https://meueaxsmoectbhfnwlly.supabase.co` | Supabase project API base URL |
| `SUPABASE_STORAGE_SECRET` | **Yes** | `[your_supabase_service_role_or_sb_secret]` | Privileged Storage credential (never exposed to frontend) |
| `SUPABASE_PUBLIC_BUCKET` | Optional | `festival-public` | Public bucket for published photos and temple media |
| `SUPABASE_PRIVATE_BUCKET`| Optional | `festival-private` | Private bucket for receipts, bills, and internal documents |
| `STORAGE_TYPE` | **Yes** | `supabase` | Direct remote Supabase storage (no ephemeral container disk dependence) |
| `JWT_SECRET` | **Yes** | `[generate_64_char_random_hex_string]` | Secret key used to sign JWT session tokens |
| `JWT_ALGORITHM` | Optional | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | `120` | Session access token lifespan |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Optional | `7` | Refresh token lifespan |
| `CORS_ORIGINS` | **Yes** | `https://[your-frontend].up.railway.app,https://garuvupalem-dasara.org` | Explicit allowed frontend origins (comma-separated) |
| `ALLOW_RAILWAY_PREVIEWS` | Optional | `true` | Allows preview subdomains matching `*.railway.app` |

---

### Service 2: Frontend Service Configuration

* **Railway Root Directory**: `/frontend`
* **Builder**: `Nixpacks`
* **Build Command**: `npm install && npm run build`
* **Start Command**: `node server.mjs`
  *(Also configured via `frontend/Procfile` and `frontend/railway.json`)*
* **Health Check Path**: `/health`

#### SPA Fallback Architecture

`frontend/server.mjs` provides production single-page application (SPA) routing:
- Any requested static file in `dist/` (JavaScript, CSS, fonts, images) is served directly with optimal cache headers (`public, max-age=31536000, immutable` for hashed assets).
- Any non-file navigation route (`/login`, `/donations`, `/expenses`, `/festival-management`, `/overview`, `/reports`, `/settings`, `/team`, `/verify`) returns `dist/index.html` with status 200, ensuring page refreshes and direct URL navigation always work without 404 errors.
- If `BACKEND_URL` is set, incoming `/api/*` requests can also be reverse-proxied directly by the server, eliminating CORS overhead.

#### Frontend Environment Variables

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Auto | *(Injected automatically by Railway)* | Port assigned dynamically by Railway |
| `VITE_API_URL` | **Yes** | `https://[your-backend].up.railway.app` | Public URL of the deployed Railway backend service |
| `BACKEND_URL` | Optional | `https://[your-backend].up.railway.app` | Server-side reverse proxy destination in `server.mjs` |

> [!CAUTION]
> **Credential Security**: Never add `DATABASE_URL`, `SUPABASE_STORAGE_SECRET`, or `JWT_SECRET` to the Frontend Railway service. The frontend only communicates with the backend via public REST API endpoints.

---

### Step-by-Step Deployment Instructions

#### Step 1: Push Repository to GitHub
1. Initialize/push the repository to your private or organization GitHub repository.
2. Verified that `.gitignore` prevents `.env`, local SQLite files (`*.db`), and private donor backups (`*backup*.json`) from being pushed.

#### Step 2: Create Railway Project & Backend Service
1. In the [Railway Dashboard](https://railway.app), click **New Project** → **Deploy from GitHub repo**.
2. Select the Garuvupalem repository.
3. In the service settings:
   - Rename service to **backend** (e.g., `garuvupalem-backend`).
   - Set **Root Directory**: `/backend`.
   - Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
4. Go to **Variables** tab and add the Backend Environment Variables:
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_STORAGE_SECRET`, `STORAGE_TYPE=supabase`, `JWT_SECRET`, etc.
5. In **Settings** → **Networking**, click **Generate Domain** to get your backend domain (e.g. `https://garuvupalem-backend.up.railway.app`).
6. Wait for deployment to succeed. Test health:
   ```bash
   curl -i https://garuvupalem-backend.up.railway.app/health
   # Returns: {"status":"healthy","database":"connected","database_type":"postgresql","storage_type":"supabase"}
   ```

#### Step 3: Create Frontend Service
1. In the same Railway project canvas, click **+ New** → **GitHub Repo** → select the same repository.
2. In the service settings:
   - Rename service to **frontend** (e.g., `garuvupalem-frontend`).
   - Set **Root Directory**: `/frontend`.
   - Set **Build Command**: `npm install && npm run build`.
   - Set **Start Command**: `node server.mjs`.
3. In **Variables** tab:
   - Add `VITE_API_URL`: `https://garuvupalem-backend.up.railway.app` (your backend URL from Step 2).
   - Add `BACKEND_URL`: `https://garuvupalem-backend.up.railway.app`.
4. In **Settings** → **Networking**, click **Generate Domain** (or assign custom domain).
5. Deploy the frontend service.

#### Step 4: Finalize CORS on Backend
1. Go back to the **backend** service in Railway.
2. Update the `CORS_ORIGINS` variable:
   - `CORS_ORIGINS`: `https://[your-frontend-domain].up.railway.app` (and your custom domain if applicable).
3. Railway will restart the backend automatically to apply the new CORS origins.

#### Step 5: Verification Checklist
- [x] Public home page loads in Telugu by default (`/`).
- [x] Language switcher toggles cleanly between Telugu and English (`తెలుగు | English`).
- [x] Public receipt verification works (`/verify`).
- [x] Committee login succeeds (`/login`).
- [x] Refreshing admin pages (`/donations`, `/expenses`, `/festival-management`) reloads cleanly without 404.
- [x] Real-time Telugu transliteration suggestions appear in donation form.
- [x] Uploaded photos persist in Supabase Storage (`festival-public` / `festival-private`).
