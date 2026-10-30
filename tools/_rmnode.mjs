// 删 GLB 里指定名字的节点（及其网格），保留其余属性：node tools/_rmnode.mjs in.glb out.glb name1,name2
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [i, o, names] = process.argv.slice(2); const doc = await io.read(i); const del = names.split(',');
for (const n of doc.getRoot().listNodes()) if (del.includes(n.getName())) { const m = n.getMesh(); n.dispose(); m?.dispose(); console.log('removed', n.getName()); }
await doc.transform(prune({ keepAttributes: true }));
await io.write(o, doc);
