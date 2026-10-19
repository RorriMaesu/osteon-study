import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),esbuild=require('esbuild');
const root=fileURLToPath(new URL('../',import.meta.url));
const modelAssets=Object.fromEntries(['skeleton','course-tissues','landmark-details'].map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(root,'assets',n+'.glb'))).digest('hex').slice(0,12)]));
fs.writeFileSync(path.join(root,'src/model-assets.json'),JSON.stringify(modelAssets,null,2)+'\n');
const nodeModules=path.dirname(path.dirname(path.dirname(require.resolve('three'))));
const threeRoot=path.dirname(path.dirname(require.resolve('three')));
// Load the declared source files directly, avoiding compiler discovery in parent
// folders outside this project. No broader filesystem permissions are needed.
const workspaceSource={name:'workspace-source',setup(build){
 build.onResolve({filter:/.*/},args=>{
  let target;
  if(args.path==='three')target=path.join(threeRoot,'build/three.module.js');
  else if(args.path.startsWith('three/'))target=require.resolve(args.path);
  else if(args.path.startsWith('.')||path.isAbsolute(args.path))target=path.resolve(args.importer?path.dirname(args.importer):root,args.path);
  else return {errors:[{text:'Undeclared build dependency: '+args.path}]};
  return {path:target,namespace:'workspace-source'};
 });
 build.onLoad({filter:/.*/,namespace:'workspace-source'},args=>({contents:fs.readFileSync(args.path,'utf8'),loader:args.path.endsWith('.json')?'json':'js',resolveDir:path.dirname(args.path)}));
}};
await esbuild.build({absWorkingDir:root,tsconfigRaw:{},entryPoints:['./src/main.js'],bundle:true,format:'esm',minify:true,outfile:path.join(root,'app.js'),nodePaths:[nodeModules],plugins:[workspaceSource]});
const hash=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);
const file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
html=html.replace(/href="workspace\.css(?:\?v=[a-z0-9]+)?"/,`href="workspace.css?v=${hash('workspace.css')}"`);
html=html.replace(/href="style\.css(?:\?v=[a-z0-9]+)?"/,`href="style.css?v=${hash('style.css')}"`).replace(/src="app\.js(?:\?v=[a-z0-9]+)?"/,`src="app.js?v=${hash('app.js')}"`);
fs.writeFileSync(file,html);
console.log('Built application and versioned assets.');
