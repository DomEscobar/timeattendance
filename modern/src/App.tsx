import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coffee,
  FileText,
  LayoutDashboard,
  Monitor,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import {
  type AppData,
  type Booking,
  type Reason,
  REASONS,
  demoData,
  emptyData,
  formatDuration,
  localDate,
  netMs,
  pauseTimer,
  removeBooking,
  startTimer,
  stopTimer,
  timerMs,
  toCsv,
  upsertBooking,
} from "./domain";
import {
  backupJson,
  loadData,
  parseBackup,
  saveData,
  STORAGE_KEY,
} from "./storage";
import ProfileView from "./ProfileView";
import ReportsView from "./ReportsView";

type Page = "overview" | "bookings" | "reports" | "profile";
const pages: { id: Page; label: string; icon: typeof Clock3 }[] = [
  { id: "overview", label: "Übersicht", icon: LayoutDashboard },
  { id: "bookings", label: "Zeitbuchungen", icon: Clock3 },
  { id: "reports", label: "Berichte", icon: ChartNoAxesCombined },
  { id: "profile", label: "Einstellungen", icon: Settings2 },
];
const getPage = (): Page =>
  pages.some((p) => p.id === location.hash.slice(1))
    ? (location.hash.slice(1) as Page)
    : "overview";
const clock = (date: string | number) =>
  new Date(date).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dateLabel = (date: string | Date, long = false) =>
  new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: long ? "long" : "short",
    ...(long ? { year: "numeric" } : {}),
  });
const sum = (entries: Booking[]) =>
  entries.reduce((total, entry) => total + netMs(entry), 0);
function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function readInitial() {
  try {
    return loadData(localStorage);
  } catch {
    return {
      data: emptyData(),
      error: "Der Browser erlaubt keinen Zugriff auf den lokalen Speicher.",
      migrated: false,
    };
  }
}

export default function App() {
  const [initial] = useState(readInitial);
  const [saved, setSaved] = useState(initial.data);
  const [demo, setDemo] = useState<AppData | null>(null);
  const data = demo ?? saved;
  const [page, setPage] = useState<Page>(getPage);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(initial.error ?? "");
  const [storageBlocked, setStorageBlocked] = useState(!!initial.error);
  const [editing, setEditing] = useState<Booking | "new" | null>(null);
  const [help, setHelp] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [saving, setSaving] = useState(false);
  const storageVersion = useRef<string | null>(null);

  useEffect(() => {
    try {
      storageVersion.current = localStorage.getItem(STORAGE_KEY);
      if (initial.migrated && navigator.locks) {
        void navigator.locks
          .request(STORAGE_KEY, () => {
            if (localStorage.getItem(STORAGE_KEY) === null) {
              saveData(localStorage, initial.data);
              storageVersion.current = localStorage.getItem(STORAGE_KEY);
              setNotice(
                "Deine bisherigen lokalen Buchungen wurden übernommen.",
              );
            }
          })
          .catch((err) => {
            setStorageBlocked(true);
            setError(String(err));
          });
      }
    } catch (err) {
      setStorageBlocked(true);
      setError(String(err));
    }
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const route = () => setPage(getPage());
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const result = readInitial();
      if (result.error) {
        setError(result.error);
        setStorageBlocked(true);
        return;
      }
      setSaved(result.data);
      storageVersion.current = localStorage.getItem(STORAGE_KEY);
      setNotice("Änderungen aus einem anderen Tab wurden übernommen.");
    };
    window.addEventListener("hashchange", route);
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(tick);
      window.removeEventListener("hashchange", route);
      window.removeEventListener("storage", sync);
    };
  }, [initial]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);

  async function commit(next: AppData, message = "", importing = false) {
    if (demo) {
      setDemo(next);
      if (message) setNotice(message);
      return;
    }
    if (storageBlocked && !importing)
      throw new Error(
        "Gespeicherte Daten konnten nicht gelesen werden. Bitte zuerst eine gültige Sicherung importieren; vorhandene Daten bleiben unverändert.",
      );
    if (!navigator.locks)
      throw new Error(
        "Dieser Browser unterstützt keine sichere lokale Speicherung. Bitte nutze eine aktuelle Version von Chrome, Edge, Firefox oder Safari.",
      );
    const expectedVersion = storageVersion.current;
    setSaving(true);
    try {
      await navigator.locks.request(STORAGE_KEY, () => {
        if (localStorage.getItem(STORAGE_KEY) !== expectedVersion)
          throw new Error(
            "Die Daten wurden in einem anderen Tab geändert. Bitte lade diese Seite neu.",
          );
        saveData(localStorage, next);
        storageVersion.current = localStorage.getItem(STORAGE_KEY);
        setSaved(next);
        setStorageBlocked(false);
        setError("");
        if (message) setNotice(message);
      });
    } finally {
      setSaving(false);
    }
  }
  async function action(change: (current: AppData) => AppData, message = "") {
    try {
      await commit(change(data), message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Die Änderung konnte nicht gespeichert werden.",
      );
    }
  }
  function checkEditingConflict() {
    if (
      editing &&
      editing !== "new" &&
      JSON.stringify(data.entries.find((entry) => entry.id === editing.id)) !==
        JSON.stringify(editing)
    ) {
      throw new Error(
        "Diese Buchung wurde in einem anderen Tab geändert. Bitte schließe den Dialog und öffne die aktuelle Buchung erneut.",
      );
    }
  }
  function importBackup(text: string) {
    try {
      setPendingImport(parseBackup(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  }
  const firstName = data.profile.firstName;
  const initials = (firstName[0] ?? "D") + (data.profile.lastName[0] ?? "Z");
  const go = (target: Page) => {
    location.hash = target;
    setPage(target);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="simplezeit Übersicht">
          <span className="brand-mark">
            <Clock3 size={23} strokeWidth={2.3} />
          </span>
          simple<span>zeit</span>
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Monitor size={18} />
          </span>
          <div>
            <strong>Mein Arbeitsbereich</strong>
            <span>Persönliche Zeiterfassung</span>
          </div>
        </div>
        <p className="nav-label">ARBEITSPLATZ</p>
        <nav aria-label="Hauptnavigation">
          {pages.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={page === id ? "nav-link active" : "nav-link"}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === id && <span className="nav-active-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <span className="privacy-icon">
              <ShieldCheck size={22} />
            </span>
            <strong>Deine Zeit bleibt deine.</strong>
            <p>Privat gespeichert, direkt in diesem Browser.</p>
            <button className="text-button" onClick={() => setHelp(true)}>
              Mehr erfahren <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="user-card" onClick={() => go("profile")}>
            <span className="avatar">{initials}</span>
            <span>
              <strong>
                {firstName
                  ? `${firstName} ${data.profile.lastName}`
                  : "Dein Profil"}
              </strong>
              <small>{data.profile.company || "Persönlicher Bereich"}</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Mein Arbeitsbereich <ChevronRight size={13} />
            <strong>{pages.find((p) => p.id === page)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-status">
              <span />
              {storageBlocked
                ? "Speicherung blockiert"
                : demo
                  ? "Demo-Modus"
                  : saving
                    ? "Wird gespeichert …"
                    : "Lokal gespeichert"}
            </span>
            <button
              className="icon-button"
              aria-label="Hilfe zur lokalen Speicherung"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="avatar small"
              aria-label="Profil öffnen"
              onClick={() => go("profile")}
            >
              {initials}
            </button>
          </div>
        </header>
        <main id="main-content" inert={saving} aria-busy={saving}>
          {demo && (
            <div className="demo-banner">
              <span>
                <strong>Demo-Modus</strong> · Beispieldaten zum Ausprobieren.
                Deine eigenen Daten bleiben erhalten.
              </span>
              <button
                onClick={() => {
                  setDemo(null);
                  setNotice("Zurück in deinem Arbeitsbereich.");
                }}
              >
                Demo beenden <X size={14} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                aria-label="Fehlermeldung schließen"
                className="icon-button"
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === "overview"
                  ? `${new Date(now).getHours() < 11 ? "GUTEN MORGEN" : new Date(now).getHours() < 18 ? "HALLO" : "GUTEN ABEND"}${firstName ? `, ${firstName.toLocaleUpperCase("de-DE")}` : ""} 👋`
                  : "DEIN ARBEITSBEREICH"}
              </p>
              <h1>
                {page === "overview"
                  ? "Deine Zeit. Im Überblick."
                  : page === "bookings"
                    ? "Jede Stunde zählt."
                    : page === "reports"
                      ? "Zeit, Bilanz zu ziehen."
                      : "Ganz nach deinem Rhythmus."}
              </h1>
              <p className="page-description">
                {page === "overview"
                  ? "Weniger Verwaltung. Mehr Fokus auf das, was zählt."
                  : page === "bookings"
                    ? "Alle Arbeitszeiten an einem Ort – übersichtlich und editierbar."
                    : page === "reports"
                      ? "Deine Arbeitszeit, verständlich zusammengefasst."
                      : "Dein Profil, dein Wochenziel und deine Daten."}
              </p>
            </div>
            {page === "overview" ? (
              <div className="today-chip">
                <CalendarDays size={17} />
                {dateLabel(new Date(now), true)}
              </div>
            ) : page === "bookings" ? (
              <button
                className="button primary"
                onClick={() => setEditing("new")}
              >
                <Plus size={17} /> Zeit nachtragen
              </button>
            ) : null}
          </div>

          {page === "overview" && (
            <Dashboard
              data={data}
              now={now}
              action={action}
              onEdit={setEditing}
              onNavigate={go}
            />
          )}
          {page === "bookings" && <Bookings data={data} onEdit={setEditing} />}
          {page === "reports" && <ReportsView data={data} />}
          {page === "profile" && (
            <ProfileView
              data={data}
              onSaveProfile={(profile) =>
                action(
                  (current) => ({ ...current, profile }),
                  "Dein Profil wurde gespeichert.",
                )
              }
              onThemeChange={(theme) =>
                action((current) => ({ ...current, theme }))
              }
              onExportBackup={() =>
                download(
                  backupJson(data),
                  `simplezeit-backup-${localDate(new Date())}.json`,
                  "application/json",
                )
              }
              onImportBackup={importBackup}
            />
          )}

          <footer className="footer">
            <span>
              <span className="tiny-brand">simplezeit.</span> Raum für deinen
              Tag.
            </span>
            <span>
              {!demo && (
                <button
                  className="text-button"
                  onClick={() => {
                    setDemo(demoData());
                    setPage("overview");
                    location.hash = "overview";
                  }}
                >
                  Demodaten ansehen <ArrowUpRight size={13} />
                </button>
              )}
              <span className="version">NEU GEDACHT · V2.0</span>
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {editing && (
        <BookingEditor
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (entry) => {
            checkEditingConflict();
            await commit(upsertBooking(data, entry), "Buchung gespeichert.");
            setEditing(null);
          }}
          onDelete={async (id) => {
            checkEditingConflict();
            await commit(removeBooking(data, id), "Buchung gelöscht.");
            setEditing(null);
          }}
        />
      )}
      {help && (
        <Modal
          title="Deine Daten. Unter deiner Kontrolle."
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <ShieldCheck size={35} />
            <p>
              simplezeit speichert Buchungen und Profil ausschließlich im
              lokalen Speicher dieses Browsers. Es gibt kein Konto und keine
              Übertragung an einen Server.
            </p>
            <p>
              Die Daten sind an diesen Browser und diese Webadresse gebunden.
              Beim Löschen der Browserdaten gehen sie verloren. Lade deshalb
              regelmäßig eine JSON-Sicherung herunter. Auf einem anderen Gerät
              kannst du sie wieder importieren.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setHelp(false);
                go("profile");
              }}
            >
              Zur Datensicherung <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {pendingImport && (
        <Modal
          title="Sicherung wiederherstellen?"
          onClose={() => setPendingImport(null)}
        >
          <p className="dialog-copy">
            Die Sicherung enthält {pendingImport.entries.length} Buchungen. Sie
            ersetzt das aktuelle Profil, alle Buchungen und eine eventuell
            laufende Zeiterfassung{demo ? " in der Demo" : ""}. Lade vorher bei
            Bedarf eine Sicherung herunter.
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() =>
                download(
                  backupJson(data),
                  `simplezeit-vor-import-${localDate(new Date())}.json`,
                  "application/json",
                )
              }
            >
              <ArrowDownToLine size={16} /> Aktuelle Daten sichern
            </button>
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await commit(
                    pendingImport,
                    "Sicherung wiederhergestellt.",
                    true,
                  );
                  setPendingImport(null);
                } catch (err) {
                  setError(String(err));
                  setPendingImport(null);
                }
              }}
            >
              Daten ersetzen
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Dashboard({
  data,
  now,
  action,
  onEdit,
  onNavigate,
}: {
  data: AppData;
  now: number;
  action: (fn: (data: AppData) => AppData, message?: string) => void;
  onEdit: (entry: Booking | "new") => void;
  onNavigate: (page: Page) => void;
}) {
  const [reason, setReason] = useState<Reason>("work");
  const [note, setNote] = useState("");
  const today = localDate(new Date(now));
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const live = data.timer ? timerMs(data.timer, now) : 0;
  const todayTotal =
    sum(data.entries.filter((e) => localDate(e.start) === today)) +
    (data.timer && localDate(data.timer.start) === today ? live : 0);
  const weekTotal =
    sum(
      data.entries.filter(
        (e) =>
          localDate(e.start) >= localDate(monday) &&
          localDate(e.start) <= localDate(sunday),
      ),
    ) +
    (data.timer &&
    localDate(data.timer.start) >= localDate(monday) &&
    localDate(data.timer.start) <= localDate(sunday)
      ? live
      : 0);
  const monthTotal =
    sum(
      data.entries.filter(
        (e) => localDate(e.start).slice(0, 7) === today.slice(0, 7),
      ),
    ) +
    (data.timer && localDate(data.timer.start).slice(0, 7) === today.slice(0, 7)
      ? live
      : 0);
  const dayTarget = data.profile.weeklyHours / 5;
  const dailyProgress = Math.min(
    100,
    (todayTotal / (dayTarget * 3600000)) * 100,
  );
  const recent = [...data.entries]
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 4);
  return (
    <>
      <div className="stats-grid">
        <Stat
          icon={Sun}
          title="Heute"
          value={formatDuration(todayTotal)}
          suffix="Std."
          detail={`Dein Tagesziel: ${dayTarget.toLocaleString("de-DE")} Std.`}
          variant="warm"
          progress={dailyProgress}
        />
        <Stat
          icon={CalendarDays}
          title="Diese Woche"
          value={formatDuration(weekTotal)}
          suffix="Std."
          detail={`von ${data.profile.weeklyHours} Std. Wochenziel`}
          variant="purple"
          progress={Math.min(
            100,
            (weekTotal / (data.profile.weeklyHours * 3600000)) * 100,
          )}
        />
        <Stat
          icon={ChartNoAxesCombined}
          title="Dieser Monat"
          value={formatDuration(monthTotal)}
          suffix="Std."
          detail={`${data.entries.filter((e) => localDate(e.start).slice(0, 7) === today.slice(0, 7)).length} abgeschlossene Buchungen`}
          variant="green"
        />
      </div>
      <div className="dashboard-middle">
        <section
          className={`panel timer-panel ${data.timer ? "is-running" : ""}`}
          aria-label="Zeiterfassung"
        >
          <div className="section-heading">
            <h2>
              <Clock3 size={18} /> Deine Stempeluhr
            </h2>
            <span
              className={`status-pill ${data.timer ? (data.timer.pausedAt ? "paused" : "running") : ""}`}
            >
              <span />
              {data.timer
                ? data.timer.pausedAt
                  ? "In der Pause"
                  : "Zeit läuft"
                : "Bereit, wenn du es bist"}
            </span>
          </div>
          <div className="timer-clock-wrap">
            <div className="timer-orbit orbit-one" />
            <div className="timer-orbit orbit-two" />
            <p className="timer-caption">
              {data.timer
                ? data.timer.pausedAt
                  ? "EIN MOMENT ZUM DURCHATMEN"
                  : "DEINE AKTUELLE ARBEITSZEIT"
                : "DEIN NÄCHSTER FOKUSMOMENT"}
            </p>
            <div
              className="timer-digits"
              aria-label={`Arbeitszeit ${formatDuration(live, true)}`}
            >
              {formatDuration(live, true).slice(0, -3)}
              <span>{formatDuration(live, true).slice(-3)}</span>
            </div>
            <p className="timer-subline">
              {data.timer
                ? `Gestartet um ${clock(data.timer.start)} Uhr · ${REASONS[data.timer.reason]}`
                : "Ein Klick. Und dein Arbeitstag beginnt."}
            </p>
          </div>
          {!data.timer ? (
            <>
              <div className="reason-picker" aria-label="Art der Arbeit">
                {(Object.keys(REASONS) as Reason[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setReason(key)}
                    aria-pressed={reason === key}
                    className={reason === key ? "selected" : ""}
                  >
                    {REASONS[key]}
                  </button>
                ))}
              </div>
              <div className="timer-note">
                <FileText size={15} />
                <input
                  aria-label="Notiz zur Zeiterfassung"
                  placeholder="Woran arbeitest du? (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                />
              </div>
              <button
                className="button primary start-button"
                onClick={() =>
                  action(
                    (current) => startTimer(current, reason, note),
                    "Deine Zeiterfassung läuft.",
                  )
                }
              >
                <Play size={17} fill="currentColor" /> Einstempeln{" "}
                <span>Los geht’s</span>
              </button>
            </>
          ) : (
            <>
              <div className="active-task">
                <span className={`reason-dot ${data.timer.reason}`} />
                <span>{data.timer.note || REASONS[data.timer.reason]}</span>
              </div>
              <div className="timer-actions">
                <button
                  className="button secondary"
                  onClick={() => action((current) => pauseTimer(current))}
                >
                  {data.timer.pausedAt ? (
                    <Play size={17} />
                  ) : (
                    <Coffee size={17} />
                  )}
                  {data.timer.pausedAt ? "Weiterarbeiten" : "Pause"}
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    action(
                      (current) => stopTimer(current),
                      "Feierabend! Deine Zeit wurde gespeichert.",
                    )
                  }
                >
                  <Square size={14} fill="currentColor" /> Ausstempeln
                </button>
              </div>
            </>
          )}
          <div className="timer-footnote">
            <ShieldCheck size={13} />
            {data.timer
              ? "Deine Zeiterfassung bleibt auch nach dem Neuladen erhalten."
              : "Automatisch gespeichert. Ganz ohne Papierkram."}
          </div>
        </section>
        <WeekChart
          entries={data.entries}
          timer={data.timer}
          now={now}
          target={dayTarget}
        />
      </div>
      <section className="panel recent-panel">
        <div className="section-heading">
          <div>
            <h2>Letzte Zeitbuchungen</h2>
            <p>Deine Arbeit, Stunde für Stunde.</p>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate("bookings")}
          >
            Alle ansehen <ArrowRight size={15} />
          </button>
        </div>
        <BookingTable
          entries={recent}
          onEdit={onEdit}
          emptyAction={() => onEdit("new")}
        />
      </section>
      <div className="day-note">
        <span className="day-note-icon">
          <Coffee size={19} />
        </span>
        <p>
          <strong>Gute Arbeit braucht auch gute Pausen.</strong>
          <span>Plane dir heute einen Moment nur für dich ein.</span>
        </p>
        <span className="day-note-decoration">✳</span>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  title,
  value,
  suffix,
  detail,
  variant,
  progress,
}: {
  icon: typeof Clock3;
  title: string;
  value: string;
  suffix: string;
  detail: string;
  variant: string;
  progress?: number;
}) {
  return (
    <section className="panel stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon ${variant}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-value">
        {value}
        <span>{suffix}</span>
      </div>
      <div className="stat-bottom">
        <span>{detail}</span>
        {progress !== undefined && (
          <div
            className={`mini-progress ${variant}`}
            role="progressbar"
            aria-label={`${title} Zielerreichung`}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}

function WeekChart({
  entries,
  timer,
  now,
  target,
}: {
  entries: Booking[];
  timer: AppData["timer"];
  now: number;
  target: number;
}) {
  const [offset, setOffset] = useState(0);
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const key = localDate(date);
    const hours =
      (sum(entries.filter((e) => localDate(e.start) === key)) +
        (timer && localDate(timer.start) === key ? timerMs(timer, now) : 0)) /
      3600000;
    return { date, key, hours };
  });
  const max = Math.max(target * 1.25, 10, ...days.map((d) => d.hours));
  const total = days.reduce((n, d) => n + d.hours, 0);
  return (
    <section className="panel week-panel">
      <div className="section-heading">
        <h2>Deine Woche</h2>
        <div className="week-navigation">
          <button
            className="icon-button"
            aria-label="Vorherige Woche"
            onClick={() => setOffset(offset - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {dateLabel(monday)} – {dateLabel(days[6].date)}
          </span>
          <button
            className="icon-button"
            aria-label="Nächste Woche"
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="week-summary">
        <strong>
          {formatDuration(total * 3600000)}
          <span> Std.</span>
        </strong>
        <span>erfasste Arbeitszeit</span>
      </div>
      <div className="chart">
        <div className="chart-y">
          <span>{Math.round(max)} h</span>
          <span>{Math.round(max / 2)} h</span>
          <span>0 h</span>
        </div>
        <div className="chart-plot">
          <div className="chart-grid" />
          <div
            className="target-line"
            style={{ bottom: `${(target / max) * 100}%` }}
          >
            <span>Tagesziel</span>
          </div>
          <div className="chart-bars">
            {days.map((day, i) => (
              <div
                className={`chart-column ${day.key === localDate(new Date(now)) ? "today" : ""}`}
                key={day.key}
              >
                <div className="bar-track">
                  <div
                    className={`chart-bar ${i > 4 ? "weekend" : ""}`}
                    style={{
                      height: `${Math.max(1.7, (day.hours / max) * 100)}%`,
                    }}
                    tabIndex={0}
                    aria-label={`${dateLabel(day.date)}: ${formatDuration(day.hours * 3600000)} Stunden`}
                  >
                    <span className="bar-tooltip">
                      {formatDuration(day.hours * 3600000)} Std.
                    </span>
                  </div>
                </div>
                <span className="day-label">
                  {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i /> Arbeitszeit
        </span>
        <span>
          <i className="legend-line" /> Tagesziel:{" "}
          {target.toLocaleString("de-DE")} Std.
        </span>
      </div>
    </section>
  );
}

function BookingTable({
  entries,
  onEdit,
  emptyAction,
}: {
  entries: Booking[];
  onEdit: (entry: Booking) => void;
  emptyAction?: () => void;
}) {
  if (!entries.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Clock3 size={26} />
        </span>
        <h3>Hier beginnt dein Überblick.</h3>
        <p>Stemple dich ein oder trage deine erste Arbeitszeit nach.</p>
        {emptyAction && (
          <button className="button secondary" onClick={emptyAction}>
            <Plus size={16} /> Zeit nachtragen
          </button>
        )}
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="booking-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Zeitraum</th>
            <th>Pause</th>
            <th>Arbeitszeit</th>
            <th>Tätigkeit</th>
            <th>
              <span className="sr-only">Bearbeiten</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <div className="table-date">
                  <span className="date-tile">
                    {new Date(entry.start)
                      .getDate()
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{dateLabel(entry.start)}</strong>
                    <small>
                      {new Date(entry.start).toLocaleDateString("de-DE", {
                        weekday: "long",
                        year: "numeric",
                      })}
                    </small>
                  </div>
                </div>
              </td>
              <td className="tabular">
                {clock(entry.start)} <span className="muted">–</span>{" "}
                {clock(entry.end)}
                {localDate(entry.start) !== localDate(entry.end) && (
                  <small className="next-day">bis {dateLabel(entry.end)}</small>
                )}
              </td>
              <td className="muted">{Math.round(entry.breakMinutes)} min</td>
              <td>
                <strong className="duration-cell">
                  {formatDuration(netMs(entry))}
                  <span> Std.</span>
                </strong>
              </td>
              <td>
                <span className={`reason-badge ${entry.reason}`}>
                  <span />
                  {REASONS[entry.reason]}
                </span>
                {entry.note && (
                  <span className="table-note" title={entry.note}>
                    {entry.note}
                  </span>
                )}
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Buchung vom ${dateLabel(entry.start)} bearbeiten`}
                  onClick={() => onEdit(entry)}
                >
                  <MoreHorizontal size={19} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bookings({
  data,
  onEdit,
}: {
  data: AppData;
  onEdit: (entry: Booking | "new") => void;
}) {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rangeError = !!(from && to && from > to);
  const entries = data.entries
    .filter(
      (e) =>
        !rangeError &&
        (!from || localDate(e.start) >= from) &&
        (!to || localDate(e.start) <= to) &&
        (reason === "all" || e.reason === reason) &&
        `${e.note} ${REASONS[e.reason]} ${dateLabel(e.start, true)}`
          .toLocaleLowerCase("de-DE")
          .includes(search.toLocaleLowerCase("de-DE")),
    )
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  return (
    <section className="panel bookings-panel">
      <div className="booking-filters">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Buchungen durchsuchen"
            placeholder="Buchungen durchsuchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-fields">
          <label className="field compact">
            Von
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field compact">
            Bis
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="field compact">
            Tätigkeit
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="all">Alle Tätigkeiten</option>
              {Object.entries(REASONS).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {rangeError && (
        <p role="alert" className="inline-error">
          Das Enddatum muss nach dem Startdatum liegen.
        </p>
      )}
      <div className="booking-summary">
        <span>
          {entries.length} Buchungen <span className="muted">·</span>{" "}
          <strong>{formatDuration(sum(entries))} Std.</strong>
        </span>
        <button
          className="button secondary"
          disabled={!entries.length}
          onClick={() =>
            download(
              "\uFEFF" + toCsv(entries),
              `simplezeit-${localDate(new Date())}.csv`,
              "text/csv;charset=utf-8",
            )
          }
        >
          <ArrowDownToLine size={15} /> CSV exportieren
        </button>
      </div>
      <BookingTable
        entries={entries}
        onEdit={onEdit}
        emptyAction={() => onEdit("new")}
      />
      {(search || from || to || reason !== "all") && (
        <button
          className="text-button reset-filters"
          onClick={() => {
            setSearch("");
            setReason("all");
            setFrom("");
            setTo("");
          }}
        >
          Filter zurücksetzen
        </button>
      )}
    </section>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">SIMPLEZEIT</p>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Dialog schließen"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

const localInput = (value: string) => `${localDate(value)}T${clock(value)}`;
function BookingEditor({
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  entry: Booking | null;
  onClose: () => void;
  onSave: (entry: Booking) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const today = localDate(new Date());
  const [start, setStart] = useState(
    entry ? localInput(entry.start) : `${today}T09:00`,
  );
  const [end, setEnd] = useState(
    entry ? localInput(entry.end) : `${today}T17:00`,
  );
  const [pause, setPause] = useState(entry ? String(entry.breakMinutes) : "30");
  const [reason, setReason] = useState<Reason>(entry?.reason ?? "work");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await onSave({
        id: entry?.id ?? crypto.randomUUID(),
        start:
          entry && start === localInput(entry.start)
            ? entry.start
            : new Date(start).toISOString(),
        end:
          entry && end === localInput(entry.end)
            ? entry.end
            : new Date(end).toISOString(),
        breakMinutes: Number(pause),
        reason,
        note: note.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Buchung konnte nicht gespeichert werden.",
      );
    }
  }
  return (
    <Modal
      title={entry ? "Zeitbuchung bearbeiten" : "Zeit nachtragen"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="booking-form">
        <div className="form-grid">
          <label className="field">
            Beginn
            <input
              required
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            Ende
            <input
              required
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className="field">
            Pause in Minuten
            <input
              required
              type="number"
              min="0"
              step="any"
              value={pause}
              onChange={(e) => setPause(e.target.value)}
            />
          </label>
          <label className="field">
            Tätigkeit
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
            >
              {Object.entries(REASONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Notiz <span className="muted">(optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Was hast du gemacht?"
            rows={3}
            maxLength={500}
          />
        </label>
        <p className="booking-preview">
          <Clock3 size={16} /> Arbeitszeit:{" "}
          <strong>
            {formatDuration(
              Math.max(
                0,
                new Date(end).getTime() -
                  new Date(start).getTime() -
                  Number(pause) * 60000,
              ),
            )}{" "}
            Std.
          </strong>
        </p>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {deleting ? (
          <div className="delete-confirm">
            <p>Diese Buchung wirklich löschen?</p>
            <button
              type="button"
              className="button danger"
              onClick={async () => {
                try {
                  await onDelete(entry!.id);
                } catch (err) {
                  setError(String(err));
                }
              }}
            >
              Ja, Buchung löschen
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => setDeleting(false)}
            >
              Behalten
            </button>
          </div>
        ) : (
          <div className="dialog-actions">
            {entry && (
              <button
                type="button"
                className="icon-button delete-button"
                aria-label="Buchung löschen"
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={17} />
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button type="submit" className="button primary">
              <Check size={16} /> Buchung speichern
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
