# Hero video

Drop the spits video here as `spits.mp4` (ideally also `spits.webm`).
The home page hero already points at these names via `heroVideo` in
`lib/site.ts` — until the files exist, the poster photo shows instead.

Recommended: 1920×1080, 8–15s, seamless loop, no audio, <8MB.
Convert + make a near-seamless loop with:

    ffmpeg -i input.mp4 -vf "scale=1920:-2:flags=lanczos,fps=25" \
           -c:v libx264 -crf 26 -preset slow -movflags +faststart \
           -an spits.mp4
