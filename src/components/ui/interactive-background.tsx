import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

export type BackgroundType = "classic-waves" | "waves" | "particles" | "galaxy" | "blob" | "aurora" | "mesh" | "neon-grid" | "liquid" | "none"

interface InteractiveBackgroundProps {
  className?: string
  type?: BackgroundType
}

const BACKGROUND_STORAGE_KEY = "site_background_type"

export function getStoredBackgroundType(): BackgroundType {
  const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY)
  if (stored && ["classic-waves", "waves", "particles", "galaxy", "blob", "aurora", "mesh", "neon-grid", "liquid", "none"].includes(stored)) {
    return stored as BackgroundType
  }
  return "classic-waves"
}

export function setStoredBackgroundType(type: BackgroundType) {
  localStorage.setItem(BACKGROUND_STORAGE_KEY, type)
}

export function InteractiveBackground({ className, type }: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(undefined)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  )
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(() => type || getStoredBackgroundType())

  // Update when prop changes
  useEffect(() => {
    if (type) setBackgroundType(type)
  }, [type])

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "dark" : "light")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // Mouse tracking for interactivity
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  useEffect(() => {
    if (!canvasRef.current || backgroundType === "none") return

    const canvas = canvasRef.current
    const isDark = theme === "dark"

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.01, 1000)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    rendererRef.current = renderer

    let cleanup: () => void = () => {}

    if (backgroundType === "classic-waves") {
      cleanup = createClassicWaveEffect(scene, camera, isDark)
    } else if (backgroundType === "waves") {
      cleanup = createWaveEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "particles") {
      cleanup = createParticleEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "galaxy") {
      cleanup = createGalaxyEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "blob") {
      cleanup = createBlobEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "aurora") {
      cleanup = createAuroraEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "mesh") {
      cleanup = createMeshLandscapeEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "neon-grid") {
      cleanup = createNeonGridEffect(scene, camera, isDark, mouseRef)
    } else if (backgroundType === "liquid") {
      cleanup = createLiquidMetalEffect(scene, camera, isDark, mouseRef)
    }

    // Animation loop
    const animate = () => {
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!canvas.parentElement) return
      const width = canvas.parentElement.clientWidth
      const height = canvas.parentElement.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)
    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      cleanup()
      renderer.dispose()
    }
  }, [theme, backgroundType])

  if (backgroundType === "none") return null

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

// Classic wave effect (original non-interactive version)
function createClassicWaveEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean
): () => void {
  camera.position.set(0, 6, 5)

  const gap = 0.3
  const amountX = 100
  const amountY = 100
  const particleNum = amountX * amountY
  const positions = new Float32Array(particleNum * 3)
  const scales = new Float32Array(particleNum)

  let i = 0, j = 0
  for (let ix = 0; ix < amountX; ix++) {
    for (let iy = 0; iy < amountY; iy++) {
      positions[i] = ix * gap - (amountX * gap) / 2
      positions[i + 1] = 0
      positions[i + 2] = iy * gap - (amountX * gap) / 2
      scales[j] = 1
      i += 3
      j++
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float scale;
      uniform float uTime;
      void main() {
        vec3 p = position;
        float s = scale;
        p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
        p.x += (sin(p.y + uTime) * 0.5);
        s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = s * 15.0 * (1.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: isDark
      ? `void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5); }`
      : `void main() { gl_FragColor = vec4(0.1, 0.1, 0.1, 0.6); }`,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const animate = () => {
    material.uniforms.uTime.value += 0.05
    camera.lookAt(scene.position)
  }
  const intervalId = setInterval(animate, 16)

  return () => {
    clearInterval(intervalId)
    scene.remove(points)
    geometry.dispose()
    material.dispose()
  }
}

// Wave effect (enhanced version with mouse interaction)
function createWaveEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 6, 5)

  const gap = 0.3
  const amountX = 100
  const amountY = 100
  const particleNum = amountX * amountY
  const positions = new Float32Array(particleNum * 3)
  const scales = new Float32Array(particleNum)

  let i = 0, j = 0
  for (let ix = 0; ix < amountX; ix++) {
    for (let iy = 0; iy < amountY; iy++) {
      positions[i] = ix * gap - (amountX * gap) / 2
      positions[i + 1] = 0
      positions[i + 2] = iy * gap - (amountX * gap) / 2
      scales[j] = 1
      i += 3
      j++
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
    vertexShader: `
      attribute float scale;
      uniform float uTime;
      uniform vec2 uMouse;
      void main() {
        vec3 p = position;
        float mouseEffect = smoothstep(5.0, 0.0, length(p.xz - uMouse * 10.0));
        p.y += (sin(p.x + uTime) * 0.5 + cos(p.z + uTime) * 0.5) * (1.0 + mouseEffect);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = scale * 15.0 * (1.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: isDark
      ? `void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5); }`
      : `void main() { gl_FragColor = vec4(0.1, 0.1, 0.1, 0.6); }`,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const animate = () => {
    material.uniforms.uTime.value += 0.03
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
    camera.lookAt(scene.position)
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}

// Floating particles effect
function createParticleEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 0, 5)

  const particleCount = 500
  const positions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    velocities[i * 3] = (Math.random() - 0.5) * 0.02
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: isDark ? 0xffffff : 0x333333,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const animate = () => {
    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += velocities[i * 3] + mouseRef.current.x * 0.001
      pos[i * 3 + 1] += velocities[i * 3 + 1] + mouseRef.current.y * 0.001
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      // Wrap around
      if (pos[i * 3] > 10) pos[i * 3] = -10
      if (pos[i * 3] < -10) pos[i * 3] = 10
      if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -10
      if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10
    }
    geometry.attributes.position.needsUpdate = true
    points.rotation.z += 0.0005
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}

// Galaxy spiral effect
function createGalaxyEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 3, 5)

  const parameters = { count: 5000, size: 0.02, radius: 5, branches: 3, spin: 1, randomness: 0.2 }
  const positions = new Float32Array(parameters.count * 3)
  const colors = new Float32Array(parameters.count * 3)

  const colorInside = new THREE.Color(isDark ? "#ff6030" : "#4f46e5")
  const colorOutside = new THREE.Color(isDark ? "#1b3984" : "#06b6d4")

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3
    const radius = Math.random() * parameters.radius
    const spinAngle = radius * parameters.spin
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2

    const randomX = (Math.random() - 0.5) * parameters.randomness * radius
    const randomY = (Math.random() - 0.5) * parameters.randomness * radius * 0.5
    const randomZ = (Math.random() - 0.5) * parameters.randomness * radius

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
    positions[i3 + 1] = randomY
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

    const mixedColor = colorInside.clone().lerp(colorOutside, radius / parameters.radius)
    colors[i3] = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const animate = () => {
    points.rotation.y += 0.002 + mouseRef.current.x * 0.001
    points.rotation.x = mouseRef.current.y * 0.2
    camera.lookAt(scene.position)
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}

// Morphing Blob effect - organic, smooth morphing sphere with gradient
function createBlobEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 0, 4)

  const geometry = new THREE.IcosahedronGeometry(1.5, 64)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uColor1: { value: new THREE.Color(isDark ? "#6366f1" : "#3b82f6") },
      uColor2: { value: new THREE.Color(isDark ? "#ec4899" : "#8b5cf6") },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      varying vec3 vNormal;
      varying vec3 vPosition;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vNormal = normal;
        vPosition = position;
        vec3 pos = position;
        float noise = snoise(pos * 1.5 + uTime * 0.3 + vec3(uMouse * 0.5, 0.0));
        pos += normal * noise * 0.3;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 color = mix(uColor1, uColor2, fresnel + sin(uTime + vPosition.y) * 0.3);
        gl_FragColor = vec4(color, 0.9);
      }
    `,
    transparent: true,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  let time = 0
  const animate = () => {
    time += 0.01
    material.uniforms.uTime.value = time
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
    mesh.rotation.y += 0.003
    mesh.rotation.x += 0.001
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}



// Aurora Borealis effect - flowing northern lights
function createAuroraEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 0, 1)

  const geometry = new THREE.PlaneGeometry(4, 2, 128, 64)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uDark: { value: isDark ? 1.0 : 0.5 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uDark;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv;
        uv.x += uMouse.x * 0.1;

        float t = uTime * 0.2;
        float aurora = 0.0;

        for (float i = 0.0; i < 3.0; i++) {
          float offset = i * 0.2;
          float wave = sin(uv.x * 3.0 + t + offset) * 0.5 + 0.5;
          wave *= fbm(vec2(uv.x * 2.0 + t * 0.5, uv.y * 4.0 + i));
          float band = smoothstep(0.3 + offset * 0.1, 0.5 + offset * 0.1, uv.y);
          band *= smoothstep(0.9 - offset * 0.1, 0.7 - offset * 0.1, uv.y);
          aurora += wave * band * (1.0 - i * 0.2);
        }

        vec3 color1 = vec3(0.1, 0.8, 0.4); // Green
        vec3 color2 = vec3(0.2, 0.4, 0.9); // Blue
        vec3 color3 = vec3(0.8, 0.2, 0.6); // Purple

        vec3 auroraColor = mix(color1, color2, sin(uv.x * 2.0 + t) * 0.5 + 0.5);
        auroraColor = mix(auroraColor, color3, sin(uv.x * 3.0 - t * 0.5) * 0.5 + 0.5);

        vec3 finalColor = auroraColor * aurora * uDark;
        float alpha = aurora * 0.7;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 0.3
  scene.add(mesh)

  let time = 0
  const animate = () => {
    time += 0.016
    material.uniforms.uTime.value = time
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}

// Animated Mesh Landscape - wireframe terrain
function createMeshLandscapeEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 2, 5)
  camera.rotation.x = -0.4

  const geometry = new THREE.PlaneGeometry(20, 20, 50, 50)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position.array as Float32Array
  const originalPositions = new Float32Array(positions.length)
  originalPositions.set(positions)

  const material = new THREE.MeshBasicMaterial({
    color: isDark ? 0x00ffff : 0x0066ff,
    wireframe: true,
    transparent: true,
    opacity: isDark ? 0.4 : 0.3,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = -2
  scene.add(mesh)

  let time = 0
  const animate = () => {
    time += 0.02
    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = originalPositions[i]
      const z = originalPositions[i + 2]
      pos[i + 1] = Math.sin(x * 0.3 + time) * Math.cos(z * 0.3 + time) * 1.5
      pos[i + 1] += Math.sin(x * 0.5 + time * 0.5) * 0.5
    }
    geometry.attributes.position.needsUpdate = true
    mesh.position.z = -time * 0.5 % 10

    camera.position.x = mouseRef.current.x * 2
    camera.position.y = 2 + mouseRef.current.y * 0.5
  }
  const id = setInterval(animate, 16)

  return () => { clearInterval(id); geometry.dispose(); material.dispose() }
}


// Neon Grid - synthwave/retro style
function createNeonGridEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 1.5, 4)
  camera.rotation.x = -0.3

  // Create grid
  const gridSize = 40
  const gridDivisions = 40
  const gridHelper = new THREE.GridHelper(
    gridSize,
    gridDivisions,
    isDark ? 0xff00ff : 0x8b00ff,
    isDark ? 0x00ffff : 0x0088ff
  )
  gridHelper.position.y = -1
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.6
  scene.add(gridHelper)

  // Add horizon glow
  const horizonGeometry = new THREE.PlaneGeometry(50, 10)
  const horizonMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(isDark ? "#ff00ff" : "#8b00ff") },
      uColor2: { value: new THREE.Color(isDark ? "#00ffff" : "#0088ff") },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;

      void main() {
        float gradient = smoothstep(0.0, 0.5, vUv.y);
        vec3 color = mix(uColor1, uColor2, sin(vUv.x * 3.0 + uTime) * 0.5 + 0.5);
        float alpha = (1.0 - gradient) * 0.5;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  })

  const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial)
  horizon.position.set(0, 3, -15)
  scene.add(horizon)

  // Add sun
  const sunGeometry = new THREE.CircleGeometry(3, 64)
  const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);

        vec3 color1 = vec3(1.0, 0.3, 0.0);
        vec3 color2 = vec3(1.0, 0.0, 0.5);
        vec3 color = mix(color1, color2, vUv.y);

        // Horizontal lines
        float lines = step(0.5, fract(vUv.y * 10.0 - uTime * 0.5));
        color *= 0.7 + lines * 0.3;

        float alpha = smoothstep(0.5, 0.3, dist);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
  })

  const sun = new THREE.Mesh(sunGeometry, sunMaterial)
  sun.position.set(0, 2, -20)
  scene.add(sun)

  let time = 0
  const animate = () => {
    time += 0.016
    gridHelper.position.z = (time * 2) % (gridSize / gridDivisions)
    horizonMaterial.uniforms.uTime.value = time
    sunMaterial.uniforms.uTime.value = time

    camera.position.x = mouseRef.current.x * 0.5
    camera.rotation.y = mouseRef.current.x * 0.1
  }
  const id = setInterval(animate, 16)

  return () => {
    clearInterval(id)
    gridHelper.geometry.dispose()
    horizonGeometry.dispose()
    sunGeometry.dispose()
    horizonMaterial.dispose()
    sunMaterial.dispose()
  }
}


// Liquid Metal - reflective metallic blob
function createLiquidMetalEffect(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isDark: boolean,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>
): () => void {
  camera.position.set(0, 0, 3.5)

  const geometry = new THREE.IcosahedronGeometry(1.2, 32)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uDark: { value: isDark ? 1.0 : 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);

        vec3 pos = position;
        float noise = sin(pos.x * 3.0 + uTime) * sin(pos.y * 3.0 + uTime) * sin(pos.z * 3.0 + uTime);
        noise += sin(pos.x * 5.0 - uTime * 0.5) * 0.3;
        float mouseInfluence = 1.0 + length(uMouse) * 0.3;
        pos += normal * noise * 0.15 * mouseInfluence;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDark;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Fresnel effect
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        // Fake environment reflection
        vec3 reflection = reflect(-viewDir, normal);
        float envX = reflection.x * 0.5 + 0.5;
        float envY = reflection.y * 0.5 + 0.5;

        // Metallic colors
        vec3 baseColor = uDark > 0.5
          ? vec3(0.8, 0.8, 0.9)
          : vec3(0.3, 0.35, 0.4);

        vec3 highlightColor = uDark > 0.5
          ? vec3(0.6, 0.7, 1.0)
          : vec3(0.5, 0.6, 0.8);

        vec3 accentColor = uDark > 0.5
          ? vec3(1.0, 0.5, 0.8)
          : vec3(0.4, 0.5, 0.9);

        // Create gradient based on reflection
        vec3 color = mix(baseColor, highlightColor, envY);
        color = mix(color, accentColor, sin(envX * 6.28 + uTime) * 0.3 + 0.3);

        // Add fresnel rim
        color += fresnel * 0.5;

        // Metallic sheen
        float specular = pow(max(dot(reflection, vec3(0.0, 1.0, 0.0)), 0.0), 20.0);
        color += specular * 0.5;

        gl_FragColor = vec4(color, 0.95);
      }
    `,
    transparent: true,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // Add subtle ambient light representation
  const ringGeometry = new THREE.TorusGeometry(2, 0.01, 16, 100)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: isDark ? 0x6366f1 : 0x3b82f6,
    transparent: true,
    opacity: 0.3,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = Math.PI / 2
  scene.add(ring)

  let time = 0
  const animate = () => {
    time += 0.015
    material.uniforms.uTime.value = time
    material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)

    mesh.rotation.y += 0.005
    mesh.rotation.x = Math.sin(time * 0.3) * 0.2 + mouseRef.current.y * 0.3
    mesh.rotation.z = Math.cos(time * 0.2) * 0.1

    ring.rotation.z += 0.002
    ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.5) * 0.1
  }
  const id = setInterval(animate, 16)

  return () => {
    clearInterval(id)
    geometry.dispose()
    material.dispose()
    ringGeometry.dispose()
    ringMaterial.dispose()
  }
}

