import { useEffect, useState } from 'react'
import splashImg from '../../assets/splash.jpg'

export default function SplashScreen({ duration = 1800, fadeMs = 500 }) {
  const [phase, setPhase] = useState('show')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), duration)
    const t2 = setTimeout(() => setPhase('done'), duration + fadeMs)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [duration, fadeMs])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fade' ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease`,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <img
        src={splashImg}
        alt="LWO"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserDrag: 'none'
        }}
        draggable={false}
      />
    </div>
  )
}
