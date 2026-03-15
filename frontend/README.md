# Frontend — Developer Setup

For full UI documentation, screenshots, and demo flow see the [root README](../README.md).

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Run Locally

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:5173`

## Routes

| Path         | Page                           |
| ------------ | ------------------------------ |
| `/login`     | Operator login                 |
| `/dashboard` | Live case queue + detail panel |
| `/alert`     | Audio ingestion simulator      |
