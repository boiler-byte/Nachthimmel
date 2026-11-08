# Nachthimmel v2 – Delta „Layer/Bahnen + ADSB.lol"

**Basis:** Nachthimmel v2 nach dem letzten PWA-Delta (Stand 08.11.2026).

1. Vor dem Einspielen das vorhandene Projekt sichern.
2. Das ZIP im **übergeordneten Ordner** entpacken, sodass die darin enthaltenen Dateien nach `nachthimmel-v2/` kopiert und ältere gleichnamige Dateien überschrieben werden.
3. Die in `DELETE_FILES.txt` genannte alte AirLabs-Datei löschen (wird nicht mehr verwendet).
4. Für lokale Live-Flugzeuge `npm install`, `npm run build:portable` und `npm run preview:proxy` ausführen. Alternativ die im ZIP bereits aktualisierte PWA mit der enthaltenen Cloudflare-Pages-Function deployen.

**Keine vollständige Projektkopie:** Unveränderte Dateien (z. B. die PWA-Icons und die meisten Himmelsmodule) sind nicht enthalten.

**ADSB.lol benötigt einen Serverproxy.** Ohne `functions/api/aircraft.js` auf Cloudflare Pages oder den Node-Proxy funktioniert der Flugzeug-Layer auf einem statischen Host nicht; die übrige PWA funktioniert weiterhin. Bei Cloudflare Pages muss die Function aus dem Projekt-Root bereitgestellt werden, nicht nur das `dist/`-Verzeichnis.

Die Flugzeugdaten sind nicht für Navigation oder Flugsicherung geeignet. Attribution und Lizenz (ODbL 1.0) sind zu beachten.
