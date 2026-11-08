# Nachthimmel v2 – modulare Himmelskarte und PWA

Nachthimmel v2 ist eine modulare Vanilla-JavaScript-Himmelskarte mit Canvas-Layern, Sternen, Sternbildern, sieben Planeten, Sonne/Mond, Bewegungsbahnen, Deep Sky, Satelliten und einem optionalen Live-Flugzeug-Layer. Die PWA kann auf HTTPS oder localhost installiert werden; die Basiskarte funktioniert nach dem ersten Laden offline.

## Bedienung: drei getrennte Dialoge

- **Standort festlegen** (oben rechts): **Beobachtungsstandort** (Koordinaten/GPS) und **Darstellung** (Grenzhelligkeit).
- **Kartenebenen** (unten, Symbol gestapelte Ebenen): Sterne, Planeten, Sonne/Mond, Sternbilder, Deep Sky, Satelliten und Flugzeuge. Hier befinden sich auch die Informationen zu ADSB.lol und die PWA-Installation.
- **Bewegungsbahnen** (daneben, Orbit-Symbol): Planetenbahnen, Sonnenbahn, Mondbahn, Richtungspfeile und Auswahlbahn. Beide Dialoge können unabhängig mit Escape, Zurück-Geste oder Schließen-Button verlassen werden.

Die Bahn-Overlays sind standardmäßig AUS. Pfeile und die automatische Bahn beim Auswählen eines Planeten, der Sonne oder des Mondes sind standardmäßig AN. Planetenbahnen zeigen ±30 Tage gegen den Sternhimmel, die Mondbewegung ±7 Tage, die Tagesbögen dagegen den Verlauf über dem lokalen Horizont.

## Flugzeug-Layer – ADSB.lol statt AirLabs

Der Flugzeug-Layer verwendet nun das öffentliche **ADSB.lol-v2-Format**. Es wird **kein API-Key** benötigt. Über einen Radius von 200 nautischen Meilen rund um den Beobachtungsstandort werden Flugzeuge ungefähr alle 90 Sekunden abgefragt (nur bei **JETZT**, aktivem Layer und sichtbarer App). Daten mit ungültiger oder zu alter Position und Meldungen vom Boden werden herausgefiltert. Höhen in Fuß werden in Meter, Geschwindigkeit in Knoten in m/s und Steig-/Sinkraten von ft/min in m/s umgerechnet. In Suche und Details werden vorhandene Callsigns, Kennzeichen und Flugzeugtypen angezeigt.

**Für Flugzeuge ist ein kleiner Server-/Edge-Proxy erforderlich.** ADSB.lol liefert keine für allgemeine Webseiten geeigneten CORS-Freigaben. Der Browser ruft ausschließlich die gleichoriginige Route `/api/aircraft?lat=…&lon=…&radius=200` auf. Der Proxy leitet die validierten Werte an `https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{radius}` weiter. Unbekannte URLs und API-Schlüssel werden nicht weitergeleitet. Der Service Worker speichert diese Antworten **nicht** zwischen.

### Lokal starten – PWA + funktionierender Proxy

Voraussetzung: Node.js 18+ (empfohlen Node.js 22+).

```bash
npm install
npm run build:portable
npm run preview:proxy
```

Dann **http://localhost:4173/** öffnen. Der mitgelieferte lokale Node-Server liefert `dist/` und stellt `/api/aircraft` bereit. Unter „Kartenebenen → Flugzeuge (ADSB.lol)“ aktivieren. Die Live-Abfrage benötigt Internet und eine erreichbare ADSB.lol-API. Die anderen Himmels-Layer bleiben auch bei einem Flugzeug-API-Fehler nutzbar.

### Auf Cloudflare Pages bereitstellen

Die Datei **`functions/api/aircraft.js`** ist eine Cloudflare Pages Function. Für ein produktives Deployment müssen **sowohl das `dist/`-Verzeichnis als auch die Funktion** bereitgestellt werden. Ein reines Hochladen des `dist`-Ordners auf einen statischen Webserver stellt **keinen Proxy** bereit.

Empfohlene Konfiguration bei einem Cloudflare-Pages-Projekt mit verbundenem Git-Repository:

1. Git-Repository mit dem gesamten Nachthimmel-Projekt verbinden (einschließlich `functions/`).
2. Build-Command: `npm run build:portable`; Output-Verzeichnis: `dist`.
3. Die Pages Function wird aus dem Verzeichnis `functions/api/aircraft.js` als `/api/aircraft` veröffentlicht.
4. Nach dem Deployment die PWA über HTTPS öffnen und den Flugzeug-Layer aktivieren.

Das direkte **Dashboard-Upload-Verfahren von Cloudflare Pages** unterstützt Pages Functions nicht. Alternativ lässt sich ein eigener Same-Origin-Proxy bereitstellen oder der Node-Preview-Server als Grundlage für einen eigenen Node-Betrieb verwenden.

**Hinweis zu Subpfaden:** Der Browser bildet den API-Pfad relativ zur App-Adresse. Bei einer Bereitstellung unter `/nachthimmel/` muss der Proxy entsprechend unter `/nachthimmel/api/aircraft` erreichbar sein. Die mitgelieferte Cloudflare-Pages-Route ist standardmäßig für eine Bereitstellung am Domain-Root ausgelegt.

### Verfügbarkeit und Nutzungsbedingungen

- ADSB.lol ist ein Community-Dienst. Die API kann vorübergehend nicht erreichbar sein, gedrosselt werden oder zukünftig einen Schlüssel verlangen.
- Für produktive Nutzung bittet der Anbieter um Kontaktaufnahme. Die veröffentlichten Daten stehen unter der **Open Database License 1.0 (ODbL)** und erfordern entsprechende Attribution und Lizenzbeachtung. In der Oberfläche wird ADSB.lol verlinkt.
- Der Standort wird bei eingeschaltetem Flugzeug-Layer an den eigenen Proxy und anschließend an ADSB.lol übertragen; sonst nicht für die Flugzeugabfrage verwendet.
- Positionsdaten und Hochrechnungen dienen nur zur Orientierung, **nicht** zur Navigation oder Flugsicherung.
- Bei bloßem `file://`-Öffnen der Einzeldatei, bei gewöhnlichen Static-Hosts ohne Proxy und im Offline-Modus ist der Live-Flugzeug-Layer nicht verfügbar; die App meldet dies statt eine AirLabs-Schlüsseleingabe zu verlangen.

API-Dokumentation: https://api.adsb.lol/docs · Lizenz: https://opendatacommons.org/licenses/odbl/1-0/ · Cloudflare-Pages-Functions: https://developers.cloudflare.com/pages/functions/get-started/

## Projektstruktur

```text
index.html                            Modularer Einstieg mit ES-Module-Imports
src/app.js, src/main.js              App-Initialisierung und PWA-Registrierung
src/core/                            Zustand, Events, Astronomie, Uhr, Mathematik
src/engine/                          Canvas, Projektion, Registrierung und Eingabe
src/features/                        Sterne, Planeten, Sonne/Mond, Bahnen, Satelliten,
                                     Flugzeuge, Deep Sky, Sternbilder
src/features/aircraft/adsb.service.js  Polling, Normalisierung, API-Proxy-URL
functions/api/aircraft.js            Same-Origin-Proxy (Cloudflare Pages Functions)
scripts/serve-pwa.cjs                Lokaler Node-PWA-/Proxy-Server
src/ui/                              Suche, Details, Layer-Dialog, Bahnen-Dialog,
                                     Standortdialog, Kompass, Zeitsteuerung
src/styles/                          CSS und Responsive-Layout
sw.template.js                       Service Worker, generiert mit Asset-Hash
dist/                                Produktions-PWA und Einzeldatei
```

## Build & Tests

```bash
npm install
npm test                  # Unit-/Proxy-/Service-Worker-Tests
npm run build:portable    # Ohne Vite: PWA in dist/ + Einzeldatei
npm run test:runtime      # Simulierter DOM-/Canvas-Integrationstest
npm run preview:proxy     # Lokaler Host inklusive ADSB.lol-Proxy
```

Alternativ: `npm run build` für den Vite-Produktions-Build und `npm run dev` für den Vite-Entwicklungsserver. **Hinweis:** `npm run dev` allein stellt keine `/api/aircraft`-Route bereit; für Live-Flugzeuge die Proxy-Vorschau oder ein eigenes serverseitiges Routing verwenden.

Die gebündelte `dist/Nachthimmel_v2.html` kann als Einzeldatei geöffnet werden; PWA-Installation und Flugzeugabfrage benötigen jedoch einen echten HTTP(S)-Host. Für die installierbare App das gesamte `dist/` bereitstellen (`index.html`, `sw.js`, `pwa-assets.json`, `manifest.webmanifest`, Icons).

## Astronomische Daten und Offline-Grenzen

- Planeten: lokale NASA/JPL-Keplernäherungen (1800–2050); Sonne und Mond: lokale Näherungsmodelle, keine Teleskop-Ephemeriden.
- Sternkatalog und Sternbilder: d3-celestial mit eingebettetem Basiskatalog als Fallback.
- Deep-Sky-Bilder: NASA-Bildbibliothek, gegebenenfalls CDS/DSS.
- Satelliten: CelesTrak GP-OMM und satellite.js/SGP4 (Netzverbindung nötig).
- Live-Flugzeuge: ADSB.lol, nur mit aktivem Proxy und Internet.
- Service Worker speichert lokale App-Assets und die Offline-Basiskarte. Externe APIs, Fonts, Satellitenmodule und die Live-Proxy-Route werden nicht vorgehalten.

Die automatisierten API-Tests verwenden simulierte Antworten. Ein erfolgreicher externer ADSB.lol-Liveaufruf ist dadurch nicht garantiert; Verfügbarkeit und Hosting-Konfiguration müssen nach dem Deployment überprüft werden.
