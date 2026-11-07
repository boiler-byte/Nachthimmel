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
