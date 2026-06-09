from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SleepLogInput(BaseModel):
    sleep_start: datetime
    sleep_end: datetime

    @model_validator(mode="after")
    def validate_time_order(self) -> "SleepLogInput":
        if self.sleep_end <= self.sleep_start:
            raise ValueError("sleep_end must be later than sleep_start")
        return self


class MedicationLogInput(BaseModel):
    taken_at: datetime


class DailyRecordUpsert(BaseModel):
    mood_score: int = Field(default=0, ge=-2, le=2)
    daily_action: str = ""
    note: str = ""
    sleep_logs: list[SleepLogInput] = Field(default_factory=list)
    medication_logs: list[MedicationLogInput] = Field(default_factory=list)

    @field_validator("daily_action", "note")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return value.strip()


class SleepLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sleep_start: datetime
    sleep_end: datetime
    created_at: datetime


class MedicationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    taken_at: datetime
    created_at: datetime


class DailyRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_date: date
    mood_score: int
    daily_action: str
    note: str
    sleep_logs: list[SleepLogResponse]
    medication_logs: list[MedicationLogResponse]
    created_at: datetime
    updated_at: datetime
