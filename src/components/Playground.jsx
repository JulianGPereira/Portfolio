import { useMemo } from 'react'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider, ConeCollider, ConvexHullCollider } from '@react-three/rapier'
import { Vector3 } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { ZONES, useStore } from '../store'

const CRATE_COLORS = ['#f59f00', '#e8590c', '#fab005', '#d9480f']
const DYN = { linearDamping: 0.4, angularDamping: 0.4 }

function Crate({ position, color, size = 1.2 }) {
  return (
    <RigidBody position={position} colliders={false} {...DYN}>
      <CuboidCollider args={[size / 2, size / 2, size / 2]} mass={1} friction={0.7} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 1.01, size * 0.15, size * 1.01]} />
        <meshStandardMaterial color="#7f4f24" />
      </mesh>
    </RigidBody>
  )
}

function Pin({ position }) {
  return (
    <RigidBody position={position} colliders={false} {...DYN}>
      <CylinderCollider args={[0.8, 0.3]} position={[0, 0.8, 0]} mass={0.4} />
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1.1, 8]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.15, 8]} />
        <meshStandardMaterial color="#e03131" />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
    </RigidBody>
  )
}

function Cone({ position }) {
  return (
    <RigidBody position={position} colliders={false} {...DYN}>
      <ConeCollider args={[0.5, 0.4]} position={[0, 0.5, 0]} mass={0.3} />
      <mesh castShadow position={[0, 0.5, 0]}>
        <coneGeometry args={[0.4, 1, 8]} />
        <meshStandardMaterial color="#ff6b00" flatShading />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.24, 0.29, 0.15, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#212529" />
      </mesh>
    </RigidBody>
  )
}

function Ball({ position, radius = 1.6 }) {
  return (
    <RigidBody position={position} colliders={false} linearDamping={0.2} angularDamping={0.2}>
      <BallCollider args={[radius]} mass={3} restitution={0.6} />
      <mesh castShadow>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial color="#4263eb" flatShading />
      </mesh>
    </RigidBody>
  )
}

function Domino({ position, rotation, color }) {
  return (
    <RigidBody position={position} rotation={rotation} colliders={false} {...DYN}>
      <CuboidCollider args={[0.6, 1.1, 0.15]} mass={0.5} friction={0.6} />
      <mesh castShadow>
        <boxGeometry args={[1.2, 2.2, 0.3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </RigidBody>
  )
}

function Barrel({ position }) {
  return (
    <RigidBody position={position} colliders={false} {...DYN}>
      <CylinderCollider args={[0.6, 0.5]} position={[0, 0.6, 0]} mass={0.8} />
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 10]} />
        <meshStandardMaterial color="#2b8a3e" flatShading />
      </mesh>
      {[0.25, 0.95].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.08, 10]} />
          <meshStandardMaterial color="#212529" />
        </mesh>
      ))}
    </RigidBody>
  )
}

// Wedge that climbs toward local -Z (the car's forward). `rotation` is a yaw in radians.
function Ramp({ position, rotation = 0, length = 6, width = 4, height = 1.3, color = '#5c7cfa' }) {
  const { points, geo } = useMemo(() => {
    const w = width / 2
    const l = length / 2
    const pts = [
      [-w, 0, l], [w, 0, l], [-w, 0, -l], [w, 0, -l],
      [-w, height, -l], [w, height, -l],
    ]
    return { points: new Float32Array(pts.flat()), geo: new ConvexGeometry(pts.map((p) => new Vector3(...p))) }
  }, [length, width, height])
  const angle = Math.atan2(height, length)
  const slope = Math.hypot(height, length)

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotation, 0]}>
      <ConvexHullCollider args={[points]} friction={0.5} />
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* chevrons and a striped lip on the slope */}
      <group position={[0, height / 2 + 0.01, 0]} rotation={[angle, 0, 0]}>
        {[-0.25, 0.05].map((f) => (
          <group key={f} position={[0, 0, f * slope]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * width * 0.13, 0, 0]} rotation={[-Math.PI / 2, 0, s * 0.6]}>
                <planeGeometry args={[0.25, width * 0.32]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-width / 2 + (i + 0.5) * (width / 6), 0, -slope / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width / 6, 0.4]} />
            <meshStandardMaterial color={i % 2 ? '#212529' : '#fcc419'} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}

function Ramps() {
  const zone = ZONES.find((z) => z.id === 'play')
  const [cx, , cz] = zone.position
  return (
    <group>
      {/* big kicker on the west side, launches north */}
      <Ramp position={[cx - 12, 0, cz + 2]} length={7} width={4.5} height={1.6} color="#e64980" />
      {/* jump straight into the bowling pins */}
      <Ramp position={[cx + 8, 0, cz + 10]} length={6} width={4} height={1.2} />
      {/* table-top along the north edge: up, flat deck, down */}
      <Ramp position={[cx - 3.5, 0, cz - 12]} rotation={-Math.PI / 2} length={3} width={4} height={1.1} color="#20c997" />
      <RigidBody type="fixed" colliders="cuboid" position={[cx, 0.55, cz - 12]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4, 1.1, 4]} />
          <meshStandardMaterial color="#20c997" flatShading />
        </mesh>
      </RigidBody>
      <Ramp position={[cx + 3.5, 0, cz - 12]} rotation={Math.PI / 2} length={3} width={4} height={1.1} color="#20c997" />
    </group>
  )
}

function Objects() {
  const zone = ZONES.find((z) => z.id === 'play')
  const [cx, , cz] = zone.position

  const items = useMemo(() => {
    const crates = []
    // pyramid of crates
    const s = 1.2
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i < 5 - row; i++) {
        crates.push({
          p: [cx - 4 + (i - (4 - row) / 2) * (s + 0.02), s / 2 + row * s + 0.01, cz - 8],
          c: CRATE_COLORS[(i + row) % CRATE_COLORS.length],
        })
      }
    }
    // bowling pins (triangle)
    const pins = []
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i <= row; i++) {
        pins.push([cx + 9 + (i - row / 2) * 1.0, 0.02, cz + 2 - row * 0.9])
      }
    }
    // dominoes on an arc
    const dominoes = []
    for (let i = 0; i < 14; i++) {
      const a = -0.2 + i * 0.12
      const r = 11
      dominoes.push({
        p: [cx - 3 + Math.cos(a) * r - 8, 1.11, cz + 3 + Math.sin(a) * r],
        rot: [0, -a, 0],
        c: i % 2 ? '#f8f9fa' : '#212529',
      })
    }
    // cone slalom
    const cones = []
    for (let i = 0; i < 7; i++) cones.push([cx + 2 + (i % 2 ? 1.5 : -1.5), 0.01, cz + 14 - i * 3.2])
    // ring of cones on the boundary
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      if (Math.abs(Math.sin(a - Math.atan2(-cz, -cx) + Math.PI / 2)) < 0.25) continue // keep the entrance open
      cones.push([cx + Math.cos(a) * 17, 0.01, cz + Math.sin(a) * 17])
    }
    const barrels = [
      [cx + 6, 0.01, cz - 9],
      [cx + 7.2, 0.01, cz - 9],
      [cx + 6.6, 0.01, cz - 10.1],
      [cx + 6.6, 1.25, cz - 9.5],
    ]
    return { crates, pins, dominoes, cones, barrels }
  }, [cx, cz])

  return (
    <group>
      {items.crates.map((c, i) => <Crate key={'c' + i} position={c.p} color={c.c} />)}
      {items.pins.map((p, i) => <Pin key={'p' + i} position={p} />)}
      {items.dominoes.map((d, i) => <Domino key={'d' + i} position={d.p} rotation={d.rot} color={d.c} />)}
      {items.cones.map((p, i) => <Cone key={'k' + i} position={p} />)}
      {items.barrels.map((p, i) => <Barrel key={'b' + i} position={p} />)}
      <Ball position={[cx - 6, 1.7, cz - 2]} />
      <Ball position={[cx + 1, 1.0, cz + 6]} radius={0.9} />
    </group>
  )
}

// Remounts all physics props whenever the user presses R.
export default function Playground() {
  const resetCount = useStore((s) => s.resetCount)
  return (
    <>
      <Ramps />
      <Objects key={resetCount} />
    </>
  )
}
