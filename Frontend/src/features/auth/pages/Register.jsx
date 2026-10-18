import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '../hook/useAuth'
import '../../../Styles/Auth.css'

const Register = () => {
  const [userName, setuserName]             = useState('')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setconfirmPassword] = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [verificationUrl, setVerificationUrl] = useState('')

  const user    = useSelector(state => state.auth.user)
  const loading = useSelector(state => state.auth.loading)
  const error   = useSelector(state => state.auth.error)
  const { handleRegister } = useAuth()
  const navigate = useNavigate()

  const SubmitForm = async (e) => {
    e.preventDefault()
    const registered = await handleRegister({ userName, email, password, confirmPassword })
    if (registered) {
      setVerificationUrl(registered.verificationUrl || '')
      if (!registered.verificationUrl) navigate('/login')
    }
  }

  if (!loading && user) return <Navigate to="/" replace />

  const onFocus = e => {
    e.target.style.borderColor = 'var(--color-accent)'
    e.target.style.boxShadow   = '0 0 0 3px var(--color-accent-glow)'
  }
  const onBlur = e => {
    e.target.style.borderColor = 'var(--color-border)'
    e.target.style.boxShadow   = 'none'
  }

  const inputBase = {
    background:   'var(--color-surface-3)',
    border:       '1px solid var(--color-border)',
    color:        'var(--color-text-primary)',
    outline:      'none',
    transition:   'border-color 0.15s, box-shadow 0.15s',
    borderRadius: '10px',
    padding:      '0.6rem 0.875rem',
    fontSize:     '0.875rem',
    width:        '100%',
    display:      'block',
  }

  const canSubmit = !loading && userName && email && password && confirmPassword

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--color-surface-0)' }}>

      {/* Dot-grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-border-subtle) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.5,
        }}
      />

      <div className="relative w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[1.05rem] font-bold italic flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
                color: '#fff',
                fontFamily: 'Georgia, serif',
                boxShadow: '0 0 0 1px rgba(59,158,221,0.25)',
              }}>
              p
            </div>
            <span className="text-[0.95rem] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Perplexity
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'var(--color-surface-1)',
            border:     '1px solid var(--color-border-subtle)',
            boxShadow:  '0 24px 64px rgba(0,0,0,0.4)',
          }}>

          <h1 className="text-[1.15rem] font-semibold text-center mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Create your account
          </h1>
          <p className="text-[0.82rem] text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Start exploring with your AI assistant
          </p>

          <form onSubmit={SubmitForm} noValidate>

            {/* Username */}
            <div className="mb-3.5">
              <label htmlFor="reg-username" className="block text-[0.75rem] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                placeholder="johndoe"
                value={userName}
                onChange={e => setuserName(e.target.value)}
                required
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Email */}
            <div className="mb-3.5">
              <label htmlFor="reg-email" className="block text-[0.75rem] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div className="mb-3.5">
              <label htmlFor="reg-password" className="block text-[0.75rem] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputBase, paddingRight: '3rem' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.72rem] select-none hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="mb-5">
              <label htmlFor="reg-confirm" className="block text-[0.75rem] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => setconfirmPassword(e.target.value)}
                required
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-[0.78rem]"
                style={{
                  background: 'rgba(248,113,113,0.07)',
                  border:     '1px solid rgba(248,113,113,0.18)',
                  color:      'var(--color-error)',
                }}>
                <span className="mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Verification URL (dev helper) */}
            {verificationUrl && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-[0.78rem]"
                style={{
                  background: 'rgba(59,158,221,0.06)',
                  border:     '1px solid rgba(59,158,221,0.2)',
                  color:      'var(--color-text-secondary)',
                }}>
                <span>Check your email, or{' '}
                  <a
                    href={verificationUrl}
                    className="font-semibold underline"
                    style={{ color: 'var(--color-accent)' }}>
                    click to verify
                  </a>
                  {' '}(dev link)
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 rounded-xl text-[0.875rem] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'var(--color-surface-3)'
                  : 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
                color: '#fff',
                border: 'none',
                boxShadow: canSubmit ? '0 2px 14px var(--color-accent-glow)' : 'none',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="inline-block w-1 h-1 rounded-full bg-white"
                            style={{ animation: 'typing-bounce 1s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </span>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center mt-5 text-[0.82rem]" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold transition-colors"
            style={{ color: 'var(--color-accent)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-accent)'}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register