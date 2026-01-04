import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

export type BackgroundType = "classic-waves" | "waves" | "particles" | "galaxy" | "none"

interface InteractiveBackgroundProps {
  className?: string
  type?: BackgroundType
}

const BACKGROUND_STORAGE_KEY = "site_background_type"

export function getStoredBackgroundType(): BackgroundType {
  const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY)
  if (stored && ["classic-waves", "waves", "particles", "galaxy", "none"].includes(stored)) {
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

