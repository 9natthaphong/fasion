# FitToday cinematic video pipeline

The homepage wardrobe story uses both user-provided source clips as one
scroll-controlled, silent timeline:

- `public/videos-assets/1.mp4`
- `public/videos-assets/2.mp4`

The originals are preserved unchanged.

## Continuity decision

The last frames of `1.mp4` and first frames of `2.mp4` share the same sunlit
wardrobe wall, camera axis, warm color temperature, and horizontal camera
movement. A direct matched join preserves that authored transition better than a
crossfade. The final master contains no audio, black frame, aspect-ratio change,
or synthetic transition.

## Source metadata

Both source clips are H.264 High Profile, 1280×720, 24 fps, yuv420p, with
8.041667 seconds of video and AAC-LC stereo audio. Their containers are
8.057007 seconds. Neither file declares rotation or a non-default color profile.

## Commands

The concat list contains the two absolute source paths in story order.

```powershell
ffmpeg -hide_banner -loglevel warning -fflags +genpts -f concat -safe 0 -i "scratch/cinematic-pass/video-concat.txt" -map 0:v:0 -an -vf "fps=24,format=yuv420p" -c:v libx264 -preset slow -crf 23 -profile:v high -level 4.0 -g 24 -keyint_min 24 -sc_threshold 0 -movflags +faststart "public/videos-assets/fittoday-wardrobe-story.mp4"
```

The one-second keyframe interval keeps reverse and fast scroll seeking
responsive without upscaling the source footage. CRF 23 reduced the master by
35.3% compared with the inspected CRF 20 candidate; four representative frame
pairs showed no material visual loss, and full-timeline SSIM was 0.986703.

```powershell
ffmpeg -hide_banner -loglevel warning -ss 0.65 -i "public/videos-assets/fittoday-wardrobe-story.mp4" -frames:v 1 -c:v libwebp -quality 82 -compression_level 6 "public/videos-assets/fittoday-wardrobe-story-poster.webp"
```

## Output

- `fittoday-wardrobe-story.mp4`: 16.125 seconds, H.264 High Profile,
  1280×720, 24 fps, yuv420p, no audio, 4,869,401 bytes.
- `fittoday-wardrobe-story-poster.webp`: 1280×720, 38,066 bytes.

The MP4 was checked with `blackdetect` around the join and across the complete
timeline. No black interval was reported.

The homepage starts with `preload="none"` and the 38 KB poster, then makes one
measured `preload="auto"` request for this 4.64 MiB signature film only after
the page `load` event. This avoids blocking the initial page load or cancelling
a metadata range when the warm-up begins. Reduced-motion users keep the
complete poster and normal-flow story without that warm-up. With the full range
buffered, six forward/reverse seeks caused zero failed media requests.
