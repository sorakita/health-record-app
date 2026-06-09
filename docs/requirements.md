# 要件定義書

## 目的

睡眠時間、服薬時間、気分、日常行動を日付単位で記録し、月次で振り返れる単一利用者向けアプリを提供する。

## 前提

- 認証機能は実装しない。
- 利用者は 1 名を想定する。
- フロントエンドは Next.js 15、TypeScript、App Router、Tailwind CSS で実装する。
- バックエンドは FastAPI、SQLAlchemy、Pydantic v2 で実装する。
- データベースは PostgreSQL を利用する。
- Docker Compose でローカル起動できる。

## 画面要件

### TOP

URL: `/`

- アプリ概要を表示する。
- アプリを開くボタンを表示する。
- 要件定義書、基本設計書、詳細設計書へのリンクを表示する。

### アプリ画面

URL: `/app`

- 月ビューでは気分カレンダーを主役として表示する。
- 睡眠と服薬を横タイムラインで表示する。
- 選択日を含む週 7 日分を、タイムライン、気分、行動記録の横並びで表示する。
- 月ビュー、週ビュー、日ビューをタブで切り替えられる。
- 表示中のビューに応じて、前月/次月、前週/次週、前日/翌日へ移動できる。
- 気分を `-2` から `2` の範囲で表示する。
- 行動記録を一覧表示する。

### ドキュメント画面

URL:

- `/docs`
- `/docs/requirements`
- `/docs/basic-design`
- `/docs/detail-design`

Markdown ファイルを読み込んで表示する。

## 機能要件

### 日次記録

記録項目:

- 日付
- 気分 `-2` から `2`
- 行動記録
- メモ

### 睡眠記録

日次記録に対して複数登録できる。

記録項目:

- `sleep_start`
- `sleep_end`

睡眠記録は就寝日の記録に紐づける。

例:

```text
2026-06-12 22:00
～
2026-06-13 07:00
```

この場合、`record_date = 2026-06-12` とする。

### 服薬記録

日次記録に対して複数登録できる。

記録項目:

- `taken_at`

## API 要件

### 取得

```http
GET /api/v1/records
GET /api/v1/records/{date}
```

### 更新

```http
PUT /api/v1/records/{date}
```

`sleep_logs` と `medication_logs` は全件置換方式で更新する。

### 削除

```http
DELETE /api/v1/records/{date}
```

## UI 要件

- 睡眠時間は横タイムラインで青色表示する。
- 服薬はタイムライン上の `taken_at` 時刻位置に `×` マークで表示する。
- 気分は `-2` から `2` で表示する。
- 月/週/日の表示単位はタブで切り替える。
- `<` と `>` の操作で現在の表示単位を前後に移動する。
- 日ビューでは保存ボタンを画面下部に固定表示する。
- 週ビューでは空の睡眠・行動記録を過剰な文言で埋めず、高密度に表示する。

## データ要件

### daily_records

- `id`
- `record_date`
- `mood_score`
- `daily_action`
- `note`
- `created_at`
- `updated_at`

`mood_score` には `CHECK (mood_score BETWEEN -2 AND 2)` を設定する。

### sleep_logs

- `id`
- `daily_record_id`
- `sleep_start`
- `sleep_end`
- `created_at`

### medication_logs

- `id`
- `daily_record_id`
- `taken_at`
- `created_at`
