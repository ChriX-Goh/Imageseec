'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const viewer=readFileSync(join(__dirname,'..','viewer.js'),'utf8');
function block(start,end){const a=viewer.indexOf(start);assert.notEqual(a,-1,`missing ${start}`);const b=viewer.indexOf(end,a+start.length);assert.notEqual(b,-1,`missing ${end}`);return viewer.slice(a,b).trim();}
const identityBlock=block('    function entryIdentity(entry) {','    function refreshSingleSource(entry, identity, revision) {');
const snapshotBlock=block('    function scanSlotHasSelectedSource(slot) {','    function scanViewportSourceLoad(direction, state, viewport, origin) {');
const slotSignatureBlock=block('    function scanSlotSignature() {','    function explicitScanBoundary(direction) {');

function image(src,sourceCandidates=[src]){return {tagName:'IMG',currentSrc:src,complete:true,naturalWidth:800,naturalHeight:600,
  getAttribute(name){return name==='src'?this.currentSrc:null;},querySelectorAll(){return [];},sources:sourceCandidates};}
function slot(key,img,{pending=false,position=1}={}){const node={tagName:'ARTICLE',isConnected:true,children:[img],
  getAttribute(name){if(name==='aria-posinset')return String(position);if(name==='aria-setsize')return '4';return null;},
  querySelectorAll(){return [img];}};img.parentElement=node;return {key,node,pending,stable:true};}
function fixture(entries,slots){
  const scope={getAttribute(){return '4';}};
  const c=vm.createContext({});
  const prelude=`let entries=globalThis.initialEntries;const collection=globalThis.collection;const lens=globalThis.lens;
    globalThis.snapshot=scanResolvedSnapshot;globalThis.progress=scanResolvedProgress;globalThis.signature=scanSlotSignature;globalThis.oneSlotSignature=scanOneSlotSignature;`;
  c.initialEntries=entries;c.collection={scope,slots};c.lens={gallery:{sources(node){return node.sources||[];},key(value){return value;}}};
  vm.runInContext(`${identityBlock}\n${snapshotBlock}\n${slotSignatureBlock}\n${prelude}`,c);
  return c;
}
const ent=(slotKey,key,canonical)=>({key,slotKey,slotStable:true,canonicalIdentity:canonical,canonicalAmbiguous:false,aliases:[key],sources:[key]});

test('unselected picture srcset alternatives do not count as scanner progress',()=>{
  const active='https://img.test/selected-320.jpg',alternative='https://img.test/unselected-1600.jpg';
  const current=image(active,[active]);
  const slot1=slot('slot:1',current,{pending:false});
  const before=fixture([ent('slot:1',active,'https://origin.test/picture.jpg')],[slot1]);
  const beforeSnapshot=before.snapshot();const beforeSignature=before.signature();

  // A later collection learns an additional <picture><source srcset> resource,
  // while the browser-selected currentSrc and logical image stay unchanged.
  current.sources=[active,alternative];
  const after=fixture([Object.assign(ent('slot:1',active,'https://origin.test/picture.jpg'),{aliases:[active,alternative],sources:[active,alternative]})],[slot1]);
  const afterSnapshot=after.snapshot();
  assert.equal(after.progress(beforeSnapshot,afterSnapshot),false);
  assert.equal(after.signature(),beforeSignature,'responsive alternatives do not change the scan signature');
  assert.equal(afterSnapshot.resolvedSlotKeys.has('slot:1'),true);
});

test('responsive currentSrc switching inside an already resolved slot is not new gallery progress',()=>{
  const a='https://img.test/selected-a.jpg',b='https://img.test/selected-b.jpg';
  const current=image(a,[a,b]),slot1=slot('slot:1',current,{pending:false});
  const before=fixture([ent('slot:1',a,'https://origin.test/picture.jpg')],[slot1]);
  const beforeSnapshot=before.snapshot();const beforeSignature=before.signature();
  current.currentSrc=b;current.sources=[a,b];
  const after=fixture([Object.assign(ent('slot:1',b,'https://origin.test/picture.jpg'),{aliases:[a,b],sources:[a,b]})],[slot1]);
  assert.equal(after.progress(beforeSnapshot,after.snapshot()),false);
  assert.equal(after.signature(),beforeSignature);
});

test('a newly resolved active image or newly discovered slot still counts as progress',()=>{
  const placeholder='data:image/svg+xml,%3Csvg%3E%3C/svg%3E',active='https://img.test/lazy-image.jpg';
  const current=image(placeholder,[placeholder,active]),pending=slot('slot:lazy',current,{pending:true,position:2});
  const item=ent('slot:lazy',placeholder,'https://origin.test/lazy-image.jpg');
  const before=fixture([item],[pending]),beforeSnapshot=before.snapshot();
  current.currentSrc=active;current.sources=[placeholder,active];pending.pending=false;
  const after=fixture([Object.assign(ent('slot:lazy',active,'https://origin.test/lazy-image.jpg'),{aliases:[placeholder,active],sources:[placeholder,active]})],[pending]);
  assert.equal(after.progress(beforeSnapshot,after.snapshot()),true,'slot resolution is observable even though aliases are ignored');

  const extra=image('https://img.test/new-card.jpg'),extraSlot=slot('slot:new',extra,{pending:false,position:3});
  const withNew=fixture([ent('slot:lazy',active,'https://origin.test/lazy-image.jpg'),ent('slot:new',extra.currentSrc,'https://origin.test/new-card.jpg')],[pending,extraSlot]);
  assert.equal(withNew.progress(after.snapshot(),withNew.snapshot()),true,'new stable slot and identity remain progress');
});
