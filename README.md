# Pricing Management System

Production-ready HVAC pricing management application.

**Stack:** FastAPI · PostgreSQL · React + TypeScript + Vite + TailwindCSS  
**Deploy:** Backend → [Render](https://render.com) · Frontend → [Vercel](https://vercel.com) · Database → [Supabase](https://supabase.com)

---

## Deployment Guide

### Step 1 — Supabase (PostgreSQL Database)

1. Go to [supabase.com](https://supabase.com) → **New project** → give it a name and a strong DB password.
2. Wait for the project to spin up (~1 min).
3. Go to **Settings → Database → Connection string → URI**.
4. Copy the URI. It looks like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Save it — you'll need it in the next step.

> Tables are created automatically when the backend starts for the first time.

---

### Step 2 — Render (Backend)

1. Push the `pricing-app/` folder to a GitHub repo (or use an existing one).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo. Set **Root Directory** to `backend`.
4. Render will detect `render.yaml` and auto-fill the settings:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add the following **Environment Variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Supabase connection string from Step 1 |
   | `SECRET_KEY` | Any long random string (min 32 chars) — click "Generate" |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
   | `ADMIN_EMAIL` | `admin@yourdomain.com` |
   | `ADMIN_PASSWORD` | A strong password |
   | `FRONTEND_URL` | Leave blank for now, add Vercel URL after Step 3 |
   | `ENVIRONMENT` | `production` |

6. Click **Deploy**. Your backend URL will be:
   ```
   https://pricing-backend.onrender.com
   ```

7. Verify it's running:
   ```
   https://pricing-backend.onrender.com/health
   ```
   → Should return `{"status": "healthy", "version": "1.0.0"}`

8. View interactive API docs at:
   ```
   https://pricing-backend.onrender.com/docs
   ```

---

### Step 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Vite. Framework Preset: **Vite**.
4. Add one **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://pricing-backend.onrender.com` |

5. Click **Deploy**. Your frontend URL will be:
   ```
   https://pricing-app.vercel.app
   ```

6. Go back to **Render → Environment Variables** and set:
   ```
   FRONTEND_URL = https://pricing-app.vercel.app
   ```
   Then click **Save** — Render will redeploy automatically (this fixes CORS).

---

### Step 4 — Import Your Excel Data

Once both services are live:

**Option A — Web UI (recommended)**
1. Open your Vercel URL in a browser.
2. Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set on Render.
3. Go to **Admin → Import Excel**.
4. Upload `Book2.xlsx` and click **Import Now**.

**Option B — CLI script** (run locally against the production DB)
```bash
cd backend
pip install -r requirements.txt
DATABASE_URL="postgresql://..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." python import_excel.py /path/to/Book2.xlsx
```

The import is **idempotent** — safe to run multiple times. Existing products are updated, not duplicated.

---

## Local Development (no Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set DATABASE_URL to your Supabase or a local Postgres URL
uvicorn app.main:app --reload
```
API available at `http://localhost:8000`  
Docs at `http://localhost:8000/docs`

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:8000
npm run dev
```
App available at `http://localhost:5173`

---

## Project Structure

```
pricing-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from environment variables
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models/              # ORM models: Product, Charge, MarginSetting, User
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── repositories/        # Data access layer (all DB queries here)
│   │   ├── services/            # Business logic: auth, pricing, import
│   │   ├── routers/             # Route handlers: auth, products, charges, margins, import, dashboard
│   │   └── auth/                # JWT creation & verification
│   ├── alembic/                 # Migration setup (tables auto-created on startup)
│   ├── import_excel.py          # Standalone CLI import script
│   ├── requirements.txt
│   ├── runtime.txt              # Python 3.11 for Render
│   ├── render.yaml              # Render deployment config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/               # Login, Dashboard, ProductSearch, ProductDetail
    │   │   └── Admin/           # AdminProducts, AdminCharges, AdminMargins, AdminImport
    │   ├── components/          # AppLayout, Sidebar, shared UI components
    │   ├── services/api.ts      # Axios client for all API calls
    │   ├── context/             # AuthContext (JWT), ThemeContext (dark mode)
    │   └── types/index.ts       # TypeScript interfaces
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── vercel.json              # Vercel deployment config (SPA rewrites)
    └── .env.example
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | — | Login → JWT token |
| `GET` | `/api/dashboard` | Any | Stats + recent updates |
| `GET` | `/api/products` | Any | Search & filter products (paginated) |
| `GET` | `/api/products/filters` | Any | Dropdown filter options |
| `GET` | `/api/products/{id}` | Any | Product detail + pricing table |
| `POST` | `/api/products` | Admin | Create product |
| `PUT` | `/api/products/{id}` | Admin | Update product |
| `DELETE` | `/api/products/{id}` | Admin | Delete product |
| `GET` | `/api/charges` | Any | List charge categories |
| `PUT` | `/api/charges/{category}` | Admin | Update charge (customs/freight/handling) |
| `GET` | `/api/margins` | Any | List margin percentages |
| `POST` | `/api/margins` | Admin | Add margin |
| `PUT` | `/api/margins/{id}` | Admin | Update margin |
| `DELETE` | `/api/margins/{id}` | Admin | Delete margin |
| `POST` | `/api/import` | Admin | Upload Excel file |
| `GET` | `/health` | — | Health check |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `products` | One row per indoor/outdoor set — all pricing fields from Excel |
| `charges` | 4 categories (SKD_FOB, SKD_CIF, CBU_FOB, CBU_CIF) — customs, freight, handling |
| `margin_settings` | Configurable discount percentages (default: 15%, 20%, 23%, 27%, 30%) |
| `users` | Admin and viewer accounts with bcrypt password hashing |

All tables are created automatically on first backend startup — no manual migration needed.
