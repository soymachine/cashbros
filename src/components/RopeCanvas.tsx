import { useRef, useEffect } from 'react'

const ENTRY_MS  = 750
const SETTLE_MS = 600

interface RopeCanvasProps {
  tensionLevel: number
  tensionDirection: number
}

interface Spark {
  xNorm: number   // 0–1 along rope
  born:  number   // performance.now()
  life:  number   // total lifetime ms
  angle: number   // rotation of the starburst
  size:  number   // peak arm length px
}

function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

// Rope Y at a given normalised x, given current animation params
function ropeY(
  xNorm: number,
  cy: number,
  amp: number,
  freq: number,
  speed: number,
  sag: number,
  t: number,
): number {
  const env = Math.sin(Math.PI * xNorm)
  const w1  = amp       * Math.sin(2 * Math.PI * (xNorm * freq       - t * speed))        * env
  const w2  = amp * 0.4 * Math.sin(2 * Math.PI * (xNorm * freq * 1.6 + t * speed * 0.65)) * env
  const w3  = amp * 0.2 * Math.sin(2 * Math.PI * (xNorm * freq * 2.8 - t * speed * 1.3))  * env
  return cy + sag * env + w1 + w2 + w3
}

export function RopeCanvas({ tensionLevel, tensionDirection }: RopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef  = useRef({ tensionLevel, tensionDirection })
  const mountedAt = useRef(performance.now())

  useEffect(() => {
    stateRef.current = { tensionLevel, tensionDirection }
  }, [tensionLevel, tensionDirection])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const el  = canvas

    let width = 0, height = 0, animId = 0, t = 0
    const sparks: Spark[] = []

    function setupCanvas() {
      const rect = el.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      width  = rect.width
      height = rect.height
      el.width  = rect.width  * dpr
      el.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const ro = new ResizeObserver(setupCanvas)
    ro.observe(el)
    setupCanvas()

    function spawnSpark(tl: number) {
      // Probability per frame scales with tension; avoid edges of rope
      const prob = 0.004 + tl * 0.018
      if (Math.random() > prob) return
      sparks.push({
        xNorm: 0.08 + Math.random() * 0.84,
        born:  performance.now(),
        life:  320 + Math.random() * 280,
        angle: Math.random() * Math.PI,
        size:  2.5 + Math.random() * 3.5,
      })
    }

    function drawSparks(
      cy: number,
      amp: number,
      freq: number,
      speed: number,
      sag: number,
    ) {
      const now = performance.now()
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s   = sparks[i]
        const age = (now - s.born) / s.life   // 0 → 1

        if (age >= 1) { sparks.splice(i, 1); continue }

        const x  = s.xNorm * width
        const y  = ropeY(s.xNorm, cy, amp, freq, speed, sag, t)

        // Fade in over first 20%, fade out over remaining 80%
        const opacity     = age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8
        // Size peaks at 20% then very gently shrinks
        const sizeMult    = age < 0.2 ? age / 0.2 : 1 - (age - 0.2) / 0.8 * 0.4
        const currentSize = s.size * sizeMult

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(s.angle)
        ctx.globalAlpha = opacity * 0.65
        ctx.strokeStyle = '#0d0d0d'
        ctx.lineWidth   = 1
        ctx.lineCap     = 'round'

        // Four arms at 0°, 45°, 90°, 135°
        for (let j = 0; j < 4; j++) {
          const a = j * Math.PI / 4
          const cos = Math.cos(a), sin = Math.sin(a)
          ctx.beginPath()
          ctx.moveTo(-cos * currentSize * 0.25, -sin * currentSize * 0.25)
          ctx.lineTo( cos * currentSize,          sin * currentSize)
          ctx.stroke()
        }

        ctx.restore()
      }
    }

    function draw() {
      if (!width || !height) { animId = requestAnimationFrame(draw); return }

      const elapsed = performance.now() - mountedAt.current
      const { tensionLevel: tl, tensionDirection: td } = stateRef.current

      const tAmp   = 3   + tl * 26
      const tFreq  = 2.0 + tl * 2.0
      const tSpeed = 0.3 + tl * 1.5
      const tSag   = tl * height * 0.40 * td

      let rightX: number
      let amp: number, freq: number, speed: number, sag: number

      if (elapsed < ENTRY_MS) {
        const p = easeOut(elapsed / ENTRY_MS)
        rightX = p * width
        amp = 1.8; freq = 3.0; speed = 0.35; sag = 0

      } else if (elapsed < ENTRY_MS + SETTLE_MS) {
        const p = easeOut((elapsed - ENTRY_MS) / SETTLE_MS)
        rightX = width
        amp   = 1.8  + (tAmp   - 1.8)  * p
        freq  = 3.0  + (tFreq  - 3.0)  * p
        speed = 0.35 + (tSpeed - 0.35) * p
        sag   = tSag * p

      } else {
        rightX = width
        amp = tAmp; freq = tFreq; speed = tSpeed; sag = tSag
        spawnSpark(tl)
      }

      ctx.clearRect(0, 0, width, height)

      if (rightX > 0) {
        const cy    = height / 2
        const steps = elapsed < ENTRY_MS
          ? Math.max(20, Math.floor(300 * (rightX / width)))
          : 400

        ctx.beginPath()
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps
          const x    = frac * rightX
          const y    = ropeY(frac, cy, amp, freq, speed, sag, t)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = '#0d0d0d'
        ctx.lineWidth   = 1.5
        ctx.lineJoin    = 'round'
        ctx.stroke()

        // Draw sparks on top of rope
        if (elapsed >= ENTRY_MS + SETTLE_MS) {
          drawSparks(cy, amp, freq, speed, sag)
        }
      }

      t += 0.016
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
