import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import { carState, env } from '../store'
import { rng } from './utils'

const COUNT = 220
const HALF = 40 // fireflies live in a box around the car that wraps as it drives
const wrap = (v) => ((((v + HALF) % (HALF * 2)) + HALF * 2) % (HALF * 2)) - HALF

export default function Fireflies() {
  const mesh = useRef()
  const dummy = useMemo(() => new Object3D(), [])
  const flies = useMemo(() => {
    const r = rng(23)
    return Array.from({ length: COUNT }, () => ({
      x: (r() * 2 - 1) * HALF,
      z: (r() * 2 - 1) * HALF,
      y: 0.6 + r() * 3.5,
      drift: [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8], // slow wander across the map
      wobble: 0.6 + r() * 1.4,
      phase: r() * Math.PI * 2,
      blink: 0.6 + r() * 1.6,
    }))
  }, [])

  useFrame((state) => {
    const m = mesh.current
    m.visible = env.night > 0.01
    if (!m.visible) return
    const t = state.clock.elapsedTime
    const c = carState.position
    flies.forEach((f, i) => {
      const w = t * f.wobble + f.phase
      const x = f.x + f.drift[0] * t + Math.sin(w) * 1.2
      const z = f.z + f.drift[1] * t + Math.cos(w * 0.8) * 1.2
      dummy.position.set(c.x + wrap(x - c.x), f.y + Math.sin(w * 1.3) * 0.5, c.z + wrap(z - c.z))
      // mostly glowing, with an occasional dim pulse
      const glow = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * f.blink + f.phase), 3)
      dummy.scale.setScalar(glow * env.night)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.11, 8, 6]} />
      {/* colour above 1.0 so only the fireflies (and other bright bits) cross the bloom threshold */}
      <meshBasicMaterial color={[7, 6, 1.6]} toneMapped={false} fog={false} />
    </instancedMesh>
  )
}
