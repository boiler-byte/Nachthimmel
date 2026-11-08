# Nachthimmel v2 – Delta: Flugzeug-Entfernung + Details

## Einspielen

**Dieses ZIP enthält nur neue und geänderte Quell- und PWA-Dateien** gegenüber `Nachthimmel_v2_Layer_Bahnen_ADSB_Delta.zip`. Es ersetzt nicht dein vollständiges Projekt. Es enthält bewusst **keine vorbereiteten `dist/`-Dateien**: Diese könnten eine bereits individuell konfigurierte Cloudflare-Worker-Adresse überschreiben.

1. Entpacke `nachthimmel-v2/` über das **bestehende Nachthimmel-Projekt**. Dateien mit identischem Pfad ersetzen, andere Dateien unverändert lassen.
2. **`src/features/aircraft/adsb.service.js` nicht verändern.** Diese Datei ist im Delta nicht enthalten. Eine darin hinterlegte Cloudflare-Worker-URL bleibt so erhalten.
3. Falls GitHub Pages deine Quellversion (`index.html` im Projekt-Root) direkt bereitstellt: Dateien committen und deployen. `sw.js` und `pwa-assets.json` im Delta aktualisieren den PWA-Cache.
4. Falls GitHub Pages die gebaute PWA aus `dist/` bereitstellt: **im aktualisierten Projekt** `npm run build:portable` ausführen und anschließend den neu erzeugten `dist/`-Inhalt wie gewohnt auf GitHub Pages hochladen. Der vorhandene Worker-Endpunkt aus deiner Service-Datei wird dabei übernommen.
5. Falls du die Worker-Adresse **ausschließlich in einer fertigen `dist/index.html`** eingetragen hast, muss dieselbe URL vor dem Build einmal in `src/features/aircraft/adsb.service.js` stehen; sonst kann kein Build sie übernehmen. Weitere Cloudflare-Worker-Änderungen sind nicht erforderlich.

## Änderungen

- **Kartenebenen → Flugzeugdaten (ADSB.lol):** Slider 25–370 km, Default 100 km.
- Filter für sichtbare Flugzeuge, Treffer der Suche und angezeigte Anzahl. Die ADSB-Abfrage bleibt unverändert (200 nautische Meilen). Es entstehen keine zusätzlichen ADSB-Requests.
- Detailansicht: horizontale Entfernung vs. direkte Sichtlinienentfernung, Geschwindigkeit, Flughöhe, Kurs, Steig-/Sinkrate, letzte Meldung, Kennzeichen, Flugzeugtyp, Rufzeichen, Transpondercode.
- Foto über HexDB *nur beim Öffnen der Flugzeugdetails*. Bei nicht verfügbarem Bild wird das vorhandene Flugzeugsymbol gezeigt. HexDB ist ein externer Bilddienst.
- **Keine Flugbahn.** Satelliten, Planeten, Sonne/Mond und PWA bleiben ansonsten unverändert.

Tests: `npm test`, `npm run build:portable`, `npm run test:runtime`.
