/* Catalogue presentation reuses the free view's groups, vehicles and silhouette geometry. */
(()=>{
 'use strict';
 let presentation='list',selectedGroup=null,observer=null,disposeCarousel=()=>{};
 const pane=document.querySelector('#catalog-pane');
 const brands={'부가티':'Bugatti','롤스로이스':'Rolls-Royce','벤틀리':'Bentley','마이바흐':'Mercedes-Maybach','페라리':'Ferrari','람보르기니':'Lamborghini','맥라렌':'McLaren','애스턴 마틴':'Aston Martin','포르쉐':'Porsche','메르세데스 벤츠':'Mercedes-Benz','BMW':'BMW','아우디':'Audi','레인지로버':'Range Rover','마세라티':'Maserati','렉서스':'Lexus','테슬라':'Tesla','재규어':'Jaguar','쉐보레':'Chevrolet','포드':'Ford','알파 로메오':'Alfa Romeo','캐딜락':'Cadillac','링컨':'Lincoln'};
 const title=label=>mode==='brand'?(brands[label]||label):label;
 function groups(){
  const byName=new Map();
  for(const row of rowsForMode())for(const group of row.groups){
   if(!byName.has(group.label))byName.set(group.label,{label:group.label,ids:[]});
   const ids=byName.get(group.label).ids;
   for(const id of group.cars)if(D.cars[id]&&!ids.includes(id))ids.push(id);
  }
  return [...byName.values()].filter(g=>g.ids.length);
 }
 function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function art(car){
  const geometry=G[car.id],svg=document.createElementNS(NS,'svg'),image=document.createElementNS(NS,'image');
  svg.setAttribute('viewBox',geometry.box.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('role','img');svg.setAttribute('aria-label',car.name);
  if(geometry.flip)svg.classList.add('catalog-flipped');
  image.setAttribute('width',geometry.width);image.setAttribute('height',geometry.height);
  image.dataset.src=car.image.replace(/[^/]+$/,`detail/car-${car.id}.webp`);
  svg.append(image);return svg;
 }
 function load(card){const image=card.querySelector('image');if(image&&!image.hasAttribute('href'))image.setAttribute('href',image.dataset.src);}
 function carousel(area,products,ids){
  const dots=node('div','catalog-dots');dots.hidden=true;dots.tabIndex=0;dots.setAttribute('role','group');dots.setAttribute('aria-label','차량 이동');
  const status=node('span','catalog-position');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');dots.append(status);
  const markers=Array.from({length:9},(_,slot)=>{const dot=node('span','catalog-dot');dot.dataset.offset=slot-4;dot.setAttribute('aria-hidden','true');dots.append(dot);return dot;});pane.append(dots);
  const cards=[...products.children];let active=0,goal=0,enabled=false,scrollFrame=0,wheelTime=-Infinity,wheelDelta=0,disposed=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  function destination(index){const card=cards[index];return Math.max(0,Math.min(area.scrollWidth-area.clientWidth,card.offsetLeft-area.offsetLeft+card.offsetWidth/2-area.clientWidth/2));}
  function sync(){scrollFrame=0;if(!enabled)return;let best=Infinity;cards.forEach((card,index)=>{const distance=Math.abs(destination(index)-area.scrollLeft);if(distance<best){best=distance;active=index;}});dots.dataset.index=String(active);dots.setAttribute('aria-label',`차량 이동 · ${active+1} / ${ids.length} · ${D.cars[ids[active]].name}`);status.textContent=`${active+1} / ${ids.length}`;markers.forEach((dot,slot)=>{const offset=slot-4;dot.hidden=active+offset<0||active+offset>=ids.length;dot.className='catalog-dot'+(offset===0?' current':'');});}
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(sync);}
  function go(index){goal=Math.max(0,Math.min(cards.length-1,index));area.scrollTo({left:destination(goal),behavior:reduced()?'instant':'smooth'});}
  function refresh(){if(disposed)return;const narrow=matchMedia('(max-width:760px)').matches;
   const natural=cards.reduce((sum,card)=>sum+card.offsetWidth,0)+Math.max(0,cards.length-1)*10;
   const next=!narrow&&natural>area.clientWidth+1;
   if(next){const edge=Math.max(0,(area.clientWidth-cards[0].offsetWidth)/2);products.style.setProperty('--catalog-edge',edge+'px');}
   area.classList.toggle('is-carousel',next);dots.hidden=!next;
   if(next){enabled=true;area.scrollLeft=destination(active);goal=active;sync();}else{enabled=false;area.scrollLeft=0;}
  }
  function wheel(event){if(!enabled||presentation!=='list'||document.querySelector('#numbers').open||document.querySelector('#rank-dialog').open||event.ctrlKey||event.metaKey)return;const amount=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;if(!amount)return;event.preventDefault();const now=performance.now();if(now-wheelTime<200)return;wheelDelta+=amount*(event.deltaMode===1?16:event.deltaMode===2?area.clientWidth:1);if(Math.abs(wheelDelta)<24)return;goal=active;go(goal+Math.sign(wheelDelta));wheelDelta=0;wheelTime=now;}
  dots.addEventListener('click',event=>{if(!enabled)return;const rect=dots.getBoundingClientRect(),distance=event.clientX-rect.left-rect.width/2;if(Math.abs(distance)<20)return;const steps=Math.max(1,Math.round(Math.abs(distance)/(rect.width/10)));go(active+Math.sign(distance)*steps);});
  dots.addEventListener('keydown',event=>{const step=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;if(step){event.preventDefault();go(active+step);}else if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:cards.length-1);}});
  area.addEventListener('scroll',schedule,{passive:true});document.addEventListener('wheel',wheel,{passive:false});const resize=new ResizeObserver(refresh);resize.observe(area);refresh();
  return()=>{disposed=true;resize.disconnect();document.removeEventListener('wheel',wheel);area.removeEventListener('scroll',schedule);if(scrollFrame)cancelAnimationFrame(scrollFrame);};
 }
 function render(){
  disposeCarousel();observer?.disconnect();pane.replaceChildren();pane.dataset.mode=mode;
  const all=groups(),ids=[...new Set(all.flatMap(g=>g.ids))];document.querySelector('#count').textContent=ids.length;
  const group=all.find(g=>g.label===selectedGroup);
  if(!group){
   selectedGroup=null;const directory=node('div','catalog-directory'),split=Math.ceil(all.length/2);
   for(const entries of [all.slice(0,split),all.slice(split)]){const column=node('div','catalog-column');for(const g of entries){const button=node('button','catalog-entry',title(g.label));button.dataset.group=g.label;column.append(button);}directory.append(column);}pane.append(directory);
  }else{
   const head=node('div','catalog-group-head'),back=node('button');back.id='catalog-back';back.setAttribute('aria-label','뒤로가기');
   back.innerHTML='<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d="M30 12H3M13 2 3 12l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   head.append(back,node('h2','',title(group.label)),node('span','',group.ids.length));
   const area=node('div','catalog-products-area'),products=node('div','catalog-products');area.tabIndex=0;area.setAttribute('role','region');area.setAttribute('aria-label','차량 목록 스크롤');products.dataset.single=String(group.ids.length===1);
   for(const id of group.ids){const car=D.cars[id],card=node('article','catalog-card'),photo=node('div','catalog-photo'),caption=node('h3','catalog-caption',car.name);card.dataset.car=id;photo.append(art(car));card.append(photo,caption);products.append(card);}
   area.append(products);pane.append(head,area);disposeCarousel=carousel(area,products,group.ids);
   if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)load(entry.target);}),{root:area,rootMargin:'200px'});products.querySelectorAll('.catalog-card').forEach(c=>observer.observe(c));}
   else products.querySelectorAll('.catalog-card').forEach(load);
  }
  pane.scrollTop=0;
 }
 function setPresentation(next){
  if(next===presentation)return;presentation=next;document.body.dataset.presentation=next;
  viewport.inert=next==='list';viewport.setAttribute('aria-hidden',String(next==='list'));
  document.querySelectorAll('[data-presentation-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.presentationButton===next)));
  if(next==='list')render();
  // The free viewport stays laid out; do not rebuild, reset, focus or resize its camera here.
 }
 document.querySelectorAll('[data-presentation-button]').forEach(b=>b.onclick=()=>setPresentation(b.dataset.presentationButton));
 for(const button of [...document.querySelectorAll('button[data-mode]'),document.querySelector('#classic-toggle')]){const original=button.onclick;button.onclick=()=>{original();selectedGroup=null;render();};}
 pane.addEventListener('click',event=>{const entry=event.target.closest('[data-group]');if(entry){selectedGroup=entry.dataset.group;render();pane.querySelector('#catalog-back')?.focus({preventScroll:true});}else if(event.target.closest('#catalog-back')){const previous=selectedGroup;selectedGroup=null;render();[...pane.querySelectorAll('[data-group]')].find(b=>b.dataset.group===previous)?.focus({preventScroll:true});}});
 viewport.inert=true;viewport.setAttribute('aria-hidden','true');render();
})();
