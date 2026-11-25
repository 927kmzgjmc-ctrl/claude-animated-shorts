# The ₹2 Lakh Wait (Malayalam animated short)

A 102 s vertical short built with the cartoon-short skill (three.js inside Remotion), from the user's Malayalam script.

- `voice/`: the script (`script.json`), Malayalam TTS (edge-tts, ml-IN-MidhunNeural, +10 % rate) and word timings (`words.json`).
- `audio/`: the original synthesized score + SFX, ducked under the voice (`python3 audio.py` → mix.wav, −14 LUFS).
- `app/`: the Remotion project. `src/akhil/story.ts` is the 34-shot plan timed to `words.json`; `world.ts` builds the
  rented room and the Kerala street; `toon.ts`/`ink.ts`/`lensblur.ts`/`grade.ts` come from the bridge template.

Render: `npm install`, copy `voice.wav` to `app/public/`, then `./render_all.sh` (CPU-only: ~6.5 s/frame at 576x1024,
concurrency 1; higher concurrency tiles the frame under SwiftShader). Upscale + mux:
`ffmpeg -i video_576.mp4 -i mix.wav -map 0:v -map 1:a -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 17 -c:a aac -b:a 192k final.mp4`.
