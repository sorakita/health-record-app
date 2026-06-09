# 体調管理・生活記録アプリ

睡眠時間、服薬時間、気分、日常行動を記録する単一利用者向けアプリです。認証機能はありません。

## 技術構成

- Frontend: Next.js 15, TypeScript, App Router, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic v2
- Database: PostgreSQL
- Deploy: Frontend は Vercel、Backend は GCP VM を想定
- Local: Docker Compose

## ディレクトリ構成

```text
frontend/
backend/
docs/
```

## 起動手順

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

起動後:

- Frontend: http://localhost:3709
- App: http://localhost:3709/app
- Docs: http://localhost:3709/docs
- Backend: http://localhost:8709
- API docs: http://localhost:8709/docs

Backend コンテナは起動時に `alembic upgrade head` を実行します。

### ローカル開発

PostgreSQL を起動したうえで、Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+psycopg://health_user:health_password@localhost:5709/health_records alembic upgrade head
DATABASE_URL=postgresql+psycopg://health_user:health_password@localhost:5709/health_records uvicorn app.main:app --reload --port 8709
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8709 npm run dev
```

## 画面

- `/`: TOP。アプリ概要、アプリを開くボタン、各設計書リンクを表示します。
- `/app`: 月次一覧、タイムライン、気分、行動記録、編集フォームを表示します。
- `/docs`: Markdown ドキュメント一覧を表示します。
- `/docs/requirements`: 要件定義書を表示します。
- `/docs/basic-design`: 基本設計書を表示します。
- `/docs/detail-design`: 詳細設計書を表示します。

## API

```http
GET /api/v1/records
GET /api/v1/records/{date}
PUT /api/v1/records/{date}
DELETE /api/v1/records/{date}
```

`PUT /api/v1/records/{date}` では `sleep_logs` と `medication_logs` を全件置換します。

例:

```json
{
  "mood_score": 1,
  "daily_action": "朝散歩、買い物",
  "note": "よく眠れた",
  "sleep_logs": [
    {
      "sleep_start": "2026-06-12T22:00",
      "sleep_end": "2026-06-13T07:00"
    }
  ],
  "medication_logs": [
    {
      "taken_at": "2026-06-12T08:00"
    }
  ]
}
```

## DB

Alembic migration:

```text
backend/alembic/versions/202606090001_create_health_records.py
```

PostgreSQL 初期 DDL:

```text
backend/db/init.sql
```

通常の Docker Compose 起動では Alembic migration を使います。`backend/db/init.sql` は手動初期化や確認用の SQL として利用できます。

## Vercel / GCP VM

Frontend を Vercel にデプロイする場合は、環境変数 `NEXT_PUBLIC_API_BASE_URL` に Backend の公開 URL を設定します。

Backend を GCP VM にデプロイする場合は、`DATABASE_URL` と `CORS_ORIGINS` を本番値に設定して起動します。
