import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Booking,
  demoData,
  emptyData,
  formatDuration,
  netMs,
  pauseTimer,
  removeBooking,
  startTimer,
  stopTimer,
  timerMs,
  toCsv,
  upsertBooking,
  validateBooking,
} from "./domain";

const booking = (changes: Partial<Booking> = {}): Booking => ({
  id: "a",
  start: "2026-11-03T22:00:00.000Z",
  end: "2026-11-04T06:30:00.000Z",
  breakMinutes: 30,
  reason: "work",
  note: "",
  ...changes,
});

afterEach(() => vi.useRealTimers());

describe("time domain", () => {
  it("calculates overnight and longer-than-a-day durations without wrapping", () => {
    expect(netMs(booking())).toBe(8 * 60 * 60_000);
    expect(formatDuration(27 * 60 * 60_000 + 5 * 60_000)).toBe("27:05");
    expect(formatDuration(30_000, true)).toBe("00:00:30");
  });

  it("keeps pause time across a reload-shaped timer and records it as booking break time", () => {
    let data = startTimer(
      emptyData(),
      "work",
      "Projekt",
      new Date("2026-11-03T08:00:00.000Z"),
    );
    data = pauseTimer(data, new Date("2026-11-03T10:00:00.000Z"));
    const reloaded = JSON.parse(JSON.stringify(data));
    data = pauseTimer(reloaded, new Date("2026-11-03T10:15:00.000Z"));
    expect(
      timerMs(data.timer!, new Date("2026-11-03T11:15:00.000Z").getTime()),
    ).toBe(3 * 60 * 60_000);
    data = stopTimer(data, new Date("2026-11-03T12:15:00.000Z"));
    expect(data.timer).toBeNull();
    expect(data.entries[0].breakMinutes).toBe(15);
    expect(netMs(data.entries[0])).toBe(4 * 60 * 60_000);
  });

  it("rejects overlaps, including a paused timer reservation", () => {
    expect(
      validateBooking(
        booking({
          id: "b",
          start: "2026-11-04T06:00:00.000Z",
          end: "2026-11-04T08:00:00.000Z",
        }),
        [booking()],
      ),
    ).toMatch(/überschneidet/);
    let data = startTimer(
      emptyData(),
      "work",
      "",
      new Date(Date.now() - 2 * 60 * 60_000),
    );
    data = pauseTimer(data, new Date(Date.now() - 60 * 60_000));
    expect(() =>
      upsertBooking(
        data,
        booking({
          start: new Date(Date.now() - 45 * 60_000).toISOString(),
          end: new Date(Date.now() - 15 * 60_000).toISOString(),
          breakMinutes: 0,
        }),
      ),
    ).toThrow(/laufenden/);
  });

  it("rejects future bookings while paused, so a timer remains resumable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00.000Z"));
    let data = startTimer(
      emptyData(),
      "work",
      "",
      new Date("2026-11-05T08:00:00.000Z"),
    );
    data = pauseTimer(data, new Date("2026-11-05T10:00:00.000Z"));
    expect(() =>
      upsertBooking(
        data,
        booking({
          start: "2026-11-05T14:00:00.000Z",
          end: "2026-11-05T15:00:00.000Z",
        }),
      ),
    ).toThrow(/Zukunft/);
  });

  it("rejects pause or resume timestamps before the current timer state", () => {
    let data = startTimer(
      emptyData(),
      "work",
      "",
      new Date("2026-11-05T08:00:00.000Z"),
    );
    expect(() =>
      pauseTimer(data, new Date("2026-11-05T07:59:59.000Z")),
    ).toThrow(/darf nicht vor/);
    data = pauseTimer(data, new Date("2026-11-05T10:00:00.000Z"));
    expect(() =>
      pauseTimer(data, new Date("2026-11-05T09:59:59.000Z")),
    ).toThrow(/darf nicht vor/);
  });

  it("does not start a timer inside an existing completed booking", () => {
    const data = { ...emptyData(), entries: [booking()] };
    expect(() =>
      startTimer(data, "work", "", new Date("2026-11-04T02:00:00.000Z")),
    ).toThrow(/überschneiden/);
  });

  it("deletes by booking ID, not by an accidental shared field", () => {
    const data = {
      ...emptyData(),
      entries: [
        booking({ id: "one" }),
        booking({
          id: "two",
          start: "2026-11-04T08:00:00.000Z",
          end: "2026-11-04T09:00:00.000Z",
        }),
      ],
    };
    expect(removeBooking(data, "one").entries.map((entry) => entry.id)).toEqual(
      ["two"],
    );
  });

  it("escapes semicolons and prevents spreadsheet formulas in CSV exports", () => {
    const csv = toCsv([booking({ note: '\t=SUM(A1:A2); "hello"' })]);
    expect(csv).toContain('\'\t=SUM(A1:A2); ""hello""');
    expect(csv.split("\r\n")[0]).toBe(
      "Datum;Start;Enddatum;Ende;Pause (Min.);Arbeitszeit;Grund;Notiz",
    );
  });

  it("provides a completed demo week without an active timer", () => {
    const demo = demoData(new Date("2026-11-05T12:00:00.000Z"));
    expect(demo.timer).toBeNull();
    expect(demo.entries).toHaveLength(4);
    expect(
      demo.entries.some((entry) => entry.start.slice(0, 10) === "2026-11-05"),
    ).toBe(false);
  });
});
