import { useEffect, useRef, useState } from 'react';

const VERTEX_SHADER = `
precision highp float;

varying vec2 vUv;
attribute vec2 a_position;

varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;

void main () {
  vUv = 0.5 * (a_position + 1.0);
  vL = vUv - vec2(u_texel.x, 0.0);
  vR = vUv + vec2(u_texel.x, 0.0);
  vT = vUv + vec2(0.0, u_texel.y);
  vB = vUv - vec2(0.0, u_texel.y);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const SPLAT_SHADER = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;

void main () {
  vec2 p = vUv - u_point.xy;
  p.x *= u_ratio;
  vec3 splat = 0.6 * pow(2.0, -dot(p, p) / u_point_size) * u_point_value;
  vec3 base = texture2D(u_input_texture, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

const DIVERGENCE_SHADER = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_velocity_texture, vL).x;
  float R = texture2D(u_velocity_texture, vR).x;
  float T = texture2D(u_velocity_texture, vT).y;
  float B = texture2D(u_velocity_texture, vB).y;
  float divergence = 0.25 * (R - L + T - B);
  gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}
`;

const PRESSURE_SHADER = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  float divergence = texture2D(u_divergence_texture, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_SHADER = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const ADVECTION_SHADER = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform vec2 u_output_texel;
uniform float u_dt;
uniform float u_dissipation;

vec4 bilerp (sampler2D source, vec2 uv, vec2 texelSize) {
  vec2 st = uv / texelSize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(source, (iuv + vec2(0.5, 0.5)) * texelSize);
  vec4 b = texture2D(source, (iuv + vec2(1.5, 0.5)) * texelSize);
  vec4 c = texture2D(source, (iuv + vec2(0.5, 1.5)) * texelSize);
  vec4 d = texture2D(source, (iuv + vec2(1.5, 1.5)) * texelSize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
  vec2 coord = vUv
    - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
  vec4 velocity = bilerp(u_input_texture, coord, u_output_texel);
  gl_FragColor = u_dissipation * velocity;
}
`;

const DISPLAY_SHADER = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_disturb_power;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_image_0;
uniform sampler2D u_image_1;
uniform sampler2D u_image_2;
uniform float u_frame_index;
uniform float u_frame_blend;
uniform float u_canvas_scale;
uniform float u_inner_scale;
uniform float u_zoom;
uniform vec2 u_focal_0;
uniform vec2 u_focal_1;
uniform vec2 u_focal_2;

vec2 get_img_uv(vec2 focalPoint) {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;

  vec2 scale = vec2(1.0);
  if (u_ratio > u_img_ratio) {
    scale.y = u_img_ratio / u_ratio;
  } else {
    scale.x = u_ratio / u_img_ratio;
  }

  scale /= u_zoom;
  uv *= scale;
  uv.x += (focalPoint.x - 0.5) * (1.0 - scale.x);
  uv.y -= (focalPoint.y - 0.5) * (1.0 - scale.y);
  return uv + 0.5;
}

vec2 get_frame_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;
  return uv + 0.5;
}

float get_img_frame_alpha(vec2 uv, float frameWidth) {
  float alpha = smoothstep(0.0, frameWidth, uv.x)
    * smoothstep(1.0, 1.0 - frameWidth, uv.x);
  alpha *= smoothstep(0.0, frameWidth, uv.y)
    * smoothstep(1.0, 1.0 - frameWidth, uv.y);
  return alpha;
}

vec3 sample_image_smooth(sampler2D source, vec2 uv) {
  vec2 clampedUv = clamp(uv, 0.0, 1.0);
  vec3 base = texture2D(
    source,
    vec2(clampedUv.x, 1.0 - clampedUv.y)
  ).rgb;

  float below = step(uv.y, 0.0);
  float above = step(1.0, uv.y);
  float left = step(uv.x, 0.0);
  float right = step(1.0, uv.x);
  float outOfBounds = max(max(below, above), max(left, right));

  if (outOfBounds > 0.0) {
    float d = 0.002;
    vec3 sum = vec3(0.0);
    sum += texture2D(source, vec2(clamp(clampedUv.x - d, 0.0, 1.0), 1.0 - clamp(clampedUv.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(source, vec2(clampedUv.x, 1.0 - clamp(clampedUv.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(source, vec2(clamp(clampedUv.x + d, 0.0, 1.0), 1.0 - clamp(clampedUv.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(source, vec2(clamp(clampedUv.x - d, 0.0, 1.0), 1.0 - clampedUv.y)).rgb;
    sum += texture2D(source, vec2(clampedUv.x, 1.0 - clampedUv.y)).rgb;
    sum += texture2D(source, vec2(clamp(clampedUv.x + d, 0.0, 1.0), 1.0 - clampedUv.y)).rgb;
    sum += texture2D(source, vec2(clamp(clampedUv.x - d, 0.0, 1.0), 1.0 - clamp(clampedUv.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(source, vec2(clampedUv.x, 1.0 - clamp(clampedUv.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(source, vec2(clamp(clampedUv.x + d, 0.0, 1.0), 1.0 - clamp(clampedUv.y + d, 0.0, 1.0))).rgb;
    base = sum / 9.0;
  }

  return base;
}

void main () {
  float offset = texture2D(u_output_texture, vUv).r;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity += 0.001;
  vec2 disturbance = u_disturb_power * normalize(velocity) * offset;

  vec2 uv0 = get_img_uv(u_focal_0) - disturbance * 2.0;
  vec2 uv1 = get_img_uv(u_focal_1) - disturbance * 2.0;
  vec2 uv2 = get_img_uv(u_focal_2) - disturbance * 2.0;

  vec3 firstImage;
  vec3 secondImage;
  if (u_frame_index < 0.5) {
    firstImage = sample_image_smooth(u_image_0, uv0);
    secondImage = sample_image_smooth(u_image_1, uv1);
  } else {
    firstImage = sample_image_smooth(u_image_1, uv1);
    secondImage = sample_image_smooth(u_image_2, uv2);
  }

  vec2 frameUv = get_frame_uv() - disturbance;
  float opacity = get_img_frame_alpha(frameUv, 0.002);
  vec3 image = mix(firstImage, secondImage, u_frame_blend);
  gl_FragColor = vec4(image * opacity, opacity);
}
`;

const clamp = (value, minimum = 0, maximum = 1) => (
  Math.min(maximum, Math.max(minimum, value))
);

const easeInOutQuad = (value) => (
  value < 0.5
    ? 2 * value * value
    : 1 - ((-2 * value + 2) ** 2) / 2
);

const DEFAULT_FOCAL_POINTS = [
  [0.5, 0.1],
  [0.5, 0.1],
  [0.5, 0.42]
];

export const LiquidHoverCanvas = ({
  images,
  progressRef,
  focalPoints = DEFAULT_FOCAL_POINTS,
  disabled = false,
  resolution = 4,
  cursorSize = 0.5,
  cursorPower = 1,
  distortionPower = 0.8,
  mobile = false
}) => {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [supportsLiquidHover, setSupportsLiquidHover] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia(
        '(min-width: 1200px) and (hover: hover) and (pointer: fine)'
      ).matches
      : false
  ));

  useEffect(() => {
    const supportQuery = window.matchMedia(
      '(min-width: 1200px) and (hover: hover) and (pointer: fine)'
    );
    const syncSupport = () => setSupportsLiquidHover(supportQuery.matches);

    syncSupport();
    supportQuery.addEventListener?.('change', syncSupport);
    return () => supportQuery.removeEventListener?.('change', syncSupport);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;

    if (
      disabled
      || !host
      || !canvas
      || images.length !== 3
      || !supportsLiquidHover
    ) {
      return undefined;
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false
    });

    if (!gl) return undefined;

    const floatTextures = gl.getExtension('OES_texture_float');
    const floatFiltering = gl.getExtension('OES_texture_float_linear');
    gl.getExtension('WEBGL_color_buffer_float');

    if (!floatTextures || !floatFiltering) return undefined;

    let disposed = false;
    let animationFrame = 0;
    let nextLiquidFrameTime = 0;
    let imageAspect = 1;
    let imageTextures = [];
    let velocity = null;
    let output = null;
    let divergence = null;
    let pressure = null;
    let hostWidth = 1;
    let hostHeight = 1;
    let pointerInside = false;
    let isViewportVisible = true;

    const settings = {
      cursorSize: 0.5 + ((cursorSize - 0.1) * 4.5) / 0.9,
      cursorPower: 5 + ((cursorPower - 0.1) * 45) / 0.9,
      distortionPower
    };

    const pointer = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      moved: false
    };

    gl.clearColor(0, 0, 0, 0);

    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || 'Shader compile error';
        gl.deleteShader(shader);
        throw new Error(message);
      }

      return shader;
    };

    const createProgram = (fragmentSource) => {
      const program = gl.createProgram();
      const vertexShader = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.bindAttribLocation(program, 0, 'a_position');
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program) || 'Program link error';
        gl.deleteProgram(program);
        throw new Error(message);
      }

      const uniforms = {};
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let index = 0; index < uniformCount; index += 1) {
        const uniform = gl.getActiveUniform(program, index);
        if (uniform) {
          uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
        }
      }

      return { program, uniforms };
    };

    let programs;
    try {
      programs = {
        splat: createProgram(SPLAT_SHADER),
        divergence: createProgram(DIVERGENCE_SHADER),
        pressure: createProgram(PRESSURE_SHADER),
        gradient: createProgram(GRADIENT_SHADER),
        advection: createProgram(ADVECTION_SHADER),
        display: createProgram(DISPLAY_SHADER)
      };
    } catch (error) {
      console.warn('Liquid hover effect could not start.', error);
      return undefined;
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const draw = (target = null) => {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    const createTarget = (width, height) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.FLOAT,
        null
      );

      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (
        gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        !== gl.FRAMEBUFFER_COMPLETE
      ) {
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
        throw new Error('Floating-point framebuffer is incomplete.');
      }

      return {
        framebuffer,
        height,
        texture,
        width,
        attach(unit) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return unit;
        }
      };
    };

    const createDoubleTarget = (width, height) => {
      let read = createTarget(width, height);
      let write = createTarget(width, height);

      return {
        height,
        texelSizeX: 1 / width,
        texelSizeY: 1 / height,
        width,
        read: () => read,
        write: () => write,
        swap() {
          const previousRead = read;
          read = write;
          write = previousRead;
        },
        dispose() {
          [read, write].forEach((target) => {
            gl.deleteFramebuffer(target.framebuffer);
            gl.deleteTexture(target.texture);
          });
        }
      };
    };

    const disposeTarget = (target) => {
      if (!target) return;
      gl.deleteFramebuffer(target.framebuffer);
      gl.deleteTexture(target.texture);
    };

    const disposeSimulation = () => {
      velocity?.dispose();
      output?.dispose();
      disposeTarget(divergence);
      pressure?.dispose();
      velocity = null;
      output = null;
      divergence = null;
      pressure = null;
    };

    const clearSimulation = () => {
      if (!velocity || !output || !divergence || !pressure) return;

      [
        velocity.read(),
        velocity.write(),
        output.read(),
        output.write(),
        divergence,
        pressure.read(),
        pressure.write()
      ].forEach((target) => {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
      });
    };

    const resize = () => {
      hostWidth = Math.max(1, host.clientWidth);
      hostHeight = Math.max(1, host.clientHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.round(hostWidth * 1.2 * pixelRatio));
      canvas.height = Math.max(2, Math.round(hostHeight * 1.2 * pixelRatio));

      const aspect = (hostWidth * 1.2) / (hostHeight * 1.2);
      const simulationHeight = Math.round(
        128 + ((resolution - 1) * 384) / 9
      );
      const simulationWidth = Math.max(
        2,
        Math.round(simulationHeight * aspect)
      );

      disposeSimulation();
      velocity = createDoubleTarget(simulationWidth, simulationHeight);
      output = createDoubleTarget(simulationWidth, simulationHeight);
      divergence = createTarget(simulationWidth, simulationHeight);
      pressure = createDoubleTarget(simulationWidth, simulationHeight);

      if (!pointer.x && !pointer.y) {
        pointer.x = 0.65 * hostWidth;
        pointer.y = 0.5 * hostHeight;
      }
    };

    try {
      resize();
    } catch (error) {
      console.warn('Liquid hover framebuffer could not start.', error);
      disposeSimulation();
      Object.values(programs).forEach(({ program }) => gl.deleteProgram(program));
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      return undefined;
    }

    const pointerUv = () => ({
      u: (pointer.x + 0.1 * hostWidth) / (1.2 * hostWidth),
      v: 1 - (pointer.y + 0.1 * hostHeight) / (1.2 * hostHeight)
    });

    const movePointer = (x, y) => {
      pointer.moved = true;
      pointer.dx = 6 * (x - pointer.x);
      pointer.dy = 6 * (y - pointer.y);
      pointer.x = x;
      pointer.y = y;
    };

    const onPointerMove = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;

      const bounds = host.getBoundingClientRect();
      const isInside = event.clientX >= bounds.left
        && event.clientX <= bounds.right
        && event.clientY >= bounds.top
        && event.clientY <= bounds.bottom;

      if (!isInside) {
        pointerInside = false;
        pointer.moved = false;
        return;
      }

      pointerInside = true;
      movePointer(
        event.clientX - bounds.left,
        event.clientY - bounds.top
      );
    };

    const onPointerOut = (event) => {
      if (!event.relatedTarget) {
        pointerInside = false;
        pointer.moved = false;
      }
    };

    const loadTexture = (source) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (disposed) {
          resolve(null);
          return;
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );
        resolve({
          aspect: image.naturalWidth / Math.max(1, image.naturalHeight),
          texture
        });
      };
      image.onerror = reject;
      image.src = source;
    });

    Promise.all(images.map(loadTexture))
      .then((loadedImages) => {
        if (disposed || loadedImages.some((image) => !image)) return;
        imageTextures = loadedImages.map((image) => image.texture);
        imageAspect = loadedImages[0].aspect;
        canvas.dataset.ready = 'true';
      })
      .catch((error) => {
        console.warn('Liquid hover images could not load.', error);
      });

    const render = (time) => {
      animationFrame = 0;
      if (
        disposed
        || document.hidden
        || !isViewportVisible
        || !velocity
        || !output
        || !divergence
        || !pressure
      ) {
        return;
      }

      const frameInterval = 1000 / 60;
      if (nextLiquidFrameTime && time + 0.5 < nextLiquidFrameTime) {
        animationFrame = window.requestAnimationFrame(render);
        return;
      }
      nextLiquidFrameTime = (
        !nextLiquidFrameTime || time - nextLiquidFrameTime > 100
      )
        ? time + frameInterval
        : nextLiquidFrameTime + frameInterval;

      const timeStep = 1 / 60;

      if (pointer.moved && pointerInside) {
        pointer.moved = false;
        const point = pointerUv();

        gl.useProgram(programs.splat.program);
        gl.uniform1i(
          programs.splat.uniforms.u_input_texture,
          velocity.read().attach(1)
        );
        gl.uniform1f(
          programs.splat.uniforms.u_ratio,
          hostWidth / Math.max(1, hostHeight)
        );
        gl.uniform2f(programs.splat.uniforms.u_point, point.u, point.v);
        gl.uniform3f(
          programs.splat.uniforms.u_point_value,
          pointer.dx,
          -pointer.dy,
          0
        );
        gl.uniform1f(
          programs.splat.uniforms.u_point_size,
          settings.cursorSize * 0.001
        );
        draw(velocity.write());
        velocity.swap();

        gl.uniform1i(
          programs.splat.uniforms.u_input_texture,
          output.read().attach(1)
        );
        gl.uniform3f(
          programs.splat.uniforms.u_point_value,
          settings.cursorPower * 0.001,
          0,
          0
        );
        draw(output.write());
        output.swap();
      }

      gl.useProgram(programs.divergence.program);
      gl.uniform2f(
        programs.divergence.uniforms.u_texel,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform1i(
        programs.divergence.uniforms.u_velocity_texture,
        velocity.read().attach(1)
      );
      draw(divergence);

      gl.useProgram(programs.pressure.program);
      gl.uniform2f(
        programs.pressure.uniforms.u_texel,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform1i(
        programs.pressure.uniforms.u_divergence_texture,
        divergence.attach(1)
      );
      for (let iteration = 0; iteration < 16; iteration += 1) {
        gl.uniform1i(
          programs.pressure.uniforms.u_pressure_texture,
          pressure.read().attach(2)
        );
        draw(pressure.write());
        pressure.swap();
      }

      gl.useProgram(programs.gradient.program);
      gl.uniform2f(
        programs.gradient.uniforms.u_texel,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform1i(
        programs.gradient.uniforms.u_pressure_texture,
        pressure.read().attach(1)
      );
      gl.uniform1i(
        programs.gradient.uniforms.u_velocity_texture,
        velocity.read().attach(2)
      );
      draw(velocity.write());
      velocity.swap();

      gl.useProgram(programs.advection.program);
      gl.uniform2f(
        programs.advection.uniforms.u_texel,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform2f(
        programs.advection.uniforms.u_output_texel,
        velocity.texelSizeX,
        velocity.texelSizeY
      );
      gl.uniform1i(
        programs.advection.uniforms.u_velocity_texture,
        velocity.read().attach(1)
      );
      gl.uniform1i(
        programs.advection.uniforms.u_input_texture,
        velocity.read().attach(1)
      );
      gl.uniform1f(programs.advection.uniforms.u_dt, timeStep);
      gl.uniform1f(programs.advection.uniforms.u_dissipation, 0.97);
      draw(velocity.write());
      velocity.swap();

      gl.uniform2f(
        programs.advection.uniforms.u_output_texel,
        output.texelSizeX,
        output.texelSizeY
      );
      gl.uniform1i(
        programs.advection.uniforms.u_input_texture,
        output.read().attach(2)
      );
      gl.uniform1f(programs.advection.uniforms.u_dt, 8 * timeStep);
      gl.uniform1f(programs.advection.uniforms.u_dissipation, 0.98);
      draw(output.write());
      output.swap();

      if (imageTextures.length === 3) {
        const progress = clamp(progressRef?.current ?? 0);
        const frameProgress = progress * 2;
        const frameIndex = Math.min(1, Math.floor(frameProgress));
        const frameBlend = easeInOutQuad(
          clamp(frameProgress - frameIndex)
        );
        const zoom = (mobile ? 1.035 : 1.055)
          - (mobile ? 0.023 : 0.037) * progress;
        const point0 = focalPoints[0] ?? DEFAULT_FOCAL_POINTS[0];
        const point1 = focalPoints[1] ?? DEFAULT_FOCAL_POINTS[1];
        const point2 = focalPoints[2] ?? DEFAULT_FOCAL_POINTS[2];

        gl.useProgram(programs.display.program);
        gl.uniform1i(
          programs.display.uniforms.u_velocity_texture,
          velocity.read().attach(2)
        );
        gl.uniform1i(
          programs.display.uniforms.u_output_texture,
          output.read().attach(1)
        );
        gl.uniform1f(
          programs.display.uniforms.u_ratio,
          hostWidth / Math.max(1, hostHeight)
        );
        gl.uniform1f(programs.display.uniforms.u_img_ratio, imageAspect);
        gl.uniform1f(
          programs.display.uniforms.u_disturb_power,
          settings.distortionPower
        );
        gl.uniform1f(programs.display.uniforms.u_canvas_scale, 1);
        gl.uniform1f(
          programs.display.uniforms.u_inner_scale,
          0.8333333333333334
        );
        gl.uniform1f(programs.display.uniforms.u_frame_index, frameIndex);
        gl.uniform1f(programs.display.uniforms.u_frame_blend, frameBlend);
        gl.uniform1f(programs.display.uniforms.u_zoom, zoom);
        gl.uniform2f(
          programs.display.uniforms.u_focal_0,
          point0[0],
          point0[1]
        );
        gl.uniform2f(
          programs.display.uniforms.u_focal_1,
          point1[0],
          point1[1]
        );
        gl.uniform2f(
          programs.display.uniforms.u_focal_2,
          point2[0],
          point2[1]
        );

        imageTextures.forEach((texture, index) => {
          const unit = index + 3;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(programs.display.uniforms[`u_image_${index}`], unit);
        });

        draw();
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      try {
        resize();
      } catch (error) {
        console.warn('Liquid hover resize failed.', error);
      }
    });

    const startAnimation = () => {
      if (
        disposed
        || document.hidden
        || !isViewportVisible
        || animationFrame
      ) {
        return;
      }

      nextLiquidFrameTime = 0;
      animationFrame = window.requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      nextLiquidFrameTime = 0;
      pointer.moved = false;
      pointerInside = false;
      clearSimulation();
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isViewportVisible = Boolean(entry?.isIntersecting);
      if (isViewportVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    });

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    startAnimation();

    return () => {
      disposed = true;
      canvas.removeAttribute('data-ready');
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      disposeSimulation();
      imageTextures.forEach((texture) => gl.deleteTexture(texture));
      Object.values(programs).forEach(({ program }) => gl.deleteProgram(program));
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
    };
  }, [
    cursorPower,
    cursorSize,
    disabled,
    distortionPower,
    focalPoints,
    images,
    mobile,
    progressRef,
    resolution,
    supportsLiquidHover
  ]);

  return (
    <div
      ref={hostRef}
      className="alt-home-hero__liquid"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="alt-home-hero__liquid-canvas"
      />
    </div>
  );
};
