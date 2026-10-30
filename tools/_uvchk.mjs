// UV 拉伸检查：按网格统计 texel 密度 sqrt(uvArea/worldArea) 偏离 hi 中位数 >2 倍的面积占比
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
async function stats(f) { const doc = await io.read(f); const R = {};
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const P = p.getAttribute('POSITION'), U = p.getAttribute('TEXCOORD_0'); if (!U) { R[m.getName()] = null; continue; }
    const I = p.getIndices().getArray(); const a=[0,0,0],b=[0,0,0],c=[0,0,0],ua=[0,0],ub=[0,0],uc=[0,0]; const d=[];
    for (let t=0;t<I.length;t+=3){P.getElement(I[t],a);P.getElement(I[t+1],b);P.getElement(I[t+2],c);U.getElement(I[t],ua);U.getElement(I[t+1],ub);U.getElement(I[t+2],uc);
      const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]]; const A=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
      const UA=Math.abs((ub[0]-ua[0])*(uc[1]-ua[1])-(uc[0]-ua[0])*(ub[1]-ua[1]))/2; if(A>1e-12) d.push([Math.sqrt(UA/A),A]);}
    R[m.getName()] = d; }
  return R; }
const H = await stats(process.argv[2]), L = await stats(process.argv[3]);
for (const k in H) { const h = H[k]; const s = h.map(x=>x[0]).sort((x,y)=>x-y); const med = s[s.length>>1]; const l = L[k];
  if (!l) { console.log(k, 'lo 无 UV'); continue; }
  const bad = (arr) => { let tot=0,b=0; for (const [dd,A] of arr){tot+=A; if(dd>med*2||dd<med/2)b+=A;} return (100*b/tot).toFixed(1)+'%'; };
  console.log(k.padEnd(14), 'hi偏离', bad(h), 'lo偏离', bad(l)); }
