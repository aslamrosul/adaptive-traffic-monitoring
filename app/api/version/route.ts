import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { readFile } from "fs/promises";
import { promisify } from "util";

export const dynamic = "force-dynamic";

const run = promisify(execFile);

async function gitCommit(): Promise<string> {
  try {
    const { stdout } = await run("git", ["rev-parse", "--short", "HEAD"], {
      cwd: process.cwd(),
      timeout: 5000,
    });
    return stdout.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

// GET /api/version — revision produksi untuk verifikasi deploy. Tanpa secret.
export async function GET() {
  let buildTime: string | null = null;
  let deployedCommit: string | null = null;
  try {
    const raw = await readFile(
      process.cwd() + "/.deploy-info.json",
      "utf-8"
    );
    const info = JSON.parse(raw);
    if (typeof info?.buildTime === "string") buildTime = info.buildTime;
    if (typeof info?.commit === "string") deployedCommit = info.commit;
  } catch {
    buildTime = null;
  }
  let nextBuildId: string | null = null;
  try {
    nextBuildId = (await readFile(process.cwd() + "/.next/BUILD_ID", "utf-8")).trim() || null;
  } catch {
    nextBuildId = null;
  }
  const commit = await gitCommit();
  return NextResponse.json({
    commit: deployedCommit || commit,
    buildTime,
    nextBuildId,
    environment: process.env.NODE_ENV || "production",
  });
}
