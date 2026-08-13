import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ScanSearch, UserRound } from "lucide-react";
import { CHARACTER_CATALOG, type CharacterEntry } from "@/lib/config/character-catalog";
import { createGlbCharacter, getRuntime, type GlbModelKind } from "@/lib/img2threejs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CharStatus = "idle" | "loading" | "ok" | "warn" | "error";

type Report = {
  status: CharStatus;
  note: string;
};

function inspectRoot(root: THREE.Object3D, painted: boolean): Report {
  let meshes = 0;
  let withMap = 0;
  let washed = 0;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes += 1;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (std.map) withMap += 1;
      if (std.color) {
        const lum = 0.2126 * std.color.r + 0.7152 * std.color.g + 0.0722 * std.color.b;
        if (!std.map && lum > 0.55) washed += 1;
      }
    }
  });
  if (meshes === 0) return { status: "error", note: "Không thấy mesh" };
  if (painted) return { status: "warn", note: "Không có texture gốc · đã sơn tay" };
  if (withMap === 0 && washed > 0) return { status: "warn", note: "Mất texture · dễ bị trắng/chói" };
  if (withMap === 0) return { status: "warn", note: "Không có texture" };
  return { status: "ok", note: `${meshes} mesh · có màu` };
}

function PreviewStage({
  kind,
  onReport,
}: {
  kind: GlbModelKind;
  onReport: (r: Report) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let alive = true;
    let raf = 0;
    const w = Math.max(mount.clientWidth, 240);
    const h = Math.max(mount.clientHeight, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0c0c14, 1);
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xc8d4e8, 0x1a1a22, 0.7));
    const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
    key.position.set(2.2, 4.2, 3.4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa8c4ff, 0.35);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 36),
      new THREE.MeshStandardMaterial({ color: 0x16161f, metalness: 0.2, roughness: 0.7 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 40);
    camera.position.set(0, 1.35, 4.2);
    camera.lookAt(0, 0.9, 0);

    const clock = new THREE.Clock();
    let character: THREE.Group | null = null;

    onReportRef.current({ status: "loading", note: "Đang tải…" });
    void createGlbCharacter({ kind, dancing: true, scale: 1 })
      .then((root) => {
        if (!alive) {
          getRuntime(root)?.dispose?.();
          return;
        }
        character = root;
        root.position.set(0, 0, 0);
        scene.add(root);
        const painted = CHARACTER_CATALOG.find((c) => c.kind === kind)?.painted ?? false;
        onReportRef.current(inspectRoot(root, painted));
      })
      .catch((e) => {
        if (!alive) return;
        onReportRef.current({
          status: "error",
          note: e instanceof Error ? e.message : "Lỗi tải",
        });
      });

    const tick = () => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (character) {
        character.rotation.y = t * 0.45;
        getRuntime(character)?.tick?.(dt, t);
      }
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(() => {
      const nw = Math.max(mount.clientWidth, 240);
      const nh = Math.max(mount.clientHeight, 220);
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (character) getRuntime(character)?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind]);

  return <div ref={mountRef} className="h-full w-full bg-bg" />;
}

function badgeClass(status: CharStatus) {
  if (status === "ok") return "border-success/40 bg-success/10 text-success";
  if (status === "warn") return "border-warning/40 bg-warning/10 text-warning";
  if (status === "error") return "border-danger/40 bg-danger/10 text-danger";
  if (status === "loading") return "border-accent/40 bg-accent/10 text-accent";
  return "border-border bg-bg text-muted";
}

function badgeText(status: CharStatus) {
  if (status === "ok") return "Ổn";
  if (status === "warn") return "Cảnh báo";
  if (status === "error") return "Lỗi";
  if (status === "loading") return "Đang tải";
  return "Chưa xem";
}

export function CharacterRoster() {
  const [activeId, setActiveId] = useState(CHARACTER_CATALOG[0]!.id);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [scanning, setScanning] = useState(false);
  const [scanLabel, setScanLabel] = useState("");

  const active = CHARACTER_CATALOG.find((c) => c.id === activeId) ?? CHARACTER_CATALOG[0]!;

  const setReport = (id: string, report: Report) => {
    setReports((prev) => ({ ...prev, [id]: report }));
  };

  const scanAll = async () => {
    if (scanning) return;
    setScanning(true);
    for (let i = 0; i < CHARACTER_CATALOG.length; i++) {
      const entry = CHARACTER_CATALOG[i]!;
      setScanLabel(`${i + 1}/${CHARACTER_CATALOG.length} · ${entry.name}`);
      setReport(entry.id, { status: "loading", note: "Đang kiểm tra…" });
      try {
        const root = await createGlbCharacter({ kind: entry.kind, dancing: false, scale: 1 });
        setReport(entry.id, inspectRoot(root, entry.painted));
        getRuntime(root)?.dispose?.();
      } catch (e) {
        setReport(entry.id, {
          status: "error",
          note: e instanceof Error ? e.message : "Lỗi tải",
        });
      }
    }
    setScanning(false);
    setScanLabel("");
  };

  const stage = CHARACTER_CATALOG.filter((c) => c.role === "stage");
  const floor = CHARACTER_CATALOG.filter((c) => c.role === "floor");

  const renderGroup = (title: string, items: CharacterEntry[]) => (
    <div className="space-y-1.5">
      <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
      {items.map((entry) => {
        const report = reports[entry.id];
        const status = report?.status ?? "idle";
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActiveId(entry.id)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
              activeId === entry.id
                ? "border-accent bg-accent/10"
                : "border-border bg-bg/40 hover:bg-surface-2",
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-fg">{entry.name}</span>
              <span className="block truncate text-xs text-muted">{entry.file}</span>
            </span>
            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", badgeClass(status))}>
              {badgeText(status)}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        {renderGroup("Sân khấu", stage)}
        {renderGroup("Khách sàn", floor)}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={scanning}
          onClick={() => void scanAll()}
        >
          <ScanSearch className="size-4" />
          {scanning ? scanLabel || "Đang kiểm tra…" : "Kiểm tra tất cả"}
        </Button>
      </div>
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div>
              <p className="text-sm font-semibold text-fg">{active.name}</p>
              <p className="text-xs text-muted">
                {active.roleLabel} · {active.file}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs",
                badgeClass(reports[active.id]?.status ?? "idle"),
              )}
            >
              {badgeText(reports[active.id]?.status ?? "idle")}
            </span>
          </div>
          <div className="h-[min(42vh,340px)]">
            <PreviewStage
              key={active.kind}
              kind={active.kind}
              onReport={(r) => setReport(active.id, r)}
            />
          </div>
          <div className="flex items-start gap-2 border-t border-border px-4 py-3 text-sm text-muted">
            <UserRound className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>{reports[active.id]?.note || "Chọn nhân vật bên trái để xem 3D và bắt lỗi màu."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
