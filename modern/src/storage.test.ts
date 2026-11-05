import { afterEach, describe, expect, it, vi } from "vitest";
import { AppData, emptyData } from "./domain";
import {
  STORAGE_KEY,
  backupJson,
  loadData,
  parseBackup,
  saveData,
} from "./storage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const valid = (): AppData => ({
  ...emptyData(),
  profile: { ...emptyData().profile, weeklyHours: 40 },
  entries: [
    {
      id: "one",
      start: "2026-11-03T08:00:00.000Z",
      end: "2026-11-03T16:30:00.000Z",
      breakMinutes: 30,
      reason: "work",
      note: "ok",
    },
  ],
});

afterEach(() => vi.useRealTimers());

describe("storage", () => {
  it("round-trips a strict valid backup and rejects malformed or unsafe backups", () => {
    expect(parseBackup(backupJson(valid()))).toEqual(valid());
    expect(() => parseBackup("{bad")).toThrow(/gültiges JSON/);
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...valid(),
          entries: [...valid().entries, { ...valid().entries[0] }],
        }),
      ),
    ).toThrow(/Doppelte/);
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...valid(),
          profile: { ...valid().profile, weeklyHours: 81 },
        }),
      ),
    ).toThrow(/Profil/);
  });

  it("does not overwrite malformed current data and returns an error", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{broken");
    const result = loadData(storage);
    expect(result.error).toMatch(/gültiges JSON/);
    expect(storage.getItem(STORAGE_KEY)).toBe("{broken");
  });

  it("rejects a future completed booking in a backup", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00.000Z"));
    const future = {
      ...valid(),
      entries: [
        {
          ...valid().entries[0],
          start: "2026-11-05T13:00:00.000Z",
          end: "2026-11-05T14:00:00.000Z",
        },
      ],
    };
    expect(() => parseBackup(JSON.stringify(future))).toThrow(/Zukunft/);
  });

  it("imports complete legacy data only when the new key is absent", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "zt-bt",
      btoa(
        JSON.stringify([
          {
            bookingTimeId: "old-1",
            date: "03.11.2026",
            clockIn: "08:00",
            clockOut: "16:30",
            bookingkeyId: 1,
            comment: "Alt",
          },
          {
            bookingTimeId: "open",
            date: "04.11.2026",
            clockIn: "09:00",
            clockOut: null,
            bookingkeyId: 2,
          },
        ]),
      ),
    );
    storage.setItem(
      "zt-u",
      btoa(
        JSON.stringify({
          firstname: "Ada",
          lastname: "Lovelace",
          cst: "secret-token",
          password: "secret-password",
          userDetails: [{ detailid: 7, value: "Berlin" }],
        }),
      ),
    );
    storage.setItem(
      "zt-ud",
      JSON.stringify([{ detailid: 7, name: "Standort" }]),
    );
    const result = loadData(storage);
    expect(result).toMatchObject({ migrated: true, error: null });
    expect(result.data.entries[0]).toMatchObject({
      id: "old-1",
      reason: "work",
      note: "Alt",
    });
    expect(result.data.timer).toMatchObject({ reason: "errand" });
    expect(result.data.profile).toMatchObject({
      firstName: "Ada",
      details: [{ id: "7", label: "Standort", value: "Berlin" }],
    });
    expect(result.data.profile.company).toBe("");
    expect(backupJson(result.data)).not.toMatch(
      /secret-token|secret-password|"cst"|"password"/,
    );
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("refuses malformed present booking data or multiple-open legacy data", () => {
    const storage = new MemoryStorage();
    storage.setItem("zt-bt", "not-base64");
    expect(loadData(storage).error).toMatch(/Buchungen.*beschädigt/);
    storage.setItem("zt-u", btoa(JSON.stringify({})));
    storage.setItem(
      "zt-bt",
      btoa(
        JSON.stringify([
          {
            bookingTimeId: "1",
            date: "03.11.2026",
            clockIn: "08:00",
            bookingkeyId: 1,
          },
          {
            bookingTimeId: "2",
            date: "03.11.2026",
            clockIn: "09:00",
            bookingkeyId: 1,
          },
        ]),
      ),
    );
    expect(loadData(storage).error).toMatch(/Mehrere offene/);
  });

  it("imports valid legacy bookings without a legacy profile, but rejects timer overlap", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "zt-bt",
      btoa(
        JSON.stringify([
          {
            bookingTimeId: "closed",
            date: "03.11.2026",
            clockIn: "08:00",
            clockOut: "10:00",
            bookingkeyId: 1,
          },
        ]),
      ),
    );
    expect(loadData(storage)).toMatchObject({
      migrated: true,
      error: null,
      data: { profile: { firstName: "", lastName: "" } },
    });
    const bad = {
      ...valid(),
      timer: {
        start: "2026-11-03T09:00:00.000Z",
        reason: "work" as const,
        note: "",
        pausedAt: null,
        pausedMs: 0,
      },
    };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/überschneidet/);
  });

  it("imports a legacy profile saved before its first booking", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "zt-u",
      btoa(
        JSON.stringify({
          firstname: "Ada",
          lastname: "Lovelace",
          cst: "do-not-copy",
        }),
      ),
    );
    const result = loadData(storage);
    expect(result).toMatchObject({
      migrated: true,
      error: null,
      data: {
        entries: [],
        profile: { firstName: "Ada", lastName: "Lovelace", company: "" },
      },
    });
    expect(backupJson(result.data)).not.toContain("do-not-copy");
  });

  it("saves only valid data", () => {
    const storage = new MemoryStorage();
    saveData(storage, valid());
    expect(storage.getItem(STORAGE_KEY)).toContain('"version": 1');
  });
});
