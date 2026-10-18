import { useEffect, useState } from 'react'
import { useStore, ZONES, keys } from '../store'
import { profile } from '../data/portfolio'

function Intro() {
  const started = useStore((s) => s.started)
  const start = useStore((s) => s.start)
  if (started) return null
  return (
    <div className="intro">
      <div className="intro-card">
        <div className="eyebrow">Interactive portfolio</div>
        <h1>{profile.name}</h1>
        <p className="subtitle">{profile.title}</p>
        <p className="muted">{profile.tagline}</p>
        <div className="keys">
          <div className="keygrid">
            <span />
            <kbd>W</kbd>
            <span />
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </div>
          <div className="keyhelp">
            <div><b>W A S D</b> / arrows — drive</div>
            <div><kbd>Shift</kbd> boost &nbsp; <kbd>R</kbd> reset</div>
            <div>Drive into the glowing zones to explore</div>
          </div>
        </div>
        <button className="start" onClick={start} autoFocus>
          Start driving →
        </button>
      </div>
    </div>
  )
}

function ZoneToast() {
  const active = useStore((s) => s.activeZone)
  const zone = ZONES.find((z) => z.id === active)
  return (
    <div className={`toast ${zone ? 'show' : ''}`} style={{ '--accent': zone?.color }}>
      {zone?.id === 'play' ? '🎳 Play Area — smash into everything!' : zone ? `📍 ${zone.label}` : ''}
    </div>
  )
}

function TouchControls() {
  const [touch, setTouch] = useState(false)
  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])
  if (!touch) return null
  const bind = (k) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      keys[k] = true
    },
    onPointerUp: () => (keys[k] = false),
    onPointerLeave: () => (keys[k] = false),
    onPointerCancel: () => (keys[k] = false),
  })
  return (
    <div className="touch">
      <div className="touch-steer">
        <button {...bind('left')}>◀</button>
        <button {...bind('right')}>▶</button>
      </div>
      <div className="touch-drive">
        <button {...bind('forward')}>▲</button>
        <button {...bind('back')}>▼</button>
      </div>
    </div>
  )
}

export default function Hud() {
  const openZone = useStore((s) => s.openZone)
  const reset = useStore((s) => s.reset)
  return (
    <>
      <div className="hud-top">
        <div className="brand">
          <strong>{profile.name}</strong>
          <span>{profile.title}</span>
        </div>
        <nav className="quicknav">
          {ZONES.filter((z) => z.id !== 'play').map((z) => (
            <button key={z.id} style={{ '--accent': z.color }} onClick={() => openZone(z.id)}>
              {z.short}
            </button>
          ))}
          {profile.resumeUrl && (
            <a className="btn" href={profile.resumeUrl} target="_blank" rel="noreferrer">
              Resume
            </a>
          )}
        </nav>
      </div>
      <div className="hud-bottom">
        <div className="hint">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> drive · <kbd>Shift</kbd> boost · <kbd>R</kbd> reset
        </div>
        <div className="socials">
          {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a>}
          {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
          {profile.email && <a href={`mailto:${profile.email}`}>Email</a>}
          <button className="linklike" onClick={reset}>Reset</button>
        </div>
      </div>
      <ZoneToast />
      <TouchControls />
      <Intro />
    </>
  )
}
