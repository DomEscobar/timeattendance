import { Download, Moon, Plus, Sun, Trash2, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { AppData, Profile } from "./domain";

type Props = {
  data: AppData;
  onSaveProfile: (profile: Profile) => void;
  onThemeChange: (theme: "light" | "dark") => void;
  onExportBackup: () => void;
  onImportBackup: (text: string) => void;
};

const copyProfile = (profile: Profile): Profile => ({
  ...profile,
  details: profile.details.map((detail) => ({ ...detail })),
});

export default function ProfileView({
  data,
  onSaveProfile,
  onThemeChange,
  onExportBackup,
  onImportBackup,
}: Props) {
  const [profile, setProfile] = useState(() => copyProfile(data.profile));
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setProfile(copyProfile(data.profile)), [data.profile]);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const updateDetail = (id: string, key: "label" | "value", value: string) =>
    setProfile((current) => ({
      ...current,
      details: current.details.map((detail) =>
        detail.id === id ? { ...detail, [key]: value } : detail,
      ),
    }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSaveProfile({
      ...profile,
      weeklyHours: Math.min(80, Math.max(1, Number(profile.weeklyHours) || 1)),
    });
  };

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileError("");
    const reader = new FileReader();
    reader.onerror = () =>
      setFileError("Die Sicherungsdatei konnte nicht gelesen werden.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setFileError("Die Sicherungsdatei enthält keinen lesbaren Text.");
        return;
      }
      try {
        onImportBackup(reader.result);
      } catch (error) {
        setFileError(
          error instanceof Error
            ? error.message
            : "Die Sicherung konnte nicht importiert werden.",
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="profile-view support-view">
      <form className="profile-grid" onSubmit={submit}>
        <section className="panel profile-card">
          <h2>Persönliche Angaben</h2>
          <div className="profile-fields">
            <label className="field">
              Vorname
              <input
                value={profile.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                autoComplete="given-name"
              />
            </label>
            <label className="field">
              Nachname
              <input
                value={profile.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                autoComplete="family-name"
              />
            </label>
            <label className="field profile-full">
              Unternehmen
              <input
                value={profile.company}
                onChange={(event) => update("company", event.target.value)}
                autoComplete="organization"
              />
            </label>
            <label className="field">
              Wochenziel (Stunden)
              <input
                type="number"
                min="1"
                max="80"
                step="0.5"
                value={profile.weeklyHours}
                onChange={(event) =>
                  update("weeklyHours", Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="profile-actions">
            <button className="button primary" type="submit">
              Profil speichern
            </button>
          </div>
        </section>

        <section className="panel profile-card">
          <div className="profile-card-title">
            <div>
              <h2>Eigene Felder</h2>
              <p className="muted">
                Zum Beispiel Personalnummer oder Kostenstelle.
              </p>
            </div>
            <button
              className="button secondary profile-icon-button"
              type="button"
              aria-label="Eigenes Feld hinzufügen"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  details: [
                    ...current.details,
                    {
                      id: crypto.randomUUID?.() ?? `${Date.now()}`,
                      label: "",
                      value: "",
                    },
                  ],
                }))
              }
            >
              <Plus size={18} />
            </button>
          </div>
          {profile.details.length === 0 ? (
            <p className="empty-state">Noch keine eigenen Felder angelegt.</p>
          ) : (
            <div className="profile-details">
              {profile.details.map((detail) => (
                <div className="profile-detail" key={detail.id}>
                  <input
                    aria-label="Feldbezeichnung"
                    placeholder="Bezeichnung"
                    value={detail.label}
                    onChange={(event) =>
                      updateDetail(detail.id, "label", event.target.value)
                    }
                  />
                  <input
                    aria-label="Feldwert"
                    placeholder="Wert"
                    value={detail.value}
                    onChange={(event) =>
                      updateDetail(detail.id, "value", event.target.value)
                    }
                  />
                  <button
                    className="button ghost profile-remove"
                    type="button"
                    aria-label="Feld entfernen"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        details: current.details.filter(
                          (item) => item.id !== detail.id,
                        ),
                      }))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel profile-card">
          <h2>Darstellung</h2>
          <p className="muted">
            Wähle, wie die Zeiterfassung auf diesem Gerät aussieht.
          </p>
          <div className="profile-theme-options">
            <button
              className={`profile-theme ${data.theme === "light" ? "is-active" : ""}`}
              type="button"
              onClick={() => onThemeChange("light")}
            >
              <Sun size={19} />
              Hell
            </button>
            <button
              className={`profile-theme ${data.theme === "dark" ? "is-active" : ""}`}
              type="button"
              onClick={() => onThemeChange("dark")}
            >
              <Moon size={19} />
              Dunkel
            </button>
          </div>
        </section>

        <section className="panel profile-card">
          <h2>Sicherung</h2>
          <p className="muted">
            Zeiten und Profil werden lokal im Browser gespeichert. Mit einer
            Sicherung kannst du sie auf dieses oder ein anderes Gerät
            übertragen.
          </p>
          <div className="profile-backup-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onExportBackup}
            >
              <Download size={18} />
              Sicherung herunterladen
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={18} />
              Sicherung importieren
            </button>
            <input
              ref={inputRef}
              className="profile-file-input"
              type="file"
              accept="application/json,.json"
              onChange={importFile}
            />
          </div>
          {fileError && (
            <p className="profile-error" role="alert">
              {fileError}
            </p>
          )}
        </section>
      </form>
    </div>
  );
}
