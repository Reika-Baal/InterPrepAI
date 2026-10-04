import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Every vertex moves: these are three-dimensional translucent ribbons, not an image.
const ribbonVertex = `
uniform float u_time;
uniform float u_phase;
uniform float u_radius;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view;
varying vec3 v_position;
vec3 ribbon(vec2 uv){
 float a=uv.x*6.2831853;
 float w=(uv.y-.5)*2.0;
 float t=u_time;
 float latitude=.52*sin(a*1.0+u_phase+t*.33)+.18*sin(a*2.0-t*.24+u_phase)+w*(.29+.05*sin(a+t*.4));
 float longitude=a+u_phase+t*.22+.12*sin(a*2.0+t*.25)*w;
 float radius=u_radius+.055*sin(a*3.0+t*.55+u_phase+w*1.5)+.025*sin(w*5.0+a*2.0-t*.3);
 vec3 p=radius*vec3(cos(latitude)*cos(longitude),sin(latitude),cos(latitude)*sin(longitude));
 float roll=u_phase*.4+.22*sin(t*.18+u_phase);
 p.xy=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*p.xy;
 return p;
}
void main(){
 v_uv=uv;
 vec3 p=ribbon(uv);
 vec3 tangent=ribbon(uv+vec2(.001,0.0))-p;
 vec3 across=ribbon(uv+vec2(0.0,.001))-p;
 v_normal=normalize(normalMatrix*normalize(cross(tangent,across)));
 vec4 view=modelViewMatrix*vec4(p,1.0);
 v_view=-view.xyz;v_position=p;
 gl_Position=projectionMatrix*view;
}
`;
const ribbonFragment = `
uniform float u_time;
uniform float u_phase;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view;
varying vec3 v_position;
void main(){
 float w=abs(v_uv.y-.5)*2.0;
 float edge=1.0-smoothstep(.73,1.0,w);
 float facing=abs(dot(normalize(v_normal),normalize(v_view)));
 float silk=.5+.5*sin(v_uv.x*19.0+v_uv.y*7.0-u_time*.8+u_phase);
 float hue=.5+.5*sin(v_uv.x*6.283+u_phase+u_time*.16);
 vec3 violet=vec3(.32,.025,.9),cyan=vec3(.015,.4,1.0),blue=vec3(.04,.08,.8);
 vec3 tint=mix(violet,cyan,smoothstep(.22,.85,hue));
 tint=mix(tint,blue,.18*(1.0-silk));
 float rim=pow(1.0-facing,2.2);
 float filament=pow(.5+.5*sin(v_uv.y*160.0+sin(v_uv.x*12.0-u_time*.35)*3.0),18.0);
 float highlight=pow(max(0.0,dot(normalize(v_normal),normalize(vec3(-.4,.8,1.0)))),9.0);
 vec3 color=tint*(.7+rim*.8+silk*.24)+vec3(.4,.5,.8)*highlight*.65;
 float alpha=edge*(.22+.38*rim+.12*silk+filament*.04);
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
}
`;
const particleVertex = `
uniform float u_time;
uniform float u_scale;
attribute float a_seed;
varying float v_seed;
void main(){
 v_seed=a_seed;
 float a=u_time*(.12+a_seed*.07);
 vec3 p=position;
 p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;
 p.y+=sin(u_time*.65+a_seed*60.0)*.025;
 vec4 view=modelViewMatrix*vec4(p,1.0);
 gl_PointSize=(1.1+a_seed*1.6)*u_scale*(3.5/-view.z);
 gl_Position=projectionMatrix*view;
}
`;
const particleFragment = `
uniform float u_time;
varying float v_seed;
void main(){
 float d=length(gl_PointCoord-.5);
 float alpha=exp(-d*d*22.0)*(.25+.35*sin(u_time*.8+v_seed*50.0)*sin(u_time*.8+v_seed*50.0));
 vec3 color=mix(vec3(.61,.36,1.0),vec3(.4,.88,1.0),v_seed);
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
}
`;

export default function EnergyOrb({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = hostRef.current,
      canvas = canvasRef.current;
    if (!host || !canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(),
      group = new THREE.Group();
    scene.add(group);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.z = 3.8;
    const geometry = new THREE.PlaneGeometry(1, 1, 240, 28);
    const materials: THREE.ShaderMaterial[] = [];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.ShaderMaterial({
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        uniforms: {
          u_time: { value: 0 },
          u_phase: { value: i * 2.1 + 0.5 },
          u_radius: { value: 0.94 - i * 0.055 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      });
      materials.push(material);
      group.add(new THREE.Mesh(geometry, material));
    }
    // Seeded stardust fills the spherical volume; points drift independently of ribbons.
    const count = 2200,
      positions = new Float32Array(count * 3),
      seeds = new Float32Array(count);
    let rng = 91827;
    const random = () => {
      rng = (rng * 16807) % 2147483647;
      return (rng - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2,
        y = random() * 2 - 1,
        r = Math.pow(random(), 0.3) * 0.96,
        s = Math.sqrt(1 - y * y);
      positions[i * 3] = Math.cos(a) * s * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = Math.sin(a) * s * r;
      seeds[i] = random();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    dustGeometry.setAttribute("a_seed", new THREE.BufferAttribute(seeds, 1));
    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: { u_time: { value: 0 }, u_scale: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Points(dustGeometry, dustMaterial));
    let frame = 0,
      last = 0,
      elapsed = 0,
      visible = true,
      lost = false,
      disposed = false,
      targetX = 0,
      targetY = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    function draw() {
      if (lost || disposed) return;
      for (const material of materials)
        material.uniforms.u_time.value = elapsed;
      dustMaterial.uniforms.u_time.value = elapsed;
      renderer.render(scene, camera);
    }
    function tick(now: number) {
      frame = 0;
      if (lost || disposed || !visible || document.hidden || motion.matches) {
        last = 0;
        return;
      }
      if (!last || now - last >= 32) {
        if (last) elapsed += Math.min((now - last) / 1000, 0.1);
        last = now;
        group.rotation.y += (targetX * 0.17 - group.rotation.y) * 0.04;
        group.rotation.x += (targetY * 0.12 - group.rotation.x) * 0.04;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (lost || disposed) return;
      if (motion.matches) {
        group.rotation.set(0, 0, 0);
        draw();
      } else if (visible && !document.hidden)
        frame = requestAnimationFrame(tick);
    }
    function resize() {
      const r = host!.getBoundingClientRect();
      const ratio = Math.min(
        devicePixelRatio || 1,
        1.5,
        840 / Math.max(r.width, r.height, 1),
      );
      renderer.setPixelRatio(ratio);
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
      dustMaterial.uniforms.u_scale.value = ratio;
      camera.aspect = r.width / Math.max(1, r.height);
      camera.updateProjectionMatrix();
      draw();
    }
    function move(e: PointerEvent) {
      if (motion.matches || e.pointerType === "touch") return;
      const r = host!.getBoundingClientRect();
      targetX = Math.max(
        -1,
        Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1),
      );
      targetY = Math.max(
        -1,
        Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1),
      );
    }
    function lose() {
      lost = true;
      cancelAnimationFrame(frame);
      setReady(false);
    }
    const resizeObserver = new ResizeObserver(resize),
      visibilityObserver = new IntersectionObserver((e) => {
        visible = e[0].isIntersecting;
        resume();
      });
    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    canvas.addEventListener("webglcontextlost", lose);
    resize();
    renderer.compile(scene, camera);
    setReady(true);
    resume();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
      canvas.removeEventListener("webglcontextlost", lose);
      geometry.dispose();
      dustGeometry.dispose();
      materials.forEach((m) => m.dispose());
      dustMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  return (
    <div
      ref={hostRef}
      className={`energy-orb ${className}`}
      aria-hidden="true"
      data-renderer={ready ? "webgl" : "fallback"}
    >
      <div
        className={`energy-orb-fallback live-orb-fallback ${ready ? "hidden" : ""}`}
      >
        <span />
        <span />
        <span />
      </div>
      <canvas ref={canvasRef} className={ready ? "" : "hidden"} />
    </div>
  );
}
