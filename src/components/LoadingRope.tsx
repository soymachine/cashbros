import { useRef, useEffect } from 'react'

interface LoadingRopeProps {
  onComplete: () => void
  duration?: number
}

export function LoadingRope({ onComplete, duration = 750 }: LoadingRopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const el = canvas

    let width = 0, height = 0, animId = 0, t = 0
    const startTime = performance.now()

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

    function easeOut(x: number): number {
      // cubic ease-out: fast at start, slows toward right edge
      return 1 - Math.pow(1 - x, 3)
    }

    function draw(now: number) {
      if (!width || !height) { animId = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, width, height)

      const elapsed = now - startTime
      const raw = Math.min(1, elapsed / duration)
      const progress = easeOut(raw)
      const cy = height / 2
      const rightX = progress * width

      if (rightX > 1) {
        ctx.beginPath()
        const steps = Math.max(20, Math.floor(300 * progress))
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps
          const x = frac * rightX
          // Very small wave, zero at both endpoints
          const env = Math.sin(Math.PI * frac)
          const wave = 1.8 * Math.sin(2 * Math.PI * (frac * 3 - t * 0.35)) * env
          const y = cy + wave
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = '#0d0d0d'
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      t += 0.016

      if (raw < 1) {
        animId = requestAnimationFrame(draw)
      } else {
        // Hold one last frame fully extended, then signal done
        animId = requestAnimationFrame(draw)
        if (!calledRef.current) {
          calledRef.current = true
          setTimeout(onComplete, 80)
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [onComplete, duration])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
