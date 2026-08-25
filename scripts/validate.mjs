import fs from 'node:fs';import path from 'node:path';import { execFileSync } from 'node:child_process';import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=['main.cjs','preload.cjs','renderer/index.html','renderer/app.js','renderer/game/Game.js','renderer/game/simulation/MatchSimulation.js','tests/determinism.test.js'];
for(const rel of required){if(!fs.existsSync(path.join(root,rel)))throw new Error(`Missing required file: ${rel}`);}
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()&&!['node_modules','dist'].includes(entry.name))walk(p);else if(entry.isFile()&&/\.(js|mjs|cjs)$/.test(entry.name))files.push(p);}}walk(root);
for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

for(const file of files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'))){
  const text=fs.readFileSync(file,'utf8');
  const importRe=/from\s+['"](\.[^'"]+)['"]/g;
  for(const match of text.matchAll(importRe)){
    const target=path.resolve(path.dirname(file),match[1]);
    const candidates=[target,`${target}.js`,`${target}.mjs`,`${target}.cjs`,path.join(target,'index.js')];
    if(!candidates.some(candidate=>fs.existsSync(candidate)))throw new Error(`Broken relative import in ${path.relative(root,file)}: ${match[1]}`);
  }
}

const simulationFiles=files.filter(f=>f.includes(`${path.sep}simulation${path.sep}`));for(const file of simulationFiles){const text=fs.readFileSync(file,'utf8');if(/Math\.random\s*\(/.test(text))throw new Error(`Math.random used in simulation: ${path.relative(root,file)}`);}
const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
const pixiScript='../node_modules/pixi.js/dist/pixi.min.js';
const cspSafeScript='../node_modules/pixi.js/dist/packages/unsafe-eval.min.js';
if(!html.includes(pixiScript))throw new Error('PixiJS runtime path is not the expected standalone path');
if(!html.includes(cspSafeScript))throw new Error('PixiJS CSP-safe runtime module is missing');
if(html.indexOf(cspSafeScript)<html.indexOf(pixiScript))throw new Error('PixiJS CSP-safe runtime module must load after PixiJS');
if(html.indexOf(cspSafeScript)>html.indexOf('./bootstrap.js'))throw new Error('PixiJS CSP-safe runtime module must load before the application bootstrap');
console.log(`Validation OK: ${files.length} JS files syntax-checked; simulation contains no Math.random().`);
