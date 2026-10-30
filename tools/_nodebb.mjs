import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const ap = (m, v) => [0, 1, 2].map((k) => m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]);
for (const n of doc.getRoot().listNodes()) { const me = n.getMesh(); if (!me) continue; const M = n.getWorldMatrix(); const min=[1e9,1e9,1e9],max=[-1e9,-1e9,-1e9];
 for (const p of me.listPrimitives()) { const pos=p.getAttribute('POSITION'); const el=[]; for(let i=0;i<pos.getCount();i++){ pos.getElement(i,el); const v=ap(M,el); for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}}
 console.log(n.getName(), 'R', n.getRotation().map(v=>v.toFixed(2)).join(','), 'min', min.map(v=>v.toFixed(2)).join(','), 'max', max.map(v=>v.toFixed(2)).join(',')); }
