# 3D model + img2threejs integration

## GLB models (`public/3d/`)

| File | Use |
| --- | --- |
| `hip_hop_dancing.glb` | Floor guest (Aya + extras) |
| `rumba_dancing.glb` | Floor guest (Ken + extras) |
| `ymca_dance.glb` | Floor guest (Mia) / MC |
| `miku_dj.glb` | DJ |
| `lisa_pole.glb` | Pole dancer |

Venue furniture stays in `public/models/` (booth, bar, tables) — not characters.

## Unified factory

```ts
import { createModelCharacter } from "@/lib/img2threejs";

const dancer = await createModelCharacter({
  style: 0,       // maps to hipHop / rumba / ymca
  dancing: true,
  role: "dancer", // or dj | bartender | bouncer
  prefer: "auto", // glb (default) → fashion → photo
});
scene.add(dancer);
```

Default: **GLB ON** (`localStorage quanbar-use-glb` defaults to on).  
Host panel → **GLB avatars ON** / **Preload GLB**.

## Loader

`src/lib/three/gltf.ts` — `GLTFLoader` + DRACO + SkeletonUtils clone + cache.

## Fallback chain

1. Skinned GLB (real 3D mesh + AnimationMixer)
2. `createFashionCharacter` procedural human
3. `createPhotoCharacter` AI card (dancers only)

## Adding a new .glb

1. Drop file in `public/models/MyModel.glb`
2. Register in `CLUB_GLTF` / `DANCER_GLTF_URLS`
3. Map style index in `createModelCharacter`
