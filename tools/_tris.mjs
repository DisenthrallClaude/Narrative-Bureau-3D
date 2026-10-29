import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const m of process.argv.slice(2)) { try { const d = await io.read(`public/assets/models/${m}.glb`); let t = 0; for (const me of d.getRoot().listMeshes()) for (const p of me.listPrimitives()) { const i = p.getIndices(); t += i ? i.getCount() / 3 : p.getAttribute('POSITION').getCount() / 3; } console.log(m, Math.round(t)); } catch (e) { console.log(m, 'ERR', e.message.slice(0,60)); } }
