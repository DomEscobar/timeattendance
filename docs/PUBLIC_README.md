# simplezeit

<div align="center"><img src="media/cover.svg" alt="simplezeit – Deine Zeit. Im Überblick." width="1280"><p><strong>Deine Arbeitszeit. Klar und lokal.</strong><br>Ein ruhiger Zeittracker für den Browser – ohne Konto und ohne Cloud.</p><p><a href="https://domescobar.github.io/timeattendance-pages/"><strong>↗ App öffnen</strong></a></p></div>

## Auf einen Blick

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Zeit**        | Einstempeln, Pause, Fortsetzen, Ausstempeln und Nachträge |
| **Übersicht**   | Tages-, Wochen- und Monatsansicht mit Filtern und Summen  |
| **Berichte**    | CSV und Drucken / im Druckdialog „Als PDF speichern“      |
| **Persönlich**  | Profil, Wochenziel, eigene Felder, helles/dunkles Design  |
| **Sicherungen** | JSON exportieren und nach Prüfung wieder importieren      |

<table>
  <tr>
    <td width="76%" align="center"><img src="media/dashboard.png" alt="Dashboard mit Beispieldaten" width="900"></td>
    <td width="24%" align="center"><img src="media/mobile.png" alt="Mobile Startansicht" width="280"></td>
  </tr>
</table>
<p align="center"><sub>Ein klarer Überblick am Schreibtisch. Eine Stempeluhr für unterwegs.</sub></p>

## Loslegen

1. [App öffnen](https://domescobar.github.io/timeattendance-pages/).
2. Einstempeln oder eine Buchung nachtragen.
3. Unter **Sicherung** regelmäßig JSON exportieren.

Über **Demodaten ansehen** kannst du die App ausprobieren. Die Beispieldaten bleiben nur im Arbeitsspeicher und verändern keine eigenen Buchungen.

## Privat, lokal, transparent

Die App speichert nur im `localStorage` dieses Browsers. Es gibt keine Registrierung, keinen API-Schlüssel, keine Cloud-Synchronisierung und keinen Server für deine Buchungen. Browser, Profil und Webadresse haben jeweils eigenen Speicher. Beim Löschen der Browserdaten gehen lokale Einträge verloren; für Geräte- oder Adresswechsel JSON exportieren und importieren.

PDF entsteht über den Druckdialog mit **„Als PDF speichern“**. Abgeschlossene Schichten zählen zu ihrem Startdatum; das Tagesziel ist Wochenziel geteilt durch fünf.

Dieses Repository enthält nur die kompilierten Website-Dateien und diese Medien. Der Quellcode bleibt privat.

<div align="center"><sub>simplezeit · gebaut von DomEscobar</sub></div>
