import json, re, subprocess
# speech phrases in el.mp3 (from silencedetect -40dB/0.35s)
log = subprocess.run(["ffmpeg","-i","el.mp3","-af","silencedetect=n=-40dB:d=0.35","-f","null","-"],capture_output=True,text=True).stderr
ss=[float(x) for x in re.findall(r"silence_start: ([\d.]+)",log)]; se=[float(x) for x in re.findall(r"silence_end: ([\d.]+)",log)]
ph=[]; t=0.0
for a,b in zip(ss,se): ph.append((t,a)); t=b
ph.append((t,95.05)); ph[0]=(0.05,ph[0][1])
assert len(ph)==40, len(ph)
EN=["It took Akhil three years to save ₹2 lakh.","It took the market just 11 days to take it.",
"A ₹30,000 salary.","Rent, food, money sent home…","Still, every month he saved ₹5,500.","No trips.","No new phone.","Three years.",
"Then one night, a friend's message:","“Bro, made ₹40,000 in options today.”","“Easy money.”",
"Akhil didn't even know what a strike price was.","He pressed BUY on a call option.","By noon: ₹30,000 profit.","In one day.","A whole month's salary.",
"The next day, the same.","₹18,000 more.","Now he's doing the math:","“If I make this every day…","why even go to work?”",
"Then the market turned.","He bought more to win back the loss.","Then even more.","11 days later, three years of savings were gone.","Not a single rupee left.",
"He started again.","Saved ₹50,000 more.","Chasing the lost money, he lost that too.",
"That night, he finally understood:","he wasn't trading.","He was gambling with his own life.",
"So he started again —","the boring way.","A Nifty ETF every month.","A few good, solid companies.","No tips. No calls.",
"Today, Akhil isn't trying to get rich.","He's just trying to get back to where he started.",
"Don't learn this lesson the way Akhil did."]
secs=[("hook",2),("s1",6),("s2",3),("s3",5),("s4",5),("s5",5),("s6",3),("s7",3),("s8",5),("end",2),("card",1)]
cuts={"hook":0.0,"s1":8.00,"s2":21.00,"s3":28.69,"s4":40.34,"s5":49.22,"s6":60.82,"s7":67.61,"s8":74.99,"end":85.61,"card":92.06}
V=json.load(open("../voice/words.json")); st={s["sec"]:s["s"] for s in V["segs"]}; st["s7"]-=0.25
ev=[]; i=0
for k,n in secs:
    off=(st[k]-0.02)-(max(0,cuts[k]-0.08))
    for _ in range(n):
        a,b=ph[i]; ev.append([a+off-0.05,b+off+0.25,EN[i]]); i+=1
for j in range(len(ev)-1):  # no overlaps; hold through short gaps
    nxt=ev[j+1][0]
    if nxt-ev[j][1]<0.5: ev[j][1]=nxt-0.02
    ev[j][1]=min(ev[j][1],nxt-0.02)
ev[-1][1]=min(ev[-1][1]+0.6,101.2)
def ts(t): h=int(t//3600); m=int(t%3600//60); s=t%60; return f"{h}:{m:02d}:{s:05.2f}"
hdr="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter,58,&H00FFFFFF,&H00FFFFFF,&H64000000,&H64000000,-1,0,0,0,100,100,0,0,3,14,0,2,100,100,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open("subs_en.ass","w") as f:
    f.write(hdr)
    for a,b,tx in ev: f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Sub,,0,0,0,,{{\\fad(80,80)}}{tx}\n")
with open("subs_en.srt","w") as f:
    def s2(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(t*1000)%1000:03d}"
    for n,(a,b,tx) in enumerate(ev,1): f.write(f"{n}\n{s2(a)} --> {s2(b)}\n{tx}\n\n")
for a,b,tx in ev[:5]+ev[-3:]: print(round(a,2),round(b,2),tx)
