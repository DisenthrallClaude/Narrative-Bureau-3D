// 天空盒雾：室外（FogExp2 密度 < 0.003）时，雾色按视线方向从天空盒全景图（模糊 mip）采样，
// 让远处的低模城市剪影无缝融进生图天空盒；室内（密度更大）仍用纯色雾。
// 必须在任何材质首次编译之前调用。
import * as THREE from 'three';
// R7-ATH：外景「大气透视 / 远景空气雾」，思路与公式改编自 Athenaion（Leon Lin，MIT，src/core/atmosphere.js）：
//   指数高度层光学深度（贴地厚、随高度变薄）+ 远距平方项 + 逐通道消光 + 朝太阳的 Henyey-Greenstein 前向散射光晕。
//   本项目改为暖琥珀灰（消光蓝通道最强 → 透过色偏暖；内散射 = 天空盒采样色向琥珀灰拉，不偏蓝），只作用于室外（FogExp2 密度 < 0.003），
//   原 exp2 雾整体略收（×0.8），让近中景更清楚、远景按距离与高度分层退远。实时成本：每片元多约 20 条 ALU（无额外采样/通道）。?nor7=1 回旧。
const R7 = !(typeof location !== 'undefined' && /[?&]nor7=1/.test(location.search));

export function installSkyFog(tex, intensity = 1, sun = null) {
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
	}${R7 ? `
	uniform vec3 nbSunDir;
	uniform vec3 nbSunCol;
	float nbAtmoOD( float y0, float dy, float dist, float dens, float H, float h0 ) {
		float a = dens * exp( clamp( - ( y0 - h0 ) / H, - 60.0, 60.0 ) );
		float k = dy * dist / H;
		float f = abs( k ) > 1e-3 ? ( 1.0 - exp( - clamp( k, - 60.0, 60.0 ) ) ) / k : 1.0 - 0.5 * k;
		return a * dist * f;
	}
	vec3 nbAerial( vec3 col, vec3 skyC, vec3 V ) {
		float d = length( V );
		vec3 dir = V / max( d, 1e-4 );
		// 贴地暖霭层（基准地面 y≈-4.4，标高 22 m）+ 远距平方项（2.4 km 处光学深度 0.55）
		// R7b：贴地密度 0.00085→0.0004；R7c：远距平方项 2.4 km 处 0.55→1.2、300–600 m 渐入（雾色仍 R7b 暗琥珀灰）；150 m 内大气项为 0、150–250 m smoothstep 渐入（主立面 60–70 m 不再罩纱）
		float w = smoothstep( 150.0, 250.0, d ); // ANGLE：须 edge0 < edge1
		float tau = nbAtmoOD( cameraPosition.y, dir.y, d, 0.0004, 22.0, - 4.4 ) + 1.2 * smoothstep( 300.0, 600.0, d ) * pow( d / 2400.0, 2.0 ); // R7c：远距项单独加强 0.55→1.2（2.4 km 处），300–600 m smoothstep 渐入，150 m 内仍为 0
		vec3 T = mix( vec3( 1.0 ), exp( - tau * vec3( 0.86, 1.0, 1.22 ) ), w );
		float L = dot( skyC, vec3( 0.2126, 0.7152, 0.0722 ) );
		vec3 haze = mix( skyC, L * vec3( 1.02, 0.84, 0.64 ), 0.82 ); // R7b：少借天空亮色，偏暗琥珀灰（原 0.6 / 1.30,0.98,0.70）
		float mu = dot( dir, nbSunDir ), g = 0.72, g2 = g * g;
		float ph = ( 1.0 - g2 ) / pow( max( 1.0 + g2 - 2.0 * g * mu, 1e-4 ), 1.5 ) * ( 1.0 - g ) * ( 1.0 - g ) / ( 1.0 + g ); // HG 归一到 mu=1 时 = 1
		haze += nbSunCol * L * 0.35 * ph; // R7b：0.6→0.35
		return col * T + haze * ( 1.0 - T );
	}` : ''}`);
  C.fog_fragment = C.fog_fragment.replace(
    'gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
    `vec3 nbFc = fogColor;
	#ifdef FOG_EXP2
		if ( fogDensity < 0.003 ) nbFc = nbSkyFog( vNbFogDir );
	#endif
	${R7 ? `#ifdef FOG_EXP2
		if ( fogDensity < 0.003 ) { gl_FragColor.rgb = nbAerial( gl_FragColor.rgb, nbFc, vNbFogDir ); fogFactor *= 0.8; }
	#endif
	` : ''}gl_FragColor.rgb = mix( gl_FragColor.rgb, nbFc, fogFactor );`);
  for (const k of Object.keys(THREE.ShaderLib)) {
    const s = THREE.ShaderLib[k];
    if (s.fragmentShader?.includes('fog_fragment')) {
      s.uniforms.nbFogSky = { value: tex };
      if (R7) { s.uniforms.nbSunDir = { value: (sun?.dir ?? new THREE.Vector3(0, 1, 0)).clone().normalize() }; s.uniforms.nbSunCol = { value: new THREE.Color(sun?.color ?? 0xffffff) }; }
    }
  }
}
