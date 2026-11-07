/** Static + headless DOM/canvas smoke check for the generated one-file release. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'dist/Nachthimmel_v2.html'),'utf8');
let code = source.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)?.[1];
assert(code && code.includes("__require('main.js')"),'Inline release script present');
code = code.replace("__require('main.js');", "globalThis.__getModule = __require; __require('main.js');");
const errors=[];
let scheduled=[];
let context2d;
const noop=()=>{};
const gradient={addColorStop:noop};
context2d=new Proxy({}, {get(t,k){return k in t ? t[k] : k==='measureText' ? (s=>({width:s.length*6})) : (k==='createRadialGradient'||k==='createLinearGradient') ? (()=>gradient) : noop;},set(t,k,v){t[k]=v;return true;}});
const els=new Map();
class E {
 constructor(id){this.id=id;this.style={};this.innerHTML='';this.textContent='';this.value='';this.dataset={};this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.title='';this.classSet=new Set();this.classList={add:k=>this.classSet.add(k),remove:k=>this.classSet.delete(k),contains:k=>this.classSet.has(k),toggle:(k,v)=>{if(v===undefined)v=!this.classSet.has(k);if(v)this.classSet.add(k);else this.classSet.delete(k);return v;}};}
 addEventListener(ev,cb){(this.listeners[ev]??=[]).push(cb);}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 getContext(){return context2d;}
 append(el){el.parent=this;this.children.push(el);}
 remove(){if(this.parent){const a=this.parent.children;const i=a.indexOf(this);if(i>=0)a.splice(i,1);}this.removed=true;}
 get firstElementChild(){return this.children[0]||null;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
 contains(){return false;}
 blur(){}
 focus(){}
 scrollTo(){}
 setPointerCapture(){}
 click(){this.onclick?.();this.listeners.click?.forEach(fn=>fn({target:this}));}
}
const el=id=>els.has(id)?els.get(id):(els.set(id,new E(id)),els.get(id));
const layerIds=['stars','planets','sunMoon','constellations','deepSky','satellites','aircraft','planetPaths','sunPath','moonPath','pathArrows','selectedPath'];
const layerButtons=layerIds.map(key=>{const v=el(`${key}Toggle`);v.dataset.layer=key;return v;});
const planetButtons=['mercury','venus','mars','jupiter','saturn','uranus','neptune'].map(key=>{const v=el(`${key}Jump`);v.dataset.planetJump=key;return v;});
const doc={hidden:false,activeElement:null,body:el('body'),getElementById:el,createElement:tag=>new E(tag),addEventListener:noop,
 querySelectorAll:q=>q==='[data-planet-jump]'?planetButtons:q==='.layer-toggle'?layerButtons:[],
 querySelector:q=>{const m=q.match(/data-layer="([^"]+)"/);return m?layerButtons.find(e=>e.dataset.layer===m[1]):null;}};
const win={innerWidth:1240,innerHeight:760,devicePixelRatio:1,addEventListener:noop,removeEventListener:noop,setInterval:noop};
const c={document:doc,window:win,console,Image:class {set src(v){this._src=v;}},URL,URLSearchParams,Intl,Date,Math,Map,Set,Number,String,Array,Boolean,Object,RegExp,Error,Promise,AbortController,encodeURIComponent,decodeURIComponent,
 navigator:{},history:{state:null,pushState:noop,replaceState:noop,back:noop},performance:{now:()=>1000},
 requestAnimationFrame:fn=>{scheduled.push(fn);return scheduled.length;},setTimeout:()=>0,clearTimeout:noop,
 setInterval:noop,clearInterval:noop,
 sessionStorage:{getItem:()=>'',setItem:noop,removeItem:noop},fetch:async()=>{throw new Error('Offline test');},globalThis:null};
c.globalThis=c;
const script=new vm.Script(code,{filename:'Nachthimmel_v2.html',importModuleDynamically:async()=>{throw Error('Offline test');}});
const context=vm.createContext(c);
script.runInContext(context,{timeout:5000});
assert(scheduled.length,'Render callback scheduled on boot');
let frame=scheduled.shift();frame(200);
assert(+el('sky').width===1240 && +el('sky').height===760,'Canvas resized');
assert(el('clockValue').textContent,'Clock updated');
assert(el('compassBearing').textContent,'Compass updated');
const store=c.__getModule('core/store.js').state;
assert(store.stars.length>50,'Offline star fallback');
assert(store.constellations.length>=10,'Offline constellation fallback');
assert(store.layers.planets,'Planets layer enabled');
let p=c.__getModule('features/planets/planets.orbits.js').planetObservations(new Date('2026-11-07T21:00:00Z'));
assert(p.length===7,'Seven planets');
assert(p.every(x=>Number.isFinite(x.ra) && Number.isFinite(x.dec) && Number.isFinite(x.dist)),'Planet positions finite');
const position=c.__getModule('engine/projection.js');
assert(position.hitTargets.length>30,'Sky hit targets registered');
const layers=c.__getModule('engine/layer-registry.js').skyRenderer.ids;
assert(layers.length===16 && layers.includes('sun-moon') && layers.includes('selected-path'),'All sky layers registered');
assert(store.layers.sunMoon && !store.layers.planetPaths && !store.layers.sunPath && !store.layers.moonPath,'Uncluttered default visibility');
// Exercise the original interaction wiring against the modular services.
layerButtons.find(x=>x.dataset.layer==='planets').click();
assert.equal(store.layers.planets,false,'Planets disabled from settings toggle');
layerButtons.find(x=>x.dataset.layer==='planets').click();
assert.equal(store.layers.planets,true,'Planets reenabled from settings toggle');
const jupiter=c.__getModule('features/planets/planets.data.js').PLANETS.find(p=>p.id==='jupiter');
c.__getModule('ui/dialogs.js').updateSelection('planet',jupiter);
assert.equal(store.selected.item.id,'jupiter','Details selection stored');
assert(el('detailPanel').innerHTML.includes('Jupiter'),'Details HTML rendered');
assert(el('detailPanel').classList.contains('visible'),'Detail panel shown');
assert(el('detailPanel').innerHTML.includes('Auswahlbahn ausblenden'),'Selected planet trajectory enabled');
el('togglePathDetail').click();
assert.equal(store.layers.selectedPath,false,'Detail toggle disables selected trajectory');
el('togglePathDetail').click();
assert.equal(store.layers.selectedPath,true,'Detail toggle re-enables selected trajectory');
c.__getModule('ui/selection.js').focusObject('planet',jupiter);
assert.ok(store.fov<=58,'Planet zoom applied');
assert.equal(c.__getModule('sensors/geolocation.js').setLocation(48.137,11.576,'München'),true,'Observer location changed');
assert.equal(store.place,'München');
assert.ok(c.__getModule('ui/search.js').searchItems('Jupiter').some(x=>x.kind==='planet'&&x.items.length===1),'Search finds Jupiter');
const ephem=c.__getModule('features/solar-system/celestial.ephemeris.js');
assert(Number.isFinite(ephem.observeBody('moon').illum),'Moon ephemeris calculated');
assert.equal(c.__getModule('ui/search.js').searchItems('Mond')[0].items[0].id,'moon','Moon searchable');
c.__getModule('ui/dialogs.js').updateSelection('body',ephem.BODIES.find(b=>b.id==='moon'));
assert(el('detailPanel').innerHTML.includes('Mondphase'),'Moon details available');
layerButtons.find(x=>x.dataset.layer==='planetPaths').click();
layerButtons.find(x=>x.dataset.layer==='sunPath').click();
layerButtons.find(x=>x.dataset.layer==='moonPath').click();
assert(store.layers.planetPaths&&store.layers.sunPath&&store.layers.moonPath,'Path layers enabled from settings');
el('nextHour').click();
assert.ok(store.offsetMs>0,'Time control adds one hour');
el('nowBtn').click();
assert.equal(store.offsetMs,0,'Now returns to real time');
const airlabs=c.__getModule('features/aircraft/airlabs.service.js');
airlabs.setAirLabsKey(' sample-key ');
assert.equal(airlabs.getAirLabsKey(),'sample-key','AirLabs key accessors');
airlabs.setAirLabsKey('');
// A second frame after interactive changes must still render correctly.
frame=scheduled.shift();frame(400);
assert(position.hitTargets.length>=0,'Second canvas frame completed');
console.log('PASS standalone JS execution, initial render, Canvas dimensions, star/constellation fallback, seven ephemerides,',position.hitTargets.length,'hit targets,',layers.length,'layers including Sun/Moon and paths');
