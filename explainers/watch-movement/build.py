import pathlib, hashlib
root=pathlib.Path(__file__).parent; d=root/'src'
css=(d/'style.css').read_text(); body=(d/'body.html').read_text()
order=['a_core.js','e_sim.js','b_watch.js','d_lessons.js','d_ops.js','f_ui.js','g_main.js']
js='\n'.join((d/f).read_text() for f in order if (d/f).exists())
html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>How a Mechanical Watch Works · ETA 2824-2 / NH35-class interactive movement</title>
<link rel="icon" href="../../assets/mark.svg" type="image/svg+xml">
<meta name="description" content="Interactive 3D automatic watch movement (ETA 2824-2 / Seiko NH35 class) with a live balance-wheel and escapement model. English / 中文.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script type="importmap">{{"imports":{{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}}}</script>
<style>
{css}
</style></head><body>
{body}
<script type="module">
{js}
</script>
</body></html>'''
(root/'index.html').write_text(html)
(root/'build.md5').write_text(hashlib.md5(html.encode()).hexdigest()+'  index.html\n')
print('built',len(html))
