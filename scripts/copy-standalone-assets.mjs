import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const copies = [
  { src: join(root, ".next/static"), dest: join(root, ".next/standalone/.next/static") },
  { src: join(root, "public"), dest: join(root, ".next/standalone/public") },
];

let ok = true;
for (const { src, dest } of copies) {
  if (!existsSync(src)) {
    console.warn(`[copy-standalone] skip, src not found: ${src}`);
    ok = false;
    continue;
  }
  try {
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`[copy-standalone] ✓ ${src} → ${dest}`);
  } catch (e) {
    console.error(`[copy-standalone] ✗ failed ${src} → ${dest}`, e);
    ok = false;
  }
}
if (!ok) process.exitCode = 1;
