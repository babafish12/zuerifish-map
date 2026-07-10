# ZüriFish

ZüriFish ist ein mobile-first Fischerei-Begleiter für Schweizer Seen. Die App verbindet Karte, See- und Patentinformationen, Fisch-Steckbriefe, Fanghinweise und eine eingebettete Foto-Erkennung in einer Android-tauglichen Oberfläche.

## Lokal starten

Voraussetzungen: Node.js 22 und npm.

```bash
npm ci
npm run dev
```

Vite stellt die App standardmässig unter `http://127.0.0.1:5173` bereit. Die Startansicht ist die Karte; über die feste Navigation sind `Fische`, `Fischerkenner` und `Seen` erreichbar.

## Android-APK bauen

Zusätzlich werden ein Android SDK mit API 36 und ein kompatibles JDK benötigt. Android Studio bringt eine passende JDK-/SDK-Umgebung mit.

```bash
npm run android:build
```

Der Befehl baut die Web-App, synchronisiert sie mit Capacitor und erzeugt eine signierte Debug-APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Installation auf einem verbundenen Testgerät:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Alternativ öffnet `npm run android:open` das Projekt in Android Studio. Die Paket-ID lautet `ch.zuerifish.map`; der sichtbare App-Name ist `ZüriFish`.

## Was in der App funktioniert

| Bereich | Aufgabe | Offline-Verhalten |
| --- | --- | --- |
| Karte | 38 Schweizer Seen suchen, auswählen und Detailpanel öffnen | Seen, lokale Vektorkarte und hinterlegte Zonen bleiben verfügbar |
| Fische | 36 Arten durchsuchen, gruppieren und lange Steckbriefe öffnen | Steckbriefdaten und lokale Fischbilder bleiben verfügbar |
| Fischerkenner | Foto an FischFinder übergeben und Treffer mit ZüriFish abgleichen | Manuelle Suche bleibt verfügbar; Foto-Erkennung benötigt Internet |
| Seen | Nach Name/Region filtern, Regeln lesen und direkt zur Karte springen | Hinterlegte Daten bleiben verfügbar; externe Quellen benötigen Internet |

Die Online-Karten `Klar`, `Natur` und `Satellit`, externe Fotos, amtliche Links und FischFinder benötigen eine Netzwerkverbindung. `Offline` ist die Standard-Grundkarte einer neuen Installation.

## Berechtigungen und Datenschutz

Die Android-App fordert nur Funktionen an, die zu sichtbaren App-Aktionen gehören:

- `INTERNET` für Online-Karten, Quellen, Fotos und FischFinder.
- `CAMERA` für die Foto-Erkennung; eine Kamera ist keine Installationsvoraussetzung.
- `ACCESS_COARSE_LOCATION` und `ACCESS_FINE_LOCATION` erst nach Druck auf `Standort`.

HTTP-Mixed-Content ist deaktiviert, App-Backups sind ausgeschlossen und die WebView verwendet CSS-Safe-Areas für Status- und Navigationsleisten. Ein zur Erkennung gewähltes Foto wird an den externen Dienst FischFinder übertragen. ZüriFish speichert keine Aufnahme als eigene App-Datei.

## Qualität prüfen

```bash
npm run lint
npm test
npm run build
cd android && ./gradlew lintDebug testDebugUnitTest assembleDebug
```

Der React-Testlauf deckt Navigation, Karte, Standort, Patentmodi, Fisch-Steckbriefe, Suche/Filter, den eingebetteten Erkenner und den See-zu-Karte-Fluss ab.

## Architektur

- `src/App.tsx` verwaltet App-Navigation, Seeauswahl und Android-taugliche Browser-History.
- `src/components/MapView.tsx` verbindet Leaflet, Seen, Sperrzonen, Standort und Kartensuche.
- `src/components/FishProfilesView.tsx` und `src/components/FishRecognizerView.tsx` teilen dieselben strukturierten Fischdaten.
- `src/components/RulesOverviewView.tsx` führt See-, Patent- und Quelleninformationen zusammen.
- `src/data/` enthält die versionierten JSON-/GeoJSON-Grundlagen.
- `src/lib/offlineMapData.ts` lädt die 6,3-MB-Offline-Karte als separate App-Ressource, damit sie den JavaScript-Start nicht blockiert.
- `android/` ist das von Capacitor verwaltete native Projekt.

## Datenhinweis

ZüriFish ist eine Orientierungshilfe und keine amtliche Rechtsauskunft. Vor dem Fischen müssen Patent, Gewässerabschnitt, aktuelle Schonzeiten, Mindestmasse, Tageslimiten und lokale Signalisation anhand der in der App verlinkten offiziellen Quellen geprüft werden.

## Projektstatus

Persönliches Projekt. Eine Store-Release-Signatur und ein Play-Store-Eintrag sind nicht enthalten; der dokumentierte Build erzeugt eine installierbare Debug-APK.
