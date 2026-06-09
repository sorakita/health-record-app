"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Loader2,
  Moon,
  NotebookPen,
  Pill,
  Save,
  Trash2,
  XCircle
} from "lucide-react";

type SleepLogForm = {
  sleep_start: string;
  sleep_end: string;
};

type MedicationLogForm = {
  taken_at: string;
};

type RecordDraft = {
  mood_score: number;
  daily_action: string;
  note: string;
  sleep_logs: SleepLogForm[];
  medication_logs: MedicationLogForm[];
};

type ApiSleepLog = SleepLogForm & {
  id: number;
  created_at: string;
};

type ApiMedicationLog = MedicationLogForm & {
  id: number;
  created_at: string;
};

type DailyRecord = {
  id: number;
  record_date: string;
  mood_score: number;
  daily_action: string;
  note: string;
  sleep_logs: ApiSleepLog[];
  medication_logs: ApiMedicationLog[];
  created_at: string;
  updated_at: string;
};

type TimelineSegment = {
  left: number;
  width: number;
};

type MedicationMark = {
  left: number;
  label: string;
};

type WeeklyOverviewProps = {
  draft: RecordDraft;
  onSelectDate: (dateString: string) => void;
  records: Record<string, DailyRecord>;
  selectedDate: string;
  weekDays: string[];
};

type MonthOverviewProps = {
  draft: RecordDraft;
  month: string;
  monthDays: string[];
  onSelectDate: (dateString: string) => void;
  records: Record<string, DailyRecord>;
  selectedDate: string;
};

type ViewMode = "month" | "week" | "day";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8709").replace(/\/$/, "");
const DAY_MINUTES = 24 * 60;
const hourLabels = Array.from({ length: 9 }, (_, index) => index * 3);
const weekDayLabels = ["月", "火", "水", "木", "金", "土", "日"];

const viewTabs: { label: string; value: ViewMode }[] = [
  { label: "月ビュー", value: "month" },
  { label: "週ビュー", value: "week" },
  { label: "日ビュー", value: "day" }
];

const moodOptions = [
  { score: -2, label: "-2", className: "border-rose-200 bg-rose-50 text-rose-800" },
  { score: -1, label: "-1", className: "border-orange-200 bg-orange-50 text-orange-800" },
  { score: 0, label: "0", className: "border-zinc-200 bg-zinc-50 text-zinc-700" },
  { score: 1, label: "+1", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { score: 2, label: "+2", className: "border-sky-200 bg-sky-50 text-sky-800" }
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatDateLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayString(): string {
  return formatDateLocal(new Date());
}

function parseDateParts(dateString: string): [number, number, number] {
  const [year, month, day] = dateString.split("-").map(Number);
  return [year, month, day];
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = parseDateParts(dateString);
  return formatDateLocal(new Date(year, month - 1, day + days));
}

function addMonths(monthString: string, months: number): string {
  const [year, month] = monthString.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function clampDateToMonth(dateString: string, monthString: string): string {
  const [, , day] = parseDateParts(dateString);
  const { end } = getMonthRange(monthString);
  const [, , lastDay] = parseDateParts(end);
  return `${monthString}-${pad(Math.min(day, lastDay))}`;
}

function getStartOfWeek(dateString: string): string {
  const [year, month, day] = parseDateParts(dateString);
  const date = new Date(year, month - 1, day);
  const mondayOffset = (date.getDay() + 6) % 7;
  return formatDateLocal(new Date(year, month - 1, day - mondayOffset));
}

function getWeekDays(dateString: string): string[] {
  const start = getStartOfWeek(dateString);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getMonthRange(monthString: string): { start: string; end: string } {
  const [year, month] = monthString.split("-").map(Number);
  const start = `${monthString}-01`;
  const end = formatDateLocal(new Date(year, month, 0));
  return { start, end };
}

function getMonthDays(monthString: string): string[] {
  const { start, end } = getMonthRange(monthString);
  const [, , lastDay] = parseDateParts(end);
  return Array.from({ length: lastDay }, (_, index) => addDays(start, index));
}

function getMonthGridDays(monthString: string): string[] {
  const { start, end } = getMonthRange(monthString);
  const gridStart = getStartOfWeek(start);
  const endWeekStart = getStartOfWeek(end);
  const gridEnd = addDays(endWeekStart, 6);
  const length = dayDiff(gridStart, gridEnd) + 1;
  return Array.from({ length }, (_, index) => addDays(gridStart, index));
}

function dayDiff(fromDate: string, toDate: string): number {
  const [fromYear, fromMonth, fromDay] = parseDateParts(fromDate);
  const [toYear, toMonth, toDay] = parseDateParts(toDate);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((to - from) / 86_400_000);
}

function datePart(dateTime: string): string {
  return dateTime.split("T")[0] ?? "";
}

function timePart(dateTime: string): string {
  return (dateTime.split("T")[1] ?? "00:00").slice(0, 5);
}

function minuteOfDay(dateTime: string): number {
  const [hour = 0, minute = 0] = timePart(dateTime).split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeDateTimeInput(value: string): string {
  return value.slice(0, 16);
}

function dateLabel(dateString: string): string {
  const [year, month, day] = parseDateParts(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(year, month - 1, day));
}

function monthLabel(monthString: string): string {
  const [year, month] = monthString.split("-").map(Number);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long"
  }).format(new Date(year, month - 1, 1));
}

function moodCellClass(score: number): string {
  switch (score) {
    case -2:
      return "bg-rose-100 text-rose-900";
    case -1:
      return "bg-orange-100 text-orange-900";
    case 1:
      return "bg-emerald-100 text-emerald-900";
    case 2:
      return "bg-sky-100 text-sky-900";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function createEmptyDraft(): RecordDraft {
  return {
    mood_score: 0,
    daily_action: "",
    note: "",
    sleep_logs: [],
    medication_logs: []
  };
}

function recordToDraft(record: DailyRecord | undefined): RecordDraft {
  if (!record) {
    return createEmptyDraft();
  }

  return {
    mood_score: record.mood_score,
    daily_action: record.daily_action,
    note: record.note,
    sleep_logs: record.sleep_logs.map((item) => ({
      sleep_start: normalizeDateTimeInput(item.sleep_start),
      sleep_end: normalizeDateTimeInput(item.sleep_end)
    })),
    medication_logs: record.medication_logs.map((item) => ({
      taken_at: normalizeDateTimeInput(item.taken_at)
    }))
  };
}

function getMoodMeta(score: number) {
  return moodOptions.find((option) => option.score === score) ?? moodOptions[2];
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return "0分";
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`;
}

function draftHasContent(draft: RecordDraft): boolean {
  return Boolean(
    draft.daily_action ||
      draft.note ||
      draft.sleep_logs.length > 0 ||
      draft.medication_logs.length > 0
  );
}

function sleepBoundsForDate(log: SleepLogForm, recordDate: string): { start: number; end: number } | null {
  if (!log.sleep_start || !log.sleep_end) {
    return null;
  }

  const start = dayDiff(recordDate, datePart(log.sleep_start)) * DAY_MINUTES + minuteOfDay(log.sleep_start);
  const end = dayDiff(recordDate, datePart(log.sleep_end)) * DAY_MINUTES + minuteOfDay(log.sleep_end);

  if (end <= start) {
    return null;
  }

  return { start, end };
}

function sleepOverlapsDate(log: SleepLogForm, recordDate: string): boolean {
  const bounds = sleepBoundsForDate(log, recordDate);
  return bounds !== null && bounds.end > 0 && bounds.start < DAY_MINUTES;
}

function sleepDurationMinutes(log: SleepLogForm): number {
  if (!log.sleep_start || !log.sleep_end) {
    return 0;
  }

  const startDate = datePart(log.sleep_start);
  const endDate = datePart(log.sleep_end);
  const start = minuteOfDay(log.sleep_start);
  const end = dayDiff(startDate, endDate) * DAY_MINUTES + minuteOfDay(log.sleep_end);

  return end > start ? end - start : 0;
}

function bedtimeSleepMinutes(logs: SleepLogForm[], recordDate: string): number {
  return logs.reduce((total, log) => {
    if (datePart(log.sleep_start) !== recordDate) {
      return total;
    }

    return total + sleepDurationMinutes(log);
  }, 0);
}

function aggregateDraftForDate(
  recordDate: string,
  records: Record<string, DailyRecord>,
  selectedDate: string,
  draft: RecordDraft
): RecordDraft {
  return recordDate === selectedDate ? draft : recordToDraft(records[recordDate]);
}

function collectSleepLogsForDate(
  recordDate: string,
  records: Record<string, DailyRecord>,
  selectedDate: string,
  draft: RecordDraft
): SleepLogForm[] {
  const sourceDates = new Set([...Object.keys(records), selectedDate]);
  const logs: SleepLogForm[] = [];

  sourceDates.forEach((sourceDate) => {
    const sourceDraft = sourceDate === selectedDate ? draft : recordToDraft(records[sourceDate]);
    logs.push(...sourceDraft.sleep_logs.filter((log) => sleepOverlapsDate(log, recordDate)));
  });

  return logs.sort((a, b) => a.sleep_start.localeCompare(b.sleep_start));
}

function displayDraftForDate(
  recordDate: string,
  records: Record<string, DailyRecord>,
  selectedDate: string,
  draft: RecordDraft
): RecordDraft {
  const baseDraft = recordDate === selectedDate ? draft : recordToDraft(records[recordDate]);
  return {
    ...baseDraft,
    sleep_logs: collectSleepLogsForDate(recordDate, records, selectedDate, draft)
  };
}

function getSleepSegments(logs: SleepLogForm[], recordDate: string): TimelineSegment[] {
  const segments: TimelineSegment[] = [];

  for (const log of logs) {
    const bounds = sleepBoundsForDate(log, recordDate);
    if (bounds === null) {
      continue;
    }

    const visibleStart = Math.max(0, bounds.start);
    const visibleEnd = Math.min(DAY_MINUTES, bounds.end);
    if (visibleEnd > visibleStart) {
      segments.push({
        left: (visibleStart / DAY_MINUTES) * 100,
        width: ((visibleEnd - visibleStart) / DAY_MINUTES) * 100
      });
    }
  }

  return segments;
}

function getMedicationMarks(logs: MedicationLogForm[], recordDate: string): MedicationMark[] {
  return logs
    .filter((log) => log.taken_at && datePart(log.taken_at) === recordDate)
    .map((log) => ({
      left: (minuteOfDay(log.taken_at) / DAY_MINUTES) * 100,
      label: timePart(log.taken_at)
    }));
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail
          .map((item: unknown) => {
            if (typeof item === "object" && item !== null && "msg" in item) {
              return String((item as { msg: unknown }).msg);
            }
            return JSON.stringify(item);
          })
          .join(" / ");
      }
    }
  } catch {
    return response.statusText;
  }
  return response.statusText;
}

function MoodBadge({ score }: { score: number }) {
  const mood = getMoodMeta(score);
  return (
    <span className={`inline-flex h-7 min-w-11 items-center justify-center rounded-md border px-2 text-sm font-black ${mood.className}`}>
      {mood.label}
    </span>
  );
}

function TimelineHourLabels() {
  return (
    <div className="relative h-5 text-xs font-bold text-zinc-500">
      {hourLabels.map((hour) => (
        <span
          key={hour}
          className={`absolute top-0 ${
            hour === 0 ? "translate-x-0" : hour === 24 ? "-translate-x-full" : "-translate-x-1/2"
          }`}
          style={{ left: `${(hour / 24) * 100}%` }}
        >
          {hour}
        </span>
      ))}
    </div>
  );
}

function TimelineTrack({
  draft,
  recordDate,
  heightClass = "h-14"
}: {
  draft: RecordDraft;
  recordDate: string;
  heightClass?: string;
}) {
  const segments = getSleepSegments(draft.sleep_logs, recordDate);
  const medicationMarks = getMedicationMarks(draft.medication_logs, recordDate);

  return (
    <div className={`relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 ${heightClass}`}>
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className="absolute top-0 h-full border-l border-zinc-200/80"
          style={{ left: `${(index / 24) * 100}%` }}
        />
      ))}
      {segments.map((segment, index) => (
        <span
          key={`${segment.left}-${segment.width}-${index}`}
          className="absolute top-2 bottom-2 rounded-sm bg-sky-500"
          style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
        />
      ))}
      {medicationMarks.map((mark, index) => (
        <span
          key={`${mark.left}-${index}`}
          title={`服薬 ${mark.label}`}
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-xl font-black leading-none text-rose-600"
          style={{ left: `${mark.left}%` }}
        >
          ×
        </span>
      ))}
    </div>
  );
}

function Timeline({
  draft,
  selectedDate,
  sleepMinutes
}: {
  draft: RecordDraft;
  selectedDate: string;
  sleepMinutes: number;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white/95 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-zinc-950">
            <Moon className="h-4 w-4 text-sky-600" aria-hidden />
            タイムライン表示
          </h2>
          <p className="text-xs font-semibold text-zinc-500">{dateLabel(selectedDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-2 rounded bg-sky-50 px-2 py-1 text-sky-800">
            <span className="h-2.5 w-5 rounded-sm bg-sky-500" />
            睡眠 {formatDuration(sleepMinutes)}
          </span>
          <span className="inline-flex items-center gap-2 rounded bg-rose-50 px-2 py-1 text-rose-800">
            <span className="text-sm font-black">×</span>
            服薬 {draft.medication_logs.length}回
          </span>
        </div>
      </div>

      <TimelineHourLabels />
      <TimelineTrack draft={draft} recordDate={selectedDate} />
    </section>
  );
}

function WeeklyOverview({ draft, onSelectDate, records, selectedDate, weekDays }: WeeklyOverviewProps) {
  const startLabel = dateLabel(weekDays[0]);
  const endLabel = dateLabel(weekDays[6]);

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white/95">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2">
        <div>
          <h2 className="text-base font-extrabold text-zinc-950">週次表示</h2>
          <p className="text-xs font-semibold text-zinc-500">
            {startLabel} - {endLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-sm bg-sky-500" />
            睡眠
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-sm font-black text-rose-600">×</span>
            服薬
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[92px_minmax(360px,1fr)_64px_minmax(260px,0.85fr)] items-end gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-[11px] font-bold text-zinc-500">
            <span>日付</span>
            <div>
              <span className="block">タイムライン</span>
              <TimelineHourLabels />
            </div>
            <span>気分</span>
            <span>行動記録</span>
          </div>

          <div className="divide-y divide-zinc-100">
            {weekDays.map((dateString) => {
              const record = records[dateString];
              const rowDraft = displayDraftForDate(dateString, records, selectedDate, draft);
              const aggregateDraft = aggregateDraftForDate(dateString, records, selectedDate, draft);
              const hasRecord = Boolean(record) || (dateString === selectedDate && draftHasContent(draft));
              const actionText = rowDraft.daily_action || rowDraft.note;
              const sleepMinutes = bedtimeSleepMinutes(aggregateDraft.sleep_logs, dateString);
              const active = dateString === selectedDate;

              return (
                <button
                  key={dateString}
                  type="button"
                  onClick={() => onSelectDate(dateString)}
                  aria-current={active ? "date" : undefined}
                  className={`grid min-h-14 w-full grid-cols-[92px_minmax(360px,1fr)_64px_minmax(260px,0.85fr)] items-center gap-3 px-3 py-2 text-left transition ${
                    active ? "bg-sky-50/80 shadow-[inset_3px_0_0_#0284c7]" : "hover:bg-zinc-50"
                  }`}
                >
                  <span>
                    <span className="block text-xs font-black text-zinc-950">{dateLabel(dateString)}</span>
                    <span className="block min-h-4 text-[11px] font-semibold text-zinc-500">
                      {sleepMinutes > 0 ? formatDuration(sleepMinutes) : ""}
                    </span>
                  </span>

                  <TimelineTrack draft={rowDraft} recordDate={dateString} heightClass="h-8" />

                  <span>{hasRecord ? <MoodBadge score={rowDraft.mood_score} /> : null}</span>

                  <span
                    className={`max-h-11 overflow-hidden whitespace-pre-wrap text-xs font-medium leading-5 ${
                      actionText ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {actionText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MonthOverview({ draft, month, monthDays, onSelectDate, records, selectedDate }: MonthOverviewProps) {
  const gridDays = getMonthGridDays(month);
  const actionItems = monthDays
    .map((dateString) => {
      const dayDraft = displayDraftForDate(dateString, records, selectedDate, draft);
      return {
        dateString,
        mood: dayDraft.mood_score,
        text: dayDraft.daily_action || dayDraft.note
      };
    })
    .filter((item) => item.text);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-zinc-200 bg-white/95">
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
          <div>
            <h2 className="text-base font-extrabold text-zinc-950">気分カレンダー</h2>
            <p className="text-xs font-semibold text-zinc-500">{monthLabel(month)}</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">{monthDays.length}日</span>
        </div>

        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 text-center text-[11px] font-bold text-zinc-500">
          {weekDayLabels.map((label) => (
            <div key={label} className="px-2 py-1.5">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((dateString) => {
            const inMonth = dateString.startsWith(month);
            const record = records[dateString];
            const dayDraft = displayDraftForDate(dateString, records, selectedDate, draft);
            const aggregateDraft = aggregateDraftForDate(dateString, records, selectedDate, draft);
            const active = dateString === selectedDate;
            const hasRecord = Boolean(record) || (active && draftHasContent(draft));
            const sleepMinutes = bedtimeSleepMinutes(aggregateDraft.sleep_logs, dateString);
            const medicationCount = dayDraft.medication_logs.length;
            const actionText = dayDraft.daily_action || dayDraft.note;

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => onSelectDate(dateString)}
                className={`min-h-24 border-r border-t border-zinc-100 p-2 text-left transition ${
                  active ? "bg-sky-50 shadow-[inset_0_0_0_2px_#38bdf8]" : "hover:bg-zinc-50"
                } ${inMonth ? "text-zinc-950" : "bg-zinc-50/50 text-zinc-300"}`}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span className="text-xs font-black">{parseDateParts(dateString)[2]}</span>
                  {medicationCount > 0 ? (
                    <span className="text-xs font-black text-rose-600">×{medicationCount}</span>
                  ) : null}
                </div>

                {hasRecord ? (
                  <div className={`mb-2 inline-flex h-8 min-w-10 items-center justify-center rounded px-2 text-sm font-black ${moodCellClass(dayDraft.mood_score)}`}>
                    {getMoodMeta(dayDraft.mood_score).label}
                  </div>
                ) : (
                  <div className="mb-2 h-8" />
                )}

                {sleepMinutes > 0 ? (
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, (sleepMinutes / (10 * 60)) * 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="mb-2 h-1.5" />
                )}

                {actionText ? (
                  <p className="line-clamp-2 text-[11px] font-medium leading-4 text-zinc-600">{actionText}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-zinc-200 bg-white/90">
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
          <h2 className="text-sm font-extrabold text-zinc-950">行動記録</h2>
          <span className="text-xs font-semibold text-zinc-500">{actionItems.length}件</span>
        </div>
        {actionItems.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {actionItems.map((item) => (
              <button
                key={item.dateString}
                type="button"
                onClick={() => onSelectDate(item.dateString)}
                className="grid w-full grid-cols-[88px_52px_1fr] items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-50"
              >
                <span className="text-xs font-black text-zinc-900">{dateLabel(item.dateString)}</span>
                <span className={`inline-flex h-6 items-center justify-center rounded text-xs font-black ${moodCellClass(item.mood)}`}>
                  {getMoodMeta(item.mood).label}
                </span>
                <span className="text-xs font-medium leading-5 text-zinc-700">{item.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-10 px-3 py-2 text-xs font-medium text-zinc-400" />
        )}
      </section>
    </div>
  );
}

export default function AppPage() {
  const initialToday = todayString();
  const [activeView, setActiveView] = useState<ViewMode>("day");
  const [month, setMonth] = useState(initialToday.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [draft, setDraft] = useState<RecordDraft>(() => createEmptyDraft());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthDays = useMemo(() => getMonthDays(month), [month]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const selectedTimelineDraft = useMemo(
    () => displayDraftForDate(selectedDate, records, selectedDate, draft),
    [draft, records, selectedDate]
  );
  const selectedSleepMinutes = useMemo(
    () => bedtimeSleepMinutes(draft.sleep_logs, selectedDate),
    [draft.sleep_logs, selectedDate]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      const { start, end } = getMonthRange(month);
      const startDate = addDays(start, -6);
      const endDate = addDays(end, 6);
      setIsLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/records?start_date=${startDate}&end_date=${endDate}`, {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(await errorMessage(response));
        }

        const data = (await response.json()) as DailyRecord[];
        setRecords(Object.fromEntries(data.map((record) => [record.record_date, record])));
        setSelectedDate((current) => (current.startsWith(month) ? current : start));
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError((loadError as Error).message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
    return () => controller.abort();
  }, [month]);

  useEffect(() => {
    setDraft(recordToDraft(records[selectedDate]));
  }, [records, selectedDate]);

  function handleSelectedDateChange(value: string) {
    setSelectedDate(value);
    setMonth(value.slice(0, 7));
  }

  function updateSleepLog(index: number, key: keyof SleepLogForm, value: string) {
    setDraft((current) => ({
      ...current,
      sleep_logs: current.sleep_logs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateMedicationLog(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      medication_logs: current.medication_logs.map((item, itemIndex) =>
        itemIndex === index ? { taken_at: value } : item
      )
    }));
  }

  async function saveRecord() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/records/${selectedDate}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
      });

      if (!response.ok) {
        throw new Error(await errorMessage(response));
      }

      const saved = (await response.json()) as DailyRecord;
      setRecords((current) => ({ ...current, [saved.record_date]: saved }));
      setDraft(recordToDraft(saved));
      setMessage(`${dateLabel(saved.record_date)} を保存しました`);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRecord() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/records/${selectedDate}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(await errorMessage(response));
      }

      setRecords((current) => {
        const next = { ...current };
        delete next[selectedDate];
        return next;
      });
      setDraft(createEmptyDraft());
      setMessage(`${dateLabel(selectedDate)} を削除しました`);
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const selectedRecordExists = Boolean(records[selectedDate]);
  const viewTitle =
    activeView === "month"
      ? monthLabel(month)
      : activeView === "week"
        ? `${dateLabel(weekDays[0])} - ${dateLabel(weekDays[6])}`
        : dateLabel(selectedDate);

  function handleMonthChange(value: string) {
    setMonth(value);
    setSelectedDate((current) => clampDateToMonth(current, value));
  }

  function moveMonth(months: number) {
    const nextMonth = addMonths(month, months);
    handleMonthChange(nextMonth);
  }

  function moveView(direction: -1 | 1) {
    if (activeView === "month") {
      moveMonth(direction);
      return;
    }

    const nextDate = addDays(selectedDate, activeView === "week" ? direction * 7 : direction);
    handleSelectedDateChange(nextDate);
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-sky-700">
              <Activity className="h-4 w-4" aria-hidden />
              TOP
            </Link>
            <h1 className="text-xl font-extrabold text-zinc-950 sm:text-2xl">体調管理・生活記録</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 shadow-sm hover:border-sky-200 hover:text-sky-700"
            >
              <NotebookPen className="h-4 w-4" aria-hidden />
              docs
            </Link>
          </div>
        </header>

        <div className="mb-4 rounded-md border border-zinc-200 bg-white/85 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-grid grid-cols-3 rounded-md border border-zinc-200 bg-zinc-50 p-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveView(tab.value)}
                  aria-pressed={activeView === tab.value}
                  className={`h-10 rounded px-3 text-sm font-black transition ${
                    activeView === tab.value
                      ? "bg-white text-sky-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <div className="flex h-11 min-w-0 items-center rounded-md border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => moveView(-1)}
                  title={activeView === "month" ? "前月" : activeView === "week" ? "前週" : "前日"}
                  className="inline-flex h-10 w-10 items-center justify-center text-zinc-600 transition hover:text-sky-700"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                  <span className="sr-only">前へ</span>
                </button>
                <div className="min-w-40 px-3 text-center text-sm font-black text-zinc-950 sm:min-w-56">
                  {viewTitle}
                </div>
                <button
                  type="button"
                  onClick={() => moveView(1)}
                  title={activeView === "month" ? "次月" : activeView === "week" ? "次週" : "翌日"}
                  className="inline-flex h-10 w-10 items-center justify-center text-zinc-600 transition hover:text-sky-700"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                  <span className="sr-only">次へ</span>
                </button>
              </div>

              {activeView === "month" ? (
                <label className="grid gap-1 text-sm font-bold text-zinc-700">
                  月
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => handleMonthChange(event.target.value)}
                    className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              ) : (
                <label className="grid gap-1 text-sm font-bold text-zinc-700">
                  {activeView === "week" ? "週の基準日" : "日付"}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => handleSelectedDateChange(event.target.value)}
                    className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              )}

              <div className="flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-500">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    読み込み中
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4 text-emerald-600" aria-hidden />
                    {activeView === "month" ? `${monthDays.length}日` : activeView === "week" ? "7日" : "1日"}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="space-y-4 pb-24">
          {activeView === "month" ? (
            <MonthOverview
              draft={draft}
              month={month}
              monthDays={monthDays}
              onSelectDate={handleSelectedDateChange}
              records={records}
              selectedDate={selectedDate}
            />
          ) : null}

          {activeView === "week" ? (
            <WeeklyOverview
              draft={draft}
              onSelectDate={handleSelectedDateChange}
              records={records}
              selectedDate={selectedDate}
              weekDays={weekDays}
            />
          ) : null}

          {activeView === "day" ? (
            <>
              <Timeline draft={selectedTimelineDraft} selectedDate={selectedDate} sleepMinutes={selectedSleepMinutes} />

              <section className="overflow-hidden rounded-md border border-zinc-200 bg-white/95">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-950">日次記録</h2>
                    <p className="text-xs font-semibold text-zinc-500">{dateLabel(selectedDate)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={deleteRecord}
                    disabled={isSaving || !selectedRecordExists}
                    className="inline-flex h-8 items-center gap-1.5 rounded border border-rose-200 bg-white px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    削除
                  </button>
                </div>

                <div className="divide-y divide-zinc-100">
                  <div className="px-3 py-2">
                    <label className="mb-1.5 block text-xs font-black text-zinc-600">気分</label>
                    <div className="inline-grid grid-cols-5 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                      {moodOptions.map((option) => (
                        <button
                          key={option.score}
                          type="button"
                          aria-pressed={draft.mood_score === option.score}
                          onClick={() => setDraft((current) => ({ ...current, mood_score: option.score }))}
                          className={`h-8 w-11 text-xs font-black transition ${
                            draft.mood_score === option.score
                              ? moodCellClass(option.score)
                              : "text-zinc-500 hover:bg-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 px-3 py-3">
                    <label className="grid gap-1.5 text-xs font-black text-zinc-600">
                      行動記録
                      <textarea
                        value={draft.daily_action}
                        onChange={(event) => setDraft((current) => ({ ...current, daily_action: event.target.value }))}
                        rows={4}
                        className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-black text-zinc-600">
                      メモ
                      <textarea
                        value={draft.note}
                        onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                        rows={4}
                        className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>

                  <div className="px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
                        <Moon className="h-4 w-4 text-sky-600" aria-hidden />
                        睡眠
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            sleep_logs: [
                              ...current.sleep_logs,
                              {
                                sleep_start: `${selectedDate}T22:00`,
                                sleep_end: `${addDays(selectedDate, 1)}T07:00`
                              }
                            ]
                          }))
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded border border-sky-200 bg-sky-50 px-2.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
                      >
                        <CirclePlus className="h-3.5 w-3.5" aria-hidden />
                        追加
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-100 border-y border-zinc-100">
                      {draft.sleep_logs.length === 0 ? (
                        <div className="h-8" />
                      ) : (
                        draft.sleep_logs.map((sleepLog, index) => (
                          <div key={index} className="grid gap-2 py-2 sm:grid-cols-[1fr_1fr_auto]">
                            <label className="grid gap-1 text-[11px] font-bold text-zinc-500">
                              sleep_start
                              <input
                                type="datetime-local"
                                value={sleepLog.sleep_start}
                                onChange={(event) => updateSleepLog(index, "sleep_start", event.target.value)}
                                className="h-9 rounded border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>
                            <label className="grid gap-1 text-[11px] font-bold text-zinc-500">
                              sleep_end
                              <input
                                type="datetime-local"
                                value={sleepLog.sleep_end}
                                onChange={(event) => updateSleepLog(index, "sleep_end", event.target.value)}
                                className="h-9 rounded border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>
                            <button
                              type="button"
                              title="睡眠記録を削除"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  sleep_logs: current.sleep_logs.filter((_, itemIndex) => itemIndex !== index)
                                }))
                              }
                              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500 transition hover:border-rose-200 hover:text-rose-700 sm:mt-auto"
                            >
                              <XCircle className="h-4 w-4" aria-hidden />
                              <span className="sr-only">削除</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
                        <Pill className="h-4 w-4 text-rose-600" aria-hidden />
                        服薬
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            medication_logs: [...current.medication_logs, { taken_at: `${selectedDate}T08:00` }]
                          }))
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100"
                      >
                        <CirclePlus className="h-3.5 w-3.5" aria-hidden />
                        追加
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-100 border-y border-zinc-100">
                      {draft.medication_logs.length === 0 ? (
                        <div className="h-8" />
                      ) : (
                        draft.medication_logs.map((medicationLog, index) => (
                          <div key={index} className="grid gap-2 py-2 sm:grid-cols-[1fr_auto]">
                            <label className="grid gap-1 text-[11px] font-bold text-zinc-500">
                              taken_at
                              <input
                                type="datetime-local"
                                value={medicationLog.taken_at}
                                onChange={(event) => updateMedicationLog(index, event.target.value)}
                                className="h-9 rounded border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>
                            <button
                              type="button"
                              title="服薬記録を削除"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  medication_logs: current.medication_logs.filter((_, itemIndex) => itemIndex !== index)
                                }))
                              }
                              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500 transition hover:border-rose-200 hover:text-rose-700 sm:mt-auto"
                            >
                              <XCircle className="h-4 w-4" aria-hidden />
                              <span className="sr-only">削除</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
      {activeView === "day" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <span className="truncate text-xs font-bold text-zinc-500">{dateLabel(selectedDate)}</span>
            <button
              type="button"
              onClick={saveRecord}
              disabled={isSaving}
              className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              保存
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
