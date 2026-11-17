# app.vorteile.net – Landingpage & App-Weiche

Eine Adresse für alles: **app.vorteile.net**. Wer die Seite auf dem Smartphone öffnet, landet direkt im
richtigen Store. Alle anderen (Desktop, oder wenn der Store nicht aufgeht) sehen die Landingpage mit
Store-Buttons, QR-Code, Gewinnspiel (VW Tiguan), Partner-Deals, Marken und Vorteils-Shop.

Reines HTML/CSS/JS ohne Build-Schritt und ohne externe Abhängigkeiten. Läuft auf jedem statischen Hosting.

```
index.html            die ganze Seite, inkl. App-Weiche (inline im <head>)
404.html              leitet jede unbekannte Adresse (z. B. /flyer) auf die Startseite um, Parameter bleiben erhalten
assets/css/style.css  Design (CI-Farben als Variablen in :root)
assets/js/main.js     Animationen und Interaktionen
assets/fonts/         Barlow Semi Condensed (SIL OFL, siehe LICENSE.txt)
assets/img/           Tiguan, Deals, Marken-Logos, Produkte, Gutscheine, Store-Badges, Favicon, Teilen-Bild
CNAME                 app.vorteile.net (für GitHub Pages)
```

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
Bilder liegen als WebP in `assets/img/deals`, `assets/img/logos`, `assets/img/products` und `assets/img/gutscheine`.
Eine neue Deal-Kachel = eine `<article class="deal">` kopieren und Bild, Logo, Text und `data-kat` anpassen
(`technik`, `home`, `mobil`, `sport`, `mode`, `beauty`).

## Veröffentlichen

**GitHub Pages:** Settings → Pages → „Deploy from a branch“ → Branch wählen, Ordner `/ (root)`.
Beim DNS-Anbieter für `app.vorteile.net` einen CNAME auf `dinosbs.github.io` setzen, danach in den Pages-Einstellungen
„Enforce HTTPS“ aktivieren. Die Datei `CNAME` liegt schon im Repo.

Jedes andere statische Hosting geht genauso: einfach alle Dateien hochladen.

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen (Handy-Ansicht ohne Weiterleitung: `http://localhost:8000/?stay`).
