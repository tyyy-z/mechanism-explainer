# EV motor + inverter: model fidelity review (v4 §10)

Sheets: `*_sbs.webp` (left = public reference from `refs/REFS.md`, right = `model.html?still` render).
Perf (SwiftShader, overview): 93 draw calls, 384k tris, 11 textures / 6.8 MB. Budget: ≤150 / 1.5M / 64 MB, so it passes.
Audit (`__audit`): no metal without an env map. The "primitives" it lists are RoundedBox/cylinder parts (RoundedBoxGeometry reports as BoxGeometry), so that is a false positive.

| View | Reference | Matches | Gaps / illustrative |
|---|---|---|---|
| weld | hairpin_aufbau | 4-layer hairpin weld end, ±4.5-slot twisted legs, laser-weld beads, phase leads + neutral ring | Bead shape simplified; no insulation strip-back colour change |
| crown | hairpin_stator | Crown basket, slot liners (Nutgrundpapier), laminated stack with weld seams | Crown bend radius is uniform; real crowns vary by layer |
| resolver | resolver_vt5 | VR resolver: toothed stator, coils, 3-lobe rotor, connector | The ref is a cased frameless/housed resolver; ours is the bare stator ring |
| modules | igbt_module | Epoxy module bodies with marked tops, power tabs, Cu baseplates, laminated DC busbars, pin-fin cold plate | 24 discrete-style SiC modules is an illustrative layout (not a specific OEM inverter) |
| cap | film_cap_uncased | Wound film elements (metallised film tone), sprayed ends, case + HV connectors | Capacitance/voltage label is illustrative |
| lam | none (no CC photo of an IPM V-rotor) | 6-pole V-pocket rotor following MotorXP's public description, 48 magnets, 4-segment step skew | Pocket bridges/ribs simplified; skew angle illustrative |

Not modelled yet: reduction gearbox/differential, oil-cooling jets, HV harness beyond the AC busbars.
