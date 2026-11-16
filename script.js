
const $=s=>document.querySelector(s),root=document.documentElement,rnd=Math.random;
const S={gravity:true,haptics:true,sound:false,magnet:false,bounce:.78,tilt:false,shake:false,mic:false,trails:false,wake:false,gs:1,repel:false,slosh:false,voice:false,cam:false,outline:false,typing:false};
let hue=265;
root.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
try{const j=JSON.parse(localStorage.getItem('mu')||'{}');Object.assign(S,j.S||{});hue=j.hue||hue;if(j.theme)root.dataset.theme=j.theme}catch(e){}
S.tilt=S.shake=S.mic=S.wake=S.voice=S.cam=S.outline=false;S.gs=1;root.style.setProperty('--h',hue);
const save=()=>{try{localStorage.setItem('mu',JSON.stringify({S,hue,theme:root.dataset.theme}))}catch(e){}};
const N=96,TAU=Math.PI*2,names=['Circle','Cookie','Flower','Clover','Burst','Squircle','Pentagon','Gem'];
const poly=k=>t=>{const a=TAU/k;return .45+.55*Math.cos(Math.PI/k)/Math.cos((((t%a)+a)%a)-a/2)};
const fn=[()=>1,t=>1+.07*Math.cos(9*t),t=>1+.2*Math.cos(8*t),t=>1+.3*Math.cos(4*t),
t=>.72+.28*Math.abs((((t*12/TAU)%1)+1)%1-.5)*2,
t=>Math.pow(Math.cos(t)**4+Math.sin(t)**4,-.25),poly(5),poly(6)];
const shapes=fn.map(f=>{const a=Float32Array.from({length:N},(_,i)=>f(i/N*TAU));const m=Math.max(...a);return a.map(v=>v/m)});
const dOf=r=>r.reduce((s,v,i)=>{const t=i/N*TAU;return s+(i?'L':'M')+(Math.cos(t)*v).toFixed(3)+' '+(Math.sin(t)*v).toFixed(3)},'')+'Z';
$('#lp').setAttribute('d',dOf(shapes[1]));
const pal=()=>{const d=root.dataset.theme=='dark',h=hue;return d?[`hsl(${h} 50% 36%)`,`hsl(${h+25} 40% 40%)`,`hsl(${h+70} 45% 42%)`,`hsl(${h} 80% 76%)`]:[`hsl(${h} 85% 84%)`,`hsl(${h+25} 50% 76%)`,`hsl(${h+70} 75% 78%)`,`hsl(${h} 60% 56%)`]};
let P=pal();
/* haptics */
let lb=0,ac,shk=0;
const ios=document.createElement('label');ios.style.cssText='position:fixed;left:-99px;opacity:0;pointer-events:none';ios.innerHTML='<input type="checkbox" switch>';document.body.append(ios);
function buzz(s=.5,p=1,pat){const t=performance.now();if(t-lb<30)return;lb=t;shk=Math.max(shk,s*3.5);
if(S.haptics){try{navigator.vibrate?navigator.vibrate(pat||Math.round(8+s*22)):ios.click()}catch(e){}
try{const g=[...(navigator.getGamepads?navigator.getGamepads():[])].find(g=>g&&g.vibrationActuator);g&&g.vibrationActuator.playEffect('dual-rumble',{duration:35,strongMagnitude:s,weakMagnitude:s*.6}).catch(()=>{})}catch(e){}}
if(S.sound&&ac){const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.frequency.value=180+260*p*(.6+s);g.gain.setValueAtTime(.08*(.3+s),n);g.gain.exponentialRampToValueAtTime(.001,n+.09);o.connect(g).connect(ac.destination);o.start();o.stop(n+.1)}}
addEventListener('pointerdown',()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume()}catch(e){}},{once:false});
/* canvas + bodies */
const cv=$('#cv'),ctx=cv.getContext('2d');let W=0,H=0,unit=50,id=0;const B=[];
function fit(){const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);unit=Math.max(32,Math.min(64,W/9));B.forEach(b=>{b.x=Math.min(Math.max(b.x,b.R),W-b.R);b.y=Math.min(b.y,H-b.R)})}
function spawn(x,y,s,R,vx=0,vy=0){const b={id:id,x,y,vx,vy,R:R*sz/100,R0:R,a:rnd()*TAU,av:(rnd()-.5)*2,s,cur:Float32Array.from(shapes[s]),from:shapes[s],to:shapes[s],m:1,mv:0,sq:0,sqv:0,sqa:0,sc:0,scv:0,g:false,c:id++%4};B.push(b);trim();return b}
function trim(){let n=0,l=0;for(const b of B)b.ch?l++:n++;while(n>24){const i=B.findIndex(b=>!b.ch);B.splice(i,1);n--}while(l>40){const i=B.findIndex(b=>b.ch);B.splice(i,1);l--}}
function typed(k){const b=spawn(W*(.08+rnd()*.84),-20,5,unit*.5,(rnd()-.5)*220,120+rnd()*120);b.ch=k.length>1?k[0]:k;b.c=Math.floor(rnd()*3);b.sqv+=2;buzz(.3,1+rnd()*.4)}
function morph(b,s){b.from=Float32Array.from(b.cur);b.to=shapes[s];b.s=s;b.m=0;b.mv=0}
function seed(){B.length=0;for(let i=0;i<8;i++)spawn(W*(.1+rnd()*.8),H*(.4+rnd()*.4),i,unit*(.7+rnd()*.6),(rnd()-.5)*300,-200*rnd())}
/* pointer */
const ptr={x:-999,y:-999,b:null,t:0,sx:0,sy:0,mv:0,lx:0,ly:0,lt:0,vx:0,vy:0,in:false};
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
cv.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;const[x,y]=pos(e);let hit=null;for(const b of B)if(Math.hypot(b.x-x,b.y-y)<b.R)hit=b;
Object.assign(ptr,{x,y,b:hit,t:performance.now(),sx:x,sy:y,mv:0,lx:x,ly:y,lt:performance.now(),vx:0,vy:0,in:true});
if(hit){hit.g=true;hit.sqv+=2;hit.sqa=0}ptr.done=false;ptr.fired=false;clearTimeout(ptr.lp);ptr.lh=-1;buzz(.35);cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{if(!e.isPrimary)return;const[x,y]=pos(e),n=performance.now(),dt=Math.max((n-ptr.lt)/1000,.008);
ptr.vx=ptr.vx*.5+.5*(x-ptr.lx)/dt;ptr.vy=ptr.vy*.5+.5*(y-ptr.ly)/dt;ptr.mv+=Math.hypot(x-ptr.lx,y-ptr.ly);ptr.lx=ptr.x=x;ptr.ly=ptr.y=y;ptr.lt=n;ptr.in=true});
cv.addEventListener('pointerleave',()=>{if(!ptr.b)ptr.in=false});
const up=()=>{const b=ptr.b,tap=ptr.mv<8&&performance.now()-ptr.t<300;cv.style.cursor='grab';clearTimeout(ptr.lp);
if(b&&ptr.mv<8){const hd=performance.now()-ptr.t;if(hd>550&&hd<3000){pop(b);const bi=B.indexOf(b);bi>-1&&B.splice(bi,1);ptr.done=true;ptr.b=null;buzz(.9,1,[12,40,12]);return}}
if(b){b.g=false;b.vx=Math.max(-2500,Math.min(2500,ptr.vx));b.vy=Math.max(-2500,Math.min(2500,ptr.vy));if(tap){morph(b,(b.s+1)%8);b.sqv+=4;buzz(.7,1.3)}}
else if(tap&&!ptr.done&&ptr.x>-900){spawn(ptr.sx,ptr.sy,pick(),unit*(.7+rnd()*.6));buzz(.6,1.2)}ptr.b=null};
const upp=e=>{pts.delete(e.pointerId);pinch=null;e.isPrimary&&up()};cv.addEventListener('pointerup',upp);cv.addEventListener('pointercancel',upp);
/* physics */
function impact(b,v,ang,fl){const s=Math.min(1,Math.abs(v)/1100);if(Math.abs(v)>90&&!(fl&&Math.abs(v)<140)){b.sqv+=s*6+1;b.sqa=ang;buzz(s,60/b.R+.4)}}
function step(dt,t){const e=S.bounce;G.x+=(G.tx-G.x)*Math.min(1,8*dt);G.y+=(G.ty-G.y)*Math.min(1,8*dt);
for(const b of B){const m=b.R*.9;
if(b.g){b.vx=(ptr.x-b.x)*22;b.vy=(ptr.y-b.y)*22;}else if(E1.on){const n=B.length,i=B.indexOf(b),a=i/n*TAU+E1.t*1.4,r=Math.min(W,H)*.32;b.vx=(W/2+Math.cos(a)*r-b.x)*9;b.vy=(H/2+Math.sin(a)*r-b.y)*9}
else{if(S.gravity){b.vx+=G.x*1500*S.gs*dt;b.vy+=G.y*1500*S.gs*dt}else{b.vx+=Math.sin(t/900+b.id)*60*dt;b.vy+=Math.cos(t/1100+b.id*2)*60*dt;const f=1-.35*dt;b.vx*=f;b.vy*=f}
if((S.magnet||S.repel)&&ptr.in&&!ptr.b){const sg=S.repel?-1:1;const dx=ptr.x-b.x,dy=ptr.y-b.y,d=Math.hypot(dx,dy)+30;b.vx+=sg*dx/d*1400*dt;b.vy+=sg*dy/d*1400*dt;b.vx*=1-1.2*dt;b.vy*=1-1.2*dt}}
b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.av*dt;b.av*=1-.4*dt;
if(b.x<m){b.x=m;if(b.vx<0){impact(b,b.vx,0,S.gravity);b.vx=Math.abs(b.vx)<140&&S.gravity?0:-b.vx*e}}
if(b.x>W-m){b.x=W-m;if(b.vx>0){impact(b,b.vx,0,S.gravity);b.vx=Math.abs(b.vx)<140&&S.gravity?0:-b.vx*e}}
if(b.y<m){b.y=m;if(b.vy<0){impact(b,b.vy,1.57,S.gravity);b.vy=Math.abs(b.vy)<140&&S.gravity?0:-b.vy*e}}
if(b.y>H-m){b.y=H-m;if(b.vy>0){impact(b,b.vy,1.57,S.gravity);b.vy=Math.abs(b.vy)<140&&S.gravity?0:-b.vy*e;if(S.gravity&&!b.g){b.vx*=1-2.5*dt;b.av=b.vx/(b.R*.9)}}}
b.sqv+=(-b.sq*300-b.sqv*11)*dt;b.sq=Math.max(-.4,Math.min(.4,b.sq+b.sqv*dt));
b.scv+=((1-b.sc)*220-b.scv*12)*dt;b.sc+=b.scv*dt;
b.mv+=((1-b.m)*180-b.mv*9)*dt;b.m+=b.mv*dt;
for(let i=0;i<N;i++)b.cur[i]=b.from[i]+(b.to[i]-b.from[i])*b.m}
for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,mn=(a.R+b.R)*.9;
if(d<mn){const nx=dx/d,ny=dy/d,ov=mn-d,ma=a.g?1e6:a.R*a.R,mb=b.g?1e6:b.R*b.R,tm=ma+mb;
a.x-=nx*ov*mb/tm;a.y-=ny*ov*mb/tm;b.x+=nx*ov*ma/tm;b.y+=ny*ov*ma/tm;
const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
if(rv<0){const jj=-(1+e)*rv/(1/ma+1/mb);a.vx-=jj*nx/ma;a.vy-=jj*ny/ma;b.vx+=jj*nx/mb;b.vy+=jj*ny/mb;
if(-rv>60){const s=Math.min(1,-rv/900);a.sqv+=s*5;b.sqv+=s*5;a.sqa=b.sqa=Math.atan2(ny,nx);buzz(s*.8,60/(a.R+b.R)*2+.5)}}}}}
function draw(){if(S.trails){ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over'}else ctx.clearRect(0,0,W,H);shk*=.86;bars();fxDraw();const ox=(rnd()-.5)*shk*2,oy=(rnd()-.5)*shk*2;
for(const b of B){ctx.save();ctx.translate(b.x+ox,b.y+oy);ctx.rotate(b.sqa);ctx.scale(1-b.sq,1+b.sq);ctx.rotate(-b.sqa+b.a);const z=Math.max(b.sc,0)*(1+lvl*1.2)*(1+(b.mz||0));ctx.scale(z,z);
ctx.beginPath();for(let i=0;i<N;i++){const t=i/N*TAU,r=b.cur[i]*b.R;i?ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r):ctx.moveTo(r,0)}
ctx.closePath();ctx.fillStyle=P[b.c];ctx.fill();if(S.outline){ctx.lineWidth=3;ctx.strokeStyle=P[3];ctx.stroke()}
if(b.ch){ctx.fillStyle=P[3];ctx.font='800 '+Math.round(b.R*1.15)+'px Figtree,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.ch,0,b.R*.04)}ctx.restore()}
for(const q of PT){ctx.globalAlpha=Math.max(q.l,0);ctx.fillStyle=P[q.c];ctx.beginPath();ctx.arc(q.x,q.y,q.r*q.l,0,TAU);ctx.fill()}ctx.globalAlpha=1}
let last=performance.now();
function frame(t){const dt=Math.min((t-last)/1000,.033);last=t;ptr.vx*=.92;ptr.vy*=.92;mic();msStep(dt);pad();slosh(dt);wave();hold(dt);music(dt,t);fx(dt,t);for(const q of PT){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.g||900)*dt;q.l-=dt*(q.d||1.5)}PT=PT.filter(q=>q.l>0);step(dt*TS/2,t);step(dt*TS/2,t);draw();hud(t);requestAnimationFrame(frame)}
/* UI */
const pulse=(k,morphIt=true)=>B.forEach((b,i)=>{b.sqv+=3;b.sqa=rnd()*3;if(k=='gravity')b.vy+=S.gravity?0:-450;if(morphIt)setTimeout(()=>morph(b,pick()),i*40)});
const setSw=(k,v)=>{S[k]=v;const w=document.querySelector(`.sw[data-k=${k}]`);w&&w.setAttribute('aria-checked',v)};
document.querySelectorAll('.sw[data-k]').forEach(sw=>{sw.setAttribute('aria-checked',!!S[sw.dataset.k]);sw.onclick=async()=>{const k=sw.dataset.k,v=!S[k];
if(v&&(k=='tilt'||k=='shake')&&!await startMotion())return;
if(v&&k=='mic'&&!await startMic())return;
if(v&&k=='voice'&&!startVoice())return;
if(v&&k=='cam'&&!await startCam())return;
setSw(k,v);if(k=='tilt'){if(v)setSw('gravity',true);else{G.tx=0;G.ty=1}}if(k=='mic'&&!v)stopMic();if(k=='voice'&&!v)rec&&rec.stop();if(k=='cam'&&!v)stopCam();if(k=='wake')wake(v);save();pulse(k);buzz(.45)}});
$('#bn').value=S.bounce*100;$('#bn').oninput=e=>{S.bounce=e.target.value/100;pulse('b',false);save();buzz(.15)};
const th=$('#theme');th.setAttribute('aria-checked',root.dataset.theme=='dark');
th.onclick=()=>{const d=root.dataset.theme!='dark';root.dataset.theme=d?'dark':'light';th.setAttribute('aria-checked',d);P=pal();pulse('t',false);save();buzz(.4)};
[265,345,25,150,200,55].forEach((h,i)=>{const b=document.createElement('button');b.className='seed';b.style.background=`hsl(${h} 70% 55%)`;b.setAttribute('aria-label','Seed color '+(i+1));b.setAttribute('aria-pressed',h==hue);
b.onclick=()=>{hue=h;root.style.setProperty('--h',h);P=pal();document.querySelectorAll('.seed').forEach(x=>x.setAttribute('aria-pressed',x==b));pulse('c',false);save();buzz(.4)};$('#seeds').append(b)});
$('#bSpawn').onclick=()=>{for(let i=0;i<3;i++)setTimeout(()=>{spawn(rnd()*W,-20,pick(),unit*(.7+rnd()*.6),(rnd()-.5)*400,200);buzz(.3,1+i*.2)},i*120)};
$('#bMorph').onclick=()=>B.forEach((b,i)=>setTimeout(()=>{morph(b,(b.s+1+Math.floor(rnd()*6))%8);b.sqv+=4;buzz(.4,1+i/10)},i*70));
$('#bShake').onclick=()=>{B.forEach(b=>{b.vx+=(rnd()-.5)*2400;b.vy-=600+rnd()*900;b.av+=(rnd()-.5)*12});buzz(1)};
$('#bReset').onclick=()=>{seed();buzz(.5)};
names.forEach((n,i)=>{const c=document.createElement('button');c.className='chip';c.setAttribute('aria-pressed','false');
c.innerHTML=`<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><path d="${dOf(shapes[i])}"/></svg>${n}`;
c.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x==c));B.forEach((b,j)=>setTimeout(()=>{morph(b,i);b.sqv+=3;buzz(.3,1+j*.05)},j*45))};$('#lib').append(c)});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.chip,.fab,.ib,.card,.pl');if(!b)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,s=document.createElement('span');
s.className='rp';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;b.append(s);setTimeout(()=>s.remove(),600);buzz(.25)});
/* sensors, mic, extras */
let PT=[],lvl=0,sensing=false,hasTilt=false,shakes=0,lastShake=0,an,md,ms,lm=0,wl,lh=0;
const G={x:0,y:1,tx:0,ty:1},st=m=>{$('#sensor').textContent=m};
async function startMotion(){
const C=window.DeviceMotionEvent&&DeviceMotionEvent.requestPermission?DeviceMotionEvent:window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission?DeviceOrientationEvent:null;
try{if(C&&await C.requestPermission()!='granted'){st('Motion access was denied. Allow it in your browser settings.');return false}}catch(e){st('Motion access needs HTTPS and a tap.');return false}
if(!window.DeviceMotionEvent&&!window.DeviceOrientationEvent){st('This device has no motion sensors.');return false}
if(!sensing){sensing=true;addEventListener('deviceorientation',onOri);addEventListener('devicemotion',onMot);setTimeout(()=>{if(!hasTilt&&S.tilt)st('No tilt data yet. Try moving the phone.')},1500)}
st('Motion on. Tilt to roll shapes, shake to scatter them.');return true}
function onOri(e){if(!S.tilt||e.beta==null)return;hasTilt=true;const r=Math.PI/180,gx=Math.sin(Math.max(-90,Math.min(90,e.gamma))*r),gy=Math.sin(e.beta*r),a=((screen.orientation&&screen.orientation.angle)||window.orientation||0)*r;
G.tx=gx*Math.cos(a)+gy*Math.sin(a);G.ty=-gx*Math.sin(a)+gy*Math.cos(a)}
function onMot(e){if(!S.shake)return;let m;const a=e.acceleration;
if(a&&a.x!=null)m=Math.hypot(a.x,a.y,a.z);else{const g=e.accelerationIncludingGravity;if(!g||g.x==null)return;m=Math.abs(Math.hypot(g.x,g.y,g.z)-9.81)}
const t=performance.now();if(m>15&&t-lastShake>350){lastShake=t;shakes++;shakeShapes(Math.min(2,m/15))}}
function shakeShapes(k=1){B.forEach(b=>{b.vx+=(rnd()-.5)*2200*k;b.vy-=(300+rnd()*800)*k;b.av+=(rnd()-.5)*14*k;b.sqv+=4});buzz(1,1,[20,40,20,40,30])}
async function startMic(){try{ms=await navigator.mediaDevices.getUserMedia({audio:true});ac=ac||new(window.AudioContext||window.webkitAudioContext)();an=ac.createAnalyser();an.fftSize=256;ac.createMediaStreamSource(ms).connect(an);md=new Uint8Array(256);st('Mic on. Clap, blow or shout at the shapes. Audio stays on your device.');return true}catch(e){st('Microphone access was blocked.');return false}}
function stopMic(){ms&&ms.getTracks().forEach(t=>t.stop());an=null}
function mic(){if(!S.mic||!an){lvl*=.9;return}an.getByteTimeDomainData(md);let s=0;for(const v of md)s+=((v-128)/128)**2;lvl+=(Math.min(Math.sqrt(s/md.length)*3,.6)-lvl)*.3;
if(lvl>.3&&performance.now()-lm>500){lm=performance.now();shakeShapes(.6)}}
async function wake(v){try{if(v)wl=await navigator.wakeLock.request('screen');else{wl&&wl.release();wl=null}}catch(e){st('Wake lock isn’t available here.')}}
document.addEventListener('visibilitychange',()=>{if(S.wake&&document.visibilityState=='visible')wake(true)});
function pop(b){for(let i=0;i<16;i++){const a=rnd()*TAU,v=150+rnd()*400;PT.push({x:b.x,y:b.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-150,l:1,c:b.c,r:b.R*(.1+rnd()*.12)})}}
function hud(t){if(t-lh<200)return;lh=t;$('#hud').textContent=`Tilt ${Math.round(Math.atan2(G.x,G.y)*57.3)}°   Shakes ${shakes}   Shapes ${B.filter(b=>!b.ch).length}`}
let lastKey=0;
addEventListener('keydown',e=>{const k=e.key;
if(k.length==1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){lastKey=performance.now();clearTimeout(defer.t);feed(k)}
trackKey(k);idle=performance.now();idleFired=false;
if(S.typing&&k.length==1&&k!=' '&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!(dlg&&dlg.open)){typed(k);return}
if(/INPUT|BUTTON/.test(e.target.tagName))return;
if(k==' '){e.preventDefault();spawn(rnd()*W,-20,pick(),unit*(.7+rnd()*.6),(rnd()-.5)*400,200);buzz(.4)}
else if(k=='s')defer(()=>shakeShapes(1));else if(k=='m')defer(()=>$('#bMorph').click());else if(k=='r')defer(()=>$('#bReset').click());else if(k=='g')defer(()=>setSw('gravity',!S.gravity));else if(k=='b')defer(()=>blast(W/2,H/2));else if(/^[1-8]$/.test(k)){const i=+k-1;B.forEach((b,n)=>setTimeout(()=>morph(b,i),n*40))}
else if(k.startsWith('Arrow')){e.preventDefault();const x=k=='ArrowLeft'?-1:k=='ArrowRight'?1:0,y=k=='ArrowUp'?-1:k=='ArrowDown'?1:0;B.forEach(b=>{b.vx+=x*700;b.vy+=y*700});buzz(.3)}});
const LAB={Tick:[8],Click:[14,30,14],Thud:[45],Heartbeat:[18,70,28,350,18,70,28],Ripple:[8,20,10,20,14,20,18,20,24]};
Object.entries(LAB).forEach(([n,p])=>{const b=document.createElement('button');b.className='btn t';b.textContent=n;b.onclick=()=>{if(navigator.vibrate)navigator.vibrate(p);else st('This browser has no vibration. You still get the shake.');pulse('l',false);shk=6};$('#lab').append(b)});
const fsb=$('#bFs');if(!document.fullscreenEnabled)fsb.hidden=true;
fsb.onclick=()=>document.fullscreenElement?document.exitFullscreen():$('.stage').requestFullscreen().catch(()=>{});
document.addEventListener('fullscreenchange',()=>setTimeout(fit,100));
/* components and interactions */
let pool=[],sz=100,pts=new Map(),pinch=null,lsx=screenX,lsy=screenY,gpb=[],gpOn=0,rec,cam,cx2,vid,pv=null,lt0=0,lastTap={t:0,x:0,y:0};
const pick=()=>pool.length?pool[Math.floor(rnd()*pool.length)]:Math.floor(rnd()*8);
const MO=new Set();
document.querySelectorAll('[data-ms]').forEach(el=>{const[a,b]=el.dataset.ms.split(',').map(Number);el.insertAdjacentHTML('afterbegin',`<svg class="ms" viewBox="-1.1 -1.1 2.2 2.2"><path d="${dOf(shapes[a])}"/></svg>`);el._o={p:el.firstElementChild.firstElementChild,a,b,m:0,v:0,t:0}});
const msTo=(el,t)=>{const o=el._o;if(o){o.t=t;MO.add(o)}};
function msStep(dt){for(const o of MO){o.v+=((o.t-o.m)*180-o.v*9)*dt;o.m+=o.v*dt;const A=shapes[o.a],X=shapes[o.b];o.p.setAttribute('d',dOf(A.map((v,i)=>v+(X[i]-v)*o.m)));if(Math.abs(o.t-o.m)<.002&&Math.abs(o.v)<.02)MO.delete(o)}}
document.querySelectorAll('.ldr').forEach(el=>setInterval(()=>{const o=el._o;o.a=o.b;o.b=(o.b+1)%8;o.m=0;o.v=0;o.t=1;MO.add(o)},900));
const bump=()=>{B.forEach(b=>{b.sqv+=1.5;b.sqa=rnd()*3});if(B.length){const b=B[Math.floor(rnd()*B.length)];morph(b,(b.s+1)%8)}};
const setB=v=>{S.bounce=v;$('#bn').value=v*100};
const SC={party:()=>{setSw('trails',true);setSw('gravity',true);setB(.95);shakeShapes(1.2)},zen:()=>{setSw('gravity',false);setSw('trails',true);setB(.6)},chaos:()=>{setSw('trails',false);setSw('gravity',true);setB(.95);shakeShapes(2);B.forEach((b,i)=>setTimeout(()=>morph(b,pick()),i*40))}};
const MODES={g:()=>{setSw('gravity',true);setSw('magnet',false)},f:()=>{setSw('gravity',false);setSw('magnet',false)},m:()=>{setSw('gravity',false);setSw('magnet',true)}};
const tabs=$('.tabs'),ti=$('.ti');
function selTab(t){tabs.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x==t));ti.style.left=t.offsetLeft+'px';ti.style.width=t.offsetWidth+'px'}
selTab($('.tab'));document.fonts&&document.fonts.ready.then(()=>selTab($('.tab[aria-selected=true]')));addEventListener('resize',()=>selTab($('.tab[aria-selected=true]')));
document.addEventListener('click',e=>{const q=s=>e.target.closest(s);let t;
if(t=q('.sw:not([data-k]):not(#theme)')){if(t.disabled)return;const v=t.getAttribute('aria-checked')!='true';t.setAttribute('aria-checked',v);const m=t.querySelector('[data-ms]');m&&msTo(m,v?1:0);buzz(.4,v?1.2:.9,v?[10,20,16]:[10]);bump()}
else if(t=q('.tg')){const v=t.getAttribute('aria-pressed')!='true';t.setAttribute('aria-pressed',v);t.dataset.ms&&msTo(t,v?1:0);buzz(.4);bump()}
else if(t=q('.bdg')){t.dataset.n=+t.dataset.n+1;spawn(rnd()*W,-20,pick(),unit*(.7+rnd()*.6),(rnd()-.5)*300,200);buzz(.4)}
else if(t=q('.cb')){const v=t.getAttribute('aria-checked')!='true';t.setAttribute('aria-checked',v);if(t.dataset.opt=='hud')$('#hud').hidden=!v;if(t.dataset.opt=='outline')S.outline=v;buzz(.35);bump()}
else if(t=q('.rd')){t.closest('[role=radiogroup]').querySelectorAll('.rd').forEach(r=>r.setAttribute('aria-checked',r==t));B.forEach((b,i)=>setTimeout(()=>{morph(b,+t.dataset.sty);b.sqv+=3},i*40));buzz(.4)}
else if(t=q('.fc')){t.setAttribute('aria-pressed',t.getAttribute('aria-pressed')!='true');pool=[...document.querySelectorAll('.fc[aria-pressed=true]')].map(x=>+x.dataset.s);buzz(.3);bump()}
else if(t=q('.pl .x')){t.parentElement.remove();if(B.length){const b=B[Math.floor(rnd()*B.length)];pop(b);B.splice(B.indexOf(b),1)}buzz(.6,1,[12,40,12])}
else if(t=q('.sg')){SC[t.dataset.scene]();buzz(.7)}
else if(t=q('.grp:not(.sp)>.btn')){t.parentElement.querySelectorAll('.btn').forEach(x=>x.setAttribute('aria-pressed',x==t));buzz(.4);bump()}
else if(t=q('.tab')){selTab(t);MODES[t.dataset.mode]();buzz(.4);bump()}
else if(t=q('.card')){t.setAttribute('aria-expanded',t.getAttribute('aria-expanded')!='true');buzz(.4);bump()}
else if(t=q('[data-a]')){$('#'+t.dataset.a).click();t.closest('.fm').classList.remove('open');$('.fm>.fab').setAttribute('aria-expanded',false)}
else if(t=q('[data-m]')){B.forEach((b,i)=>setTimeout(()=>{morph(b,+t.dataset.m);b.sqv+=3},i*40));$('#mb').setAttribute('aria-expanded',false);buzz(.4)}
else if(t=q('[data-x]')){const v=t.getAttribute('aria-expanded')!='true';t.setAttribute('aria-expanded',v);const f=t.closest('.fm');f&&f.classList.toggle('open',v);buzz(.35);bump()}
if(!q('.mw'))$('#mb').setAttribute('aria-expanded',false)});
document.querySelectorAll('.sl').forEach(s=>{const o=s.nextElementSibling;let lv;const f=()=>{s.style.setProperty('--v',(s.value-s.min)/(s.max-s.min)*100+'%');o.textContent=s.value+'%'};f();
s.oninput=()=>{f();if(s.value!=lv){lv=s.value;buzz(.15,1+s.value/200)}if(s.dataset.sl=='size'){sz=+s.value;B.forEach(b=>b.R=b.R0*sz/100)}else S.gs=s.value/100}});
$('#bCharge').onclick=()=>{const i=$('#lpi');let p=0;const iv=setInterval(()=>{p+=2;i.style.width=p+'%';if(p%25==0)buzz(.3,1+p/100);if(p>=100){clearInterval(iv);shakeShapes(1.2);setTimeout(()=>i.style.width='0',600)}},60)};
const tf=$('#tfi');tf.oninput=e=>{B.forEach(b=>b.sqv+=1);buzz(.08);if(e.data&&performance.now()-lastKey>60){for(const c of e.data)feed(c);if(S.typing&&e.data!=' ')typed(e.data)}};tf.onkeydown=e=>{if(e.key=='Enter'){spawn(rnd()*W,-20,pick(),unit*(.7+rnd()*.6),(rnd()-.5)*300,200);buzz(.5);tf.value=''}};
const sn=$('#snack');function snack(m,u,l){$('#sm').textContent=m;$('#su').textContent=l||'Undo';$('#su').hidden=!u;sn.classList.add('on');clearTimeout(sn.t);sn.t=setTimeout(()=>sn.classList.remove('on'),4000);sn.u=u}
$('#su').onclick=()=>{sn.u&&sn.u();sn.u=null;sn.classList.remove('on');buzz(.5)};
$('#bSnack').onclick=()=>{spawn(W/2,-20,pick(),unit,(rnd()-.5)*300,200);const nb=B[B.length-1];snack('Shape spawned',()=>{pop(nb);const i=B.indexOf(nb);i>-1&&B.splice(i,1)})};
const dlg=$('#dlg');$('#bDlg').onclick=()=>{dlg.showModal();buzz(.5)};$('#dc').onclick=()=>dlg.close();$('#dr').onclick=()=>{dlg.close();$('#bReset').click()};dlg.onclick=e=>{if(e.target==dlg)dlg.close()};
$('#bShare').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'MaterialUs',url:location.href});else{await navigator.clipboard.writeText(location.href);snack('Link copied')}}catch(e){}};
function blast(x,y,k=1){B.forEach(b=>{const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy)||1,f=Math.min(2200,260000/(d+80))*k;b.vx+=dx/d*f;b.vy+=dy/d*f;b.sqv+=3});buzz(.9,.8,[30,30,20])}
const under=(x,y)=>B.slice().reverse().find(b=>Math.hypot(b.x-x,b.y-y)<b.R);
cv.addEventListener('pointerdown',e=>{const p=pos(e);pts.set(e.pointerId,p);
if(pts.size==2&&ptr.b){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,R:ptr.b.R};ptr.mv=99}
else if(e.isPrimary&&ptr.b&&e.pointerType!='mouse')ptr.b.sqv+=(e.pressure||.5)*6});
cv.addEventListener('pointermove',e=>{const p=pos(e);
if(pts.has(e.pointerId)){pts.set(e.pointerId,p);if(pinch&&ptr.b&&pts.size==2){const[a,b]=[...pts.values()],R=Math.max(20,Math.min(140,pinch.R*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d));ptr.b.R=R;ptr.b.R0=R*100/sz;buzz(.05)}}
if(e.pointerType=='mouse'&&!ptr.b)for(const b of B){const h=Math.hypot(b.x-p[0],b.y-p[1])<b.R;if(h&&!b.h){b.sqv+=1.2;b.sqa=Math.atan2(b.y-p[1],b.x-p[0]);buzz(.06)}b.h=h}});
cv.addEventListener('pointerup',e=>{if(!e.isPrimary||ptr.mv>=8)return;const n=performance.now(),d=Math.hypot(ptr.x-lastTap.x,ptr.y-lastTap.y);
if(n-lastTap.t<320&&d<40){const b=under(ptr.x,ptr.y);if(b&&!ptr.done){spawn(b.x+10,b.y-10,b.s,b.R0,300,-400);buzz(.7,1,[12,30,12])}else blast(ptr.x,ptr.y);lastTap.t=0}else lastTap={t:n,x:ptr.x,y:ptr.y}});
cv.addEventListener('contextmenu',e=>{e.preventDefault();if(e.button!=2)return;const[x,y]=pos(e),b=under(x,y);if(b){b.c=(b.c+1)%4;b.sqv+=4;buzz(.5)}else blast(x,y)});
cv.addEventListener('wheel',e=>{const[x,y]=pos(e),b=under(x,y);if(!b)return;e.preventDefault();const R=Math.max(20,Math.min(140,b.R*(1-e.deltaY*.002)));b.R=R;b.R0=R*100/sz;b.sqv+=1;buzz(.08)},{passive:false});
let ly=scrollY;addEventListener('scroll',()=>{const d=scrollY-ly;ly=scrollY;if(Math.abs(d)>2)B.forEach(b=>{b.vy-=d*4;b.sqv+=Math.min(1,Math.abs(d)/80)})},{passive:true});
function slosh(dt){const x=screenX,y=screenY;if(S.slosh&&dt>0){const ax=Math.max(-3000,Math.min(3000,(x-lsx)/dt)),ay=Math.max(-3000,Math.min(3000,(y-lsy)/dt));if(Math.abs(ax)+Math.abs(ay)>5)B.forEach(b=>{b.vx-=ax*2.8*dt;b.vy-=ay*2.8*dt})}lsx=x;lsy=y}
function pad(){const g=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x);if(!g)return;const ax=g.axes[0]||0,ay=g.axes[1]||0;
if(Math.hypot(ax,ay)>.25){G.tx=ax;G.ty=ay;gpOn=1}else if(gpOn){gpOn=0;G.tx=0;G.ty=1}
g.buttons.forEach((b,i)=>{if(b.pressed&&!gpb[i]){if(i==0)$('#bSpawn').click();else if(i==1)shakeShapes(1.2);else if(i==2)$('#bMorph').click();else if(i==3)blast(W/2,H/2,1.3)}gpb[i]=b.pressed})}
function startVoice(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){st('Voice commands aren’t supported in this browser.');return false}
rec=new R();rec.continuous=true;rec.interimResults=false;
rec.onresult=e=>{const w=e.results[e.results.length-1][0].transcript.toLowerCase();st('Heard: '+w.trim());
const C={shake:()=>shakeShapes(1.3),morph:()=>$('#bMorph').click(),spawn:()=>$('#bSpawn').click(),more:()=>$('#bSpawn').click(),reset:()=>$('#bReset').click(),pop:()=>{const b=B[0];if(b){pop(b);B.shift()}},boom:()=>blast(W/2,H/2,1.4),dark:()=>th.getAttribute('aria-checked')!='true'&&th.click(),light:()=>th.getAttribute('aria-checked')=='true'&&th.click(),float:()=>setSw('gravity',false),drop:()=>setSw('gravity',true)};
for(const k in C)if(w.includes(k)){C[k]();break}};
rec.onend=()=>{if(S.voice)try{rec.start()}catch(e){}};
try{rec.start()}catch(e){return false}st('Listening. Say shake, morph, spawn, boom, pop, reset, float, drop, dark or light.');return true}
async function startCam(){try{cam=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:160,height:120}});vid=document.createElement('video');vid.srcObject=cam;vid.muted=true;vid.playsInline=true;await vid.play();const c=document.createElement('canvas');c.width=32;c.height=24;cx2=c.getContext('2d',{willReadFrequently:true});pv=null;st('Camera on. Wave a hand in front of it to push shapes. Video never leaves your device.');return true}catch(e){st('Camera access was blocked.');return false}}
function stopCam(){cam&&cam.getTracks().forEach(t=>t.stop());cam=null}
function wave(){if(!S.cam||!cam)return;cx2.drawImage(vid,0,0,32,24);const d=cx2.getImageData(0,0,32,24).data,cur=new Uint8Array(768);let sx=0,sy=0,n=0;
for(let i=0;i<768;i++){cur[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/3;if(pv&&Math.abs(cur[i]-pv[i])>28){sx+=i%32;sy+=(i/32|0);n++}}pv=cur;
if(n>12){const x=W*(1-sx/n/32),y=H*(sy/n/24),k=Math.min(1,n/150);B.forEach(b=>{const dx=b.x-x,dy=b.y-y,dd=Math.hypot(dx,dy)||1;if(dd<320){const f=(320-dd)*.4*k;b.vx+=dx/dd*f;b.vy+=dy/dd*f;b.sqv+=.3*k}});if(n>120)buzz(.5)}}
/* easter eggs */
const E1={on:0,t:0},E={on:false,n:0,last:0,avg:0,fd:new Uint8Array(256),un:false},aud=new Audio('frontline.mp3'),aud2=new Audio('06__Flat-Out.mp3');
aud.preload='auto';aud2.preload='auto';
/* egg 1: tap Us three times */
let e1n=0,e1t=0;
$('.hero h1 span').addEventListener('click',e=>{const n=performance.now();e1n=n-e1t<900?e1n+1:1;e1t=n;buzz(.25+e1n*.2,1+e1n*.25);B.forEach(b=>b.sqv+=e1n*1.5);if(e1n==3){e1n=0;egg1(e.currentTarget)}});
function egg1(sp){if(E1.on)return;E1.on=1;E1.t=0;sp.classList.add('spin');setTimeout(()=>sp.classList.remove('spin'),1300);
for(let i=B.length;i<18;i++)spawn(rnd()*W,rnd()*H,i%8,unit*(.6+rnd()*.5));
B.forEach((b,i)=>setTimeout(()=>morph(b,i%8),i*60));buzz(.8,1,[20,40,20,40,20,40,30]);
setTimeout(()=>{E1.on=0;blast(W/2,H/2,2.2);shk=14;
for(let i=0;i<90;i++){const a=rnd()*TAU,v=200+rnd()*800;PT.push({x:W/2,y:H/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v-200,l:1,c:i%4,r:4+rnd()*9})}
const h0=hue;let n=0;const iv=setInterval(()=>{hue=(h0+n*5)%360;root.style.setProperty('--h',hue);P=pal();if(++n>72){clearInterval(iv);hue=h0;root.style.setProperty('--h',h0);P=pal()}},60);
buzz(1,1,[60,40,60,40,120]);snack('You found it. Material You, made for Us.',null)},2600)}
/* egg 2: hold a shape for 23 seconds */
cv.addEventListener('pointerdown',()=>{if(ptr.b&&!E.un){E.un=true;aud.muted=true;aud.play().then(()=>{aud.pause();aud.currentTime=0;aud.muted=false}).catch(()=>{E.un=false;aud.muted=false})}});
function hold(dt){if(E1.on)E1.t+=dt;const b=ptr.b;
if(b&&b.g&&!E.on&&!ptr.fired&&(performance.now()-ptr.t)/1000>=23){ptr.fired=true;egg2(b)}if(b&&b.g&&!E.on){const h=(performance.now()-ptr.t)/1000;if(h>6&&h<23){const k=Math.floor(h*2);if(k!=ptr.lh){ptr.lh=k;const p=(h-6)/17;b.sqv+=1+p*3;buzz(.08+p*.5,1+p)}}}}
function egg2(b){if(E.on)return;startTrack('hold',b)}
const TR={hold:{a:aud,title:'Frontline (feat. Matrix)',env:()=>window.FL_ENV,rumble:false},konami:{a:aud2,title:'Flat-Out',env:()=>window.FO_ENV,rumble:true}};
function startTrack(key,b){if(E.on)stopMusic();const T=TR[key],a=T.a;E.cur=T;E.aud=a;E.fake=location.protocol=='file:';E.zero=0;
if(!E.fake)try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();if(!a._an){const m=ac.createMediaElementSource(a);a._an=ac.createAnalyser();a._an.fftSize=512;a._an.smoothingTimeConstant=.7;m.connect(a._an);a._an.connect(ac.destination)}E.an=a._an}catch(e){E.fake=true}
a.currentTime=0;a.play().then(()=>{E.on=true;E.n=0;E.b=b||null;E.h0=hue;E.t0=S.trails;E.rumble=T.rumble;E.kick=0;E.vb=0;setSw('trails',true);$('#np span').textContent='Now playing: '+T.title;$('#np').classList.add('on');
if(T.rumble)root.classList.add('rumble');
if(b){b.sqv+=8;blast(b.x,b.y,.8)}else blast(W/2,H/2,1.1);buzz(1,1,[40,30,40,30,80])}).catch(()=>{snack('Could not play '+T.title+'. Keep the mp3 next to index.html.',null);if(T.rumble)quake(3500)})}
function stopMusic(){const a=E.aud;if(a){a.pause();a.currentTime=0}if(!E.on)return;E.on=false;E.rumble=false;root.classList.remove('rumble');clrRumble();setSw('trails',E.t0);hue=E.h0;root.style.setProperty('--h',hue);P=pal();B.forEach(b=>b.mz=0);$('#np').classList.remove('on')}
aud.onended=aud2.onended=stopMusic;$('#npx').onclick=stopMusic;addEventListener('keydown',e=>{if(e.key=='Escape'&&E.on)stopMusic()});
function spec(f){
if(!E.fake){E.an.getByteFrequencyData(f);let z=0;for(let i=0;i<64;i++)z+=f[i];E.zero=z?0:E.zero+1;if(E.zero<60)return;E.fake=true}
const D=E.cur.env(),t=E.aud.currentTime;
if(!D){for(let i=0;i<256;i++)f[i]=Math.max(0,Math.pow(Math.max(0,Math.sin(t*Math.PI*4)),6)*220*(1-i/256));return}
if(!D.a){const r=atob(D.d);D.a=new Uint8Array(r.length);for(let i=0;i<r.length;i++)D.a[i]=r.charCodeAt(i)}
const fr=Math.min(Math.floor(t*D.fps),D.a.length/D.n-1)*D.n;
for(let i=0;i<256;i++){const p=Math.min(D.n-1.001,Math.pow(i/255,.55)*(D.n-1)),a=Math.floor(p),m=p-a;f[i]=D.a[fr+a]*(1-m)+D.a[fr+a+1]*m}}
function music(dt,t){if(!E.on)return;const f=E.fd;spec(f);const av=(a,z)=>{let q=0;for(let i=a;i<z;i++)q+=f[i];return q/(z-a)/255},bass=av(1,6),hi=av(40,120);E.avg+=(bass-E.avg)*.05;
if(bass>E.avg*1.3&&bass>.45&&t-E.last>230){E.last=t;beat(bass)}
B.forEach((b,i)=>{b.mz=(b.mz||0)+((f[Math.min(255,4+i*5)]/255)*.45+(b===E.b?bass*.4:0)-(b.mz||0))*.4;b.av+=hi*(i%2?1:-1)*dt*6});
if(E.rumble){shakeDom((1+bass*6+E.kick*.4)*(RM?.35:1));E.kick*=.85;if(bass>.4&&t-E.vb>110){E.vb=t;buzz(bass,1,[24])}B.forEach(b=>{b.vx+=(rnd()-.5)*bass*5000*dt;b.vy+=(rnd()-.5)*bass*5000*dt})}}
function beat(s){E.n++;E.kick=s*14;B.forEach(b=>{b.sqv+=2+s*5;b.sqa=rnd()*3});hue=(hue+9)%360;root.style.setProperty('--h',hue);P=pal();
if(E.b&&B.includes(E.b))morph(E.b,(E.b.s+1)%8);
if(E.n%4==0)B.forEach((b,i)=>setTimeout(()=>morph(b,(b.s+1)%8),i*30));
if(E.n%16==0)blast(W/2,H/2,1.2);
const b=B[Math.floor(rnd()*B.length)];b&&pop(b);buzz(.4+s*.6,1,[18])}
function bars(){if(!E.on)return;const n=48,w=W/n;ctx.globalAlpha=.3;ctx.fillStyle=P[3];for(let i=0;i<n;i++){const v=E.fd[2+i*3]/255*H*.45;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(i*w+3,H-v,w-6,v,8);else ctx.rect(i*w+3,H-v,w-6,v);ctx.fill()}ctx.globalAlpha=1}
/* more easter eggs */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let TS=1,idle=performance.now(),idleFired=false,buf='',ks=[];
const X={},Q={until:0},GL='01アイウエオカキクケコ'.split('');
const defer=f=>{clearTimeout(defer.t);defer.t=setTimeout(f,300)};
function shakeDom(a){const o=root.style,r=m=>((rnd()-.5)*2*a*m).toFixed(2);for(let i=1;i<5;i++){o.setProperty('--r'+i+'x',r(1));o.setProperty('--r'+i+'y',r(1));o.setProperty('--r'+i+'r',r(.07))}}
function clrRumble(){for(let i=1;i<5;i++)for(const c of'xyr')root.style.removeProperty('--r'+i+c)}
function quake(ms){Q.until=performance.now()+ms;root.classList.add('rumble');shk=Math.max(shk,10)}
function hueFx(rate,ms){if(!X.hr){X.h0=hue;X.t0=S.trails}X.hr=rate;X.hu=performance.now()+ms;setSw('trails',true)}
function kick(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.22)}catch(e){}}
function fx(dt,t){const n=performance.now();
if(Q.until){const l=Q.until-n;if(l<=0){Q.until=0;if(!E.rumble){root.classList.remove('rumble');clrRumble()}}else if(!E.rumble){shakeDom((RM?.35:1)*(2+7*Math.min(1,l/600)*rnd()));shk=Math.max(shk,4);if(n-(X.kn||0)>120){X.kn=n;buzz(.8,1,[30])}}}
if(X.hr){if(n<X.hu){hue=(hue+X.hr*dt)%360;root.style.setProperty('--h',hue);P=pal()}else{X.hr=0;hue=X.h0;root.style.setProperty('--h',hue);P=pal();setSw('trails',X.t0)}}
if(X.disco){if(n>X.du)X.disco=0;else if(n-(X.beatAt||0)>500){X.beatAt=n;kick();B.forEach((b,i)=>{b.sqv+=3;b.av+=(i%2?1:-1)*6});X.dn=(X.dn||0)+1;if(X.dn%4==0)B.forEach((b,i)=>setTimeout(()=>morph(b,(b.s+1)%8),i*25));buzz(.5,1,[16])}}
if(X.mx&&n>X.mt)X.mx=0;
if(!idleFired&&n-idle>60000){idleFired=true;snack('Still there? The shapes are getting restless.',null);B.forEach((b,i)=>setTimeout(()=>{b.vy-=500;b.sqv+=3},i*80))}}
function fxDraw(){const n=performance.now();
if(X.mx){const fade=Math.min(1,(X.mt-n)/800),cw=16,nc=Math.ceil(W/cw);if(!X.cols||X.cols.length!=nc)X.cols=Array.from({length:nc},()=>rnd()*H);ctx.font='14px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#3dff7a';
for(let i=0;i<nc;i++){X.cols[i]+=(180+(i*37)%160)*.016;if(X.cols[i]>H+200)X.cols[i]=-rnd()*300;for(let k=0;k<12;k++){ctx.globalAlpha=Math.max(0,(1-k/12)*.8*fade);ctx.fillText(GL[Math.floor(rnd()*GL.length)],i*cw+cw/2,X.cols[i]-k*16)}}ctx.globalAlpha=1}
if(X.disco){const a=n/1000;for(let i=0;i<4;i++){const ang=Math.PI/2+Math.sin(a*1.3+i*1.7)*.9,x0=W*(.15+.23*i),dx=Math.cos(ang)*H*1.3,dy=Math.sin(ang)*H*1.3;ctx.globalAlpha=.16;ctx.fillStyle=`hsl(${hue+i*70} 90% 60%)`;ctx.beginPath();ctx.moveTo(x0,0);ctx.lineTo(x0+dx-60,dy);ctx.lineTo(x0+dx+60,dy);ctx.closePath();ctx.fill()}ctx.globalAlpha=1}}
function lowG(){if(X.moon)return;X.moon=1;const g0=S.gs,b0=S.bounce;S.gs=.2;setB(.95);snack('Moon gravity',null);setTimeout(()=>{S.gs=g0;setB(b0);X.moon=0},10000)}
function flipG(){if(X.flip)return;X.flip=1;const g=S.gravity;setSw('gravity',true);G.ty=-1;snack('Gravity flipped',null);setTimeout(()=>{G.ty=1;setSw('gravity',g);X.flip=0},6000)}
function cheats(){let d=$('#eggd');if(!d){d=document.createElement('dialog');d.id='eggd';d.innerHTML='<h3>Secret words</h3><p>Type any of these anywhere on the page. A few more things are hidden that are not listed.</p><div id="egl" style="max-height:50vh;overflow:auto"></div><div class="btns"><button class="btn" id="egc">Close</button></div>';document.body.append(d);d.onclick=e=>{if(e.target==d)d.close()};d.querySelector('#egc').onclick=()=>d.close();$('#egl').innerHTML=Object.entries(CODES).map(([k,v])=>`<p style="margin:6px 0"><b>${k}</b> ${v[0]}</p>`).join('')}d.showModal()}
const CODES={
konami:['Flat-Out plays and every element on the page rumbles',()=>startTrack('konami')],
flatout:['Same as konami',()=>startTrack('konami')],
earthquake:['Rumbles the whole page for a few seconds, no music',()=>quake(4000)],
disco:['Colour spin, spotlights and a kick drum for 10 seconds',()=>{hueFx(300,10000);X.disco=1;X.du=performance.now()+10000;X.dn=0}],
rainbow:['Slow colour sweep with trails',()=>hueFx(80,8000)],
matrix:['Green code rain',()=>{X.mx=1;X.mt=performance.now()+10000;X.cols=null}],
moon:['Low gravity for 10 seconds',lowG],
flip:['Gravity points up for 6 seconds',flipG],
confetti:['Confetti falls from the top',()=>{for(let i=0;i<180;i++)PT.push({x:rnd()*W,y:-10-rnd()*H*.3,vx:(rnd()-.5)*160,vy:rnd()*150,l:1,c:i%4,r:3+rnd()*5,d:.28,g:260});buzz(.6,1,[12,30,12])}],
giant:['Every shape swells and springs back',()=>{B.forEach((b,i)=>setTimeout(()=>{b.sc=2.6;b.scv=0;b.sqv+=3},i*30));buzz(.7)}],
boing:['Every shape gets a random size and wobbles back',()=>{B.forEach(b=>{b.sc=.2+rnd()*2.3;b.scv=0});buzz(.6,1.3,[10,20,14])}],
spin:['Shapes spin like tops',()=>{B.forEach(b=>{b.av+=(rnd()<.5?-1:1)*(25+rnd()*20);b.vy-=700});buzz(.6)}],
slowmo:['Physics at quarter speed for 6 seconds',()=>{TS=.25;snack('Slow motion',null);setTimeout(()=>TS=1,6000)}],
turbo:['Physics at double speed for 6 seconds',()=>{TS=2;snack('Turbo',null);setTimeout(()=>TS=1,6000)}],
boom:['Big shockwave with sparks',()=>{blast(W/2,H/2,2.2);shk=14;for(let i=0;i<90;i++){const a=rnd()*TAU,v=200+rnd()*800;PT.push({x:W/2,y:H/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v-200,l:1,c:i%4,r:4+rnd()*9})}buzz(1,1,[60,40,60])}],
glitch:['Colour glitch for 2 seconds',()=>{if(RM)return;root.classList.add('glitch');shk=10;buzz(.8,1,[10,30,10,30,10]);setTimeout(()=>root.classList.remove('glitch'),2500)}],
hello:['The shapes wave hello',()=>{snack('Hello there!',null);B.forEach((b,i)=>setTimeout(()=>{b.vy-=500;b.sqv+=4;b.sqa=1.57;buzz(.3,1+i*.1)},i*90))}],
party:['Party scene',()=>SC.party()],
zen:['Zen scene',()=>SC.zen()],
chaos:['Chaos scene',()=>SC.chaos()],
cheats:['This list',cheats]};
function feed(c){buf=(buf+c.toLowerCase()).slice(-16);for(const k in CODES)if(buf.endsWith(k)){buf='';CODES[k][1]();return}}
const KS='arrowup,arrowup,arrowdown,arrowdown,arrowleft,arrowright,arrowleft,arrowright,b,a';
function trackKey(k){k=k.toLowerCase();if(['shift','control','alt','meta'].includes(k))return;ks.push(k);if(ks.length>10)ks.shift();if(ks.join()==KS){ks=[];CODES.konami[1]()}}
addEventListener('pointermove',()=>{idle=performance.now();idleFired=false});
addEventListener('pointerdown',()=>{idle=performance.now();idleFired=false;if(!E.un2){E.un2=true;aud2.muted=true;aud2.play().then(()=>{if(!E.on){aud2.pause();aud2.currentTime=0}aud2.muted=false}).catch(()=>{aud2.muted=false})}});
let ln=0,lt=0;$('.logo').addEventListener('click',()=>{const n=performance.now();ln=n-lt<1200?ln+1:1;lt=n;if(ln==5){ln=0;$('.logo').animate([{transform:'rotate(0deg)'},{transform:'rotate(720deg)'}],{duration:900,easing:'cubic-bezier(.34,1.4,.5,1)'});for(let i=0;i<6;i++)setTimeout(()=>spawn(rnd()*W,-20,1,unit*(.6+rnd()*.5),(rnd()-.5)*300,200),i*90);snack('Cookie shower!',null);buzz(.8,1,[20,30,20])}});
let hn=0,ht=0;$('.hero h1').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const n=performance.now();hn=n-ht<900?hn+1:1;ht=n;if(hn==3){hn=0;flipG()}});
console.log('%cMaterialUs','font-weight:800;font-size:16px','Psst. Type "cheats" anywhere on the page.');
new ResizeObserver(fit).observe(cv);fit();seed();requestAnimationFrame(frame);
