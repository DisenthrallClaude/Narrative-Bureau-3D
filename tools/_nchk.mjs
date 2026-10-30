import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); let tot = 0, bad = 0, area = 0, badA = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    const P = p.getAttribute('POSITION'), N = p.getAttribute('NORMAL'), I = p.getIndices().getArray();
    if (!N) { console.log('no normal', mesh.getName()); continue; }
    const a=[0,0,0],b=[0,0,0],c=[0,0,0],n=[0,0,0];
    for (let t = 0; t < I.length; t += 3) { P.getElement(I[t],a);P.getElement(I[t+1],b);P.getElement(I[t+2],c);
      const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]]; const fn=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]; const L=Math.hypot(...fn); if(L<1e-12) continue;
      for (const k of [0,1,2]) { N.getElement(I[t+k], n); const nl=Math.hypot(...n)||1; const d=(fn[0]*n[0]+fn[1]*n[1]+fn[2]*n[2])/L/nl; tot++; area+=L; if (d < 0.5) { bad++; badA+=L; } } }
  }
  console.log(f, 'corners', tot, 'bad(dot<0.5)', (100*bad/tot).toFixed(1)+'%', 'area-weighted', (100*badA/area).toFixed(1)+'%');
}
