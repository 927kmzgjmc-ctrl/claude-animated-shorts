// Diegetic 2D screens painted on canvases every frame: the phone (trading app, chat, SIP app, roulette), the wall
// calendar, and the rupee notes. Flat, bold cartoon UI in the same plum ink as the characters. Numbers only, no captions.
import { INK } from "./toon";

export type Screen =
  | { k: "off" }
  | { k: "chart"; t: number; mode: "crash" | "rise" | "turn" | "flat"; bal?: number; pnl?: number; u: number }
  | { k: "chat"; t: number; shown: number }
  | { k: "chain"; t: number; press: number }
  | { k: "zero"; t: number; u: number }
  | { k: "roulette"; t: number; u: number }
  | { k: "sip"; t: number; ticks: number }
  | { k: "mute"; t: number; a: number; b: number }
  | { k: "buzz"; t: number };

export type Cal =
  | { k: "day"; day: number; tear: number; red: boolean }
  | { k: "month"; circle: number; fill: number }
  | { k: "year"; year: number; tear: number };

const F = (w: number, px: number, weight = 800) => `${weight} ${Math.round(px * w / 540)}px Inter, "Inter", FreeSans, sans-serif`;
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
export const inr = (v: number) => {
  const s = Math.round(Math.abs(v)).toString();
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  const body = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return (v < 0 ? "-" : "") + "₹" + body;
};
const GREEN = "#2fc46b", RED = "#ff4b55", BG = "#151a2b", CARD = "#20263c", DIM = "#7d87a8", WHITE = "#f4f6ff";

/** price path: deterministic wiggle around a trend */
const path = (mode: string, n: number, u: number) => {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const w = 0.035 * Math.sin(x * 37.1) + 0.025 * Math.sin(x * 83.7 + 1.3) + 0.015 * Math.sin(x * 151.0);
    let y: number;
    if (mode === "crash") y = 0.75 - 0.15 * x - 0.55 * Math.max(0, x - 0.3) ** 1.3;
    else if (mode === "rise") y = 0.25 + 0.55 * x;
    else if (mode === "turn") y = x < 0.55 ? 0.3 + 0.75 * x : 0.71 - 1.3 * (x - 0.55);
    else y = 0.3 + 0.32 * x;
    pts.push(y + w * (mode === "flat" ? 0.35 : 1));
  }
  return pts.slice(0, Math.max(2, Math.round(n * u)));
};

export function drawPhone(g: CanvasRenderingContext2D, W: number, H: number, s: Screen) {
  const k = W / 540;
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  if (s.k === "off") { g.fillStyle = "#07080c"; g.fillRect(0, 0, W, H); return; }
  // status bar
  g.fillStyle = DIM; g.font = F(W, 26, 600); g.textAlign = "left"; g.fillText("9:41", 34 * k, 50 * k);
  g.textAlign = "right"; g.fillText("▮▮▮ ●", W - 34 * k, 50 * k);
  g.textAlign = "center";
  if (s.k === "chart" || s.k === "zero") {
    g.fillStyle = WHITE; g.font = F(W, 30, 700); g.fillText("NIFTY 50", W / 2, 120 * k);
    const mode = s.k === "zero" ? "crash" : s.mode, u = s.k === "zero" ? 1 : s.u;
    const pts = path(mode, 120, u), up = mode === "rise" || mode === "flat";
    const x0 = 30 * k, x1 = W - 30 * k, y0 = 400 * k, y1 = 830 * k;
    // grid
    g.strokeStyle = "rgba(125,135,168,.18)"; g.lineWidth = 2 * k;
    for (let i = 0; i <= 5; i++) { const y = y0 + ((y1 - y0) * i) / 5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    const X = (i: number) => x0 + ((x1 - x0) * i) / 119, Y = (v: number) => y1 - (y1 - y0) * v;
    // colour by segment slope for the turn
    const last = pts.length - 1;
    const lastUp = pts[last] >= pts[Math.max(0, last - 8)];
    const col = mode === "turn" ? (lastUp ? GREEN : RED) : up ? GREEN : RED;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, col + "66"); gr.addColorStop(1, col + "00");
    g.beginPath(); g.moveTo(X(0), y1); pts.forEach((v, i) => g.lineTo(X(i), Y(v))); g.lineTo(X(last), y1); g.closePath(); g.fillStyle = gr; g.fill();
    g.beginPath(); pts.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.strokeStyle = col; g.lineWidth = 9 * k; g.lineJoin = "round"; g.stroke();
    g.beginPath(); g.arc(X(last), Y(pts[last]), 14 * k, 0, 7); g.fillStyle = col; g.fill();
    if (s.k === "zero") {
      g.fillStyle = WHITE; g.font = F(W, 30, 600); g.fillText("BALANCE", W / 2, 910 * k);
      const sh = s.u < 1 ? (1 - s.u) * 18 * Math.sin(s.t * 90) : 0;
      g.fillStyle = RED; g.font = F(W, 160, 900); g.fillText("₹0", W / 2 + sh * k, 1080 * k);
      return;
    }
    if (s.bal !== undefined) {
      g.fillStyle = DIM; g.font = F(W, 28, 600); g.fillText("BALANCE", W / 2, 220 * k);
      g.fillStyle = WHITE; g.font = F(W, 74, 900); g.fillText(inr(s.bal), W / 2, 305 * k);
    }
    if (s.pnl !== undefined) {
      rr(g, 50 * k, 880 * k, W - 100 * k, 220 * k, 34 * k); g.fillStyle = CARD; g.fill();
      g.fillStyle = DIM; g.font = F(W, 28, 600); g.fillText("TODAY'S P&L", W / 2, 940 * k);
      g.fillStyle = s.pnl >= 0 ? GREEN : RED; g.font = F(W, 96, 900);
      g.fillText((s.pnl >= 0 ? "+" : "") + inr(s.pnl), W / 2, 1055 * k);
    }
    return;
  }
  if (s.k === "chat" || s.k === "buzz") {
    g.fillStyle = CARD; g.fillRect(0, 70 * k, W, 120 * k);
    g.beginPath(); g.arc(80 * k, 130 * k, 38 * k, 0, 7); g.fillStyle = "#f0a23a"; g.fill();
    g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(68 * k, 124 * k, 5 * k, 0, 7); g.arc(92 * k, 124 * k, 5 * k, 0, 7); g.fill();
    g.strokeStyle = "#3a2a1a"; g.lineWidth = 4 * k; g.beginPath(); g.arc(80 * k, 134 * k, 14 * k, 0.2, Math.PI - 0.2); g.stroke();
    g.textAlign = "left"; g.fillStyle = WHITE; g.font = F(W, 34, 700); g.fillText("Machan", 135 * k, 142 * k);
    g.textAlign = "center";
    if (s.k === "buzz") return;
    const bub = (i: number, y: number, h: number, draw: () => void) => {
      const a = Math.min(1, Math.max(0, (s.shown - i) * 4));
      if (a <= 0) return;
      const sc = 0.7 + 0.3 * Math.min(1, a) + 0.08 * Math.sin(Math.min(1, a) * Math.PI);
      g.save(); g.translate(50 * k, y); g.scale(sc, sc); g.globalAlpha = Math.min(1, a * 1.5);
      rr(g, 0, 0, W - 150 * k, h, 30 * k); g.fillStyle = "#2b3350"; g.fill();
      draw(); g.restore();
    };
    g.textAlign = "left";
    bub(0, 260 * k, 130 * k, () => { g.fillStyle = WHITE; g.font = F(W, 62, 900); g.fillText("Aliyaa!!", 30 * k, 88 * k); });
    bub(1, 420 * k, 330 * k, () => {
      g.fillStyle = DIM; g.font = F(W, 30, 600); g.fillText("Options today", 30 * k, 62 * k);
      g.fillStyle = GREEN; g.font = F(W, 76, 900); g.fillText("+₹40,000", 30 * k, 175 * k);
      g.strokeStyle = GREEN; g.lineWidth = 8 * k; g.beginPath();
      for (let i = 0; i < 12; i++) { const x = 30 * k + i * 30 * k, y = 290 * k - i * 6 * k - (i % 2) * 16 * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    bub(2, 790 * k, 130 * k, () => { g.fillStyle = WHITE; g.font = F(W, 58, 900); g.fillText("EASY MONEY", 30 * k, 88 * k); });
    g.textAlign = "center";
    return;
  }
  if (s.k === "chain") {
    g.fillStyle = WHITE; g.font = F(W, 30, 700); g.fillText("OPTION CHAIN", W / 2, 120 * k);
    g.font = F(W, 24, 600);
    for (let i = 0; i < 9; i++) {
      const y = 190 * k + i * 76 * k, hi = i === 4;
      g.fillStyle = hi ? "#2b3350" : i % 2 ? "#1a2034" : BG; g.fillRect(20 * k, y, W - 40 * k, 70 * k);
      g.fillStyle = hi ? WHITE : DIM;
      g.fillText(String(24300 + i * 50), W / 2, y + 46 * k);
      g.fillStyle = i < 4 ? GREEN : RED; g.textAlign = "left"; g.fillText((((i * 37) % 90) + 40).toFixed(1), 40 * k, y + 46 * k);
      g.textAlign = "right"; g.fillText((((i * 53) % 80) + 30).toFixed(1), W - 40 * k, y + 46 * k); g.textAlign = "center";
    }
    g.fillStyle = WHITE; g.font = F(W, 40, 800); g.fillText("CALL  24500 CE", W / 2, 905 * k);
    const pr = s.press, sc = 1 - 0.1 * Math.sin(Math.min(1, pr) * Math.PI);
    if (pr > 0 && pr < 1.5) { // ripple
      g.beginPath(); g.arc(W / 2, 1040 * k, (60 + 260 * Math.min(1, pr)) * k, 0, 7); g.strokeStyle = `rgba(47,196,107,${Math.max(0, 1 - pr) * 0.8})`; g.lineWidth = 14 * k; g.stroke();
    }
    g.save(); g.translate(W / 2, 1040 * k); g.scale(sc, sc);
    rr(g, -190 * k, -75 * k, 380 * k, 150 * k, 75 * k); g.fillStyle = pr > 0 ? "#22a85a" : GREEN; g.fill();
    g.fillStyle = WHITE; g.font = F(W, 96, 900); g.fillText("BUY", 0, 34 * k); g.restore();
    return;
  }
  if (s.k === "roulette") {
    const cx = W / 2, cy = 640 * k, R = 230 * k, a0 = s.t * (6 - 4 * s.u);
    for (let i = 0; i < 18; i++) {
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0 + (i * Math.PI * 2) / 18, a0 + ((i + 1) * Math.PI * 2) / 18); g.closePath();
      g.fillStyle = i === 0 ? GREEN : i % 2 ? "#1b1b22" : RED; g.fill();
    }
    g.beginPath(); g.arc(cx, cy, R, 0, 7); g.strokeStyle = "#e7b54a"; g.lineWidth = 18 * k; g.stroke();
    g.beginPath(); g.arc(cx, cy, R * 0.32, 0, 7); g.fillStyle = "#e7b54a"; g.fill();
    g.beginPath(); g.arc(cx + Math.cos(-a0 * 1.7) * R * 0.8, cy + Math.sin(-a0 * 1.7) * R * 0.8, 16 * k, 0, 7); g.fillStyle = WHITE; g.fill();
    return;
  }
  if (s.k === "sip") {
    g.fillStyle = WHITE; g.font = F(W, 34, 800); g.fillText("NIFTY 50 ETF", W / 2, 130 * k);
    g.fillStyle = DIM; g.font = F(W, 26, 600); g.fillText("EVERY MONTH", W / 2, 175 * k);
    const x0 = 50 * k, x1 = W - 50 * k, y0 = 260 * k, y1 = 620 * k;
    g.strokeStyle = GREEN; g.lineWidth = 8 * k; g.beginPath();
    for (let i = 0; i <= 60; i++) { const x = x0 + ((x1 - x0) * i) / 60, y = y1 - (y1 - y0) * (0.1 + 0.6 * (i / 60) + 0.03 * Math.sin(i * 1.7)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
    months.forEach((m, i) => {
      const y = 680 * k + i * 80 * k, on = s.ticks > i;
      rr(g, 50 * k, y, W - 100 * k, 68 * k, 20 * k); g.fillStyle = CARD; g.fill();
      g.textAlign = "left"; g.fillStyle = on ? WHITE : DIM; g.font = F(W, 30, 700); g.fillText(m, 85 * k, y + 46 * k);
      g.textAlign = "center";
      g.beginPath(); g.arc(W - 105 * k, y + 34 * k, 24 * k, 0, 7); g.fillStyle = on ? GREEN : "#2b3350"; g.fill();
      if (on) { g.strokeStyle = WHITE; g.lineWidth = 8 * k; g.beginPath(); g.moveTo(W - 118 * k, y + 34 * k); g.lineTo(W - 107 * k, y + 46 * k); g.lineTo(W - 90 * k, y + 22 * k); g.stroke(); }
    });
    return;
  }
  if (s.k === "mute") {
    const row = (y: number, icon: "bell" | "call", u: number) => {
      rr(g, 40 * k, y, W - 80 * k, 300 * k, 40 * k); g.fillStyle = CARD; g.fill();
      const cx = W / 2, cy = y + 150 * k;
      g.fillStyle = icon === "bell" ? "#f0c24a" : GREEN;
      if (icon === "bell") {
        g.beginPath(); g.moveTo(cx - 70 * k, cy + 50 * k); g.quadraticCurveTo(cx - 60 * k, cy - 90 * k, cx, cy - 90 * k);
        g.quadraticCurveTo(cx + 60 * k, cy - 90 * k, cx + 70 * k, cy + 50 * k); g.closePath(); g.fill();
        g.beginPath(); g.arc(cx, cy + 62 * k, 18 * k, 0, 7); g.fill();
      } else {
        g.beginPath(); g.arc(cx, cy, 90 * k, 0, 7); g.fill();
        g.save(); g.translate(cx, cy); g.rotate(u > 0 ? 2.36 * Math.min(1, u * 3) : 0);
        g.fillStyle = WHITE; rr(g, -50 * k, -16 * k, 100 * k, 32 * k, 16 * k); g.fill(); g.restore();
        if (u > 0) { g.beginPath(); g.arc(cx, cy, 90 * k, 0, 7); g.fillStyle = `rgba(255,75,85,${Math.min(1, u * 3)})`; g.fill(); g.save(); g.translate(cx, cy); g.rotate(2.36); g.fillStyle = WHITE; rr(g, -50 * k, -16 * k, 100 * k, 32 * k, 16 * k); g.fill(); g.restore(); }
      }
      if (u > 0) { // strike
        const e = Math.min(1, u * 3);
        g.strokeStyle = RED; g.lineWidth = 22 * k; g.lineCap = "round";
        g.beginPath(); g.moveTo(cx - 120 * k, cy - 110 * k); g.lineTo(cx - 120 * k + 240 * k * e, cy - 110 * k + 220 * k * e); g.stroke();
      }
    };
    g.fillStyle = WHITE; g.font = F(W, 34, 800); g.fillText("TIPS GROUP", W / 2, 170 * k);
    row(220 * k, "bell", s.a);
    g.fillStyle = WHITE; g.font = F(W, 34, 800); g.fillText("+91 9•••• ••••", W / 2, 640 * k);
    row(690 * k, "call", s.b);
    return;
  }
}

export function drawCalendar(g: CanvasRenderingContext2D, W: number, H: number, c: Cal) {
  const k = W / 400;
  g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#c8323c"; g.fillRect(0, 0, W, 90 * k);
  for (const x of [80, 200, 320]) { g.beginPath(); g.arc(x * k, 22 * k, 10 * k, 0, 7); g.fillStyle = "#3a2a2a"; g.fill(); }
  g.textAlign = "center"; g.fillStyle = "#fff"; g.font = F(400, 40 * k, 900);
  if (c.k === "day") {
    g.fillText("DAY", W / 2, 74 * k);
    g.fillStyle = c.red ? "#c8323c" : INK; g.font = F(400, 270 * k, 900); g.fillText(String(c.day), W / 2, 400 * k);
    if (c.red) { g.strokeStyle = "#c8323c"; g.lineWidth = 12 * k; g.beginPath(); g.ellipse(W / 2, 310 * k, 170 * k, 150 * k, -0.1, 0, 7); g.stroke(); }
  } else if (c.k === "year") {
    g.fillText("YEAR", W / 2, 74 * k);
    g.fillStyle = INK; g.font = F(400, 140 * k, 900); g.fillText(String(c.year), W / 2, 360 * k);
    g.fillStyle = "#c8323c"; g.font = F(400, 34 * k, 800); g.fillText("SAVED ₹5,500 / MONTH", W / 2, 470 * k);
  } else {
    g.fillText("MONTH", W / 2, 74 * k);
    for (let i = 0; i < 30; i++) {
      const cx = 40 * k + (i % 6) * 64 * k, cy = 140 * k + Math.floor(i / 6) * 86 * k;
      const lit = i < Math.round(c.fill * 30);
      if (lit) { g.fillStyle = "#bdf0cf"; g.fillRect(cx - 28 * k, cy - 30 * k, 56 * k, 72 * k); }
      g.fillStyle = INK; g.font = F(400, 34 * k, 700); g.fillText(String(i + 1), cx, cy + 20 * k);
      if (i === c.circle - 1) { g.strokeStyle = "#1f9e55"; g.lineWidth = 8 * k; g.beginPath(); g.arc(cx, cy + 8 * k, 34 * k, 0, 7); g.stroke(); }
    }
  }
}

export function drawNote(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = "#b8b59e"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#9c9a82"; g.fillRect(W * 0.62, 0, W * 0.04, H);
  g.fillStyle = "#cfcdb8"; g.beginPath(); g.ellipse(W * 0.78, H * 0.5, W * 0.12, H * 0.32, 0, 0, 7); g.fill();
  g.fillStyle = "#6f6b55"; g.font = `900 ${H * 0.36}px Inter, FreeSans`; g.textAlign = "center"; g.fillText("500", W * 0.32, H * 0.62);
  g.strokeStyle = "#5c5a48"; g.lineWidth = H * 0.05; g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H * 0.9);
}
