// client/src/components/AnimatedButton.tsx
// Drop-in replacement for plain <button> with loading state + ripple

import { useState, useRef } from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'danger' | 'ghost'
  children: React.ReactNode
}

export default function AnimatedButton({
  loading = false,
  variant = 'primary',
  children,
  onClick,
  disabled,
  className = '',
  style = {},
  ...rest
}: Props) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>()
  const btnRef = useRef<HTMLButtonElement>(null)
  const rippleCount = useRef(0)

  const variantStyles = {
    primary: { background: '#6366f1', color: 'white', border: 'none' },
    danger:  { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
    ghost:   { background: 'rgba(255,255,255,0.05)', color: '#8892b0', border: '1px solid rgba(255,255,255,0.1)' },
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    // Ripple
    const rect = btnRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++rippleCount.current
    setRipples((prev) => [...(prev ?? []), { x, y, id }])
    setTimeout(() => setRipples((prev) => prev?.filter((r) => r.id !== id)), 600)
    onClick?.(e)
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 20px',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.1s ease, opacity 0.2s ease',
        userSelect: 'none',
        ...variantStyles[variant],
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      {...rest}
    >
      {/* Ripples */}
      {ripples?.map((r) => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            transform: 'translate(-50%,-50%)',
            animation: 'ripple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Spinner */}
      {loading && (
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      )}

      {children}

      <style>{`
        @keyframes ripple {
          to { width: 200px; height: 200px; opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
