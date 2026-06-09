# 基本設計書

## システム構成

本アプリは `frontend/`、`backend/`、`docs/` のモノレポ構成で実装する。

- `frontend/`: Next.js 15 App Router による UI
- `backend/`: FastAPI による REST API
- `docs/`: Markdown ドキュメント
- PostgreSQL: 記録データを永続化

## コンテナ構成

Docker Compose では以下のサービスを起動する。

- `db`: PostgreSQL
- `backend`: FastAPI、Alembic migration 実行後に Uvicorn 起動
- `frontend`: Next.js production server

## 画面設計

### TOP

アプリ概要と主要導線を配置する。

- `/app` へのリンク
- `/docs/requirements` へのリンク
- `/docs/basic-design` へのリンク
- `/docs/detail-design` へのリンク

### アプリ画面

月単位の記録を読み込み、選択日を編集できる。

- 月入力
- 日付入力
- 月ビュー、週ビュー、日ビューのタブ
- 表示中のビューに応じた前後移動ボタン
- 月ビューの気分カレンダー
- 選択日の睡眠・服薬タイムライン
- 選択日を含む週 7 日分の横並び比較表示
- 日次記録フォーム
- 気分の月次表示
- 行動記録一覧

### ドキュメント画面

`docs/` 配下の Markdown ファイルを Next.js のサーバーコンポーネントで読み込み、簡易 Markdown renderer で HTML 表示する。

### 週次表示

選択日を含む月曜始まりの 7 日分を表示する。

- 各行に日付、タイムライン、気分、行動記録を横並びで配置する。
- 睡眠はタイムライン上に青色の帯で表示する。
- 服薬はタイムライン上の `taken_at` 時刻位置に `×` マークで表示する。
- 行クリックで対象日を選択し、日次記録フォームの編集対象を切り替える。

### ビュー切り替え

アプリ画面はタブで以下を切り替える。

- 月ビュー: 気分カレンダーを主役にし、行動記録一覧を補助表示する。
- 週ビュー: 選択日を含む 7 日分の横並び比較表示を表示する。
- 日ビュー: 選択日のタイムラインと日次記録フォームを表示し、保存ボタンを画面下部に固定する。

`<` と `>` の操作は、月ビューでは前月/次月、週ビューでは前週/次週、日ビューでは前日/翌日に移動する。

## API 設計

### GET `/api/v1/records`

日次記録一覧を返す。

任意クエリ:

- `start_date`
- `end_date`

月ビューの取得では `start_date` と `end_date` を指定する。

### GET `/api/v1/records/{date}`

指定日の記録を返す。存在しない場合は `404` を返す。

### PUT `/api/v1/records/{date}`

指定日の記録を upsert する。

リクエストボディ:

- `mood_score`
- `daily_action`
- `note`
- `sleep_logs`
- `medication_logs`

`sleep_logs` と `medication_logs` は既存データを削除して全件再作成する。

### DELETE `/api/v1/records/{date}`

指定日の記録を削除する。存在しない場合も `204` を返す。

## データ設計

`daily_records.record_date` はユニークとし、1 日 1 レコードに制限する。

`sleep_logs.daily_record_id` と `medication_logs.daily_record_id` は `daily_records.id` を参照し、日次記録削除時には cascade delete する。

## バリデーション

- `mood_score` は `-2` 以上 `2` 以下。
- `sleep_end` は `sleep_start` より後。
- `sleep_start` の日付はパスの日付と一致させる。
- `taken_at` の日付はパスの日付と一致させる。

## デプロイ方針

### Frontend

Vercel にデプロイする。`NEXT_PUBLIC_API_BASE_URL` に GCP VM 上の Backend URL を設定する。

### Backend

GCP VM 上で Docker Compose または単体 Docker コンテナとして起動する。`DATABASE_URL` で PostgreSQL 接続先を指定する。
