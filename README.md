# Personal Finance Dashboard

A full-stack, production-grade personal finance application. Raw bank transaction data is ingested into a persistent SQLite database, processed through an unsupervised machine learning pipeline that vectorizes vendor text and clusters spending into semantic categories, and surfaced through a fully interactive CRUD dashboard with dark mode, currency switching, and animated UI components.

The core premise: vendor strings exported from real banks are noisy and inconsistent (`"AMZN Mktp US"`, `"Amazon.com*1A2B3C"`, `"AMZ*Digital"`). Rather than relying on brittle string-matching rules, the backend vectorizes vendor text using character-level TF-IDF and groups transactions via K-Means — letting the data define the categories. Users can then override any ML-generated label with a manually selected category, which the system persists and prioritises on every subsequent render.

---

## Features

### Data Science Pipeline
- **Dirty data handling** — the ingestion layer resolves three classes of real-world quality issues: null numeric values (filled with column median), null vendor strings (coerced to `"Unknown"`), and non-ISO date formats (e.g. `M/D/YYYY`) parsed via `pd.to_datetime(errors='coerce')`.
- **Text feature engineering** — vendor strings are vectorized with `TfidfVectorizer(analyzer='char_wb', ngram_range=(2,4), sublinear_tf=True)`. Character n-grams are chosen over word tokens because they capture abbreviation noise (`"AMZN"` ≈ `"Amazon"`) without a lookup dictionary.
- **Feature combination** — TF-IDF sparse output is converted to dense and horizontally stacked (`np.hstack`) with a `StandardScaler`-normalized `amount` column, giving the model joint signal from both vendor identity and transaction magnitude.
- **Clustering** — `KMeans(n_clusters=5)` groups transactions. Post-fit, each cluster is labeled via a priority-ranked keyword scorer that reads aggregate vendor text per cluster and assigns human-readable names (`Subscriptions`, `Transport`, `Food & Dining`, `Shopping`, `Entertainment & Health`) with guaranteed uniqueness across clusters.
- **Manual override layer** — users may pin any transaction to a custom category. The backend persists this as `manual_category` in SQLite. The ML pipeline re-clusters on every request against the raw data; the override is applied as a display-only layer at the API boundary, keeping the model unbiased.

### Backend API — Full CRUD
- RESTful FastAPI endpoints with Pydantic validation and structured `HTTPException` error handling.
- Partial-update `PUT` semantics: `model_dump(exclude_unset=True)` ensures only explicitly-sent fields are written. This is what allows the frontend to send `manual_category: null` to *clear* an override without accidentally nulling `amount` or `vendor`.
- SQLite persistence via the built-in `sqlite3` module — no ORM. Each DB function opens and closes its own connection via a context manager, keeping the data-access layer thread-safe under Uvicorn.
- Idempotent schema migration: `ALTER TABLE … ADD COLUMN` is wrapped in a `try/except OperationalError` so existing databases upgrade transparently on server restart.
- Database seeded once on first startup with 200 rows of realistic mock data including intentional data quality issues.

### Elite UI
- **Custom animated DatePicker** — built on `react-day-picker` with full Tailwind v4 `classNames` (no default CSS import). The popover uses Framer Motion `scale`/`fade` transitions (`scale: 0.97 → 1`, `y: -4 → 0`, `150ms easeOut`). Day buttons use `h-9 w-9 rounded-xl` with `ring-2 ring-inset` for today and a `shadow-md` elevation for the selected date.
- **Framer Motion transitions** — modal backdrop fades in, panel scales and rises (`scale: 0.95 → 1`, `y: 8 → 0`, `180ms`). Transaction table rows stagger in on load with a 30ms per-row delay capped at row 25.
- **Tailwind v4 Theme Engine** — dark mode is driven by `@custom-variant dark (&:where(.dark, .dark *))` in `globals.css`. This overrides Tailwind v4's default media-query-based dark mode and tells the compiler to respond to the `.dark` class that `next-themes` injects on `<html>` before first paint. `suppressHydrationWarning` on `<html>` silences the expected server/client class mismatch.
- **ThemeToggle `useMounted` guard** — renders an inert placeholder with identical dimensions during SSR and hydration; replaces itself with the interactive button after the first client-side effect fires.
- **Searchable `CategorySelect`** — combobox dropdown with live filtering, "Create `{text}`" option for new categories, and a dedicated "Clear override — revert to ML" footer action. The `Sparkles` icon visually distinguishes ML-suggested selections from user-pinned ones.
- **Pin icon in the table** — any row with a `manual_category` renders a `Pin` icon inside its badge, making the ML / manual split immediately scannable at a glance.
- **Client-side CSV export** — pure JS, no library. Builds an RFC 4180-compliant string (fields with commas/quotes escaped, `\r\n` line endings), creates a `Blob`, triggers download via a transient `<a>` element, and immediately revokes the object URL.

### Internationalisation — Currency Switcher
- A custom `CurrencySelect` dropdown (replaces the native `<select>`) renders a symbol-only label on mobile and a full code label on wider screens.
- Currency preference is managed by `SettingsContext` — a React context backed by `localStorage` so the selection survives page refresh.
- `formatCurrency(value, currency)` uses a lazy `Map<string, Intl.NumberFormat>` cache: each unique currency code gets its `Intl.NumberFormat` instance built once and reused. All money values in the Summary Cards, table rows, and chart tooltip update simultaneously when the currency is switched.
- Supported out of the box: USD, EUR, GBP, INR, JPY.

---

## Responsive Engineering

The dashboard uses a four-tier grid system throughout.

| Breakpoint | Width | Summary Cards | Header |
|---|---|---|---|
| Mobile (`default`) | `< 640px` | 1-column | Icon-only buttons |
| Tablet (`sm:`) | `≥ 640px` | 2-column | Labels visible |
| Large (`lg:`) | `≥ 1024px` | 2-column | Full layout |
| Desktop (`xl:`) | `≥ 1280px` | 4-column | Full layout |

- **Summary Cards** (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`) — four stats: Total Transactions, Total Spent, Avg. Transaction, Clusters.
- **Recharts Chart** — wrapped in `<ResponsiveContainer width="100%" height={300}>` so the donut resizes continuously with the viewport.
- **Transaction Table** — inner `<div className="overflow-x-auto">` contains the `<table>`, keeping horizontal scroll isolated to the card without breaking the page layout.
- **Header controls** — `Export CSV` and `Add Transaction` button labels use `hidden sm:inline`, showing icons only on narrow screens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4 |
| UI / Animation | Framer Motion, Recharts, Lucide React, react-day-picker, date-fns |
| Theming / i18n | next-themes, `Intl.NumberFormat`, React Context + localStorage |
| Backend | Python, FastAPI, Uvicorn, Pydantic v2 |
| Database | SQLite (built-in `sqlite3`) |
| ML / Data | Scikit-learn (KMeans, TfidfVectorizer, StandardScaler), Pandas, NumPy |

---

## How to Run Locally

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- The SQLite database (`finance.db`) is created and seeded automatically on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: `http://localhost:3000`

> Both servers must be running simultaneously. The frontend fetches from `http://localhost:8000/api/clusters` on mount.

---

## Architecture / System Design

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (port 3000)                      │
│                                                               │
│  page.tsx  ─── fetch ──►  GET /api/clusters                  │
│     │           ▲                                             │
│     │           └── POST/PUT/DELETE /api/transactions         │
│     │                                                         │
│     ├── SummaryCard        (4-stat grid, currency-aware)      │
│     ├── ClusterChart       (Recharts donut, responsive)       │
│     ├── TransactionTable   (staggered rows, pin badges)       │
│     ├── TransactionModal   (DatePicker + CategorySelect)      │
│     ├── CurrencySelect     (SettingsContext → localStorage)   │
│     └── ThemeToggle        (next-themes → .dark on <html>)    │
└──────────────────────────────────────────────────────────────┘
                            │ HTTP + CORS
┌───────────────────────────▼──────────────────────────────────┐
│                    FastAPI (port 8000)                        │
│                                                               │
│  main.py  (thin routing layer — no business logic)           │
│  ├── GET  /api/transactions  ──► database.py                  │
│  ├── POST /api/transactions  ──► database.py                  │
│  ├── PUT  /api/transactions/{id}  ──► database.py             │
│  ├── DELETE /api/transactions/{id}  ──► database.py           │
│  └── GET  /api/clusters  ──► database.py ──► ml_service.py   │
│                                                               │
│  database.py   (SQLite CRUD, idempotent migration)            │
│  ml_service.py (pure fn: list[dict] → list[dict])             │
│  ├── Clean     (Pandas: coerce dates, fill nulls)             │
│  ├── Vectorize (TF-IDF char n-grams)                          │
│  ├── Scale     (StandardScaler on amount)                     │
│  └── Cluster   (KMeans → priority-ranked labels)             │
│                                                               │
│  finance.db    (SQLite — persisted, seeded on first boot)     │
└──────────────────────────────────────────────────────────────┘
```

**Separation of concerns — four hard boundaries:**

1. `database.py` has no ML knowledge. It is a pure data-access layer: SQL in, `list[dict]` out.
2. `ml_service.py` is a stateless pure function. It receives a `list[dict]`, returns a `list[dict]`. It has no knowledge of HTTP, SQLite, or the frontend contract.
3. `main.py` is a thin routing layer. Route handlers contain no business logic — they delegate entirely to `database.py` and `ml_service.py`.
4. The frontend has no awareness of the ML implementation. It consumes a typed JSON contract (`Transaction`) and renders it. Swapping K-Means for DBSCAN, or changing the number of clusters, requires zero frontend changes provided `cluster_id`, `cluster_name`, and `manual_category` remain in the response schema.
