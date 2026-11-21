'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const viewer=readFileSync(join(root,'viewer.js'),'utf8');
const gallerySource=readFileSync(join(root,'gallery.js'),'utf8');
function block(start,end){const a=viewer.indexOf(start);assert.notEqual(a,-1,`source start ${start}`);const b=viewer.indexOf(end,a+start.length);assert.notEqual(b,-1,`source end ${end}`);return viewer.slice(a,b).trim();}
const poolBlock=block('  class ImagePool {','\n\n  lens.open');
const singleBlock=block('    async function showSingle(nextIndex) {','\n    function entryIdentity');
const identityHelpersBlock=block('    function entryIdentity(entry) {','    function refreshSingleSource(entry, identity, revision) {');
const singleRefreshBlock=block('    function refreshSingleSource(entry, identity, revision) {','    function refreshCompareSource(side, entry, identity, revision) {');
const compareRefreshBlock=block('    function refreshCompareSource(side, entry, identity, revision) {','\n    async function showPair');
const pairBlock=block('    async function showPair(leftIndex, rightIndex = leftIndex + 1) {','\n    function show(nextIndex)');
const refreshBlock=block('    function refresh(direction = scanningDirection) {','\n    function storageChanged');

class TestImage {
  static instances=[];
  constructor(){this.src='';this.alt='';this.hidden=false;this.onload=null;this.onerror=null;this.naturalWidth=0;this.naturalHeight=0;this.complete=false;this.style={};TestImage.instances.push(this);}
  removeAttribute(name){if(name==='src')this.src='';}
  resolve(src,width=1200,height=800){this.src=src;this.naturalWidth=width;this.naturalHeight=height;this.complete=true;this.onload?.();}
}
const resetImages=()=>{TestImage.instances=[];};
function poolContext(){resetImages();const c=vm.createContext({Image:TestImage,setTimeout,clearTimeout});vm.runInContext(`${poolBlock}\nglobalThis.Pool=ImagePool;`,c);return c;}
function entry(slot,key,source,extra={}){return {key,slotKey:slot,slotStable:true,sources:[source],aliases:[source],identityAliases:[source],thumb:extra.thumb||source,title:slot,node:{isConnected:true},...extra};}
async function ready(pool,item){const promise=pool.get(item,true),image=TestImage.instances.at(-1);image.resolve(item.sources[0]);await promise;return {promise,image};}

test('image cache revisions update only the changed slot and keep thumb-only reuse',async()=>{
  const c=poolContext();const pool=new c.Pool();
  const a1=entry('slot:A','A','https://media.test/a-original.jpg',{thumb:'https://media.test/a-thumb.jpg'});
  const b=entry('slot:B','B','https://media.test/b-original.jpg');
  const a1Loaded=await ready(pool,a1),bLoaded=await ready(pool,b);
  const thumbOnly={...a1,thumb:'https://media.test/a-thumb-v2.jpg'};
  assert.equal(pool.get(thumbOnly,true),a1Loaded.promise,'thumbnail updates do not evict the original image');
  const a2=entry('slot:A','A','https://media.test/a-original-v2.jpg',{thumb:'https://media.test/a-thumb-v2.jpg'});
  const a2Promise=pool.get(a2,true),a2Image=TestImage.instances.at(-1);
  assert.notEqual(a2Promise,a1Loaded.promise,'same logical key with new sources receives a new cache record');
  a2Image.resolve(a2.sources[0]);await a2Promise;
  const keep=new Set([pool.cacheKey(a2),pool.cacheKey(b)]);pool.retain(keep);
  assert.equal(pool.records.has(pool.cacheKey(a2)),true);
  assert.equal(pool.records.get(pool.cacheKey(b)).img,bLoaded.image,'unrelated original cache survives target invalidation');
  assert.equal(pool.records.has(pool.cacheKey(a1)),false,'superseded target cache is evicted only when no longer retained');
  assert.equal(TestImage.instances.length,3,'one request per original or revised slot');
  assert.equal(TestImage.instances[1].src,'https://media.test/b-original.jpg','unrelated original remains loaded');
  assert.equal(TestImage.instances[2].src,'https://media.test/a-original-v2.jpg','revised target loads from new source');
});

function refreshHarness({initial,newer,compareEnabled=true,galleryApi=null,scopeOverride}={}){
  const calls={single:[],pair:[],cache:0,counters:[],collectArgs:null};
  const scope=scopeOverride===undefined?{isConnected:true,parentElement:null}:scopeOverride;
  const labels=new Map();const $=selector=>{if(!labels.has(selector))labels.set(selector,{textContent:'',classList:{contains:()=>false}});return labels.get(selector);};
  const prelude=`
    let closed=false,standalone=false,scanningDirection=1,compareEnabled=${compareEnabled},compareLeft=0,compareRight=${compareEnabled?1:-1},index=0,activePane=0,lockedPane=null;
    let entries=globalThis.initialEntries,collection={scope:globalThis.scope,slots:[]},scopeParent=null,host={},scanPromise=null;
    const scanStates={before:{slotAttempts:new Map()},after:{slotAttempts:new Map()}};
    const lens=globalThis.lens;
    const activeIndex=()=>compareEnabled?(activePane===1?compareRight:compareLeft):index;
    const refreshScrollCandidates=()=>{};
    const rememberSourceAnchors=()=>{};
    const updateNavigationButtons=()=>{};
    const cacheNeighbors=()=>{globalThis.calls.cache++;};
    const refreshSingleSource=(item,id,revision)=>globalThis.calls.single.push({id,revision,key:item.key});
    const refreshCompareSource=(side,item,id,revision)=>globalThis.calls.pair.push({side,id,revision,key:item.key});
    const queueOverviewCommit=()=>{};
    const t=()=>'';
    const $=globalThis.$;
    const strip={classList:{contains:()=>false}};let overviewOpen=false;
    globalThis.runRefresh=refresh;
    globalThis.state=()=>({entries,compareLeft,compareRight,index});
  `;
  const activeGallery=galleryApi?{
    collect:(...args)=>{calls.collectArgs=args;return galleryApi.collect(...args);},
    mergeEntries:(existing,incoming,direction)=>galleryApi.mergeEntries(existing,incoming,direction)
  }:{collect:(...args)=>{calls.collectArgs=args;return {scope,slots:[],entries:newer};},mergeEntries(existing,incoming){
      const output=existing.slice();
      for(const incomingEntry of incoming){const prior=output.find(item=>item.slotKey===incomingEntry.slotKey);
        if(prior)Object.assign(prior,incomingEntry);else output.push(incomingEntry);}
      return output;
    }};
  const c=vm.createContext({URL,Image:TestImage,setTimeout,clearTimeout,calls,$,scope,initialEntries:initial,
    lens:{gallery:activeGallery}});
  vm.runInContext(`${identityHelpersBlock}\n${refreshBlock}\n${prelude}`,c);
  return {c,calls};
}

function liveGallery({source,canonical='',sharedPreview=''}){
  const attrs=new Map([['src',source]]);
  if(canonical)attrs.set('data-full',canonical);
  if(sharedPreview)attrs.set('data-srcset',`${sharedPreview} 640w`);
  const image={tagName:'IMG',isConnected:true,alt:'',title:'',className:'',currentSrc:source,complete:false,naturalWidth:0,naturalHeight:0,style:{},
    get src(){return attrs.get('src')||'';},set src(value){attrs.set('src',String(value));},
    getAttribute(name){return attrs.get(name)||null;},hasAttribute(name){return attrs.has(name);},closest(){return null;},
    getBoundingClientRect(){return {left:0,top:0,right:240,bottom:160,width:240,height:160};},querySelectorAll(){return [];}};
  const document={baseURI:'https://media.example.test/page',querySelectorAll(selector){return selector==='img'?[image]:[];}};
  const c=vm.createContext({URL,document,ImageLens:{i18n:{text:()=>''}},getComputedStyle:()=>({display:'block',visibility:'visible',backgroundImage:'none',aspectRatio:''})});
  vm.runInContext(gallerySource,c);
  return {gallery:c.ImageLens.gallery,image,attrs,initial:c.ImageLens.gallery.collect(source,image)};
}

test('real refresh preserves unchanged unscoped nodes, blocks shared-preview reuse, and keeps canonical source refresh',()=>{
  const unchanged=liveGallery({source:'https://media.example.test/unchanged.jpg'});
  assert.equal(unchanged.initial.scope,null);
  const unchangedEntry=unchanged.initial.entries[0],unchangedSources=[...unchangedEntry.sources];
  const unchangedRefresh=refreshHarness({initial:unchanged.initial.entries,galleryApi:unchanged.gallery,scopeOverride:null,compareEnabled:false});
  unchangedRefresh.c.runRefresh();
  assert.equal(unchangedRefresh.c.state().entries[0].node,unchanged.image,'no-change refresh keeps the original source node');
  assert.deepEqual(Array.from(unchangedRefresh.c.state().entries[0].sources),unchangedSources);
  assert.equal(unchangedRefresh.calls.single.length,0,'no-change refresh does not request a replacement image');
  assert.equal(unchangedRefresh.calls.cache,0,'no-change refresh does not rebuild the neighbor cache');

  const shared='https://media.example.test/shared-preview.jpg';
  const recycled=liveGallery({source:shared,sharedPreview:shared});
  const recycledEntry=recycled.initial.entries[0];
  recycled.image.src='https://media.example.test/new-item.jpg';
  recycled.image.currentSrc='https://media.example.test/new-item.jpg';
  const reused=refreshHarness({initial:recycled.initial.entries,galleryApi:recycled.gallery,scopeOverride:null,compareEnabled:false});
  reused.c.runRefresh();
  assert.equal(reused.c.state().entries.length,1);
  assert.equal(reused.c.state().entries[0].node,recycled.image,'the last known source node remains anchored');
  assert.deepEqual(Array.from(reused.c.state().entries[0].sources),Array.from(recycledEntry.sources),'a shared preview alias cannot replace the old snapshot');
  assert.equal(reused.calls.single.length,0,'recycled shared preview does not trigger a stale or unrelated reload');
  assert.equal(reused.calls.cache,0);

  const original='https://origin.example.test/photo.jpg';
  const revised=liveGallery({source:'https://media.example.test/photo-v1.jpg',canonical:original});
  const revisedEntry=revised.initial.entries[0];
  revised.image.src='https://media.example.test/photo-v2.jpg';
  revised.image.currentSrc='https://media.example.test/photo-v2.jpg';
  const canonicalRefresh=refreshHarness({initial:revised.initial.entries,galleryApi:revised.gallery,scopeOverride:null,compareEnabled:false});
  canonicalRefresh.c.runRefresh();
  assert.equal(canonicalRefresh.c.state().entries[0].canonicalIdentity,original);
  assert.ok(canonicalRefresh.c.state().entries[0].sources.includes(revised.image.currentSrc));
  assert.equal(canonicalRefresh.calls.single.length,1,'the same stable canonical identity still refreshes changed bytes');
  assert.equal(canonicalRefresh.calls.single[0].id,`canonical:${original}`);
  assert.equal(revisedEntry.node,revised.image);
});

test('same-count refresh reloads the visible source and preserves stable-slot indices on count growth',()=>{
  const oldA=entry('slot:A','old-key-A','https://img.test/a-v1.jpg');
  const oldB=entry('slot:B','key-B','https://img.test/b.jpg');
  const oldAThumb=oldA.thumb,oldANode=oldA.node;
  const newA=entry('slot:A','new-key-A','https://img.test/a-v2.jpg');
  const sameCount=refreshHarness({initial:[oldA,oldB],newer:[newA,{...oldB,sources:[...oldB.sources]}]});
  sameCount.c.runRefresh();
  const state=sameCount.c.state();
  assert.equal(sameCount.calls.collectArgs[0],oldAThumb,'refresh keeps the original seed URL for the snapshot request');
  assert.equal(sameCount.calls.collectArgs[1],oldANode,'refresh passes the original connected DOM node as a candidate');
  assert.equal(sameCount.calls.collectArgs[3],oldA,'gallery can revalidate the node against its previous logical entry');
  assert.equal(state.entries.length,2);
  assert.equal(state.compareLeft,0);assert.equal(state.compareRight,1);
  assert.equal(sameCount.calls.cache,1);
  assert.deepEqual(sameCount.calls.pair.map(item=>[item.side,item.id]),[[0,'slot:slot:A']]);

  const grown=refreshHarness({initial:[entry('slot:A','old-key-A','https://img.test/a-v1.jpg'),entry('slot:B','key-B','https://img.test/b.jpg')],
    newer:[entry('slot:A','new-key-A','https://img.test/a-v2.jpg'),entry('slot:B','key-B','https://img.test/b.jpg'),entry('slot:C','key-C','https://img.test/c.jpg')]});
  grown.c.runRefresh();
  const grownState=grown.c.state();
  assert.equal(grownState.entries.length,3);
  assert.equal(grownState.compareLeft,0);assert.equal(grownState.compareRight,1,'item insertion does not lose a pane when its media key changes');
  assert.deepEqual(grown.calls.pair.map(item=>[item.side,item.id]),[[0,'slot:slot:A']]);
});

test('canonical-conflict entries sharing one ARIA slot keep distinct viewer identities through real gallery merging',()=>{
  const gallerySource=readFileSync(join(root,'gallery.js'),'utf8');
  const c=vm.createContext({URL,document:{baseURI:'https://page.test/'}});
  vm.runInContext(gallerySource,c);
  vm.runInContext(`${identityHelpersBlock}\nglobalThis.identity=entryIdentity;`,c);
  const g=c.ImageLens.gallery;
  const item=(key,canonical,source)=>({key,slotStable:true,slotKey:'aria-posinset:4',canonicalIdentity:canonical,
    canonicalAmbiguous:false,sources:[source],aliases:[source],identityAliases:[source],thumb:source,node:{isConnected:true}});
  const initial=g.mergeEntries([item('https://cdn.test/a-v1.jpg','https://origin.test/a.jpg','https://cdn.test/a-v1.jpg')],
    [item('https://cdn.test/b.jpg','https://origin.test/b.jpg','https://cdn.test/b.jpg')]);
  assert.equal(initial.length,2,'the canonical conflict must remain two entries in production mergeEntries');
  const oldLeftKey=initial[0].key,oldRightKey=initial[1].key;
  const oldLeftIdentity=c.identity(initial[0]),oldRightIdentity=c.identity(initial[1]);
  assert.notEqual(oldLeftIdentity,oldRightIdentity,'viewer anchors include canonical identity when slots collide');
  const noSlotA=item('https://cdn.test/a-small.jpg','https://origin.test/a.jpg','https://cdn.test/a-small.jpg');
  noSlotA.slotStable=false;noSlotA.slotKey='';
  const noSlotB={...noSlotA,key:'https://cdn.test/a-large.jpg',sources:['https://cdn.test/a-large.jpg']};
  assert.equal(c.identity(noSlotA),c.identity(noSlotB),'canonical identity also stabilizes entries without a stable slot');
  const previous=new Map(initial.map(entry=>[c.identity(entry),JSON.stringify(entry.sources)]));
  c.entries=initial;
  const updateA=item('https://cdn.test/a-v2.jpg','https://origin.test/a.jpg','https://cdn.test/a-v2.jpg');
  const refreshed=g.mergeEntries(initial,[updateA,item('https://cdn.test/b.jpg','https://origin.test/b.jpg','https://cdn.test/b.jpg')]);
  const sourceUpdates=refreshed.filter(entry=>previous.get(c.identity(entry))!==JSON.stringify(entry.sources));
  const locate=(identity,key)=>{let at=refreshed.findIndex(entry=>c.identity(entry)===identity);if(at<0)at=refreshed.findIndex(entry=>entry.key===key);return at;};
  assert.deepEqual(JSON.parse(JSON.stringify(sourceUpdates.map(entry=>entry.canonicalIdentity))),['https://origin.test/a.jpg']);
  assert.equal(locate(oldLeftIdentity,oldLeftKey),0);
  assert.equal(locate(oldRightIdentity,oldRightKey),1);

  const updateB=item('https://cdn.test/b-v2.jpg','https://origin.test/b.jpg','https://cdn.test/b-v2.jpg');
  const nextPrevious=new Map(refreshed.map(entry=>[c.identity(entry),JSON.stringify(entry.sources)]));
  const next=g.mergeEntries(refreshed,[item('https://cdn.test/a-v2.jpg','https://origin.test/a.jpg','https://cdn.test/a-v2.jpg'),updateB]);
  assert.deepEqual(JSON.parse(JSON.stringify(next.filter(entry=>nextPrevious.get(c.identity(entry))!==JSON.stringify(entry.sources)).map(entry=>entry.canonicalIdentity))),
    ['https://origin.test/b.jpg'],'the other same-slot identity is not spuriously refreshed');
});

test('snapshot reconciliation catches canonical enrichment only through a unique safe stable-slot and key fallback',()=>{
  const gallerySource=readFileSync(join(root,'gallery.js'),'utf8');
  const c=vm.createContext({URL,document:{baseURI:'https://page.test/'}});vm.runInContext(gallerySource,c);
  vm.runInContext(`${identityHelpersBlock}\nglobalThis.identity=entryIdentity;globalThis.createIndex=createPreviousEntrySnapshotIndex;globalThis.previous=previousEntrySnapshot;`,c);
  const g=c.ImageLens.gallery;
  const item=(key,canonical,source,options={})=>({key,slotStable:true,slotKey:'aria-posinset:4',canonicalIdentity:canonical,
    canonicalAmbiguous:options.ambiguous||false,sources:[source],aliases:[source],identityAliases:[source],thumb:source,node:{isConnected:true}});

  // Real merge enriches the existing same-slot item and deliberately preserves
  // its first key. Its viewer identity changes from slot-only to slot+canonical.
  const initial=g.mergeEntries([], [item('https://cdn.test/a-v1.jpg','', 'https://cdn.test/a-v1.jpg')]);
  const initialIdentity=c.identity(initial[0]);
  const snapshots=initial.map(entry=>({identity:c.identity(entry),key:entry.key,slotStable:entry.slotStable,slotKey:entry.slotKey,
    canonicalIdentity:entry.canonicalIdentity||'',canonicalAmbiguous:entry.canonicalAmbiguous===true,sourceRevision:JSON.stringify(entry.sources)}));
  const enriched=g.mergeEntries(initial,[item('https://cdn.test/a-v2.jpg','https://origin.test/a.jpg','https://cdn.test/a-v2.jpg')]);
  assert.equal(enriched.length,1);
  assert.equal(enriched[0].key,'https://cdn.test/a-v1.jpg','production merge preserves the earlier key on stable-slot reconciliation');
  assert.notEqual(initialIdentity,c.identity(enriched[0]));
  const prior=c.previous(enriched[0],c.createIndex(snapshots));
  assert.equal(prior, snapshots[0]);
  assert.notEqual(prior.sourceRevision,JSON.stringify(enriched[0].sources),'the uniquely correlated revision is detected');

  // A current ambiguous image must fail closed even though two prior entries
  // share the same slot and key. A canonical conflict also prevents fallback.
  const oldConflicts=g.mergeEntries([], [
    item('https://cdn.test/shared-key.jpg','https://origin.test/a.jpg','https://cdn.test/shared-key.jpg'),
    item('https://cdn.test/shared-key.jpg','https://origin.test/b.jpg','https://cdn.test/shared-key.jpg')
  ]);
  assert.equal(oldConflicts.length,2);
  const conflictSnapshots=oldConflicts.map(entry=>({identity:c.identity(entry),key:entry.key,slotStable:entry.slotStable,slotKey:entry.slotKey,
    canonicalIdentity:entry.canonicalIdentity||'',canonicalAmbiguous:entry.canonicalAmbiguous===true,sourceRevision:JSON.stringify(entry.sources)}));
  const conflictIndex=c.createIndex(conflictSnapshots);
  const ambiguous=item('https://cdn.test/shared-key.jpg','', 'https://cdn.test/new.jpg',{ambiguous:true});
  assert.equal(c.previous(ambiguous,conflictIndex),null,'ambiguous evidence cannot use slot+key fallback');
  const noCanonical=item('https://cdn.test/shared-key.jpg','', 'https://cdn.test/new.jpg');
  assert.equal(c.previous(noCanonical,conflictIndex),null,'multiple compatible prior candidates fail closed');
  const conflictingCanonical=item('https://cdn.test/shared-key.jpg','https://origin.test/c.jpg','https://cdn.test/new.jpg');
  assert.equal(c.previous(conflictingCanonical,conflictIndex),null,'different known canonicals are not migrated by slot+key');
});

test('previous-entry snapshot reconciliation indexes 2000 and 5000 items with linear work',()=>{
  const c=vm.createContext({});
  vm.runInContext(`${identityHelpersBlock}\nglobalThis.identity=entryIdentity;globalThis.createIndex=createPreviousEntrySnapshotIndex;globalThis.previous=previousEntrySnapshot;`,c);
  for(const size of [2000,5000]){
    const entries=Array.from({length:size},(_,n)=>({key:`key-${n}`,slotStable:true,slotKey:`slot-${n}`,
      canonicalIdentity:`canonical-${n}`,canonicalAmbiguous:false}));
    let arrayReads=0;
    const counted=new Proxy(entries,{get(target,key,receiver){if(typeof key==='string'&&/^\d+$/.test(key))arrayReads++;return Reflect.get(target,key,receiver);}});
    const index=c.createIndex(counted),buildReads=arrayReads;
    const misses=[],exactHits=[];
    for(let n=0;n<size;n++){
      exactHits.push(c.previous(entries[n],index)===entries[n]);
      const next={...entries[n],key:`new-key-${n}`,canonicalIdentity:`canonical-new-${n}`,sourceRevision:`new-${n}`};
      misses.push(c.previous(next,index)===null);
    }
    const lookupReads=arrayReads-buildReads;
    assert.equal(exactHits.every(Boolean),true,'exact canonical identities use their direct postings');
    assert.equal(misses.every(Boolean),true,'changed keys cannot match a different snapshot slot');
    assert.ok(buildReads<=size+2,`index builder reads at most once per entry (size=${size}, reads=${buildReads})`);
    assert.equal(lookupReads,0,'indexed lookups do not revisit the source array');
    process.stdout.write(JSON.stringify({size,indexBuildReads:buildReads,lookupSnapshotReads:lookupReads})+'\n');
  }
});

test('single refresh preserves locked zoom and normalized image anchor after dimensions change',async()=>{
  const current=entry('slot:A','key-A','https://img.test/a-v2.jpg');
  const context={closed:false,serial:5,singleSourceRefreshId:0,entries:[current],index:0,
    pool:{get:()=>Promise.resolve({src:'https://img.test/a-v2.jpg',naturalWidth:2000,naturalHeight:1000})},
    width:1000,height:500,scale:1.6,lockedScale:1.6,settings:{zoomLocked:true},panX:160,panY:-80,
    stage:{getBoundingClientRect:()=>({width:800,height:600})},photo:{hidden:false,src:'old',alt:''},message:{hidden:false},
    $:()=>({textContent:''}),t:()=>'',transform(){}};
  const c=vm.createContext(context);vm.runInContext(`${identityHelpersBlock}\n${singleRefreshBlock}`,c);
  const oldX=.5-context.panX/(context.width*context.scale),oldY=.5-context.panY/(context.height*context.scale);
  c.refreshSingleSource(current,'slot:slot:A',JSON.stringify(current.sources));
  await Promise.resolve();await Promise.resolve();
  assert.equal(c.photo.src,'https://img.test/a-v2.jpg');
  assert.equal(c.scale,1.6);assert.equal(c.lockedScale,1.6);
  assert.ok(Math.abs(.5-c.panX/(c.width*c.scale)-oldX)<1e-9);
  assert.ok(Math.abs(.5-c.panY/(c.height*c.scale)-oldY)<1e-9);
});

test('compare refresh updates one side without resetting zoom, lock, divider, or pane anchors',async()=>{
  const updated=entry('slot:B','key-B','https://img.test/b-v2.jpg');
  const panes=[{src:'left-original',alt:'left'},{src:'right-old',alt:'right'}];
  const context={closed:false,serial:8,compareSourceRefreshIds:[0,0],entries:[entry('slot:A','key-A','https://img.test/a.jpg'),updated],
    compareLeft:0,compareRight:1,lockedPane:0,activePane:1,dividerPosition:.43,compareScale:2.4,lockedScale:2.4,
    comparePanX:[.2,-.1],comparePanY:[.15,.07],compareDims:[{width:1000,height:700,fit:1}, {width:800,height:1200,fit:1}],
    pool:{get:()=>Promise.resolve({src:'https://img.test/b-v2.jpg',naturalWidth:1600,naturalHeight:900})},comparePhotos:panes,message:{hidden:false},
    $:()=>({textContent:''}),t:()=>'',transform(){},updateCompareControls(){}};
  const c=vm.createContext(context);vm.runInContext(`${identityHelpersBlock}\n${compareRefreshBlock}`,c);
  const before={activePane:c.activePane,lockedPane:c.lockedPane,divider:c.dividerPosition,scale:c.compareScale,panX:[...c.comparePanX],panY:[...c.comparePanY],leftSrc:panes[0].src};
  c.refreshCompareSource(1,updated,'slot:slot:B',JSON.stringify(updated.sources));
  await Promise.resolve();await Promise.resolve();
  assert.equal(panes[1].src,'https://img.test/b-v2.jpg');assert.equal(panes[0].src,before.leftSrc);
  assert.deepEqual([c.activePane,c.lockedPane,c.dividerPosition,c.compareScale],[before.activePane,before.lockedPane,before.divider,before.scale]);
  assert.deepEqual(c.comparePanX,before.panX);assert.deepEqual(c.comparePanY,before.panY);
  assert.deepEqual([c.compareDims[1].width,c.compareDims[1].height],[1600,900]);
});

test('pending single and paired loads cannot repaint after viewer close',async()=>{
  for(const mode of ['single','pair']){
    resetImages();
    const entries=mode==='pair'?[entry('slot:A','A','https://img.test/a.jpg'),entry('slot:B','B','https://img.test/b.jpg')]:[entry('slot:A','A','https://img.test/a.jpg')];
    const comparePhotos=[new TestImage(),new TestImage()];
    const photo=new TestImage(),nodes=new Map();
    const $=selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',classList:{remove(){},add(){},toggle(){}},setAttribute(){}});return nodes.get(selector);};
    const c=vm.createContext({Image:TestImage,setTimeout,clearTimeout,Promise,Math,
      closed:false,serial:0,entries,index:0,compareEnabled:mode==='pair',compareLeft:0,compareRight:mode==='pair'?1:-1,
      activePane:0,lockedPane:null,pairNeedsAnchor:false,settings:{zoomLocked:false},lockedScale:null,scale:1,panX:0,panY:0,width:0,height:0,
      compareScale:1,comparePanX:[0,0],comparePanY:[0,0],compareDims:[null,null],compareSourceRefreshIds:[0,0],hold:null,preset:null,note:'',photo,comparePhotos,
      compare:{classList:{remove(){},add(){}},setAttribute(){}},overview:{classList:{remove(){},add(){}},setAttribute(){}},
      stage:{hidden:false,classList:{remove(){},add(){},toggle(){}},getBoundingClientRect(){return {width:800,height:600};}},message:{hidden:false},
      pool:null,$,t:()=>'',status(){},updateNavigationButtons(){},updateEdgePreviews(){},endHold(){},transform(){},updateCompareControls(){},cacheNeighbors(){},showStrip(){},renderStrip(){},
      strip:{classList:{contains:()=>false}},overviewOpen:false});
    vm.runInContext(`${poolBlock}\nglobalThis.pool=new ImagePool();\n${identityHelpersBlock}\n${singleBlock}\n${pairBlock}\nglobalThis.begin=()=>compareEnabled?showPair(0,1):showSingle(0);`,c);
    const uiImages=TestImage.instances.length;
    const pending=c.begin();
    const before=mode==='pair'?comparePhotos.map(image=>image.src):[photo.src];
    for(const image of TestImage.instances.slice(uiImages))image.resolve(image.src||'https://img.test/loaded.jpg');
    c.closed=true;c.serial++;c.pool.clear();await pending;
    const after=mode==='pair'?comparePhotos.map(image=>image.src):[photo.src];
    assert.deepEqual(after,before,`${mode} view must not write after close`);
  }
});
