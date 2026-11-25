// "The ₹2 Lakh Wait": shot plan. Every shot is a pure function of time: camera, depth of field, who is on stage,
// what the desk props / phone / calendar show and which effects play. All times are seconds on the voice track
// (voice/words.json, Malayalam narration); reactions land 0-3 frames before their word.
import type { Screen, Cal } from "./screens";
import type { LightName } from "./lights";
import type { Expr } from "./toon";

export const FPS = 30;
export const TOTAL_S = 102.6;
export const TOTAL = Math.round(TOTAL_S * FPS);
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const ease = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
const L = 2 / FPS; // reactions lead their word by 2 frames
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lv = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// ---------------- places ----------------
/** room (origin) and street (x offset). Desk items in room coordinates. */
export const ST = 200; // street origin x
export const DESK = { x: 0.85, top: 0.76, z: -1.05 };
export const PHONE: V3 = [0.55, 0.772, -0.98];
export const POT: V3 = [1.22, 0.76, -1.12];
export const NOTES: V3 = [0.86, 0.76, -0.94];
export const CAL: V3 = [1.55, 1.68, -2.585];
export const SEAT: V3 = [0.78, 0, -1.62];
export const BED: V3 = [-1.38, 0, -1.35];
export const WALK_Z = -4.4; // street footpath line
export const FOOT_Y = 0.15;

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Actor = {
  x: number; y: number; z: number; expr: Expr; side?: boolean; dir?: number; // side walkers: dir +1 = +x
  mode?: "stand" | "sit" | "stroll" | "march"; phase?: number; seat?: number;
  prop?: null | "pot" | ["phone", number, string]; tilt?: number; headTilt?: number; look?: number; wave?: number;
};
export type FxSpec = { kind: "q" | "sweat" | "buzz" | "burst" | "stars" | "buy" | "think" | "puff" | "dice" | "rain" | "ping" | "shock"; x: number; y: number; z: number; s: number; u: number; i?: number };
export type Desk = {
  notes: number;            // bundles on the desk stack (each 10k-ish)
  pot: number;              // 0 empty .. 1 full: notes visible at the pot mouth
  fly?: { n: number; u: number; to: V3; from?: V3 };   // notes flying off
  split?: number[];         // salary split: progress of 3 bundles leaving + 1 into the pot
  plant?: number;           // sapling growth 0..1
  dice?: number;            // dice tumble 0..1
};
export type Shot = {
  id: number; a: number; b: number; set: "room" | "street"; light: LightName; name: string;
  cam: (t: number) => Cam;
  dof: { c: number; focus?: V3 };
  cast?: (t: number) => Actor[];
  desk?: (t: number) => Desk;
  screen?: (t: number) => Screen;
  cal?: (t: number) => Cal;
  fx?: (t: number) => FxSpec[];
  fade?: (t: number) => number; // 0..1 black over the frame
  rain?: boolean; fan?: boolean;
};

const cam = (p0: V3, l0: V3, p1: V3, l1: V3, fov: number, roll = 0, glide = false) => (a: number, b: number) => (t: number): Cam => {
  const u = (t - a) / (b - a), e = glide ? smooth(u) : u;
  return { pos: lv(p0, p1, e), look: lv(l0, l1, e), fov, roll: (roll * Math.PI) / 180 };
};
const kick = (t: number, at: number[], amp = 0.012): V3 => {
  for (const k of at) { const d = Math.round((t - k) * FPS); if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * amp * (1 - d / 7); return [s, -s * 0.6, 0]; } }
  return [0, 0, 0];
};
const withKick = (c: (t: number) => Cam, at: number[], amp?: number) => (t: number): Cam => {
  const r = c(t), k = kick(t, at, amp); return { ...r, pos: [r.pos[0] + k[0], r.pos[1] + k[1], r.pos[2]], look: [r.look[0] + k[0], r.look[1] + k[1], r.look[2]] };
};

// common room cameras
const PHONE_LOOK: V3 = [PHONE[0], PHONE[1], PHONE[2] - 0.005];
const phoneCam = (push = 0.04, roll = 3) => cam([PHONE[0] + 0.025, PHONE[1] + 0.4, PHONE[2] + 0.17], PHONE_LOOK,
  [PHONE[0] + 0.02, PHONE[1] + 0.4 - push, PHONE[2] + 0.17 - push * 0.4], PHONE_LOOK, 34, roll * 0.6);
const deskMS = (roll = 0) => cam([SEAT[0] + 0.05, 1.22, 0.55], [SEAT[0], 1.08, -1.6], [SEAT[0] + 0.03, 1.2, 0.3], [SEAT[0], 1.08, -1.6], 36, roll);
const potCU = () => cam([POT[0] - 0.3, 1.1, POT[2] + 0.85], [POT[0] - 0.05, 0.88, POT[2]], [POT[0] - 0.26, 1.07, POT[2] + 0.72], [POT[0] - 0.05, 0.88, POT[2]], 30, -3);
const calCU = (roll = 3) => cam([CAL[0] - 0.08, CAL[1] - 0.02, CAL[2] + 0.95], CAL, [CAL[0] - 0.06, CAL[1] - 0.02, CAL[2] + 0.82], CAL, 40, roll);
const notesCU = () => cam([NOTES[0] - 0.05, 1.18, NOTES[2] + 0.5], [NOTES[0], 0.8, NOTES[2] - 0.05], [NOTES[0] - 0.04, 1.14, NOTES[2] + 0.42], [NOTES[0], 0.8, NOTES[2] - 0.05], 36, 2);

// common blocking
const AKHIL_FACE = (y = 1.42): V3 => [SEAT[0], y, SEAT[2]];
const seated = (expr: Expr, extra: Partial<Actor> = {}): Actor => ({ x: SEAT[0], y: 0, z: SEAT[2], expr, mode: "sit", seat: 0.95, ...extra });
const onBed = (expr: Expr, extra: Partial<Actor> = {}): Actor => ({ x: BED[0], y: 0, z: BED[2], expr, mode: "sit", seat: 1.05, ...extra });
const GLOW = "#9fd0ff", GLOW_G = "#8ff0b4", GLOW_R = "#ff8a8a";
const walker = (t: number, t0: number, x0: number, speed: number, expr: Expr, dir = 1): Actor => {
  const d = (t - t0) * speed;
  return { x: ST + x0 + dir * d, y: FOOT_Y, z: WALK_Z, expr, side: true, dir, mode: "march", phase: (d / 0.8) * 0.5 };
};
const streetTrack = (x0: number, speed: number, t0: number, dist = 4.6, h = 1.6, fov = 44, ahead = 0.15, dir = 1) => (t: number): Cam => {
  const x = ST + x0 + dir * (t - t0) * speed;
  return { pos: [x + dir * ahead + 0.3, h, WALK_Z + dist], look: [x + dir * ahead, 1.2, WALK_Z - 0.6], fov, roll: 0 };
};
const fill = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// ---------------- the shots ----------------
type Def = Omit<Shot, "id" | "a" | "b" | "cam"> & { s0: number; s1: number; cam: ((a: number, b: number) => (t: number) => Cam) | ((t: number) => Cam); abs?: boolean };
const DEFS: Def[] = [
  // ===== HOOK: three years to save 2 lakh; the market took it in eleven days =====
  { name: "H1 proud saver", s0: 0, s1: 4.3, set: "room", light: "night", dof: { c: 11, focus: AKHIL_FACE(1.5) },
    cam: cam([SEAT[0] + 0.15, 1.42, 1.0], [SEAT[0], 1.25, -1.6], [SEAT[0] + 0.08, 1.4, 0.55], [SEAT[0], 1.28, -1.6], 38, -2),
    cast: (t) => [{ x: SEAT[0], y: 0, z: SEAT[2] - 0.05, expr: t < 1.6 - L ? "smile" : "grin", mode: "stand", prop: "pot" }],
    desk: (t) => ({ notes: Math.round(20 * ease(t, 1.95, 3.1)), pot: 1 }), fan: true },
  { name: "H2 crash", s0: 4.3, s1: 6.25, set: "room", light: "night", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.05, 4),
    screen: (t) => ({ k: "chart", t, mode: "crash", u: 0.35 + 0.65 * fill(t, 4.3, 6.1), bal: 200000 * (1 - ease(t, 4.5, 6.2)) }),
    desk: () => ({ notes: 0, pot: 0 }) },
  { name: "H3 eleven days", s0: 6.25, s1: 7.55, set: "room", light: "night", dof: { c: 8, focus: CAL }, cam: calCU(4),
    cal: (t) => { const n = Math.min(11, 1 + Math.floor((t - 6.25) * 30 / 1.6)); return { k: "day", day: n, tear: 0, red: n === 11 }; } },
  { name: "H4 shock", s0: 7.55, s1: 8.6, set: "room", light: "night", dof: { c: 13, focus: AKHIL_FACE(1.5) },
    cam: (a, b) => withKick(cam([SEAT[0] + 0.05, 1.45, 0.25], [SEAT[0], 1.38, -1.6], [SEAT[0] + 0.04, 1.45, 0.05], [SEAT[0], 1.38, -1.6], 34, 4)(a, b), [7.58], 0.015),
    cast: () => [{ x: SEAT[0], y: 0, z: SEAT[2] - 0.05, expr: "shock", mode: "stand", prop: "pot" }],
    fx: (t) => [{ kind: "shock", x: SEAT[0] + 0.32, y: 1.75, z: SEAT[2] + 0.1, s: 0.35, u: fill(t, 7.55, 8.1) }],
    desk: (t) => ({ notes: 0, pot: 0, fly: { n: 10, u: fill(t, 7.5, 8.6), from: [SEAT[0], 1.0, SEAT[2] + 0.2], to: [-0.4, 2.3, -3.2] } }) },
  // ===== 1: salary, expenses, the 5,500 =====
  { name: "S1a walk to work", s0: 8.6, s1: 10.9, set: "street", light: "day", dof: { c: 0 }, cam: () => streetTrack(-6, 1.25, 8.6),
    cast: (t) => [walker(t, 8.6, -6, 1.25, "smile")] },
  { name: "S1b salary split", s0: 10.9, s1: 14.0, set: "room", light: "day", dof: { c: 9, focus: NOTES }, cam: notesCU(),
    desk: (t) => ({ notes: 0, pot: 0.15, split: [ease(t, 11.06 - L, 11.5), ease(t, 11.54 - L, 12.0), ease(t, 12.05 - L, 12.6), 0] }) },
  { name: "S1c into the pot", s0: 14.0, s1: 17.7, set: "room", light: "day", dof: { c: 10, focus: POT }, cam: potCU(),
    desk: (t) => ({ notes: 0, pot: 0.2, split: [1, 1, 1, ease(t, 16.0, 16.52)] }),
    fx: (t) => [{ kind: "stars", x: POT[0], y: POT[1] + 0.3, z: POT[2], s: 0.22, u: fill(t, 16.5, 17.2) }] },
  { name: "S1d no trips no phone", s0: 17.7, s1: 19.4, set: "street", light: "day", dof: { c: 7, focus: [ST + 4.9, 1.5, WALK_Z] },
    cam: cam([ST + 4.3, 1.6, WALK_Z + 3.6], [ST + 4.6, 1.25, WALK_Z - 1.0], [ST + 4.8, 1.55, WALK_Z + 3.1], [ST + 5.0, 1.25, WALK_Z - 1.0], 42, 0, true),
    cast: (t) => [{ x: ST + 4.9, y: FOOT_Y, z: WALK_Z, expr: t < 18.68 - L ? "smile" : "smile_closed", mode: "stand", headTilt: t > 18.68 - L ? 6 * Math.sin((t - 18.68) * 14) : 0, look: t < 18.68 - L ? -1 : 1 }] },
  { name: "S1e three years", s0: 19.4, s1: 21.3, set: "room", light: "day", dof: { c: 8, focus: CAL }, cam: calCU(-3),
    cal: (t) => ({ k: "year", year: 2023 + Math.min(3, Math.floor(Math.max(0, t - 19.45) * 30 / 6)), tear: 0 }) },
  // ===== 2: one night, a friend's message =====
  { name: "S2a night in bed", s0: 21.3, s1: 24.0, set: "room", light: "night", dof: { c: 6, focus: [BED[0], 1.35, BED[2]] },
    cam: cam([BED[0] + 1.5, 1.45, BED[2] + 2.6], [BED[0] + 0.1, 1.1, BED[2]], [BED[0] + 1.2, 1.38, BED[2] + 2.0], [BED[0] + 0.05, 1.12, BED[2]], 40, 2),
    cast: (t) => [onBed(t < 23.51 - L ? "neutral" : "smile", { prop: ["phone", t < 23.51 - L ? 0.2 : 0.75, GLOW], look: t < 23.51 - L ? 0 : 1 })],
    fx: (t) => t > 23.45 ? [{ kind: "buzz", x: BED[0] + 0.25, y: 1.32, z: BED[2] + 0.2, s: 0.25, u: (t * 4) % 1 }] : [], fan: true },
  { name: "S2b message", s0: 24.0, s1: 29.0, set: "room", light: "night", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.06, -3),
    screen: (t) => ({ k: "chat", t, shown: t < 24.05 - L ? 0.2 : t < 25.33 - L ? 1 + 0.25 * fill(t, 24.05, 24.3) * 0 : t < 27.31 - L ? 2 : 3 }) },
  // ===== 3: first trade =====
  { name: "S3a strike price?", s0: 29.0, s1: 32.6, set: "room", light: "night", dof: { c: 11, focus: AKHIL_FACE() }, cam: deskMS(-2),
    cast: () => [seated("nervous", { prop: ["phone", 0.45, GLOW] })],
    fx: (t) => [0, 1, 2].map((i) => ({ kind: "q" as const, x: SEAT[0] - 0.25 + i * 0.25, y: 1.85 + 0.05 * Math.sin(t * 3 + i), z: SEAT[2] + 0.05, s: 0.16, u: fill(t, 29.18 + i * 0.35, 29.6 + i * 0.35), i })), fan: true },
  { name: "S3b BUY", s0: 32.6, s1: 35.3, set: "room", light: "night", dof: { c: 12, focus: PHONE }, cam: (a, b) => withKick(phoneCam(0.07, 2)(a, b), [33.9 - L]),
    screen: (t) => ({ k: "chain", t, press: t < 33.9 - L ? 0 : (t - 33.9 + L) * 2.2 }) },
  { name: "S3c +30,000", s0: 35.3, s1: 38.1, set: "room", light: "day", dof: { c: 11, focus: AKHIL_FACE() }, cam: (a, b) => withKick(deskMS(3)(a, b), [36.08 - L]),
    cast: (t) => [seated(t < 36.08 - L ? "smile" : t < 37.03 - L ? "grin" : "laugh", { prop: ["phone", t < 36.08 - L ? 0.45 : 0.95, GLOW_G], tilt: t > 37.03 - L ? -4 : 0 })],
    fx: (t) => [{ kind: "burst", x: SEAT[0] + 0.2, y: 1.6, z: SEAT[2] - 0.1, s: 1.2, u: fill(t, 36.06, 36.6) }] },
  { name: "S3d one day = one month", s0: 38.1, s1: 42.0, set: "room", light: "day", dof: { c: 8, focus: CAL }, cam: calCU(-3),
    cal: (t) => ({ k: "month", circle: t > 38.22 - L ? 1 : 0, fill: ease(t, 39.93 - L, 40.9) }) },
  // ===== 4: again, and the daydream =====
  { name: "S4a +18,000", s0: 42.0, s1: 45.7, set: "room", light: "day", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.05, -3),
    screen: (t) => ({ k: "chart", t, mode: "rise", u: 0.3 + 0.7 * fill(t, 42.0, 45.0), bal: 248000 + 18000 * ease(t, 44.0 - L, 44.6), pnl: 18000 * ease(t, 44.0 - L, 44.6) }) },
  { name: "S4b daydream", s0: 45.7, s1: 49.4, set: "room", light: "day", dof: { c: 10, focus: AKHIL_FACE() }, cam: deskMS(2),
    cast: (t) => [seated(t < 47.45 - L ? "smile" : "relief", { prop: ["phone", 0.4, GLOW_G], headTilt: -6, look: 1 })],
    fx: (t) => [{ kind: "think", x: SEAT[0] - 0.42, y: 1.95, z: SEAT[2] + 0.05, s: 0.55, u: fill(t, 47.45 - L, 47.8) }] },
  { name: "S4c why go to work", s0: 49.4, s1: 52.3, set: "street", light: "day", dof: { c: 7, focus: [ST + 14, 1.5, WALK_Z] },
    cam: cam([ST + 12.2, 1.6, WALK_Z + 3.6], [ST + 13.6, 1.5, WALK_Z - 1], [ST + 12.8, 1.6, WALK_Z + 3.2], [ST + 13.4, 1.5, WALK_Z - 1], 38),
    cast: (t) => t < 50.22 - L ? [{ x: ST + 14, y: FOOT_Y, z: WALK_Z, expr: "smile" as Expr, mode: "stand" }]
      : [walker(t, 50.22 - L, 14, 1.3, "smile_closed", -1)] },
  // ===== 5: the market turns =====
  { name: "S5a turn", s0: 52.3, s1: 54.3, set: "room", light: "night", dof: { c: 12, focus: PHONE }, cam: (a, b) => withKick(phoneCam(0.05, 4)(a, b), [53.23 - L]),
    screen: (t) => ({ k: "chart", t, mode: "turn", u: 0.5 + 0.5 * fill(t, 52.4, 54.0), bal: 266000 - 90000 * ease(t, 53.2, 54.3), pnl: -90000 * ease(t, 53.2, 54.3) }) },
  { name: "S5b buying more", s0: 54.3, s1: 58.6, set: "room", light: "night", dof: { c: 11, focus: AKHIL_FACE() }, cam: (a, b) => withKick(deskMS(-4)(a, b), [55.48 - L, 57.45 - L], 0.008),
    cast: (t) => [seated(t < 56.99 - L ? "nervous" : "pained", { prop: ["phone", 0.5 + 0.12 * Math.sin(t * 25) * (t > 55.4 ? 1 : 0), GLOW_R], tilt: 3 })],
    fx: (t) => ([55.48, 55.87, 56.99, 57.45].map((w, i): FxSpec => ({ kind: "buy", x: SEAT[0] + (i % 2 ? 0.42 : -0.38), y: 1.6 + i * 0.1, z: SEAT[2] + 0.1, s: 0.26, u: fill(t, w - L, w + 0.6), i })) as FxSpec[])
      .concat([{ kind: "sweat", x: SEAT[0] + 0.2, y: 1.66, z: SEAT[2] + 0.08, s: 0.12, u: (t * 1.3) % 1 }]), fan: true },
  { name: "S5c eleven days", s0: 58.6, s1: 61.0, set: "room", light: "night", dof: { c: 8, focus: CAL }, cam: calCU(5),
    cal: (t) => { const n = Math.min(11, 1 + Math.floor((t - 58.6) * 30 / 1.4)); return { k: "day", day: n, tear: 0, red: n === 11 }; } },
  { name: "S5d savings gone", s0: 61.0, s1: 62.7, set: "room", light: "night", dof: { c: 10, focus: POT }, cam: (a, b) => withKick(potCU()(a, b), [61.73 - L]),
    desk: (t) => ({ notes: 0, pot: t < 61.73 - L ? 1 : 0, fly: { n: 12, u: fill(t, 61.73 - L, 62.7), from: [POT[0], POT[1] + 0.25, POT[2]], to: [POT[0] - 1.4, 2.4, POT[2] - 1.6] } }),
    fx: (t) => [{ kind: "puff", x: POT[0], y: POT[1] + 0.28, z: POT[2] + 0.02, s: 0.4, u: fill(t, 61.7, 62.3) }] },
  { name: "S5e zero", s0: 62.7, s1: 65.3, set: "room", light: "night", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.04, -2),
    screen: (t) => ({ k: "zero", t, u: fill(t, 62.83 - L, 63.6) }) },
  // ===== 6: saving again, losing again =====
  { name: "S6a back to work", s0: 65.3, s1: 67.2, set: "street", light: "day", dof: { c: 0 }, cam: () => streetTrack(2, 1.3, 65.3, 3.8),
    cast: (t) => [walker(t, 65.3, 2, 1.3, "stern")] },
  { name: "S6b fifty thousand", s0: 67.2, s1: 69.6, set: "room", light: "day", dof: { c: 9, focus: NOTES }, cam: notesCU(),
    desk: (t) => ({ notes: Math.round(5 * ease(t, 67.33 - L, 68.4)), pot: 0 }) },
  { name: "S6c chasing it", s0: 69.6, s1: 73.3, set: "room", light: "night", dof: { c: 6, focus: NOTES },
    cam: cam([NOTES[0] - 0.1, 1.3, NOTES[2] + 0.75], [0.7, 0.8, -1.0], [NOTES[0] - 0.12, 1.26, NOTES[2] + 0.62], [0.7, 0.8, -1.0], 38, -3),
    screen: (t) => ({ k: "chart", t, mode: "crash", u: 0.4 + 0.6 * fill(t, 69.6, 72.5) }),
    desk: (t) => ({ notes: t < 71.97 - L ? 5 : 0, pot: 0, fly: { n: 5, u: fill(t, 70.38, 71.97), from: [NOTES[0], NOTES[1] + 0.05, NOTES[2]], to: [PHONE[0], PHONE[1] + 0.01, PHONE[2]] } }) },
  // ===== 7: the realisation =====
  { name: "S7a that night", s0: 73.3, s1: 76.8, set: "room", light: "dark", dof: { c: 7, focus: [BED[0], 1.35, BED[2]] }, rain: true,
    cam: cam([BED[0] + 1.3, 1.35, BED[2] + 2.3], [BED[0], 1.15, BED[2]], [BED[0] + 0.85, 1.32, BED[2] + 1.6], [BED[0], 1.18, BED[2]], 38, -2),
    cast: (t) => [onBed(t < 74.77 - L ? "pained" : "neutral", { tilt: 4, headTilt: t < 74.77 - L ? 8 : 0 })] },
  { name: "S7b gambling", s0: 76.8, s1: 79.9, set: "room", light: "dark", dof: { c: 10, focus: PHONE }, cam: phoneCam(0.08, 5), rain: true,
    screen: (t) => ({ k: "roulette", t, u: fill(t, 78.03, 79.9) }),
    desk: (t) => ({ notes: 0, pot: 0, dice: fill(t, 78.03 - L, 78.9) }) },
  // ===== 8: the boring way =====
  { name: "S8a fresh start", s0: 79.9, s1: 83.3, set: "room", light: "golden", dof: { c: 10, focus: AKHIL_FACE() }, cam: deskMS(-2),
    cast: (t) => [seated(t < 81.62 - L ? "neutral" : "smile", { prop: ["phone", 0.35, GLOW] })], fan: true },
  { name: "S8b ETF every month", s0: 83.3, s1: 85.9, set: "room", light: "golden", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.04, 2),
    screen: (t) => ({ k: "sip", t, ticks: Math.floor(Math.max(0, t - 83.45) * 30 / 8) }) },
  { name: "S8c solid companies", s0: 85.9, s1: 88.2, set: "room", light: "golden", dof: { c: 10, focus: [POT[0] - 0.27, 0.9, POT[2] + 0.1] },
    cam: cam([POT[0] - 0.5, 1.12, POT[2] + 1.0], [POT[0] - 0.18, 0.9, POT[2] + 0.05], [POT[0] - 0.46, 1.08, POT[2] + 0.85], [POT[0] - 0.18, 0.9, POT[2] + 0.05], 30, 2),
    desk: (t) => ({ notes: 0, pot: 0.1, plant: ease(t, 86.2, 87.4) }) },
  { name: "S8d no tips no calls", s0: 88.2, s1: 90.7, set: "room", light: "golden", dof: { c: 12, focus: PHONE }, cam: phoneCam(0.04, -2),
    screen: (t) => ({ k: "mute", t, a: fill(t, 88.39 - L, 88.9), b: fill(t, 89.06 - L, 89.6) }), desk: () => ({ notes: 0, pot: 0.1, plant: 1 }) },
  // ===== ending =====
  { name: "E walking on", s0: 90.7, s1: 96.9, set: "street", light: "golden", dof: { c: 0 },
    cam: (t: number) => { const c = streetTrack(-10, 1.1, 90.7, 4.0 + 2.2 * ease(t, 92.5, 96.9), 1.55 + 1.0 * ease(t, 92.5, 96.9), 40)(t); return c; },
    cast: (t) => [walker(t, 90.7, -10, 1.1, t < 93.3 ? "neutral" : "smile")] },
  { name: "CARD", s0: 96.9, s1: TOTAL_S, set: "room", light: "golden", dof: { c: 11, focus: POT },
    cam: cam([POT[0] - 0.4, 1.15, POT[2] + 1.1], [POT[0] - 0.1, 0.9, POT[2]], [POT[0] - 0.3, 1.08, POT[2] + 0.8], [POT[0] - 0.1, 0.9, POT[2]], 32, 2),
    desk: () => ({ notes: 0, pot: 0.1, plant: 1 }), fade: (t) => ease(t, 101.2, 102.4) },
];

export const SHOTS: Shot[] = DEFS.map((d, i) => {
  const a = Math.round(d.s0 * FPS), b = Math.round(d.s1 * FPS);
  const c = d.cam as (x: number, y?: number) => unknown;
  // camera factory (a, b) -> (t) or direct (t) -> Cam: factories return functions
  const probe = c.length === 2 ? (c as (a: number, b: number) => (t: number) => Cam)(d.s0, d.s1) : (c as (t: number) => Cam | ((t: number) => Cam));
  const camFn = c.length === 2 ? (probe as (t: number) => Cam) : (t: number) => { const r = (probe as (t: number) => Cam | ((t: number) => Cam))(t); return typeof r === "function" ? r(t) : r; };
  return { ...d, id: i + 1, a, b, cam: camFn } as Shot;
});
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const FLASH_AT = Math.round(8.6 * FPS);
// every hold creeps: guarantee a minimum push even on "static" defs (cam factories already move)
