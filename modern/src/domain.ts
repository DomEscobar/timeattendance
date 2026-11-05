export type Reason = "work" | "remote" | "errand";

export interface Booking {
  id: string;
  start: string;
  end: string;
  breakMinutes: number;
  reason: Reason;
  note: string;
}
export interface Timer {
  start: string;
  reason: Reason;
  note: string;
  pausedAt: string | null;
  pausedMs: number;
}
export interface Profile {
  firstName: string;
  lastName: string;
  company: string;
  weeklyHours: number;
  details: { id: string; label: string; value: string }[];
}
export interface AppData {
  version: 1;
  entries: Booking[];
  timer: Timer | null;
  profile: Profile;
  theme: "light" | "dark";
}

export const REASONS: Record<Reason, string> = {
  work: "Arbeit",
  remote: "Homeoffice",
  errand: "Dienstgang",
};

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateMs = (value: string) => new Date(value).getTime();
const isReason = (value: unknown): value is Reason =>
  value === "work" || value === "remote" || value === "errand";

export function emptyData(): AppData {
  return {
    version: 1,
    entries: [],
    timer: null,
    profile: {
      firstName: "",
      lastName: "",
      company: "",
      weeklyHours: 40,
      details: [],
    },
    theme: "light",
  };
}

export function localDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function netMs(entry: Booking): number {
  return Math.max(
    0,
    dateMs(entry.end) - dateMs(entry.start) - entry.breakMinutes * 60_000,
  );
}

export function timerMs(timer: Timer, now = Date.now()): number {
  const until = timer.pausedAt ? dateMs(timer.pausedAt) : now;
  return Math.max(0, until - dateMs(timer.start) - timer.pausedMs);
}

export function formatDuration(ms: number, seconds = false): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const suffix = seconds
    ? `:${String(totalSeconds % 60).padStart(2, "0")}`
    : "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export function validateBooking(
  candidate: Booking,
  existing: Booking[],
): string | null {
  const start = dateMs(candidate.start),
    end = dateMs(candidate.end);
  if (!Number.isFinite(start) || !Number.isFinite(end))
    return "Bitte gültige Start- und Endzeiten angeben.";
  if (end <= start) return "Die Endzeit muss nach der Startzeit liegen.";
  if (end > Date.now() + 1_000)
    return "Abgeschlossene Buchungen dürfen nicht in der Zukunft liegen.";
  if (!Number.isFinite(candidate.breakMinutes) || candidate.breakMinutes < 0)
    return "Die Pausenzeit ist ungültig.";
  if (candidate.breakMinutes * 60_000 >= end - start)
    return "Die Pause muss kürzer als die Arbeitszeit sein.";
  if (!isReason(candidate.reason)) return "Der Grund ist ungültig.";
  if (
    existing.some(
      (entry) =>
        entry.id !== candidate.id &&
        start < dateMs(entry.end) &&
        end > dateMs(entry.start),
    )
  )
    return "Die Buchung überschneidet sich mit einer vorhandenen Buchung.";
  return null;
}

function timerOverlap(entry: Booking, timer: Timer, now: number): boolean {
  const start = dateMs(timer.start);
  // A paused timer still reserves its span: it can later resume or stop at now.
  const end = now;
  return dateMs(entry.start) < end && dateMs(entry.end) > start;
}

export function startTimer(
  data: AppData,
  reason: Reason,
  note = "",
  now = new Date(),
): AppData {
  if (data.timer) throw new Error("Es läuft bereits eine Zeiterfassung.");
  if (!isReason(reason)) throw new Error("Der Grund ist ungültig.");
  const timerStart = now.getTime();
  if (
    data.entries.some(
      (entry) =>
        dateMs(entry.start) < timerStart && dateMs(entry.end) > timerStart,
    )
  )
    throw new Error(
      "Die Zeiterfassung würde eine vorhandene Buchung überschneiden.",
    );
  return {
    ...data,
    timer: {
      start: now.toISOString(),
      reason,
      note,
      pausedAt: null,
      pausedMs: 0,
    },
  };
}

export function pauseTimer(data: AppData, now = new Date()): AppData {
  if (!data.timer) throw new Error("Es läuft keine Zeiterfassung.");
  const timer = data.timer;
  const earliest = timer.pausedAt ?? timer.start;
  if (now.getTime() < dateMs(earliest))
    throw new Error(
      "Die Uhrzeit darf nicht vor dem Start oder der Pause liegen.",
    );
  if (timer.pausedAt) {
    const added = Math.max(0, now.getTime() - dateMs(timer.pausedAt));
    return {
      ...data,
      timer: { ...timer, pausedAt: null, pausedMs: timer.pausedMs + added },
    };
  }
  return { ...data, timer: { ...timer, pausedAt: now.toISOString() } };
}

export function stopTimer(data: AppData, now = new Date()): AppData {
  if (!data.timer) throw new Error("Es läuft keine Zeiterfassung.");
  const timer = data.timer;
  const end = now.toISOString();
  const breakMs =
    timer.pausedMs +
    (timer.pausedAt ? Math.max(0, now.getTime() - dateMs(timer.pausedAt)) : 0);
  const elapsed = dateMs(end) - dateMs(timer.start) - breakMs;
  if (elapsed <= 0) throw new Error("Die Zeiterfassung hat keine Arbeitszeit.");
  const entry: Booking = {
    id: makeId(),
    start: timer.start,
    end,
    breakMinutes: breakMs / 60_000,
    reason: timer.reason,
    note: timer.note,
  };
  const error = validateBooking(entry, data.entries);
  if (error)
    throw new Error(`Zeiterfassung kann nicht beendet werden: ${error}`);
  return { ...data, entries: [...data.entries, entry], timer: null };
}

export function upsertBooking(data: AppData, entry: Booking): AppData {
  const error = validateBooking(entry, data.entries);
  if (error) throw new Error(error);
  if (data.timer && timerOverlap(entry, data.timer, Date.now()))
    throw new Error(
      "Die Buchung überschneidet sich mit der laufenden Zeiterfassung.",
    );
  const exists = data.entries.some((current) => current.id === entry.id);
  return {
    ...data,
    entries: exists
      ? data.entries.map((current) =>
          current.id === entry.id ? entry : current,
        )
      : [...data.entries, entry],
  };
}

export function removeBooking(data: AppData, id: string): AppData {
  return { ...data, entries: data.entries.filter((entry) => entry.id !== id) };
}

export function demoData(now = new Date()): AppData {
  const data = emptyData();
  const entries: Booking[] = [];
  // Keep today clear so a first real timer never competes with placeholder data.
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);
  while (entries.length < 4) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const day = localDate(cursor);
      const remote = cursor.getDay() === 3;
      entries.unshift({
        id: `demo-${day}`,
        start: `${day}T08:30:00`,
        end: `${day}T17:00:00`,
        breakMinutes: 30,
        reason: remote ? "remote" : "work",
        note: remote ? "Mobiles Arbeiten" : "",
      });
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    ...data,
    entries,
    profile: {
      ...data.profile,
      firstName: "Mara",
      lastName: "Beispiel",
      company: "Nordlicht GmbH",
    },
  };
}

const safeCell = (value: unknown) => {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const protectedText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return /[;"\r\n]/.test(protectedText)
    ? `"${protectedText.replace(/"/g, '""')}"`
    : protectedText;
};

export function toCsv(entries: Booking[]): string {
  const header = [
    "Datum",
    "Start",
    "Enddatum",
    "Ende",
    "Pause (Min.)",
    "Arbeitszeit",
    "Grund",
    "Notiz",
  ];
  const localTime = (value: string) => {
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };
  const rows = entries.map((entry) =>
    [
      localDate(entry.start),
      localTime(entry.start),
      localDate(entry.end),
      localTime(entry.end),
      entry.breakMinutes,
      formatDuration(netMs(entry)),
      REASONS[entry.reason],
      entry.note,
    ]
      .map(safeCell)
      .join(";"),
  );
  return [header.join(";"), ...rows].join("\r\n");
}
