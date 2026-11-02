# Fidelity review: Inside 3D NAND (skill §10)

Renders: 1440×810, SwiftShader headless Chrome, current build. References: `../refs/` (sources and licences in `refs/REFS.md`).

| View | Sheet | Verdict | Notes |
|---|---|---|---|
| Array: block / string / page (step 3) | `array_sbs.webp` | **Pass** | Alternating W/SiO₂ word-line tiers, vertical channel holes and slits match the V-NAND and BiCS structure diagrams. So do the staircase contacts and the top-metal bit lines. 12 tiers are modelled; real parts have 100–300+, and the label says so. |
| Charge-trap cell (step 4) | `cell_sbs.webp` | **Pass** | The quarter-cut gate-all-around cell shows the right concentric order. From the centre out: core SiO₂, poly-Si channel, tunnel oxide, SiN trap, blocking oxide, W gate. The layer thicknesses are typical public values. Note: in this capture, three array labels were still fading out from the previous step. |
| CMOS under array (step 2) | `cua_sbs.webp` | **Partial** | The periphery is shown as floorplan blocks under the array: row decoder, page buffer, charge pumps, regulators and FSM. The reference is a CMOS + BEOL cross-section, and the render does not draw transistor or BEOL layers here; the BEOL detail lives in the cell view. This is accepted as an illustrative block view, not a photoreal one. |

Earlier before/after sheets from the first fidelity pass: (before/after captures kept locally, not in the repo).

Perf is within budget (see the README perf table).


Reference images: see `../refs/REFS.md` for source and licence. Sheets that contain them carry the same licence (CC BY-SA / CC BY / CC0 / PD as listed).
