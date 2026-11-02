# mechanism-explainer skill

`SKILL.md` is an agent skill. It works with any agent that reads skill folders: Claude Code / Codex-style `skills/` directories, Cursor rules, and similar. It teaches the agent to turn "how does X work?" into an interactive, self-contained HTML lesson, the way the three lessons in this repo were made.

## Install

```bash
# Codex / Claude Code style
mkdir -p ~/.codex/skills/mechanism-explainer
curl -L https://raw.githubusercontent.com/tyyy-z/mechanism-explainer/main/skill/SKILL.md \
  -o ~/.codex/skills/mechanism-explainer/SKILL.md
```

Or copy `SKILL.md` into whatever folder your agent loads skills from.

## What it covers

| Section | What it covers |
|---|---|
| 0–7 | Mode A: concept lessons with linked 2D diagrams, sliders and a check for understanding |
| 8 | Mode B: rebuild a reference explainer video as a live 3D app |
| 9 | Mode C: a from-scratch deep device lesson from public sources, with a linked simulator |
| 10 | Real-device fidelity: a reference pack, no bare primitives, PBR materials, side-by-side review, a perf budget |
| 11 | Bilingual UI: English by default, 中文 toggle, `?lang=` and localStorage |
| 12 | Packaging several explainers into a hub site on GitHub Pages |

Then ask your agent something like *"explain how a mechanical watch escapement works, as an interactive lesson"*.
