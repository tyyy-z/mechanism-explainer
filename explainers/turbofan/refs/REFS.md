# REFS — CFM56-7B-class turbofan (public sources only)

Units in model: 1 unit = 10 cm. Engine axis = +X (intake at -X, exhaust at +X). Fan blade leading-edge hub at x=0.

## Key dimensions (Wikipedia "CFM International CFM56", citing Safran CFM56-7B spec PDF 2011 / EASA TCDS E.067)
| item | value | model |
|---|---|---|
| fan diameter | 61 in = 155 cm | tip r 7.75 |
| length (flange-flange) | 250.8 cm | spinner tip -2.6 → TRF aft flange 22.5 (25.1) |
| width / height | 211.8 / 182.9 cm | gearbox + EEC + plumbing envelope |
| fan blades | 24 wide-chord Ti, dovetail root | 24 instanced lofted blades |
| stages | 1 fan + 3 LPC, 9 HPC, annular combustor, 1 HPT, 4 LPT | same; non-fan blade counts reduced/illustrative |
| BPR / OPR | 5.1-5.5 / 32.8 max | sim defaults 5.3 / 32 (takeoff) |
| N1 / N2 100 % | 5175 / 14460 rpm | sim + spool animation (slowed for display) |
| airflow | 307-355 kg/s | sim 340 kg/s SLS takeoff |
| thrust | 91.6-121.4 kN | sim ~118 kN SLS takeoff |
| TSFC takeoff | 0.356-0.386 lb/(lbf h) ≈ 10.1-10.9 g/(kN s) | sim target ~10.5 |

## Parts table (§10.1)
| part | what it must show | reference | key dims (units) | materials | sub-parts |
|---|---|---|---|---|---|
| spinner | conical, dark, white tip mark, bolt ring | engine_7b26, fan_dsc04641 | L 2.6, base r 2.2 | dark painted metal, white tip | cone, aft bolt ring, balance bolts |
| fan | 24 twisted wide-chord blades, high stagger at tip, part-span none (7B) | fan_dsc04641, front_737 | r 2.25→7.70, chord 1.5→2.3 | Ti (metal .9, rough .3) | lofted airfoil, platform, dovetail |
| fan case | thick ring, multiple stiffener ribs + flanges, bolt circles, olive-yellow primer outside, abradable rub strip | engine_7b26, cutaway_5c | r 7.8-8.5, x -1.2→6.2 | painted Al/steel (olive #9aa04a), steel flanges | ribs, flanges, bolt heads, rub strip, acoustic liner |
| OGV / fan frame | ring of outlet guide vanes, 12 thick struts, splitter nose | core_view (right), cutaway_5c | x 3.6-5.0 OGV, struts 5.4-6.6 | Al/composite grey | OGVs, struts, splitter |
| booster LPC | 3 rotor + 4 stator rows behind splitter | cutaway diagrams | r 2.6-4.0, x 2.4-5.0 | Ti | drum, blades, vanes |
| HPC | 9 stages, blades shrink, VIGV+3 VSV with external actuation ring/levers | core_view | x 7.0-12.4, tip r 3.1→2.25 | Ti front / Ni rear | drum, rows, VSV levers + unison ring, case flanges |
| combustor | annular single ring, dome with 20 swirlers, liner with cooling rows, fuel nozzles + manifold | combustor.webp | x 12.6-14.6, r 2.0-3.0 | Ni liner (heat tint), TBC | dome, inner/outer liner, cooling holes (texture), 20 nozzles, manifold + pigtails, igniters |
| HPT | 1 stage NGV + rotor, cooled blades (holes, tip shroudless), heat tint | hpt_blade.webp | x 14.7-15.6, r 2.35-2.95 | Ni single crystal, golden-grey | NGV, blades, disk |
| LPT | 4 stages, flow path growing outward | cutaway_5c | x 15.9-20.0, r 2.6→4.1 | Ni | NGVs, blades, case |
| ACC manifold | many circumferential tubes ringing HPT/LPT case, feed pipe | core_view, cutaway_5c | 9 rings around LPT case | stainless | rings, feed duct, brackets |
| core plumbing | bleed ducts (large bent pipes), fuel/oil tubes, harness | core_view | Ø 0.25-0.6 | steel, braided hose | ducts, tubes, clamps |
| gearbox + accessories | AGB on fan case lower-left, pumps, starter, IDG; EEC box on fan case right | engine_7b26, cutaway_5c | AGB 3.6×1.4×1.2 | Al castings grey-green | housing, pads, pumps, starter, EEC |
| TRF + exhaust | turbine rear frame struts, core nozzle, centre plug (plasma-sprayed coating, matt) | exhaust.webp | nozzle x 20.5-24, plug to 26.5 | Ni, matt grey | struts, nozzle, plug |
| shafts | concentric LP (inner) and HP (outer drum) spools | cutaway diagrams | LP r 0.5, HP r 1.2-1.7 | steel | shafts, bearings |
| nacelle (toggle) | inlet lip, fan cowl, thrust reverser, flattened bottom (737 "hamster pouch") | ryanair_7, front_737 | highlight r 8.3, max r 9.7, exit x 14 | painted white composite, Al lip | inlet, fan cowl, TR sleeve, core cowl |

## Reference images (git-ignored study material, Wikimedia Commons)
| file | Commons title | licence / author |
|---|---|---|
| cutaway_5c.webp | CFM56-5C Mockup Cutaway.jpg | CC BY-SA 3.0 |
| engine_7b26.webp | CFM56-7B26 Engine.jpg | CC BY-SA 4.0, Blervis |
| fan_dsc04641.webp | CFM56 dsc04641.jpg | CC BY-SA 3.0, David Monniaux |
| combustor.webp | CFM56 Annular Combustion Chamber.JPG | CC BY-SA 3.0, Nubifer |
| hpt_blade.webp | CFM56 High Pressure Turbine Blade.JPG | CC BY-SA 3.0, Nubifer |
| core_view.webp | Core view of CFM56 (2).jpg | CC BY-SA 3.0, Ariadacapo |
| hbp_engine.webp | CFM56 High bypass turbofan engine.jpg | CC BY-SA 4.0, Manasseh Diverson |
| ryanair_7.webp | EI-FRP 737 Ryanair CFM56-7 VGO.jpg | CC BY-SA 4.0, Bene Riobó |
| front_737.webp | Front view of a Ryanair's 737-800 turbine..JPG | CC BY-SA 3.0, Fernando Timon |
| exhaust.webp | CMF 56 exhaust system with plasma-sprayed thermal barrier.jpg | CC BY 4.0, Ltosnar |

Illustrative (not published) values: non-fan blade counts (reduced), fuel nozzle count 20, VSV stage count, operating-line schedule, component efficiencies.
