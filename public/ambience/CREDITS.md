# Ambience Tracks

Real recorded-style ambience loops for the Focus module, generated
procedurally with FFmpeg (libopus) — no external dependencies, no network
fetches, fully offline-capable and seamlessly loopable.

| File | Label | Recipe |
|------|-------|--------|
| `rain.webm` | Pluie | Pink noise → lowpass 900 Hz + highpass 120 Hz (soft rain on a roof) |
| `waves.webm` | Vagues | Brown noise → lowpass 500 Hz + highpass 80 Hz (distant surf) |
| `brown-noise.webm` | Bruit Brun | Pure brown noise → lowpass 350 Hz (deep-focus rumble) |
| `night-owl.webm` | Nuit Calme | Pink noise bed + two faint high sine shimmer layers with slow tremolo |
| `cafe.webm` | Café Feutré | Pink noise murmur (200-800 Hz) + brown noise swell with slow tremolo |

All tracks: mono-source stereo Opus 40–48 kbps, loop=true in the player.
Regenerate with the ffmpeg commands above if quality needs tuning.
