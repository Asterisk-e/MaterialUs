
const $=s=>document.querySelector(s),root=document.documentElement,rnd=Math.random;
const S={gravity:true,haptics:true,sound:false,magnet:false,bounce:.78,tilt:false,shake:false,mic:false,trails:false,wake:false};
let hue=265;
root.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
try{const j=JSON.parse(localStorage.getItem('mu')||'{}');Object.assign(S,j.S||{});hue=j.hue||hue;if(j.theme)root.dataset.theme=j.theme}catch(e){}
S.tilt=S.shake=S.mic=S.wake=false;root.style.setProperty('--h',hue);
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
function spawn(x,y,s,R,vx=0,vy=0){B.push({id:id,x,y,vx,vy,R,a:rnd()*TAU,av:(rnd()-.5)*2,s,cur:Float32Array.from(shapes[s]),from:shapes[s],to:shapes[s],m:1,mv:0,sq:0,sqv:0,sqa:0,sc:0,scv:0,g:false,c:id++%4});if(B.length>24)B.shift()}
function morph(b,s){b.from=Float32Array.from(b.cur);b.to=shapes[s];b.s=s;b.m=0;b.mv=0}
function seed(){B.length=0;for(let i=0;i<8;i++)spawn(W*(.1+rnd()*.8),H*(.4+rnd()*.4),i,unit*(.7+rnd()*.6),(rnd()-.5)*300,-200*rnd())}
/* pointer */
const ptr={x:-999,y:-999,b:null,t:0,sx:0,sy:0,mv:0,lx:0,ly:0,lt:0,vx:0,vy:0,in:false};
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
cv.addEventListener('pointerdown',e=>{const[x,y]=pos(e);let hit=null;for(const b of B)if(Math.hypot(b.x-x,b.y-y)<b.R)hit=b;
Object.assign(ptr,{x,y,b:hit,t:performance.now(),sx:x,sy:y,mv:0,lx:x,ly:y,lt:performance.now(),vx:0,vy:0,in:true});
if(hit){hit.g=true;hit.sqv+=2;hit.sqa=0}ptr.done=false;clearTimeout(ptr.lp);if(hit)ptr.lp=setTimeout(()=>{if(ptr.b===hit&&ptr.mv<8){pop(hit);B.splice(B.indexOf(hit),1);ptr.b=null;ptr.done=true;buzz(.9,1,[12,40,12])}},550);buzz(.35);cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{const[x,y]=pos(e),n=performance.now(),dt=Math.max((n-ptr.lt)/1000,.008);
ptr.vx=ptr.vx*.5+.5*(x-ptr.lx)/dt;ptr.vy=ptr.vy*.5+.5*(y-ptr.ly)/dt;ptr.mv+=Math.hypot(x-ptr.lx,y-ptr.ly);ptr.lx=ptr.x=x;ptr.ly=ptr.y=y;ptr.lt=n;ptr.in=true});
cv.addEventListener('pointerleave',()=>{if(!ptr.b)ptr.in=false});
const up=()=>{const b=ptr.b,tap=ptr.mv<8&&performance.now()-ptr.t<300;cv.style.cursor='grab';clearTimeout(ptr.lp);
if(b){b.g=false;b.vx=Math.max(-2500,Math.min(2500,ptr.vx));b.vy=Math.max(-2500,Math.min(2500,ptr.vy));if(tap){morph(b,(b.s+1)%8);b.sqv+=4;buzz(.7,1.3)}}
else if(tap&&!ptr.done&&ptr.x>-900){spawn(ptr.sx,ptr.sy,Math.floor(rnd()*8),unit*(.7+rnd()*.6));buzz(.6,1.2)}ptr.b=null};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
/* physics */
function impact(b,v,ang,fl){const s=Math.min(1,Math.abs(v)/1100);if(Math.abs(v)>90&&!(fl&&Math.abs(v)<140)){b.sqv+=s*6+1;b.sqa=ang;buzz(s,60/b.R+.4)}}
function step(dt,t){const e=S.bounce;G.x+=(G.tx-G.x)*Math.min(1,8*dt);G.y+=(G.ty-G.y)*Math.min(1,8*dt);
for(const b of B){const m=b.R*.9;
if(b.g){b.vx=(ptr.x-b.x)*22;b.vy=(ptr.y-b.y)*22;}
else{if(S.gravity){b.vx+=G.x*1500*dt;b.vy+=G.y*1500*dt}else{b.vx+=Math.sin(t/900+b.id)*60*dt;b.vy+=Math.cos(t/1100+b.id*2)*60*dt;const f=1-.35*dt;b.vx*=f;b.vy*=f}
if(S.magnet&&ptr.in&&!ptr.b){const dx=ptr.x-b.x,dy=ptr.y-b.y,d=Math.hypot(dx,dy)+30;b.vx+=dx/d*1400*dt;b.vy+=dy/d*1400*dt;b.vx*=1-1.2*dt;b.vy*=1-1.2*dt}}
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
function draw(){if(S.trails){ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over'}else ctx.clearRect(0,0,W,H);shk*=.86;const ox=(rnd()-.5)*shk*2,oy=(rnd()-.5)*shk*2;
for(const b of B){ctx.save();ctx.translate(b.x+ox,b.y+oy);ctx.rotate(b.sqa);ctx.scale(1-b.sq,1+b.sq);ctx.rotate(-b.sqa+b.a);const z=Math.max(b.sc,0)*(1+lvl*1.2);ctx.scale(z,z);
ctx.beginPath();for(let i=0;i<N;i++){const t=i/N*TAU,r=b.cur[i]*b.R;i?ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r):ctx.moveTo(r,0)}
ctx.closePath();ctx.fillStyle=P[b.c];ctx.fill();ctx.restore()}
for(const q of PT){ctx.globalAlpha=Math.max(q.l,0);ctx.fillStyle=P[q.c];ctx.beginPath();ctx.arc(q.x,q.y,q.r*q.l,0,TAU);ctx.fill()}ctx.globalAlpha=1}
let last=performance.now();
function frame(t){const dt=Math.min((t-last)/1000,.033);last=t;ptr.vx*=.92;ptr.vy*=.92;mic();for(const q of PT){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=900*dt;q.l-=dt*1.5}PT=PT.filter(q=>q.l>0);step(dt/2,t);step(dt/2,t);draw();hud(t);requestAnimationFrame(frame)}
/* UI */
const pulse=(k,morphIt=true)=>B.forEach((b,i)=>{b.sqv+=3;b.sqa=rnd()*3;if(k=='gravity')b.vy+=S.gravity?0:-450;if(morphIt)setTimeout(()=>morph(b,Math.floor(rnd()*8)),i*40)});
const setSw=(k,v)=>{S[k]=v;const w=document.querySelector(`.sw[data-k=${k}]`);w&&w.setAttribute('aria-checked',v)};
document.querySelectorAll('.sw[data-k]').forEach(sw=>{sw.setAttribute('aria-checked',!!S[sw.dataset.k]);sw.onclick=async()=>{const k=sw.dataset.k,v=!S[k];
if(v&&(k=='tilt'||k=='shake')&&!await startMotion())return;
if(v&&k=='mic'&&!await startMic())return;
setSw(k,v);if(k=='tilt'){if(v)setSw('gravity',true);else{G.tx=0;G.ty=1}}if(k=='mic'&&!v)stopMic();if(k=='wake')wake(v);save();pulse(k);buzz(.45)}});
$('#bn').value=S.bounce*100;$('#bn').oninput=e=>{S.bounce=e.target.value/100;pulse('b',false);save();buzz(.15)};
const th=$('#theme');th.setAttribute('aria-checked',root.dataset.theme=='dark');
th.onclick=()=>{const d=root.dataset.theme!='dark';root.dataset.theme=d?'dark':'light';th.setAttribute('aria-checked',d);P=pal();pulse('t',false);save();buzz(.4)};
[265,345,25,150,200,55].forEach((h,i)=>{const b=document.createElement('button');b.className='seed';b.style.background=`hsl(${h} 70% 55%)`;b.setAttribute('aria-label','Seed color '+(i+1));b.setAttribute('aria-pressed',h==hue);
b.onclick=()=>{hue=h;root.style.setProperty('--h',h);P=pal();document.querySelectorAll('.seed').forEach(x=>x.setAttribute('aria-pressed',x==b));pulse('c',false);save();buzz(.4)};$('#seeds').append(b)});
$('#bSpawn').onclick=()=>{for(let i=0;i<3;i++)setTimeout(()=>{spawn(rnd()*W,-20,Math.floor(rnd()*8),unit*(.7+rnd()*.6),(rnd()-.5)*400,200);buzz(.3,1+i*.2)},i*120)};
$('#bMorph').onclick=()=>B.forEach((b,i)=>setTimeout(()=>{morph(b,(b.s+1+Math.floor(rnd()*6))%8);b.sqv+=4;buzz(.4,1+i/10)},i*70));
$('#bShake').onclick=()=>{B.forEach(b=>{b.vx+=(rnd()-.5)*2400;b.vy-=600+rnd()*900;b.av+=(rnd()-.5)*12});buzz(1)};
$('#bReset').onclick=()=>{seed();buzz(.5)};
names.forEach((n,i)=>{const c=document.createElement('button');c.className='chip';c.setAttribute('aria-pressed','false');
c.innerHTML=`<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><path d="${dOf(shapes[i])}"/></svg>${n}`;
c.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x==c));B.forEach((b,j)=>setTimeout(()=>{morph(b,i);b.sqv+=3;buzz(.3,1+j*.05)},j*45))};$('#lib').append(c)});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.chip');if(!b)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,s=document.createElement('span');
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
function hud(t){if(t-lh<200)return;lh=t;$('#hud').textContent=`Tilt ${Math.round(Math.atan2(G.x,G.y)*57.3)}°   Shakes ${shakes}   Shapes ${B.length}`}
addEventListener('keydown',e=>{if(/INPUT|BUTTON/.test(e.target.tagName))return;const k=e.key;
if(k==' '){e.preventDefault();spawn(rnd()*W,-20,Math.floor(rnd()*8),unit*(.7+rnd()*.6),(rnd()-.5)*400,200);buzz(.4)}
else if(k=='s')shakeShapes(1);
else if(k.startsWith('Arrow')){e.preventDefault();const x=k=='ArrowLeft'?-1:k=='ArrowRight'?1:0,y=k=='ArrowUp'?-1:k=='ArrowDown'?1:0;B.forEach(b=>{b.vx+=x*700;b.vy+=y*700});buzz(.3)}});
const LAB={Tick:[8],Click:[14,30,14],Thud:[45],Heartbeat:[18,70,28,350,18,70,28],Ripple:[8,20,10,20,14,20,18,20,24]};
Object.entries(LAB).forEach(([n,p])=>{const b=document.createElement('button');b.className='btn t';b.textContent=n;b.onclick=()=>{if(navigator.vibrate)navigator.vibrate(p);else st('This browser has no vibration. You still get the shake.');pulse('l',false);shk=6};$('#lab').append(b)});
const fsb=$('#bFs');if(!document.fullscreenEnabled)fsb.hidden=true;
fsb.onclick=()=>document.fullscreenElement?document.exitFullscreen():$('.stage').requestFullscreen().catch(()=>{});
document.addEventListener('fullscreenchange',()=>setTimeout(fit,100));
new ResizeObserver(fit).observe(cv);fit();seed();requestAnimationFrame(frame);
