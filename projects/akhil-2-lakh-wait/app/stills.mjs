// node stills.mjs out/prefix 100,400 [scale] [gl]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [prefix, frames, scale = "0.5", gl = "swangle"] = process.argv.slice(2);
const serveUrl = process.env.SERVE_URL || await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl };
const browser = await openBrowser("chrome", { chromiumOptions, browserExecutable: "/opt/pw-browsers/chromium" + "" });
const comp = await selectComposition({ serveUrl, id: "AkhilShort", puppeteerInstance: browser, chromiumOptions, inputProps: JSON.parse(process.env.PROPS || "{}") });
fs.mkdirSync(path.dirname(prefix), { recursive: true });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition: comp, serveUrl, frame: f, output: `${prefix}${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), inputProps: JSON.parse(process.env.PROPS || "{}"), puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 240000 });
  console.log("frame", f, Date.now() - t0, "ms");
}
await browser.close({ silent: true });
