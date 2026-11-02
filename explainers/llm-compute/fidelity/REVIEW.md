# Fidelity review: LLM token on CPU + GPU (skill §10)

Renders: 1440×810, SwiftShader headless Chrome, current build. References: `../refs/` (sources and licences in `refs/REFS.md`).

| View | Sheet | Verdict | Notes |
|---|---|---|---|
| CPU core (step 2) | `core_sbs.webp` | **Pass, with notes** | The die now sits flip-chip on an organic substrate. It has a C4 bump array (36×17), decoupling caps, a seal ring and a 7-layer BEOL edge strip. The floorplan blocks (front end, OoO scheduler, AVX units, L1/L2) are laid out like the Zen 2 core die shot. Remaining gap: the die surface is flat-shaded blocks, and it lacks the dense SRAM texture and colour of a real die photo. |
| HBM stacks + KV cache (step 7) | `hbm_sbs.webp` | **Pass, with notes** | Each stack is 12 DRAM dies on a base logic die, with TSV columns and micro-bump layers, beside the GPU on an interposer. This matches the HBM section diagram. KV pages are physical blocks on the dies and interleave across the 4 stacks. Weights fill the lower dies. Stack height is deliberately exaggerated (exploded view, about 20× real). 4 stacks are shown; H100 has 5 active, and this is noted in the label. |
| GPU package (step 3) | `gpu_sbs.webp` | **Pass** | The GPU die is surrounded by HBM on an interposer and substrate, like the AMD Fiji package photo. |

Before/after for this round: (before/after captures kept locally, not in the repo) vs (before/after captures kept locally, not in the repo). The old CPU core was a plate with 0.22-high blocks and no package. The old KV cache was coloured tiles on a flat plate.

Perf (desktop, default quality, measured in headless Chrome): 621 draw calls, about 256k triangles. **The draw-call budget (≈150) is not met**, because many static meshes are not merged. Triangles and textures are within budget. Merging static geometry is the follow-up.


Reference images: see `../refs/REFS.md` for source and licence. Sheets that contain them carry the same licence (CC BY-SA / CC BY / CC0 / PD as listed).
