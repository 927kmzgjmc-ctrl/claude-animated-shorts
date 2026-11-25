#!/bin/bash
# renders the film in 300-frame chunks (skips finished chunks), then joins them
cd /home/user/akhil/app
export SERVE_URL=$(node -e "import('@remotion/bundler').then(async m=>console.log(await m.bundle({entryPoint:require('path').resolve('src/index.ts')})))" 2>/dev/null | tail -1)
mkdir -p out/final/chunks
TOTAL=3077
for ((a=0; a<TOTAL; a+=300)); do
  b=$((a+299)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=out/final/chunks/c_$(printf %04d $a).mp4
  [ -s $f ] && continue
  echo "chunk $a-$b start $(date +%T)"
  for try in 1 2 3; do
    node render.mjs $f.tmp.mp4 $a $b 1 1 > out/final/chunk_$a.log 2>&1 && mv $f.tmp.mp4 $f && break
    echo "chunk $a failed try $try"; tail -3 out/final/chunk_$a.log
  done
  [ -s $f ] && echo "chunk $a-$b done $(date +%T)" || { echo "CHUNK $a FAILED"; exit 1; }
done
ls out/final/chunks/c_*.mp4 | sed "s|^|file '$PWD/|; s|$|'|" > out/final/list.txt
ffmpeg -y -v error -f concat -safe 0 -i out/final/list.txt -c copy out/final/video_576.mp4 && echo "ALL CHUNKS JOINED"
