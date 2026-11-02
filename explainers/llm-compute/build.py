import pathlib, hashlib
root=pathlib.Path(__file__).parent; d=root/'src'
css=(d/'style.css').read_text(); body=(d/'body.html').read_text()
order=['a_core.js','e_sim.js','b_board.js','c_core.js','c_sm.js','c_detail.js','d_ops.js','d_lessons.js','f_ui.js','g_main.js']
js='\n'.join((d/f).read_text() for f in order if (d/f).exists())
html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CPU · GPU · LLM tokens: The hardware journey from prompt to next token</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
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
