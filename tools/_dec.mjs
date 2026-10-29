import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const id of fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean)) {
  try { const doc = await io.read(`public/assets/models/r2/${id}.glb`);
    for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt|KHR_texture_basisu|EXT_texture_webp/.test(e.extensionName)) { if (!/webp/.test(e.extensionName)) e.dispose(); }
    await io.write(`../work/r3/orient4/src/${id}.glb`, doc); } catch (e) { console.log('FAIL', id, e.message); }
}
