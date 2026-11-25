# "The ₹2 Lakh Wait" soundtrack: original score + procedural SFX, mixed under the Malayalam voice.
# Sections follow the picture (story.ts): playful saver | night message | giddy wins | the turn (tension, heartbeat)
# | second loss | rain + realisation | calm, warm "boring way" ending. Music ducks under the voice.
import json, numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, fades, dbg, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, colored, widen, st
import instruments as I
from sfx_gen import whoosh, clink

V = json.load(open("../voice/words.json"))
DUR = 102.6
N = ns(DUR)
music = np.zeros((2, N)); sfx = np.zeros((2, N))
R = rng(11)
m2f = I.m2f

def note(buf, fn, t, midi, vel=0.6, p=0.0, **kw):
    y = fn(m2f(midi), vel=vel, r=R, **kw)
    place(buf, pan(y, p) if y.ndim == 1 else y, t)

def chord_pad(t, dur, midis, vel=0.35, warm=900):
    place(music, I.pad([m2f(m) for m in midis], dur, vel=vel, r=R, att=0.5, rel=1.0, warm=warm), t)

B = 0.6  # 100 bpm
# ---------- 0-8.6 hook: bright pizz ostinato, turns minor at "market" ----------
up = [60, 64, 67, 72, 67, 64]
for i in range(int(4.3 / (B / 2))):
    t = 0.05 + i * B / 2
    note(music, I.pluck, t, up[i % 6], 0.42, p=0.2 * ((i % 2) * 2 - 1), dur=0.6)
    if i % 4 == 0: note(music, I.pluck, t, 36 if i % 8 == 0 else 43, 0.5, dur=0.9, bright=0.2)
for k, m in enumerate([72, 76, 79]): note(music, I.glock, 1.99 + k * 0.15, m, 0.35, dur=1.2)
down = [69, 67, 64, 63, 60, 57, 56, 53]
for i, m in enumerate(down):
    note(music, I.pluck, 4.34 + i * 0.3, m, 0.5, dur=0.7)
chord_pad(4.3, 4.0, [45, 52, 57, 60], 0.3, 700)
for i in range(6): note(music, I.timpani, 6.2 + i * 0.36, 33, 0.35 + 0.08 * i, dur=1.0)
place(music, I.cymbal(0.5, R, dur=2.0), 8.6)
# ---------- 8.6-21.3 everyday saving: light C major theme ----------
prog = [(48, [60, 64, 67]), (53, [60, 65, 69]), (55, [59, 62, 67]), (48, [60, 64, 67])]
mel = [76, 74, 72, 74, 76, 76, 76, None, 74, 74, 74, None, 76, 79, 79, None, 76, 74, 72, 74, 76, 76, 76, 76, 74, 74, 76, 74, 72, None, None, None]
t0 = 8.7
for bar in range(int((21.3 - t0) / (4 * B))):
    bass, ch = prog[bar % 4]
    tb = t0 + bar * 4 * B
    for beat in range(4):
        note(music, I.pluck, tb + beat * B, bass if beat % 2 == 0 else bass + 7, 0.45, dur=0.6, bright=0.25)
        if beat % 2 == 1:
            for m in ch: note(music, I.pluck, tb + beat * B, m, 0.18, dur=0.4)
    for e in range(8):
        m = mel[(bar * 8 + e) % len(mel)]
        if m is not None and tb + e * B / 2 < 21.0: note(music, I.vibes, tb + e * B / 2, m, 0.22, dur=0.7)
# ---------- 21.3-29 night: pad + music box ----------
chord_pad(21.3, 7.6, [45, 52, 57, 64], 0.28, 600)
for i, m in enumerate([76, 72, 69, 72, 76, 79, 76, 72]):
    note(music, I.musicbox, 21.6 + i * 0.9, m, 0.25, dur=1.4)
# ---------- 29-52.3 temptation and wins: brisk, sparkly ----------
chord_pad(29.0, 4.9, [50, 57, 60, 65], 0.25, 700)  # unsure (Dm)
for i in range(16): note(music, I.pluck, 29.1 + i * 0.3, [62, 65, 69, 65][i % 4], 0.25, dur=0.5)
B2 = 0.5  # 120 bpm giddy
prog2 = [(48, [64, 67, 72]), (57, [64, 69, 72]), (53, [65, 69, 72]), (55, [62, 67, 71])]
t0 = 33.9
for bar in range(int((52.3 - t0) / (4 * B2))):
    bass, ch = prog2[bar % 4]
    tb = t0 + bar * 4 * B2
    for beat in range(4):
        note(music, I.pluck, tb + beat * B2, bass, 0.5, dur=0.5, bright=0.3)
        place(music, pan(I.brush(0.25 + 0.1 * (beat % 2), R), 0.3), tb + beat * B2 + B2 / 2)
        for m in ch: note(music, I.pluck, tb + beat * B2 + B2 / 2, m + 12, 0.12, dur=0.3)
    for e in range(4): note(music, I.glock, tb + e * B2, ch[(e + bar) % 3] + 12, 0.16, dur=0.8)
for t in (36.08, 44.0):  # win stingers
    for k, m in enumerate([72, 76, 79, 84]): note(music, I.glock, t + k * 0.07, m, 0.4, dur=1.4)
    place(music, I.cymbal(0.35, R, dur=1.6, bright=1.2), t)
for k, m in enumerate([79, 84, 88, 91]): note(music, I.musicbox, 47.45 + k * 0.18, m, 0.35, dur=2.0)  # daydream
# ---------- 52.3-65.3 the turn: minor drone, heartbeat, falling line ----------
chord_pad(52.3, 6.3, [45, 52, 55, 60], 0.32, 500)
chord_pad(58.6, 6.4, [44, 51, 55, 59], 0.32, 450)
hb = 53.2
while hb < 62.6:
    note(music, I.timpani, hb, 33, 0.55, dur=0.6); note(music, I.timpani, hb + 0.22, 33, 0.35, dur=0.5)
    hb += 0.75 - 0.25 * min(1, (hb - 53.2) / 8)
for i in range(18): note(music, I.pluck, 54.3 + i * 0.25, [69, 68, 67, 66][i % 4] - (i // 4), 0.3, dur=0.4)
note(music, I.timpani, 61.73, 28, 0.9, dur=2.5); place(music, I.cymbal(0.5, R, dur=2.4, bright=0.6), 61.73)
# 62.7-65.3: near silence, one low note
note(music, I.vibes, 63.0, 45, 0.3, dur=2.5)
# ---------- 65.3-73.3 again, and lost again ----------
for i in range(int((73.0 - 65.4) / 0.3)):
    m = [57, 60, 64, 60][i % 4] - (2 if i > 16 else 0)
    note(music, I.pluck, 65.4 + i * 0.3, m, 0.3 if i < 16 else 0.3 * (1 - (i - 16) / 10), dur=0.5)
chord_pad(65.3, 4.3, [45, 52, 57, 60], 0.22, 700)
chord_pad(69.6, 3.7, [41, 48, 53, 56], 0.28, 450)
note(music, I.timpani, 71.97, 28, 0.8, dur=2.0)
# ---------- 73.3-79.9 realisation: low pad only ----------
chord_pad(73.4, 6.4, [40, 47, 52, 55], 0.22, 350)
for i, m in enumerate([64, 62, 60]): note(music, I.musicbox, 75.0 + i * 1.2, m, 0.18, dur=2.0)
# ---------- 79.9-102.6 the boring way: warm, hopeful ----------
prog3 = [[48, 55, 64, 67], [53, 60, 65, 69], [45, 52, 60, 64], [55, 62, 67, 71]]
for i in range(int((101.5 - 79.9) / 2.4)):
    chord_pad(79.9 + i * 2.4, 2.4, prog3[i % 4], 0.26, 900)
mel3 = [72, 74, 76, 79, 76, 74, 72, 69, 72, 74, 76, 74, 72, None, 79, 77, 76, 74, 72, 74, 72, None, None, None]
for i, m in enumerate(mel3 * 2):
    t = 80.5 + i * 0.6
    if m is not None and t < 100.5: note(music, I.musicbox, t, m, 0.24, dur=1.6)
for i in range(int((100 - 80) / 0.6)): note(music, I.pluck, 80.0 + i * 0.6, prog3[(i // 4) % 4][0], 0.25, dur=0.8, bright=0.2)
note(music, I.glock, 101.0, 84, 0.3, dur=2.0); note(music, I.glock, 101.0, 79, 0.25, dur=2.0)
music = lp(music, 9000)

# ================= SFX =================
def S(t, y, g=1.0, p=0.0):
    place(sfx, pan(y, p) if y.ndim == 1 else y, t, g)
def paper(r, dur=0.12):
    n = ns(dur); t = np.arange(n) / SR
    return bp(r.standard_normal(n), 1200, 7000, 1) * np.exp(-t / (dur * 0.35)) * 0.6
def flip(r):
    y = whoosh(0.22, r, peak=0.05, f_lo=1500, f_hi=5000, width=1.0, tail=0.08) * 0.8
    p = paper(r, 0.08); y[: len(p)] += p
    return y
def thud(r, f=70, dur=0.4, g=1.0):
    t = tt(dur); return (np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * np.exp(-t / 0.09) + 0.3 * lp(r.standard_normal(len(t)), 400) * np.exp(-t / 0.03)) * g
def beep(f0, f1, dur, g=0.5, wave="sine"):
    t = tt(dur); f = np.linspace(f0, f1, len(t)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) if wave == "sine" else np.sign(np.sin(ph)) * 0.4
    return fades(y * g * np.exp(-t / (dur * 0.6)), 0.003, 0.03)
def pop(g=0.5): return beep(500, 1100, 0.08, g)
def tap(r): return hp(r.standard_normal(ns(0.02)), 2000) * np.exp(-np.arange(ns(0.02)) / SR / 0.004) * 0.6
def buzz(dur=0.8):
    t = tt(dur); y = np.sin(2 * np.pi * 150 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 6 * t)))
    return lp(y * 0.35, 600)
def kaching(r):
    y = np.zeros(ns(1.0))
    for k, f in enumerate([2093, 2637, 3136]):
        c = clink(r, f, 0.8); y[ns(0.05 * k): ns(0.05 * k) + len(c)] += c[: len(y) - ns(0.05 * k)] * 0.6
    y[: ns(0.08)] += thud(r, 180, 0.08, 0.5)
    return y
def steps(t0, t1, rate, g=0.25):
    t = t0; r = rng(5); k = 0
    while t < t1:
        n = ns(0.06); y = lp(r.standard_normal(n), 1800) * np.exp(-np.arange(n) / SR / 0.012)
        S(t, y, g * (0.85 + 0.3 * r.uniform()), -0.1 if k % 2 else 0.1); t += rate; k += 1
def ambience(t0, t1, kind, g=1.0):
    n = ns(t1 - t0); r = rng(int(t0 * 10)); t = np.arange(n) / SR
    env = np.minimum(1, np.minimum(t / 0.3, (t1 - t0 - t) / 0.3))
    if kind == "street":
        y = widen(lp(colored(n, r, 1.2), 800) * 0.25, r)  # traffic murmur
        for k in range(int((t1 - t0) * 1.2)):  # birds chirp
            tc = r.uniform(0, t1 - t0); d = 0.12; tb = tt(d)
            ch = np.sin(2 * np.pi * np.cumsum(3200 + 900 * np.sin(2 * np.pi * 18 * tb)) / SR) * np.exp(-tb / 0.05) * 0.08
            i = ns(tc); y[:, i:i + len(ch)] += ch[: max(0, min(len(ch), n - i))]
        horn = beep(420, 410, 0.35, 0.12, "sq"); i = ns((t1 - t0) * 0.6); y[:, i:i + len(horn)] += horn[: max(0, min(len(horn), n - i))] * 0.5
    elif kind == "room":
        y = widen(lp(colored(n, r, 0.8), 500) * 0.06 + 0.02 * np.sin(2 * np.pi * 50 * t), r)  # fan hum
        y += widen(hp(colored(n, r, 0.0), 4000) * 0.012, r)  # crickets-ish air
        for k in range(int((t1 - t0) * 3)):
            tc = r.uniform(0, t1 - t0); tb = tt(0.05); ch = np.sin(2 * np.pi * 4500 * tb) * (np.sin(2 * np.pi * 60 * tb) > 0) * 0.025 * np.exp(-tb / 0.03)
            i = ns(tc); y[:, i:i + len(ch)] += ch[: max(0, min(len(ch), n - i))]
    else:  # rain
        y = widen(bp(colored(n, r, 0.3), 400, 6000, 1) * 0.22, r, amount=0.9)
        for k in range(int((t1 - t0) * 25)):
            i = ns(r.uniform(0, t1 - t0)); d = hp(r.standard_normal(ns(0.01)), 2500) * 0.08; y[:, i:i + len(d)] += d[: max(0, min(len(d), n - i))]
    place(sfx, y * env * g, t0)

r = rng(3)
# room / street / rain beds per shot block
for a, b, k in [(0, 8.6, "room"), (8.6, 10.9, "street"), (10.9, 17.7, "room"), (17.7, 19.4, "street"), (19.4, 49.4, "room"), (49.4, 52.3, "street"),
                (52.3, 65.3, "room"), (65.3, 67.2, "street"), (67.2, 73.3, "room"), (73.3, 79.9, "rain"), (79.9, 90.7, "room"), (90.7, 96.9, "street"), (96.9, 102.6, "room")]:
    ambience(a, b, k, 0.9 if k != "rain" else 1.3)
# hook
for i in range(10): S(1.95 + i * 0.11, paper(r), 0.7, 0.2)
S(4.3, beep(900, 300, 1.4, 0.35), 0.8)
for i in range(11): S(6.25 + i * 1.6 / 30, flip(r), 0.8, 0.15)
S(7.55, whoosh(0.9, r, peak=0.1, f_lo=600, f_hi=3000, tail=0.5), 1.2); S(7.55, thud(r, 90, 0.5), 0.8)
S(8.3, whoosh(0.4, r, peak=0.3, f_lo=800, f_hi=6000), 1.0)
# 1
steps(8.7, 10.9, 0.48)
for t, p in [(11.04, -0.5), (11.52, 0.4), (12.03, 0.1)]: S(t, whoosh(0.45, r, peak=0.12, f_lo=500, f_hi=2500), 0.9, p)
S(16.5, clink(r, 2400, 0.4), 0.8); S(16.56, clink(r, 3100, 0.3), 0.5)
for i in range(4): S(19.45 + i * 0.2, flip(r), 0.8)
# 2
S(23.49, buzz(0.9), 1.0)
for t in (24.03, 25.31, 27.29): S(t, pop(0.45), 1.0)
# 3
S(33.88, tap(r), 1.2); S(33.9, pop(0.4), 0.8)
S(36.06, kaching(r), 1.0)
S(38.2, beep(1200, 1500, 0.2, 0.2), 0.6); S(39.9, whoosh(0.9, r, peak=0.5, f_lo=800, f_hi=3500), 0.6)
S(44.0, kaching(r), 0.9)
# 4
steps(50.2, 52.3, 0.46)
# 5
S(53.2, beep(700, 180, 1.0, 0.45, "sq"), 0.7)
for t in (55.46, 55.85, 56.97, 57.43): S(t, tap(r), 1.1); S(t + 0.02, pop(0.35), 0.8)
for i in range(11): S(58.6 + i * 1.4 / 30, flip(r), 0.8, -0.15)
S(61.71, thud(r, 60, 0.6), 1.0)
for i in range(6): S(61.75 + i * 0.12, paper(r, 0.2), 0.6, (i % 3 - 1) * 0.5)
S(62.81, beep(392, 370, 0.5, 0.4) , 0.7); S(63.3, beep(370, 300, 1.0, 0.4), 0.7)
# 6
steps(65.3, 67.2, 0.46)
for i in range(5): S(67.33 + i * 0.22, thud(r, 140, 0.12, 0.5) + 0.0, 0.8)
S(70.3, whoosh(1.7, r, peak=1.4, f_lo=300, f_hi=4000, tail=0.15), 1.0); S(71.95, thud(r, 50, 0.6), 0.9)
# 7
S(74.6, lp(colored(ns(2.5), r, 1.8), 120) * np.exp(-tt(2.5) / 0.8) * 1.2, 0.9)  # distant thunder
for i in range(14): S(78.0 + i * 0.07 * (1 + i * 0.1), clink(r, 1400 + 200 * (i % 3), 0.1, 0.5), 0.4)
for i in range(6): S(78.03 + i * 0.12, thud(r, 260, 0.06, 0.4), 0.7)
# 8
for i in range(6): S(83.45 + i * 8 / 30, beep(1568, 1568, 0.25, 0.2), 0.8)
for k, f in enumerate([1760, 2093, 2637]): S(86.3 + k * 0.25, beep(f, f * 1.01, 0.6, 0.15), 0.8)
S(88.37, tap(r), 1.0); S(88.4, beep(600, 400, 0.18, 0.3), 0.8)
S(89.04, tap(r), 1.0); S(89.07, beep(480, 300, 0.25, 0.3, "sq"), 0.6)
steps(90.8, 96.8, 0.55, 0.2)

# ================= MIX =================
voice, _sr = read_wav("../voice/voice.wav")
voice = voice.mean(0)
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
vst = np.stack([voice, voice])
# voice envelope -> duck music by up to 8 dB
env = np.abs(voice); k = ns(0.05)
env = np.convolve(env, np.ones(k) / k, mode="same")
on = (env > 0.01).astype(float)
k2 = ns(0.25); on = np.convolve(on, np.ones(k2) / k2, mode="same")
duck = 10 ** (-8 * np.clip(on, 0, 1) / 20)
ir = make_ir(1.2, 7)
music = 0.8 * music + 0.2 * convolve_st(music, ir)[:, :N]
def lufs(x): return integrated(x)
vL = lufs(vst); mL = lufs(music); sL = lufs(sfx)
print("raw LUFS voice", round(vL, 1), "music", round(mL, 1), "sfx", round(sL, 1))
music *= dbg(vL - 13 - mL)           # music bed ~13 LU under the voice before ducking (+3 dB house rule applied in the target)
sfx *= dbg(vL - 12 - sL)
music *= duck[None, :]
mix = vst + music + sfx
fade_out = np.ones(N); a = ns(101.4); fade_out[a:] = np.linspace(1, 0, N - a)
mix *= fade_out[None, :]
g = dbg(-14 - integrated(mix)); mix *= g
tp = true_peak(mix)
if tp > dbg(-1.0): mix *= dbg(-1.0) / tp
print("final LUFS", round(integrated(mix), 1), "TP dBFS", round(20 * np.log10(true_peak(mix)), 1))
write_wav("mix.wav", mix)
write_wav("music.wav", music * g); write_wav("sfx.wav", sfx * g)
