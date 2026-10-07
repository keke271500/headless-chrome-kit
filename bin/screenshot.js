#!/usr/bin/env node
// screenshot.js — take a full-page screenshot of a URL using an already
// running headless Chrome instance (see bin/launch.js) over the DevTools
// protocol.
//
// Usage:
//   node bin/screenshot.js --port 9222 --url https://example.com --out page.png
import { setTimeout as sleep } from "node:timers/promises";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const port = Number(opt("port", 9222));
const targetUrl = opt("url", "https://example.com");
const out = opt("out", "page.png");
const settle = Number(opt("settle", 1500));

// create a fresh tab
const target = await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: "PUT" })).json();
if (!target || !target.webSocketDebuggerUrl) {
  console.error("no debuggable target:", JSON.stringify(target));
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
  }
};
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
});
await send("Page.navigate", { url: targetUrl });
await sleep(settle);

const { data } = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
});
writeFileSync(out, Buffer.from(data, "base64"));
console.log(`saved ${out} (${targetUrl})`);

ws.close();
process.exit(0);
