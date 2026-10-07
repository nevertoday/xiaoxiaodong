/* One isolated document per painting: p5.brush has global renderer state.
 * The plan is a list of motifs (motifs.js) that expand into strokes; each stroke is
 * painted whole into `buf` over the finished `paint`, then revealed along its box. */
let W, H, m, brushScale = null;
// The dials every original was tuned with.
const S = {water:0.55, coverage:0.84, density:0.5, scale:1.1, soft:0.7, glaze:0.3, touch:0.2, detail:0.45, brushSize:1.49, vivid:0.45, flower:1.8, ...SCENE.brush_settings};
function seedFor(value) {
  let h = SCENE.seed >>> 0;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

let paint,buf,canvasEl,strokes=[],idx=0,lastT=-1,started=0,offset=0,cycle=-1;
let paused=false,initialized=false,paintCalls=0;
const totalMs=SCENE.animation.duration_ms,holdMs=SCENE.animation.hold_ms;
const api=window.xxdDraw={ready:false,error:null,renderCount:0};
const phrases=SCENE.animation.phrases??['铺开底色…','完成'];
const statusEl=document.getElementById('status');
function updateStatus(s) {
  // A sticky motif label names the current work; without labels, phrases advance with progress. The last phrase marks completion.
  const label=s?(s.label??phrases[Math.min(phrases.length-2,Math.floor(Math.max(0,lastT)/totalMs*(phrases.length-1)))]):phrases.at(-1);
  if(statusEl.textContent!==label)statusEl.textContent=label;
}
function resetPainting() {
  paint.background(SCENE.palette.ground);
  idx=0; lastT=-1; for(const s of strokes)s.begun=false;
}
function beginStroke(s) {
  buf.clear(); buf.push(); buf.translate(-W/2,-H/2); buf.image(paint,0,0,W,H);
  randomSeed(s.seed); noiseSeed(s.seed); brush.noField(); s.fn(); flushWash(); buf.pop();
  s.begun=true; paintCalls++; api.renderCount=paintCalls;
}
function displayAt(t) {
  t=Math.max(0,Math.min(totalMs,t));
  if(t<lastT)resetPainting();
  while(idx<strokes.length && strokes[idx].start<=t) {
    const s=strokes[idx]; if(!s.begun)beginStroke(s);
    s.progress=Math.min(1,(t-s.start)/s.dur);
    if(s.progress<1)break;
    paint.push();paint.translate(-W/2,-H/2);paint.image(buf,0,0,W,H);paint.pop();idx++;
  }
  push();translate(-W/2,-H/2);image(paint,0,0,W,H);
  const s=strokes[idx];
  if(s?.begun && s.progress>0) {
    const [x0,y0,x1,y1]=s.bb;
    if(s.axis==='x') {const w=Math.round((x1-x0)*s.progress),x=s.dir>0?x0:x1-w;if(w>0&&y1>y0)image(buf,x,y0,w,y1-y0,x,y0,w,y1-y0);}
    else {const h=Math.round((y1-y0)*s.progress),y=s.dir>0?y0:y1-h;if(h>0&&x1>x0)image(buf,x0,y,x1-x0,h,x0,y,x1-x0,h);}
  }
  pop();lastT=t;
  api.time=t;api.progress=t/totalMs;api.activeStroke=s?.id??null;api.stage=s?.stage??'finished';api.completed=idx;
  updateStatus(s);
}
function setup() {
  try {
    W=SCENE.canvas.width;H=SCENE.canvas.height;m=Math.min(W,H);pixelDensity(1);
    const cnv=createCanvas(W,H,WEBGL);cnv.parent('sheet');canvasEl=cnv.elt;canvasEl.id='artwork';canvasEl.setAttribute('aria-label',SCENE.title);
    ensureBrushes(3*m/600);
    paint=createGraphics(W,H,WEBGL);buf=createGraphics(W,H,WEBGL);paint.pixelDensity(1);buf.pixelDensity(1);
    // Keep the GPU surfaces alive but never in the page layout.
    for(const g of [paint,buf]){g.canvas.setAttribute('aria-hidden','true');g.canvas.remove();}
    paint.imageMode(CORNER);buf.imageMode(CORNER);imageMode(CORNER);brush.load(buf);
    // Field creation consumes brush randomness; initialise before any stroke so play and replay match.
    for(const field of new Set([...SCENE.strokes.map(s=>s.field).filter(Boolean),'hand'])){
      randomSeed(seedFor('field:'+field));noiseSeed(seedFor('field:'+field));
      brush.field(field);
    }
    brush.noField();
    buf.push();buf.translate(-W/2,-H/2);fillStyle('#7a86bd',200,0.3,0.5,0.3);brush.circle(W/2,H/2,12);flushWash();buf.pop();buf.clear();
    strokes=expandMotifs(SCENE.strokes);
    let cursor=0;
    const raw=strokes.reduce((sum,s)=>sum+s.dur+s.gap,0),k=totalMs/raw;
    for(const s of strokes){s.start=cursor;s.dur*=k;s.gap*=k;cursor+=s.dur+s.gap;}
    api.timeline=strokes.map(({id,object,stage,label,bb,axis,dir,seed,start,dur,gap})=>({id,object,stage,label,bbox:bb,axis,direction:dir,seed,start,duration:dur,gap}));
    api.seek=ms=>{api.pause();displayAt(ms);return api.progress;};
    api.pause=()=>{offset=Math.max(0,lastT);paused=true;noLoop();};
    api.play=()=>{offset=Math.max(0,lastT);started=millis();cycle=0;paused=false;loop();};
    api.restart=()=>{resetPainting();displayAt(0);offset=0;started=millis();cycle=0;paused=false;loop();};
    api.png=()=>canvasEl.toDataURL('image/png');
    resetPainting();displayAt(0);started=millis();cycle=0;initialized=true;api.ready=true;
    const q=new URLSearchParams(location.search),at=q.get('t');
    if(at!==null)api.seek(Number(at));
    else if(matchMedia('(prefers-reduced-motion: reduce)').matches)api.seek(totalMs);
    document.getElementById('error').hidden=true;
  } catch(e){api.error=e.message;document.getElementById('error').textContent='绘画无法启动：'+e.message;noLoop();throw e;}
}
function draw() {
  if(!initialized||paused)return;
  const elapsed=millis()-started+offset;
  // A slow frame must still finish a non-looping painting.
  if(!SCENE.animation.loop){
    const t=Math.min(totalMs,elapsed);
    if(t!==lastT)displayAt(t);
    if(elapsed>=totalMs)api.pause();
    return;
  }
  const period=totalMs+holdMs,current=Math.floor(elapsed/period);
  if(current!==cycle){resetPainting();cycle=current;}
  const t=Math.min(totalMs,elapsed%period);
  if(t!==lastT)displayAt(t);
}
let resumeOnVisible=false;
document.addEventListener('visibilitychange',()=>{if(!api.ready)return;if(document.hidden){resumeOnVisible=!paused;api.pause();}else if(resumeOnVisible){api.play();resumeOnVisible=false;}});
