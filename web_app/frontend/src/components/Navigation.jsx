import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const [showReportsMenu, setShowReportsMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (!token && (location.pathname === '/login' || location.pathname === '/signup')) {
    return null
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

        .nav-root {
          font-family: 'Inter', sans-serif;
        }

        /* Desktop top bar */
        .nav-topbar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 40px 40px rgba(25,28,28,0.03);
          padding: 0 2rem;
          height: 64px;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        @media (min-width: 768px) {
          .nav-topbar { display: flex; }
          .nav-mobile-header { display: none !important; }
        }

        .nav-brand {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 1.125rem;
          color: #1B4332;
          letter-spacing: -0.02em;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(25,28,28,0.6);
          text-decoration: none;
          padding: 0.4rem 0.875rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .nav-link:hover {
          color: #012d1d;
          background: #e7e8e7;
        }

        .nav-link.active {
          color: #012d1d;
          background: #ffffff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(25,28,28,0.08);
        }

        .nav-link .material-symbols-outlined {
          font-size: 1.1rem;
          font-variation-settings: 'FILL' 0, 'wght' 300;
        }

        .nav-link.active .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-icon-btn {
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: rgba(25,28,28,0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-icon-btn:hover {
          background: #e7e8e7;
          color: #012d1d;
        }

        .nav-icon-btn .material-symbols-outlined {
          font-size: 1.25rem;
          font-variation-settings: 'FILL' 0, 'wght' 300;
        }

        .nav-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: #1B4332;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
          color: white;
          font-weight: 600;
        }

        .nav-logout-btn {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.375rem 0.875rem;
          background: transparent;
          border: 1px solid rgba(193,200,194,0.5);
          border-radius: 0.5rem;
          color: rgba(25,28,28,0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-logout-btn:hover {
          background: #e7e8e7;
          color: #012d1d;
          border-color: transparent;
        }

        /* Reports dropdown */
        .reports-wrapper {
          position: relative;
        }

        .reports-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 40px 40px rgba(25,28,28,0.08), 0 4px 16px rgba(25,28,28,0.06);
          min-width: 180px;
          padding: 0.375rem;
          z-index: 100;
          animation: dropIn 0.15s ease;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(25,28,28,0.7);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .dropdown-item:hover {
          background: #f3f4f3;
          color: #012d1d;
        }

        .dropdown-item .material-symbols-outlined {
          font-size: 1rem;
          font-variation-settings: 'FILL' 0, 'wght' 300;
          color: rgba(25,28,28,0.4);
        }

        /* Sidebar */
        .nav-sidebar {
          display: none;
          position: fixed;
          left: 0;
          top: 64px;
          width: 240px;
          height: calc(100vh - 64px);
          background: #f3f4f3;
          padding: 1.5rem 0.75rem;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 40;
          border-right: none;
        }

        @media (min-width: 768px) {
          .nav-sidebar { display: flex; }
          .main-offset { margin-left: 240px; }
        }

        .sidebar-brand {
          padding: 0 0.75rem 1.5rem;
        }

        .sidebar-brand-name {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: #1B4332;
          letter-spacing: -0.01em;
        }

        .sidebar-brand-sub {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(25,28,28,0.45);
          margin-top: 0.125rem;
          letter-spacing: 0.01em;
        }

        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          border-radius: 0.625rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(25,28,28,0.6);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .sidebar-nav-link:hover {
          background: #e7e8e7;
          color: #191c1c;
        }

        .sidebar-nav-link.active {
          background: white;
          color: #012d1d;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(25,28,28,0.07);
        }

        .sidebar-nav-link .material-symbols-outlined {
          font-size: 1.125rem;
          font-variation-settings: 'FILL' 0, 'wght' 300;
        }

        .sidebar-nav-link.active .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400;
          color: #1B4332;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding-top: 1rem;
        }

        .sidebar-export-btn {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: #e1e3e2;
          color: #012d1d;
          border: none;
          border-radius: 0.625rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .sidebar-export-btn:hover {
          background: #d9dad9;
        }

        /* Mobile header */
        .nav-mobile-header {
          display: flex;
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 56px;
          padding: 0 1.25rem;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 0 rgba(193,200,194,0.2);
        }

        .mobile-brand {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: #1B4332;
          text-decoration: none;
        }
      `}</style>

      <div className="nav-root">
        {/* Mobile Header */}
        <header className="nav-mobile-header">
          <Link to="/" className="mobile-brand">CarbonTrack</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="nav-icon-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="nav-avatar">
              {(() => { const u = JSON.parse(localStorage.getItem('user') || '{}'); return (u.name || 'U')[0].toUpperCase() })()}
            </div>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="nav-topbar">
          <Link to="/" className="nav-brand">CarbonTrack</Link>

          <ul className="nav-links">
            {token ? (
              <>
                <li>
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">dashboard</span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/cloud" className={`nav-link ${isActive('/cloud') ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">cloud_done</span>
                    Cloud
                  </Link>
                </li>
                <li className="reports-wrapper"
                  onMouseEnter={() => setShowReportsMenu(true)}
                  onMouseLeave={() => setShowReportsMenu(false)}
                >
                  <button className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">analytics</span>
                    Reports
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', opacity: 0.5 }}>expand_more</span>
                  </button>
                  {showReportsMenu && (
                    <div className="reports-dropdown">
                      <Link to="/reports" className="dropdown-item">
                        <span className="material-symbols-outlined">summarize</span>
                        Summary
                      </Link>
                      <Link to="/reports/insights" className="dropdown-item">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Insights
                      </Link>
                      <Link to="/reports/progress" className="dropdown-item">
                        <span className="material-symbols-outlined">show_chart</span>
                        Progress
                      </Link>
                    </div>
                  )}
                </li>
              </>
            ) : null}
          </ul>

          <div className="nav-right">
            {token ? (
              <>
                <button className="nav-icon-btn">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <button className="nav-icon-btn">
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <div className="nav-avatar">
                  {(() => { const u = JSON.parse(localStorage.getItem('user') || '{}'); return (u.name || 'U')[0].toUpperCase() })()}
                </div>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log in</Link>
                <Link to="/signup" className="nav-link active">Sign up</Link>
              </>
            )}
          </div>
        </header>

        {/* Desktop Sidebar */}
        {token && (
          <aside className="nav-sidebar">
            <div className="sidebar-brand">
              <div className="sidebar-brand-name">Carbon Tracker</div>
              <div className="sidebar-brand-sub">The Digital Arboreal</div>
            </div>

            <Link to="/dashboard" className={`sidebar-nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </Link>
            <Link to="/cloud" className={`sidebar-nav-link ${isActive('/cloud') ? 'active' : ''}`}>
              <span className="material-symbols-outlined">cloud_done</span>
              Cloud Optimization
            </Link>
            <Link to="/reports" className={`sidebar-nav-link ${isActive('/reports') ? 'active' : ''}`}>
              <span className="material-symbols-outlined">analytics</span>
              Reports
            </Link>
            <Link to="/settings" className={`sidebar-nav-link ${isActive('/settings') ? 'active' : ''}`}>
              <span className="material-symbols-outlined">settings</span>
              Settings
            </Link>

            <div className="sidebar-bottom">
              <button className="sidebar-export-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                Export Emissions Data
              </button>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

export default Navigation