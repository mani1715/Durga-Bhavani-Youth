# Durga-Bhavani-Youth
దుర్గాభవాని యూత్ — గరువుపాలెం (Garuvupalem)
31st Devi Sharannavaratri Mahotsavam Web Application

Official community web portal and committee management system for Sri Durga Bhavani Youth, Garuvupalem. Built with React (TypeScript), FastAPI (Python), Supabase PostgreSQL, and Supabase Storage.

---

## 🌟 Features
- **Public Devotional Portal**: Festival schedule, daily alankarams, cultural activities, harathi timings, and verified donor roll.
- **Bilingual Interface**: Full support for Telugu (తెలుగు) and English with instant language toggle and persistent preference.
- **Online Receipt Verification**: Instant QR-code / receipt-number lookup for devotees and donors.
- **Committee Dashboard**:
  - Secure role-based committee login.
  - Cash and material contribution logging with real-time Telugu name transliteration suggestions.
  - Custom category creation directly inside contribution modals.
  - Daily festival schedule & photos management with Supabase Storage integration.
  - Expense tracking and financial balance summaries.
  - Complete tamper-evident audit history and database backup management.

---

## 🏗️ Project Structure
```text
.
├── frontend/             # React + Vite + Tailwind CSS SPA
│   ├── src/             # Frontend application source
│   ├── public/          # Devotional assets and icons
│   ├── server.mjs       # Zero-dependency production Node.js server (SPA fallback)
│   ├── railway.json     # Railway service deployment configuration
│   └── Procfile         # Process definition for web deployment
│
├── backend/              # FastAPI Python backend
│   ├── app/             # Routers, database models, schemas, and services
│   ├── Procfile         # Process definition (uvicorn app.main:app)
│   ├── railway.json     # Railway service deployment configuration
│   └── requirements.txt # Python runtime dependencies
│
└── RAILWAY_DEPLOYMENT_GUIDE.md # Complete step-by-step guide for Railway hosting
```

---

## 🚀 Deployment (Railway)
This project is prepared for deployment on **Railway** as **Two Services** from this single repository:

1. **Backend Service**:
   - **Root Directory**: `/backend`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
   - **Healthcheck Path**: `/health`

2. **Frontend Service**:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.mjs`
   - **Healthcheck Path**: `/health`

For complete environment variable configuration and deployment steps, see [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md).

---

## 💻 Local Development

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Note
All production secrets, Supabase connection strings, service credentials, and private backups are strictly excluded from version control via `.gitignore`. Provide your credentials through Railway or your local `.env` files.
