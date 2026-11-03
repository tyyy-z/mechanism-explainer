# REFS — ETA 2824-2 / Seiko NH35-class automatic movement (public sources only)

Units in model: 1 unit = 1 mm. Movement axis = +Y (dial side at −Y, display back / rotor side at +Y). Centre wheel arbor at the origin; crown at −X (3 o'clock seen from the dial).

## Key data (public manufacturer / reference figures)
| item | ETA 2824-2 | Seiko NH35 | model |
|---|---|---|---|
| diameter | 25.60 mm (11½''') | 27.40 mm | plate Ø 25.6 (R 12.8) |
| height | 4.60 mm | 5.32 mm | plate + bridges + rotor ≈ 4.8 |
| frequency | 28,800 A/h (4 Hz) | 21,600 A/h (3 Hz) | `bph` segment 21,600 / 28,800 / 36,000 |
| power reserve | ~38 h (2824-2), ~41 h (NH35) | ~41 h | `BPH[...].res` |
| jewels | 25 | 24 | ruby jewels at every pivot shown in the model |
| lift angle | 50° (timegrapher setting commonly used for ETA 2824) | 53° | `LIFT = 50` |
| escapement | Swiss lever, 20-tooth escape wheel | same | 20 teeth, club-tooth profile, pallet stones |
| balance / spring | Glucydur balance, Nivarox hairspring, Incabloc shock protection | Seiko Diashock | glucy rim + 2 arms, Archimedean hairspring, stud, index |
| winding | bidirectional rotor via reverser wheels | magic lever (Seiko) | reverser wheels + reduction wheel (ETA layout) |
| keyless works | crown, stem, winding pinion, clutch (sliding) pinion, setting lever, yoke | same | all sub-parts modelled under the dial side |
| gear train (illustrative but ratio-correct) | barrel 84 → centre pinion 12; centre 80 → 3rd pinion 10; 3rd 75 → 4th pinion 10; 4th 84 → escape pinion 7 | — | barrel→escape ratio 5040; 4th wheel = 1 rev/min (seconds), centre = 1 rev/h |
| rate tolerance | COSC (ISO 3159): −4 / +6 s/d average for certified chronometers | Seiko spec −20 / +40 s/d | sim `rate` readout, `reg` regulator range ±60 s/d |

Numbers above are from public sources: ETA 2824-2 technical communication (ETA SA, public PDF), Seiko Instruments (TMI) NH35A spec sheet, COSC / ISO 3159, Wikipedia articles "ETA SA", "Lever escapement", "Balance wheel", "Mainspring"; George Daniels, *Watchmaking* (Philip Wilson, 1981/2011); Donald de Carle, *Practical Watch Repairing*. The barrel → escape tooth counts are chosen to give the exact public ratios (1 rev/h centre, 1 rev/min fourth, 8 escape teeth per second at 4 Hz); real ETA tooth counts differ slightly.

## Parts table (§10.1)
| part | what it must show | reference | key dims (mm) | materials | sub-parts |
|---|---|---|---|---|---|
| main plate | round plate, perlage on dial side, pockets for balance/barrel/train, jewel settings | eta2824_wp, eta_close | Ø 25.6, t 1.4 | rhodium-plated brass, perlage normal map | pockets, jewel holes, screw holes, dial feet |
| barrel + bridge | toothed barrel, ratchet + crown wheel on top, bridge with Geneva stripes | stowa_2824, eta2824_longines | barrel Ø ~10.7 | brass barrel, steel ratchet/crown wheel | barrel drum, cover, arbor, mainspring (visible spiral), click |
| train bridge | large bridge over centre/3rd/4th/escape, notch clearing balance | stowa_2824, eta2801 | spans x > −0.7 | rhodium + Côtes de Genève | jewels, blued screws |
| gear train | centre, 3rd, 4th, escape wheels with crossings and pinions | eta2801 | see tooth table | gilt brass wheels, steel pinions | crossings (spokes), pinion leaves, arbors |
| escapement | 20-tooth club escape wheel, pallet fork with 2 ruby stones, banking pins, impulse pin | escapement_jewels, lever | escape Ø ~4.3 | steel, ruby | escape wheel, pallet lever, entry/exit stones, guard pin, bankings |
| balance + hairspring | Glucydur rim with 2 arms, Archimedean hairspring, stud, regulator index, cock with Incabloc | balance_benrus, balance_chinese | rim Ø ~8.8 | Glucydur (gold-tone), blued/silver spring | rim, arms, staff, roller + impulse jewel, hairspring, collet, stud, index arm, cock |
| automatic module | oscillating rotor with sunray finish + engraving, ball-bearing hub, reverser wheels, reduction wheel, auto bridge | eta2824_wp, seiko_7s26 | rotor R ~12.6 | tungsten-weight steel, rhodium | rotor, bearing, 2 reversers, reduction wheel + pinion, bridge, feet |
| keyless + motion works | crown, stem, winding/clutch pinion, setting lever, yoke, minute/hour wheels, date ring | eta_close, seiko_7s26 | crown Ø ~5 | steel, brass | crown (knurled), stem, pinions, levers, cannon pinion, minute wheel, hour wheel, date disc |

## Reference images (Wikimedia Commons; study material for fidelity sheets, resized to ≤1400 px webp)
| file | Commons title | licence / author |
|---|---|---|
| eta2824_wp.webp | File:ETA-2824-A2-WP-de.JPG | CC BY-SA 3.0, de.wikipedia user (self-made) |
| stowa_2824.webp | File:Stowa Antea ETA 2824 macro (3389998183).jpg | CC BY-SA 2.0, Guy Sie (Utrecht) |
| eta2801.webp | File:ETA 2801 mechanical watch movement.jpg | CC BY 2.0, Micky Aldridge |
| eta2824_longines.webp | File:ETA-2824 dans une Longines.jpg | CC BY-SA 4.0, KRaikkonen01 |
| eta_close.webp | File:ETA close.jpg | CC BY-SA 4.0, KRaikkonen01 |
| escapement_jewels.webp | File:Chinese movement escapement and jewels.jpg | CC BY-SA 3.0, Hustvedt |
| balance_chinese.webp | File:Balance wheel Chinese movement.jpg | CC BY-SA 3.0, Hustvedt |
| balance_benrus.webp | File:Benrus Watch Balance Wheel.JPG | Public domain, Chris Burks (Chetvorno) |
| lever.webp | File:Lever of a Watch Lever Escapement.jpg | CC BY 2.0, Micky Aldridge |
| seiko_7s26.webp | File:Seiko 7s26 Movement.jpg | Public domain, "Poor Man watch" |

All URLs: `https://commons.wikimedia.org/wiki/<title>`. No proprietary drawings or non-public data were used.
