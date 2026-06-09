CREATE TABLE IF NOT EXISTS daily_records (
    id SERIAL PRIMARY KEY,
    record_date DATE NOT NULL UNIQUE,
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN -2 AND 2),
    daily_action TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_daily_records_record_date
    ON daily_records (record_date);

CREATE TABLE IF NOT EXISTS sleep_logs (
    id SERIAL PRIMARY KEY,
    daily_record_id INTEGER NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    sleep_start TIMESTAMP NOT NULL,
    sleep_end TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_sleep_logs_end_after_start CHECK (sleep_end > sleep_start)
);

CREATE INDEX IF NOT EXISTS ix_sleep_logs_daily_record_id
    ON sleep_logs (daily_record_id);

CREATE TABLE IF NOT EXISTS medication_logs (
    id SERIAL PRIMARY KEY,
    daily_record_id INTEGER NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    taken_at TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_medication_logs_daily_record_id
    ON medication_logs (daily_record_id);
