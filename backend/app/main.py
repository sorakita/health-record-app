import os
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import DailyRecord, MedicationLog, SleepLog
from app.schemas import DailyRecordResponse, DailyRecordUpsert


app = FastAPI(title="Health Record API", version="1.0.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3709")).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _record_options():
    return (
        selectinload(DailyRecord.sleep_logs),
        selectinload(DailyRecord.medication_logs),
    )


def _get_record_by_date(db: Session, record_date: date) -> DailyRecord | None:
    stmt = (
        select(DailyRecord)
        .where(DailyRecord.record_date == record_date)
        .options(*_record_options())
    )
    return db.scalars(stmt).first()


def _validate_payload_dates(record_date: date, payload: DailyRecordUpsert) -> None:
    for sleep_log in payload.sleep_logs:
        if sleep_log.sleep_start.date() != record_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="sleep_start date must match the path date because sleep logs are tied to bedtime.",
            )

    for medication_log in payload.medication_logs:
        if medication_log.taken_at.date() != record_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="taken_at date must match the path date.",
            )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/records", response_model=list[DailyRecordResponse])
def list_records(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DailyRecord]:
    stmt = select(DailyRecord).options(*_record_options()).order_by(DailyRecord.record_date.asc())
    if start_date is not None:
        stmt = stmt.where(DailyRecord.record_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(DailyRecord.record_date <= end_date)
    return list(db.scalars(stmt).all())


@app.get("/api/v1/records/{record_date}", response_model=DailyRecordResponse)
def get_record(record_date: date, db: Session = Depends(get_db)) -> DailyRecord:
    record = _get_record_by_date(db, record_date)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@app.put("/api/v1/records/{record_date}", response_model=DailyRecordResponse)
def upsert_record(
    record_date: date,
    payload: DailyRecordUpsert,
    db: Session = Depends(get_db),
) -> DailyRecord:
    _validate_payload_dates(record_date, payload)

    record = _get_record_by_date(db, record_date)
    if record is None:
        record = DailyRecord(record_date=record_date)
        db.add(record)

    record.mood_score = payload.mood_score
    record.daily_action = payload.daily_action
    record.note = payload.note

    record.sleep_logs = [
        SleepLog(sleep_start=item.sleep_start, sleep_end=item.sleep_end)
        for item in payload.sleep_logs
    ]
    record.medication_logs = [
        MedicationLog(taken_at=item.taken_at)
        for item in payload.medication_logs
    ]

    db.commit()
    db.refresh(record)

    refreshed = _get_record_by_date(db, record_date)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Record refresh failed")
    return refreshed


@app.delete("/api/v1/records/{record_date}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(record_date: date, db: Session = Depends(get_db)) -> Response:
    record = _get_record_by_date(db, record_date)
    if record is not None:
        db.delete(record)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
