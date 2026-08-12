# QuanBar — Neon Club Live (Global EN Pack)

Open-source interactive livestream overlay for **TikTok · YouTube · Facebook**.

- **Product:** QuanBar  
- **Show brand (Club):** Neon Club Live — *Free interactive nightclub — type 1 to join the floor. Gifts unlock fireworks.*  
- **Show brand (Fortune):** Savage Fortune Live — *Ask anything — AI Master roasts your fate in 10 seconds.*

## Quick start

```bash
npm install   # if needed
npm run dev   # host panel + overlay (preview on :8080)
# or
npm start     # alias → same as dev
```

| Route | Purpose |
| --- | --- |
| `/` | Host control panel |
| `/overlay` | OBS browser source |
| `/content` | Global EN content pack browser |

## Global EN Live Pack

English-first setup for overseas audiences (SEA English + US evening). Vietnamese **Local VI** profile remains available.

### How to enable Global EN

1. Open the **Host control** panel (`/`).
2. Under **Live profile**, select **Global EN**.
3. Confirm banner/MC language switches to English (Neon Club Live).
4. Optional: toggle **Fortune mode** for Savage Fortune Live.
5. Config source of truth on disk:
   - [`config/global-en.json`](config/global-en.json) — EN profile
   - [`config/default.json`](config/default.json) — Local VI profile
   - [`config/profiles.json`](config/profiles.json) — registry / default profile

You do **not** need to edit random source files. Use the profile toggle or edit the JSON pack.

### How to go live for an overseas audience

1. Select **Global EN** + **Club** (or Fortune).
2. Enable **MC audio** + **Auto-demo floor**.
3. Add OBS browser source → `/overlay` (1080×1920 portrait or 1920×1080 landscape).
4. **Copy live pack** (title, description, pinned, first 60s script).
5. Paste pin on TikTok/YouTube before going live.
6. Connect platform (or rehearse with Demo + chat simulator).
7. Follow the checklist in the panel and `content/global-en/OBS_SETUP_GLOBAL.md`.

### Content operating system

Full operator pack (titles, scripts, calendar, shorts, OBS, bio):

**[`content/global-en/`](content/global-en/)**

| File | Use |
| --- | --- |
| `BRAND.md` | Voice + visual rules |
| `STREAM_TITLES.md` | 30+ EN titles |
| `THUMBNAIL_TEXT.md` | Thumb/shorts text |
| `HOST_SCRIPTS.md` | Spoken scripts + rundowns |
| `CHAT_GAMES.md` | Games with existing commands |
| `SHORTS_PIPELINE.md` | Clip workflow |
| `POSTING_CALENDAR_14_DAYS.md` | 14-day plan |
| `PLATFORM_PLAYBOOK.md` | TikTok-first growth |
| `OBS_SETUP_GLOBAL.md` | OBS setup |
| `PINNED_AND_BIO.md` | Pin, bio, end CTA |

Also browsable in-app at `/content`.

## Features

- Dance floor overlay + chat commands (`1` / `0` / `dance` / `style` / `skin`)
- Gift FX tiers + TOP board + **wings** (50+ neon · 200 angel · 1000 phoenix)
- Full 3D venue (bar, DJ, bouncer, mezzanine, moving beams)
- Virtual MC hype rotation (EN expanded)
- Fortune mode EN CTA + demo roast lines
- Profile switch: Local VI ↔ Global EN
- Empty-floor auto-demo dancers
- Copy live pack (title / pin / first 60s)

## 3D stack (GSAP · Three.js · R3F · Spline)

| Layer | Lib | Role |
| --- | --- | --- |
| **OBS venue** | **Three.js** + **GSAP** | Full nightclub in `DanceFloor.tsx` — camera intro, gift punch zoom, spawn pop, wing pulse |
| **Gift orbit** | **R3F** (`@react-three/fiber`) | Transparent FX layer on `/overlay` — orbs + rings on gift |
| **Host mini-stage** | **R3F + drei** | Reflective floor demo in host panel (`ClubScene.tsx`) |
| **Brand hero** | **Spline** (`@splinetool/react-spline`) | Host panel brand surface — swap `.splinecode` URL |

Key files:

```text
src/lib/3d/gsap-core.ts          # GSAP helpers for Three objects
src/components/overlay/DanceFloor.tsx
src/components/overlay/ClubScene.tsx
src/components/r3f/R3FCanvas.tsx
src/components/r3f/GiftOrbitFx.tsx
src/components/r3f/SplineBrand.tsx
```

Replace Spline scene:

```tsx
import { SplineBrand } from "@/components/r3f/SplineBrand";
<SplineBrand scene="https://prod.spline.design/YOUR_SCENE/scene.splinecode" />
```
