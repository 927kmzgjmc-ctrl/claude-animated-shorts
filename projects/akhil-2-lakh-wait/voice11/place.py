import numpy as np, json
from scipy.io import wavfile
sr, x = wavfile.read("el.wav"); x = x.astype(float)/32768
V = json.load(open("../voice/words.json"))
starts = {s["sec"]: s["s"] for s in V["segs"]}
starts["s7"] -= 0.25
cuts = {"hook":(0.0,7.40),"s1":(8.00,20.40),"s2":(21.00,28.07),"s3":(28.69,39.79),"s4":(40.34,48.67),
 "s5":(49.22,60.32),"s6":(60.82,67.05),"s7":(67.61,74.41),"s8":(74.99,85.07),"end":(85.61,91.50),"card":(92.06,95.08)}
N = int(102.576*sr)+sr
out = np.zeros(N); prev_end=0
for k,(a,b) in cuts.items():
    a=max(0,a-0.08); b=b+0.12
    seg = x[int(a*sr):int(b*sr)].copy()
    f=int(0.01*sr); seg[:f]*=np.linspace(0,1,f); seg[-f:]*=np.linspace(1,0,f)
    t0 = starts[k]-0.02
    i=int(t0*sr); out[i:i+len(seg)] += seg
    print(f"{k:5s} at {t0:6.2f}-{t0+len(seg)/sr:6.2f}  gap after prev {t0-prev_end:+.2f}")
    prev_end=t0+len(seg)/sr
wavfile.write("voice.wav", sr, (np.clip(out[:int(102.576*sr)],-1,1)*32767).astype(np.int16))
