import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CoefficientCombineRule } from '@react-three/rapier'
import { Quaternion, Vector3, Euler, MathUtils } from 'three'
import { useStore, keys, carState, ZONES, SPAWN } from '../store'

const MAX_FWD = 20
const MAX_BOOST = 30
const MAX_REV = 9
const ACCEL = 18
const BRAKE = 40
const DRAG = 10
const TURN = 2.4
const WHEEL_R = 0.42

const CAM_OFFSET = new Vector3(0, 6.5, 13) // behind (+Z local, car faces -Z) and above

export default function Car() {
  const body = useRef()
  const chassis = useRef()
  const wheelSpin = useRef([])
  const frontPivots = useRef([])
  const steer = useRef(0)
  const { camera } = useThree()

  const tmp = useMemo(
    () => ({
      q: new Quaternion(),
      fwd: new Vector3(),
      camPos: new Vector3(),
      look: new Vector3(),
      lookSmooth: new Vector3(...SPAWN.position),
    }),
    []
  )

  const resetCount = useStore((s) => s.resetCount)

  const resetCar = () => {
    const rb = body.current
    if (!rb) return
    rb.setTranslation({ x: SPAWN.position[0], y: SPAWN.position[1], z: SPAWN.position[2] }, true)
    rb.setRotation(new Quaternion().setFromEuler(new Euler(0, SPAWN.yaw, 0)), true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
    steer.current = 0
  }

  // ?debug in the URL exposes a teleport helper (handy for testing zones)
  useEffect(() => {
    if (!window.location.search.includes('debug')) return
    window.__teleport = (x, z, yaw = 0) => {
      const rb = body.current
      rb.setTranslation({ x, y: 1, z }, true)
      rb.setRotation(new Quaternion().setFromEuler(new Euler(0, yaw, 0)), true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
    window.__car = carState
  }, [])

  useEffect(() => {
    if (resetCount > 0) {
      resetCar()
      // snap camera behind the car
      const p = SPAWN.position
      camera.position.set(p[0], p[1] + CAM_OFFSET.y, p[2] + CAM_OFFSET.z)
      tmp.lookSmooth.set(p[0], p[1], p[2])
    }
  }, [resetCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, rawDt) => {
    const rb = body.current
    if (!rb) return
    const dt = Math.min(rawDt, 0.05)
    const { started, activeZone, setActiveZone } = useStore.getState()

    // ── Input ───────────────────────────────────────────────
    const throttle = started ? (keys.forward ? 1 : 0) - (keys.back ? 1 : 0) : 0
    const steerIn = started ? (keys.left ? 1 : 0) - (keys.right ? 1 : 0) : 0

    // ── Current heading & speed ────────────────────────────
    const r = rb.rotation()
    tmp.q.set(r.x, r.y, r.z, r.w)
    tmp.fwd.set(0, 0, -1).applyQuaternion(tmp.q)
    tmp.fwd.y = 0
    tmp.fwd.normalize()
    const lv = rb.linvel()
    let speed = lv.x * tmp.fwd.x + lv.z * tmp.fwd.z

    // ── Arcade drive model ─────────────────────────────────
    const maxF = keys.boost ? MAX_BOOST : MAX_FWD
    if (throttle !== 0) {
      const braking = Math.sign(speed) === -throttle && Math.abs(speed) > 0.5
      speed += throttle * (braking ? BRAKE : ACCEL) * dt
    } else {
      const d = DRAG * dt
      speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d
    }
    if (speed > maxF) speed = Math.max(maxF, speed - BRAKE * dt)
    speed = Math.max(-MAX_REV, speed)

    steer.current = MathUtils.damp(steer.current, steerIn, 10, dt)
    const yawRate = steer.current * TURN * MathUtils.clamp(speed / 7, -1, 1)

    rb.setLinvel({ x: tmp.fwd.x * speed, y: Math.min(lv.y, 2), z: tmp.fwd.z * speed }, true)
    rb.setAngvel({ x: 0, y: yawRate, z: 0 }, true)

    // fell off the world?
    const t = rb.translation()
    if (t.y < -15) resetCar()

    carState.position.set(t.x, t.y, t.z)
    carState.speed = speed

    // ── Visuals: wheel spin, steering, body lean ───────────
    wheelSpin.current.forEach((w) => w && (w.rotation.x -= (speed * dt) / WHEEL_R))
    frontPivots.current.forEach((p) => p && (p.rotation.y = steer.current * 0.45))
    if (chassis.current) {
      chassis.current.rotation.z = MathUtils.damp(chassis.current.rotation.z, -yawRate * 0.04 * Math.sign(speed || 1), 6, dt)
      chassis.current.rotation.x = MathUtils.damp(chassis.current.rotation.x, throttle * 0.025, 6, dt)
    }

    // ── Zone detection ─────────────────────────────────────
    let inside = null
    for (const z of ZONES) {
      const dx = t.x - z.position[0]
      const dz = t.z - z.position[2]
      if (dx * dx + dz * dz < z.radius * z.radius) {
        inside = z.id
        break
      }
    }
    if (inside !== activeZone) setActiveZone(inside)

    // ── Follow camera ──────────────────────────────────────
    tmp.camPos.copy(CAM_OFFSET).applyQuaternion(tmp.q).add(carState.position)
    tmp.camPos.y = Math.max(tmp.camPos.y, 2)
    camera.position.lerp(tmp.camPos, 1 - Math.exp(-3.5 * dt))
    tmp.look.copy(carState.position).addScaledVector(tmp.fwd, 4).add({ x: 0, y: 1, z: 0 })
    tmp.lookSmooth.lerp(tmp.look, 1 - Math.exp(-6 * dt))
    camera.lookAt(tmp.lookSmooth)
  })

  const wheelPos = [
    [-0.95, WHEEL_R, -1.15, true],
    [0.95, WHEEL_R, -1.15, true],
    [-0.95, WHEEL_R, 1.15, false],
    [0.95, WHEEL_R, 1.15, false],
  ]

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={SPAWN.position}
      rotation={[0, SPAWN.yaw, 0]}
      enabledRotations={[false, true, false]}
      canSleep={false}
      name="car"
    >
      <CuboidCollider args={[0.95, 0.45, 1.8]} position={[0, 0.5, 0]} mass={25} friction={0} frictionCombineRule={CoefficientCombineRule.Min} restitution={0.1} />

      <group ref={chassis}>
        {/* lower body */}
        <mesh castShadow position={[0, 0.72, 0]}>
          <boxGeometry args={[1.8, 0.55, 3.6]} />
          <meshStandardMaterial color="#e63946" flatShading roughness={0.5} />
        </mesh>
        {/* hood stripe */}
        <mesh position={[0, 1.0, -1.1]}>
          <boxGeometry args={[0.35, 0.02, 1.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* cabin */}
        <mesh castShadow position={[0, 1.25, 0.25]}>
          <boxGeometry args={[1.5, 0.55, 1.8]} />
          <meshStandardMaterial color="#f1faee" flatShading />
        </mesh>
        {/* windows */}
        <mesh position={[0, 1.27, -0.66]} rotation={[-0.25, 0, 0]}>
          <planeGeometry args={[1.35, 0.45]} />
          <meshStandardMaterial color="#1d3557" roughness={0.1} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.27, 1.16]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.35, 0.42]} />
          <meshStandardMaterial color="#1d3557" roughness={0.1} metalness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.76, 1.27, 0.25]} rotation={[0, (s * Math.PI) / 2, 0]}>
            <planeGeometry args={[1.5, 0.4]} />
            <meshStandardMaterial color="#1d3557" roughness={0.1} metalness={0.4} />
          </mesh>
        ))}
        {/* headlights */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.78, -1.81]}>
            <boxGeometry args={[0.35, 0.18, 0.02]} />
            <meshStandardMaterial color="#fff9db" emissive="#fff3bf" emissiveIntensity={1.5} />
          </mesh>
        ))}
        {/* tail lights */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.78, 1.81]}>
            <boxGeometry args={[0.35, 0.15, 0.02]} />
            <meshStandardMaterial color="#c92a2a" emissive="#fa5252" emissiveIntensity={0.8} />
          </mesh>
        ))}
        {/* bumpers */}
        <mesh position={[0, 0.5, -1.82]} castShadow>
          <boxGeometry args={[1.85, 0.18, 0.12]} />
          <meshStandardMaterial color="#343a40" />
        </mesh>
        <mesh position={[0, 0.5, 1.82]} castShadow>
          <boxGeometry args={[1.85, 0.18, 0.12]} />
          <meshStandardMaterial color="#343a40" />
        </mesh>
        {/* roof spoiler */}
        <mesh position={[0, 1.15, 1.7]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.35]} />
          <meshStandardMaterial color="#e63946" flatShading />
        </mesh>
      </group>

      {wheelPos.map(([x, y, z, front], i) => (
        <group
          key={i}
          position={[x, y, z]}
          ref={(el) => {
            if (front) frontPivots.current[i] = el
          }}
        >
          <group ref={(el) => (wheelSpin.current[i] = el)}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.36, 10]} />
              <meshStandardMaterial color="#212529" flatShading />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.38, 6]} />
              <meshStandardMaterial color="#adb5bd" flatShading />
            </mesh>
          </group>
        </group>
      ))}
    </RigidBody>
  )
}
