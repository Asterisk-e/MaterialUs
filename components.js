/* MaterialUs: Components tab, volume, compass, knob, ranges, fields, sheets and more */
(()=>{
const $$=s=>[...document.querySelectorAll(s)];
const pgc=$('#pg-comp'),pgp=$('#pg-play');

/* ---------- page tabs ---------- */
const pgt=$$('.pgt'),pgi=$('.pgi');
function place(){const t=$('.pgt[aria-selected=true]');if(!t||!t.offsetWidth)return;pgi.style.left=t.offsetLeft+'px';pgi.style.width=t.offsetWidth+'px'}
function showPg(p,quiet){document.body.dataset.page=p;pgt.forEach(t=>t.setAttribute('aria-selected',t.dataset.pg==p));pgp.hidden=p!='play';pgc.hidden=p!='comp';place();
if(p=='comp'){selTab($('.tab[aria-selected=true]'));syncKnob();paintVol();hs.value=hue;swt()}
if(!quiet){buzz(.4);bump();scrollTo({top:0,behavior:'smooth'})}
try{history.replaceState(null,'',p=='comp'?'#components':location.pathname+location.search)}catch(e){}}
pgt.forEach(t=>t.onclick=()=>showPg(t.dataset.pg));
addEventListener('resize',place);document.fonts&&document.fonts.ready.then(place);

/* ---------- volume bar ---------- */
const vol=$('#vol'),vmute=$('#vmute'),volo=$('#volo');
for(let i=1;i<=12;i++){const s=document.createElement('i');s.style.setProperty('--i',i);vol.append(s)}
function paintVol(){const v=S.muted?0:S.vol;vol.querySelectorAll('i').forEach((s,i)=>s.classList.toggle('on',(i+1)/12<=v+.001));vol.setAttribute('aria-valuenow',Math.round(S.vol*100));volo.textContent=S.muted?'Muted':Math.round(S.vol*100)+'%';vmute.dataset.lv=!v?0:v<.34?1:v<.67?2:3;vmute.setAttribute('aria-pressed',!!S.muted);applyVol()}
function setVol(v,tick){v=Math.max(0,Math.min(1,Math.round(v*12)/12));if(v!=S.vol&&tick){blip(260+v*500);buzz(.2,1+v)}S.vol=v;if(v>0)S.muted=false;paintVol();save()}
const volX=e=>{const r=vol.getBoundingClientRect();return(e.clientX-r.left)/r.width};
vol.onpointerdown=e=>{vol.setPointerCapture(e.pointerId);vol._d=1;setVol(volX(e),1)};
vol.onpointermove=e=>{if(vol._d)setVol(volX(e),1)};
vol.onpointerup=vol.onpointercancel=()=>vol._d=0;
vol.onkeydown=e=>{const k=e.key;if(k=='ArrowRight'||k=='ArrowUp')setVol(S.vol+1/12,1);else if(k=='ArrowLeft'||k=='ArrowDown')setVol(S.vol-1/12,1);else if(k=='Home')setVol(0,1);else if(k=='End')setVol(1,1);else return;e.preventDefault();e.stopPropagation()};
vmute.onclick=()=>{S.muted=!S.muted;paintVol();save();buzz(.4)};
paintVol();

/* ---------- mini player ---------- */
const pp=$('#pplay'),ps=$('#pseek'),pt=$('#ptime'),lvm=$('#lvm');
for(let i=0;i<10;i++)lvm.append(document.createElement('i'));
const fmt=t=>isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
pp.onclick=()=>{if(E.on)stopMusic();else startTrack('hold');buzz(.4)};
ps.oninput=()=>{if(E.on&&E.aud.duration){ps._d=1;E.aud.currentTime=ps.value/1000*E.aud.duration;ps.style.setProperty('--v',ps.value/10+'%')}};
ps.onchange=()=>ps._d=0;
setInterval(()=>{if(pgc.hidden)return;const on=E.on;pp.textContent=on?'■':'▶';pp.setAttribute('aria-label',on?'Stop':'Play');ps.disabled=!on;$('#ptitle').textContent=on&&E.cur?E.cur.title:'Frontline (feat. Matrix)';
if(on&&E.aud.duration){if(!ps._d)ps.value=E.aud.currentTime/E.aud.duration*1000;ps.style.setProperty('--v',ps.value/10+'%');pt.textContent=fmt(E.aud.currentTime)+' / '+fmt(E.aud.duration)}else{ps.value=0;ps.style.setProperty('--v','0%');pt.textContent='Press play. The shapes will dance.'}
lvm.querySelectorAll('i').forEach((b,i)=>b.style.height=(on?4+E.fd[2+i*6]/255*36:4)+'px')},80);

/* ---------- compass ---------- */
const cmpk=$('#cmpk'),cmpl=$('#cmpl'),cmpd=$('#cmpd'),names=['N','NE','E','SE','S','SW','W','NW'];
{let k='';for(let i=0;i<72;i++){const a=i*5*Math.PI/180,r1=i%6==0?80:86,s=Math.sin(a),c=-Math.cos(a);k+=`<line class="${i%6==0?'m':''}" x1="${(s*r1).toFixed(1)}" y1="${(c*r1).toFixed(1)}" x2="${(s*92).toFixed(1)}" y2="${(c*92).toFixed(1)}"/>`}cmpk.innerHTML=k;
cmpl.innerHTML=[['N',0],['E',90],['S',180],['W',270]].map(([t,a])=>{const x=(Math.sin(a*Math.PI/180)*62).toFixed(1),y=(-Math.cos(a*Math.PI/180)*62).toFixed(1);return`<text class="${t=='N'?'n':''}" x="${x}" y="${y}" transform="rotate(${a} ${x} ${y})">${t}</text>`}).join('')}
let mode='pointer',tgt=0,cur=0,got=false;
const cnote=t=>$('#cmpm').textContent=t;
addEventListener('pointermove',e=>{if(mode!='pointer'||pgc.hidden)return;const r=$('#cmp').getBoundingClientRect();tgt=(Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI+360)%360});
(function loop(){if(!pgc.hidden){const d=((tgt-cur+540)%360)-180;cur=(cur+d*.18+360)%360;cmpd.setAttribute('transform','rotate('+(-cur).toFixed(2)+')');$('#cmph').textContent=names[Math.round(cur/45)%8]+' '+Math.round(cur)+'°'}requestAnimationFrame(loop)})();
function ori(e){let h=null;if(e.webkitCompassHeading!=null)h=e.webkitCompassHeading;else if(e.alpha!=null&&(e.absolute||e.type=='deviceorientationabsolute'))h=(360-e.alpha)%360;if(h==null)return;got=true;tgt=h;cnote('Using your device compass. North is red.')}
function cmpOff(msg){mode='pointer';removeEventListener('deviceorientationabsolute',ori,true);removeEventListener('deviceorientation',ori,true);$('#cmpb').textContent='Use device compass';cnote(msg)}
$('#cmpb').onclick=async()=>{if(mode=='sensor'){cmpOff('Facing your pointer. Use the device compass on a phone.');return}
try{const D=window.DeviceOrientationEvent;if(D&&D.requestPermission&&await D.requestPermission()!='granted'){cnote('Permission was not granted, so the dial follows your pointer.');return}}catch(e){}
mode='sensor';got=false;addEventListener('deviceorientationabsolute',ori,true);addEventListener('deviceorientation',ori,true);$('#cmpb').textContent='Use pointer';cnote('Looking for a compass...');
setTimeout(()=>{if(mode=='sensor'&&!got)cmpOff('No compass sensor found here, so the dial follows your pointer.')},1600)};

/* ---------- battery ---------- */
if(navigator.getBattery)navigator.getBattery().then(b=>{const f=()=>{const p=Math.round(b.level*100);$('#batb').style.width=p+'%';$('#batt').textContent=p+'% '+(b.charging?'and charging':'on battery')};f();['levelchange','chargingchange'].forEach(v=>b.addEventListener(v,f))}).catch(()=>{});

/* ---------- rotary knob (bounciness) ---------- */
const kn=$('#knob'),knt=$('#knt'),knv=$('#knv'),kni=$('#kni'),kno=$('#kno');
const arc=(r,a0,a1)=>{const p=a=>[r*Math.sin(a*Math.PI/180),-r*Math.cos(a*Math.PI/180)].map(v=>v.toFixed(2));return`M${p(a0)} A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${p(a1)}`};
knt.setAttribute('d',arc(40,-135,135));
let kv=50;
function paintKnob(){const a=-135+2.7*kv;knv.setAttribute('d',kv<1?'':arc(40,-135,a));kni.setAttribute('transform','rotate('+a+')');kno.textContent=Math.round(kv);kn.setAttribute('aria-valuenow',Math.round(kv))}
function syncKnob(){kv=Math.max(0,Math.min(100,(S.bounce-.4)/.55*100));paintKnob()}
function setKnob(v,tick){v=Math.max(0,Math.min(100,v));if(tick&&Math.round(v/5)!=Math.round(kv/5)){buzz(.2,1+v/100);blip(300+v*5,.05)}kv=v;paintKnob();setB(.4+.55*v/100);save()}
const kang=e=>{const r=kn.getBoundingClientRect();return Math.max(-135,Math.min(135,Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI))};
kn.onpointerdown=e=>{kn.setPointerCapture(e.pointerId);kn._d=1;setKnob((kang(e)+135)/2.7,1)};
kn.onpointermove=e=>{if(kn._d)setKnob((kang(e)+135)/2.7,1)};
kn.onpointerup=kn.onpointercancel=()=>kn._d=0;
kn.onkeydown=e=>{const k=e.key;if(k=='ArrowRight'||k=='ArrowUp')setKnob(kv+5,1);else if(k=='ArrowLeft'||k=='ArrowDown')setKnob(kv-5,1);else return;e.preventDefault();e.stopPropagation()};
$('#bn').addEventListener('input',syncKnob);syncKnob();

/* ---------- dual range: shape size ---------- */
const rmin=$('#rmin'),rmax=$('#rmax'),dr=$('#dr'),dro=$('#dro');
function paintDr(){const a=+rmin.value,b=+rmax.value;dr.style.setProperty('--a',(a-40)/160*100+'%');dr.style.setProperty('--b',(b-40)/160*100+'%');dro.textContent=a+'% to '+b+'%';rmin.style.zIndex=a>150?3:1}
function setDr(w){if(w=='min'&&+rmin.value>+rmax.value)rmax.value=rmin.value;if(w=='max'&&+rmax.value<+rmin.value)rmin.value=rmax.value;S.rmin=+rmin.value;S.rmax=+rmax.value;paintDr();buzz(.15);save()}
rmin.oninput=()=>setDr('min');rmax.oninput=()=>setDr('max');rmin.value=S.rmin;rmax.value=S.rmax;paintDr();

/* ---------- hue slider ---------- */
const hs=$('#hues');hs.value=hue;
hs.oninput=()=>{hue=+hs.value;root.style.setProperty('--h',hue);P=pal();$$('.seed').forEach(x=>x.setAttribute('aria-pressed',false));save()};

/* ---------- stepper ---------- */
const stn=$('#stpn');stn.textContent=S.spawnN;
const stp=d=>{S.spawnN=Math.max(1,Math.min(12,S.spawnN+d));stn.textContent=S.spawnN;buzz(.3,1+S.spawnN/12);blip(300+S.spawnN*40,.05);save()};
$('#stpm').onclick=()=>stp(-1);$('#stpp').onclick=()=>stp(1);$('#stpg').onclick=()=>$('#bSpawn').click();

/* ---------- star rating ---------- */
const sts=$('#stars');let rating=0,hov=0;
const paintStars=()=>[...sts.children].forEach((b,j)=>{b.classList.toggle('on',j<(hov||rating));b.setAttribute('aria-checked',j+1==rating)});
for(let i=1;i<=5;i++){const b=document.createElement('button');b.className='star';b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.setAttribute('aria-label',i+(i>1?' stars':' star'));
b.innerHTML='<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"><path d="'+dOf(shapes[4])+'"/></svg>';
b.onmouseenter=()=>{hov=i;paintStars()};b.onmouseleave=()=>{hov=0;paintStars()};
b.onclick=()=>{rating=i;paintStars();for(let k=0;k<i;k++)setTimeout(()=>{sparks(rnd()*W,H*(.2+rnd()*.5),30,260,1.1);buzz(.4,1+k*.15);blip(380+k*90,.07)},k*120);if(i==5)CODES.confetti[1]()};sts.append(b)}

/* ---------- stopwatch ---------- */
const swo=$('#swt');let t0=0,acc=0,run=false,laps=[];
const p2=n=>String(n).padStart(2,'0');
function swt(){const t=acc+(run?performance.now()-t0:0);swo.textContent=p2(Math.floor(t/60000))+':'+p2(Math.floor(t/1000)%60)+'.'+p2(Math.floor(t/10)%100)}
setInterval(()=>{if(!pgc.hidden&&run)swt()},50);
$('#swgo').onclick=()=>{if(run){acc+=performance.now()-t0;run=false}else{t0=performance.now();run=true}$('#swgo').textContent=run?'Pause':(acc?'Resume':'Start');swt();buzz(.4)};
$('#swlap').onclick=()=>{if(!run)return;swt();laps.unshift(swo.textContent);$('#swl').innerHTML=laps.slice(0,5).map(l=>'<li>'+l+'</li>').join('');buzz(.3,1.3)};
$('#swrs').onclick=()=>{run=false;acc=0;laps=[];$('#swl').innerHTML='';$('#swgo').textContent='Start';swt();buzz(.3)};

/* ---------- fields ---------- */
const f3=$('#f3');f3.oninput=()=>{$('#f3c').textContent=f3.value.length+' / 80';B.forEach(b=>b.sqv+=.6)};
$('#f4b').onclick=e=>{e.preventDefault();const f=$('#f4'),v=f.type=='password';f.type=v?'text':'password';e.currentTarget.setAttribute('aria-label',v?'Hide password':'Show password');e.currentTarget.textContent=v?'◎':'◉';buzz(.3)};
$('#f5').onchange=e=>{const v=+e.target.value;B.forEach((b,i)=>setTimeout(()=>{morph(b,v<0?pick():v);b.sqv+=3},i*40));buzz(.4)};
['f1','f2'].forEach(i=>$('#'+i).addEventListener('input',()=>B.forEach(b=>b.sqv+=.6)));

/* ---------- date picker ---------- */
const cal=$('#cal'),now=new Date();let sel=new Date(now.getFullYear(),now.getMonth(),now.getDate()),view=new Date(now.getFullYear(),now.getMonth(),1);
function drawCal(){const y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
let h=`<div class="ch"><button class="ib" data-c="-1" aria-label="Previous month">‹</button><b>${view.toLocaleString(undefined,{month:'long',year:'numeric'})}</b><button class="ib" data-c="1" aria-label="Next month">›</button></div><div class="cg">`+'SMTWTFS'.split('').map(d=>`<small>${d}</small>`).join('');
for(let i=0;i<first;i++)h+='<span></span>';
for(let d=1;d<=days;d++){const is=sel.getFullYear()==y&&sel.getMonth()==m&&sel.getDate()==d,td=now.getFullYear()==y&&now.getMonth()==m&&now.getDate()==d;h+=`<button class="cell${is?' sel':''}${td?' today':''}" data-d="${d}" aria-pressed="${is}">${d}</button>`}
cal.innerHTML=h+'</div><p class="cs2">'+sel.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})+'</p>'}
cal.onclick=e=>{const c=e.target.closest('[data-c]'),d=e.target.closest('[data-d]');if(c){view=new Date(view.getFullYear(),view.getMonth()+ +c.dataset.c,1);drawCal();buzz(.3)}else if(d){sel=new Date(view.getFullYear(),view.getMonth(),+d.dataset.d);drawCal();buzz(.4);for(let i=0;i<1+sel.getDate()%3;i++)setTimeout(()=>spawn(rnd()*W,-20,pick(),unit*(.7+rnd()*.6),(rnd()-.5)*300,200),i*100)}};
drawCal();

/* ---------- list rows and navigation bar ---------- */
$$('.li[data-run]').forEach(b=>b.addEventListener('click',()=>{$('#'+b.dataset.run).click()}));
$$('.ni').forEach(n=>n.onclick=()=>{$$('.ni').forEach(x=>x.setAttribute('aria-selected',x==n));const m=n.dataset.nm;if(m=='p')SC.party();else MODES[m]();$('#nbt').textContent='Mode: '+n.querySelector('small').textContent;buzz(.5);bump()});

/* ---------- bottom sheet and banner ---------- */
const sheet=$('#sheet'),scrim=$('#scrim');
function sheetOpen(v){sheet.classList.toggle('on',v);scrim.hidden=!v;sheet.setAttribute('aria-hidden',!v);if(v)buzz(.4)}
$('#bSheet').onclick=()=>sheetOpen(true);scrim.onclick=$('#sheetx').onclick=()=>sheetOpen(false);
sheet.addEventListener('click',e=>{if(e.target.closest('[data-m]'))setTimeout(()=>sheetOpen(false),250)});
addEventListener('keydown',e=>{if(e.key=='Escape'&&sheet.classList.contains('on'))sheetOpen(false)});
{const g=$('.grab');let sy=null;
g.onpointerdown=e=>{sy=e.clientY;g.setPointerCapture(e.pointerId);sheet.style.transition='none'};
g.onpointermove=e=>{if(sy==null)return;sheet.style.transform='translate(-50%,'+Math.max(0,e.clientY-sy)+'px)'};
g.onpointerup=g.onpointercancel=e=>{if(sy==null)return;const d=e.clientY-sy;sy=null;sheet.style.transition='';sheet.style.transform='';if(d>80)sheetOpen(false)}}
$('#bBanner').onclick=()=>{$('#bnr').hidden=false;buzz(.4)};
$('#bnrx').onclick=()=>{$('#bnr').hidden=true;buzz(.3)};
$('#bnrg').onclick=()=>{$('#bnr').hidden=true;$('#bSpawn').click()};

/* ---------- search ---------- */
const cs=$('#cs');
cs.oninput=()=>{const q=cs.value.trim().toLowerCase();let n=0;$$('#pg-comp .cs').forEach(s=>{const m=!q||(s.dataset.k+' '+s.querySelector('h2').textContent).toLowerCase().includes(q);s.hidden=!m;if(m)n++});$('#cs0').hidden=n>0};

/* ---------- shape options ---------- */
$('#tsp').value=S.sp;$('#tsp').oninput=e=>{S.sp=+e.target.value;save();buzz(.1)};
$('#bClear').onclick=()=>{clearStamps();buzz(.4)};

showPg(location.hash=='#components'?'comp':'play',true);
})();
