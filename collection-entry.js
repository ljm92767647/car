/* List-only entry cards. Product data, filters and free-view cameras stay with each catalogue. */
(()=>{
 'use strict';
 const site=document.currentScript.dataset.collection,pane=document.querySelector('#catalog-pane');
 const root=document.createElement('section');root.id='collection-entry';root.tabIndex=0;root.setAttribute('aria-label','목록 분류 선택');root.setAttribute('aria-roledescription','carousel');
 const back=document.createElement('button');back.id='collection-entry-back';back.setAttribute('aria-label','분류 선택으로 돌아가기');back.innerHTML='<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d="M30 12H3M13 2 3 12l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 pane.parentElement.append(root,back);
 let home=true,active=0,daily=false,navigating=false,choices=[],wheelAt=0,wheelTotal=0,start=null,dragged=false;
 const button=(selector)=>document.querySelector(selector);
 const choice=(title,selector)=>({title,run:()=>button(selector)?.click()});
 function options(){
  if(site==='pens'&&daily)return ['Ballpoint Pen','Multi Pen','Mechanical Pencil'].map(title=>({title,run:()=>{
   button('[data-section="daily"]').click();
   [...pane.querySelectorAll('.catalog-entry')].find(b=>b.textContent.trim()===title)?.click();
  }}));
  const attribute=site==='pens'||site==='cards'?'data-sort':'data-mode';
  return (site==='cars'?[['By Category','parking'],['By Brand','brand']]:[['By Brand','brand'],['By Style','style'],...(site==='watches'?[['By Color','color']]:[])]).map(([title,value])=>choice(title,`header [${attribute}="${value}"]`));
 }
 function paint(){
  root.style.setProperty('--active',active);root.style.setProperty('--drag-x','0px');
  root.querySelectorAll('.collection-choice').forEach((card,i)=>{card.classList.toggle('is-current',i===active);card.style.setProperty('--side',Math.sign(i-active));card.setAttribute('aria-current',String(i===active));card.tabIndex=i===active?0:-1;});
  root.querySelector('.collection-prev').disabled=active===0;root.querySelector('.collection-next').disabled=active===choices.length-1;
  root.querySelector('.collection-announcement').textContent=`${choices[active].title}, ${active+1} / ${choices.length}`;
 }
 function render(){
  choices=options();active=Math.min(active,choices.length-1);
  root.innerHTML='<div class="collection-window"><div class="collection-track">'+choices.map((c,i)=>`<button type="button" class="collection-choice" data-choice="${i}"><span class="collection-glass" aria-hidden="true"><span class="collection-glint"></span><span class="collection-rim"></span><span class="collection-caustic"></span></span><span class="collection-choice-title">${c.title}</span></button>`).join('')+'</div></div><button type="button" class="collection-arrow collection-prev" aria-label="이전 분류"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m19 7-9 9 9 9"/></svg></button><button type="button" class="collection-arrow collection-next" aria-label="다음 분류"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m13 7 9 9-9 9"/></svg></button><span class="collection-announcement" role="status" aria-live="polite"></span>';
  paint();sync();
 }
 function sync(){
  const list=document.body.dataset.presentation==='list',directory=!!pane.querySelector('.catalog-directory');
  root.hidden=!list||!home;root.inert=!list||!home;
  pane.classList.toggle('collection-entry-hidden',list&&home);pane.classList.toggle('collection-entry-directory',list&&!home&&directory);pane.inert=!list||home;
  back.hidden=!list||home||!directory;
 }
 function move(delta){active=Math.max(0,Math.min(choices.length-1,active+delta));paint();}
 function enter(){
  navigating=true;choices[active].run();navigating=false;home=false;sync();
  (pane.querySelector('#catalog-back')||back).focus({preventScroll:true});
 }
 function showHome(){home=true;render();root.focus({preventScroll:true});}
 root.onclick=e=>{
  if(dragged){dragged=false;return;}
  if(e.target.closest('.collection-prev')){move(-1);return;}
  if(e.target.closest('.collection-next')){move(1);return;}
  const card=e.target.closest('[data-choice]');if(!card)return;
  const index=Number(card.dataset.choice);if(index!==active){active=index;paint();}else enter();
 };
 back.onclick=showHome;
 root.addEventListener('wheel',e=>{e.preventDefault();if(Date.now()-wheelAt<500)return;wheelTotal+=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(wheelTotal)<35)return;move(Math.sign(wheelTotal));wheelTotal=0;wheelAt=Date.now();},{passive:false});
 root.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.collection-arrow'))return;start={id:e.pointerId,x:e.clientX,y:e.clientY};dragged=false;});
 root.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x;if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(e.clientY-start.y)){dragged=true;root.classList.add('is-dragging');root.style.setProperty('--drag-x',Math.max(-150,Math.min(150,dx))+'px');}});
 window.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x;start=null;root.classList.remove('is-dragging');if(dragged&&Math.abs(dx)>35)move(dx<0?1:-1);else paint();setTimeout(()=>{dragged=false;},0);});
 root.addEventListener('pointercancel',()=>{start=null;dragged=false;root.classList.remove('is-dragging');paint();});
 window.addEventListener('keydown',e=>{
  if(root.hidden||document.querySelector('dialog[open]'))return;
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();if(e.key==='Home')active=0;else if(e.key==='End')active=choices.length-1;else move(e.key==='ArrowLeft'?-1:1);paint();
  }else if(e.key==='Enter'&&(e.target===root||e.target.closest('.collection-choice'))){e.preventDefault();e.stopImmediatePropagation();enter();}
 },true);
 document.addEventListener('click',e=>{
  if(navigating||site!=='pens'||document.body.dataset.presentation!=='list')return;
  const collection=e.target.closest('header [data-section]');if(collection){daily=collection.dataset.section==='daily';active=0;home=true;render();}
 });
 // Daily categories lead straight to products; their back arrow returns to the three cards.
 pane.addEventListener('click',e=>{if(site==='pens'&&daily&&e.target.closest('#catalog-back')){e.preventDefault();e.stopImmediatePropagation();showHome();}},true);
 new MutationObserver(sync).observe(pane,{childList:true,subtree:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-presentation']});
 if(site==='pens')daily=button('[data-section="daily"]')?.getAttribute('aria-pressed')==='true';
 render();
 window.CollectionEntry={get state(){return{home,active,daily,titles:choices.map(c=>c.title)}},showHome};
})();
