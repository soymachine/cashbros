import { useRef, useEffect } from 'react'

interface RopeCanvasProps {
  tensionLevel: number      // 0 = balanced, 1 = max tension
  tensionDirection: number  // -1 = pull up (top user owes), +1 = pull down (bottom user owes), 0 = even
}

export function RopeCanvas({ tensionLevel, tensionDirection }: RopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ tensionLevel, tensionDirection })

  useEffect(() => {
    stateRef.current = { tensionLevel, tensionDirection }
  }, [tensionLevel, tensionDirection])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const el = canvas  // stable non-null reference for closures

    let width = 0
    let height = 0
    let animId = 0
    let t = 0

    function setupCanvas() {
      const rect = el.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      width = rect.width
      height = rect.height
      el.width = rect.width * dpr
      el.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const ro = new ResizeObserver(setupCanvas)
    ro.observe(el)
    setupCanvas()

    function draw() {
      if (!width || !height) {
        animId = requestAnimationFrame(draw)
        return
      }

      const { tensionLevel: tl, tensionDirection: td } = stateRef.current

      ctx.clearRect(0, 0, width, height)

      // Wave parameters scale with tension
      const amp    = 3  + tl * 26
      const freq   = 2.0 + tl * 2.0
      const speed  = 0.30 + tl * 1.5
      const maxSag = height * 0.40
      const sag    = tl * maxSag * td

      ctx.beginPath()

      const steps = 400
      for (let i = 0; i <= steps; i++) {
        const xn = i / steps
        const x  = xn * width
        // Envelope: 0 at fixed endpoints, 1 at center
        const env = Math.sin(Math.PI * xn)

        const w1 = amp       * Math.sin(2 * Math.PI * (xn * freq        - t * speed))        * env
        const w2 = amp * 0.4 * Math.sin(2 * Math.PI * (xn * freq * 1.6  + t * speed * 0.65)) * env
        const w3 = amp * 0.2 * Math.sin(2 * Math.PI * (xn * freq * 2.8  - t * speed * 1.3))  * env

        const y = height / 2 + sag * env + w1 + w2 + w3

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.strokeStyle = '#0d0d0d'
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()

      t += 0.016
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, []) // animation loop runs once; tension read from ref each frame

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
