// Light presets for the Akhil short. Same field contract as the bridge template (shade.ts / cardshade.ts read them).
// day = Kerala street / room by day, golden = sunrise (the boring-way ending), night = the rented room under a tube light.
type C3 = [number, number, number];
export type LightName = "day" | "golden" | "night" | "dark";
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3;
  sky: string[]; fog: string; fogNear: number; fogFar: number; sat: number;
  sunCol: string; sunI: number; bias: number; normalBias: number; blob: C3;
};
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.34, 0.33, 0.42], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.95, 0.93], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.96],
    sky: ["#bcd6ee", "#9cc2ec", "#6aa2e2", "#4f8cdb", "#3373cc"], fog: "#bcd6ee", fogNear: 30, fogFar: 320, sat: 1.1,
    sunCol: "#fff3e0", sunI: 2.8, bias: -0.0003, normalBias: 0.02, blob: [0.2, 0.21, 0.33],
  },
  golden: {
    az: 35, el: 14,
    lit: [1.55, 0.98, 0.55], shade: [0.2, 0.2, 0.38], lift: [0.05, 0.06, 0.16], lambert: 0.35, sideK: 0.82, term: 0.1,
    charTint: [1.0, 0.86, 0.72], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.8, 0.95],
    sky: ["#ffcf8a", "#f9b67c", "#e8a083", "#b98ea0", "#7f7fb0"], fog: "#f3c08e", fogNear: 40, fogFar: 360, sat: 1.1,
    sunCol: "#ffb36b", sunI: 4.5, bias: -0.0005, normalBias: 0.03, blob: [0.24, 0.2, 0.33],
  },
  night: {
    az: 150, el: 55,
    lit: [1.22, 1.14, 0.98], shade: [0.2, 0.22, 0.38], lift: [0.04, 0.05, 0.14], lambert: 0.45, sideK: 0.8, term: 0.22,
    charTint: [0.98, 0.94, 0.9], charShade: 0.8, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.82, 0.84, 0.98],
    sky: ["#2b3768", "#24305f", "#1c2752", "#161f45", "#10173a"], fog: "#1c2752", fogNear: 40, fogFar: 300, sat: 1.05,
    sunCol: "#fff0d8", sunI: 2.4, bias: -0.0003, normalBias: 0.02, blob: [0.3, 0.3, 0.45],
  },
  dark: { // the realisation night: tube light off, cold moonlight from the window + phone glow
    az: 200, el: 30,
    lit: [0.62, 0.7, 1.0], shade: [0.1, 0.12, 0.26], lift: [0.03, 0.04, 0.12], lambert: 0.45, sideK: 0.8, term: 0.22,
    charTint: [0.62, 0.68, 0.9], charShade: 0.82, charGrad: 0.12, bodyGrad: 0.25, sideTint: [0.75, 0.78, 0.98],
    sky: ["#1d2550", "#18204a", "#141a40", "#0f1535", "#0a0f2a"], fog: "#141a40", fogNear: 40, fogFar: 300, sat: 0.95,
    sunCol: "#c8d4ff", sunI: 1.6, bias: -0.0003, normalBias: 0.02, blob: [0.4, 0.42, 0.55],
  },
};
