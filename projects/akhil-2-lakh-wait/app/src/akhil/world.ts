// The whole film as one three.js scene: Akhil's rented room (origin) and a Kerala town street (x = ST).
// update(shot, f, cam) poses everything for that frame (pure function of the frame).
import * as THREE from "three";
import { twoTone, TONE, CHAR, untone } from "./shade";
import { LIGHTS, LightPreset } from "./lights";
import { NOINK } from "./ink";
import { Pool, Actor, Fx } from "./castkit";
import { Pen, bodyFront, bodySide, Outfit, Expr, fxBurst, fxStars, fxPuff, fxContact, INK, FrontOpts, SideOpts } from "./toon";
import { drawPhone, drawCalendar, drawNote } from "./screens";
import { FPS, Shot, Actor as ActorSpec, FxSpec, ST, PHONE, POT, NOTES, CAL, SEAT, WALK_Z, FOOT_Y, clamp01, smooth, V3 } from "./story";
import * as P from "./paint";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lam = (o: THREE.MeshLambertMaterialParameters, lift = 1) => twoTone(new THREE.MeshLambertMaterial(o), lift);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

// ---------------- the cast ----------------
const HAIR = "#1b1514";
export const OFFICE: Outfit = { jacket: "#7eaee6", pants: "#3b3f55", boots: "#2b2220", hat: "hair", hair: HAIR, moustache: HAIR, skin: "#c98d63", buttons: "#ffffff" };
export const HOME: Outfit = { jacket: "#e0574a", pants: "#2f4a6a", boots: "#7a5030", hat: "hair", hair: HAIR, moustache: HAIR, skin: "#c98d63", buttons: "none" };
const SEED = 4;
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [960, 1600, 1.6] : d < 6.5 ? [720, 1200, 1.2] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
/** blinks every 0.5-2.3 s, 4 frames */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number) => {
  let s = 7;
  for (let n = 0; s <= f && n < 600; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(n, 13)); }
  return 0;
};

// ---------------- fx drawings ----------------
const text = (p: Pen, s: string, x: number, y: number, px: number, fill: string, w = 14) => {
  const g = p.g; g.font = `900 ${px}px Inter, FreeSans, sans-serif`; g.textAlign = "center"; g.lineJoin = "round";
  g.lineWidth = w; g.strokeStyle = INK; g.strokeText(s, x, y); g.fillStyle = fill; g.fillText(s, x, y);
};
const FXD: Record<FxSpec["kind"], { cw: number; ch: number; draw: (p: Pen, u: number, i: number) => void; keep: boolean; soft?: boolean }> = {
  q: { cw: 200, ch: 260, keep: true, draw: (p) => text(p, "?", 100, 220, 230, "#ffffff", 16) },
  sweat: { cw: 120, ch: 160, keep: true, draw: (p, u) => { const y = 30 + 80 * u; p.poly([[60, y - 40], [90, y + 20], [60, y + 45], [30, y + 20]], "#9fd4ff", 7); } },
  buzz: { cw: 300, ch: 300, keep: true, draw: (p, u) => { for (const s of [-1, 1]) for (let k = 0; k < 2; k++) p.arc(150, 150, 60 + k * 40 + 10 * u, 70 + k * 30, s > 0 ? -40 : 140, s > 0 ? 40 : 220, 10); } },
  burst: { cw: 500, ch: 500, keep: false, draw: (p, u) => fxBurst(p, u, "#a6ffbf", 12, 50, 240) },
  stars: { cw: 420, ch: 210, keep: false, draw: (p, u) => fxStars(p, u) },
  puff: { cw: 300, ch: 300, keep: false, soft: true, draw: (p, u) => fxPuff(p, u) },
  shock: { cw: 300, ch: 300, keep: false, draw: (p, u) => { for (let k = 0; k < 3; k++) { const a = (-60 + k * 30) * Math.PI / 180, r0 = 60 + 50 * u, r1 = r0 + 70; p.stroke([[150 + Math.cos(a) * r0, 200 + Math.sin(a) * r0], [150 + Math.cos(a) * r1, 200 + Math.sin(a) * r1]], 16); } } },
  buy: { cw: 320, ch: 200, keep: true, draw: (p) => {
    const g = p.g; g.beginPath(); g.roundRect(20, 20, 280, 140, 60); g.fillStyle = "#2fc46b"; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
    text(p, "BUY", 160, 125, 96, "#ffffff", 0);
  } },
  think: { cw: 640, ch: 560, keep: true, draw: (p) => {
    const cl: [number, number, number][] = [[200, 200, 110], [330, 150, 120], [460, 210, 110], [420, 320, 110], [260, 320, 115], [150, 290, 80]];
    for (const [x, y, r] of cl) p.ell(x, y, r, r * 0.85, "#ffffff", 14);
    for (const [x, y, r] of cl) p.ell(x, y, r - 7, r * 0.85 - 7, "#ffffff", 0);
    p.ell(540, 470, 26, 22, "#ffffff", 10); p.ell(590, 525, 15, 13, "#ffffff", 8);
    // beach, sun, palm, money stack
    p.ell(300, 330, 170, 40, "#f2dc9a", 0);
    p.ell(400, 150, 38, 38, "#ffd84a", 8);
    p.stroke([[220, 330], [235, 250], [228, 180]], 12, "#8b6a46");
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; p.stroke([[228, 180], [228 + Math.cos(a) * 60, 180 + Math.sin(a) * 30 + 15]], 12, "#3f9a3c"); }
    for (let k = 0; k < 4; k++) p.poly([[300, 300 - k * 22], [410, 300 - k * 22], [410, 318 - k * 22], [300, 318 - k * 22]], "#b8b59e", 6);
  } },
  dice: { cw: 10, ch: 10, keep: true, draw: () => {} },
  rain: { cw: 10, ch: 10, keep: true, draw: () => {} },
  ping: { cw: 10, ch: 10, keep: true, draw: () => {} },
};

// ---------------- helpers ----------------
const box = (w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D, shadow = true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
};
const plane = (w: number, h: number, mat: THREE.Material, parent: THREE.Object3D) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; parent.add(m); return m; };
const cyl = (r0: number, r1: number, h: number, mat: THREE.Material, parent: THREE.Object3D, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
const dynTex = (w: number, h: number) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { cv, g: cv.getContext("2d")!, t, key: "" };
};

export class World {
  root = new THREE.Group();
  private room = new THREE.Group(); private street = new THREE.Group();
  private pool = new Pool(); private actors: Actor[] = []; private fxs: Fx[] = [];
  private sun = new THREE.DirectionalLight("#fff", 2.5); private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial; private fog = new THREE.Fog("#bcd6ee", 30, 320);
  private outside: THREE.Mesh; private rain: THREE.Mesh; private tube: THREE.Mesh; private lampBulb: THREE.Mesh;
  private screen = dynTex(540, 1170); private screenMesh: THREE.Mesh; private screenMat: THREE.MeshBasicMaterial;
  private cal = dynTex(400, 560); private calMat: THREE.MeshBasicMaterial;
  private stack: THREE.InstancedMesh; private bundles: THREE.Mesh[] = []; private flyers: THREE.Mesh[] = [];
  private pot: THREE.Group; private potNotes: THREE.Mesh[] = [];
  private plant = new THREE.Group(); private stem: THREE.Mesh; private leaves: THREE.Mesh[] = [];
  private dice: THREE.Mesh[] = []; private fan = new THREE.Group();
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere();
  private sunCache = new Map<number, THREE.Vector3>();

  constructor() {
    const R = this.root;
    R.add(this.room, this.street);
    // ---- sky (street only) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, 0.05, el)); c = mix(c, c2, smoothstep(0.05, 0.14, el));
          c = mix(c, c3, smoothstep(0.14, 0.28, el)); c = mix(c, c4, smoothstep(0.28, 0.7, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024);
    R.add(this.sun, this.sun.target, this.hemi);

    // ================= ROOM =================
    const G = this.room;
    const wall = lam({ map: P.rep(P.wallTex(), 1, 1) });
    const wallL = lam({ map: P.rep(P.wallTex(), 1.5, 1) });
    const floor = lam({ map: P.rep(P.floorTex(), 4, 4) });
    const white = lam({ color: "#efece4" });
    const woodM = lam({ map: P.woodTex() }), woodD = lam({ map: P.woodTex("#6a3f24") });
    const green = lam({ color: "#3e7f68" }), iron = lam({ color: "#2e3340" }, 0.3);
    // floor 4.8 x 5, walls 3 m
    const fl = plane(4.8, 4.6, floor, G); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, -0.3);
    const ce = plane(4.8, 4.6, white, G); ce.rotation.x = Math.PI / 2; ce.position.set(0, 3, -0.3);
    // back wall with a window hole: 4 pieces
    const WX0 = -0.75, WX1 = 0.35, WY0 = 1.05, WY1 = 2.15, BZ = -2.6;
    const bw = (x0: number, x1: number, y0: number, y1: number) => {
      const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + 2.4 + uv.getX(i) * (x1 - x0)) / 3, (y0 + uv.getY(i) * (y1 - y0)) / 3);
      const m = new THREE.Mesh(g, wall); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, BZ); m.receiveShadow = true; G.add(m);
    };
    bw(-2.4, WX0, 0, 3); bw(WX1, 2.4, 0, 3); bw(WX0, WX1, 0, WY0); bw(WX0, WX1, WY1, 3);
    for (const s of [-1, 1]) { const w = plane(4.6, 3, wallL, G); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 2.4, 1.5, -0.3); }
    // window: green frame, iron bars, painted view outside
    box(WX1 - WX0 + 0.12, 0.07, 0.16, green, (WX0 + WX1) / 2, WY0 - 0.07, BZ + 0.02, G);
    box(WX1 - WX0 + 0.12, 0.07, 0.16, green, (WX0 + WX1) / 2, WY1, BZ + 0.02, G);
    for (const x of [WX0 - 0.03, WX1 + 0.03]) box(0.07, WY1 - WY0, 0.16, green, x, WY0, BZ + 0.02, G);
    for (let i = 1; i < 6; i++) { const b = cyl(0.009, 0.009, WY1 - WY0, iron, G, 6); b.position.set(WX0 + ((WX1 - WX0) * i) / 6, (WY0 + WY1) / 2, BZ + 0.01); }
    box(0.04, WY1 - WY0, 0.03, green, (WX0 + WX1) / 2, WY0, BZ - 0.05, G);
    this.outside = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: P.outsideTex("night"), fog: false }));
    this.outside.position.set((WX0 + WX1) / 2, 1.6, BZ - 0.9); this.outside.layers.set(NOINK); G.add(this.outside);
    const rt = P.rainTex(); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(2, 1.5);
    this.rain = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, fog: false }));
    this.rain.position.set((WX0 + WX1) / 2, 1.6, BZ - 0.2); this.rain.layers.set(NOINK); G.add(this.rain);
    // tube light above the window (HDR emissive -> bloom)
    box(1.2, 0.05, 0.07, lam({ color: "#d8d8d8" }), -0.2, 2.45, BZ + 0.05, G, false);
    this.tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.2, 3.0) }));
    this.tube.rotation.z = Math.PI / 2; this.tube.position.set(-0.2, 2.44, BZ + 0.1); this.tube.layers.set(NOINK); G.add(this.tube);
    // wall clock, calendar
    const clk = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshBasicMaterial({ map: P.clockTex() }));
    clk.position.set(-1.55, 2.15, BZ + 0.012); G.add(clk);
    this.calMat = new THREE.MeshBasicMaterial({ map: this.cal.t });
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.56), this.calMat); cm.position.set(...CAL); G.add(cm);
    box(0.44, 0.02, 0.02, woodD, CAL[0], CAL[1] + 0.28, BZ + 0.01, G);
    // bed along the left wall: frame, mattress with checked sheet, pillow
    box(0.98, 0.32, 2.05, woodD, -1.9, 0, -1.55, G);
    box(0.92, 0.17, 1.98, lam({ map: P.rep(P.sheetTex(), 2, 4) }), -1.9, 0.32, -1.55, G);
    const pil = box(0.62, 0.12, 0.36, lam({ color: "#f4f1ea" }), -1.9, 0.49, -2.3, G); pil.scale.set(1, 1, 1);
    box(0.98, 0.75, 0.06, woodD, -1.9, 0, -2.58, G);
    // steel almirah on the right
    box(0.5, 1.9, 0.9, lam({ color: "#6f86a6" }, 0.4), 2.12, 0, -1.9, G);
    box(0.02, 0.25, 0.04, iron, 1.86, 0.95, -1.82, G);
    box(0.01, 1.8, 0.01, iron, 1.865, 0.05, -1.9, G, false);
    // desk, chair, lamp
    const D0 = 0.76;
    box(1.4, 0.04, 0.62, woodM, 0.85, D0 - 0.04, -1.05, G);
    for (const [x, z] of [[0.2, -0.79], [1.5, -0.79], [0.2, -1.31], [1.5, -1.31]]) box(0.05, D0 - 0.04, 0.05, woodD, x, 0, z, G);
    box(1.3, 0.14, 0.03, woodD, 0.85, D0 - 0.18, -0.76, G); // modesty rail
    box(0.46, 0.04, 0.42, woodD, SEAT[0], 0.44, -1.78, G);
    box(0.46, 0.5, 0.04, woodD, SEAT[0], 0.48, -2.0, G);
    for (const [x, z] of [[-0.2, -1.6], [0.2, -1.6], [-0.2, -1.96], [0.2, -1.96]]) box(0.035, 0.44, 0.035, woodD, SEAT[0] + x, 0, z, G);
    const lampM = lam({ color: "#2f6fb8" });
    const lb = cyl(0.07, 0.08, 0.02, lampM, G); lb.position.set(1.4, D0 + 0.01, -1.28);
    const la = cyl(0.008, 0.008, 0.34, lampM, G); la.position.set(1.4, D0 + 0.18, -1.28); la.rotation.z = 0.25;
    const ls = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 16, 1, true), lampM); ls.position.set(1.33, D0 + 0.38, -1.25); ls.rotation.z = -0.6; ls.castShadow = true; G.add(ls);
    this.lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.4, 2.4) }));
    this.lampBulb.position.set(1.31, D0 + 0.35, -1.25); this.lampBulb.layers.set(NOINK); G.add(this.lampBulb);
    // steel tumbler + notebook for life on the desk
    const tum = cyl(0.035, 0.03, 0.11, twoTone(new THREE.MeshPhongMaterial({ color: "#a9adb5", specular: "#ffffff", shininess: 80 }), 0.3), G); tum.position.set(0.32, D0 + 0.055, -1.22);
    box(0.2, 0.015, 0.27, lam({ color: "#d9463c" }), 0.38, D0, -0.92, G).rotation.y = 0.3;
    // ceiling fan
    const fanM = lam({ color: "#e9e4d8" });
    const rod = cyl(0.015, 0.015, 0.3, fanM, G); rod.position.set(0, 2.85, -0.7);
    const hub = cyl(0.09, 0.09, 0.08, fanM, this.fan); hub.position.set(0, 0, 0);
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.11), fanM); b.position.set(Math.cos((k * 2 * Math.PI) / 3) * 0.38, 0, Math.sin((k * 2 * Math.PI) / 3) * 0.38); b.rotation.y = -(k * 2 * Math.PI) / 3; b.castShadow = true; this.fan.add(b); }
    this.fan.position.set(0, 2.68, -0.7); G.add(this.fan);
    // phone on the desk: body + unlit screen
    const ph = box(0.078, 0.009, 0.165, lam({ color: "#23252e" }, 0.3), PHONE[0], PHONE[1] - 0.012, PHONE[2], G);
    ph.rotation.y = 0.12;
    this.screenMat = new THREE.MeshBasicMaterial({ map: this.screen.t, color: new THREE.Color(1.15, 1.15, 1.15) });
    this.screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.152), this.screenMat);
    this.screenMesh.rotation.set(-Math.PI / 2, 0, 0.12); this.screenMesh.position.set(PHONE[0], PHONE[1] + 0.0005, PHONE[2]);
    this.screenMesh.layers.set(NOINK); G.add(this.screenMesh);
    // rupee notes: bundle stack, split bundles, flyers
    const noteT = P.ctex("note", 256, 112, (g) => drawNote(g, 256, 112), false);
    const sideM = lam({ color: "#d8d5c2" }), topM = lam({ map: noteT });
    const bmat = [sideM, sideM, topM, sideM, sideM, sideM];
    this.stack = new THREE.InstancedMesh(new THREE.BoxGeometry(0.155, 0.018, 0.07), bmat, 24);
    this.stack.castShadow = true; this.stack.receiveShadow = true; this.stack.count = 0; this.stack.frustumCulled = false; G.add(this.stack);
    for (let i = 0; i < 4; i++) { const b = box(0.155, i < 3 ? 0.05 : 0.016, 0.07, bmat, 0, 0, 0, G); this.bundles.push(b); }
    const noteM = new THREE.MeshLambertMaterial({ map: noteT, side: THREE.DoubleSide }); twoTone(noteM);
    for (let i = 0; i < 14; i++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.155, 0.07), noteM); n.castShadow = true; G.add(n); this.flyers.push(n); }
    // kudukka (clay money pot)
    this.pot = new THREE.Group();
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI; prof.push(new THREE.Vector2(0.002 + 0.11 * Math.sin(a) * (1 - 0.25 * (i / 20)), 0.12 - 0.11 * Math.cos(a))); }
    prof.push(new THREE.Vector2(0.035, 0.235), new THREE.Vector2(0.04, 0.25), new THREE.Vector2(0.001, 0.25));
    const potM = lam({ color: "#c8643a" });
    const pm = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), potM); pm.castShadow = true; pm.receiveShadow = true; this.pot.add(pm);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.008), new THREE.MeshBasicMaterial({ color: "#1a0c08" })); slot.position.set(0, 0.251, 0); this.pot.add(slot);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.103, 0.006, 6, 32), lam({ color: "#e9a070" })); band.rotation.x = Math.PI / 2; band.position.y = 0.15; this.pot.add(band);
    for (let i = 0; i < 3; i++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.035), noteM); n.position.set(-0.012 + i * 0.012, 0.262, 0); n.rotation.set(0, 0, (i - 1) * 0.3); this.pot.add(n); this.potNotes.push(n); }
    this.pot.position.set(...POT); G.add(this.pot);
    // sapling in a small clay planter
    const pl = cyl(0.06, 0.045, 0.09, potM, this.plant); pl.position.y = 0.045;
    const soil = cyl(0.055, 0.055, 0.01, lam({ color: "#4a3020" }), this.plant); soil.position.y = 0.088;
    this.stem = cyl(0.009, 0.011, 1, lam({ color: "#4f8f3a" }), this.plant, 6);
    const leafM = lam({ color: "#5fb84a", side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6), leafM); l.scale.set(1, 0.25, 0.55); l.castShadow = true; this.plant.add(l); this.leaves.push(l); }
    this.plant.position.set(POT[0] - 0.27, POT[1], POT[2] + 0.1); G.add(this.plant);
    // dice
    const dmat = [1, 6, 2, 5, 3, 4].map((n) => new THREE.MeshLambertMaterial({ map: P.pipsTex(n) })).map((m) => twoTone(m));
    for (let i = 0; i < 2; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), dmat); d.castShadow = true; G.add(d); this.dice.push(d); }

    // ================= STREET =================
    this.buildStreet();
  }

  private buildStreet() {
    const S = this.street;
    const grass = lam({ map: P.rep(P.grassTex(), 60, 60) });
    const g = plane(400, 400, grass, S); g.rotation.x = -Math.PI / 2; g.position.set(ST, -0.01, 0);
    const road = plane(140, 7, lam({ map: P.rep(P.asphaltTex(), 10, 0.5) }), S); road.rotation.x = -Math.PI / 2; road.position.set(ST, 0.005, 0);
    box(140, 0.15, 2.1, lam({ map: P.rep(P.paverTex(), 70, 1) }), ST, 0, -4.55, S, false);
    const kerb = plane(140, 0.15, lam({ map: P.rep(P.kerbTex(), 140, 1) }), S); kerb.position.set(ST, 0.075, -3.499);
    box(140, 0.1, 1.2, lam({ color: "#b9a27e" }), ST, 0, 4.1, S, false); // south verge
    // shop-houses facing the road (+z), front at z = -5.6
    let x = ST - 50, k = 0;
    const special: Record<number, "travel" | "phone"> = {};
    while (x < ST + 50) {
      let w = 4.5 + hh(k, 1) * 3.5;
      let kind: "shutter" | "open" | "travel" | "phone" | "house" = (["open", "shutter", "open", "house", "open"] as const)[k % 5];
      if (x <= ST + 3.4 && x + w > ST + 3.4) { w = ST + 6.0 - x; kind = "travel"; }
      else if (x >= ST + 5.9 && x < ST + 6.1) { w = 4.2; kind = "phone"; }
      special[k] = kind as "travel";
      const two = hh(k, 2) > 0.35 || kind === "travel", h = two ? 6.6 : 3.6;
      const fac = P.facadeTex(`${k}`, w, h, kind, two);
      const body = lam({ color: "#d9c7a5" });
      const front = lam({ map: fac });
      const mats = [body, body, body, body, front, body];
      box(w - 0.05, h, 6, mats, x + w / 2, 0.15, -8.6, S);
      if (hh(k, 3) > 0.4) { // sloped tile roof
        const rg = new THREE.CylinderGeometry(0.01, 3.9, 1.8, 4, 1); rg.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(rg, lam({ map: P.rep(P.tileRoofTex(), 3, 2) }));
        roof.scale.set((w + 0.6) / 5.5, 1, 7 / 5.5); roof.position.set(x + w / 2, h + 0.15 + 0.9, -8.6); roof.castShadow = true; S.add(roof);
      } else box(w - 0.05, 0.6, 0.15, lam({ color: "#efe6d0" }), x + w / 2, h + 0.15, -5.65, S);
      // chajja sunshade over the shop
      box(w - 0.1, 0.08, 0.7, lam({ color: "#e8dcc4" }), x + w / 2, 3.2, -5.3, S);
      x += w; k++;
    }
    // coconut palms: behind the row, on the south side and a few near the road
    const trunkM = lam({ map: P.trunkTex() }), frondM = lam({ map: P.frondTex(), alphaTest: 0.5, side: THREE.DoubleSide });
    const palm = (px: number, pz: number, h: number, lean: number, seed: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(V(px + lean * u * u * h * 0.25, u * h, pz + 0.3 * Math.sin(seed) * u * u)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tg = new THREE.TubeGeometry(curve, 16, 0.16, 8, false);
      const t = new THREE.Mesh(tg, trunkM); t.castShadow = true; S.add(t);
      const top = pts[8];
      for (let f = 0; f < 9; f++) {
        const a = (f / 9) * Math.PI * 2 + seed, fl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), frondM);
        fl.geometry.translate(1.6, 0, 0);
        const pos = fl.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) { const xx = pos.getX(i); pos.setY(i, pos.getY(i) * 0.25 - 0.18 * xx * xx * 0.35); pos.setZ(i, pos.getY(i) * 3.2); }
        fl.geometry.computeVertexNormals();
        fl.position.copy(top); fl.rotation.set(0, a, 0.25 + 0.2 * hh(seed, f)); fl.castShadow = true; S.add(fl);
      }
    };
    for (let i = 0; i < 18; i++) palm(ST - 48 + i * 5.6 + hh(i, 4) * 2, -14 - hh(i, 5) * 8, 10 + hh(i, 6) * 5, hh(i, 7) - 0.5, i);
    for (let i = 0; i < 14; i++) palm(ST - 40 + i * 6.5 + hh(i, 8) * 3, 7 + hh(i, 9) * 10, 8 + hh(i, 10) * 5, hh(i, 11) - 0.5, i + 40);
    // electric poles + sagging wires on the footpath edge
    const poleM = lam({ color: "#b6b2a8" });
    const poles: number[] = [];
    for (let px = ST - 44; px <= ST + 44; px += 22) {
      poles.push(px);
      const p = box(0.22, 8.5, 0.22, poleM, px, 0.15, -3.75, S);
      box(1.6, 0.12, 0.12, poleM, px, 7.6, -3.75, S);
      p.castShadow = true;
    }
    const wireM = new THREE.MeshBasicMaterial({ color: "#2a2730" });
    for (let i = 0; i < poles.length - 1; i++) for (const dz of [-0.65, 0, 0.65]) {
      const a = poles[i], b = poles[i + 1], pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 12; j++) { const u = j / 12; pts.push(V(a + (b - a) * u, 7.8 - 0.9 * 4 * u * (1 - u), -3.75 + dz)); }
      S.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4, false), wireM));
    }
    // bus stop shelter at ST + 14
    const bsM = lam({ color: "#2f7fd0" });
    for (const dx of [-1.4, 1.4]) box(0.08, 2.4, 0.08, bsM, ST + 14 + dx, 0.15, -5.25, S);
    box(3.2, 0.08, 1.3, bsM, ST + 14, 2.55, -5.15, S);
    box(2.4, 0.06, 0.4, lam({ color: "#d9d4c8" }), ST + 14, 0.6, -5.4, S);
    // a parked auto-rickshaw-ish cart and bikes give life: simple scooters
    const sc = (sx: number, col: string) => { box(1.3, 0.35, 0.3, lam({ color: col }), sx, 0.35, -3.0, S); for (const d of [-0.5, 0.5]) { const w = cyl(0.22, 0.22, 0.1, lam({ color: "#26242a" }), S); w.rotation.x = Math.PI / 2; w.position.set(sx + d, 0.22, -3.0); } };
    sc(ST - 3, "#e0473c"); sc(ST + 9.5, "#f2f0ea"); sc(ST + 22, "#2a9a62");
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** camera-relative sun, frozen per shot */
  private shotSun(s: Shot, L: LightPreset) {
    let d = this.sunCache.get(s.id);
    if (!d) {
      const c = s.cam(s.a / FPS), fw = V(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize(), rt = V(-fw.z, 0, fw.x);
      const ov = s.light === "golden" ? (s.set === "room" ? { az: 125, el: 30 } : { az: 140, el: 18 }) : s.light === "day" && s.set === "room" ? { az: 110, el: 45 } : L;
      const az = (ov.az * Math.PI) / 180, el = (ov.el * Math.PI) / 180;
      d = fw.clone().multiplyScalar(Math.cos(az)).addScaledVector(rt, Math.sin(az)).multiplyScalar(Math.cos(el)).add(V(0, Math.sin(el), 0)).normalize();
      this.sunCache.set(s.id, d);
    }
    return d;
  }

  update(s: Shot, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, L = LIGHTS[s.light], c = s.cam(t), room = s.set === "room";
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    this.room.visible = room; this.street.visible = !room; this.sky.visible = !room;
    // light rig
    const sunDir = this.shotSun(s, L), focus = V(...c.look);
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = room ? 3.2 : THREE.MathUtils.clamp(cam.position.distanceTo(focus) * 1.2 + 8, 12, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, room ? 8 : 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 0.5; sc.far = room ? 20 : 300; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    L.sky.forEach((h, i) => untone(h, su["c" + i].value));
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = room ? null : this.fog; scene.background = null;
    // ---- room dressing ----
    if (room) {
      (this.outside.material as THREE.MeshBasicMaterial).map = P.outsideTex(s.light);
      this.rain.visible = !!s.rain; (this.rain.material as THREE.MeshBasicMaterial).map!.offset.set(t * 0.3, t * 2.2);
      const on = s.light === "night";
      (this.tube.material as THREE.MeshBasicMaterial).color.setScalar(on ? 3.2 : s.light === "dark" ? 0.12 : 0.9);
      (this.lampBulb.material as THREE.MeshBasicMaterial).color.set(on ? new THREE.Color(4, 3.4, 2.4) : new THREE.Color(0.5, 0.45, 0.4));
      this.fan.rotation.y = s.light === "dark" ? 0.3 : t * 9;
      this.poseDesk(s, t);
    }
    // ---- cast + fx ----
    const right = V().setFromMatrixColumn(cam.matrixWorld, 0);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const sx = sunDir.dot(right), sy = -sunDir.y;
    let ai = 0; const used: Actor[] = [];
    const specs: ActorSpec[] = s.cast ? s.cast(t) : [];
    const lid = lidAt(f);
    const fxl: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; soft?: boolean; flat?: boolean; blob?: boolean }[] = [];
    for (const a of specs) {
      const outfit = s.set === "street" || s.light === "golden" ? OFFICE : HOME;
      const d = cam.position.distanceTo(V(a.x, a.y + 1.2, a.z));
      const [w, h, k] = tier(d);
      const mirror = !!a.side && (a.dir ?? 1) * right.x < 0;
      const light = Math.round(Math.atan2(sy, sx * (mirror ? -1 : 1)) / (Math.PI / 4)) * (Math.PI / 4);
      let key: string, draw: (p: Pen) => void;
      if (a.side) {
        const so: SideOpts = { mode: "march", phase: q(((a.phase ?? 0) % 1 + 1) % 1, 30), expr: a.expr, blink: lid, stride: 0.75, stomp: 0.7, light, seed: SEED };
        key = `S|${outfit.jacket}|${JSON.stringify(so)}`; draw = (p) => bodySide(p, outfit, so);
      } else {
        const fo: FrontOpts = { mode: a.mode === "sit" ? "sit" : "stand", seat: a.seat, expr: a.expr, blink: lid, prop: a.prop ?? null, tilt: a.tilt ?? 0,
          headTilt: q(a.headTilt ?? 0, 2), look: a.look ?? 0, light, seed: SEED, facing: 0 };
        key = `F|${outfit.jacket}|${JSON.stringify(fo)}`; draw = (p) => bodyFront(p, outfit, fo);
      }
      const ac = this.actor(ai++);
      ac.r = this.pool.req(key, w, h, k, draw);
      ac.mesh.visible = true; ac.mesh.position.set(a.x, a.y, a.z);
      ac.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z), 0);
      ac.mesh.scale.set(mirror ? -1 : 1, 1, 1); ac.mesh.castShadow = s.light === "golden" && !room;
      used.push(ac);
      if (a.mode !== "sit") {
        const cc = "#" + L.blob.map((v) => Math.round(255 * Math.pow(v, 1 / 2.2)).toString(16).padStart(2, "0")).join("");
        fxl.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: a.x, y: a.y + 0.012, z: a.z, w: 0.6, h: 0.42, flat: true, blob: true });
      }
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (const e of s.fx ? s.fx(t) : []) {
      const D = FXD[e.kind];
      if (e.u <= 0 || (!D.keep && e.u >= 1)) continue;
      const pop = D.keep ? Math.min(1, smooth(e.u * 1.6) * 1.08) : 1;
      const uu = q(e.u, 30);
      fxl.push({ key: `fx|${e.kind}|${D.keep && e.kind !== "sweat" && e.kind !== "buzz" ? 0 : uu}`, cw: D.cw, ch: D.ch, draw: (p) => D.draw(p, uu, e.i ?? 0),
        x: e.x, y: e.y, z: e.z, w: e.s * pop, h: (e.s * D.ch / D.cw) * pop, soft: D.soft });
    }
    let fi = 0; const fused: Fx[] = [];
    for (const p of fxl) {
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, 0); else e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(p.w, p.h, 1); fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }

  private poseDesk(s: Shot, t: number) {
    // screen + calendar textures (redrawn when their state changes)
    const scr = s.screen ? s.screen(t) : s.light === "dark" ? { k: "off" as const } : { k: "buzz" as const, t };
    const sk = JSON.stringify(scr, (_k, v) => (typeof v === "number" ? Math.round(v * 300) / 300 : v));
    if (sk !== this.screen.key) { drawPhone(this.screen.g, 540, 1170, scr); this.screen.t.needsUpdate = true; this.screen.key = sk; }
    this.screenMat.color.setScalar(scr.k === "off" ? 1 : 1.15);
    const cl = s.cal ? s.cal(t) : { k: "day" as const, day: 1, tear: 0, red: false };
    const ck = JSON.stringify(cl);
    if (ck !== this.cal.key) { drawCalendar(this.cal.g, 400, 560, cl); this.cal.t.needsUpdate = true; this.cal.key = ck; }
    const d = s.desk ? s.desk(t) : { notes: 0, pot: 0.5 };
    const holdsPot = (s.cast ? s.cast(t) : []).some((a) => a.prop === "pot");
    this.pot.visible = !holdsPot;
    this.potNotes.forEach((n, i) => (n.visible = d.pot > 0.3 + i * 0.2));
    // bundle stack: 2 columns, up to 12 high
    const m = new THREE.Matrix4(), qq = new THREE.Quaternion();
    this.stack.count = Math.min(24, d.notes);
    for (let i = 0; i < this.stack.count; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      qq.setFromEuler(new THREE.Euler(0, (hh(i, 3) - 0.5) * 0.25, 0));
      m.compose(V(NOTES[0] + (col - 0.5) * 0.17, NOTES[1] + 0.009 + row * 0.019, NOTES[2] + (hh(i, 4) - 0.5) * 0.012), qq, V(1, 1, 1));
      this.stack.setMatrixAt(i, m);
    }
    this.stack.instanceMatrix.needsUpdate = true;
    // salary split: 3 bundles leave (rent, food, home), the small one hops into the pot
    const sp = d.split;
    this.bundles.forEach((b, i) => {
      b.visible = !!sp;
      if (!sp) return;
      const u = smooth(sp[i]);
      const home: V3 = [NOTES[0] - 0.12 + i * 0.08, NOTES[1], NOTES[2] + (i === 3 ? 0.08 : 0)];
      const away: V3[] = [[NOTES[0] - 0.9, NOTES[1] + 0.25, NOTES[2] + 0.2], [NOTES[0] + 0.2, NOTES[1] + 0.35, NOTES[2] - 1.2], [NOTES[0] - 0.4, NOTES[1] + 1.2, NOTES[2] - 1.0], [POT[0], POT[1] + 0.25, POT[2]]];
      const to = away[i];
      const arc = i === 3 ? 0.22 * Math.sin(u * Math.PI) : 0.1 * Math.sin(u * Math.PI);
      b.position.set(home[0] + (to[0] - home[0]) * u, home[1] + (to[1] - home[1]) * u + arc, home[2] + (to[2] - home[2]) * u);
      b.rotation.set(0, i * 0.2 + u * (i === 3 ? 3.1 : 1.2), 0);
      const vis = i === 3 ? (u < 0.97 ? 1 : 0) : 1;
      b.scale.setScalar(vis ? (i === 3 ? 1 - 0.5 * Math.max(0, u - 0.7) / 0.3 : 1) : 0.001);
    });
    // flyers
    this.flyers.forEach((n, i) => {
      const fl = d.fly; n.visible = false;
      if (!fl || i >= fl.n || fl.u <= 0) return;
      const st = (i / fl.n) * 0.45, u = clamp01((fl.u - st) / 0.55);
      if (u <= 0 || u >= 1) return;
      n.visible = true;
      const from = fl.from ?? [NOTES[0], NOTES[1] + 0.05, NOTES[2]];
      const j: V3 = [(hh(i, 1) - 0.5) * 0.5, (hh(i, 2) - 0.2) * 0.5, (hh(i, 3) - 0.5) * 0.4];
      const e = u * u * (3 - 2 * u);
      n.position.set(from[0] + (fl.to[0] - from[0] + j[0]) * e, from[1] + (fl.to[1] - from[1] + j[1]) * e + 0.25 * Math.sin(u * Math.PI), from[2] + (fl.to[2] - from[2] + j[2]) * e);
      n.rotation.set(u * 9 + i, u * 6 + i * 2, u * 4);
      const sh = fl.to[1] < from[1] + 0.05 ? 1 - 0.8 * e : 1; // into the phone: shrink
      n.scale.setScalar(sh);
    });
    // sapling
    this.plant.visible = d.plant !== undefined;
    if (d.plant !== undefined) {
      const g = Math.max(0.02, d.plant), hgt = 0.02 + 0.12 * g;
      this.stem.scale.set(1, hgt, 1); this.stem.position.y = 0.09 + hgt / 2;
      this.leaves.forEach((l, i) => {
        const y = 0.09 + hgt * (0.45 + 0.18 * i), side = i % 2 ? 1 : -1, ls = clamp01(g * 4 - i * 0.6);
        l.position.set(side * 0.03 * ls, y, 0); l.rotation.set(0, i * 1.3, side * 0.5); l.scale.set(ls, 0.25 * ls + 0.001, 0.55 * ls);
      });
    }
    // dice tumble out of the phone
    this.dice.forEach((dm, i) => {
      dm.visible = d.dice !== undefined && d.dice > 0;
      if (!dm.visible) return;
      const u = d.dice!, e = 1 - (1 - u) ** 2, bounce = Math.abs(Math.sin(u * Math.PI * 2.5)) * (1 - u) * 0.03;
      dm.position.set(PHONE[0] + (i ? 0.075 : -0.07) * e + 0.005, PHONE[1] + 0.018 + bounce, PHONE[2] + 0.02 - 0.03 * e);
      dm.scale.setScalar(0.75);
      dm.rotation.set((1 - e) * 9 + i, (1 - e) * 7, (1 - e) * 5 + i * 0.6);
    });
  }
}
