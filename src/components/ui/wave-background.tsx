import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

interface WaveBackgroundProps {
  className?: string
}

const particleVertex = `
  attribute float scale;
  uniform float uTime;

  void main() {
    vec3 p = position;
    float s = scale;

    p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
    p.x += (sin(p.y + uTime) * 0.5);
    s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = s * 15.0 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const particleFragmentLight = `
  void main() {
    gl_FragColor = vec4(0.1, 0.1, 0.1, 0.6);
  }
`

const particleFragmentDark = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
  }
`

export function WaveBackground({ className }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  )

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "dark" : "light")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const isDark = theme === "dark"

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.01,
      1000
    )
    camera.position.set(0, 6, 5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    rendererRef.current = renderer

    // Particles
    const gap = 0.3
    const amountX = 100
    const amountY = 100
    const particleNum = amountX * amountY
    const particlePositions = new Float32Array(particleNum * 3)
    const particleScales = new Float32Array(particleNum)
    let i = 0
    let j = 0

    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - (amountX * gap) / 2
        particlePositions[i + 1] = 0
        particlePositions[i + 2] = iy * gap - (amountX * gap) / 2
        particleScales[j] = 1
        i += 3
        j++
      }
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    )
    particleGeometry.setAttribute(
      "scale",
      new THREE.BufferAttribute(particleScales, 1)
    )

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: isDark ? particleFragmentDark : particleFragmentLight,
      uniforms: {
        uTime: { value: 0 },
      },
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Animation
    const animate = () => {
      particleMaterial.uniforms.uTime.value += 0.05
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    // Resize handler
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      renderer.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
    }
  }, [theme])

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

