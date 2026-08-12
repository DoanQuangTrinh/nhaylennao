/**
 * GLB catalog for Neon Club venue.
 * All detailed props load via GLTFLoader — no runtime cube/cylinder characters.
 */
export const VENUE_GLTF = {
  // Characters (skinned)
  soldier: "/models/Soldier.glb",
  xbot: "/models/Xbot.glb",
  robot: "/models/RobotExpressive.glb",
  // Furniture / venue
  djBooth: "/models/DjBooth.glb",
  barCounter: "/models/BarCounter.glb",
  highTop: "/models/HighTop.glb",
  loungeTable: "/models/LoungeTable.glb",
  speakerStack: "/models/SpeakerStack.glb",
  neonBarSign: "/models/NeonBarSign.glb",
  entranceDoors: "/models/EntranceDoors.glb",
  sheenChair: "/models/SheenChair.glb",
  boomBox: "/models/BoomBox.glb",
} as const;

/** Prefetch list for overlay boot */
export const VENUE_PRELOAD_URLS = [
  VENUE_GLTF.djBooth,
  VENUE_GLTF.barCounter,
  VENUE_GLTF.highTop,
  VENUE_GLTF.loungeTable,
  VENUE_GLTF.speakerStack,
  VENUE_GLTF.neonBarSign,
  VENUE_GLTF.entranceDoors,
  VENUE_GLTF.sheenChair,
  VENUE_GLTF.soldier,
  VENUE_GLTF.xbot,
  VENUE_GLTF.robot,
] as const;
