import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import {
  Color, PlaneGeometry, Float32BufferAttribute, CylinderGeometry, ConeGeometry,
  IcosahedronGeometry, DodecahedronGeometry, OctahedronGeometry, Matrix4, Euler, Quaternion, Vector3, MathUtils,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ZONES, carState, env, useStore } from '../store'
import { profile } from '../data/portfolio'
import { rng } from './utils'
import Sign from './Sign'

const SIZE = 200
const HALF = SIZE / 2

function distToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)))
  const dx = ax + vx * t - px, dz = az + vz * t - pz
  return Math.hypot(dx, dz)
}

function Ground() {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, 80, 80)
    g.rotateX(-Math.PI / 2)
    const r = rng(7)
    const colors = []
    const base = new Color('#8cc152')
    const c = new Color()
    for (let i = 0; i < g.attributes.position.count; i++) {
      c.copy(base).offsetHSL((r() - 0.5) * 0.03, (r() - 0.5) * 0.1, (r() - 0.5) * 0.06)
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <RigidBody type="fixed" colliders={false} friction={1}>
      <CuboidCollider args={[HALF, 0.5, HALF]} position={[0, -0.5, 0]} />
      {/* boundary walls */}
      <CuboidCollider args={[HALF, 4, 1]} position={[0, 4, -HALF + 4]} />
      <CuboidCollider args={[HALF, 4, 1]} position={[0, 4, HALF - 4]} />
      <CuboidCollider args={[1, 4, HALF]} position={[-HALF + 4, 4, 0]} />
      <CuboidCollider args={[1, 4, HALF]} position={[HALF - 4, 4, 0]} />
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>
      {/* outer ground so the edge isn't visible */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#7fb547" roughness={1} />
      </mesh>
    </RigidBody>
  )
}

function Roads() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[11, 24]} />
        <meshStandardMaterial color="#e9d8a6" roughness={1} />
      </mesh>
      {ZONES.map((z) => {
        const [x, , zz] = z.position
        const len = Math.hypot(x, zz) - z.radius * (z.id === 'play' ? 1 : 0.6)
        const ang = Math.atan2(x, zz)
        return (
          <group key={z.id} rotation={[0, ang, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, len / 2]} receiveShadow>
              <planeGeometry args={[5, len]} />
              <meshStandardMaterial color="#e9d8a6" roughness={1} />
            </mesh>
            {/* dashed centre line */}
            {Array.from({ length: Math.floor((len - 12) / 4) }, (_, i) => (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 12 + i * 4]}>
                <planeGeometry args={[0.25, 1.6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

// Bakes many small low-poly parts into ONE geometry (one draw call) using vertex colours.
function bake(parts) {
  const m = new Matrix4()
  const geos = parts.map(({ geo, pos, rot = [0, 0, 0], scale = 1, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    m.compose(new Vector3(...pos), new Quaternion().setFromEuler(new Euler(...rot)), new Vector3(scale, scale, scale))
    g.applyMatrix4(m)
    const c = new Color(color)
    const n = g.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
    g.setAttribute('color', new Float32BufferAttribute(arr, 3))
    g.deleteAttribute('uv')
    return g
  })
  const merged = mergeGeometries(geos)
  merged.computeVertexNormals()
  return merged
}

const G = {
  trunk: new CylinderGeometry(0.22, 0.32, 1.8, 6),
  coneBig: new ConeGeometry(1.5, 2.4, 7),
  coneSmall: new ConeGeometry(1.1, 1.8, 7),
  blob: new IcosahedronGeometry(1.4, 0),
  rock: new DodecahedronGeometry(1, 0),
  flower: new OctahedronGeometry(0.18, 0),
}

function Forest() {
  const { trees, rocks, flowers } = useMemo(() => {
    const r = rng(42)
    const trees = []
    const ok = (x, z, pad = 0) => {
      if (Math.hypot(x, z) < 16 + pad) return false
      if (Math.abs(x) < 10 && z > 0 && z < 40) return false // keep the camera's view behind spawn clear
      for (const zn of ZONES) {
        if (Math.hypot(x - zn.position[0], z - zn.position[2]) < zn.radius + 7 + pad) return false
        if (distToSegment(x, z, 0, 0, zn.position[0], zn.position[2]) < 5 + pad) return false
      }
      return true
    }
    const greens = ['#4caf50', '#43a047', '#66bb6a', '#2e7d32', '#7cb342']
    let tries = 0
    while (trees.length < 150 && tries < 4000) {
      tries++
      const x = (r() * 2 - 1) * (HALF - 8)
      const z = (r() * 2 - 1) * (HALF - 8)
      if (!ok(x, z)) continue
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 4)) continue
      trees.push({ x, z, s: 0.8 + r() * 0.7, round: r() > 0.6, hue: greens[Math.floor(r() * greens.length)] })
    }
    // dense border ring
    for (let i = -HALF + 6; i <= HALF - 6; i += 7) {
      for (const [x, z] of [[i, -HALF + 6], [i, HALF - 6], [-HALF + 6, i], [HALF - 6, i]]) {
        trees.push({ x: x + (r() - 0.5) * 3, z: z + (r() - 0.5) * 3, s: 1.1 + r() * 0.6, round: r() > 0.5, hue: greens[Math.floor(r() * greens.length)] })
      }
    }
    const rocks = []
    while (rocks.length < 40) {
      const x = (r() * 2 - 1) * (HALF - 10)
      const z = (r() * 2 - 1) * (HALF - 10)
      if (ok(x, z, -2)) rocks.push({ x, z, s: 0.3 + r() * 0.6, rot: r() * 6 })
    }
    const flowers = []
    while (flowers.length < 120) {
      const x = (r() * 2 - 1) * (HALF - 10)
      const z = (r() * 2 - 1) * (HALF - 10)
      if (ok(x, z, -3)) flowers.push({ x, z, c: ['#ff6b6b', '#ffd43b', '#f783ac', '#ffffff', '#74c0fc'][Math.floor(r() * 5)] })
    }
    return { trees, rocks, flowers }
  }, [])

  const baked = useMemo(() => {
    const treeParts = []
    for (const t of trees) {
      const at = (y) => [t.x, y * t.s, t.z]
      treeParts.push({ geo: G.trunk, pos: at(0.9), scale: t.s, color: '#6d4c41' })
      if (t.round) {
        treeParts.push({ geo: G.blob, pos: at(2.5), scale: t.s, color: t.hue })
      } else {
        treeParts.push({ geo: G.coneBig, pos: at(2.6), scale: t.s, color: t.hue })
        treeParts.push({ geo: G.coneSmall, pos: at(3.7), scale: t.s, color: t.hue })
      }
    }
    return {
      trees: bake(treeParts),
      rocks: bake(rocks.map((k) => ({ geo: G.rock, pos: [k.x, k.s * 0.4, k.z], rot: [k.rot, k.rot * 2, 0], scale: k.s, color: '#9e9e9e' }))),
      flowers: bake(flowers.map((f) => ({ geo: G.flower, pos: [f.x, 0.15, f.z], color: f.c }))),
    }
  }, [trees, rocks, flowers])

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        {trees.map((t, i) => (
          <CylinderCollider key={i} args={[1.5, 0.35 * t.s]} position={[t.x, 1.5, t.z]} />
        ))}
      </RigidBody>
      <mesh geometry={baked.trees} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} />
      </mesh>
      <mesh geometry={baked.rocks} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={baked.flowers}>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
    </group>
  )
}

function Clouds() {
  const group = useRef()
  const clouds = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 14 }, () => ({
      x: (r() * 2 - 1) * 110,
      y: 28 + r() * 12,
      z: (r() * 2 - 1) * 110,
      s: 2 + r() * 3,
      puffs: Array.from({ length: 4 }, (_, j) => [j * 1.4 - 2, r() * 0.8, (r() - 0.5) * 1.5, 1 + r() * 0.8]),
    }))
  }, [])
  useFrame((_, dt) => {
    group.current.children.forEach((c) => {
      c.position.x += dt * 1.5
      if (c.position.x > 130) c.position.x = -130
    })
  })
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map(([x, y, z, s], j) => (
            <mesh key={j} position={[x, y, z]} scale={s}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

const DAY = {
  sky: new Color('#bde0fe'), hemiSky: new Color('#dff3ff'), hemiGround: new Color('#6a8f3a'), hemi: 1.1,
  sun: new Color('#fff4e0'), sunI: 2.2,
}
const NIGHT = {
  sky: new Color('#0b1026'), hemiSky: new Color('#4a5d9c'), hemiGround: new Color('#1b2a1b'), hemi: 0.35,
  sun: new Color('#9fb4ff'), sunI: 0.55, // moonlight
}

function Lights() {
  const light = useRef()
  const hemi = useRef()
  const { scene } = useThree()
  useFrame((_, dt) => {
    const p = carState.position
    light.current.position.set(p.x + 25, 40, p.z + 18)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()

    // ease between day and night
    const target = useStore.getState().night ? 1 : 0
    env.night = MathUtils.damp(env.night, target, 2.5, Math.min(dt, 0.1))
    if (Math.abs(env.night - target) < 0.001) env.night = target
    const n = env.night
    scene.background.lerpColors(DAY.sky, NIGHT.sky, n)
    scene.fog.color.copy(scene.background)
    hemi.current.color.lerpColors(DAY.hemiSky, NIGHT.hemiSky, n)
    hemi.current.groundColor.lerpColors(DAY.hemiGround, NIGHT.hemiGround, n)
    hemi.current.intensity = MathUtils.lerp(DAY.hemi, NIGHT.hemi, n)
    light.current.color.lerpColors(DAY.sun, NIGHT.sun, n)
    light.current.intensity = MathUtils.lerp(DAY.sunI, NIGHT.sunI, n)
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#dff3ff', '#6a8f3a', 1.1]} />
      <directionalLight
        ref={light}
        castShadow
        intensity={2.2}
        color="#fff4e0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
      />
    </>
  )
}

function NightSky() {
  const night = useStore((s) => s.night)
  return night ? <Stars radius={160} depth={40} count={2500} factor={5} saturation={0} fade speed={0.6} /> : null
}

export default function World() {
  return (
    <>
      <NightSky />
      <color attach="background" args={['#bde0fe']} />
      <fog attach="fog" args={['#bde0fe', 70, 190]} />
      <Lights />
      <Ground />
      <Roads />
      <Forest />
      <Clouds />
      <Sign
        lines={[profile.name, profile.title]}
        position={[-8.5, 0, 4]}
        rotation={0.5}
        color="#fffdf5"
        accent="#e63946"
        scale={1.2}
      />
      <Sign lines={['W A S D to drive', 'R to reset • Shift to boost']} position={[8.5, 0, 4]} rotation={-0.5} color="#fffdf5" accent="#4dabf7" />
    </>
  )
}
