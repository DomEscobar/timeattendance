import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const KEY = "timeattendance-modern-v1";
const state = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), KEY);
const navigate = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Hauptnavigation" })
    .getByRole("link", { name, exact: true })
    .click();
async function addBooking(
  page: Page,
  start: string,
  end: string,
  note: string,
  pause = "30",
) {
  await page
    .getByRole("button", { name: "Zeit nachtragen", exact: true })
    .first()
    .click();
  await page.getByLabel("Beginn", { exact: true }).fill(start);
  await page.getByLabel("Ende", { exact: true }).fill(end);
  await page.getByLabel("Pause in Minuten").fill(pause);
  await page
    .getByRole("dialog")
    .getByLabel("Notiz", { exact: false })
    .fill(note);
  await page.getByRole("button", { name: "Buchung speichern" }).click();
  await expect
    .poll(
      async () =>
        !(await page.getByRole("dialog").isVisible()) ||
        (await page.getByRole("dialog").getByRole("alert").count()) > 0,
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-05T08:00:00+01:00") });
  await page.goto("/");
});

test("clock, pause, reload, resume and clock out preserve exact working time", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Homeoffice", exact: true }).click();
  await page.getByLabel("Notiz zur Zeiterfassung").fill("Projekt Neustart");
  await page.getByRole("button", { name: /Einstempeln/ }).click();
  await page.clock.runFor(75_000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByText("In der Pause", { exact: true })).toBeVisible();
  const paused = await state(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Weiterarbeiten" }),
  ).toBeVisible();
  expect((await state(page)).timer).toEqual(paused.timer);
  await page.clock.runFor(600_000);
  await page.getByRole("button", { name: "Weiterarbeiten" }).click();
  await page.clock.runFor(60_000);
  await page.getByRole("button", { name: "Ausstempeln", exact: true }).click();
  await expect(page.getByRole("button", { name: /Einstempeln/ })).toBeVisible();
  const saved = await state(page);
  expect(saved.timer).toBeNull();
  expect(saved.entries).toHaveLength(1);
  expect(saved.entries[0].reason).toBe("remote");
  expect(saved.entries[0].breakMinutes).toBeCloseTo(10, 0);
  const net =
    new Date(saved.entries[0].end).getTime() -
    new Date(saved.entries[0].start).getTime() -
    saved.entries[0].breakMinutes * 60000;
  expect(net / 1000).toBeGreaterThanOrEqual(135);
  expect(net / 1000).toBeLessThan(140);
  await page.reload();
  await expect(
    page.getByText("Projekt Neustart", { exact: true }),
  ).toBeVisible();
});

test("manual overnight booking, overlap validation, edit and exact-id deletion", async ({
  page,
}) => {
  await navigate(page, "Zeitbuchungen");
  await addBooking(
    page,
    "2026-11-02T22:00",
    "2026-11-03T06:00",
    "Nachtschicht",
  );
  await expect(page.getByText("Nachtschicht", { exact: true })).toBeVisible();
  expect((await state(page)).entries).toHaveLength(1);
  await addBooking(
    page,
    "2026-11-03T05:00",
    "2026-11-03T07:00",
    "Überschneidung",
  );
  await expect(page.getByRole("alert")).toContainText("überschneidet");
  expect((await state(page)).entries).toHaveLength(1);
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await addBooking(
    page,
    "2026-11-04T09:00",
    "2026-11-04T17:00",
    "Zweite Buchung",
  );
  await page
    .getByRole("row")
    .filter({ hasText: "Nachtschicht" })
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Notiz", { exact: false })
    .fill("Geänderte Nachtschicht");
  await page.getByRole("button", { name: "Buchung speichern" }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Geänderte Nachtschicht" })
    .getByRole("button")
    .click();
  await page
    .getByRole("button", { name: "Buchung löschen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ja, Buchung löschen", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect((await state(page)).entries).toHaveLength(1);
  expect((await state(page)).entries[0].note).toBe("Zweite Buchung");
  await page.getByLabel("Buchungen durchsuchen").fill("unbekannt");
  await expect(page.getByText("0 Buchungen", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Filter zurücksetzen" }).click();
  await expect(page.getByText("Zweite Buchung", { exact: true })).toBeVisible();
});

test("short timer entries retain seconds when editing only their note", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Einstempeln/ }).click();
  await page.clock.runFor(15_000);
  await page.getByRole("button", { name: "Ausstempeln", exact: true }).click();
  await expect(page.getByRole("button", { name: /Einstempeln/ })).toBeVisible();
  const before = (await state(page)).entries[0];
  await page.getByRole("button", { name: /Buchung vom .* bearbeiten/ }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Notiz", { exact: false })
    .fill("Kurze Aufgabe");
  await page.getByRole("button", { name: "Buchung speichern" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const after = (await state(page)).entries[0];
  expect(after.start).toBe(before.start);
  expect(after.end).toBe(before.end);
  expect(after.note).toBe("Kurze Aufgabe");
});

test("profile, theme, backup export and confirmed import survive reload", async ({
  page,
}) => {
  await navigate(page, "Einstellungen");
  await page.getByLabel("Vorname", { exact: true }).fill("Julia");
  await page.getByLabel("Nachname", { exact: true }).fill("Müller");
  await page.getByLabel("Unternehmen", { exact: true }).fill("Studio Nord");
  await page.getByLabel("Wochenziel (Stunden)").fill("32");
  await page.getByRole("button", { name: "Eigenes Feld hinzufügen" }).click();
  await page.getByLabel("Feldbezeichnung").fill("Personalnummer");
  await page.getByLabel("Feldwert").fill("4711");
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await page.getByRole("button", { name: "Dunkel", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByLabel("Vorname", { exact: true })).toHaveValue(
    "Julia",
  );
  await expect(page.getByLabel("Feldwert")).toHaveValue("4711");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sicherung herunterladen" }).click();
  const file = await downloadEvent;
  const json = await readFile((await file.path())!, "utf8");
  expect(JSON.parse(json).profile.firstName).toBe("Julia");
  await page.getByLabel("Vorname", { exact: true }).fill("Temporär");
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await state(page)).profile.firstName).toBe("Temporär");
  await page
    .getByRole("button", { name: "Daten ersetzen", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect((await state(page)).profile.firstName).toBe("Julia");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":1}'),
    });
  await expect(page.getByRole("alert")).toContainText("Ungültig");
  expect((await state(page)).profile.firstName).toBe("Julia");
});

test("reports export actual CSV, printable report and mobile layout", async ({
  page,
}, testInfo) => {
  await navigate(page, "Zeitbuchungen");
  await addBooking(
    page,
    "2026-11-02T09:00",
    "2026-11-02T17:30",
    "Design; Konzept",
  );
  await navigate(page, "Berichte");
  await expect(
    page.getByText("Design; Konzept", { exact: true }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "CSV exportieren", exact: true })
    .click();
  const file = await downloadEvent;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain("09:00");
  expect(csv).toContain("17:30");
  expect(csv).toContain("08:00");
  expect(csv).toContain('"Design; Konzept"');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/evidence/${testInfo.project.name}-reports.png`,
    fullPage: true,
    scale: "css",
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  if (testInfo.project.name === "desktop") {
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: "docs/evidence/report.pdf",
      format: "A4",
      printBackground: true,
    });
    await expect(page.getByRole("navigation")).not.toBeVisible();
    await page.emulateMedia({ media: "screen" });
  }
});

test("demo stays isolated, all views fit, and no runtime errors occur", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Demodaten ansehen" }).click();
  await expect(page.locator(".demo-banner")).toContainText("Demo-Modus");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/evidence/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
    scale: "css",
  });
  expect(await state(page)).toBeNull();
  for (const name of [
    "Zeitbuchungen",
    "Berichte",
    "Einstellungen",
    "Übersicht",
  ]) {
    await navigate(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  await page.getByRole("button", { name: "Demo beenden" }).click();
  await expect(
    page.getByText("Hier beginnt dein Überblick.", { exact: true }),
  ).toBeVisible();
  expect(await state(page)).toBeNull();
  expect(errors).toEqual([]);
});

test("legacy data migrates without modifying source and corrupt storage is not overwritten", async ({
  page,
}) => {
  await page.evaluate(() => {
    localStorage.setItem(
      "zt-bt",
      btoa(
        JSON.stringify([
          {
            bookingTimeId: "old-1",
            date: "03.11.2026",
            clockIn: "08:00",
            clockOut: "16:00",
            bookingkeyId: 1,
            comment: "Alte Buchung",
          },
        ]),
      ),
    );
    localStorage.setItem(
      "zt-u",
      btoa(
        JSON.stringify({ firstname: "Max", lastname: "Alt", userDetails: [] }),
      ),
    );
  });
  await page.reload();
  await expect(page.getByText("Alte Buchung", { exact: true })).toBeVisible();
  expect((await state(page)).entries[0].id).toBe("old-1");
  expect(await page.evaluate(() => localStorage.getItem("zt-bt"))).toBeTruthy();
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), KEY);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("JSON");
  await page.getByRole("button", { name: /Einstempeln/ }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    "{broken",
  );
});

test("stale editor cannot overwrite a newer change from another tab", async ({
  page,
  context,
}) => {
  await navigate(page, "Zeitbuchungen");
  await addBooking(page, "2026-11-03T09:00", "2026-11-03T17:00", "Original");
  await page
    .getByRole("row")
    .filter({ hasText: "Original" })
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Notiz", { exact: false })
    .fill("Veralteter Entwurf");
  const second = await context.newPage();
  await second.goto("/#bookings");
  await second
    .getByRole("row")
    .filter({ hasText: "Original" })
    .getByRole("button")
    .click();
  await second
    .getByRole("dialog")
    .getByLabel("Notiz", { exact: false })
    .fill("Aktuelle Änderung");
  await second.getByRole("button", { name: "Buchung speichern" }).click();
  await expect(second.getByRole("dialog")).not.toBeVisible();
  await expect
    .poll(async () => (await state(page)).entries[0].note)
    .toBe("Aktuelle Änderung");
  await page.getByRole("button", { name: "Buchung speichern" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "anderen Tab",
  );
  expect((await state(page)).entries[0].note).toBe("Aktuelle Änderung");
  await second.close();
});

test("simultaneous writes are serialized and a conflicting save is rejected", async ({
  page,
  context,
}) => {
  const second = await context.newPage();
  await second.clock.install({ time: new Date("2026-11-05T08:00:00+01:00") });
  await second.goto("/");
  // Hold the same origin lock to make both tabs queue changes against the same version.
  await page.evaluate((key) => {
    const target = window as typeof window & { releaseTestLock?: () => void };
    void navigator.locks.request(
      key,
      () =>
        new Promise<void>((resolve) => {
          target.releaseTestLock = resolve;
        }),
    );
  }, KEY);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as typeof window & { releaseTestLock?: () => void })
            .releaseTestLock,
      ),
    )
    .toBe("function");
  await page.getByRole("button", { name: /Einstempeln/ }).click();
  await second.getByRole("button", { name: /Einstempeln/ }).click();
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await navigator.locks.query()).pending?.length,
      ),
    )
    .toBe(2);
  await page.evaluate(() =>
    (
      window as typeof window & { releaseTestLock?: () => void }
    ).releaseTestLock?.(),
  );
  await expect(
    page.getByRole("button", { name: "Ausstempeln", exact: true }),
  ).toBeVisible();
  await expect(second.getByRole("alert")).toContainText("anderen Tab");
  expect((await state(page)).timer).not.toBeNull();
  expect((await state(page)).entries).toHaveLength(0);
  await second.close();
});
