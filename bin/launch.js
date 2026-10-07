#!/usr/bin/env node
// launch.js — start headless Chrome with a remote debugging port and wait
// until the DevTools HTTP endpoint is ready.
//
// Usage:
//   node bin/launch.js --chrome "C:\path\to\chrome.exe" [--port 9222]
//
// Prints the resolved port, user-data-dir and browser version as JSON.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const chrome = opt("chrome", "chrome");
const port = Number(opt("port", 9222));
const url = opt("url", "about:blank");

const userDataDir = mkdtempSync(join(tmpdir(), "chrome-kit-"));
const child = spawn(chrome, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  url,
], { stdio: "ignore" });

child.on("error", (e) => {
  console.error("failed to launch:", e.message);
  process.exit(1);
});

// poll /json/version until the endpoint answers
async function waitReady(deadlineMs = 15000) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return await r.json();
    } catch { /* endpoint not up yet */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error("devtools endpoint did not come up in time");
}

const info = await waitReady();
console.log(JSON.stringify({
  port,
  userDataDir,
  browser: info.Browser,
  webSocketDebuggerUrl: info.webSocketDebuggerUrl,
}, null, 2));
