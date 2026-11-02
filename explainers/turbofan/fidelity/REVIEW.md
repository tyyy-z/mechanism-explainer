# Fidelity review — CFM56-7B-style turbofan (skill §10)

Sheets: `fidelity/<view>_sbs.webp` (reference left, render right, labels hidden, 1440x810 stage).
Before/after: (before/after captures kept locally, not in the repo) → (before/after captures kept locally, not in the repo). Audit: pass (0 raw primitives >2 %, 0 metal without env, max hue share 0.16). Perf: 58 calls, 0.52 M tris, 1.7 MB textures.

| View | Reference | Matches | Gaps (ranked) | Fixed this round |
|---|---|---|---|---|
| nacelle | refs/ryanair_7.jpg | 737 flattened-bottom fan cowl, TR split line, core cowl + primary nozzle, matt plug | 1 no livery or placards (intentionally generic) 2 inlet lip lacks the polished-ring contrast | core cowl extended to cover LPT/ACC; accessories no longer poke through the cowl |
| front | refs/front_737.jpg | 24 wide-chord swept blades, spinner with spiral mark, rub strip, OGVs behind | 1 blades a touch too bright in shade | spinner tip mark reduced to a thin spiral |
| fan | refs/fan_dsc04641.jpg | blade count, twist, platform/annulus fillers | 1 no blade-root dovetail seen at this angle | — |
| bare | refs/engine_7b26.jpg | olive fan case + ribs, AGB with pads under the case, EEC, harness runs, ACC rings, TRF, plug | 1 harness density still ~40 % of the real engine 2 case colour lighter than photo under studio light | fan case darkened to olive; harness bundles + clamps added; **bug fixed: fan accessory pads were lost (part id collision `acc`)** |
| cutaway | refs/cutaway_5c.jpg | fan, booster, 9-stage HPC, annular combustor, HPT, 4-stage LPT, shafts, hatched cut caps | 1 model show-piece uses chrome finish, ours is service-grey | caps now hatched and muted, less dominant |
| core | refs/core_view.jpg | fan frame struts, HPC case, VSV unison rings, tubes, clamps, bleed ducts | 1 fewer large-bore ducts and brackets than the photo | 16 tubes + clamps + 3 bleed ducts added; ACC tubes now steel, not copper-looking |
| combustor | refs/combustor.jpg | perforated annular liner (cooling-hole rows), dome, swirlers, fuel manifold, heat tint | 1 liner dilution holes not slotted like the photo | close-up camera |
| turbine | refs/hpt_blade.jpg | HPT NGV + cooled blades, LPT stages, case flanges | 1 single-blade film-cooling holes not modelled (instanced blades) | close-up camera |
| exhaust | refs/exhaust.jpg | primary nozzle, matt centre plug, TRF struts | 1 plug cone a little long | — |
| exploded | refs/hbp_engine.jpg | fan / core / LPT modules pull apart on the shafts | reference is a context photo only | — |

Verdict: reads as a real CFM56-7-class engine in every view; no view is a bare shape. Remaining gaps are density/finish, listed above.


Reference images: see `../refs/REFS.md` for source and licence. Sheets that contain them carry the same licence (CC BY-SA / CC BY / CC0 / PD as listed).
