# 3D model + img2threejs integration

## GLB models (`public/models/`)

| File | Use |
| --- | --- |
| `Soldier.glb` | Human dancer A (Idle/Walk/Run) |
| `Xbot.glb` | Human dancer B (idle/walk/run) |
| `RobotExpressive.glb` | Fun neon dancer / DJ (Idle/Dance/Wave) |
| `CesiumMan.glb` | Extra humanoid |
| `Fox.glb` | Prop / easter egg |

## Unified factory

```ts
import { createModelCharacter } from "@/lib/img2threejs";

const dancer = await createModelCharacter({
  style: 0,       // maps to soldier / xbot / robot
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
