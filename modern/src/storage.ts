import { AppData, Booking, Profile, Reason, Timer, emptyData } from "./domain";

export const STORAGE_KEY = "timeattendance-modern-v1";
const reasons = new Set<Reason>(["work", "remote", "errand"]);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const validDate = (value: unknown) =>
  typeof value === "string" && Number.isFinite(new Date(value).getTime());

function assertData(value: unknown): asserts value is AppData {
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Array.isArray(value.entries) ||
    !isObject(value.profile) ||
    (value.theme !== "light" && value.theme !== "dark")
  )
    throw new Error("Ungültiges Sicherungsformat.");
  for (const entry of value.entries) {
    if (
      !isObject(entry) ||
      !string(entry.id) ||
      !validDate(entry.start) ||
      !validDate(entry.end) ||
      typeof entry.breakMinutes !== "number" ||
      !Number.isFinite(entry.breakMinutes) ||
      entry.breakMinutes < 0 ||
      !reasons.has(entry.reason as Reason) ||
      !string(entry.note)
    )
      throw new Error("Ungültige Buchung in der Sicherung.");
    const start = new Date(entry.start as string).getTime(),
      end = new Date(entry.end as string).getTime();
    if (end <= start || (entry.breakMinutes as number) * 60_000 >= end - start)
      throw new Error("Ungültige Buchungsdauer in der Sicherung.");
    if (end > Date.now() + 1_000)
      throw new Error(
        "Abgeschlossene Buchungen dürfen nicht in der Zukunft liegen.",
      );
  }
  const p = value.profile;
  if (
    !string(p.firstName) ||
    !string(p.lastName) ||
    !string(p.company) ||
    typeof p.weeklyHours !== "number" ||
    !Number.isFinite(p.weeklyHours) ||
    p.weeklyHours < 1 ||
    p.weeklyHours > 80 ||
    !Array.isArray(p.details)
  )
    throw new Error("Ungültiges Profil in der Sicherung.");
  for (const detail of p.details)
    if (
      !isObject(detail) ||
      !string(detail.id) ||
      !string(detail.label) ||
      !string(detail.value)
    )
      throw new Error("Ungültiges Profildetail in der Sicherung.");
  if (value.timer !== null) {
    const timer = value.timer;
    if (
      !isObject(timer) ||
      !validDate(timer.start) ||
      !reasons.has(timer.reason as Reason) ||
      !string(timer.note) ||
      (timer.pausedAt !== null && !validDate(timer.pausedAt)) ||
      typeof timer.pausedMs !== "number" ||
      !Number.isFinite(timer.pausedMs) ||
      timer.pausedMs < 0
    )
      throw new Error("Ungültige laufende Zeiterfassung in der Sicherung.");
    const timerEnd =
      timer.pausedAt === null
        ? Date.now()
        : new Date(timer.pausedAt as string).getTime();
    const timerStart = new Date(timer.start as string).getTime();
    if (
      timerEnd < timerStart ||
      (timer.pausedMs as number) > timerEnd - timerStart
    )
      throw new Error("Ungültige Pausenzeit in der Sicherung.");
  }
  const intervals = value.entries
    .map((entry) => ({
      id: entry.id,
      start: new Date(entry.start).getTime(),
      end: new Date(entry.end).getTime(),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const ids = new Set<string>();
  for (const entry of intervals) {
    if (ids.has(entry.id))
      throw new Error("Doppelte Buchungs-ID in der Sicherung.");
    ids.add(entry.id);
  }
  for (let index = 1; index < intervals.length; index += 1) {
    if (intervals[index].start < intervals[index - 1].end)
      throw new Error("Überschneidende Buchungen in der Sicherung.");
  }
  if (value.timer !== null) {
    const start = new Date((value.timer as Timer).start).getTime();
    const end = Date.now();
    if (
      intervals.some((interval) => interval.start < end && interval.end > start)
    )
      throw new Error(
        "Die laufende Zeiterfassung überschneidet sich mit einer Buchung.",
      );
  }
}

export function parseBackup(text: string): AppData {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Die Sicherungsdatei enthält kein gültiges JSON.");
  }
  assertData(value);
  return value;
}

export function backupJson(data: AppData): string {
  assertData(data);
  return JSON.stringify(data, null, 2);
}

const decode = (value: string, label: string): unknown => {
  try {
    return JSON.parse(atob(value));
  } catch {
    throw new Error(`Die Altdaten ${label} sind beschädigt.`);
  }
};
const legacyDateTime = (date: unknown, time: unknown): string => {
  if (
    !string(date) ||
    !/^\d{2}\.\d{2}\.\d{4}$/.test(date) ||
    !string(time) ||
    !/^\d{2}:\d{2}$/.test(time)
  )
    throw new Error(
      "Eine alte Buchung enthält ein ungültiges Datum oder eine ungültige Uhrzeit.",
    );
  const [d, m, y] = date.split(".").map(Number),
    [hour, minute] = time.split(":").map(Number);
  const result = new Date(y, m - 1, d, hour, minute);
  if (
    result.getFullYear() !== y ||
    result.getMonth() !== m - 1 ||
    result.getDate() !== d ||
    hour > 23 ||
    minute > 59
  )
    throw new Error(
      "Eine alte Buchung enthält ein ungültiges Datum oder eine ungültige Uhrzeit.",
    );
  return result.toISOString();
};
const legacyReason = (value: unknown): Reason =>
  value === 1 || value === "1"
    ? "work"
    : value === 2 || value === "2"
      ? "errand"
      : (() => {
          throw new Error("Eine alte Buchung hat einen unbekannten Grund.");
        })();

function importLegacy(storage: Storage): AppData | null {
  const rawTimes = storage.getItem("zt-bt");
  const rawUser = storage.getItem("zt-u");
  const rawDetails = storage.getItem("zt-ud");
  const rawLatest = storage.getItem("zt-iw");
  if (
    rawTimes === null &&
    rawUser === null &&
    rawDetails === null &&
    rawLatest === null
  )
    return null;
  const times = rawTimes === null ? [] : decode(rawTimes, "Buchungen");
  const user = rawUser === null ? null : decode(rawUser, "Profil");
  let details: unknown = [];
  if (rawDetails !== null)
    try {
      details = JSON.parse(rawDetails);
    } catch {
      throw new Error("Die Altdaten Profildetails sind beschädigt.");
    }
  if (
    !Array.isArray(times) ||
    (user !== null && !isObject(user)) ||
    !Array.isArray(details)
  )
    throw new Error("Die Altdaten haben ein ungültiges Format.");
  // Legacy `cst` is the X-Authorization token, not a company field.  Never migrate it.
  const profile: Profile = {
    firstName: user && string(user.firstname) ? user.firstname : "",
    lastName: user && string(user.lastname) ? user.lastname : "",
    company: "",
    weeklyHours: 40,
    details: [],
  };
  const relations =
    user && Array.isArray(user.userDetails) ? user.userDetails : [];
  for (const detail of details) {
    if (
      !isObject(detail) ||
      (!string(detail.detailid) && typeof detail.detailid !== "number") ||
      !string(detail.name)
    )
      throw new Error("Ein altes Profildetail ist ungültig.");
    const relation = relations.find(
      (item) =>
        isObject(item) && String(item.detailid) === String(detail.detailid),
    );
    if (
      relation !== undefined &&
      (!isObject(relation) || !string(relation.value))
    )
      throw new Error("Ein alter Profilwert ist ungültig.");
    profile.details.push({
      id: String(detail.detailid),
      label: detail.name,
      value: relation && isObject(relation) ? (relation.value as string) : "",
    });
  }
  const entries: Booking[] = [];
  let timer: Timer | null = null;
  for (const time of times) {
    if (!isObject(time)) throw new Error("Eine alte Buchung ist ungültig.");
    const id = time.bookingTimeId;
    if (!string(id) && typeof id !== "number")
      throw new Error("Eine alte Buchung hat keine ID.");
    const start = legacyDateTime(time.date, time.clockIn);
    const reason = legacyReason(time.bookingkeyId);
    if (
      time.clockOut === null ||
      time.clockOut === undefined ||
      time.clockOut === ""
    ) {
      if (timer)
        throw new Error(
          "Mehrere offene alte Buchungen können nicht importiert werden.",
        );
      timer = {
        start,
        reason,
        note: string(time.comment) ? time.comment : "",
        pausedAt: null,
        pausedMs: 0,
      };
    } else
      entries.push({
        id: String(id),
        start,
        end: legacyDateTime(time.date, time.clockOut),
        breakMinutes: 0,
        reason,
        note: string(time.comment) ? time.comment : "",
      });
  }
  if (rawLatest !== null) {
    try {
      JSON.parse(rawLatest);
    } catch {
      throw new Error("Die Altdaten letzter Status sind beschädigt.");
    }
  }
  const result: AppData = {
    version: 1,
    entries,
    timer,
    profile,
    theme: "light",
  };
  assertData(result);
  return result;
}

export function loadData(storage: Storage): {
  data: AppData;
  error: string | null;
  migrated: boolean;
} {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved !== null)
      return { data: parseBackup(saved), error: null, migrated: false };
    const legacy = importLegacy(storage);
    return {
      data: legacy ?? emptyData(),
      error: null,
      migrated: legacy !== null,
    };
  } catch (error) {
    return {
      data: emptyData(),
      error:
        error instanceof Error
          ? error.message
          : "Die gespeicherten Daten konnten nicht gelesen werden.",
      migrated: false,
    };
  }
}

export function saveData(storage: Storage, data: AppData): void {
  try {
    storage.setItem(STORAGE_KEY, backupJson(data));
  } catch {
    throw new Error("Die lokale Speicherung ist nicht verfügbar.");
  }
}
