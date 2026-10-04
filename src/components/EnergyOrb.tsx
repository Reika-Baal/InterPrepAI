import { useEffect, useRef, useState } from "react";

const artwork = "/assets/hero-orb-art.png";
const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.0,1.0);}
`;
const fragmentSource = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_art;
uniform float u_time;
uniform vec2 u_pointer;
void main(){
 vec2 uv=v_uv;
 vec2 p=uv-.5;
 float radius=length(p);
 float mask=1.0-smoothstep(.28,.49,radius);
 // A gentle, continuously changing UV field makes the painted ribbons breathe.
 // Keep the outer glow intact: only the interior has noticeable displacement.
 float t=u_time;
 vec2 warp=vec2(sin(uv.y*9.0+t*.32)+sin(uv.x*5.0-uv.y*4.0-t*.21),
                cos(uv.x*8.0-t*.27)+sin(uv.y*6.0+uv.x*4.0+t*.18));
 uv+=warp*.0075*mask;
 uv+=u_pointer*.006*mask;
 vec4 art=texture2D(u_art,clamp(uv,vec2(.001),vec2(.999)));
 float shimmer=1.0+.035*sin(uv.x*6.0+uv.y*4.0-t*.38)*mask;
 gl_FragColor=vec4(art.rgb*shimmer,art.a);
}
`;

/** Detailed artwork with gentle texture-flow animation; the PNG is also the fallback. */
export default function EnergyOrb({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current,
      host = hostRef.current;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource),
      fragment = compile(gl.FRAGMENT_SHADER, fragmentSource),
      program = gl.createProgram();
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
    const buffer = gl.createBuffer(),
      texture = gl.createTexture();
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
    const time = gl.getUniformLocation(program, "u_time"),
      pointer = gl.getUniformLocation(program, "u_pointer");
    gl.uniform1i(gl.getUniformLocation(program, "u_art"), 0);
    let disposed = false,
      loaded = false,
      lost = false,
      visible = true,
      frame = 0,
      last = 0,
      elapsed = 0;
    let targetX = 0,
      targetY = 0,
      currentX = 0,
      currentY = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    function draw() {
      if (!loaded || lost || disposed) return;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform1f(time, elapsed);
      gl!.uniform2f(pointer, currentX, currentY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function tick(now: number) {
      frame = 0;
      if (
        !loaded ||
        lost ||
        disposed ||
        !visible ||
        document.hidden ||
        motion.matches
      ) {
        last = 0;
        return;
      }
      if (!last || now - last >= 32) {
        if (last) elapsed += Math.min((now - last) / 1000, 0.08);
        last = now;
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!loaded || disposed || lost) return;
      if (motion.matches) {
        currentX = currentY = 0;
        draw();
      } else if (visible && !document.hidden)
        frame = requestAnimationFrame(tick);
    }
    function resize() {
      const rect = host!.getBoundingClientRect();
      const scale = Math.min(
        devicePixelRatio || 1,
        1.5,
        900 / Math.max(rect.width, rect.height, 1),
      );
      canvas!.width = Math.max(1, Math.round(rect.width * scale));
      canvas!.height = Math.max(1, Math.round(rect.height * scale));
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
        Math.min(1, 1 - ((e.clientY - r.top) / r.height) * 2),
      );
    }
    function reset() {
      targetX = targetY = 0;
    }
    function contextLost(e: Event) {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      setReady(false);
    }
    const resizer = new ResizeObserver(resize),
      observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        resume();
      });
    resizer.observe(host);
    observer.observe(host);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    canvas.addEventListener("webglcontextlost", contextLost);
    const image = new Image();
    image.onload = () => {
      if (disposed || lost) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      loaded = true;
      resize();
      setReady(true);
      resume();
    };
    image.src = artwork;
    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(frame);
      resizer.disconnect();
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
      canvas.removeEventListener("webglcontextlost", contextLost);
      gl.deleteTexture(texture);
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
        src={artwork}
        alt=""
      />
      <canvas ref={canvasRef} className={ready ? "" : "hidden"} />
    </div>
  );
}
