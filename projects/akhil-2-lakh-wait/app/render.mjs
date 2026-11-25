// node render.mjs out.mp4 from to [scale] [concurrency]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
const [out, from, to, scale = "1", conc = "4"] = process.argv.slice(2);
const serveUrl = process.env.SERVE_URL || await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: process.env.GL || "swangle" };
const browserExecutable = "/opt/pw-browsers/chromium";
const comp = await selectComposition({ serveUrl, id: "AkhilShort", chromiumOptions, browserExecutable });
const t0 = Date.now(); let last = 0;
await renderMedia({ composition: comp, serveUrl, codec: "h264", crf: 16, outputLocation: out, frameRange: [Number(from), Number(to)], scale: Number(scale),
  concurrency: Number(conc), chromiumOptions, browserExecutable, timeoutInMilliseconds: 600000, muted: true, inputProps: JSON.parse(process.env.PROPS || '{}'),
  onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 20) { last = renderedFrames; console.log(renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } } });
console.log("done", ((Date.now() - t0) / 1000).toFixed(0), "s");
