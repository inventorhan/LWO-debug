import { useState, useRef, useEffect } from 'react'
import splashImg from '../../assets/splash.jpg'

export default function SplashScreen({ fadeMs = 400 }) {
  const [phase, setPhase] = useState('show')
  const doneTimer = useRef(null)

  useEffect(() => () => clearTimeout(doneTimer.current), [])

  const dismiss = () => {
    if (phase !== 'show') return
    setPhase('fade')
    doneTimer.current = setTimeout(() => setPhase('done'), fadeMs)
  }

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 16,
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
          maxHeight: '78vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          borderRadius: 8
        }}
        draggable={false}
      />
      <button
        onClick={dismiss}
        style={{
          padding: '14px 56px',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'white',
          background: 'linear-gradient(135deg, #C2185B 0%, #6F0023 100%)',
          border: '2px solid rgba(255,255,255,0.6)',
          borderRadius: 999,
          boxShadow: '0 6px 24px rgba(0,0,0,0.5), 0 0 0 6px rgba(165,0,52,0.25)',
          cursor: 'pointer',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          animation: 'splashPulse 1.6s ease-in-out infinite',
          flexShrink: 0
        }}
      >
        ▶ Start
      </button>
      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 0 6px rgba(165,0,52,0.25); }
          50%      { transform: scale(1.06); box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 12px rgba(165,0,52,0.35); }
        }
      `}</style>
    </div>
  )
}
