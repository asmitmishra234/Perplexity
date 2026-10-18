import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const Protector = ({ children }) => {
  const user = useSelector(state => state.auth.user)
  const loading = useSelector(state => state.auth.loading)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--color-surface-0)' }}>
        <div className="flex flex-col items-center gap-4">
          {/* Perplexity-style logo mark */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold italic"
               style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent)', fontFamily: 'Georgia, serif' }}>
            p
          </div>
          {/* Three-dot loader */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--color-accent)',
                      animation: 'typing-bounce 1s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default Protector