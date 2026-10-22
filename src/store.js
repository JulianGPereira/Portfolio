import { create } from 'zustand'
import { Vector3 } from 'three'

// Zone layout of the world. `radius` is the trigger distance.
export const ZONES = [
  { id: 'projects', label: 'Projects', short: 'Projects', position: [0, 0, -48], color: '#ff7a59', radius: 7, icon: 'gem' },
  { id: 'websites', label: 'Live Websites', short: 'Websites', position: [48, 0, -14], color: '#4dabf7', radius: 7, icon: 'globe' },
  { id: 'certifications', label: 'Certifications', short: 'Certs', position: [38, 0, 38], color: '#fcc419', radius: 7, icon: 'medal' },
  { id: 'education', label: 'Education', short: 'Education', position: [-38, 0, 38], color: '#9775fa', radius: 7, icon: 'cap' },
  { id: 'play', label: 'Play Area', short: 'Play', position: [-50, 0, -22], color: '#51cf66', radius: 18, icon: 'ball' },
]

export const SPAWN = { position: [0, 1, 10], yaw: 0 }

// Live car data shared with non-React code (camera, lights) without re-renders.
export const carState = { position: new Vector3(...SPAWN.position), speed: 0 }

// 0 = day, 1 = night. Eased toward the `night` toggle every frame by <World />.
export const env = { night: 0 }

// Input state, written by keyboard + touch controls, read every frame by the car.
export const keys = { forward: false, back: false, left: false, right: false, boost: false }

export const useStore = create((set, get) => ({
  started: false,
  activeZone: null, // zone the car is currently inside
  dismissedZone: null, // zone whose popup the user closed while still inside it
  manualZone: null, // zone opened from the quick-nav buttons
  resetCount: 0,
  night: localStorage.getItem('night') === '1',

  start: () => set({ started: true }),
  toggleNight: () =>
    set((s) => {
      localStorage.setItem('night', s.night ? '0' : '1')
      return { night: !s.night }
    }),
  setActiveZone: (id) =>
    set((s) => ({
      activeZone: id,
      dismissedZone: id === s.dismissedZone ? s.dismissedZone : null,
      manualZone: id ? null : s.manualZone,
    })),
  openZone: (id) => set({ manualZone: id }),
  closePopup: () => set((s) => ({ manualZone: null, dismissedZone: s.activeZone })),
  reset: () =>
    set((s) => ({ resetCount: s.resetCount + 1, activeZone: null, dismissedZone: null, manualZone: null })),
}))

env.night = useStore.getState().night ? 1 : 0 // no fade-in when the page loads in night mode

// Which popup should currently be visible (play area has no popup).
export const selectPopup = (s) => {
  if (s.manualZone) return s.manualZone
  if (s.activeZone && s.activeZone !== 'play' && s.activeZone !== s.dismissedZone) return s.activeZone
  return null
}
