import asyncio, json, sys, os, ssl, edge_tts, edge_tts.communicate as ec
ec._SSL_CTX=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
PX=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
RATE = sys.argv[1] if len(sys.argv)>1 else "+0%"
async def one(k, t):
    c = edge_tts.Communicate(t, "ml-IN-MidhunNeural", rate=RATE, boundary="WordBoundary", proxy=PX)
    words=[]
    with open(f"{k}.mp3","wb") as f:
        async for ch in c.stream():
            if ch["type"]=="audio": f.write(ch["data"])
            elif ch["type"].endswith("Boundary"):
                words.append({"w":ch["text"],"s":ch["offset"]/1e7,"e":(ch["offset"]+ch["duration"])/1e7})
    json.dump(words, open(f"{k}.json","w"), ensure_ascii=False)
async def main():
    for k,t in json.load(open("script.json")): await one(k,t)
asyncio.run(main())
