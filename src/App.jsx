import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useProgress } from '@react-three/drei'
import World from './components/World'
import Zones from './components/Zones'
import Car from './components/Car'
import Playground from './components/Playground'
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
        </Suspense>
      </Canvas>
      <Loader />
      <Hud />
      <Popup />
    </>
  )
}
