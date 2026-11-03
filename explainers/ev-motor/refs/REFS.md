# REFS — EV rear drive unit, Tesla Model 3 class (IPMSM + SiC inverter), public sources only

Units in model: 1 unit = 1 mm. Motor axis = +X. Status: research started 2026-11-03; geometry not built yet.

## Key data (public figures)
| item | value | source | model use |
|---|---|---|---|
| machine type | interior permanent-magnet synchronous (IPM), 3 pole pairs (6 poles), 3 phases | MotorXP-PM white paper "Performance Analysis of the Tesla Model 3 Electric Motor", June 2020 (teardown of 2018 LR rear unit) | p = 3 in FOC sim |
| stator slots | 54 (q = 3 slots/pole/phase) | MotorXP 2020, Table 1 | 54 slot teeth, real count |
| stator lamination OD / ID | 225 mm / 151.3 mm | MotorXP 2020, Table 1 | stator R 112.5 / 75.65 |
| stack length | 134 mm, stacking factor ~0.95 | MotorXP 2020 | core length 134 |
| end-winding overhang | 40 mm each side | MotorXP 2020, Table 2 | hairpin crown + twisted weld ends |
| turns / parallel paths | 2 turns, 3 parallel paths; R_phase 4.75 mΩ @ 20 °C | MotorXP 2020, Table 2 | R_s in sim |
| rotor OD / ID | 149.9 mm / 70 mm (air gap ≈ 0.7 mm) | MotorXP 2020 | rotor R 74.95 |
| magnet | 33 × 21.5 × 6.5 mm, segmented in 4 (eddy loss), not Halbach | MotorXP 2020 | V-pocket magnets, 4 segments each |
| back-EMF | 42 V_peak (line-line) per krpm | MotorXP 2020 (measured) | λ_m from k_e |
| peak torque / power (motor) | ~430 N·m, ~192 kW at ~1,000 A_rms (sim); public 190–211 kW, 420–450 N·m | MotorXP 2020 + EPA/Electrek 2017 | torque–speed envelope |
| optimal current angle at peak | 53.5° electrical advance (MTPA) | MotorXP 2020 | MTPA check value |
| max speed | ~18,000–19,000 rpm | Weber Auto "Tesla Model 3 and Y Modular Motors" (YouTube) | speed slider max |
| reduction | 31:81 × 24:83 = 9.036:1, ring gear Ø 213 mm, 16 bolts | Weber Auto video | gearbox ghost + wheel speed |
| inverter switches | 24 ST SiC MOSFET modules (STGK026 marking), 4 in parallel per switch position, 6 positions (3 half-bridges) | EE Times China / Ampheo teardown write-ups; System Plus / Munro press | 24 instanced modules on a laminated busbar |
| gate drivers / MCU | 6 × ST STGAP1AS, TI TMS320F28377D; resolver amp ON TCA0372 | EE Times China teardown BOM | labels on control PCB (generic markings) |
| rotor position | variable-reluctance resolver (excitation + sin/cos) | same BOM (resolver amp) | resolver stator + lobed rotor at shaft end |
| hairpin stator | rectangular copper pins, inserted, twisted, laser-welded at the connection end | PEM RWTH Commons images (below); 4th-gen DU teardown note (axtekic) | instanced hairpins, 4–6 layers per slot (illustrative layer count) |

Late units and the exact winding layout vary; anything not in the table is generic textbook IPMSM and labelled "illustrative" in the app. No employer or confidential data.

## Reference images (study material; Wikimedia Commons)
| file | Commons title | licence / author |
|---|---|---|
| hairpin_stator.webp | File:Hairpin-Stator.png | CC BY-SA 4.0, PEM RWTH Aachen |
| hairpin_aufbau.webp | File:Hairpin-Stator Aufbau.png | CC BY-SA 4.0, PEM RWTH Aachen |
TODO: find CC images of an IPM rotor lamination, a SiC/IGBT power module + DC-link film capacitor, and a resolver (Commons search for "Tesla drive unit" returned nothing usable).

## Parts table (§10.1) — to fill as geometry is built
| part | what it must show | reference | key dims (mm) | materials | sub-parts |
|---|---|---|---|---|---|
| stator core | 54 teeth + slots, lamination stack lines, cooling features on OD | MotorXP fig. 3/6 | OD 225, ID 151.3, L 134 | electrical steel (dark grey, ruled normal map) | teeth, slot liners (Nomex), welds/cleats on OD |
| hairpin winding | rectangular pins, crown end + twisted/welded end, phase leads + neutral | hairpin_stator, hairpin_aufbau | overhang 40 | enamelled copper (#b87333, satin), weld beads | instanced pins, 3 phase busbars, terminal lugs |
| rotor | lamination with V-shaped magnet pockets ×6 poles, 4 magnet segments each, skew steps, end plates | MotorXP fig. 4/5 | OD 149.9, ID 70 | steel laminations, NdFeB nickel-plated magnets | shaft, splines, bearings (SKF), balance holes |
| resolver | wound stator ring + lobed rotor (3 lobes) | generic VR resolver (illustrative) | ~Ø 70 | steel, copper | coils, connector |
| inverter | 24 SiC modules on pin-fin cold plate, laminated DC busbar, 3 phase busbars, current sensors, gate-driver PCB, MCU PCB | EE Times China / Ampheo teardown descriptions | — | FR-4, copper, aluminium | modules, busbar, Hall/core sensors, connectors |
| DC-link capacitor | film capacitor block in a potted case | teardown descriptions | — | plastic case, potting | terminals |
| housing + gearbox | ghosted cast-aluminium housing, 2-stage reduction, open diff | Weber Auto | ring Ø 213 | cast Al (rough), steel gears | 31/81/24/83 tooth gears |
