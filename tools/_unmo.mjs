// 解 meshopt / 量化，导出普通 GLB（给本机 Blender 4.3 做朝向接触表用）：node tools/_unmo.mjs in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [src, dst] = process.argv.slice(2);
const doc = await io.read(src);
for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt|quantiz|texture_webp/i.test(e.extensionName) && !/webp/i.test(e.extensionName)) e.dispose();
await doc.transform(dequantize());
await io.write(dst, doc);
