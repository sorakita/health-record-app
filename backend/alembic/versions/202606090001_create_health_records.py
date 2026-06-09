"""create health record tables

Revision ID: 202606090001
Revises:
Create Date: 2026-06-09
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "202606090001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("record_date", sa.Date(), nullable=False),
        sa.Column("mood_score", sa.Integer(), nullable=False),
        sa.Column("daily_action", sa.Text(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("mood_score BETWEEN -2 AND 2", name="ck_daily_records_mood_score_range"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_date"),
    )
    op.create_index(op.f("ix_daily_records_id"), "daily_records", ["id"], unique=False)
    op.create_index(op.f("ix_daily_records_record_date"), "daily_records", ["record_date"], unique=False)

    op.create_table(
        "sleep_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("daily_record_id", sa.Integer(), nullable=False),
        sa.Column("sleep_start", sa.DateTime(timezone=False), nullable=False),
        sa.Column("sleep_end", sa.DateTime(timezone=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("sleep_end > sleep_start", name="ck_sleep_logs_end_after_start"),
        sa.ForeignKeyConstraint(["daily_record_id"], ["daily_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sleep_logs_daily_record_id"), "sleep_logs", ["daily_record_id"], unique=False)
    op.create_index(op.f("ix_sleep_logs_id"), "sleep_logs", ["id"], unique=False)

    op.create_table(
        "medication_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("daily_record_id", sa.Integer(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["daily_record_id"], ["daily_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medication_logs_daily_record_id"), "medication_logs", ["daily_record_id"], unique=False)
    op.create_index(op.f("ix_medication_logs_id"), "medication_logs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_medication_logs_id"), table_name="medication_logs")
    op.drop_index(op.f("ix_medication_logs_daily_record_id"), table_name="medication_logs")
    op.drop_table("medication_logs")
    op.drop_index(op.f("ix_sleep_logs_id"), table_name="sleep_logs")
    op.drop_index(op.f("ix_sleep_logs_daily_record_id"), table_name="sleep_logs")
    op.drop_table("sleep_logs")
    op.drop_index(op.f("ix_daily_records_record_date"), table_name="daily_records")
    op.drop_index(op.f("ix_daily_records_id"), table_name="daily_records")
    op.drop_table("daily_records")
