// Painted canvas textures for the Kerala room and street (flat cartoon paint, seams as dark tints, no photo detail).
import * as THREE from "three";
import { INK } from "./toon";

export const rng = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};
const cache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, wrap = true) => {
  let t = cache.get(key);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    draw(cv.getContext("2d")!, rng(seed + 1));
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    cache.set(key, t);
  }
  return t;
};
export const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const blotch = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, cols: string[], n = 60, s = 60) => {
  for (let i = 0; i < n; i++) { g.fillStyle = pick(r, cols); g.beginPath(); g.ellipse(r() * w, r() * h, s * (0.5 + r()), s * (0.3 + 0.5 * r()), r() * 3, 0, 7); g.fill(); }
};

// ---------------- room ----------------
/** wall: 1 texture = 3 m tall wall strip, 3 m wide. Pale Kerala mint with a darker dado skirting */
export const wallTex = (base = "#a9d6c3", dado = "#4f8f80") => ctex("wall" + base, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  blotch(g, r, 512, 512, ["rgba(255,255,255,.07)", "rgba(40,80,70,.05)"], 80, 50);
  g.fillStyle = dado; g.fillRect(0, 512 - 26, 512, 26);
  g.fillStyle = "rgba(20,30,30,.35)"; g.fillRect(0, 512 - 28, 512, 3);
});
export const floorTex = () => ctex("floor", 512, 512, (g, r) => {
  g.fillStyle = "#a5432f"; g.fillRect(0, 0, 512, 512);
  blotch(g, r, 512, 512, ["rgba(255,190,160,.08)", "rgba(80,20,10,.08)"], 70, 70);
  g.strokeStyle = "rgba(60,15,10,.45)"; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
export const woodTex = (base = "#8a5532") => ctex("wood" + base, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(50,25,10,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 3; g.beginPath(); const y = r() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + (r() - 0.5) * 20, 170, y + (r() - 0.5) * 20, 256, y); g.stroke(); }
});
/** checked bed sheet (lungi checks) */
export const sheetTex = () => ctex("sheet", 256, 256, (g) => {
  g.fillStyle = "#e9eef5"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = "rgba(52,96,178,.55)"; g.fillRect(i * 32, 0, 12, 256); g.fillRect(0, i * 32, 256, 12);
    g.fillStyle = "rgba(200,60,60,.35)"; g.fillRect(i * 32 + 20, 0, 3, 256); g.fillRect(0, i * 32 + 20, 256, 3);
  }
});
/** the view through the window, painted for each light */
export const outsideTex = (light: string) => ctex("out" + light, 512, 512, (g, r) => {
  const sky: Record<string, string[]> = {
    night: ["#0f1840", "#22336e", "#3a4f8f"], dark: ["#090f2a", "#141f48", "#1e2c5e"],
    day: ["#4f8cdb", "#8fbde9", "#cfe4f5"], golden: ["#8d82b8", "#f3a27c", "#ffd590"],
  };
  const c = sky[light] ?? sky.day;
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, c[0]); gr.addColorStop(0.6, c[1]); gr.addColorStop(1, c[2]);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const nightish = light === "night" || light === "dark";
  if (nightish) {
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,230,${0.4 + r() * 0.6})`; g.fillRect(r() * 512, r() * 300, 2, 2); }
    if (light === "night") { g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(380, 110, 34, 0, 7); g.fill(); }
  }
  if (light === "golden") { g.fillStyle = "#fff1c4"; g.beginPath(); g.arc(150, 390, 46, 0, 7); g.fill(); }
  // distant hill + palms
  const sil = nightish ? (light === "dark" ? "#070b1c" : "#0b1230") : light === "golden" ? "#5a4a66" : "#3f7a4f";
  g.fillStyle = sil;
  g.beginPath(); g.moveTo(0, 430); for (let x = 0; x <= 512; x += 32) g.lineTo(x, 420 - 25 * Math.sin(x * 0.012) - 10 * r()); g.lineTo(512, 512); g.lineTo(0, 512); g.fill();
  for (const [px, ph] of [[70, 230], [210, 170], [300, 260], [450, 200]]) {
    g.strokeStyle = sil; g.lineWidth = 9; g.beginPath(); g.moveTo(px, 512); g.quadraticCurveTo(px + 20, 512 - ph / 2, px + 8, 512 - ph); g.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, ex = px + 8 + Math.cos(a) * 70, ey = 512 - ph + Math.sin(a) * 30 + 20;
      g.lineWidth = 10; g.beginPath(); g.moveTo(px + 8, 512 - ph); g.quadraticCurveTo((px + 8 + ex) / 2, 512 - ph - 25, ex, ey); g.stroke();
    }
  }
  // neighbour house window glow at night
  if (light === "night") { g.fillStyle = "#ffcf6a"; g.fillRect(250, 445, 22, 18); g.fillRect(282, 445, 22, 18); }
}, false);
export const rainTex = () => ctex("rain", 256, 512, (g, r) => {
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(190,210,255,.55)"; g.lineWidth = 2;
  for (let i = 0; i < 110; i++) { const x = r() * 256, y = r() * 512, l = 20 + r() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + l); g.stroke(); }
});
export const clockTex = () => ctex("clock", 256, 256, (g) => {
  g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.lineWidth = 6; g.beginPath(); g.moveTo(128 + Math.cos(a) * 95, 128 + Math.sin(a) * 95); g.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108); g.stroke(); }
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.stroke(); g.beginPath(); g.moveTo(128, 128); g.lineTo(180, 140); g.stroke();
}, false);
export const pipsTex = (n: number) => ctex("pips" + n, 128, 128, (g) => {
  g.fillStyle = "#fbf7ee"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = n === 1 ? "#d0303a" : INK;
  const P: Record<number, number[][]> = { 1: [[64, 64]], 2: [[34, 34], [94, 94]], 3: [[30, 30], [64, 64], [98, 98]], 4: [[34, 34], [94, 34], [34, 94], [94, 94]], 5: [[30, 30], [98, 30], [64, 64], [30, 98], [98, 98]], 6: [[34, 28], [94, 28], [34, 64], [94, 64], [34, 100], [94, 100]] };
  for (const [x, y] of P[n]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
}, false);

// ---------------- street ----------------
export const asphaltTex = () => ctex("asphalt", 512, 512, (g, r) => {
  g.fillStyle = "#5d5f68"; g.fillRect(0, 0, 512, 512);
  blotch(g, r, 512, 512, ["rgba(30,30,40,.12)", "rgba(200,200,210,.05)"], 70, 60);
  g.fillStyle = "#f2efe6"; for (let x = 0; x < 512; x += 256) g.fillRect(x + 20, 248, 130, 16); // dashed centre line (texture spans 14 m x 14 m)
});
export const paverTex = () => ctex("paver", 256, 256, (g, r) => {
  g.fillStyle = "#c9b9a0"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = pick(r, ["#cdbda4", "#c2b197", "#d4c6af", "#b9a88e"]);
    g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
  }
});
export const kerbTex = () => ctex("kerb", 256, 32, (g) => {
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#f3d23a" : "#26242a"; g.fillRect(i * 64, 0, 64, 32); }
});
export const grassTex = () => ctex("grass", 512, 512, (g, r) => {
  g.fillStyle = "#7cb653"; g.fillRect(0, 0, 512, 512);
  blotch(g, r, 512, 512, ["rgba(90,150,55,.4)", "rgba(150,205,100,.3)", "rgba(160,130,80,.15)"], 80, 50);
  for (let i = 0; i < 1800; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = pick(r, ["#5f9c3d", "#8fcc5f", "#6aa844"]); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 7); g.stroke(); }
});
export const tileRoofTex = () => ctex("tiles", 256, 256, (g, r) => {
  g.fillStyle = "#b8553a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = pick(r, ["#c25e3f", "#ad4e35", "#c96a48", "#a34730"]);
    g.beginPath(); g.ellipse(x * 32 + 16 + (y % 2) * 16, y * 32 + 22, 15, 12, 0, 0, Math.PI); g.fill();
    g.fillStyle = "rgba(60,20,10,.35)"; g.fillRect(x * 32 + (y % 2) * 16, y * 32 + 30, 32, 2);
  }
});
export const shutterTex = () => ctex("shutter", 128, 256, (g) => {
  g.fillStyle = "#9aa2ad"; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 10) { g.fillStyle = "rgba(40,45,60,.35)"; g.fillRect(0, y, 128, 2); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, y + 3, 128, 2); }
});
const SIGNS = ["#e0473c", "#2f7fd0", "#f2b630", "#2a9a62", "#8a4fc8", "#e86a2a"];
const WALLS = ["#f0d79a", "#f2b7a6", "#bfe0c8", "#a9cbe8", "#f5ecd2", "#e8c0d8", "#f3e18f"];
/** a whole shop-house front: w metres wide, h metres tall, 120 px per metre */
export const facadeTex = (key: string, w: number, h: number, kind: "shutter" | "open" | "travel" | "phone" | "house", two: boolean) => ctex(`fac_${key}`, Math.round(w * 96), Math.round(h * 96), (g, r) => {
  const P = 96, W = w * P, H = h * P;
  const wall = pick(r, WALLS);
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  blotch(g, r, W, H, ["rgba(255,255,255,.08)", "rgba(80,60,40,.07)"], 30, 40);
  // stained lower band
  g.fillStyle = "rgba(90,70,50,.15)"; g.fillRect(0, H - 0.35 * P, W, 0.35 * P);
  const gf = 3.2 * P; // ground floor height
  const op = { x: 0.35 * P, y: H - gf + 0.75 * P, w: W - 0.7 * P, h: gf - 0.75 * P };
  if (kind !== "house") {
    // sign board band
    const sc = pick(r, SIGNS);
    g.fillStyle = sc; g.fillRect(0.15 * P, H - gf + 0.1 * P, W - 0.3 * P, 0.55 * P);
    g.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < Math.floor(w / 1.1); i++) { g.beginPath(); g.arc(0.7 * P + i * 1.1 * P, H - gf + 0.38 * P, 0.13 * P, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(20,15,20,.6)"; g.lineWidth = 4; g.strokeRect(0.15 * P, H - gf + 0.1 * P, W - 0.3 * P, 0.55 * P);
  }
  if (kind === "shutter") {
    for (let y = op.y; y < op.y + op.h; y += 10) { g.fillStyle = "#98a0ab"; g.fillRect(op.x, y, op.w, 8); g.fillStyle = "rgba(40,45,60,.4)"; g.fillRect(op.x, y + 8, op.w, 2); }
  } else if (kind === "house") {
    g.fillStyle = "#6b4a32"; g.fillRect(W / 2 - 0.5 * P, H - 2.2 * P, 1.0 * P, 2.2 * P);
    g.fillStyle = "#3e7f68"; for (const x of [0.25, 0.75]) { if (W * x - 0.5 * P < 0.2 * P) continue; g.fillRect(W * x - 0.45 * P, H - 2.4 * P, 0.9 * P, 1.1 * P); g.fillStyle = "#1f2a30"; g.fillRect(W * x - 0.37 * P, H - 2.32 * P, 0.74 * P, 0.94 * P); g.fillStyle = "#3e7f68"; }
  } else {
    // open shop: dark interior, counter, goods on shelves
    g.fillStyle = "#3a2f3a"; g.fillRect(op.x, op.y, op.w, op.h);
    for (let s = 0; s < 3; s++) {
      const y = op.y + 0.35 * P + s * 0.55 * P;
      g.fillStyle = "#6a5544"; g.fillRect(op.x + 4, y + 0.38 * P, op.w - 8, 6);
      for (let x = op.x + 10; x < op.x + op.w - 20; x += 0.24 * P) { g.fillStyle = pick(r, ["#f2b630", "#e0473c", "#2f7fd0", "#f5f0e0", "#2a9a62"]); g.fillRect(x, y + 0.1 * P, 0.18 * P, 0.28 * P); }
    }
    g.fillStyle = "#c9a774"; g.fillRect(op.x, op.y + op.h - 0.9 * P, op.w, 0.9 * P);
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(op.x, op.y + op.h - 0.9 * P, op.w, 6);
  }
  if (kind === "travel") { // poster: plane over a beach with a palm
    const px = op.x + 0.25 * P, py = op.y + 0.25 * P, pw = op.w * 0.7, ph = 1.1 * P;
    g.fillStyle = "#7cc8f2"; g.fillRect(px, py, pw, ph);
    g.fillStyle = "#f2dc9a"; g.fillRect(px, py + ph * 0.72, pw, ph * 0.28);
    g.fillStyle = "#2f8fd0"; g.fillRect(px, py + ph * 0.6, pw, ph * 0.13);
    g.fillStyle = "#ffe066"; g.beginPath(); g.arc(px + pw * 0.8, py + ph * 0.25, ph * 0.12, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(px + pw * 0.2, py + ph * 0.3); g.lineTo(px + pw * 0.55, py + ph * 0.22); g.lineTo(px + pw * 0.58, py + ph * 0.27); g.lineTo(px + pw * 0.22, py + ph * 0.34); g.fill();
    g.fillRect(px + pw * 0.35, py + ph * 0.18, pw * 0.05, ph * 0.2);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(px, py, pw, ph);
  }
  if (kind === "phone") { // window of phones
    g.fillStyle = "#d9ecf5"; g.fillRect(op.x + 0.2 * P, op.y + 0.25 * P, op.w - 0.4 * P, 1.25 * P);
    for (let i = 0; i < 5; i++) {
      const x = op.x + 0.4 * P + i * ((op.w - 0.8 * P) / 5);
      g.fillStyle = "#22242c"; g.fillRect(x, op.y + 0.45 * P, 0.32 * P, 0.62 * P);
      g.fillStyle = pick(r, ["#ff7aa8", "#7ab8ff", "#9dffb8", "#ffd36a"]); g.fillRect(x + 4, op.y + 0.45 * P + 6, 0.32 * P - 8, 0.62 * P - 14);
    }
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(op.x + 0.2 * P, op.y + 0.25 * P, op.w - 0.4 * P, 1.25 * P);
  }
  if (two) { // upper floor windows + chajja shadow
    const n = Math.max(1, Math.floor(w / 2.2));
    for (let i = 0; i < n; i++) {
      const cx = ((i + 0.5) * W) / n, y = H - gf - 2.3 * P;
      g.fillStyle = "#3e7f68"; g.fillRect(cx - 0.55 * P, y, 1.1 * P, 1.3 * P);
      g.fillStyle = "#1d2a33"; g.fillRect(cx - 0.47 * P, y + 0.08 * P, 0.94 * P, 1.14 * P);
      g.fillStyle = "#3e7f68"; for (let b = 1; b < 5; b++) g.fillRect(cx - 0.47 * P + b * 0.188 * P, y + 0.08 * P, 4, 1.14 * P);
      g.fillStyle = "rgba(40,30,40,.25)"; g.fillRect(cx - 0.8 * P, y - 0.15 * P, 1.6 * P, 0.15 * P);
    }
    g.fillStyle = "rgba(40,30,40,.25)"; g.fillRect(0, H - gf - 0.12 * P, W, 0.12 * P);
  }
}, false);
export const frondTex = (col = "#3f8f3c") => ctex("frond" + col, 512, 128, (g) => {
  g.clearRect(0, 0, 512, 128);
  g.strokeStyle = "#4a6a2a"; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 64); g.quadraticCurveTo(256, 50, 512, 70); g.stroke();
  for (let i = 0; i < 34; i++) {
    const x = 10 + i * 14.5, l = 52 * Math.sin((i / 34) * Math.PI) + 10;
    for (const s of [-1, 1]) {
      g.strokeStyle = i % 3 ? col : "#58a84a"; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(x, 62); g.lineTo(x + 18, 62 + s * l); g.stroke();
    }
  }
});
export const trunkTex = () => ctex("trunk", 64, 256, (g) => {
  g.fillStyle = "#8b7356"; g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 12) { g.fillStyle = "rgba(50,35,25,.35)"; g.fillRect(0, y, 64, 3); }
});
