import { Download, Printer } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import {
  AppData,
  Booking,
  formatDuration,
  localDate,
  netMs,
  REASONS,
  toCsv,
} from "./domain";

type Props = { data: AppData };
const today = () => localDate(new Date());
const monthStart = () => `${today().slice(0, 7)}-01`;
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
const timeRange = (booking: Booking) =>
  localDate(booking.start) === localDate(booking.end)
    ? `${time(booking.start)} – ${time(booking.end)}`
    : `${time(booking.start)} – ${longDate(localDate(booking.end))}, ${time(booking.end)}`;

export default function ReportsView({ data }: Props) {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const invalidRange = !from || !to || from > to;
  const report = useMemo(() => {
    const entries = invalidRange
      ? []
      : data.entries
          .filter(
            (entry) =>
              Boolean(entry.end) &&
              Number.isFinite(new Date(entry.end).getTime()) &&
              localDate(entry.start) >= from &&
              localDate(entry.start) <= to,
          )
          .sort((a, b) => a.start.localeCompare(b.start));
    const days = new Map<string, Booking[]>();
    entries.forEach((entry) => {
      const date = localDate(entry.start);
      days.set(date, [...(days.get(date) ?? []), entry]);
    });
    const rows = [...days.entries()].map(([date, bookings]) => ({
      date,
      bookings,
      total: bookings.reduce((sum, booking) => sum + netMs(booking), 0),
    }));
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    return { entries, rows, total };
  }, [data.entries, from, to, invalidRange]);
  const exportCsv = () => {
    const blob = new Blob([`\uFEFF${toCsv(report.entries)}`], {
      type: "text/csv;charset=utf-8",
    });
    const href = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `zeiterfassung-${from}-bis-${to}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 0);
  };
  const person =
    [data.profile.firstName, data.profile.lastName].filter(Boolean).join(" ") ||
    "Ohne Namen";
  return (
    <div className="reports-view support-view">
      <div className="reports-heading">
        <p className="muted">
          Abgeschlossene Buchungen, dem Startdatum der Schicht zugeordnet.
        </p>
        <div className="reports-actions">
          <button
            className="button secondary"
            type="button"
            onClick={exportCsv}
            disabled={!report.entries.length || invalidRange}
          >
            <Download size={18} />
            CSV exportieren
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              if (!invalidRange) window.print();
            }}
            disabled={invalidRange}
          >
            <Printer size={18} />
            Drucken / PDF
          </button>
        </div>
      </div>
      <section className="panel reports-filter">
        <label className="field">
          Von
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="field">
          Bis
          <input
            type="date"
            value={to}
            max={today()}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        {invalidRange && (
          <p className="reports-range-error" role="alert">
            Bitte wähle einen vollständigen Zeitraum, bei dem das Enddatum nicht
            vor dem Startdatum liegt.
          </p>
        )}
      </section>
      <div className="reports-metrics">
        <section className="panel reports-metric">
          <span>Nettozeit</span>
          <strong>{formatDuration(report.total)}</strong>
        </section>
        <section className="panel reports-metric">
          <span>Arbeitstage</span>
          <strong>{report.rows.length}</strong>
        </section>
        <section className="panel reports-metric">
          <span>Ø pro Arbeitstag</span>
          <strong>
            {formatDuration(
              report.rows.length ? report.total / report.rows.length : 0,
            )}
          </strong>
        </section>
      </div>
      <section className="panel print-report">
        <header className="reports-report-header">
          <div>
            <h2>Zeiterfassungsbericht</h2>
            <p>
              {person}
              {data.profile.company ? ` · ${data.profile.company}` : ""}
            </p>
          </div>
          <p>
            {from && to
              ? `${longDate(from)} – ${longDate(to)}`
              : "Zeitraum wählen"}
          </p>
        </header>
        {!report.rows.length ? (
          <div className="empty-state">
            {invalidRange
              ? "Der gewählte Zeitraum ist ungültig."
              : "Für diesen Zeitraum liegen keine abgeschlossenen Buchungen vor."}
          </div>
        ) : (
          <div className="reports-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Zeiten</th>
                  <th>Grund</th>
                  <th>Pause</th>
                  <th>Netto</th>
                  <th>Notiz</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <Fragment key={row.date}>
                    {row.bookings.map((booking, index) => (
                      <tr
                        key={booking.id}
                        className={index === 0 ? "reports-day-start" : ""}
                      >
                        <td>{index === 0 ? longDate(row.date) : ""}</td>
                        <td>{timeRange(booking)}</td>
                        <td>
                          <span className="badge">
                            {REASONS[booking.reason]}
                          </span>
                        </td>
                        <td>{booking.breakMinutes} Min.</td>
                        <td>{formatDuration(netMs(booking))}</td>
                        <td>{booking.note || "–"}</td>
                      </tr>
                    ))}
                    <tr className="reports-day-total">
                      <td colSpan={4}>Tagesgesamt</td>
                      <td>{formatDuration(row.total)}</td>
                      <td />
                    </tr>
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Gesamt</td>
                  <td>{formatDuration(report.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
