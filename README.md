# app.vorteile.net – Landingpage & App-Weiche

Eine Adresse für alles: **app.vorteile.net**. Wer die Seite auf dem Smartphone öffnet, landet direkt im
richtigen Store. Alle anderen (Desktop, oder wenn der Store nicht aufgeht) sehen die Landingpage mit
Store-Buttons, einer Scroll-Story mit der App, Gewinnspiel (VW Tiguan), Partner-Deals, Marken und QR-Code.

Reines HTML/CSS/JS ohne Build-Schritt und ohne externe Abhängigkeiten. Läuft auf jedem statischen Hosting.

```
index.html            die ganze Seite, inkl. App-Weiche (inline im <head>)
404.html              leitet jede unbekannte Adresse (z. B. /flyer) auf die Startseite um, Parameter bleiben erhalten
assets/css/style.css  Design (Farben aus dem Logo-Sheet „Herz & Haken“, 4-Ecken-Verlauf und Glas-Werte als Variablen in :root)
assets/js/main.js     Animationen und Interaktionen
assets/fonts/         Barlow (Fließtext), Barlow Semi Condensed (Überschriften, App-Screens) und Caveat (Handschrift der App), alle SIL OFL
assets/img/           Tiguan, Deals, Marken-Logos, Produkte, Store-Badges, App-Icon, Favicon, Teilen-Bild
assets/img/app/       Kategorie-Kacheln aus der App (für den Kategorien-Screen im Handy)
```

## Aufbau der Seite (kurz und knackig)

1. **Hero** – Headline, Store-Buttons, großes Smartphone mit Intro, schwebende Glasformen wie im Logo-Sheet.
   Neben dem Handy eine QR-Code-Karte mit Scan-Linie (nur Desktop) und eine Gewinnspiel-Karte, die direkt zum Gewinnspiel springt. Auf dem Handy liegt die
   Gewinnspiel-Karte unten mittig; ist kein Platz (Handy quer), entfällt sie.
2. **App in 2 Kapiteln** – das Handy wandert mit Drehung zur Seite, die Screens scrollen mit:

   | Kapitel | Seite des Handys | Screens im Handy |
   | --- | --- | --- |
   | Deals & Kategorien | rechts | Start (Partner-Highlights, Herzen füllen sich) → Kategorien |
   | Shop & Push | links | Produktliste → Produktdetail → in den Warenkorb → Sperrbildschirm mit Push-Mitteilungen |

   Bei jedem Screen-Wechsel hüpfen passende Elemente aus dem Handy (Deal-Karte, Favoriten, Kategorie-Kachel,
   „15 Welten“, Produktkarte, „In den Warenkorb gelegt“, Push-Mitteilung, Tiguan-Karte) und fliegen beim
   Weiterscrollen zurück. Sie stehen in `index.html` unter `data-pops` (`data-pop` = Kapitel, `data-phase` = erster/zweiter Screen).
   `data-desk` = Element nur auf großen Bildschirmen (z. B. QR-Code).
3. **Gewinnspiel** – VW Tiguan, drei Schritte, Teilnahmebedingungen.
4. **Attraktive Angebote** – eine Logo-Reihe, sechs Deals, Abschluss-Karte mit App-Icon, Store-Buttons und QR-Code. Danach Fußzeile.

**Design (Logo-Sheet „Herz & Haken“, helle Variante):** Logo und Bildmarke Herz & Haken, Farben Himmelblau #AFDDF4,
Hellblau #80CBEC, Türkis #24B6D2, Azur #12AAE0, Tiefblau #0B4F7A, Text #0B3A5A. Glasflächen (helle Fläche, weiße Kante,
Lichtkante oben) für Navigation, Karten, Pop-outs und Sticky-Leiste; das Gewinnspiel steht auf einem Azur-Tiefblau-Verlauf
mit Glas-Karten. Glasformen sind bewusst statisch (keine Dauer-Animation), damit das Scrollen flüssig bleibt.

**QR-Code:** im Hero (Desktop), neben den Store-Buttons im Gewinnspiel, in der Abschluss-Karte und im Dialog „App laden“.
Am Desktop schwebt ab dem Gewinnspiel zusätzlich eine kleine QR-Karte unten rechts; sie blendet sich aus, solange ein
anderer QR-Code zu sehen ist, und lässt sich wegklicken. Alle Codes führen auf https://app.vorteile.net (Store-Weiche).
Navigation: „Gewinnspiel“ ist hervorgehoben, mobil als Geschenk-Knopf neben „App laden“.

**Mobil (Hochformat):** Kapiteltext oben, Handy darunter. Beim Kapitelwechsel steigt das Handy in die freie
Bildschirmmitte und wird größer, danach setzt es sich unter den nächsten Text. Am Ende der Story scrollt es mit
weg. Die Leiste „vorteile.net App – Laden“ blendet sich aus, solange andere Store-Buttons zu sehen sind.
**Handy quer:** Text und Handy nebeneinander wie am Desktop.

Die Screens sind in HTML nachgebaut (Abschnitt `data-story` in `index.html`). Die Choreografie steht in `main.js`
unter „App-Story“ (`screenFor`, `PHASE_SPLIT`, Keyframes in `measure()`). Mit „Bewegung reduzieren“ im
Betriebssystem fallen Drehungen und Mitscrollen weg.

## App-Weiche

| Gerät | Ergebnis |
| --- | --- |
| iPhone, iPad (auch iPadOS mit Desktop-Kennung) | App Store |
| Android | Google Play |
| Desktop, Link-Vorschauen (WhatsApp, Slack …), Suchmaschinen | bleibt auf der Landingpage |
| Store geht nicht auf (z. B. In-App-Browser blockiert) | Hinweis-Bildschirm, nach ca. 2,5 s die Landingpage |

- Auf dem Handy erscheint kurz „Wir öffnen den App Store …“ mit Knopf zum manuellen Öffnen und „Lieber erst die Seite ansehen“.
- Weitergeleitet wird, sobald die Seite geladen ist (spätestens nach 1,2 s). Sonst würde der Browser das Laden abbrechen und
  im Fallback stünde eine halbe Seite da.
- Pro Browser-Tab wird nur einmal automatisch weitergeleitet. Kommt man zurück oder lädt neu, bleibt man auf der Seite.
- **Ohne Weiterleitung ansehen** (z. B. zum Testen auf dem Handy): `https://app.vorteile.net/?stay`

## Store-Links und Kampagnen

Die Links stehen nur an einer Stelle: im Objekt `VN` ganz oben in `index.html`.

```js
ios:     'https://apps.apple.com/de/app/vorteile-net/id6807748597',
android: 'https://play.google.com/store/apps/details?id=net.vorteile&hl=de',
applePt: '',   // optional, siehe unten
```

**Google Play** bekommt automatisch einen `referrer` mit, z. B. `utm_source=app.vorteile.net&utm_medium=redirect`.
Die Installationen tauchen damit in der Play Console unter „Nutzerakquisition“ auf.

**Kampagnen über denselben Link:** Hängt man UTM-Parameter an, werden sie an Google Play durchgereicht. So lassen sich
Flyer, Mails oder Plakate auseinanderhalten, ohne neue Links:

```
https://app.vorteile.net/?utm_source=flyer&utm_medium=qr&utm_campaign=tiguan
```

**App Store:** Apple wertet Kampagnen nur mit dem Provider-Token aus (App Store Connect → App-Analyse → Kampagnen).
Wird er in `applePt` eingetragen, hängt die Seite `pt`, `ct` (Kampagnenname) und `mt=8` automatisch an.

## Gewinnspiel

- **Countdown:** Teilnahmeschluss in `data-ende` am Abschnitt `#gewinnspiel` eintragen,
  z. B. `data-ende="2026-12-31T23:59:00+01:00"`. Leer = kein Countdown.
- **Teilnahmebedingungen:** Das Fenster enthält die Kurzfassung (App laden, Push an, einloggen/registrieren).
  Ein Link zu den vollständigen Bedingungen kann im Dialog `#dlg-terms` ergänzt werden (Platz ist im Code markiert).

## Inhalte

Deals, Logos und Produkte stammen aus dem Portal (Stand November 2026) und stehen als fertiges HTML in `index.html`.
Bilder liegen als WebP in `assets/img/deals`, `assets/img/logos` und `assets/img/products`.
Im Abschnitt „Attraktive Angebote“ stehen sechs Deal-Kacheln: Zum Tauschen eine `<article class="deal">` kopieren
und Bild (`assets/img/deals/` und `assets/img/deals/sm/`), Logo und Text anpassen.

## Veröffentlichen

**GitHub Pages:** Settings → Pages → „Deploy from a branch“ → Branch wählen, Ordner `/ (root)`.
Unter „Custom domain“ `app.vorteile.net` eintragen und beim DNS-Anbieter einen CNAME auf `dinosbs.github.io` setzen,
danach „Enforce HTTPS“ aktivieren.

Jedes andere statische Hosting geht genauso: einfach alle Dateien hochladen.

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen (Handy-Ansicht ohne Weiterleitung: `http://localhost:8000/?stay`).
