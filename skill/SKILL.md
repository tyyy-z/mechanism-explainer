---
name: mechanism-explainer
description: "Use when the user wants to understand how something works (a mechanism in any field) as an interactive, animated, professional explainer lesson instead of a passive video. Also covers rebuilding a reference explainer video as a live 3D/HTML app, building a from-scratch deep device lesson (e.g. NAND, CPU/GPU running an LLM, a jet engine) from public sources with a linked simulator, the real-device fidelity standard for 3D models (reference pack, no bare primitives, PBR, perf budget), bilingual EN/中文 UI, and packaging several explainers into a hub site on GitHub Pages."
---

# Mechanism Explainer: interactive "how it works" lessons

Turn any mechanism (AI/ML, physics, chemistry, biology, finance, robotics, electronics, software systems, math) into a polished, interactive, self-contained HTML lesson the learner can operate: step-by-step animation, live controls, linked charts, and a check for understanding. Goal: beat an AI-generated explainer video. Video is passive; this lets the learner change inputs and see causes produce effects.

Three modes: **Mode A** (sections 0-7) is a concept lesson with 2D diagrams and sliders. **Mode B** (section 8) rebuilds a reference video as a live 3D app. **Mode C** (section 9) is a from-scratch deep lesson on a device or system: it zooms from the system down to the physics, uses public sources only, and links a simulator to a 3D scene (e.g. NAND flash, CPU/GPU running an LLM, a turbofan engine).

Cross-cutting standards: **section 10, real-device fidelity**, is mandatory for any 3D model of a real object in Mode B or C. A bare shape is a failed build. **Section 11** covers bilingual UI (English default, 中文 toggle). **Section 12** covers packaging several explainers into one hub site on GitHub Pages.

## 0. Principles (non-negotiable)
- **Mechanism first, then math, then examples.** Explain *why* each step happens (cause -> effect), not just *what*.
- **Correctness over flash.** Every number, curve, and animation must come from a real model/formula computed in code, never hand-drawn fakes. If a simplification is used, label it ("simplified: ignores friction").
- **Interactive, not decorative.** Every visual must respond to at least one control. Linked views: changing a slider updates the diagram, the chart, and the readout together.
- **One idea per step.** 4 to 7 steps, each adds exactly one new concept on top of the last.
- **Pick the clearest example for the topic.** Don't default to one industry; vary examples.
- **It must actually work.** Test it before delivering (see step 6).
- **It must look like the real thing.** A 3D model of a real device is judged next to a photo of that device. If it reads as "boxes with labels", it is not done (section 10).

## 1. Scope the lesson
Write a short plan before building:
- Learner level (beginner / intermediate / expert) and language (UI language can be Chinese with English technical terms if the user prefers).
- The one-sentence core mechanism ("Attention = each token takes a weighted average of other tokens, weighted by query-key similarity").
- 4 to 7 steps ("the trail"), each with: concept, what moves on screen, which control the learner uses, what they should notice.
- The real model/equations behind it, and the key variables that become sliders.
- 2 or 3 common misconceptions to address.
For factual topics, verify key facts and formulas from reliable sources (textbooks, docs, papers) and list sources at the end.

## 2. Layout (the professional template)
A single responsive page, desktop-first and usable on phone:
- **Header:** title, one-line "what you'll understand", level badge, est. time.
- **Left rail, "Trail":** numbered steps with progress state (done / current / locked-optional). Keyboard: left/right arrows move steps.
- **Center stage:** the main animated diagram (SVG or Canvas 2D; Three.js only when 3D genuinely helps, like molecules, mechanical parts, fields). Hover tooltips label parts; the active part glows.
- **Right panel, "Controls + Scope":** sliders/toggles/buttons for the step's variables, live numeric readouts with units, and a live chart ("scope") plotting the key quantity over time or vs. a parameter.
- **Below stage, "Why":** 2 to 4 sentences explaining the cause-effect for the current step, plus a collapsible "The math" box (rendered with KaTeX) and a collapsible "Real-world example".
- **Footer per step:** a "Try this" prompt ("Push temperature to 2.0, what happens to the distribution?") and a 1-question quick check with instant feedback.
- **Final step:** summary diagram of the full mechanism, a "Predict, then reveal" challenge, misconceptions busted, sources.

## 3. Visual design system
- Dark, calm theme by default with a light toggle. Background #0b0f17, panels #121826, borders #1f2a3d, text #e6edf7, muted #8b98ad.
- One accent per lesson (e.g. cyan #22d3ee) plus semantic colors: positive #34d399, negative #f87171, warning #fbbf24. Same color = same quantity everywhere (diagram, chart, readout).
- Font: Inter / system-ui; monospace (JetBrains Mono) for numbers and code. Clear hierarchy: 28/20/15/13 px.
- Rounded 12 to 16px panels, soft shadows, 8px spacing grid, generous whitespace.
- Motion: 200 to 600ms easing (ease-in-out cubic), animations show causality (particles flow, arrows pulse along the path that matters). Respect prefers-reduced-motion. Play / pause / step / speed (0.25x to 2x) controls on any time-based animation.
- Accessibility: contrast AA, focus rings, aria-labels on controls, every color-coded thing also labeled in text.

## 4. Build
- Output one self-contained `index.html` (inline CSS/JS; CDN only for well-known libs: KaTeX, Chart.js or D3, Three.js if needed). No build step, works offline once loaded except CDNs.
- Structure the code: `state` object (all variables) -> `simulate(state, t)` pure function (the real model) -> `render()` updates diagram, chart, readouts from state. Controls only mutate state. This guarantees linked views and correctness.
- Use requestAnimationFrame with a fixed timestep for simulations; clamp slider ranges to physically meaningful values; show units.
- Step content lives in a `steps` array (title, text, math, controls visible, highlight targets, tryThis, quiz) so lessons are easy to extend.
- Deep-linkable: `#step=3` opens that step.

## 5. Content quality bar
- Each step's "Why" names the cause and the effect explicitly.
- Include at least one counterintuitive moment the learner discovers by playing (a threshold, resonance, saturation, a phase change, a failure mode).
- Edge cases: show what breaks at extremes (slider at min/max) and explain it.
- Numbers sanity-checked against a known reference value (e.g. a textbook example) and noted in "The math".

## 6. Verify before delivering
- Open it in a headless browser (e.g. Playwright/Chromium) and confirm: no console errors; every step loads; every control changes the diagram, chart and readout; play/pause works; layout OK at 1440px and 390px widths. Take screenshots of 2 or 3 steps and look at them.
- Spot-check 2 computed values against hand calculation.
- Fix and re-test until clean. Never claim it works without this check.

## 7. Deliver
- In Grok Bot: publish it as a Page (canvas) or attach the HTML, with a 1 to 2 line intro and a screenshot. In Codex/CLI: save to `./explainers/<topic-slug>/index.html` and report the path plus how to open it.
- Offer the natural next lesson (the mechanism one level deeper or an adjacent one).

## Optional: export to video
If a shareable video is wanted, record the autoplay mode (all steps, ~8s each) with Playwright's video recording or ffmpeg screen capture to MP4, 1080p, adding captions from each step's "Why" text. Free; no paid AI video service needed.

## 8. Mode B: reproduce a reference video as a live, interactive app
Use when the user gives an example explainer video (often AI-rendered) and wants the same product/lesson rebuilt so it plays like the video AND can be operated by hand.

### 8.1 Be honest about the ceiling
Real-time 3D can match layout, timing, motion and most shapes, but not an AI renderer's painterly outlines, grain and micro-detail. Say this up front, then aim for "same at a glance, better when you touch it". Never claim "100% identical".

### 8.2 Extract a spec from frames (the source of truth)
- Crop to the part that matters (e.g. `ffmpeg -vf crop=W:H:X:Y`). Dump frames every 0.1-0.25 s plus contact sheets (`ffmpeg ... tile=6x4`) and read them.
- If the platform has a video-description helper, get a detailed timeline description first, then confirm everything against the frames yourself.
- Write `SPEC.md` before any code: design grid (e.g. 1024x576 coordinates), exact colors sampled from pixels, fonts (serif/sans/mono), every panel's position, every text string, the 3D camera (orthographic vs. perspective, elevation, yaw), the parts list, and a timeline table of every event to 0.05-0.1 s (hover tooltips, clicks, typing start/end, button state changes, value curves, camera moves, props entering and leaving).
- Leave out watermarks, platform outros and logos that aren't the product; say so.

### 8.3 Architecture that worked
- Split sources (`src/a_core.js` scene/camera/materials, `b_<product>.js` procedural main model, `c_props.js` accessories, `d_lessons.js` the step and timeline data, `e_app.js` UI/state, `f_main.js` loop, `style.css`, `body.html`) plus a tiny `build.py` that inlines everything into ONE self-contained `index.html` (Three.js and fonts from CDN).
- UI is a fixed design stage (e.g. 1024x576) scaled to the window; the 3D canvas fills the window behind it.
- Three modes in one file: autoplay (default, follows the reference timeline), `?interactive` (the learner drives: step list, Run button, explode toggle, sliders and drag), `?capture` (deterministic clock driven from outside, for frame-exact recording).
- The whole timeline is data: `[{t, action, args}]`. The same functions run from the timeline or from the user's clicks, so autoplay and interactive mode never drift apart.
- Live charts (a "scope") come from a real simulated signal in a ring buffer at a fixed rate. Keep the label in sync with the actual window (e.g. "90 samples" if the window shows 90).

### 8.4 Procedural modelling checklist (what makes parts look real)
This is the minimum. The full standard and its review gate are in section 10.
- Build every part from primitives with real proportions measured from the frames (rounded boxes, extrusions, lathe for knobs and pots, tubes along curves for cables). Group parts so they can explode and reassemble.
- Get the material colors right first (they matter more than geometry). Use slightly desaturated, matte materials, a soft key light from one side, a hemisphere fill and soft contact shadows. Keep background marks faint.
- Scale small parts down. First passes almost always make LEDs, shields, chips and connectors too big. Compare side by side and shrink.
- Detail density: add the small stuff (passives, pads, silkscreen text, ribs on knobs, wire stripes, connector housings, screw heads). This is usually the biggest remaining gap.
- Organic parts (leaves, plants, cloth): use broad curved planes with a midrib and soft bend, varied size, angle and tint, and enough count. Never use spiky cones.
- Cables: 3-4 colored wires side by side (ribbon), cream/white plug housings at both ends, a sagging Catmull-Rom path, grown in with a draw-range animation, and plugs that ride the growing end.

### 8.5 Natural motion (the user will notice stiffness immediately)
- Exploded view: never move parts straight up a single axis. Give each part its own outward direction (radial plus a little up), its own X/Y/Z tilt (5-25 deg), staggered start delays (30-80 ms, outermost or most important part first and last back), spring easing with a slight overshoot, and pull the camera back a bit so everything stays framed. Reassemble with the reverse stagger.
- Props enter by dropping with a small bounce and a shadow that grows. They leave by lifting and fading. Never pop in.
- Camera moves are eased dolly and orbit over 0.6-1.2 s, timed to the lesson beat.
- Value changes use S-curves (smoothstep or spring), not linear ramps. Reactive visuals (ring fill, colors, faces, plant droop) are derived from the same value.
- Typing animations are per character with slight jitter. The executing code line is highlighted in sync with the simulated value.

### 8.6 Verify against the reference (loop until close)
- Record the app in `?capture` mode with Playwright/Chromium at the reference resolution and fps (step the clock per frame and screenshot), then encode with ffmpeg.
- Make a side-by-side or stacked `compare.mp4` (reference on top, rebuild below) with `hstack`/`vstack`, and before/after stills at key timestamps (reference / previous version / new version).
- Check: event timing within about 0.3 s, layout overlap, colors, part proportions, no console errors, and interactive mode still works (click every step, Run, explode, drag).
- Keep the previous version (`app_v1/`) when refining, so regressions are easy to see. Report the remaining gaps honestly, ranked by visibility.

### 8.7 Iteration order that worked
1. Layout, text and timeline correct (everything happens at the right moment).
2. Motion feels natural (explode scatter, springs, camera).
3. Model fidelity part by part (colors, then proportions, then detail density).
4. Framing and camera per lesson.
5. Optional look polish (outline pass, subtle grain), only if it doesn't hurt performance.

## 9. Mode C: from-scratch deep mechanism lesson (public sources, structure to structure)
Use when there is no reference video and the user wants a deep "how does this device really work" lesson (memory chip, CPU/GPU, engine, cell biology), explained from the whole system down to the physics. Reuse the Mode B architecture (8.3), motion rules (8.5) and capture tools; the differences are below.

### 9.1 Narrative: zoom from system to physics, one structure per step
- Order the trail by structure: **system** (who sends the command, which interface) -> **subsystem** (the control/periphery blocks that act on it) -> **array/organization** -> **device/cell** (cross-section, materials) -> **operations** (each one walked through the same structures) -> **reliability / limits** (what goes wrong and why).
- Each step names its structure, the signal path through it, and one counterintuitive point that leads into the next step (e.g. "the array sits on top of the CMOS, so erase has to work a different way").
- Data model: `SRC = {key: citation}` plus `STEPS = [{id, title, sub, view, rows (visible controls), scope (default sim tab), run, explode, why, math, try, quiz:{q, opts, a, fb}, src:[keys]}]`. An operation is a list of phases `[{dur, phase text, bias/levels, highlight targets, camera}]` run by one engine, which drives the 3D scene, the scope, the readouts and the "now happening" caption.
- 6-9 steps works for a full device. Each `view` has its own camera preset and visible part groups.

### 9.2 Research: public sources only, cited in-app
- Use only textbooks, papers (with DOI), public standards/specs, vendor press and white papers, and Wikipedia for cross-checking. Every step has a "Sources" tab listing its keys, and every number is labeled "typical public range" or "illustrative".
- If the user works for a company in this field: never use or ask for internal/confidential information, and don't fill gaps with guesses about a specific vendor's process. Teach the generic, public mechanism and say so on the page.
- Physics comes from compact textbook models in one `e_sim.js` (e.g. a tunnelling current law, an RC bit-line discharge, a capacitive coupling ratio), with every constant commented with its source. Distributions use a seeded PRNG so capture is deterministic.

### 9.3 Simulator panel linked to the 3D scene
- One clock, one state: the 3D scene, the scope tabs (bus timing, bias per node, field, level histogram, sense waveform, pulse staircase...) and the numeric readouts all read the same `SIM` / operation state. Never animate the scope separately from the scene.
- Ring buffers sample at a fixed sim rate. A scope caption states what is plotted and over what window; a cursor marks "now". The phase caption text comes from the same phase record.
- Clicking a part (raycast pick) shows a tooltip with its function and typical voltage/size, and highlights the matching scope trace.
- Expose `window.__ready`, `window.__setTime(t)` and `window.__state()` (step, view, op, phase, running, key values) for tests and capture.

### 9.4 Premium UI pass (design-taste-frontend)
- After the lesson works, run the design-taste-frontend skill in app-screen mode: draw a direction, record it in `.taste-skill/direction.json` (tokens, colour budget, type), and restyle CSS/HTML only. Leave the sim and the timeline alone.
- First copy the working build to `v1/` (src + index.html + build.py). Capture `.taste-skill/before/` and `after/` at desktop, tablet and mobile, plus side-by-side stills at key timestamps (`ba/sbs_t<time>.png`), and judge from the pictures.
- Things that read as "premium": tabular mono digits, a restrained accent (a 1px line, not fills), cards darker than the ground, consistent 1px rules, a quiet 3D background, and no emoji or gradient text.

### 9.5 Layout collision checklist (check automatically, not by eye)
Add a `layout_check` to the test script that, for every step and for a few times inside each operation, at 1440 and 390 widths, reads the `getBoundingClientRect()` of every visible label, caption, hint, toast and the projected 3D labels, and fails on:
- any two overlapping text boxes (e.g. a step caption on top of the hint text);
- a toast or popover covering a 3D label or control (put toasts in a reserved corner, or shift them away from labels);
- truncated text: `scrollWidth > clientWidth` or ellipsis on a label that matters;
- a scope time window too short for the full operation (the last phase must still be visible, so size it from the op duration);
- labels outside the stage or behind the panels.
Report anything still failing as a known gap; don't hide it.

### 9.6 Robustness: long builds get interrupted
- Write the sources one file per chunk (`a_core` ... `g_main`) and rebuild after each one, so an interrupted turn loses at most one file. Keep a progress note (`PLAN.md` with done/next) and `build.md5` so a resumed session knows where it stopped.
- Never overwrite the last good build in place: copy it to `v1/` (or `index.prev.html`) first.
- Video capture: pipe frames to ffmpeg with `-movflags +faststart`, retry a frame screenshot that times out, and close stdin and wait for ffmpeg to finish before the turn ends. Then verify with `ffprobe -v error -show_entries format=duration -of csv=p=0 demo.mp4`. A "moov atom not found" error means the file is truncated, so re-capture it. Run long captures in the background with a log.

### 9.7 Verify (all three, every round)
1. `check.py`: open headless (Chromium with SwiftShader WebGL), wait for `__ready`, step through timestamps, save screenshots plus `__state()`, and fail on any console error, warning or page error.
2. `itest.py`: in `?interactive`, click every step, every tab (why/math/example/quiz/sources), every scope tab, Run / Step / Explode, change each control, run each operation to completion (wait until `!running`), and test the keyboard, the theme toggle, drag/zoom and Reset; then run the layout check.
3. `capture.py` -> `demo.mp4` (deterministic `?capture` clock), then ffprobe it and look at stills from it.
4. Fidelity gate (10.5): reference-vs-render sheets for every view, the no-bare-primitive audit and the perf budget (10.6). A failed gate blocks delivery just like a console error.
5. Bilingual check (11.4) if the UI has a language toggle.
Spot-check 2 simulated values by hand (e.g. a transfer time, a coupling ratio) before you say it's done.

## 10. Real-device fidelity standard (mandatory for 3D models of real objects)
The learner should recognise the device from a screenshot with the labels hidden. "A grey box with a texture on top" fails, and so does "a cylinder labelled fan". Plan it like the simulator: research first, then build, then review against references.

### 10.1 Reference pack before any modelling
For every part that appears on screen, collect public references into `refs/` and a `refs/REFS.md` table *before* writing geometry:

| part | what it must show | reference (URL/citation, licence) | key dimensions (source) | materials / colours | sub-parts to model |
|---|---|---|---|---|---|

- Sources: public datasheets and package drawings (mechanical outlines give real mm), teardown photos (iFixit, TechPowerUp, AnandTech, Chips and Cheese), annotated die shots (WikiChip, Fritzchens Fritz on Flickr with CC licence, vendor press kits), cutaway diagrams (manufacturer press images, NASA/FAA handbooks, Wikimedia Commons), textbooks and papers.
- Write proportions down as ratios (e.g. "HBM stack 11 x 11 mm, die 8.6 mm: ratio 0.78"; "fan diameter : nacelle length about 1 : 1.9"), cite where each came from, and put a "scale: real / exaggerated x N / illustrative" note on every part.
- Keep reference images on the box only (study material, `refs/` is git-ignored). Cite them on the page; don't redistribute them unless the licence allows. Never use confidential or employer-internal material, even as a "just for proportions" reference.
- If no public reference exists for a sub-part, model the generic textbook version and label it "illustrative".

### 10.2 Geometry rules: real sub-parts, not paint
- **Every visible sub-part that sticks out in the reference is real 3D geometry**: fins, blades, stators, pins, solder balls, capacitors, inductors, screws, heat-spreader lips, cable ferrules, connector shrouds, gaskets. Use textures only for things that are truly flat in reality (silkscreen, die-shot SRAM fields, printed labels, PCB traces under solder mask).
- **Lessons from the CPU/GPU project:** the CPU core view with flat canvas textures on slabs read as grey and dead, and KV-cache blocks as flat tiles read as UI, not hardware. Fix pattern: give each functional block its own height and material (cache SRAM = finely ruled raised blocks, logic = darker dense cells, register files = small bright blocks, metal stack = thin translucent layers over the active area), add the bump/TSV/C4 layer under the die, and model data structures (KV pages, queues, ROB entries) as physical stacks of slabs or cells with real gaps.
- **No bare primitives.** Every mesh needs at least one of: bevel/rounded edges (`RoundedBoxGeometry`, `ExtrudeGeometry` with `bevelEnabled`), a lathe or extrude profile from the reference (not a default cylinder), surface detail (holes, ribs, pads, fillets), or a reason in REFS.md why a plain shape is accurate (e.g. a die really is a flat rectangle, but then it needs its die-shot texture and edge seal ring).
- **Shapes from profiles:** trace the reference outline as 2D points (a turbine disk profile, a blade airfoil, a package cross-section) and use `LatheGeometry`, `ExtrudeGeometry` or `TubeGeometry` along curves. Blades: a twisted airfoil (lofted sections with chord, twist and camber changing from root to tip), not a flat box.
- **Assemblies match reality:** real counts where they are countable and affordable (fan blades, DIMM chips, HBM stacks, bolt circles, SM count), real stacking order (die, interposer, substrate, balls, board) and real clearances. When you reduce a count for perf, say so ("drawn 36 of ~2,000 BGA balls per row").
- **Fasteners, traces, labels where real devices have them:** screws with heads and slots or hex sockets, safety-wire and bolt flanges on engines, PCB traces and vias, silkscreen reference designators, part-marking text on chips (generic, not a real vendor part number unless it is public and relevant), warning stencils and part labels.
- **Cutaways the way manufacturers draw them:** a clean section plane (`material.clippingPlanes`) with a hatched or lighter cap colour on the cut, the inside parts at full detail and the outer shell at reduced opacity only where it helps.

### 10.3 Materials and lighting (PBR)
- `MeshStandardMaterial` / `MeshPhysicalMaterial` with values from the real material: anodised or bare aluminium (metalness 1, roughness 0.35-0.5, slightly blue-grey), titanium (warm grey, roughness 0.4), nickel superalloy hot section (darker, heat-tinted straw/blue gradient), copper (#b87333), gold pads (#d4af37, metalness 1), FR-4 solder mask (green #1f5f3a or black, roughness 0.55, clearcoat 0.3), silicon die (near-black with iridescent hint: dark blue-violet, roughness 0.2), mold compound (#1a1a1a, roughness 0.8), ceramic caps (tan #c8a27a), composites (dark grey with weave normal map).
- An environment map (`RoomEnvironment` through `PMREMGenerator`) is required for metals; without it metal renders black. Add one key light with shadows, a soft fill and a rim light so silhouettes separate from the dark UI.
- Small procedural normal maps (canvas noise, brushed lines, weave) add the micro-surface that makes metal and plastic read as real. Add subtle edge wear, dirt and heat tint only where the reference shows it.
- Colour-coding for the lesson (signal paths, hot/cold, active block) goes on *top* as emissive glow, flow particles or overlays, so the base materials stay realistic. Turn the coding off and the model should still look like the photo.

### 10.4 Build order for a model
1. Silhouette and proportions from REFS.md (compare the outline overlay with the reference photo at the same camera angle).
2. Major sub-parts as real geometry, in the real stacking order.
3. Materials and environment lighting.
4. Secondary detail: fasteners, edges, ribs, traces, pins.
5. Micro-detail: textures for flat print, normal maps, labels.
6. Lesson overlays (glow, flow, cut planes, explode).

### 10.5 Review gate: no bare primitive, side by side
Run this gate before showing anything to the user:
- `fidelity.py` renders every view (and the exploded and cutaway states) at 1440x810 with labels hidden, and makes `fidelity/<view>_sbs.png`: reference image on the left, render at a matching camera on the right, part names listed underneath. Look at each sheet and write a verdict line in `fidelity/REVIEW.md`: matches / gaps (ranked) / fixed.
- Automated audit (`window.__audit()`): walk the scene graph and list meshes whose geometry type is a raw `BoxGeometry`, `CylinderGeometry`, `SphereGeometry` or `PlaneGeometry` with no bevel, map, normalMap or instancing, larger than 2% of the view's screen area. Each one must be fixed or whitelisted in REFS.md with a reason. Also flag views where more than 60% of visible pixels share one hue (the "grey view" failure) and materials missing an envMap where metalness > 0.5.
- Ask the "labels hidden" question for each view: would someone who knows the device name it? If not, it fails.
- Keep before/after sheets (`ba_model/`) for every fidelity round.

### 10.6 Performance budget (detail must not kill frame rate)
- Targets: 60 fps on a laptop with a discrete or recent integrated GPU, at most about 150 draw calls and 1.5 M triangles per view, at most 64 MB of textures. Expose `window.__perf()` (avg/p95 frame ms, draw calls, triangles, textures, instance count) and log it per view in the tests. SwiftShader numbers are only relative: compare against the previous build and fail on a regression above 1.5x.
- `InstancedMesh` for anything repeated (blades, balls, pins, caps, screws, cells). Merge static geometry per material (`BufferGeometryUtils.mergeGeometries`). Share materials and textures.
- LOD: `THREE.LOD` or per-view visibility, so micro-detail only exists in the views that zoom in on it. Build heavy detail lazily the first time a view opens. Hide groups outside the current view instead of only fading them.
- Shadows only from big casters. Small parts receive but don't cast. Use one shadow map sized to the view, and set `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Rotating parts animate a group transform (one matrix), never re-upload geometry each frame.
- Add a "quality: high / low" switch that drops normal maps, shadows and LOD0 for weak machines.

## 11. Bilingual UI (English default, 中文 toggle)
- All UI strings live in one dictionary: `I18N = {en: {...}, zh: {...}}` and `t(key)`. Step content is bilingual per field: `STEPS[i].title = {en, zh}` and so on for `sub`, `why`, `try`, `quiz`, phase captions, part tooltips and 3D labels. Sources stay in their original language.
- Default is English. The choice comes from `?lang=zh|en`, then `localStorage.lang`, then English. Don't auto-switch from the browser locale unless the user asks. A visible `EN | 中文` toggle in the header sets `<html lang>`, re-renders text and 3D labels in place without resetting the step, sim or camera, and updates deep links.
- Chinese copy: natural Simplified Chinese with English technical terms kept (e.g. "bypass ratio 涵道比", "KV cache"). Numbers, units and formulas are identical in both languages.
- Fonts: Inter + a CJK fallback (`"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`). Chinese text is often shorter but taller, English longer, so run the layout check in both languages.
- Check (`itest.py --lang en|zh`): every key exists in both dictionaries (fail on a missing key or an English string left in zh mode, except whitelisted terms), the toggle keeps state, and `layout_check` passes in both languages at 1440 and 390.

## 12. Hub dashboard + GitHub Pages (packaging several explainers)
### 12.1 Repo layout
```
repo/
  index.html            # hub dashboard (bilingual, default EN)
  assets/               # hub css/js, posters (webp), preview GIF/MP4s (small)
  explainers/<slug>/index.html   # each built, self-contained explainer
  explainers/<slug>/src/ build.py   # sources so others can rebuild
  skill/SKILL.md        # the skill itself (+ README on how to install it)
  docs/                 # screenshots and banner used by README
  README.md  LICENSE  .nojekyll
```
- Every explainer stays self-contained and works from a relative path (no absolute `/workspace` paths, no localhost). CDN libs are pinned to exact versions. Keep large demo MP4s out of git: use a short compressed GIF/WebP/MP4 under ~5 MB per explainer for previews, or GitHub Releases for full videos.
- `.nojekyll` at the root so Pages serves files as-is. Deploy from `main` / root (or a `gh-pages` workflow). Check the live URL after deploy with a headless fetch and a screenshot, and never claim it's live before that.

### 12.2 Hub design
- Design it with design-taste-frontend (record the direction in `.taste-skill/direction.json`), sharing tokens with the explainers so the site feels like one product.
- Content: hero (what this is, one line in each language), a card per explainer (poster render, title, one-line hook, level, time, steps count, "Open" + "Watch 60 s"), a "how these are made" strip (public sources, linked sim, real-device fidelity), a skill install section, and a footer with sources and licence.
- Cards use real renders from the explainers (captured by `fidelity.py`), not stock art. A hover plays a short muted loop (lazy-loaded). Explainers open with the same `?lang=` as the hub.
- Same bilingual rules as section 11. Responsive at 1440 / 768 / 390, layout_check on the hub too, Lighthouse-ish budget (hub under 1 MB before previews, posters lazy).

### 12.3 README that looks finished
- A banner image (a real render collage with the title), badges (live demo, licence, "public sources only", three.js version), a live demo link at the top, a GIF or screenshot per explainer in a table, "What you'll learn" bullets, how to run locally (`python3 -m http.server`), how to rebuild (`python3 build.py`), how to install the skill, and a sources/credits section.
- Before pushing: grep the repo for secrets, absolute local paths, employer names or internal terms, emails, and files over 50 MB. Public repos need the user's explicit OK, and only to the repo they named. Never push to or reorganise repos they told you to leave alone.
