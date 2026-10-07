#!/usr/bin/env python3
"""Validate a motif plan (written by compose.py); never silently drop unknown fields."""
import argparse, json, math, re
from pathlib import Path
DEFAULT_CANVAS={'width':600,'height':600}
# ---- SceneSpec v4: motif grammar of the cxDraw originals -------------------
ROLES=['washes','foliage','accents','highlights']
AREA={'x','y','rx','ry','box','bias','polygon','path','width'}
F4={
 'wash':{'color','opacity'},
 'band':{'y0','y1','color','opacity','wobble'},
 'blob':{'x','y','rx','ry','color','opacity','bleed','texture','rotation','jitter','medium'},
 'leaves':{'x','y','rx','ry','count','colors','size','rotation'},
 'marks':{'area','count','size','aspect','rotation','spin','colors','opacity','depth','batch','light','vertices','loose','petal','flow'},
 'strands':{'area','count','length','angle','spread','sway','colors','weight','rim','brush','depth','light'},
 'glazes':{'area','count','length','angle','colors','weight','field'},
 'line':{'points','color','weight','brush','curvature','field','ruler'},
 'shape':{'points','color','opacity','medium','bleed','texture','hand','deep','pale','glint','flat','light','sharp'},
 'body':{'x','y','length','width','angle','color','opacity','deep','pale','glint','saddle','eye','profile','light'},
 'arcs':{'x','y','count','radius','span','dir','open','squash','colors','weight'},
 'flowers':{'kind','area','count','at','size','depth','accents'},
 'pads':{'area','count','size','depth'},
 'touches':{'area','count','angle','spread','size'},
}
REQUIRED4={'band':['y0','y1','color'],'blob':['x','y','rx','ry','color'],'leaves':['x','y','rx','ry','count'],
 'marks':['area','count'],'strands':['area','count'],'glazes':['area','count'],'line':['points'],
 'shape':['points','color'],'body':['x','y','length','color'],'arcs':['x','y','count'],'pads':['area','count'],'touches':['area','count']}
def check_v4(s):
 errors=[]
 def require(ok,msg):
  if not ok:errors.append(msg)
 def number(v,lo,hi):return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and lo<=v<=hi
 def hexc(c):return isinstance(c,str) and bool(re.fullmatch(r'#[0-9a-fA-F]{6}',c))
 pal=s.get('palette')
 def color(c):
  if hexc(c) or c=='ground':return True
  if not isinstance(c,str) or not isinstance(pal,dict):return False
  role,_,idx=c.partition('.')
  return role in ROLES and isinstance(pal.get(role),list) and (not idx or (idx.isdigit() and int(idx)<len(pal[role])))
 def pt(p):return isinstance(p,list) and len(p)==2 and all(number(v,-.5,1.5) for v in p)
 def rng(v,lo,hi):return number(v,lo,hi) or (isinstance(v,list) and len(v)==2 and all(number(x,lo,hi) for x in v) and v[0]<=v[1])
 require(isinstance(s.get('title'),str) and bool(s.get('title','').strip()),'title required')
 require(isinstance(s.get('seed'),int) and 0<=s.get('seed',-1)<=4294967295,'seed must be uint32')
 c=s.get('canvas',DEFAULT_CANVAS)
 require(isinstance(c,dict) and all(isinstance(c.get(k),int) and 256<=c[k]<=1200 for k in ['width','height']),'canvas width/height integers 256..1200')
 require(isinstance(pal,dict),'palette required')
 if isinstance(pal,dict):
  require(hexc(pal.get('ground')),'palette.ground: #RRGGBB paper colour')
  for role,n in [('washes',3),('foliage',3),('accents',3),('highlights',2)]:
   require(isinstance(pal.get(role),list) and len(pal[role])>=n and all(hexc(x) for x in pal[role]),f'palette.{role}: at least {n} #RRGGBB colours')
  require(not(set(pal)-set(ROLES)-{'ground'}),'palette has unknown roles '+str(set(pal)-set(ROLES)-{'ground'}))
 anim=s.get('animation',{})
 require(isinstance(anim,dict) and number(anim.get('duration_ms'),3000,60000) and number(anim.get('hold_ms',0),0,60000) and isinstance(anim.get('loop'),bool),'animation: duration_ms 3000..60000, hold_ms, loop')
 if isinstance(anim,dict) and 'phrases' in anim:require(isinstance(anim['phrases'],list) and len(anim['phrases'])>=2 and all(isinstance(x,str) and x.strip() for x in anim['phrases']),'animation.phrases: >=2 labels; last is the finished label')
 bs=s.get('brush_settings',{})
 require(isinstance(bs,dict) and not(set(bs)-{'water','coverage','density','scale','soft','glaze','touch','detail','brushSize','vivid','flower'}),'unknown brush_settings')
 for k,v in (bs.items() if isinstance(bs,dict) else []):
  lo,hi=(.3,3) if k in ['brushSize','scale','flower'] else (0,1)
  require(number(v,lo,hi),f'brush_settings.{k} must be {lo}..{hi}')
 ops=s.get('strokes');require(isinstance(ops,list) and bool(ops),'strokes must be a nonempty motif list')
 seen=set()
 for o in ops if isinstance(ops,list) else []:
  if not isinstance(o,dict):errors.append('stroke must be object');continue
  oid,typ=o.get('id'),o.get('type');pre=f'motif {oid}: '
  require(isinstance(oid,str) and oid and oid not in seen,pre+'unique id');seen.add(str(oid))
  if typ not in F4:errors.append(pre+f'unknown type {typ}; use one of {sorted(F4)}');continue
  require(not(set(o)-F4[typ]-{'id','type','object','label','duration','pace','group'}),pre+'unknown fields '+str(set(o)-F4[typ]-{'id','type','object','label','duration','pace','group'}))
  for k in REQUIRED4.get(typ,[]):require(k in o,pre+k+' required')
  for k in ['color']:
   if k in o:require(color(o[k]),pre+f'{k} must be #RRGGBB or a palette role like washes.1 / foliage')
  for k in ['colors','accents']:
   if k in o:require(isinstance(o[k],list) and bool(o[k]) and all(color(x) for x in o[k]),pre+f'{k}: list of #RRGGBB or palette roles')
  if 'count' in o:require(isinstance(o['count'],int) and 1<=o['count']<=400,pre+'count integer 1..400')
  if 'group' in o:require(isinstance(o['group'],int) and 1<=o['group']<=20,pre+'group integer 1..20')
  if 'label' in o:require(isinstance(o['label'],str) and bool(o['label'].strip()),pre+'label must be nonempty text')
  for k,lo,hi in [('opacity',0,255),('bleed',0,.9),('texture',0,1),('rotation',-7,7),('jitter',0,.5),('wobble',0,.2),('angle',-7,7),('spread',0,3.2),('sway',0,.2),('rim',0,1),('spin',0,3.2),('loose',0,1),('duration',60,4000),('pace',.1,5),('hand',0,1)]:
   if k in o:require(rng(o[k],lo,hi),pre+f'{k} must be {lo}..{hi}')
  for k,lo,hi in [('size',.0005,.3),('length',.005,1.5),('weight',.1,8),('aspect',.2,8)]:
   if k in o:require(rng(o[k],lo,hi),pre+f'{k} must be number or [min,max] in {lo}..{hi}')
  for k in ['x','y','y0','y1']:
   if k in o:require(number(o[k],-.5,1.5),pre+k+' normalized')
  for k in ['rx','ry']:
   if k in o:require(number(o[k],.001,1.5),pre+k+' positive normalized')
  if typ=='band':require(number(o.get('y0'),-.5,1.5) and number(o.get('y1'),-.5,1.5) and o['y0']<o['y1'],pre+'band needs y0<y1')
  if 'points' in o:require(isinstance(o['points'],list) and len(o['points'])>=(3 if typ=='shape' else 2) and all(pt(p) for p in o['points']),pre+'points: normalized [[x,y],...]')
  if 'at' in o:require(isinstance(o['at'],list) and bool(o['at']) and all(isinstance(p,list) and len(p) in [2,3] and pt(p[:2]) for p in o['at']),pre+'at: [[x,y,size?],...]')
  if typ=='flowers':
   require(o.get('kind','blossom') in ['blossom','peony','daisy','lily'],pre+'kind: blossom/peony/daisy/lily')
   require('at' in o or ('area' in o and 'count' in o),pre+'flowers need at[] or area+count')
  if 'flow' in o:require(isinstance(o['flow'],dict) and any(k in o['flow'] and pt(o['flow'][k]) for k in ('fan','swirl')),pre+'flow: {fan:[x,y]} or {swirl:[x,y]}')
  if 'profile' in o:require(isinstance(o['profile'],list) and len(o['profile'])==8 and all(number(v,0,2) for v in o['profile']),pre+'profile: 8 half-widths, head to tail')
  for k in ('deep','pale','saddle'):
   if k in o:require(color(o[k]),pre+k+' colour')
  if 'area' in o:
   a=o['area'];ok=isinstance(a,dict) and not(set(a)-AREA)
   if ok and 'box' in a:ok=isinstance(a['box'],list) and len(a['box'])==4 and all(number(v,-.5,1.5) for v in a['box']) and a['box'][0]<a['box'][2] and a['box'][1]<a['box'][3]
   elif ok and 'polygon' in a:ok=isinstance(a['polygon'],list) and len(a['polygon'])>=3 and all(pt(p) for p in a['polygon'])
   elif ok and 'path' in a:ok=isinstance(a['path'],list) and len(a['path'])>=2 and all(pt(p) for p in a['path'])
   elif ok:ok=all(number(a.get(k),-.5,1.5) for k in ['x','y']) and all(number(a.get(k),.001,1.5) for k in ['rx','ry'])
   require(ok,pre+'area: {x,y,rx,ry} | {box:[x0,y0,x1,y1],bias?} | {polygon:[...]} | {path:[...],width?}')
  if 'light' in o and typ in ('shape','body'):
   require(isinstance(o['light'],list) and len(o['light'])==2 and all(number(v,-1.5,1.5) for v in o['light']),pre+'light: [dx,dy] direction toward the light')
  elif 'light' in o:
   l=o['light'];require(isinstance(l,dict) and isinstance(l.get('path'),list) and len(l['path'])>=2 and all(pt(p) for p in l['path']) and number(l.get('reach',.15),.01,1) and all(color(x) for x in l.get('colors',['highlights'])),pre+'light: {path:[[x,y],...], reach?, colors?, chance?}')
  if 'brush' in o:require(o['brush'] in ['flick','rim','marker'],pre+'brush: flick/rim/marker')
  if 'medium' in o:require(o['medium'] in ['wash','fill'],pre+'medium: wash/fill')
 return errors

def check(s):
 if not isinstance(s,dict):return ['Plan must be an object']
 if s.get('version')!=4:return ['version must be 4 (plans are written by compose.py)']
 return check_v4(s)


def load_valid(path):
 s=json.loads(Path(path).read_text())
 if isinstance(s,dict):s.setdefault('canvas',dict(DEFAULT_CANVAS))
 errors=check(s)
 if errors:raise ValueError('\n'.join(errors))
 return s
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('scene');a=p.parse_args()
 try:s=load_valid(a.scene)
 except (ValueError,OSError,TypeError,KeyError) as e:p.exit(2,str(e)+'\n')
 print(f"VALID: {s['title']} · {len(s['strokes'])} strokes")
