import { CanvasTexture, SRGBColorSpace } from 'three'

// Deterministic RNG so the world layout is the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Draws text onto a canvas so we can use it as a sign texture (no font downloads needed).
export function makeLabelTexture(lines, { bg = '#ffffff', fg = '#222', width = 1024, height = 384, accent } = {}) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)
  if (accent) {
    ctx.fillStyle = accent
    ctx.fillRect(0, height - 28, width, 28)
  }
  const arr = Array.isArray(lines) ? lines : [lines]
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const sizes = arr.length === 1 ? [140] : [110, 58]
  const total = sizes.slice(0, arr.length).reduce((a, b) => a + b * 1.15, 0)
  let y = (height - (accent ? 28 : 0) - total) / 2
  arr.forEach((txt, i) => {
    const size = sizes[i] ?? 60
    let fs = size
    ctx.font = `800 ${fs}px "Segoe UI", system-ui, -apple-system, Arial, sans-serif`
    while (ctx.measureText(txt).width > width - 80 && fs > 20) {
      fs -= 4
      ctx.font = `800 ${fs}px "Segoe UI", system-ui, -apple-system, Arial, sans-serif`
    }
    y += (size * 1.15) / 2
    ctx.globalAlpha = i === 0 ? 1 : 0.75
    ctx.fillText(txt, width / 2, y)
    y += (size * 1.15) / 2
  })
  ctx.globalAlpha = 1
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
