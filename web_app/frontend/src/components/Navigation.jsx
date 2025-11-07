import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navigation = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          🌍 Carbon Tracker
        </Link>
        <ul className="navbar-nav">
          {token ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li>
                <button 
                  onClick={handleLogout} 
                  className="btn" 
                  style={{background: 'transparent', border: '1px solid white'}}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation