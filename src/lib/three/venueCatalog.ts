/**
 * GLB catalog for Neon Club venue.
 * All detailed props load via GLTFLoader — no runtime cube/cylinder characters.
 */
export const VENUE_GLTF = {
  discoBall: "/dj_fbx/disco-ball.glb",
  djBooth: "/models/DjBooth.glb",
  barCounter: "/models/BarCounter.glb",
  highTop: "/models/HighTop.glb",
  loungeTable: "/models/LoungeTable.glb",
  speakerStack: "/models/SpeakerStack.glb",
  neonBarSign: "/models/NeonBarSign.glb",
  entranceDoors: "/models/EntranceDoors.glb",
} as const;

/** Tiny furniture only — no 4MB+ chairs or character packs. */
export const VENUE_PRELOAD_URLS = [
  VENUE_GLTF.djBooth,
  VENUE_GLTF.highTop,
  VENUE_GLTF.loungeTable,
  VENUE_GLTF.speakerStack,
  VENUE_GLTF.neonBarSign,
  VENUE_GLTF.entranceDoors,
] as const;
