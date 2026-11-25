// node frames.mjs outdir every [from] [to]  -> jpeg frames (renderFrames, one page per tab, reuses the world)
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [dir, every = "45", from = "0", to = "3077", conc = "4"] = process.argv.slice(2);
const serveUrl = process.env.SERVE_URL || await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: "swangle" }, browserExecutable = "/opt/pw-browsers/chromium";
const comp = await selectComposition({ serveUrl, id: "AkhilShort", chromiumOptions, browserExecutable });
const t0 = Date.now();
await renderFrames({ composition: comp, serveUrl, outputDir: path.resolve(dir), imageFormat: "jpeg", jpegQuality: 85, everyNthFrame: Number(every),
  frameRange: [Number(from), Math.min(Number(to), comp.durationInFrames - 1)], concurrency: Number(conc), chromiumOptions, browserExecutable,
  inputProps: JSON.parse(process.env.PROPS || "{}"), timeoutInMilliseconds: 600000, onStart: () => {}, onFrameUpdate: (n) => { if (n % 10 === 0) console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0) + "s");
