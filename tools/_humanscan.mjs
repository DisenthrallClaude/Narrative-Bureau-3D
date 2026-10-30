import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs'; import path from 'path';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const re=/pilot|human|person|people|character|woman|(^|[^a-z])man([^a-z]|$)|men([^a-z]|$)|soldier|crew(?!driver)|driver(?!s?_?screw)|passenger|mannequin|figure|figurine|npc|mixamo|torso|hair|skeleton|armature|biped|bip0|statue|bust|doll|corpse|zombie|girl|boy|guy|lady|officer|guard(?!rail)|nurse|doctor|worker/i;
function* walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())yield* walk(p);else if(f.endsWith('.glb'))yield p;}}
let n=0;
for(const f of walk('public/assets/models')){ n++; let doc; try{doc=await io.read(f);}catch(e){console.log('ERR',f,e.message);continue;}
  const r=doc.getRoot(); const hits=new Set();
  for(const x of r.listNodes()) if(re.test(x.getName())) hits.add('N:'+x.getName());
  for(const x of r.listMeshes()) if(re.test(x.getName())) hits.add('M:'+x.getName());
  for(const x of r.listMaterials()) if(re.test(x.getName())) hits.add('T:'+x.getName());
  if(r.listSkins().length) hits.add('SKIN×'+r.listSkins().length);
  if(hits.size) console.log('HIT',f,[...hits].slice(0,8).join(' , '));
}
console.log('scanned',n);
