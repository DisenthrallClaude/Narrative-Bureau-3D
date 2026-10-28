// 天空盒雾：室外（FogExp2 密度 < 0.003）时，雾色按视线方向从天空盒全景图（模糊 mip）采样，
// 让远处的低模城市剪影无缝融进生图天空盒；室内（密度更大）仍用纯色雾。
// 必须在任何材质首次编译之前调用。
import * as THREE from 'three';

export function installSkyFog(tex, intensity = 1) {
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = C.fog_pars_vertex.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying vec3 vNbFogDir;');
  C.fog_vertex = C.fog_vertex.replace('vFogDepth = - mvPosition.z;', 'vFogDepth = - mvPosition.z;\n\tvNbFogDir = mvPosition.xyz * mat3( viewMatrix );');
  C.fog_pars_fragment = C.fog_pars_fragment.replace('varying float vFogDepth;', `varying float vFogDepth;
	varying vec3 vNbFogDir;
	uniform sampler2D nbFogSky;
	vec3 nbSkyFog( vec3 d ) {
		d = normalize( d );
		vec2 uv = vec2( atan( d.z, d.x ) * RECIPROCAL_PI2 + 0.5, asin( clamp( d.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5 );
		uv.y = max( uv.y, 0.47 ); // 地平线以下取地平线附近的雾霭色，避免把俯瞰城市的灯点当雾色
		return textureLod( nbFogSky, uv, 4.5 ).rgb * ${intensity.toFixed(3)};
	}`);
  C.fog_fragment = C.fog_fragment.replace(
    'gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
    `vec3 nbFc = fogColor;
	#ifdef FOG_EXP2
		if ( fogDensity < 0.003 ) nbFc = nbSkyFog( vNbFogDir );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, nbFc, fogFactor );`);
  for (const k of Object.keys(THREE.ShaderLib)) {
    const s = THREE.ShaderLib[k];
    if (s.fragmentShader?.includes('fog_fragment')) s.uniforms.nbFogSky = { value: tex };
  }
}
