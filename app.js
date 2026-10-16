const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const D=window.COLLECTION,G=window.CAR_GEOMETRY,NS='http://www.w3.org/2000/svg';
let mode='parking',designState=0,selectionCentered=false;
const parkingRows=[...new Set(D.parking.map(g=>g.row))].map(row=>({row,tier:'',groups:D.parking.filter(g=>g.row===row)}));
const allBrandLayout=[
 [9,31,29,2,8],
 [6,20,35,15],
 [27,23,28,24],
 [36,1,11,21,32,26],
 [33,12,22,34,10,3],
 [16,17,4,19,18,7],
 [25,30,14,5,13]
];
const designLayout=[
 [9,6,35,15],[31,8,27,28],[1,32,33,22],[34,10,3,16,7],
 [29,2,23,36,11],[26,12,17],
 [20,24,21,4,19,18],[25,30,14,5,13]
];
const labelBrand=id=>D.cars[id].name.includes('마이바흐')?'마이바흐':D.cars[id].brand;
function makeRow(ids,row){const designTitle=designState&&row>=4?'Just by Design - '+(row<6?'Modern':'Classic'):'';if(designTitle)return{row,tier:'',designTitle,groups:[{label:designTitle,cars:[...ids]}]};const groups=[];for(const id of ids){const label=labelBrand(id),last=groups.at(-1);if(last?.label===label)last.cars.push(id);else groups.push({label,cars:[id]});}return{row,tier:'',groups};}
function brandRows(){return(designState?designLayout:allBrandLayout).map(makeRow);}
const CARDS=Object.values(D.cars).map(c=>({...c,style:D.parking.find(g=>g.cars.includes(c.id)).label}));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const stops=[0,.32,1],viewport=$('#viewport'),scene=$('#scene');
let sort='style',rows=[],items=[],W=0,H=0,lockedId=8,frame=0,numberByCount=false,gesture=null,lastTap=0,resizeTimer,detentUntil=0,opening=true,openingPair=false;
const camera={t:.32,x:0,y:0},target={...camera},pointers=new Map();
const units=c=>2.3;
function prepare(){return rowsForMode().map(r=>({groups:r.groups.map(g=>({name:g.label,cards:g.cars.map(id=>CARDS.find(c=>c.id===id))})),tier:r.tier,designTitle:r.designTitle}));}
function rowsForMode(){return mode==='parking'?parkingRows:brandRows();}
function geometry(t){
 const narrow=W<=760,compact=narrow||H/rows.length<105,label=mode==='brand'?12:compact?0:48,head=mode==='brand'?8:compact?0:24;
 const fit=(gap,section)=>Math.min(...rows.map(row=>{const cards=row.groups.flatMap(g=>g.cards);return (W-32-(cards.length-1)*gap-(row.groups.length-1)*section)/cards.reduce((n,c)=>n+units(c),0)}));
 const sectionGap=mode==='brand'?clamp(W*.015,12,24):clamp(W*.05,24,96),fullFit=fit(8,sectionGap);
 const overview=Math.max(3,Math.min(fullFit,(H-28)/rows.length-label-head-10));
 const three=Math.max(3,Math.min(fullFit,H/3-label-head-14));
 const two=Math.max(three,Math.min(fullFit,H/2-label-head-20));
 const maxUnit=Math.max(...CARDS.map(units)),close=Math.min(H*.66,(W-32)/maxUnit,470);
 const isolatedGap=Math.max(12,W/2-close*2.3/2+16);
 const keys=narrow?[
 {t:0,h:overview,pitch:overview+16,gap:8,section:sectionGap},
 {t:.32,h:mix(overview,close,.35),pitch:mix(overview,close,.35)+36,gap:12,section:sectionGap},
 {t:.48,h:mix(overview,close,.58),pitch:mix(overview,close,.58)+60,gap:16,section:sectionGap},
 {t:.78,h:mix(overview,close,.9),pitch:mix(overview,close,.9)+100,gap:22,section:sectionGap},
 {t:1,h:close,pitch:H/2+close/2+60,gap:isolatedGap,section:sectionGap}
 ]:[{t:0,h:overview,pitch:overview+label+head+12,gap:8,section:sectionGap},{t:.32,h:three,pitch:H/3,gap:8,section:sectionGap},{t:.48,h:two,pitch:H/2,gap:8,section:sectionGap},{t:.86,h:close,pitch:Math.max(close+100,H*.68),gap:32,section:sectionGap},{t:1,h:close,pitch:H/2+close/2+60,gap:isolatedGap,section:sectionGap}];
 const hi=keys.findIndex(k=>k.t>=t);let g=keys[0];if(hi>0){const a=keys[hi-1],b=keys[hi],u=(t-a.t)/(b.t-a.t);g={h:mix(a.h,b.h,u),pitch:mix(a.pitch,b.pitch,u),gap:mix(a.gap,b.gap,u),section:mix(a.section,b.section,u)}}
 if(!narrow&&t>.48&&t<1){const extra=Math.sin(Math.PI*(t-.48)/.52)*Math.min(120,H*.16);g.pitch=Math.min(H/2+close/2+60,g.pitch+extra)}
 const ratio=g.h*2.3/W,window=Math.min(clamp((ratio-.2)/.05,0,1),clamp((.4-ratio)/.05,0,1));
 if(window>0){const needed=Math.max(0,(W-3*g.h*2.3-2*g.gap)/2-g.gap+18);g.section+=Math.max(0,needed-g.section)*window;}
 if(openingPair&&W>760)g.pitch=Math.max(g.pitch,H/2+g.h/2+32);
 return{...g,narrow,t};
}
function visualWidth(c,g){return mode==='brand'?mix(Math.min(units(c),G[c.id].box[2]/G[c.id].box[3]),units(c),clamp((g.t-.86)/.14,0,1))*g.h:units(c)*g.h;}
function positions(g){const out=new Map();rows.forEach((row,r)=>{const cards=row.groups.flatMap(group=>group.cards),total=cards.reduce((n,c)=>n+visualWidth(c,g),0)+(cards.length-1)*g.gap+(row.groups.length-1)*g.section;let x=W/2-total/2;row.groups.forEach((group,gi)=>{group.cards.forEach(c=>{const w=units(c)*g.h,v=visualWidth(c,g);out.set(c.id,{x:x+v/2,y:H/2+(r-(rows.length-1)/2)*g.pitch,w,v});x+=v+g.gap});if(gi<row.groups.length-1)x+=g.section})});return out;}
function focus(c){const g=geometry(c.t),ps=positions(g),p=ps.get(lockedId);if(!p)return;const item=items.find(i=>i.c.id===lockedId);if(selectionCentered){c.x=W/2-p.x;c.y=H/2-p.y;return;}
 if(openingPair&&W>760){const a=ps.get(31),b=ps.get(27);c.x=W/2-(a.x-a.w/2+b.x+b.w/2)/2;c.y=H/2-a.y;return}
 const offset=count=>{const start=clamp(item.row-Math.floor((count-1)/2),0,rows.length-count);return -(start+(count-1)/2-(rows.length-1)/2)*g.pitch};
 const keys=W<=760?[{t:0,x:0,y:0},{t:.18,x:W/2-p.x,y:H/2-p.y},{t:1,x:W/2-p.x,y:H/2-p.y}]:[{t:0,x:0,y:0},{t:.32,x:0,y:offset(3)},{t:.86,x:W/2-p.x,y:H/2-p.y},{t:1,x:W/2-p.x,y:H/2-p.y}];
 const hi=keys.findIndex(k=>k.t>=c.t);if(hi===0){c.x=c.y=0;return}const a=keys[hi-1],b=keys[hi],u=(c.t-a.t)/(b.t-a.t);c.x=mix(a.x,b.x,u);c.y=mix(a.y,b.y,u);
}
function bound(c){if(selectionCentered&&lockedId!==null)return;const g=geometry(c.t),ps=[...positions(g).values()],edge=24;const left=Math.min(...ps.map(p=>p.x-p.w/2)),right=Math.max(...ps.map(p=>p.x+p.w/2));c.x=right-left<W?0:clamp(c.x,W-right-edge,-left+edge);const ys=ps.map(p=>p.y);c.y=clamp(c.y,-Math.max(...ys)+H/2-24,-Math.min(...ys)+H/2);}
function wake(){if(!frame)frame=requestAnimationFrame(draw);}
function draw(){frame=0;let moving=false;for(const k of ['t','x','y']){if(Math.abs(camera[k]-target[k])>(k==='t'?.0001:.1))moving=true;camera[k]+=(target[k]-camera[k])*(matchMedia('(prefers-reduced-motion:reduce)').matches?1:.24)}if(!moving)Object.assign(camera,target);
 const g=geometry(camera.t),ps=positions(g),names=g.narrow?camera.t>=.44:g.pitch>=g.h+30,info=g.narrow?camera.t>=.68:camera.t>=.8;
 scene.dataset.zoom=camera.t.toFixed(4);scene.dataset.center=String(lockedId??'');scene.dataset.sort=mode;
 for(const i of items){const p=ps.get(i.c.id),x=p.x+camera.x,y=p.y+camera.y-g.h/2,visible=x+p.v/2>0&&x-p.v/2<W&&y+g.h>0&&y<H;i.el.hidden=!visible;if(!visible)continue;
 i.el.style.cssText=`left:${x-p.w/2}px;top:${y}px;width:${p.w}px;height:${g.h}px;--art-height:${g.h}px`;

 i.label.textContent=camera.t>.95?i.c.name:i.c.name.replace(/\s*\([^)]*\)/g,'').replace(i.c.brand,'').trim();i.caption.hidden=!names;i.caption.style.cssText=`top:${g.h+9}px;font-size:${camera.t>.95?14:clamp(8+camera.t*4,8,12)}px`;
 i.tag.hidden=!names||info||g.narrow||g.pitch<g.h+55;i.tag.textContent=i.heading;i.info.hidden=!info;i.info.textContent=i.category||(mode==='brand'?labelBrand(i.c.id):i.c.style);
 i.el.setAttribute('aria-current',String(i.c.id===lockedId));
 }
 if(moving)wake();
}
function build(){W=viewport.clientWidth;H=viewport.clientHeight;if(opening){lockedId=8;openingPair=W>760;selectionCentered=!openingPair;target.t=openingPair?.7:1;opening=false}rows=prepare();if(!rows.some(r=>r.groups.some(g=>g.cards.some(c=>c.id===lockedId)))){lockedId=rows[0].groups[0].cards[0].id;selectionCentered=false;}items=[];scene.replaceChildren();rows.forEach((row,r)=>row.groups.forEach(group=>group.cards.forEach((c,k)=>{const el=document.createElement('article');el.className='explore-card';el.dataset.id=c.id;el.tabIndex=0;el.setAttribute('aria-label',c.name);const tag=document.createElement('span');tag.className='explore-tag';const art=document.createElementNS(NS,'svg'),im=document.createElementNS(NS,'image'),m=G[c.id];art.setAttribute('class','vehicle-art'+(m.flip?' flipped':''));art.setAttribute('viewBox',m.box.join(' '));art.setAttribute('preserveAspectRatio','xMidYMid meet');art.setAttribute('role','img');art.setAttribute('aria-label',c.name);im.setAttribute('href',c.image);im.setAttribute('width',m.width);im.setAttribute('height',m.height);art.append(im);const caption=document.createElement('div');caption.className='explore-caption';const name=document.createElement('span');name.className='explore-label';const info=document.createElement('span');info.className='card-info';caption.append(name,info);el.append(tag,art,caption);scene.append(el);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();lockedId=c.id;selectionCentered=true;setZoom(1,false)}};items.push({c,el,tag,caption,info,label:name,row:r,category:row.designTitle||'',heading:k===0&&(!row.designTitle||rows[r-1]?.designTitle!==row.designTitle)?(mode==='brand'&&row.tier&&rows[r-1]?.tier!==row.tier&&group===row.groups[0]?row.tier.replace(/ CAR BRAND| BRAND| CAR/g,'')+' · ':'')+group.name:''})})));
 if(openingPair&&W>760){let lo=.32,hi=.86;for(let n=0;n<28;n++){const mid=(lo+hi)/2,ps=positions(geometry(mid)),a=ps.get(31),b=ps.get(27);if(b.x+b.w/2-a.x+a.w/2<=W-96)lo=mid;else hi=mid}target.t=lo}focus(target);bound(target);Object.assign(camera,target);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('#classic-control').hidden=mode!=='brand';const design=$('#classic-toggle');design.dataset.state=String(designState);design.setAttribute('aria-label','Just by Design · '+(designState?'Modern / Classic':'브랜드별 전체'));design.setAttribute('aria-pressed',String(designState!==0));design.title=designState?'Modern / Classic':'브랜드별 전체';wake();}
function setZoom(t,detent=true){openingPair=false;if(lockedId===null){const ps=positions(geometry(target.t));lockedId=[...items].sort((a,b)=>{const p=ps.get(a.c.id),q=ps.get(b.c.id);return Math.hypot(p.x+target.x-W/2,p.y+target.y-H/2)-Math.hypot(q.x+target.x-W/2,q.y+target.y-H/2)})[0].c.id}let next=clamp(t,0,1);if(detent){const crossed=stops.slice(1,-1).filter(s=>(target.t<s&&next>s)||(target.t>s&&next<s));if(crossed.length)next=next>target.t?crossed[0]:crossed.at(-1)}target.t=next;focus(target);bound(target);wake();}
viewport.addEventListener('wheel',e=>{e.preventDefault();const mobile=W<=760;if(!mobile&&performance.now()<detentUntil)return;const before=target.t,step=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?H:1),-160,160)*(mobile?.001:.0007);setZoom(target.t-step*(mobile&&target.t>.78?.7:1),!mobile);if(!mobile&&before!==target.t&&stops.slice(1,-1).includes(target.t))detentUntil=performance.now()+220},{passive:false});
viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;openingPair=false;viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x:e.clientX,y:e.clientY,ox:target.x,oy:target.y,t:target.t,moved:false,id:Number(e.target.closest('.explore-card')?.dataset.id)||null};if(pointers.size===2){const [a,b]=[...pointers.values()];gesture.distance=Math.hypot(a.x-b.x,a.y-b.y)}viewport.classList.add('dragging')});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()];if(gesture.distance)setZoom(gesture.t+Math.log(Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance)*(W<=760?.75:.45),false);gesture.moved=true}else{const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;if(gesture.moved){lockedId=null;selectionCentered=false;target.x=gesture.ox+dx;target.y=gesture.oy+dy;bound(target);wake()}}});
function release(e){if(gesture&&!gesture.moved&&gesture.id){lockedId=gesture.id;selectionCentered=true;focus(target);if(Date.now()-lastTap<330)setZoom(1,false);lastTap=Date.now();wake()}pointers.delete(e.pointerId);gesture=null;viewport.classList.remove('dragging')}
viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;viewport.classList.remove('dragging')});
document.querySelectorAll('button[data-mode]').forEach(b=>b.onclick=()=>{openingPair=false;mode=b.dataset.mode;sort=mode;build()});
$('#classic-toggle').onclick=()=>{designState=designState?0:1;openingPair=false;build()};

document.addEventListener('keydown',e=>{if($('#numbers').open||$('#rank-dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;if(['+','=','-','Escape','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'||e.key==='Escape')selectionCentered=false;setZoom(e.key==='-'?target.t-.07:e.key==='Escape'||e.key==='Home'?0:target.t+.07)}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const current=items.find(i=>i.c.id===lockedId)||items[0],ps=positions(geometry(target.t)),p=ps.get(current.c.id),vertical=['ArrowUp','ArrowDown'].includes(e.key),dir=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;const cs=items.filter(i=>vertical?(i.row-current.row)*dir>0:i.row===current.row&&(ps.get(i.c.id).x-p.x)*dir>0);cs.sort((a,b)=>vertical?Math.abs(a.row-current.row)*W+Math.abs(ps.get(a.c.id).x-p.x)-Math.abs(b.row-current.row)*W-Math.abs(ps.get(b.c.id).x-p.x):Math.abs(ps.get(a.c.id).x-p.x)-Math.abs(ps.get(b.c.id).x-p.x));if(cs[0]){lockedId=cs[0].c.id;selectionCentered=true;focus(target);bound(target);wake()}}});
function numberContent(){const content=$('#number-content');content.replaceChildren();$('#number-total').textContent=CARDS.length+' CARS';$('#number-sort').textContent=numberByCount?'위치 순':'개수 순';$('#number-sort').setAttribute('aria-pressed',String(numberByCount));const visible=rows.flatMap(row=>row.groups.flatMap(group=>group.cards));const arranged=[...visible,...CARDS.filter(c=>!visible.some(v=>v.id===c.id))];for(const [key,title]of [['brand','브랜드별'],['style','주차장 분류별']]){const order=[...new Set(arranged.map(card=>card[key]))];const entries=order.map(name=>[name,CARDS.filter(c=>c[key]===name).length]);if(numberByCount)entries.sort((a,b)=>b[1]-a[1]);const section=document.createElement('section');section.className='number-section';const h=document.createElement('h3');h.textContent=title;const ul=document.createElement('ul');for(const [name,n]of entries){const li=document.createElement('li'),span=document.createElement('span');span.textContent=key==='brand'&&name==='메르세데스 벤츠'?'벤츠(마이바흐)':name;li.append(span);if(n>1){const strong=document.createElement('strong');strong.textContent=n;li.append(strong)}ul.append(li)}section.append(h,ul);content.append(section)}}
$('#number').onclick=()=>{numberByCount=false;numberContent();$('#numbers').showModal()};$('#number-sort').onclick=()=>{numberByCount=!numberByCount;numberContent()};$('#close-numbers').onclick=()=>$('#numbers').close();$('#numbers').addEventListener('click',e=>{if(e.target===$('#numbers')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#numbers').close()}});
new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(build,80)}).observe(viewport);document.fonts.ready.then(build);build();
window.CarExplorer={zoom:t=>setZoom(t,false),select(id){if(!items.some(i=>i.c.id===id))return;openingPair=false;lockedId=id;selectionCentered=true;focus(target);bound(target);wake()},get state(){return{...target,W,H,mode,designState,selectionCentered,lockedId,geometry:geometry(target.t),rows:rows.map(r=>r.groups.flatMap(g=>g.cards.map(c=>c.id)))}}};


function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;} const ownedCounts=new Map();Object.values(D.cars).forEach(c=>{const label=c.name.includes('마이바흐')?'마이바흐':c.brand;ownedCounts.set(label,(ownedCounts.get(label)||0)+1);});
const countKey=brand=>brand==='벤츠'?'메르세데스 벤츠':brand==='레인지 로버'?'레인지로버':brand;
const dlg=$('#rank-dialog');D.hierarchy.forEach(t=>{const item=el('div','rank-item');item.append(el('strong','',t.tier),el('p','',t.brands));$('#rank-list').append(item);const entries=t.brands.replace(/[()]/g,'').split('/').map(b=>b.trim()).map(brand=>({brand,count:ownedCounts.get(countKey(brand))||0})).filter(b=>b.count>0);if(entries.length){const block=el('section','owned-tier'),list=el('div','owned-brands');block.append(el('h4','',t.tier));entries.forEach(({brand,count})=>{const n=el('div','owned-brand');n.dataset.brand=brand;n.dataset.count=count;n.append(el('span','',brand),el('strong','',count+'대'));list.append(n);});block.append(list);$('#owned-list').append(block);}});$('#rank').onclick=()=>dlg.showModal();$('#close-rank').onclick=()=>dlg.close();dlg.addEventListener('click',e=>{if(e.target===dlg){const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close();}});


