# simplezeit

Die alte SimpleZeiterfassung, neu gebaut: eine deutsche, lokale Zeiterfassung mit React, TypeScript und Vite.

## Starten

Node.js 24 empfohlen. Unterstützt werden Node 22.12+, 24 und 26+; Node 25 wird von der Testbibliothek offiziell nicht unterstützt. Auf diesem Rechner ist Node 24.10.0 bereits vorhanden.

```powershell
npm ci
npm run dev
```

Öffnen: http://127.0.0.1:5173

## GitHub Pages

Das Quellcode-Repository bleibt privat. Da der aktuelle GitHub-Tarif dort kein Pages unterstützt, enthält das öffentliche Repository `DomEscobar/timeattendance-pages` ausschließlich den fertigen Website-Build. GitHub Pages veröffentlicht dessen `main`-Branch.

Adresse: https://domescobar.github.io/timeattendance-pages/

Erneut veröffentlichen (mit GitHub-Schreibzugriff auf das Pages-Repository):

```powershell
npm run publish:pages
```

Der Helfer baut mit dem richtigen Unterpfad und pusht ausschließlich `dist/`, `.nojekyll` und einen kurzen Website-Hinweis. Die temporäre Deployment-Kopie bleibt unter `.pages-publish-*` liegen und wird vom Quellcode-Repository ignoriert. Es werden keine Zugangstokens in Dateien geschrieben.

`.github/workflows/ci.yml` prüft nach jedem Push und Pull Request die Zeitlogik und den Produktionsbuild. Der fertige Build ist als Actions-Artefakt verfügbar; die Veröffentlichung in das getrennte Repository erfolgt mit dem Befehl oben.

Die veröffentlichte App speichert Buchungen weiterhin ausschließlich im Browser. Die GitHub-Pages-Adresse hat einen eigenen lokalen Speicher: Daten vom lokalen Entwicklungsserver werden bei Bedarf über JSON-Sicherung und Import übertragen.

Der Build-Pfad lässt sich mit `VITE_BASE_PATH` setzen. Ohne diese Variable bleibt die lokale Entwicklung unter `/` erreichbar.

`npm start` startet ebenfalls die App. Der Server bindet nur an die lokale Adresse. Keine Registrierung, kein API-Schlüssel, keine Cloud erforderlich.

## Funktionen

- Einstempeln, Pause, Fortsetzen, Ausstempeln; laufende Zeiten überstehen das Neuladen.
- Zeitbuchungen nachtragen, bearbeiten und einzeln löschen; Nachtschichten und Zeiten über 24 Stunden werden korrekt berechnet.
- Validierung von Überschneidungen, Pausen und zukünftigen Buchungen.
- Tages-, Wochen- und Monatsübersicht, navigierbare Wochenansicht.
- Buchungen nach Zeitraum, Tätigkeit und Text filtern.
- Berichte mit Tages- und Gesamtsummen; CSV für Tabellenprogramme und Drucken / als PDF speichern.
- Persönliches Profil, eigene Felder, Wochenziel und helles/dunkles Design.
- JSON-Sicherung exportieren und nach Validierung und Bestätigung wiederherstellen.
- Separater Demo-Modus zum Ausprobieren, ohne eigene Daten zu verändern.
- Mobile Navigation und Dialoge mit Tastaturbedienung.
- Gleichzeitige Schreibzugriffe verschiedener Tabs werden über Web Locks serialisiert. Veraltete Buchungsentwürfe werden zurückgewiesen.

## Daten und Grenzen

Die App speichert ausschließlich im `localStorage` dieses Browsers unter `timeattendance-modern-v1`. Das ist keine serverseitige Datenbank: Browser, Browserprofil und Webadresse bestimmen den Speicher. `localhost` und `127.0.0.1` haben beispielsweise verschiedene Daten. Regelmäßig eine JSON-Sicherung herunterladen; beim Löschen der Browserdaten gehen lokale Einträge verloren.

Berichte ordnen eine abgeschlossene Schicht ihrem Startdatum zu. Laufende Zeiten erscheinen auf dem Dashboard, aber erst nach dem Ausstempeln im Bericht. Das Tagesziel entspricht dem Wochenziel geteilt durch fünf; es gibt keinen Dienstplan und keine automatische Feiertagsberechnung. CSV ersetzt den alten XLS-Export. PDF wird über den Druckdialog erzeugt.

Die alte PHP-API ist nicht enthalten. Online-Konten, NFC, GPS und Cordova-Gerätefunktionen wurden für die gewünschte lokale Version nicht übernommen. Die App kontaktiert keine alten Server. Als statischer Build benötigt sie einen lokalen HTTP-Server; direktes Öffnen von `dist/index.html` als Datei wird nicht unterstützt.

### Alte lokale Daten

Wenn die alten Schlüssel `zt-bt`, `zt-u`, `zt-ud` und `zt-iw` auf derselben Webadresse zugänglich sind, werden gültige Buchungen und Profildaten beim ersten Start übernommen. Die Originalschlüssel bleiben unverändert. Zugangstokens und Passwörter werden nicht übernommen. Fehlerhafte, widersprüchliche oder überlappende Altdaten lösen eine Meldung aus und werden nicht stillschweigend verworfen. Browserdaten anderer Webadressen können aus Sicherheitsgründen nicht automatisch gelesen werden.

## Entwicklung

```powershell
npm run build       # TypeScript-Prüfung und Produktionsbuild nach dist/
npm run preview     # Produktionsbuild lokal ansehen (anderer Port = anderer Speicher)
npm test            # Domänen- und Speichertests
npm run test:e2e     # Desktop- und Mobiltests mit installiertem Chrome
npm run format      # Neue App und Konfiguration formatieren
```

| Verzeichnis | Inhalt |
| --- | --- |
| `modern/src/` | Neue App, Zeitlogik, lokaler Speicher und Tests |
| `modern/e2e/` | Reproduzierbare Browser-Szenarien |
| `docs/REBUILD.md` | Umfang, Aufgaben und Prüfnachweise |
| `docs/evidence/` | Desktop-/Mobilansichten und getesteter Druckbericht |
| `src/`, `Cordova/`, `e2e/` | Unveränderte historische Anwendung |
| `legacy/` | Ursprüngliche npm-Konfiguration, Lockfile und README |

Die historischen Angular-Konfigurationen bleiben als Referenz erhalten. Die Root-npm-Skripte starten ausschließlich die neue Anwendung.
