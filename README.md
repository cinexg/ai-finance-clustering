# Personal Finance Dashboard

A full-stack personal finance application with an ML-powered transaction categorisation engine and a "Human-in-the-loop" override system.

---

## Project Overview

Raw bank transaction data is ingested into a persistent SQLite database and processed through an unsupervised machine learning pipeline. Vendor strings (e.g. `"AMZN Mktp US"`, `"Amazon.com*1A2B3C"`) are vectorized using character-level TF-IDF and clustered via K-Means, letting the data define spending categories instead of brittle string-matching rules.

The **Human-in-the-loop** architecture means the ML model always runs against raw data — keeping it unbiased — while a manual override layer sits at the API boundary. Users can pin any transaction to a custom category; the system persists that choice in SQLite and applies it on every subsequent render without retraining the model. Clearing an override instantly reverts the transaction back to its ML-assigned cluster.

---

## Quick Start (Local Dev)

### Prerequisites

- Python ≥ 3.11
- Node.js ≥ 18

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive API docs are at `http://localhost:8000/docs`.

The SQLite database (`finance.db`) is created and seeded automatically on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

> Both servers must be running simultaneously. The frontend defaults to fetching from `http://localhost:8000` when no `NEXT_PUBLIC_API_URL` environment variable is set.

---

## Deployment Guide (Production)

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com) and connect your repository.
2. Set the **Root Directory** to `backend`.
3. Configure the following commands:

| Setting | Value |
|---|---|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port 8000` |

> `--host 0.0.0.0` is required so Render can bind the service to its external network interface. Omitting it will cause the service to start but remain unreachable.

Once deployed, note your live service URL (e.g. `https://your-api.onrender.com`). You will need it for the frontend step below.

---

### Frontend — Vercel

1. Import your repository on [Vercel](https://vercel.com).
2. In the project settings, configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | `Next.js` |

---

### Environment Variables

This is the most critical step for a working production deployment.

In your Vercel project, navigate to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com` |

**This variable is required.** Without it, the frontend will attempt to call `localhost:8000`, which does not exist in the Vercel environment and will cause all API requests to fail. The value must be the live URL of your deployed Render service, with no trailing slash.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, FastAPI, Uvicorn |
| **ML / Data** | Scikit-learn (KMeans, TfidfVectorizer, StandardScaler), Pandas, NumPy |
| **Database** | SQLite (built-in `sqlite3`, no ORM) |
| **Frontend** | Next.js (App Router), React, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Animation** | Framer Motion |
