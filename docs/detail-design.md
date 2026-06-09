# 詳細設計書

## ディレクトリ構成

```text
.
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── db/init.sql
│   ├── Dockerfile
│   └── requirements.txt
├── docs/
│   ├── index.md
│   ├── requirements.md
│   ├── basic-design.md
│   └── detail-design.md
├── frontend/
│   ├── app/
│   ├── lib/markdown.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Backend 詳細

### `DailyRecord`

`daily_records` テーブルに対応する SQLAlchemy model。

- `record_date` は unique index を持つ。
- `mood_score` は DB の CHECK 制約で `-2` から `2` に制限する。
- `sleep_logs` と `medication_logs` は relationship で保持し、`delete-orphan` cascade を設定する。

### `SleepLog`

`sleep_logs` テーブルに対応する SQLAlchemy model。

- `daily_record_id` で日次記録に紐づく。
- `sleep_end > sleep_start` の CHECK 制約を持つ。
- 就寝日の記録へ紐づけるため、API 層で `sleep_start.date() == record_date` を検証する。

### `MedicationLog`

`medication_logs` テーブルに対応する SQLAlchemy model。

- `daily_record_id` で日次記録に紐づく。
- `taken_at.date() == record_date` を API 層で検証する。

## PUT 更新処理

`PUT /api/v1/records/{date}` は以下の順序で処理する。

1. Pydantic v2 schema で入力値を検証する。
2. `sleep_start` と `taken_at` の日付がパス日付と一致するか検証する。
3. `daily_records.record_date` で既存レコードを検索する。
4. 存在しない場合は新規作成する。
5. 日次項目を更新する。
6. `sleep_logs` と `medication_logs` をリクエスト内容で全件置換する。
7. commit 後、relationship を含めて再取得して返す。

## Frontend 詳細

### `/app`

クライアントコンポーネントとして実装する。

- `GET /api/v1/records?start_date=...&end_date=...` で月次データを取得する。
- 週次表示で月端の前後日を表示できるよう、月の前後 6 日を含めて取得する。
- 選択日の状態を `RecordDraft` として保持する。
- 表示単位は `activeView` として `month`、`week`、`day` のいずれかで保持する。
- 保存時は `PUT /api/v1/records/{selectedDate}` を呼び出す。
- 削除時は `DELETE /api/v1/records/{selectedDate}` を呼び出す。

### 睡眠タイムライン

1 日を 0:00 から 24:00 までの横軸として表示する。

- 睡眠は青色の帯で表示する。
- 日付をまたぐ睡眠は、当日分は 24:00 まで、翌日 0:00 以降は翌日のタイムラインに表示する。
- 服薬は `taken_at` の時刻位置に `×` マークで表示する。

### 週次表示

選択日を含む月曜始まりの 7 日を `getWeekDays()` で算出する。

- 7 日分を行として並べる。
- 列は日付、タイムライン、気分、行動記録で構成する。
- タイムライン列では `TimelineTrack` を再利用し、その暦日に重なる睡眠の青帯と服薬の `×` を同一横軸上に描画する。
- 選択中の日付行では未保存の `RecordDraft` を使い、保存前の編集内容も週次表示に反映する。

### ビュー切り替えと前後移動

`activeView` に応じて表示内容を切り替える。

- `month`: 気分カレンダーと行動記録一覧を表示する。
- `week`: 高密度な週次表示を表示し、空欄は過剰な文言で埋めない。
- `day`: 選択日のタイムラインと日次記録フォームを表示し、保存ボタンを画面下部に固定する。

前後移動は `moveView()` で処理する。

- `month`: `addMonths()` で前月/次月に移動し、選択日は移動先の月内に丸める。
- `week`: `addDays(selectedDate, 7)` または `addDays(selectedDate, -7)` で移動する。
- `day`: `addDays(selectedDate, 1)` または `addDays(selectedDate, -1)` で移動する。

### Markdown 表示

`frontend/lib/markdown.ts` で `docs/` 配下の Markdown を読み込み、以下の基本記法を HTML に変換する。

- 見出し
- 箇条書き
- 番号付きリスト
- コードブロック
- インラインコード
- リンク
- 太字

## Migration

Alembic migration は `backend/alembic/versions/202606090001_create_health_records.py` に定義する。

作成対象:

- `daily_records`
- `sleep_logs`
- `medication_logs`

## 初期 DDL

PostgreSQL 初期 DDL は `backend/db/init.sql` に配置する。

Docker Compose の通常起動では Alembic migration を利用するため、この DDL は手動初期化や確認用の SQL として扱う。
