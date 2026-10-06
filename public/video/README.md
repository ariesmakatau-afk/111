# Hero video

The home page hero plays one of two loops, picked by screen shape:

- `hero-wide.mp4` — computers and tablets (1600×900, from Dropbox "Video 9-5-2026, 11 24 05 am")
- `hero-tall.mp4` — phones (720×1280, from Dropbox "Video 2-8-2025, 12 48 00 pm")

Their first frames are the posters in `public/images/hero-wide.jpg` and
`hero-tall.jpg`, shown until the video can play. Paths live in `heroVideo`
in `lib/site.ts`.

To swap a clip: keep it short (4–10s), silent, under ~4MB, and crossfade the
last second into the first so it loops without a jump. With ffmpeg:

    ffmpeg -i in.mov -filter_complex "[0:v]scale=720:-2,fps=30,format=yuv420p,split[a][b];[a]trim=0.9,setpts=PTS-STARTPTS[m];[b]trim=0:0.9,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=0.9:offset=<LENGTH-1.8>,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -crf 27 -preset slow -movflags +faststart hero-tall.mp4
