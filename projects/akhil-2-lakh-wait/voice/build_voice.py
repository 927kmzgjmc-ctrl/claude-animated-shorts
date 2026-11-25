import json, subprocess
secs=[k for k,_ in json.load(open("script.json"))]
LEAD=0.5; GAP={"hook":0.55,"card":0.0}; DEF=0.4; PRE={"end":0.25,"card":0.7}
t=LEAD; out=[]; parts=[]; segs=[]
for k in secs:
    t+=PRE.get(k,0)
    subprocess.run(["ffmpeg","-y","-v","error","-i",f"{k}.mp3","-ar","48000","-ac","1",f"{k}.wav"],check=True)
    d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{k}.wav"]))
    w=json.load(open(f"{k}.json"))
    for x in w: out.append({"sec":k,"w":x["w"],"s":round(t+x["s"],3),"e":round(t+x["e"],3)})
    segs.append({"sec":k,"s":round(t,3),"e":round(t+d,3)})
    parts.append((k,t)); t+=d+GAP.get(k,DEF)
total=t+1.6
# mix with adelay
inp=[];flt=[]
for i,(k,st) in enumerate(parts):
    inp+=["-i",f"{k}.wav"]; ms=int(st*1000); flt.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
flt.append("".join(f"[a{i}]" for i in range(len(parts)))+f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{total:.3f}[o]")
subprocess.run(["ffmpeg","-y","-v","error",*inp,"-filter_complex",";".join(flt),"-map","[o]","-ar","48000","-ac","1","voice.wav"],check=True)
json.dump({"total":round(total,3),"segs":segs,"words":out},open("words.json","w"),ensure_ascii=False,indent=0)
print(total); [print(s) for s in segs]
