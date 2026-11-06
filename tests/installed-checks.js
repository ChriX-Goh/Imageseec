// Test-only handler checks for an installed extension in an isolated profile.
// Pointer/wheel events here are synthetic; trusted browser input is a separate check.
(async () => {
  const root=()=>document.querySelector('#image-lens-viewer')?.shadowRoot;
  const frame=()=>new Promise(requestAnimationFrame), delay=ms=>new Promise(r=>setTimeout(r,ms));
  const checks=[]; const record=(name,pass,evidence)=>checks.push({name,pass:!!pass,evidence});
  const read=()=>{const r=root(),o=r.querySelector('.overview'),b=o.getBoundingClientRect(),horizontal=o.classList.contains('horizontal'),cards=[...o.querySelectorAll('.overview-card')];return {
    pair:r.querySelector('.counter').textContent,zoom:r.querySelector('.fit').textContent,
    panes:[...r.querySelectorAll('.compare-pane')].map(p=>({lock:p.querySelector('button').getAttribute('aria-pressed'),transform:p.querySelector('img').style.transform,src:p.querySelector('img').getAttribute('src')})),
    total:cards.length,unique:new Set(cards.map(c=>c.dataset.key)).size,overview:o.classList.contains('active'),horizontal,left:o.scrollLeft,top:o.scrollTop,
    width:o.scrollWidth,viewWidth:o.clientWidth,height:o.scrollHeight,viewHeight:o.clientHeight,
    buffer:cards.filter(c=>{const x=c.getBoundingClientRect();return(horizontal?x.left>=b.right:x.top>=b.bottom)&&c.querySelector('img').hasAttribute('src')}).length,
    cards:cards.map(c=>({x:c.offsetLeft,y:c.offsetTop,w:c.offsetWidth,h:c.offsetHeight,border:getComputedStyle(c).borderTopWidth,caption:getComputedStyle(c.querySelector('span')).display}))};};
  const ready=async()=>{let until=performance.now()+8000;while(performance.now()<until){const r=root();if(!r)return false;if(r.querySelector('.resolution').textContent)return true;if(!r.querySelector('.message').hidden&&r.querySelector('.message').textContent.includes('Could not'))return false;await delay(60);}return false;};
  const click=async s=>{root().querySelector(s).click();await ready();};
  const key=async key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await ready();await frame();};
  const set=async next=>{const {settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...settings,...next}});await delay(120);};
  if(!await ready())return {checks:[{name:'images load',pass:false}],error:'Initial pair load failed'};
  if(root().querySelector('.compare-toggle').getAttribute('aria-pressed')!=='true')await click('.compare-toggle');
  await set({compareStep:2,holdZoom:200,overviewDirection:'vertical',overviewClean:false,overviewBuffer:6,cacheBefore:2,cacheAfter:2,doubleClickExit:false});
  await key('Home');const initial=read(),total=Number(initial.pair.split('/').pop());
  record('paired opening',initial.pair.startsWith('1 | 2 / '),initial.pair);
  if(total<3)return {checks,total,error:'Group too small for full sweep'};
  await key('ArrowRight');record('group advance',total<4?read().pair===initial.pair:read().pair.startsWith('3 | 4 / '),read().pair);
  await key('Home');await click('.compare-pane.left .pane-lock');await key('ArrowRight');record('left lock',read().pair.startsWith('1 | 3 / '),read().pair);
  await click('.compare-pane.right .pane-lock');await key('ArrowRight');record('exclusive right lock',read().pair.startsWith('2 | 3 / ')&&read().panes[0].lock==='false'&&read().panes[1].lock==='true',read().pair);
  await click('.compare-pane.right .pane-lock');await key('Home');
  const r=root(),compare=r.querySelector('.compare'),box=compare.getBoundingClientRect(),divider=r.querySelector('.divider');
  // Synthetic untrusted pointer events exercise installed handlers; real browser input is checked separately.
  const emit=(target,type,x,y,alt=false)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,composed:true,cancelable:true,pointerId:1,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,altKey:alt}));
  emit(divider,'pointerdown',box.width/2,300);emit(divider,'pointermove',1,300);emit(divider,'pointerup',1,300);
  record('divider bound',Math.abs(parseFloat(divider.style.left)/box.width-.33)<.004,divider.style.left);
  divider.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));record('divider reset',Math.abs(parseFloat(divider.style.left)/box.width-.5)<.004,divider.style.left);
  const before=read();emit(compare,'pointerdown',box.width/4,300);const held=read();emit(compare,'pointermove',box.width/4+80,330);emit(compare,'pointerup',box.width/4+80,330);const after=read();
  record('sync hold and release',held.zoom==='200%'&&after.zoom==='100%'&&after.panes.every((p,n)=>p.transform===before.panes[n].transform),{held:held.zoom,released:after.zoom});
  emit(compare,'pointerdown',box.width/4,300,true);emit(compare,'pointermove',box.width/4+100,350,true);emit(compare,'pointerup',box.width/4+100,350,true);
  record('sync alt drag',read().panes.every(p=>p.transform.includes('translate(100px, 50px)')),read().panes.map(p=>p.transform));
  await key('Home');
  const wheel=async extra=>{r.querySelector('.compare').dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,composed:true,deltaY:100,clientX:300,clientY:300,...extra}));await ready();};
  await wheel({});record('wheel navigation',total<4?read().pair.startsWith('1 | 2 / '):read().pair.startsWith('3 | 4 / '),read().pair);await delay(260);const pair=read().pair;
  await wheel({altKey:true});record('alt wheel zoom',read().pair===pair&&read().zoom!=='100%',read().zoom);
  await key('0');await wheel({shiftKey:true});record('shift wheel fine zoom',read().pair===pair&&read().zoom==='99%',read().zoom);
  await key('0');await set({compareStep:1});await key('Home');await key('ArrowRight');record('single step',read().pair.startsWith('2 | 3 / '),read().pair);await set({compareStep:2});
  await click('.overview-toggle');await delay(700);let vertical=read();
  const ordered=(cards,h)=>cards.every((b,n)=>!n||(h?(b.x>cards[n-1].x||(b.x===cards[n-1].x&&b.y>cards[n-1].y)):(b.y>cards[n-1].y||(b.y===cards[n-1].y&&b.x>cards[n-1].x))));
  record('vertical row order and single axis',!vertical.horizontal&&ordered(vertical.cards,false)&&vertical.width<=vertical.viewWidth+1,{count:vertical.total,width:vertical.width,view:vertical.viewWidth});
  record('overview dedup and buffer6',vertical.total>=total&&vertical.total===vertical.unique&&vertical.buffer<=6,{total:vertical.total,buffer:vertical.buffer});
  await key('ArrowDown');await delay(240);record('vertical scroll geometry',read().height>=read().viewHeight&&read().viewHeight>0,{height:read().height,viewport:read().viewHeight,trustedKeyboardCheckedSeparately:true});
  await set({overviewDirection:'horizontal',overviewClean:true});let horizontal=read();
  record('horizontal column order and single axis',horizontal.horizontal&&ordered(horizontal.cards,true)&&horizontal.height<=horizontal.viewHeight+1,{count:horizontal.total,height:horizontal.height,view:horizontal.viewHeight});
  record('borderless without captions',horizontal.cards.every(c=>c.border==='0px'&&c.caption==='none'),horizontal.cards.slice(0,1));
  const o=r.querySelector('.overview');o.dispatchEvent(new WheelEvent('wheel',{deltaY:220,bubbles:true,composed:true,cancelable:true}));await delay(150);
  record('horizontal wheel and buffer',horizontal.width<=horizontal.viewWidth||read().left>0&&read().top===0, {left:read().left,top:read().top,buffer:read().buffer});
  await set({overviewBuffer:0});record('zero buffer immediate',read().buffer===0,read().buffer);
  await set({overviewBuffer:12});record('twelve buffer bound',read().buffer<=12,read().buffer);
  await set({overviewBuffer:6,cacheBefore:0,cacheAfter:0});record('overview buffer independent of original cache',read().buffer<=6,{buffer:read().buffer});
  const chosen=Math.min(4,read().total-2);await click(`.overview-card[data-index="${chosen}"]`);record('overview selection pair',read().pair.startsWith(`${chosen+1} | ${chosen+2} / `),read().pair);
  const selected=read().pair;await click('.overview-toggle');await key('Escape');record('overview Escape return',!read().overview&&read().pair===selected,read().pair);
  await set({overviewDirection:'vertical',overviewClean:false,overviewBuffer:6,cacheBefore:2,cacheAfter:2,doubleClickExit:true});
  const end=read();r.querySelector('.close').click();await delay(200);const base=globalThis.__qaBaseline;const restored=!base||Math.abs(scrollY-base.y)<1&&Math.abs(scrollX-base.x)<1&&base.nested.every(p=>Math.abs(p.node.scrollTop-p.y)<1&&Math.abs(p.node.scrollLeft-p.x)<1);record('source scroll restored',restored,base&&{before:[base.x,base.y],after:[scrollX,scrollY],nested:base.nested.map(p=>({before:[p.x,p.y],after:[p.node.scrollLeft,p.node.scrollTop]}))});
  return {total,checks,passed:checks.every(c=>c.pass),endPair:end.pair,closed:!root(),documentPosition:{x:scrollX,y:scrollY},sourceDimensions:[...document.querySelectorAll('img')].length};
});
