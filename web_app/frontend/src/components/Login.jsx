import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login(formData.email, formData.password)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .ee-login-root {
          min-height: 100vh;
          background-color: #f9f9f8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* Ambient background blobs */
        .ee-bg-blob-1 {
          position: absolute;
          top: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(193,236,212,0.35) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }
        .ee-bg-blob-2 {
          position: absolute;
          bottom: -100px;
          right: -60px;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(127,253,139,0.15) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }
        .ee-bg-blob-3 {
          position: absolute;
          top: 40%;
          left: 60%;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(1,45,29,0.04) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        /* Subtle grid texture */
        .ee-login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(1,45,29,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(1,45,29,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Brand header */
        .ee-brand {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
          animation: ee-fadeUp 0.6s ease both;
        }
        .ee-brand-wordmark {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 1.75rem;
          letter-spacing: -0.03em;
          color: #012d1d;
          line-height: 1;
        }
        .ee-brand-tagline {
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2c694e;
          margin-top: 0.35rem;
          opacity: 0.8;
        }

        /* Card */
        .ee-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 1rem;
          box-shadow: 0 40px 80px rgba(25,28,28,0.07), 0 8px 24px rgba(25,28,28,0.04);
          outline: 1px solid rgba(193,200,194,0.22);
          padding: 2.5rem;
          position: relative;
          z-index: 10;
          animation: ee-fadeUp 0.7s 0.1s ease both;
          overflow: hidden;
        }

        /* Decorative corner accent */
        .ee-card-accent {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(193,236,212,0.5) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .ee-card-header {
          margin-bottom: 2rem;
        }
        .ee-card-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #191c1c;
          line-height: 1.15;
        }
        .ee-card-subtitle {
          font-size: 0.875rem;
          color: #414844;
          margin-top: 0.4rem;
          line-height: 1.6;
        }

        /* Form */
        .ee-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .ee-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .ee-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #191c1c;
        }
        .ee-input-wrap {
          position: relative;
        }
        .ee-input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #717973;
          font-size: 1.1rem;
          pointer-events: none;
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          transition: color 0.2s;
          line-height: 1;
        }
        .ee-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: #191c1c;
          background: #ffffff;
          border-radius: 0.625rem;
          border: none;
          outline: 1px solid rgba(193,200,194,0.3);
          box-shadow: 0 1px 3px rgba(25,28,28,0.04);
          transition: outline 0.18s, box-shadow 0.18s;
        }
        .ee-input::placeholder { color: rgba(113,121,115,0.55); }
        .ee-input:focus {
          outline: 1.5px solid #012d1d;
          box-shadow: 0 0 0 4px rgba(193,236,212,0.45), 0 1px 3px rgba(25,28,28,0.04);
        }
        .ee-input-wrap:focus-within .ee-input-icon {
          color: #012d1d;
        }

        /* Forgot password row */
        .ee-password-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ee-forgot {
          font-size: 0.75rem;
          font-weight: 600;
          color: #012d1d;
          text-decoration: underline;
          text-decoration-color: rgba(1,45,29,0.3);
          text-underline-offset: 3px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .ee-forgot:hover { color: #1b4332; }

        /* Error */
        .ee-error {
          background: #ffdad6;
          color: #93000a;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.65rem 0.875rem;
          border-radius: 0.5rem;
          border-left: 3px solid #ba1a1a;
          animation: ee-shake 0.35s ease;
        }

        /* Submit button */
        .ee-btn-primary {
          width: 100%;
          padding: 0.875rem 1.25rem;
          background: #012d1d;
          color: #ffffff;
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 0.925rem;
          letter-spacing: 0.01em;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          transition: background 0.25s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(1,45,29,0.18);
          position: relative;
          overflow: hidden;
        }
        .ee-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.07));
          pointer-events: none;
        }
        .ee-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%);
          box-shadow: 0 6px 20px rgba(1,45,29,0.28);
          transform: translateY(-1px);
        }
        .ee-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .ee-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .ee-btn-arrow {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 300;
          font-size: 1.1rem;
          transition: transform 0.2s;
        }
        .ee-btn-primary:hover .ee-btn-arrow { transform: translateX(3px); }

        /* Spinner */
        .ee-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: ee-spin 0.7s linear infinite;
        }

        /* Divider */
        .ee-divider {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-top: 0.5rem;
        }
        .ee-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(193,200,194,0.25);
        }
        .ee-divider-text {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #717973;
        }

        /* Footer */
        .ee-card-footer {
          margin-top: 1.5rem;
          text-align: center;
        }
        .ee-footer-text {
          font-size: 0.85rem;
          color: #414844;
        }
        .ee-footer-link {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          color: #012d1d;
          text-decoration: underline;
          text-decoration-color: rgba(1,45,29,0.3);
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .ee-footer-link:hover { color: #1b4332; }

        /* Page footer */
        .ee-page-footer {
          margin-top: 2rem;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: rgba(65,72,68,0.5);
          text-align: center;
          position: relative;
          z-index: 10;
          animation: ee-fadeUp 0.8s 0.2s ease both;
        }

        /* Animations */
        @keyframes ee-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ee-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ee-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-6px); }
          75%      { transform: translateX(6px); }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="ee-login-root">
        <div className="ee-bg-blob-1" />
        <div className="ee-bg-blob-2" />
        <div className="ee-bg-blob-3" />

        {/* Brand */}
        <div className="ee-brand">
          <div className="ee-brand-wordmark">Earthbound Editorial</div>
          <div className="ee-brand-tagline">The Digital Arboreal</div>
        </div>

        {/* Card */}
        <div className="ee-card">
          <div className="ee-card-accent" />

          <div className="ee-card-header">
            <h2 className="ee-card-title">Welcome back</h2>
            <p className="ee-card-subtitle">Log in to your carbon tracking dashboard.</p>
          </div>

          {error && <div className="ee-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form className="ee-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="ee-field-group">
              <label className="ee-label" htmlFor="email">Email Address</label>
              <div className="ee-input-wrap">
                <span className="ee-input-icon material-symbols-outlined">mail</span>
                <input
                  id="email"
                  className="ee-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="ee-field-group">
              <div className="ee-password-row">
                <label className="ee-label" htmlFor="password">Password</label>
                <span className="ee-forgot">Forgot password?</span>
              </div>
              <div className="ee-input-wrap">
                <span className="ee-input-icon material-symbols-outlined">lock</span>
                <input
                  id="password"
                  className="ee-input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button className="ee-btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <><div className="ee-spinner" /> Logging in…</>
              ) : (
                <>Login <span className="ee-btn-arrow material-symbols-outlined">arrow_forward</span></>
              )}
            </button>
          </form>

          <div className="ee-divider">
            <div className="ee-divider-line" />
            <span className="ee-divider-text">Or</span>
            <div className="ee-divider-line" />
          </div>

          <div className="ee-card-footer">
            <p className="ee-footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="ee-footer-link">Sign Up</Link>
            </p>
          </div>
        </div>

        <p className="ee-page-footer">© 2024 Earthbound Editorial · Towards a permanent digital forest.</p>
      </div>
    </>
  )
}

export default Login