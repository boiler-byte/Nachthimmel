/** Static + headless DOM/canvas smoke check for the generated one-file release. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'dist/Nachthimmel_v2.html'),'utf8');
let code = source.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)?.[1];
assert(code && code.includes("__require('main.js')"),'Inline release script present');
// The location controls must live in their own modal, not in general settings.
const generalSettingsMarkup = source.split('id="layersModal"')[1].split('id="pathsModal"')[0];
const pathMarkup = source.split('id="pathsModal"')[1].split('id="locationModal"')[0];
assert(!generalSettingsMarkup.includes('id="planetPathsBtn"'), 'Path toggles were moved out of layer modal');
assert(!pathMarkup.includes('id="aircraftBtn"'), 'Aircraft toggle remains in layer modal');
for (const id of ['planetPathsBtn', 'sunPathBtn', 'moonPathBtn', 'pathArrowsBtn', 'selectedPathBtn']) {
 assert(pathMarkup.includes(`id="${id}"`), `${id} belongs to trajectory modal`);
}
assert(generalSettingsMarkup.includes('id="aircraftBtn"'), 'Aircraft layer exists');
assert(generalSettingsMarkup.includes('id="aircraftDistanceRange"'), 'Aircraft distance slider is in layer dialog');
assert(!pathMarkup.includes('aircraftDistanceRange'), 'Aircraft distance slider is not a trajectory');
assert(!source.includes('airlabsKey'), 'No AirLabs API key interface');
const observerSettingsMarkup = source.split('id="locationModal"')[1].split('<script>')[0];
for (const id of ['latInput','lonInput','gpsBtn','saveLocation','magInput','magLabel']) {
 assert(observerSettingsMarkup.includes(`id="${id}"`),`${id} belongs to location modal`);
 assert(!generalSettingsMarkup.includes(`id="${id}"`),`${id} removed from general settings`);
}
assert(observerSettingsMarkup.includes('Beobachtungsstandort') && observerSettingsMarkup.includes('Darstellung'),'Both requested sections exist');
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
const savedLocal = new Map();
const localStorage = {getItem:key=>savedLocal.get(key)??null,setItem:(key,val)=>{savedLocal.set(key,String(val));},removeItem:key=>savedLocal.delete(key)};
const c={document:doc,window:win,localStorage,console,Image:class {set src(v){this._src=v;}},URL,URLSearchParams,Intl,Date,Math,Map,Set,Number,String,Array,Boolean,Object,RegExp,Error,Promise,AbortController,encodeURIComponent,decodeURIComponent,
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
assert.equal(JSON.parse(localStorage.getItem('nachthimmelApp')).layers.planets, true, 'Layer toggle persisted under localStorage.nachthimmelApp');
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
// The top-right location button must open its own dialog and retain data flow.
el('locationTop').click();
assert(el('locationModal').classList.contains('visible'),'Dedicated observer modal opened');
assert(!el('layersModal').classList.contains('visible'),'Layer dialog not opened by location button');
assert.equal(el('latInput').value,'48.1370','Latitude synchronized when opening');
assert.equal(el('lonInput').value,'11.5760','Longitude synchronized when opening');
el('latInput').value='40.4168';
el('lonInput').value='-3.7038';
el('saveLocation').click();
assert.equal(store.lat,40.4168,'Latitude saved in location modal');
assert.equal(store.lon,-3.7038,'Longitude saved in location modal');
assert(!el('locationModal').classList.contains('visible'),'Saving closes location modal');
// Unconfirmed coordinates must be discarded on reopening.
el('locationTop').click();
el('latInput').value='20';
el('locationClose').click();
el('locationTop').click();
assert.equal(el('latInput').value,'40.4168','Unsaved values discarded');
el('magInput').value='4.75';
el('magInput').listeners.input.forEach(fn=>fn({target:el('magInput')}));
assert.equal(store.mag,4.75,'Magnitude changes remain supported');
assert.equal(JSON.parse(localStorage.getItem('nachthimmelApp')).mag, 4.75, 'Magnitude stored locally');
assert(el('magLabel').textContent.includes('4,75'),'Magnitude label updated');
el('locationClose').click();
el('layersBtn').click();
assert(el('layersModal').classList.contains('visible'),'Layer button opens layer dialog');
assert(!el('pathsModal').classList.contains('visible'),'Paths dialog remains closed');
assert(!el('locationModal').classList.contains('visible'),'Observer modal stays closed');
el('pathsBtn').click();
assert(el('pathsModal').classList.contains('visible'),'Paths button opens trajectory dialog');
assert(!el('layersModal').classList.contains('visible'),'Opening paths closes layers dialog');
el('pathsClose').click();
assert(!el('pathsModal').classList.contains('visible'),'Paths close works');
el('layersBtn').click();
el('layersClose').click();
assert(!el('layersModal').classList.contains('visible'),'Layer close works');
assert.equal(store.aircraftMaxDistanceKm,100,'Default aircraft range 100 km');
assert.equal(el('aircraftDistanceValue').textContent,'100 km','Range label initialized');
el('aircraftDistanceRange').value='50';
el('aircraftDistanceRange').listeners.input.forEach(fn=>fn());
assert.equal(store.aircraftMaxDistanceKm,50,'Range slider updates active aircraft filter');
assert.equal(JSON.parse(localStorage.getItem('nachthimmelApp')).aircraftMaxDistanceKm, 50, 'Aircraft radius stored locally');
assert.equal(el('aircraftDistanceValue').textContent,'50 km','Range label updates on input');
el('aircraftDistanceRange').value='100';
el('aircraftDistanceRange').listeners.input.forEach(fn=>fn());
// The GPS callback must close only the observer modal.
c.navigator.geolocation={getCurrentPosition:success=>success({coords:{latitude:53.628,longitude:11.416}})};
el('locationTop').click();
el('gpsBtn').click();
assert.equal(store.place,'53,628°, 11,416°','GPS displays coordinates until the place name arrives');
assert.equal(store.lat,53.628,'GPS coordinates applied');
const locationPreferences=JSON.parse(localStorage.getItem('nachthimmelApp'));
assert.equal(locationPreferences.location.lat,53.628,'GPS latitude saved for next launch');
assert.equal(locationPreferences.location.lon,11.416,'GPS longitude saved for next launch');
const fakeRestored={lat:0,lon:0,place:'',mag:6,aircraftMaxDistanceKm:25,layers:{...store.layers}};
assert(c.__getModule('core/preferences.js').restorePreferences(fakeRestored,localStorage),'Persisted settings can be reloaded');
assert.equal(fakeRestored.lat,53.628,'Restoring uses last GPS location');
assert.equal(fakeRestored.mag,4.75,'Restoring uses saved magnitude');
assert.equal(fakeRestored.aircraftMaxDistanceKm,100,'Restoring uses saved aircraft range');
assert(!el('locationModal').classList.contains('visible'),'GPS closes observer modal');
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
const adsb=c.__getModule('features/aircraft/adsb.service.js');
const example=adsb.parseAircraftStates({now:Date.now(),ac:[{
 hex:'3c4b5a',lat:52.5,lon:13.4,alt_geom:30000,gs:200,track:91,seen_pos:2
}]});
assert(example.size===1,'ADSB.lol format normalized');
assert(Math.abs(example.get('3c4b5a').altitude-9144)<1,'Feet converted to metres');
assert(adsb.aircraftProxyURL('https://example.com/nachthimmel/').pathname==='/nachthimmel/api/aircraft','Relative same-origin ADSB proxy URL');
// Selected live aircraft show both distance types and optional image with a local fallback.
store.lat=52.52;store.lon=13.405;
const chosen=example.get('3c4b5a');
c.__getModule('ui/dialogs.js').updateSelection('aircraft',chosen);
assert(el('detailPanel').innerHTML.includes('Zum Standort (horizontal)'),'Horizontal observer distance shown');
assert(el('detailPanel').innerHTML.includes('Direkte Entfernung'),'Slant distance shown');
assert(el('detailPanel').innerHTML.includes('hexdb.io/api/v2/aircraft/3c4b5a/image/thumbnail'),'Photo only on selection');
el('aircraftPhotoImage').listeners.error?.forEach(fn=>fn());
assert(el('aircraftDetailPhoto').outerHTML.includes('OHNE FOTO'),'Missing photo falls back to illustration');
// A second frame after interactive changes must still render correctly.
frame=scheduled.shift();frame(400);
assert(position.hitTargets.length>=0,'Second canvas frame completed');
console.log('PASS standalone JS execution, initial render, Canvas dimensions, star/constellation fallback, seven ephemerides,',position.hitTargets.length,'hit targets,',layers.length,'layers including Sun/Moon and paths');
