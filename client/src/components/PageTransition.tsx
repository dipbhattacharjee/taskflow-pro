// client/src/components/PageTransition.tsx
// Wrap every page with this for smooth fade+slide transitions

import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
}

export default function PageTransition({ children }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so React has painted the initial state
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {children}
    </div>
  )
}
