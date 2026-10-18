import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, useStore } from '../store'
import Sign from './Sign'

function Icon({ type, color }) {
  const mat = <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.25} />
  switch (type) {
    case 'gem':
      return <mesh castShadow><octahedronGeometry args={[1.2, 0]} />{mat}</mesh>
    case 'globe':
      return (
        <group>
          <mesh castShadow><icosahedronGeometry args={[1.1, 1]} />{mat}</mesh>
          <mesh rotation={[Math.PI / 2.4, 0, 0]}><torusGeometry args={[1.6, 0.08, 6, 24]} /><meshStandardMaterial color="#ffffff" /></mesh>
        </group>
      )
    case 'medal':
      return (
        <group>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.1, 1.1, 0.25, 8]} />{mat}</mesh>
          <mesh position={[0, 0, 0.14]}><circleGeometry args={[0.6, 5]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[-0.35, 1.4, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.4, 1.2, 0.05]} /><meshStandardMaterial color="#e63946" /></mesh>
          <mesh position={[0.35, 1.4, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.4, 1.2, 0.05]} /><meshStandardMaterial color="#1c7ed6" /></mesh>
        </group>
      )
    case 'cap':
      return (
        <group>
          <mesh castShadow rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[2, 0.15, 2]} />{mat}</mesh>
          <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.7, 0.75, 0.7, 8]} />{mat}</mesh>
          <mesh position={[0.8, -0.4, 0.4]}><boxGeometry args={[0.06, 0.8, 0.06]} /><meshStandardMaterial color="#ffd43b" /></mesh>
        </group>
      )
    default:
      return <mesh castShadow><icosahedronGeometry args={[1.1, 0]} />{mat}</mesh>
  }
}

function Zone({ zone }) {
  const icon = useRef()
  const ring = useRef()
  const active = useStore((s) => s.activeZone === zone.id)
  const [x, , z] = zone.position
  const facing = Math.atan2(-x, -z) // face the spawn plaza
  const isPlay = zone.id === 'play'

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (icon.current) {
      icon.current.rotation.y += dt * (active ? 2.5 : 0.8)
      icon.current.position.y = 5 + Math.sin(t * 2) * 0.35
    }
    if (ring.current) {
      const s = 1 + (active ? 0.06 : 0.03) * Math.sin(t * 4)
      ring.current.scale.set(s, s, 1)
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[zone.radius, isPlay ? 40 : 28]} />
        <meshStandardMaterial color={isPlay ? '#b2f2bb' : '#ffffff'} roughness={0.9} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[zone.radius - 0.7, zone.radius, isPlay ? 48 : 32]} />
        <meshStandardMaterial
          color={zone.color}
          emissive={zone.color}
          emissiveIntensity={active ? 0.9 : 0.25}
        />
      </mesh>
      {!isPlay && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <circleGeometry args={[zone.radius * 0.45, 24]} />
          <meshStandardMaterial color={zone.color} transparent opacity={0.35} />
        </mesh>
      )}
      {/* floating icon */}
      {!isPlay && (
        <group ref={icon} position={[0, 5, 0]}>
          <Icon type={zone.icon} color={zone.color} />
        </group>
      )}
      {/* sign at the pad's edge, facing the plaza */}
      <group rotation={[0, facing, 0]}>
        <Sign
          lines={[zone.label, isPlay ? 'Smash everything!' : 'Drive in to explore']}
          position={[zone.radius + 2.5, 0, zone.radius * 0.4]}
          color="#fffdf5"
          accent={zone.color}
        />
      </group>
    </group>
  )
}

export default function Zones() {
  return ZONES.map((z) => <Zone key={z.id} zone={z} />)
}
