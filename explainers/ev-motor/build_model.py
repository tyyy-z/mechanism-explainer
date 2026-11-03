import pathlib
root=pathlib.Path(__file__).parent; d=root/'src'
js='\n'.join((d/f).read_text() for f in ['m_core.js','b_motor.js','c_inverter.js','g_model.js'])
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:,"><title>EV drive unit · model build (dev preview)</title>
<script type="importmap">{{"imports":{{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}}}</script>
<style>html,body{{margin:0;height:100%;background:radial-gradient(120% 90% at 50% 30%,#2a2f37,#0d0f12);overflow:hidden}}#gl{{width:100%;height:100%;display:block}}</style></head>
<body><canvas id="gl"></canvas><script type="module">
{js}
</script></body></html>'''
(root/'model.html').write_text(html); print('built model.html',len(html))
