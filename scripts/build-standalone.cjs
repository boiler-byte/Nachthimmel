/** Build one self-contained, directly openable HTML file from the ES module project. */
const fs = require('fs');
const path = require('path');
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root = path.resolve(__dirname,'..');
const src = path.join(root,'src');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name);
 if(entry.isDirectory())walk(full);
 else if(entry.name.endsWith('.js'))files.push(full);
}}
walk(src);
files.sort();
const modules = files.map(file=>{
 const key=path.relative(src,file).replaceAll('\\','/');
 // Keep the two satellite.js CDN fallbacks as native browser dynamic imports.
 const input=fs.readFileSync(file,'utf8').replace(/\bimport\(\s*(?=['"]https:\/\/)/g,'__remoteImport(');
 const output=ts.transpileModule(input,{fileName:file,compilerOptions:{
  module:ts.ModuleKind.CommonJS,
  target:ts.ScriptTarget.ES2022,
  removeComments:false,
 }}).outputText;
 return `${JSON.stringify(key)}: function(require,module,exports) {\n${output}\n}`;
});
const wrapper=`(function () {\n'use strict';\nconst __remoteImport = (url) => import(url);\nconst __modules = {\n${modules.join(',\n')}\n};\nconst __cache = Object.create(null);\nfunction __resolve(base,request) {\n const parts = base.split('/');parts.pop();\n for(const p of request.split('/')){if(p==='..')parts.pop();else if(p!=='.'&&p!=='')parts.push(p);}\n return parts.join('/');\n}\nfunction __require(key){\n if(__cache[key])return __cache[key].exports;\n const factory=__modules[key];\n if(!factory)throw new Error('Missing Nachthimmel module: '+key);\n const module={exports:{}};__cache[key]=module;\n factory((request)=>__require(__resolve(key,request)),module,module.exports);\n return module.exports;\n}\n__require('main.js');\n})();`;
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=['tokens.css','layout.css','responsive.css','overrides.css'].map(name=>fs.readFileSync(path.join(src,'styles',name),'utf8')).join('\n');
html=html.replace(/(?:<link rel="stylesheet" href="\.\/src\/styles\/[^>]+>\s*){4}/,`<style>\n${css}\n</style>\n`);
html=html.replace('<script type="module" src="./src/main.js"></script>',`<script>\n${wrapper.replaceAll('</script','<\\/script')}\n</script>`);
if(/src\/styles|src\/main\.js/.test(html)) throw Error('Standalone references local files');
const dest=path.join(root,'dist','Nachthimmel_v2.html');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,html);
console.log(`Standalone build: ${dest} (${Math.round(Buffer.byteLength(html)/1024)} KiB, ${files.length} modules)`);
