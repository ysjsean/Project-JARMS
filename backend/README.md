# Backend — Developer Setup

For full architecture, pipeline, and model documentation see the [root README](../README.md).

## Environment Variables

Create `backend/.env`:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
DASHSCOPE_API_KEY=...
SUPABASE_AUDIO_BUCKET=pab_audio
ALLOWED_ORIGINS=["http://localhost:5173"]
```

## Run Locally

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run fastapi dev
```

Dev server: `http://127.0.0.1:8000` — docs at `/docs`.

## API Summary

| Method | Path                         | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| GET    | `/health`                    | Health check                          |
| GET    | `/cases/`                    | List all cases (with beneficiary)     |
| PATCH  | `/cases/{case_id}`           | Update status / assignment            |
| POST   | `/cases/audio`               | Ingest audio, trigger triage pipeline |
| GET    | `/cases/audio/{case_id}`     | Stream case audio                     |
| GET    | `/cases/operators`           | List operator accounts                |
| WS     | `/cases/{case_id}/nurse-bot` | Nurse bot WebSocket _(WIP)_           |
