import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kih-clock-"));
try {
  const tsc = process.platform === "win32" ? "tsc.cmd" : "tsc";
  execFileSync(tsc, ["src/lib/simulation/clock.ts", "--target", "ES2020", "--module", "ES2020", "--outDir", dir], { stdio: "inherit" });
  const clock = await import(pathToFileURL(path.join(dir, "clock.js")).href);
  const start = "2026-10-01T00:00:00.000Z";
  assert.equal(clock.createExpiry(start, 360), "2026-10-01T06:00:00.000Z");
  assert.equal(clock.getRemainingSeconds("2026-10-01T06:00:00.000Z", Date.parse("2026-10-01T05:59:30.000Z")), 30);
  assert.equal(clock.getRemainingSeconds("2026-10-01T06:00:00.000Z", Date.parse("2026-10-01T06:10:00.000Z")), 0);
  assert.equal(clock.getElapsedSeconds(start, Date.parse("2026-10-01T00:01:05.000Z")), 65);
  assert.equal(clock.formatClock(6 * 3600), "6:00:00");
  assert.equal(clock.formatClock(65), "1:05");
  console.log("✓ Simulation clock functional tests passed");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
