# Nachthimmel v2 — modularisierte Himmelskarte

**Nachthimmel v2** ist die modulare Fassung der gelieferten Nachthimmel-v6-HTML-App. Oberfläche, Datenquellen, astronomische Näherungsberechnungen und vorhandene Bedienkonzepte wurden weitgehend unverändert übernommen. Die Änderungen betreffen vor allem Zuständigkeiten, Modulgrenzen, den Canvas-Layer-Renderer und die Entkopplung der Datenservices von der UI.

## Ergänzung: Sonne, Mond und Bewegungsbahnen

Unter **Einstellungen → Kartenebenen** lassen sich **Sonne & Mond** unabhängig von den sieben Planeten schalten (Standard **AN**). Die beiden Himmelsobjekte sind außerdem über die Suche erreichbar und zeigen eigene Details mit Mondphase bzw. Sonnenposition.

Unter **Einstellungen → Bahnen & Bewegungsrichtung** gibt es fünf weitere Schalter:

| Schalter | Standard | Bedeutung |
| --- | --- | --- |
| Planetenbahnen | AUS | Scheinbare Bewegung relativ zu den Sternen über ±30 Tage |
| Sonnenbahn | AUS | Tagesbogen am Beobachtungsstandort mit Auf-/Untergang |
| Mondbahn | AUS | Tagesbogen sowie Bewegung relativ zu den Sternen über ±7 Tage |
| Bewegungsrichtung | AN | Pfeile an aktiven Kurven (nur bei eingeschalteter Bahn sichtbar) |
| Bahn bei Auswahl | AN | Bahn des ausgewählten Planeten oder von Sonne/Mond automatisch hervorheben |

Vergangene Bahnsegmente sind transparenter als zukünftige. Auf der Objektkarte lässt sich die **Auswahlbahn** ebenfalls umschalten. Unterhalb des Horizonts sind Bahnen nur als virtuelle Ansicht sichtbar. Planetenpositionen werden mit JPL-Näherungsbahnen, die Sonne aus der Erdbahn und der Mond aus einer vereinfachten Störungstheorie inklusive Parallaxe berechnet. Die Ergebnisse dienen der Orientierung und sind **keine Präzisions-Ephemeriden**.

### Nur die geänderten Dateien einspielen

Das Update-Paket enthält **nur neue und gegenüber der bisherigen v2 geänderte Dateien**. Das ZIP im bestehenden Projektordner entpacken und die enthaltenen Dateien gleichen Namens ersetzen. Die getrennt bereitgestellte `Nachthimmel_v2.html` ist die neue, unmittelbar öffnungsfähige Einzeldatei.

## Schnellstart

**Ohne Installation:** `dist/Nachthimmel_v2.html` im Browser öffnen. Dies ist eine einzelne HTML-Datei mit eingebettetem CSS und gebündeltem JavaScript. Sie eignet sich für das direkte Weitergeben. Sie benötigt weiterhin Internetzugriff für dynamische Kataloge, NASA-Bilder, CelesTrak-Satelliten und die externe `satellite.js`-Bibliothek. Der eingebaute Basis-Stern- und Sternbildkatalog und die Planetenberechnung funktionieren ohne diese Abfragen. Browser-Sicherheitsvorgaben können API-/Sensorfunktionen beim Öffnen als `file://` einschränken.

**Modulare Entwicklungsfassung:** Aus dem Projektverzeichnis einen lokalen HTTP-Server starten (kein Build nötig):

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Browser-ES-Module funktionieren im Gegensatz zu `file://` zuverlässig über einen lokalen HTTP-Server.

**Mit Vite:**

```bash
npm install
npm run dev
```

## Kommandos

| Kommando | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Produktions-Build und eigenständige HTML-Version im Ordner `dist/` |
| `npm run standalone` | Einzeldatei `dist/Nachthimmel_v2.html` neu erstellen |
| `npm test` | Node-Unit-Tests für Mathematik, Ephemeriden, Flugzeugberechnung und Layer-API |
| `npm run test:runtime` | Standalone-JavaScript mit simuliertem DOM/Canvas starten und Interaktionen prüfen |

Für `npm run standalone` wird TypeScript **nur als Build-Werkzeug** benötigt; die App selbst enthält kein TypeScript und benötigt keine UI-Bibliothek. `npm install` installiert die Build-Abhängigkeiten.

## Architektur

```text
index.html                      Einstieg für Browser-ES-Module
src/main.js                    Startet die App
src/app.js                     Initialisierung der Offline-Kataloge und der Dienste
src/core/                     State, Event-Hub, Zeit, Astronomie und Hilfsfunktionen
src/engine/                   Canvas, Projektion, Zeichenreihenfolge, Hit-Tests, Eingabe
src/features/                 Sterne, Sternbilder, Planeten, Sonne/Mond, Bahnen, Deep Sky, Satelliten, Flugzeuge
src/services/                 Katalog-Transport/API
src/ui/                       Kompass, Suche, Details, Einstellungen, Zeit und Events
src/sensors/                  Orientierungssensor und GPS
src/styles/                   Designvariablen, Layout, Responsivität und Overrides
src/engine/layer-registry.js   Reihenfolge und Ein-/Ausschalten der Zeichenebenen
src/engine/sky-renderer.js     Einheitliche Layer-Schnittstelle
src/core/events.js            Domain-Events ohne direkte DOM-Abhängigkeit
```

### Zeichenebenen

`src/engine/sky-renderer.js` verwaltet registrierte Layer mit `id`, optionalem `visible(frame)` und `update(frame)` sowie verpflichtendem `draw(frame)`. `src/engine/layer-registry.js` legt die Zeichenreihenfolge fest. Für eine neue Ebene ein Zeichenmodul anlegen und es dort registrieren. Der Render-Loop muss nicht geändert werden.

Die Zeichenreihenfolge ist nun: Hintergrund, Himmelsgitter, Milchstraßenstaub, Sternbilder, Sterne, Deep Sky, **Bahn-Overlays**, Planeten, **Sonne/Mond**, Horizontdarstellung, Satelliten, Flugzeuge und Auswahlmarkierung. Bahn-Overlays liegen somit unter den Objektsymbolen.

### Daten und UI

Die Katalog- und API-Services aktualisieren den vorhandenen kompatiblen zentralen State und senden Ereignisse über `src/core/events.js` (z. B. `data:changed`, `toast`, `detail:refresh`). `src/ui/service-events.js` setzt diese Ereignisse in Oberflächenaktualisierungen um. Datenservices importieren dadurch keine UI-Module mehr.

Für v2 wurde der **flache zentrale State bewusst kompatibel belassen**. Eine spätere Version kann ihn weiter in Observer-, Camera-, Time- und Feature-State unterteilen, ohne einen gleichzeitigen Komplettumbau aller Funktionen zu erzwingen.

### Daten und Rechte

- Planetendaten und Sonne: eingebettete JPL-Näherungselemente für 1800–2050, keine Teleskop-Ephemeriden. Mond: vereinfachtes geozentrisches Modell mit topozentrischer Parallaxe, offline.
- Sterne/Sternbilder: öffentliche d3-celestial-Kataloge, mit einfachen eingebetteten Fallbacks.
- Deep-Sky-Aufnahmen: NASA Image and Video Library, mit CDS/DSS-Fallback.
- Satelliten: CelesTrak GP-OMM und `satellite.js`/SGP4.
- Flugzeuge: AirLabs, nur zur aktuellen Zeit und nur mit einem selbst eingegebenen API-Key. Er bleibt wie in der ursprünglichen Version im Browser-Session-Storage; die Abfrage erfolgt direkt aus dem Browser.

Nutzungsbedingungen, CORS-Vorgaben und Kontingente der jeweiligen externen Anbieter gelten weiterhin. In der HTML-Datei befindet sich kein fest eingebauter AirLabs-Schlüssel.

## Tests und Grenzen

Die automatisierten Tests prüfen JS-Syntax, astronomische Berechnungen, Layer-Reihenfolge, Laden des gebündelten Skripts mit simuliertem DOM/Canvas, Startdarstellung, Einstellungs-Layer, Suche, Details, Ortswechsel und Zeitsteuerung. Externe APIs sind in diesen Tests absichtlich nicht erreichbar; die Offline-Fallbacks werden geprüft.

Die ergänzte Himmelsanzeige, Suche und Einstellungen wurden zudem in einem Headless-Chromium-Browser mit blockierten externen APIs geprüft. Ein vollständiger visueller Test in einem echten Smartphone-Browser und ein Integrationstest mit Live-APIs/Sensoren sind zusätzlich sinnvoll. Für eine produktive öffentliche Bereitstellung sollte besonders der API-Key-Umgang sowie die Zuverlässigkeit externer Datenquellen geprüft werden.
