import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
console.log('ext', doc.getRoot().listExtensionsUsed().map(e=>e.extensionName));
for (const node of doc.getRoot().listNodes()) { const m=node.getMesh(); if(!m) continue;
 for (const p of m.listPrimitives()) { const at = p.listSemantics().map(s=>{const a=p.getAttribute(s);return s+':'+a.getComponentType()+(a.getNormalized()?'n':'')+'x'+a.getElementSize()}).join(' ');
 console.log(node.getName(), m.getName(), 'S',node.getScale().map(v=>+v.toFixed(4)).join(','),'T',node.getTranslation().map(v=>+v.toFixed(2)).join(','), p.getMaterial()?.getName(), p.getAttribute('POSITION').getCount(), at); } }
