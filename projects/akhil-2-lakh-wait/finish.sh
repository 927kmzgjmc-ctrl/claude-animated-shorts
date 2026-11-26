#!/bin/bash
set -e
A=/home/user/akhil; O=/home/user/claude-animated-shorts/akhil-output
V=$A/app/out/final/video_576.mp4
mkdir -p $O
ffmpeg -y -v error -i $V -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 17 -profile:v high -r 30 -an $A/app/out/final/video_1080.mp4
for pair in "bed_novoice:akhil_reel_NO_narration" "mix:akhil_reel_with_guide_voice"; do
  src=${pair%%:*}; dst=${pair##*:}
  ffmpeg -y -v error -i $A/app/out/final/video_1080.mp4 -i $A/audio/$src.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $O/$dst.mp4
done
ls -la $O
