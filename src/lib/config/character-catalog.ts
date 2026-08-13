import { CLUB_GLTF, FLOOR_KINDS } from "@/lib/three/gltf";
import type { GlbModelKind } from "@/lib/img2threejs/createGlbCharacter";

export type CharacterRole = "floor" | "stage";

export type CharacterEntry = {
  id: string;
  kind: GlbModelKind;
  name: string;
  role: CharacterRole;
  roleLabel: string;
  file: string;
  source: string;
  painted: boolean;
};

const FLOOR_META: Record<(typeof FLOOR_KINDS)[number], { name: string; file: string }> = {
  chicken: { name: "Chicken Dance", file: "fbx/Chicken Dance.fbx" },
  runningMan: { name: "Dancing Running Man", file: "fbx/Dancing Running Man.fbx" },
  hipHop2: { name: "Hip Hop (1)", file: "fbx/Hip Hop Dancing (1).fbx" },
  dancing: { name: "Dancing", file: "fbx/Dancing.fbx" },
  salsa: { name: "Salsa", file: "fbx/salsaDance.fbx" },
  hipHop: { name: "Hip Hop", file: "fbx/Hip Hop Dancing.fbx" },
  ymca: { name: "YMCA", file: "fbx/Ymca Dance.fbx" },
  tutHipHop: { name: "Tut Hip Hop", file: "fbx/Tut Hip Hop Dance.fbx" },
  samba: { name: "Samba", file: "fbx/Samba Dancing.fbx" },
  skeleton: { name: "Skeleton Dance", file: "fbx/Spooky Skeleton Dance 2.fbx" },
  rumba: { name: "Rumba", file: "fbx/Rumba Dancing.fbx" },
};

export const CHARACTER_CATALOG: CharacterEntry[] = [
  {
    id: "miku",
    kind: "miku",
    name: "DJ Miku",
    role: "stage",
    roleLabel: "DJ",
    file: "dj_fbx/Miku.fbx",
    source: CLUB_GLTF.miku,
    painted: true,
  },
  {
    id: "freddie",
    kind: "freddie",
    name: "Freddie & Brian",
    role: "stage",
    roleLabel: "MC",
    file: "dj_fbx/Freddie&Brians.glb",
    source: CLUB_GLTF.freddie,
    painted: false,
  },
  {
    id: "lisa",
    kind: "lisa",
    name: "Lisa múa cột",
    role: "stage",
    roleLabel: "Cột",
    file: "dj_fbx/Lisa_Hamilton_KickPole.usdz",
    source: CLUB_GLTF.lisa,
    painted: false,
  },
  {
    id: "bar5",
    kind: "bar5",
    name: "VIP 5dance",
    role: "stage",
    roleLabel: "Sàn trên",
    file: "dj_fbx/5dance 11.fbx",
    source: "/dj_fbx/5dance%2011.fbx",
    painted: true,
  },
  {
    id: "gangster",
    kind: "gangster",
    name: "Bảo vệ cửa",
    role: "stage",
    roleLabel: "Cửa",
    file: "dj_fbx/1920s_Gangster.usdz",
    source: CLUB_GLTF.gangster,
    painted: false,
  },
  ...FLOOR_KINDS.map((kind) => ({
    id: kind,
    kind,
    name: FLOOR_META[kind].name,
    role: "floor" as const,
    roleLabel: "Khách sàn",
    file: FLOOR_META[kind].file,
    source: CLUB_GLTF[kind],
    painted: kind === "chicken" || kind === "salsa",
  })),
];
