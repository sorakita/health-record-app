from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailyRecord(Base):
    __tablename__ = "daily_records"
    __table_args__ = (
        CheckConstraint("mood_score BETWEEN -2 AND 2", name="ck_daily_records_mood_score_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    record_date: Mapped[Date] = mapped_column(Date, unique=True, nullable=False, index=True)
    mood_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_action: Mapped[str] = mapped_column(Text, nullable=False, default="")
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    sleep_logs: Mapped[list["SleepLog"]] = relationship(
        back_populates="daily_record",
        cascade="all, delete-orphan",
        order_by="SleepLog.sleep_start",
    )
    medication_logs: Mapped[list["MedicationLog"]] = relationship(
        back_populates="daily_record",
        cascade="all, delete-orphan",
        order_by="MedicationLog.taken_at",
    )


class SleepLog(Base):
    __tablename__ = "sleep_logs"
    __table_args__ = (
        CheckConstraint("sleep_end > sleep_start", name="ck_sleep_logs_end_after_start"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    daily_record_id: Mapped[int] = mapped_column(
        ForeignKey("daily_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sleep_start: Mapped[DateTime] = mapped_column(DateTime(timezone=False), nullable=False)
    sleep_end: Mapped[DateTime] = mapped_column(DateTime(timezone=False), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    daily_record: Mapped[DailyRecord] = relationship(back_populates="sleep_logs")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    daily_record_id: Mapped[int] = mapped_column(
        ForeignKey("daily_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    taken_at: Mapped[DateTime] = mapped_column(DateTime(timezone=False), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    daily_record: Mapped[DailyRecord] = relationship(back_populates="medication_logs")
