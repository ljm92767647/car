/* List-only menus. Classification data, product layouts and free-view cameras remain in their original catalogues. */
(()=>{
 'use strict';
 const site=document.currentScript.dataset.collection,pane=document.querySelector('#catalog-pane');
 const root=document.createElement('section');root.id='collection-entry';root.tabIndex=-1;root.setAttribute('aria-label','목록 분류 선택');
 const back=document.createElement('button');back.id='collection-entry-back';back.setAttribute('aria-label','이전 선택으로 돌아가기');back.innerHTML='<svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d="M30 12H3M13 2 3 12l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 pane.parentElement.append(root,back);
 let home=true,penStage='types',daily=false,active=0,navigating=false,choices=[];
 const button=selector=>document.querySelector(selector);
 const dailyTitles=['Ballpoint Pen','Multi Pen','Mechanical Pencil'];
 const dailyNav=site==='pens'?document.createElement('nav'):null;
 if(dailyNav){dailyNav.id='daily-classification';dailyNav.setAttribute('aria-label','펜과 샤프 분류');dailyNav.hidden=true;dailyNav.innerHTML=['Ballpoint','Multi','Mecha'].map((label,i)=>`<button data-daily-choice="${i}" aria-pressed="${i===0}">${label}</button>`).join('');button('#classification').after(dailyNav);}
 function run(action){navigating=true;try{action();}finally{navigating=false;}}
 function enterDaily(index){
  daily=true;active=index;penStage='types';
  run(()=>{button('[data-section="daily"]').click();[...pane.querySelectorAll('.catalog-entry')].find(b=>b.textContent.trim()===dailyTitles[index])?.click();});
  home=false;sync();pane.querySelector('#catalog-back')?.focus({preventScroll:true});
 }
 function fountainMenu(){
  daily=false;penStage='fountain';active=0;run(()=>button('[data-section="fountain"]').click());home=true;render();
 }
 function options(){
  if(site==='pens'&&penStage==='types')return [...dailyTitles.map((title,i)=>({title,run:()=>enterDaily(i)})),{title:'Fountain Pen',run:fountainMenu}];
  const attr=site==='pens'||site==='cards'?'data-sort':'data-mode';
  return (site==='cars'?[['By Category','parking'],['By Brand','brand']]:[['By Brand','brand'],['By Style','style'],...(site==='watches'?[['By Color','color']]:[])]).map(([title,value])=>({title,selector:`header [${attr}="${value}"]`,run(){run(()=>button(this.selector)?.click());home=false;sync();(pane.querySelector('#catalog-back')||back).focus({preventScroll:true});}}));
 }
 function sync(){
  const list=document.body.dataset.presentation==='list',directory=!!pane.querySelector('.catalog-directory');
  if(dailyNav){dailyNav.hidden=!list||!daily||(home&&penStage==='types');dailyNav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));}
  root.hidden=!list||!home;root.inert=!list||!home;
  pane.classList.toggle('collection-entry-hidden',list&&home);pane.classList.toggle('collection-entry-directory',list&&!home&&directory);pane.inert=!list||home;
  back.hidden=!list||(home?!(site==='pens'&&penStage==='fountain'):!directory);
 }
 function render(){
  choices=options();root.dataset.menu=site==='pens'?penStage:'classification';
  root.innerHTML=choices.map((c,i)=>`<button type="button" class="collection-choice" data-choice="${i}"><span class="collection-choice-title">${c.title}</span></button>`).join('');sync();
 }
 function showHome(){home=true;render();root.querySelector('button')?.focus({preventScroll:true});}
 root.onclick=e=>{const choice=e.target.closest('[data-choice]');if(choice){active=Number(choice.dataset.choice);choices[active].run();}};
 back.onclick=()=>{if(home&&site==='pens'&&penStage==='fountain'){penStage='types';showHome();}else showHome();};
 document.addEventListener('click',e=>{
  if(navigating||document.body.dataset.presentation!=='list')return;
  if(site==='pens'){
   const collection=e.target.closest('header [data-section]');
   if(collection){daily=collection.dataset.section==='daily';penStage=daily?'types':'fountain';active=0;showHome();return;}
   const type=e.target.closest('[data-daily-choice]');if(type){enterDaily(Number(type.dataset.dailyChoice));return;}
   const sort=e.target.closest('header [data-sort]');if(sort){daily=false;penStage='fountain';home=false;sync();return;}
  }
  if(site==='cards'&&e.target.closest('header [data-sort="marking"]')){home=false;sync();return;}
  if(e.target.closest(site==='cards'?'header [data-sort]':'header [data-mode]')){home=false;sync();}
 });
 pane.addEventListener('click',e=>{if(site==='pens'&&daily&&e.target.closest('#catalog-back')){e.preventDefault();e.stopImmediatePropagation();penStage='types';showHome();}},true);
 window.addEventListener('keydown',e=>{
  if(root.hidden||!root.contains(document.activeElement)||document.querySelector('dialog[open]'))return;
  const buttons=[...root.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
  if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();}
  if(e.key==='Escape'&&site==='pens'&&penStage==='fountain'){e.preventDefault();e.stopImmediatePropagation();penStage='types';showHome();}
 },true);
 new MutationObserver(sync).observe(pane,{childList:true,subtree:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-presentation']});
 if(site==='pens')daily=button('[data-section="daily"]')?.getAttribute('aria-pressed')==='true';
 render();
 window.CollectionEntry={get state(){return{home,active,daily,penStage,titles:choices.map(c=>c.title)}},showHome};
})();
