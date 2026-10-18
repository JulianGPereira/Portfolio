import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { makeLabelTexture } from './utils'

export default function Sign({ lines, position, rotation = 0, color = '#ffffff', fg = '#222', accent, scale = 1 }) {
  const tex = useMemo(() => makeLabelTexture(lines, { bg: color, fg, accent }), [lines, color, fg, accent])
  const w = 4.2
  const h = (w * 384) / 1024
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotation, 0]}>
    <CuboidCollider args={[1.6 * scale + 0.1, 1.6 * scale, 0.12 * scale]} position={[0, 1.6 * scale, -0.06 * scale]} />
    <group scale={scale}>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 1.2, -0.06]} castShadow>
          <boxGeometry args={[0.18, 2.4, 0.18]} />
          <meshStandardMaterial color="#8d6e63" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 2.3, -0.06]} castShadow>
        <boxGeometry args={[w + 0.25, h + 0.25, 0.1]} />
        <meshStandardMaterial color="#5d4037" flatShading />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
    </RigidBody>
  )
}
