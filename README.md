# RoboTrails · site and app

The front page and the app, published with GitHub Pages at `https://robotrails.github.io/`.

```
index.html          the front page (Greek and English, one language toggle)
privacy.html        privacy page
app/index.html      the app: one self-contained file (font and logo included)
runner/             the small program every micro:bit needs once (main.ts, instructions)
assets/             font, logo, screenshots, icons
tracks/             NOT in this repository: the tracks have their own repository
                    (https://github.com/robotrails/tracks) published at https://robotrails.github.io/tracks/
```

The app finds the tracks at `../tracks/` (that is `https://robotrails.github.io/tracks/`). To try another library, open the app with `?tracks=<address>`, for example `app/?tracks=https://example.org/tracks/`. To open a track directly: `app/?track=treasure-island-6x6`.

## Publishing

1. Create the repository `robotrails.github.io` (public) and upload everything in this folder.
2. Settings → Pages → **Deploy from a branch** → `main`, folder `/ (root)`.
3. Open `https://robotrails.github.io/`.

## Changing the app

The whole app is `app/index.html`. Replace that one file to update it. Tablets that already have the page open need a refresh.
