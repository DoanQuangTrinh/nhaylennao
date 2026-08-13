#!/usr/bin/env node
/**
 * Convert every public/fbx/*.fbx → public/3d/<slug>.glb (keeps Mixamo clip + textures).
 * Run while `npm run dev` is up: node scripts/convert-fbx.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "public/3d");
mkdirSync(outDir, { recursive: true });

function slugify(name) {
  return name
    .replace(/\.fbx$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const jobs = [];
const only = process.argv.slice(2);
const addDir = (dir, prefix = "", extra = {}) => {
  try {
    for (const file of readdirSync(dir)) {
      if (!file.toLowerCase().endsWith(".fbx")) continue;
      const slug = extra.slug || `${prefix}${slugify(file)}`;
      if (only.length && !only.includes(slug) && !only.includes(file)) continue;
      jobs.push({
        file,
        url: `${dir.replace(join(root, "public"), "").replace(/\\/g, "/")}/${encodeURIComponent(file)}`,
        slug,
        paintMiku: Boolean(extra.paintMiku) || /miku/i.test(file),
      });
    }
  } catch {
    /* missing folder */
  }
};

addDir(join(root, "public/fbx"));
if (only.includes("--talent") || only.includes("miku_dj")) {
  addDir(join(root, "public/dj_fbx"), "", { paintMiku: true, slug: "miku_dj" });
}
const force = only.includes("--force");
const filtered = jobs.filter((job) => {
  const fbxPath = join(root, "public", decodeURIComponent(job.url.replace(/^\//, "")));
  try {
    if (statSync(fbxPath).size > 20 * 1024 * 1024) {
      console.log("skip large", job.file);
      return false;
    }
  } catch {
    /* keep */
  }
  const out = join(outDir, `${job.slug}.glb`);
  if (!force && existsSync(out)) {
    console.log("skip exists", job.slug);
    return false;
  }
  return true;
});
jobs.length = 0;
jobs.push(...filtered);

if (!jobs.length) {
  console.error("No .fbx to convert");
  process.exit(1);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080/__fbx2glb.html", {
  waitUntil: "domcontentloaded",
  timeout: 20000,
});
await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });

for (const job of jobs) {
  const albedos = [];
  for (let i = 0; i < 8; i++) albedos.push(`/__tex/${job.slug}/tex_${i}.png`);
  const normal = `/__tex/${job.slug}/tex_2.png`;
  console.log("convert", job.file, "→", job.slug, job.paintMiku ? "(miku paint)" : "");
  await page.evaluate(
    async (opts) => window.__fbx2glb(opts),
    { fbx: job.url, albedos, normal, paintMiku: job.paintMiku },
  );
  const result = await page.evaluate(() => window.__result);
  if (!result?.ok) throw new Error("convert failed " + job.file);
  const out = join(outDir, `${job.slug}.glb`);
  writeFileSync(out, Buffer.from(result.base64, "base64"));
  console.log(" ", out, result.size, result.clips, result.meshInfos);
}

await browser.close();
