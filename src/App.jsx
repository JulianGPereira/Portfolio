import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useProgress } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import World from './components/World'
import Zones from './components/Zones'
import Car from './components/Car'
import Playground from './components/Playground'
import Fireflies from './components/Fireflies'
import Hud from './ui/Hud'
import Popup from './ui/Popup'
import { keys, useStore } from './store'

const KEYMAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost',
}

function useKeyboard() {
  useEffect(() => {
    const down = (e) => {
      const st = useStore.getState()
      const k = KEYMAP[e.code]
      if (k) {
        keys[k] = true
        if (e.code.startsWith('Arrow')) e.preventDefault()
        if (!st.started && k !== 'boost') st.start()
      }
      if (e.code === 'KeyR' && !e.repeat && !e.ctrlKey && !e.metaKey) st.reset()
      if (e.code === 'KeyN' && !e.repeat && !e.ctrlKey && !e.metaKey) st.toggleNight()
      if (e.code === 'Escape') st.closePopup()
      if (e.code === 'Enter' && !st.started) st.start()
    }
    const up = (e) => {
      const k = KEYMAP[e.code]
      if (k) keys[k] = false
    }
    const blur = () => Object.keys(keys).forEach((k) => (keys[k] = false))
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
}

// Bloom only runs at night, so the day scene costs nothing extra.
function Effects() {
  const night = useStore((s) => s.night)
  if (!night) return null
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={2} />
    </EffectComposer>
  )
}

function Loader() {
  const { progress, active } = useProgress()
  return active ? <div className="loader">Loading… {Math.round(progress)}%</div> : null
}

export default function App() {
  useKeyboard()
  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, near: 0.5, far: 400, position: [0, 7.5, 23] }}>
        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]}>
            <World />
            <Zones />
            <Playground />
            <Car />
          </Physics>
          <Fireflies />
          <Effects />
        </Suspense>
      </Canvas>
      <Loader />
      <Hud />
      <Popup />
    </>
  )
}
