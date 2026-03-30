'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export interface ThreeSceneProps {
  /** Width of the canvas in pixels. Defaults to the container width. */
  width?: number
  /** Height of the canvas in pixels. */
  height?: number
  /** Accent colour used for the rotating geometry. Defaults to cyan (#00F0FF). */
  accentColor?: string
}

// ── Canvas defaults ──────────────────────────────────────────────────────────

const DEFAULT_CANVAS_HEIGHT = 300

// ── Renderer ──────────────────────────────────────────────────────────────────
/** Cap pixel ratio at 2 to prevent performance degradation on high-DPI displays. */
const MAX_PIXEL_RATIO = 2

// ── Camera ───────────────────────────────────────────────────────────────────
const CAMERA_FOV = 60
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 100
const CAMERA_POSITION_Z = 3

// ── Icosphere geometry ────────────────────────────────────────────────────────
const ICOSPHERE_RADIUS = 1
const ICOSPHERE_DETAIL = 1

// ── Material ─────────────────────────────────────────────────────────────────
const WIREFRAME_OPACITY = 0.7

// ── Lighting ─────────────────────────────────────────────────────────────────
const AMBIENT_LIGHT_INTENSITY = 0.5
const POINT_LIGHT_INTENSITY = 2
const POINT_LIGHT_DISTANCE = 10
const POINT_LIGHT_POSITION = { x: 2, y: 2, z: 2 }

// ── Animation ────────────────────────────────────────────────────────────────
const ROTATION_SPEED_X = 0.003
const ROTATION_SPEED_Y = 0.005

/**
 * ThreeScene — a lightweight Three.js canvas for ambient music visualisation.
 *
 * Renders a rotating icosphere that reacts to the DarkTunes accent colour.
 * Must be imported via {@link LazyThreeScene} (next/dynamic, ssr: false) to
 * avoid shipping the ~600 KB three.js bundle as part of the initial page load.
 *
 * @example
 * ```tsx
 * // Always use the lazy wrapper, never import ThreeScene directly.
 * import { LazyThreeScene } from '@/components/LazyThreeScene'
 * <LazyThreeScene height={300} accentColor="#00F0FF" />
 * ```
 */
export function ThreeScene({
  width,
  height = DEFAULT_CANVAS_HEIGHT,
  accentColor = '#00F0FF',
}: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resolvedWidth = width ?? container.clientWidth

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(resolvedWidth, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    container.appendChild(renderer.domElement)

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      resolvedWidth / height,
      CAMERA_NEAR,
      CAMERA_FAR,
    )
    camera.position.z = CAMERA_POSITION_Z

    // ── Icosphere (music-visualisation proxy) ────────────────────────────────
    const geometry = new THREE.IcosahedronGeometry(ICOSPHERE_RADIUS, ICOSPHERE_DETAIL)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      wireframe: true,
      transparent: true,
      opacity: WIREFRAME_OPACITY,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Lighting ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(
      new THREE.Color(accentColor),
      POINT_LIGHT_INTENSITY,
      POINT_LIGHT_DISTANCE,
    )
    pointLight.position.set(POINT_LIGHT_POSITION.x, POINT_LIGHT_POSITION.y, POINT_LIGHT_POSITION.z)
    scene.add(pointLight)

    // ── Animation loop ───────────────────────────────────────────────────────
    let frameId: number
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      mesh.rotation.x += ROTATION_SPEED_X
      mesh.rotation.y += ROTATION_SPEED_Y
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [width, height, accentColor])

  return <div ref={containerRef} style={{ width: width ?? '100%', height }} />
}
