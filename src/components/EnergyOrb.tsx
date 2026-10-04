import { useEffect, useRef, useState } from "react";

const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

// The sphere, ribbons, nebula and dust are generated per pixel: no texture/video.
const fragmentSource = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
float hash(vec3 p) {
 p = fract(p * .3183099 + vec3(.1, .2, .3));
 p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
 vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
 float v=0.0; float a=.5;
 for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(4.1,1.7,6.2);a*=.5;}
 return v;
}
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 flow(vec3 p,float t) {
 p.xz=turn(t*.09+u_pointer.x*.17)*p.xz;
 p.xy=turn(-.45+u_pointer.y*.12)*p.xy;
 p.xz=turn(p.y*1.8+sin(t*.23)*.35)*p.xz;
 return p;
}
void main() {
 vec2 uv=(gl_FragCoord.xy*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
 uv*=1.36;
 float t=u_time;
 uv-=u_pointer*.035;
 float r=length(uv);
 vec3 purple=vec3(.49,.15,1.0), blue=vec3(.08,.28,1.0), cyan=vec3(.12,.8,1.0);
 vec3 color=vec3(0.0);
 float halo=exp(-pow((r-.99)*8.0,2.0))*.07;
 color+=mix(purple,blue,clamp(uv.x*.5+.5,0.0,1.0))*halo;
 // Thin wisps outside the globe keep the form from feeling like a rigid ball.
 float fog=fbm(vec3(uv*2.4,t*.055));
 float wisp=sin(uv.y*5.0-uv.x*2.8+fog*5.0+t*.18);
 color+=mix(purple,blue,uv.x*.3+.5)*pow(max(0.0,1.0-abs(wisp)),9.0)*.12*(1.0-smoothstep(.5,1.4,r));
 if(r<1.0){
  float z=sqrt(max(0.0,1.0-r*r));
  vec3 surface=vec3(uv,z);
  float edge=pow(1.0-z,3.0);
  color+=vec3(.011,.014,.048)*(1.0-edge)+mix(blue,purple,.5)*edge*.18;
  // Four translucent slices produce intersecting flowing sheets inside the orb.
  for(int layer=0;layer<4;layer++){
   float d=float(layer)/3.0;
   vec3 p=flow(vec3(uv,z*(1.0-d*1.8)),t);
   float n=fbm(p*3.2+vec3(0,t*.09,-t*.06));
   float field=p.y*1.8 + p.x*.35 + sin(p.x*2.1+p.z*2.4-t*.24)*.8 + (n-.5)*.38;
   float wave=sin(field*1.75+t*.16+d*.6);
   float distance=abs(wave);
   float broad=exp(-distance*distance*12.0);
   float ribbon=exp(-distance*distance*55.0);
   float thread=exp(-distance*distance*900.0);
   float texture=.65+.35*fbm(p*24.0+vec3(t*.12));
   float hue=sin(p.x*2.0+p.z*1.7+t*.17+d*2.0)*.5+.5;
   vec3 tint=mix(purple,cyan,smoothstep(.15,.9,hue));
   tint=mix(tint,blue,d*.35);
   float depth=(1.0-d*.55)*smoothstep(0.0,.22,z);
   color+=tint*(broad*.19+ribbon*.43+thread*.095)*texture*depth;
  }
  // Fine moving stardust: sparse cell points, distributed over the whole volume.
  vec3 dust=flow(surface,t)*118.0+vec3(t*.48,-t*.17,t*.24);
  vec3 cell=floor(dust);
  float seed=hash(cell);
  vec3 point=fract(dust)-vec3(hash(cell+1.0),hash(cell+2.0),hash(cell+3.0));
  float star=exp(-dot(point,point)*140.0)*step(.87,seed);
  float twinkle=.35+.65*pow(sin(t*.9+seed*70.0)*.5+.5,2.0);
  color+=mix(vec3(.65,.44,1.0),vec3(.5,.91,1.0),seed)*star*twinkle*.9;
  color+=mix(blue,cyan,.3)*pow(edge,5.0)*.22;
 }
 // Tone mapping retains bright threads without washing out the dark gaps.
 color=vec3(1.0)-exp(-color*2.1);
 float alpha=clamp(max(max(color.r,color.g),color.b)*2.0,0.0,1.0);
 gl_FragColor=vec4(color / max(alpha, .001),alpha);
}
`;

export default function EnergyOrb({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const pointer = gl.getUniformLocation(program, "u_pointer");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      elapsed = 6,
      last = 0,
      visible = true,
      lost = false;
    let targetX = 0,
      targetY = 0,
      currentX = 0,
      currentY = 0;
    function draw() {
      if (lost) return;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(resolution, canvas!.width, canvas!.height);
      gl!.uniform1f(time, elapsed);
      gl!.uniform2f(pointer, currentX, currentY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function animate(now: number) {
      frame = 0;
      if (!visible || document.hidden || motion.matches || lost) {
        last = 0;
        return;
      }
      // Limit to about 30 fps; cap resolution below to limit GPU work on phones.
      if (!last || now - last >= 32) {
        if (last) elapsed += Math.min((now - last) / 1000, 0.07);
        last = now;
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (visible && !document.hidden && !motion.matches && !lost)
        frame = requestAnimationFrame(animate);
      else if (motion.matches) {
        currentX = 0;
        currentY = 0;
        draw();
      }
    }
    function resize() {
      const rect = host!.getBoundingClientRect();
      const scale = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        720 / Math.max(rect.width, rect.height, 1),
      );
      canvas!.width = Math.max(1, Math.round(rect.width * scale));
      canvas!.height = Math.max(1, Math.round(rect.height * scale));
      draw();
    }
    function move(event: PointerEvent) {
      if (motion.matches || event.pointerType === "touch") return;
      const rect = host!.getBoundingClientRect();
      targetX = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      targetY = Math.max(
        -1,
        Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2),
      );
    }
    function resetPointer() {
      targetX = 0;
      targetY = 0;
    }
    function contextLost(event: Event) {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      setReady(false);
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      resume();
    });
    const resizer = new ResizeObserver(resize);
    observer.observe(host);
    resizer.observe(host);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    canvas.addEventListener("webglcontextlost", contextLost);
    resize();
    setReady(true);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
      canvas.removeEventListener("webglcontextlost", contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`energy-orb ${className}`}
      aria-hidden="true"
      data-renderer={ready ? "webgl" : "fallback"}
    >
      <img
        className={`energy-orb-fallback ${ready ? "hidden" : ""}`}
        src="/assets/hero-orb.svg"
        alt=""
      />
      <canvas ref={canvasRef} className={ready ? "" : "hidden"} />
    </div>
  );
}
