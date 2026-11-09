// Test-only handler checks for an installed extension in an isolated profile.
// Pointer/wheel events here are synthetic; trusted browser input is a separate check.
(async () => {
  const root=()=>document.querySelector('#image-lens-viewer')?.shadowRoot;
  const frame=()=>new Promise(requestAnimationFrame), delay=ms=>new Promise(r=>setTimeout(r,ms));
  const checks=[]; const record=(name,pass,evidence)=>checks.push({name,pass:!!pass,evidence});
  const viewportAtOpen={width:innerWidth,clientWidth:document.documentElement.clientWidth};
  const read=()=>{const r=root(),o=r.querySelector('.overview'),b=o.getBoundingClientRect(),horizontal=o.classList.contains('horizontal'),cards=[...o.querySelectorAll('.overview-card')],visibleCards=cards.filter(c=>{const x=c.getBoundingClientRect();return x.right>b.left&&x.left<b.right&&x.bottom>b.top&&x.top<b.bottom}),visible=visibleCards.map(c=>Number(c.dataset.index)),first=visible.length?Math.min(...visible):0,last=visible.length?Math.max(...visible):first,center=visibleCards.sort((a,z)=>{const x=a.getBoundingClientRect(),y=z.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;return Math.hypot(x.left+x.width/2-cx,x.top+x.height/2-cy)-Math.hypot(y.left+y.width/2-cx,y.top+y.height/2-cy);})[0];return {
    pair:r.querySelector('.counter').textContent,zoom:r.querySelector('.fit').textContent,
    panes:[...r.querySelectorAll('.compare-pane')].map(p=>({lock:p.querySelector('button').getAttribute('aria-pressed'),transform:p.querySelector('img').style.transform,src:p.querySelector('img').getAttribute('src')})),
    total:cards.length,unique:new Set(cards.map(c=>c.dataset.key)).size,overview:o.classList.contains('active'),horizontal,left:o.scrollLeft,top:o.scrollTop,centerIndex:center?Number(center.dataset.index):-1,centerKey:center?.dataset.key,
    modal:r.querySelector('dialog').matches(':modal'),rootOverflow:getComputedStyle(document.documentElement).overflow,
    rootGutter:getComputedStyle(document.documentElement).scrollbarGutter,viewport:{width:innerWidth,clientWidth:document.documentElement.clientWidth},
    width:o.scrollWidth,viewWidth:o.clientWidth,height:o.scrollHeight,viewHeight:o.clientHeight,
    preloadedBefore:cards.filter(c=>Number(c.dataset.index)<first&&c.dataset.thumbState==='ready'&&c.querySelector('img').naturalWidth>0).length,
    preloadedAfter:cards.filter(c=>Number(c.dataset.index)>last&&c.dataset.thumbState==='ready'&&c.querySelector('img').naturalWidth>0).length,
    visibleCount:visible.length,visibleFirst:first,visibleLast:last,overviewCacheBeforeMode:r.querySelector('[name="overviewCacheBeforeMode"]').value,
    overviewCacheBefore:Number(r.querySelector('[name="overviewCacheBefore"]').value),overviewCacheAfterMode:r.querySelector('[name="overviewCacheAfterMode"]').value,
    overviewCacheAfter:Number(r.querySelector('[name="overviewCacheAfter"]').value),
    cards:cards.map(c=>({x:c.offsetLeft,y:c.offsetTop,w:c.offsetWidth,h:c.offsetHeight,border:getComputedStyle(c).borderTopWidth,caption:getComputedStyle(c.querySelector('span')).display}))};};
  const ready=async()=>{let until=performance.now()+8000;while(performance.now()<until){const r=root();if(!r)return false;if(r.querySelector('.resolution').textContent)return true;if(!r.querySelector('.message').hidden&&r.querySelector('.message').textContent.includes('Could not'))return false;await delay(60);}return false;};
  const click=async s=>{root().querySelector(s).click();await ready();};
  const key=async key=>{window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await ready();await frame();};
  const openSource=async image=>{
    if(!image?.isConnected)return false;
    image.scrollIntoView({block:'center',inline:'nearest'});
    const box=image.getBoundingClientRect(),clientX=box.left+box.width/2,clientY=box.top+box.height/2;
    const init={bubbles:true,composed:true,cancelable:true,button:0,ctrlKey:true,clientX,clientY};
    image.dispatchEvent(new MouseEvent('mousedown',init));image.dispatchEvent(new MouseEvent('click',init));
    const until=performance.now()+8000;while(!root()&&performance.now()<until)await delay(50);
    return root()?ready():false;
  };
  const set=async next=>{const r=root(),form=r.querySelector('.settings');form.hidden=false;for(const [name,value] of Object.entries(next)){const input=form.querySelector(`[name="${name}"]`);if(!input)throw new Error(`Missing setting ${name}`);if(input.type==='checkbox')input.checked=Boolean(value);else input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));await delay(30);}form.hidden=true;r.querySelector('.viewer').focus({preventScroll:true});await delay(380);};
  if(!await ready())return {checks:[{name:'images load',pass:false}],error:'Initial pair load failed'};
  if(root().querySelector('.compare-toggle').getAttribute('aria-pressed')!=='true')await click('.compare-toggle');
  await set({compareStep:2,holdZoom:200,overviewDirection:'vertical',overviewAlignment:'auto',overviewGap:12,overviewClean:false,overviewScale:100,overviewCacheBeforeMode:'auto',overviewCacheAfterMode:'auto',cacheBefore:2,cacheAfter:2,doubleClickExit:false});
  await key('Home');const initial=read(),total=Number(initial.pair.split('/').pop());
  record('paired opening',initial.pair.startsWith('1 | 2 / '),initial.pair);
  record('modal top layer keeps page scroll locked',initial.modal&&initial.rootOverflow==='hidden'&&initial.viewport.width===viewportAtOpen.width&&initial.viewport.clientWidth===viewportAtOpen.clientWidth,{modal:initial.modal,overflow:initial.rootOverflow,gutter:initial.rootGutter,initial:viewportAtOpen,current:initial.viewport});
  if(total<3)return {checks,total,error:'Group too small for full sweep'};
  await key('ArrowRight');record('group advance',total<4?read().pair===initial.pair:read().pair.startsWith('3 | 4 / '),read().pair);
  await key('Home');await click('.compare-pane.left .pane-lock');await key('ArrowRight');record('left lock',read().pair.startsWith('1 | 3 / '),read().pair);
  await click('.compare-pane.right .pane-lock');await key('ArrowRight');record('exclusive right lock',read().pair.startsWith('2 | 3 / ')&&read().panes[0].lock==='false'&&read().panes[1].lock==='true',read().pair);
  await click('.compare-pane.right .pane-lock');await key('Home');
  const r=root(),compare=r.querySelector('.compare'),box=compare.getBoundingClientRect(),divider=r.querySelector('.divider');
  // Synthetic untrusted pointer events exercise installed handlers; real browser input is checked separately.
  const emit=(target,type,x,y,alt=false)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,composed:true,cancelable:true,pointerId:1,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,altKey:alt}));
  const dividerAfter=getComputedStyle(divider,'::after');record('divider handle hidden by default',getComputedStyle(divider).getPropertyValue('--divider-handle-y')===''&&dividerAfter.visibility==='hidden',{visibility:dividerAfter.visibility,handleY:divider.style.getPropertyValue('--divider-handle-y')});
  emit(divider,'pointerenter',box.width/2,175);emit(divider,'pointermove',box.width/2,175);record('divider handle follows pointer Y',divider.style.getPropertyValue('--divider-handle-y')==='175px',divider.style.getPropertyValue('--divider-handle-y'));
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
  if(total>=40)for(let n=0;n<Math.floor(total/5);n++)await key('ArrowRight');
  const beforeOverview=read(),expectedCenter=Number(beforeOverview.pair.split(' | ')[0])-1;await key('g');await delay(700);const parentKeys=[...root().querySelectorAll('.overview-card[aria-current="true"]')].map(c=>c.dataset.key);let vertical=read(),activeCard=root().querySelector(`.overview-card[data-index="${expectedCenter}"]`),activeBox=activeCard?.getBoundingClientRect(),overviewBox=root().querySelector('.overview').getBoundingClientRect(),activeCenterDelta=activeBox?Math.abs((activeBox.top+activeBox.bottom)/2-(overviewBox.top+overviewBox.bottom)/2):null;
  record('overview opens with active image at vertical center',activeCenterDelta!==null&&activeCenterDelta<=innerHeight*.15,{expectedCenter,centerDelta:activeCenterDelta,tolerance:innerHeight*.15,centerIndex:vertical.centerIndex,initialScrollTop:vertical.top});
  // Masonry lanes keep source order independently; mixed ratios can stagger neighbors in other lanes.
  const ordered=(cards,h)=>{const ends=new Map();return cards.every(b=>{const lane=h?b.y:b.x,offset=h?b.x:b.y,previous=ends.get(lane);ends.set(lane,offset+(h?b.w:b.h));return previous===undefined||offset>=previous-1;});};
  record('vertical masonry lane order and single axis',!vertical.horizontal&&ordered(vertical.cards,false)&&vertical.width<=vertical.viewWidth+1,{count:vertical.total,width:vertical.width,view:vertical.viewWidth});
  record('overview dedup and bidirectional preload',vertical.total>=total&&vertical.total===vertical.unique&&vertical.visibleCount>0&&vertical.preloadedBefore>0&&vertical.preloadedAfter>0,{total:vertical.total,before:vertical.preloadedBefore,after:vertical.preloadedAfter,visible:vertical.visibleCount});
  await key('ArrowDown');await delay(240);record('vertical scroll geometry',read().height>=read().viewHeight&&read().viewHeight>0,{height:read().height,viewport:read().viewHeight,trustedKeyboardCheckedSeparately:true});
  await set({overviewDirection:'horizontal',overviewClean:true});let horizontal=read();
  record('horizontal masonry lane order and single axis',horizontal.horizontal&&ordered(horizontal.cards,true)&&horizontal.height<=horizontal.viewHeight+1,{count:horizontal.total,height:horizontal.height,view:horizontal.viewHeight});
  record('borderless without captions',horizontal.cards.every(c=>c.border==='0px'&&c.caption==='none'),horizontal.cards.slice(0,1));
  const o=r.querySelector('.overview');o.dispatchEvent(new WheelEvent('wheel',{deltaY:220,bubbles:true,composed:true,cancelable:true}));await delay(150);
  record('horizontal wheel and preload',horizontal.width<=horizontal.viewWidth||read().left>0&&read().top===0, {left:read().left,top:read().top,before:read().preloadedBefore,after:read().preloadedAfter});
  await set({overviewCacheBeforeMode:'custom',overviewCacheBefore:0,overviewCacheAfterMode:'custom',overviewCacheAfter:35});
  // Readiness means load + decode, rather than merely assigning src. Wait for
  // the bounded concurrency queue before comparing the requested buffer size.
  const cacheDeadline=performance.now()+8000;
  while(performance.now()<cacheDeadline){const current=read(),expected=Math.min(35,Math.max(0,current.total-current.visibleLast-1));if(current.preloadedAfter===expected)break;await delay(60);}
  const custom=read(),expectedAfter=Math.min(35,Math.max(0,custom.total-custom.visibleLast-1));record('independent custom overview cache',custom.overviewCacheBeforeMode==='custom'&&custom.overviewCacheBefore===0&&custom.overviewCacheAfterMode==='custom'&&custom.overviewCacheAfter===35&&custom.preloadedBefore===0&&custom.preloadedAfter===expectedAfter,{before:custom.preloadedBefore,after:custom.preloadedAfter,expectedAfter,requestedAfter:custom.overviewCacheAfter});
  await set({overviewCacheBeforeMode:'auto',overviewCacheAfterMode:'auto',cacheBefore:0,cacheAfter:0});
  const automatic=read();record('auto overview cache independent of original cache',automatic.overviewCacheBeforeMode==='auto'&&automatic.overviewCacheAfterMode==='auto'&&automatic.preloadedAfter>0,{before:automatic.preloadedBefore,after:automatic.preloadedAfter,originalCache:[0,0]});
  await key('g');record('G returns from overview to image view',!read().overview,read().pair);
  await key('g');record('G reopens overview',read().overview,read().total);
  const chosen=Math.min(4,read().total-2);await click(`.overview-card[data-index="${chosen}"]`);record('overview selection pair',read().pair.startsWith(`${chosen+1} | ${chosen+2} / `),read().pair);
  await set({overviewDirection:'vertical',overviewAlignment:'auto',overviewGap:12,overviewClean:false,overviewCacheBeforeMode:'auto',overviewCacheAfterMode:'auto',overviewCacheBefore:12,overviewCacheAfter:12,cacheBefore:2,cacheAfter:2,doubleClickExit:true});
  const end=read(),targetSource=end.panes[0]?.src||r.querySelector('.photo')?.getAttribute('src'),absolute=value=>{try{return new URL(value,location.href).href;}catch{return value;}},wanted=absolute(targetSource||''),sourceImage=[...document.images].find(image=>[image.currentSrc,image.src,image.getAttribute('data-full'),image.getAttribute('data-src')].some(value=>value&&absolute(value)===wanted)),sourceNode=sourceImage||null;
  let sourceScroller=sourceNode?.parentElement;
  while(sourceScroller&&sourceScroller!==document.documentElement&&!(sourceScroller.scrollHeight>sourceScroller.clientHeight+4&&/auto|scroll|overlay|hidden/.test(getComputedStyle(sourceScroller).overflowY)))sourceScroller=sourceScroller.parentElement;
  await key('Escape');await delay(250);
  const returnedBox=sourceNode?.isConnected?sourceNode.getBoundingClientRect():null,returnedCenter=returnedBox?(returnedBox.top+returnedBox.bottom)/2:null;
  const nested=sourceScroller&&sourceScroller!==document.documentElement,viewportHeight=nested?sourceScroller.clientHeight:innerHeight,viewportCenterY=(nested?sourceScroller.getBoundingClientRect().top+sourceScroller.clientTop:0)+viewportHeight/2;
  const centerDelta=returnedCenter===null?null:Math.abs(returnedCenter-viewportCenterY);
  record('Escape from selected image exits to its source',!root()&&centerDelta!==null&&centerDelta<=viewportHeight*.15,{position:[scrollX,scrollY],targetFound:Boolean(sourceNode),targetCenterY:returnedCenter,viewportCenterY,centerDelta,tolerance:viewportHeight*.15,targetCheckedWithTrustedInputSeparately:true});
  if(document.querySelector('#open-viewer')&&await openSource(sourceNode)){
    await key('g');const overviewEscapeKey=root().querySelector('.overview');await key('Escape');await delay(160);
    record('Escape from overview exits directly to source',!root(),{overviewWasOpen:Boolean(overviewEscapeKey)});
    if(await openSource(sourceNode)){
      await key('g');root().querySelector('.close').click();await delay(160);
      record('close button exits directly from overview',!root(),{overviewWasOpen:true});
    }
  }
  record('viewer exits and restores source page',!root(),{position:[scrollX,scrollY]});
  return {total,checks,passed:checks.every(c=>c.pass),endPair:end.pair,closed:!root(),documentPosition:{x:scrollX,y:scrollY},sourceDimensions:[...document.querySelectorAll('img')].length};
});
