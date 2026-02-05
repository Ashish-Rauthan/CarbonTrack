import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const [showReportsMenu, setShowReportsMenu] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (!token && (location.pathname === '/login' || location.pathname === '/signup')) {
    return null
  }

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      padding: '1rem 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      borderBottom: '1px solid #404040',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textDecoration: 'none',
          transition: 'all 0.3s ease'
        }}>
          🌍 Carbon Tracker
        </Link>

        <ul style={{
          display: 'flex',
          listStyle: 'none',
          gap: '2rem',
          alignItems: 'center',
          margin: 0,
          padding: 0
        }}>
          {token ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  style={{
                    color: isActive('/dashboard') && !isActive('/reports') && !isActive('/cloud') ? '#4CAF50' : '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    background: isActive('/dashboard') && !isActive('/reports') && !isActive('/cloud') ? '#3a3a3a' : 'transparent'
                  }}
                >
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  to="/cloud"
                  style={{
                    color: isActive('/cloud') ? '#4CAF50' : '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    background: isActive('/cloud') ? '#3a3a3a' : 'transparent'
                  }}
                >
                  ☁️ Cloud
                </Link>
              </li>

              <li style={{ position: 'relative' }}>
                <button
                  onMouseEnter={() => setShowReportsMenu(true)}
                  onMouseLeave={() => setShowReportsMenu(false)}
                  style={{
                    color: isActive('/reports') ? '#4CAF50' : '#e0e0e0',
                    background: isActive('/reports') ? '#3a3a3a' : 'transparent',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Reports
                  <span style={{ fontSize: '0.7rem' }}>▼</span>
                </button>

                {showReportsMenu && (
                  <div
                    onMouseEnter={() => setShowReportsMenu(true)}
                    onMouseLeave={() => setShowReportsMenu(false)}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0.5rem',
                      background: '#2d2d2d',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      minWidth: '200px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      overflow: 'hidden'
                    }}
                  >
                    <Link
                      to="/reports"
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#e0e0e0',
                        textDecoration: 'none',
                        transition: 'all 0.3s',
                        borderBottom: '1px solid #404040'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#3a3a3a'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      📊 Summary
                    </Link>
                    <Link
                      to="/reports/insights"
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#e0e0e0',
                        textDecoration: 'none',
                        transition: 'all 0.3s',
                        borderBottom: '1px solid #404040'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#3a3a3a'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      🧠 Insights
                    </Link>
                    <Link
                      to="/reports/progress"
                      style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#e0e0e0',
                        textDecoration: 'none',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#3a3a3a'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      🎯 Progress
                    </Link>
                  </div>
                )}
              </li>

              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid #4CAF50',
                    color: '#4CAF50',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontSize: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#4CAF50'
                    e.target.style.color = '#1a1a1a'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                    e.target.style.color = '#4CAF50'
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  style={{
                    color: '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#3a3a3a'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  style={{
                    color: '#e0e0e0',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#3a3a3a'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation