## Layer-/Bahnen-Dialoge und ADSB.lol (08.11.2026)

- Bisherigen Einstellungsdialog in **Kartenebenen** und **Bewegungsbahnen** aufgeteilt. Zwei nebeneinanderliegende Werkzeugleistenbuttons mit Layer- und Orbit-Icon.
- Standortdialog mit **Beobachtungsstandort** und **Darstellung** bleibt separat.
- Flugzeug-Layer von AirLabs auf ADSB.lol umgestellt; Schlüssel-Eingabe und Session-Storage-Nutzung entfernt.
- Neuer `adsb.service.js` mit Datenvalidierung, Einheitenumrechnung, 90-Sekunden-Polling und verständlicher Proxy-Fehlermeldung.
- Same-Origin-Proxy als Cloudflare Pages Function und Node-Server für lokale PWA-Vorschau ergänzt. Diese serverseitige Komponente ist wegen fehlender Browser-CORS-Unterstützung bei ADSB.lol notwendig.
- Service Worker um ausdrücklichen Bypass aller Same-Origin-API-Requests erweitert; keine Zwischenspeicherung der Flugzeugdaten.
- Suche, Objekt-Details, Informationsquellen, Hilfetexte und Responsive-Dock aktualisiert; neue Unit- und Proxy-Tests.

---

## Standortdialog (08.11.2026)

- Der Button „Standort festlegen“ öffnet einen eigenen Dialog (`locationModal`).
- Die Abschnitte „Beobachtungsstandort“ und „Darstellung“ sind aus den allgemeinen Einstellungen in den neuen Dialog umgezogen.
- Koordinaten übernehmen, GPS, Sternenhelligkeit, Schließen per Escape/Backdrop und Browser-Zurück sind mit dem neuen Dialog verbunden.
- Nicht gespeicherte Koordinaten werden beim nächsten Öffnen auf den aktuellen Standort zurückgesetzt.
- General-Settings enthält weiterhin Kartenebenen, Bahn-Overlays, AirLabs und Quellen.

---

## Ergänzung vom 07.11.2026: Sonne, Mond und Bahn-Overlays

- Sonne und Mond als eigene Himmelsobjekte mit Suche, Fokus, Details und stilisierten Symbolen hinzugefügt; bei Mond mit Phase und Beleuchtungsanteil.
- Neue, voneinander getrennte Ebenen: `sunMoon` (standardmäßig AN), `planetPaths`, `sunPath`, `moonPath` (AUS), `pathArrows` und `selectedPath` (AN).
- Planetenbahnen ±30 Tage und Mondlauf ±7 Tage relativ zum fixierten Sternfeld. Sonnen- und Mondtagesbögen werden aus der lokalen horizontalen Position gebildet.
- Vergangene Abschnitte abgeschwächt, zukünftige stärker sichtbar; Pfeile für Bewegungsrichtung, Horizontquerungen der Tagesbögen markiert.
- Beim Auswählen eines Planeten oder von Sonne/Mond wird dessen Bahn automatisch hervorgehoben; Detailkarte ermöglicht Umschalten.
- Berechnung für Sonne/Mond vollständig lokal (JPL-Erde / vereinfachte Mondtheorie mit topozentrischer Parallaxe); kein zusätzlicher API-Key.
- Neue Tests für Sonnenwenden, Mondphasen, Ortsabhängigkeit und Kurven-Samples sowie simulierte und echte Browser-Interaktionen (ohne Online-APIs).
- Suchergebnis-Icon auf die korrekte Größe begrenzt.

---

# Änderungen in Nachthimmel v2

- HTML, CSS und JavaScript getrennt; die Browser-Einstiegsdatei verwendet ES-Module.
- 49 JavaScript-Module inklusive zentralem Layer-Renderer, Event-Hub und fachlichen Daten-/Darstellungsmodulen.
- Einheitliche Canvas-Layer-Registrierung mit bestehender Darstellungsreihenfolge.
- API-Services (Sternkatalog, Sternbilder, CelesTrak, NASA/CDS und AirLabs) informieren die UI über Domain-Events statt UI-Module aufzurufen.
- Satelliten-Bibliothek, Planeten-Cache und AirLabs-API-Key verfügen über explizite Service-Funktionen statt fachfremder Bindungszuweisungen.
- Vorhandenes Verhalten für Zeitraffer, Suche, Fokus, Detailansicht, GPS, Sensorik, Layer-Schalter, Maus- und Touchbedienung weitgehend beibehalten.
- Offline-Fallback für helle Sterne und Sternbilder sowie lokale Planetenbahnen beibehalten.
- Eine direkt zu öffnende Einzeldatei `dist/Nachthimmel_v2.html` gebaut.
- Tests für Astromathematik, Planeten, Flugzeugkoordinaten, Layer-Reihenfolge und eine simulierte Initialisierung/Interaktion hinzugefügt.

**Abgrenzung:** Der vorhandene flache State wurde aus Kompatibilitätsgründen behalten; Browser- und Live-API-Integration müssen in der Zielumgebung ergänzend geprüft werden.

## PWA-Erweiterung (08.11.2026)

- Web-App-Manifest, App-Icons (192/512 px), Maskable-Icon und Apple-Touch-Icon.
- Service Worker mit versioniertem Offline-Cache für alle lokalen App-Dateien und Offline-Fallback bei Navigation.
- Installation im Einstellungsdialog über einen neuen Abschnitt **App installieren**.
- App funktioniert als installierbare PWA auf HTTPS sowie über `localhost`, nicht über `file://`.
- Offline-Basiskatalog, Planeten, Sonne/Mond und ihre Bahnen ohne Internet nutzbar; externe Datenquellen bleiben onlineabhängig.
- Keine Offline-Zwischenspeicherung von AirLabs, NASA-API, CelesTrak, Google Fonts oder externen CDN-Modulen.
- `npm run build:portable` erstellt `dist/` als vollständig auslieferbares PWA-Verzeichnis ohne Vite-Bundling (TypeScript-Build-Abhängigkeit erforderlich); `npm run build` nutzt weiterhin Vite.
