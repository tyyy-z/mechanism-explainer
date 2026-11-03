# Fidelity review — ETA 2824-2 / NH35-class automatic movement (skill §10)

Sheets: `fidelity/<view>_sbs.webp` (reference left, render right, labels hidden, 1440x810 stage).
Audit: pass (0 raw primitives, 0 metal without env, max hue share 0.035). Perf: 54 draw calls, 0.13 M tris, 11.4 MB textures (budget ≤150 calls / 1.5 M tris).

| View | Reference | Matches | Gaps (ranked) | Fixed this round |
|---|---|---|---|---|
| back | refs/eta2824_wp.webp | half-disc rotor with sunray + engraving on a ball-bearing hub, Côtes-de-Genève bridges, blued screws, ruby jewels, crown at 3 o'clock | 1 rotor engraving is generic text, not ETA marks (intentional) 2 rotor sits slightly proud vs. the real 4.6 mm stack | rotor text was mirrored (texture flip); darker rhodium plate + lower exposure (was washed out) |
| norotor | refs/stowa_2824.webp | barrel bridge with ratchet + crown wheel, large ETA-style train bridge with a notch clearing the balance, balance cock + index, reverser / reduction wheels on the auto bridge | 1 bridge outlines are simplified arcs, not ETA's exact contour 2 fewer screws than the photo | train bridge rebuilt as one big plate with a balance notch (the first version was too small; a hole that crossed the chord broke triangulation and covered the balance) ; auto module moved off the balance |
| train | refs/eta2801.webp | barrel, centre, 3rd, 4th, escape wheels with crossings and pinions under ghosted bridges; jewels at each pivot | 1 tooth counts are ratio-correct but not ETA's exact counts (see REFS) | — |
| escape | refs/escapement_jewels.webp | 20-tooth club escape wheel, pallet fork with two ruby stones, impulse jewel on the roller, balance above | 1 no visible banking pins at this angle 2 guard pin very small | side camera so the 4th wheel no longer hides the escape wheel; round 4: per-view exposure .62 + higher/tighter camera (was washed out over the bright perlage) |
| balance | refs/balance_benrus.webp | Glucydur rim + two arms, Archimedean hairspring with collet and stud, regulator index, cock with shock-jewel setting | 1 no timing screws (modern smooth rim, correct for 2824) 2 hairspring has fewer turns than the real ~13 | auto bridge + reverser wheels now ghost with the bridges and no longer cover the rim; round 4: exposure .82 |
| keyless | refs/eta_close.webp | knurled crown, stem, winding + sliding pinion, setting lever, yoke, motion works, date ring | 1 springs of the setting lever are flat strips only | — |
| exploded | refs/seiko_7s26.webp | plate → train → bridges → auto module → rotor pull apart along the axis; dial-side keyless and date ring below | reference is an assembled back view (context only) | camera re-framed on the stack |

Verdict: reads as a real ETA 2824 / NH35-class automatic in every view; no part is a bare shape. Remaining gaps are contour precision and small-part density, listed above.

Reference images: see `../refs/REFS.md` for source and licence. Sheets that contain them carry the same licence (CC BY-SA / CC BY / PD as listed).
