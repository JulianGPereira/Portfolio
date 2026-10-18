import { useMemo } from 'react'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider, ConeCollider } from '@react-three/rapier'
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
  return <Objects key={resetCount} />
}
