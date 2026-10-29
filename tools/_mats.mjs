import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const m of process.argv.slice(2)) { const d = await io.read(`public/assets/models/${m}.glb`); console.log(m, d.getRoot().listMaterials().map(x=>x.getName()+':'+x.getBaseColorFactor().map(v=>v.toFixed(2)).join(',')+':m'+x.getMetallicFactor()+(x.getEmissiveTexture()?':E':'')).join(' | ')); }
