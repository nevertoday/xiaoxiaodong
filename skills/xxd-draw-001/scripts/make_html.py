#!/usr/bin/env python3
"""Build one offline HTML painting (p5 + p5.brush embedded) from a validated plan."""
import argparse,html,json,re
from pathlib import Path
from validate_scene import DEFAULT_CANVAS,load_valid
ROOT=Path(__file__).resolve().parents[1]
def script(s):return re.sub(r'</script',r'<\\/script',s,flags=re.I)
def build(scene):
 # Reference file paths and analysis are kept in the plan, not exposed in a public page.
 public={k:scene[k] for k in ['version','title','seed','palette','animation','strokes']}
 public['canvas']=scene.get('canvas',dict(DEFAULT_CANVAS))
 public['brush_settings']=scene.get('brush_settings',{})
 chunks=[]
 for name in ['vendor/p5.min.js','vendor/p5.brush.min.js']:
  chunks.append('<script>'+script((ROOT/'assets'/name).read_text())+'</script>')
 chunks.append('<script>const SCENE='+script(json.dumps(public,ensure_ascii=False))+';\n'+script((ROOT/'assets/brushes.js').read_text())+'\n'+script((ROOT/'assets/motifs.js').read_text())+'\n'+script((ROOT/'assets/engine.js').read_text())+'</script>')
 width,height=public['canvas']['width'],public['canvas']['height'];title=html.escape(scene['title'])
 # Canvas resolution does not redesign the page. The longest display edge
 # stays at 600 CSS pixels, shrinking only when the viewport requires it.
 display_width=600*width/max(width,height)
 return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title>
<!-- p5.js 2.3.3 (LGPL-2.1) + p5.brush 2.2.2 (MIT). Libraries embedded unmodified; licenses retained. -->
<style>
*{{box-sizing:border-box;}}
html,body{{margin:0;min-height:100%;background:#f4efe6;}}
body{{display:grid;place-items:center;min-height:100svh;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}}
.frame{{display:flex;flex-direction:column;gap:12px;min-width:0;width:min(100%,{display_width+16:g}px,calc((100svh - 80px) * {width}/{height} + 16px));}}
#sheet{{padding:8px;background:#fbf8f2;box-shadow:0 12px 28px -18px #2f3a4880,0 1px 3px #2f3a4814;}}
#sheet > #artwork{{display:block;width:100%!important;height:auto!important;aspect-ratio:{width}/{height};}}
#status{{margin:0;min-height:1.3em;text-align:center;font-size:13px;line-height:1.3;letter-spacing:.04em;color:#4b5b8f;}}
#error{{position:fixed;inset:auto 12px 12px;padding:10px;color:#603f32;background:#fff9;max-width:34rem;font:14px/1.5 sans-serif;}}
[hidden]{{display:none!important;}}
</style>
</head><body><main class="frame"><div id="sheet" role="img" aria-label="{title}"></div><p id="status" role="status" aria-live="polite" aria-atomic="true">正在准备画笔…</p></main><div id="error" role="alert" hidden></div><noscript>请启用 JavaScript 以播放绘画动画。</noscript>
<script>window.addEventListener('error',e=>{{document.getElementById('error').hidden=false;document.getElementById('error').textContent='绘画无法启动：'+e.message;}});</script>
{''.join(chunks)}
</body></html>'''
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('plan',help='plan.json written by compose.py')
 p.add_argument('--out',required=True);a=p.parse_args()
 try:content=build(load_valid(a.plan))
 except (ValueError,OSError,TypeError,KeyError) as e:p.exit(2,str(e)+'\n')
 out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(content);print(out)
