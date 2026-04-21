import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

const Signup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0) // 0-3

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
    if (name === 'password') {
      let strength = 0
      if (value.length >= 6) strength++
      if (value.length >= 10) strength++
      if (/[^a-zA-Z0-9]/.test(value)) strength++
      setPasswordStrength(strength)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const response = await authAPI.register(formData.name, formData.email, formData.password)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']
  const strengthColors = ['', '#ba1a1a', '#ff9800', '#2c694e']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .ee-signup-root {
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

        .ee-signup-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(1,45,29,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(1,45,29,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .ee-su-blob-1 {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, rgba(127,253,139,0.2) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .ee-su-blob-2 {
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(193,236,212,0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* Two-column layout */
        .ee-signup-layout {
          width: 100%;
          max-width: 860px;
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(25,28,28,0.1), 0 8px 24px rgba(25,28,28,0.05);
          outline: 1px solid rgba(193,200,194,0.2);
          position: relative;
          z-index: 10;
          animation: ee-fadeUp 0.65s ease both;
        }

        @media (max-width: 640px) {
          .ee-signup-layout {
            grid-template-columns: 1fr;
          }
          .ee-signup-panel {
            display: none;
          }
        }

        /* Left editorial panel */
        .ee-signup-panel {
          background: linear-gradient(160deg, #012d1d 0%, #1b4332 100%);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .ee-panel-texture {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(127,253,139,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(193,236,212,0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        .ee-panel-brand {
          font-family: 'Manrope', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(127,253,139,0.8);
          position: relative;
          z-index: 1;
        }
        .ee-panel-headline {
          position: relative;
          z-index: 1;
        }
        .ee-panel-headline h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 1.25rem;
        }
        .ee-panel-headline p {
          font-size: 0.875rem;
          color: rgba(193,236,212,0.75);
          line-height: 1.7;
        }
        .ee-panel-stat {
          position: relative;
          z-index: 1;
          padding-top: 2rem;
          border-top: 1px solid rgba(193,236,212,0.15);
        }
        .ee-panel-stat-num {
          font-family: 'Manrope', sans-serif;
          font-size: 2.25rem;
          font-weight: 800;
          color: #7ffd8b;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .ee-panel-stat-label {
          font-size: 0.75rem;
          color: rgba(193,236,212,0.6);
          margin-top: 0.25rem;
          letter-spacing: 0.05em;
        }

        /* Right form panel */
        .ee-signup-form-panel {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 2.75rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .ee-signup-header {
          margin-bottom: 1.75rem;
        }
        .ee-su-eyebrow {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2c694e;
          margin-bottom: 0.5rem;
        }
        .ee-su-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #191c1c;
          line-height: 1.15;
        }
        .ee-su-subtitle {
          font-size: 0.825rem;
          color: #414844;
          margin-top: 0.4rem;
          line-height: 1.6;
        }

        /* Form fields */
        .ee-su-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ee-su-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
        }
        .ee-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .ee-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #191c1c;
        }
        .ee-input-wrap {
          position: relative;
        }
        .ee-input-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #717973;
          font-size: 1rem;
          pointer-events: none;
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          transition: color 0.18s;
          line-height: 1;
        }
        .ee-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.65rem 0.875rem 0.65rem 2.5rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #191c1c;
          background: #ffffff;
          border-radius: 0.625rem;
          border: none;
          outline: 1px solid rgba(193,200,194,0.35);
          box-shadow: 0 1px 2px rgba(25,28,28,0.04);
          transition: outline 0.18s, box-shadow 0.18s;
        }
        .ee-input::placeholder { color: rgba(113,121,115,0.45); }
        .ee-input:focus {
          outline: 1.5px solid #012d1d;
          box-shadow: 0 0 0 3.5px rgba(193,236,212,0.45);
        }
        .ee-input-wrap:focus-within .ee-input-icon { color: #012d1d; }

        /* Password strength */
        .ee-strength-row {
          display: flex;
          gap: 0.3rem;
          margin-top: 0.4rem;
          align-items: center;
        }
        .ee-strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: #e7e8e7;
          transition: background 0.3s;
        }
        .ee-strength-label {
          font-size: 0.65rem;
          font-weight: 600;
          min-width: 36px;
          text-align: right;
          transition: color 0.3s;
        }

        /* Error */
        .ee-error {
          background: #ffdad6;
          color: #93000a;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 0.6rem 0.8rem;
          border-radius: 0.5rem;
          border-left: 3px solid #ba1a1a;
          animation: ee-shake 0.35s ease;
        }

        /* Submit */
        .ee-btn-primary {
          width: 100%;
          padding: 0.825rem 1.25rem;
          background: #012d1d;
          color: #ffffff;
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
          transition: background 0.25s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(1,45,29,0.2);
          position: relative;
          overflow: hidden;
        }
        .ee-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06));
          pointer-events: none;
        }
        .ee-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%);
          box-shadow: 0 6px 20px rgba(1,45,29,0.3);
          transform: translateY(-1px);
        }
        .ee-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .ee-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .ee-btn-arrow {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 300;
          font-size: 1.05rem;
          transition: transform 0.2s;
        }
        .ee-btn-primary:hover .ee-btn-arrow { transform: translateX(3px); }

        .ee-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: ee-spin 0.7s linear infinite;
        }

        /* Footer */
        .ee-su-footer {
          margin-top: 1.25rem;
          text-align: center;
        }
        .ee-su-footer-text {
          font-size: 0.825rem;
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

        @keyframes ee-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ee-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ee-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="ee-signup-root">
        <div className="ee-su-blob-1" />
        <div className="ee-su-blob-2" />

        <div className="ee-signup-layout">
          {/* Left editorial panel */}
          <div className="ee-signup-panel">
            <div className="ee-panel-texture" />
            <div className="ee-panel-brand">Earthbound Editorial</div>
            <div className="ee-panel-headline">
              <h2>Begin your digital forest.</h2>
              <p>Track emissions, optimize workloads, and build a permanent legacy of environmental impact.</p>
            </div>
            <div className="ee-panel-stat">
              <div className="ee-panel-stat-num">98%</div>
              <div className="ee-panel-stat-label">Emission reduction possible<br />via cloud region selection</div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="ee-signup-form-panel">
            <div className="ee-signup-header">
              <div className="ee-su-eyebrow">New Account</div>
              <h2 className="ee-su-title">Create an account</h2>
              <p className="ee-su-subtitle">Set up your profile to start tracking your carbon footprint.</p>
            </div>

            {error && <div className="ee-error" style={{ marginBottom: '0.875rem' }}>{error}</div>}

            <form className="ee-su-form" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="ee-field-group">
                <label className="ee-label" htmlFor="name">Full Name</label>
                <div className="ee-input-wrap">
                  <span className="ee-input-icon material-symbols-outlined">person</span>
                  <input
                    id="name"
                    className="ee-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    placeholder="jane@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password row */}
              <div className="ee-su-row">
                <div className="ee-field-group">
                  <label className="ee-label" htmlFor="password">Password</label>
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
                      autoComplete="new-password"
                    />
                  </div>
                  {formData.password && (
                    <div className="ee-strength-row">
                      {[1, 2, 3].map((lvl) => (
                        <div
                          key={lvl}
                          className="ee-strength-bar"
                          style={{
                            background: passwordStrength >= lvl
                              ? strengthColors[passwordStrength]
                              : '#e7e8e7',
                          }}
                        />
                      ))}
                      <span
                        className="ee-strength-label"
                        style={{ color: strengthColors[passwordStrength] }}
                      >
                        {strengthLabels[passwordStrength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="ee-field-group">
                  <label className="ee-label" htmlFor="confirmPassword">Confirm</label>
                  <div className="ee-input-wrap">
                    <span className="ee-input-icon material-symbols-outlined">lock_reset</span>
                    <input
                      id="confirmPassword"
                      className="ee-input"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <button className="ee-btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="ee-spinner" /> Creating account…</>
                ) : (
                  <>Sign Up <span className="ee-btn-arrow material-symbols-outlined">arrow_forward</span></>
                )}
              </button>
            </form>

            <div className="ee-su-footer">
              <p className="ee-su-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="ee-footer-link">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Signup