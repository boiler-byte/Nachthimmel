# Nachthimmel v2 – Delta: Einstellungen speichern und Ortsnamen finden

## Übernehmen

Dieses Archiv enthält **nur neue und geänderte Quelldateien** gegenüber dem zuletzt gelieferten Delta `Nachthimmel_v2_Flugzeuge_Entfernung_Details_Delta.zip`. Es ersetzt **kein** vollständiges Projekt.

1. Das Archiv entpacken und die Ordnerinhalte unter `nachthimmel-v2/` **über dein bestehendes Quellprojekt** kopieren. Identische Pfade ersetzen, andere Dateien unverändert lassen.
2. Deine bereits konfigurierte Cloudflare-Worker-Adresse erhalten: **`src/features/aircraft/adsb.service.js` ist nicht in diesem Delta**. Den Cloudflare Worker selbst musst du nicht anpassen.
3. Wenn GitHub Pages die **Quellversion** direkt bereitstellt: Alle geänderten Dateien hochladen, einschließlich `index.html`, `sw.js` und `pwa-assets.json`.
4. Wenn GitHub Pages den **gebauten Inhalt von `dist/`** bereitstellt: Nach dem Kopieren in deinem **bestehenden Projekt** `npm run build:portable` ausführen und anschließend `dist/` veröffentlichen. Das Delta enthält absichtlich keine fertigen `dist/`-Dateien, damit eine individuell hinterlegte Worker-Adresse nicht verloren geht.
5. Bei bereits installierter PWA gegebenenfalls neu laden: Die Service-Worker-Revision wird durch den Build aktualisiert.

## Neues Verhalten

- `localStorage.nachthimmelApp` enthält ein JSON-Objekt als String (`JSON.stringify`). Gespeichert: `version`, `layers` (Layer und Bahnen), `location` (`lat`, `lon`, `place`, optional `resolved` mit Koordinaten/Name), `mag` und `aircraftMaxDistanceKm`.
- Gespeicherte Einstellungen werden beim App-Start wiederhergestellt. Beschädigte oder nicht verfügbare Storage-Daten führen zu Standardwerten, nicht zu einem Startfehler.
- Bei neuer manueller oder GPS-Position sucht die App per Nominatim einen Siedlungsnamen. Innerhalb von 1 km des letzten erfolgreichen Orts-Lookups wird der vorhandene Name übernommen. Sonst ist die Anfrage entprellt und läuft höchstens einmal pro 60 Sekunden pro Browser-Sitzung. Die letzte Standortänderung gewinnt.
- Die Ortsnamen-Suche übermittelt bei bestätigter Standortänderung die Koordinaten an OpenStreetMap/Nominatim (siehe Hinweis im Standortdialog). Ohne Internet bleiben die Koordinaten sichtbar. GPS wird weiterhin nur auf Knopfdruck verwendet.
- Die Flugzeug-Abfragen und ihre Cloudflare-Worker-Anbindung bleiben unverändert. Es gibt keine neue Flugbahn-Funktion.

## Überprüfen

`npm test` – automatische Unit-Tests. `npm run build:portable` – Quell- und PWA-Build. `npm run test:runtime` – simulierter App-Laufzeittest. Nach dem Deployment Layer/Ort/Sternhelligkeit/Flugzeugradius ändern, neu laden und die Wiederherstellung prüfen.
