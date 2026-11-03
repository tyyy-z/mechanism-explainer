# EV motor + inverter — plan / progress (skill v4, Mode C, §10 fidelity)
Slug explainers/ev-motor/, hub id 'ev-motor' (ready:false until it passes the gates).

Trail (7 steps): 1 system: battery DC → inverter → motor → 9.04:1 gearbox → wheels · 2 inverter: 3 half-bridges of 4 parallel SiC modules, DC-link cap, PWM (SVPWM, deadtime) · 3 stator: 54-slot hairpin winding, rotating MMF from 3 phase currents · 4 rotor: IPM V-magnets, magnet + reluctance torque (Ld<Lq), MTPA angle (~53.5° check) · 5 FOC loop: resolver → Clarke/Park → PI on id/iq → inverse Park → SVPWM · 6 torque–speed: base speed, field weakening (voltage ellipse, current circle), power limit · 7 regen + losses: negative iq, efficiency map, thermal.
Sim (e_sim.js): dq model T = 1.5 p [λm iq + (Ld−Lq) id iq], λm from 42 Vpk/krpm, Rs 4.75 mΩ, Vdc 350 V, Imax ~1000 A_rms; Ld/Lq illustrative (state so).
Scopes: phase currents + PWM, dq vector diagram, torque–speed envelope with operating point, efficiency/regen power.

Done: REFS.md data table, 2 Commons refs, src/e_sim.js (dq torque, MTPA/field-weakening envelope with 200 kW cap, SVPWM duty, regen); node check: stall 441 N·m, base ~4,000–4,500 rpm, 200 kW to 18k rpm, regen −181 N·m @ 6k rpm half current.
Next: more refs (rotor lamination, power module, film cap) → a_core (copy watch-movement a_core) → b_motor.js geometry (stator teeth extrude, instanced hairpins, rotor lamination extrude with pockets) → c_inverter.js → e_sim → lessons → itest/fid/hub.
