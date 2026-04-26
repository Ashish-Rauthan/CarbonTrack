// web_app/frontend/src/components/Dashboard.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { emissionsAPI, reportsAPI } from '../services/api'

const POLL_INTERVAL_MS = 30_000   // re-fetch every 30 seconds

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  .db-root {
    font-family: 'Inter', sans-serif;
    background: #f9f9f8;
    min-height: 100vh;
    color: #191c1c;
    padding: 2.5rem 2rem 4rem;
  }

  @media (min-width: 1024px) {
    .db-root { padding: 3rem 3.5rem 4rem; }
  }

  .db-page-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  @media (min-width: 768px) {
    .db-page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .db-headline {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    color: #012d1d;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.5rem;
  }

  .db-subheadline {
    font-size: 1rem;
    color: #414844;
    margin: 0;
    max-width: 36ch;
    line-height: 1.5;
  }

  .db-header-actions {
    display: flex;
    gap: 0.625rem;
    flex-shrink: 0;
    align-items: center;
    flex-wrap: wrap;
  }

  .db-btn-secondary {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.5625rem 1.125rem;
    background: #e1e3e2;
    color: #191c1c;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .db-btn-secondary:hover { background: #d9dad9; }

  .db-btn-secondary .material-symbols-outlined {
    font-size: 0.9rem;
    font-variation-settings: 'FILL' 0, 'wght' 300;
  }

  .db-btn-primary {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.5625rem 1.125rem;
    background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%);
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .db-btn-primary:hover {
    opacity: 0.88;
    box-shadow: 0 8px 24px rgba(1,45,29,0.25);
  }

  .db-period-select {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.5rem 2rem 0.5rem 0.875rem;
    background: white;
    color: #191c1c;
    border: 1px solid rgba(193,200,194,0.2);
    border-radius: 0.5rem;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23414844' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }

  /* Live indicator */
  .db-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2c694e;
    background: #c1ecd4;
    padding: 0.3rem 0.625rem;
    border-radius: 9999px;
  }

  .db-live-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #3cbd54;
    animation: db-pulse 1.5s ease-in-out infinite;
  }

  @keyframes db-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }

  .db-last-updated {
    font-size: 0.75rem;
    color: #717973;
  }

  /* Stats grid */
  .db-stats-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 640px)  { .db-stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .db-stats-grid { grid-template-columns: repeat(4, 1fr); } }

  .db-stat-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .db-stat-card:hover { box-shadow: 0 40px 40px rgba(25,28,28,0.06); }

  .db-stat-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .db-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #414844;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }

  .db-stat-icon .material-symbols-outlined {
    font-size: 1.125rem;
    color: #717973;
    font-variation-settings: 'FILL' 0, 'wght' 300;
  }

  .db-stat-value {
    font-family: 'Manrope', sans-serif;
    font-size: 1.875rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin-bottom: 0.625rem;
    line-height: 1;
  }

  .db-stat-value.primary { color: #012d1d; }

  .db-stat-trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .db-stat-trend .material-symbols-outlined {
    font-size: 0.875rem;
  }

  .trend-up      { color: #ba1a1a; }
  .trend-down    { color: #3cbd54; }
  .trend-neutral { color: #2c694e; }

  .db-leaf-track {
    width: 100%;
    background: #e7e8e7;
    border-radius: 9999px;
    height: 4px;
    margin-top: 0.75rem;
  }

  .db-leaf-fill {
    background: linear-gradient(90deg, #2c694e, #61df72);
    height: 4px;
    border-radius: 9999px;
    transition: width 0.6s ease;
  }

  /* Section */
  .db-section-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
  }

  .db-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  /* ── Recent Sessions Table ─────────────────────────────────────── */
  .db-sessions-wrap {
    background: white;
    border-radius: 0.875rem;
    overflow: hidden;
    margin-bottom: 2.5rem;
  }

  .db-sessions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.75rem 1.25rem;
    border-bottom: 1px solid #f3f4f3;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .db-sessions-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    margin: 0;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .db-sessions-count {
    font-size: 0.75rem;
    font-weight: 500;
    color: #717973;
    background: #f3f4f3;
    padding: 0.1875rem 0.5rem;
    border-radius: 9999px;
  }

  .db-table {
    width: 100%;
    border-collapse: collapse;
  }

  .db-table thead th {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #717973;
    padding: 0.75rem 1.75rem;
    text-align: left;
    background: #fafafa;
    white-space: nowrap;
  }

  .db-table thead th.right { text-align: right; }

  .db-table tbody tr {
    border-top: 1px solid #f3f4f3;
    transition: background 0.15s ease;
  }

  .db-table tbody tr:hover { background: #fafafa; }

  .db-table tbody td {
    padding: 1rem 1.75rem;
    font-size: 0.875rem;
    color: #414844;
    vertical-align: middle;
  }

  .db-table tbody td.right { text-align: right; }

  .db-td-session {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .db-td-session-id {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #191c1c;
    font-family: 'Manrope', sans-serif;
  }

  .db-td-session-device {
    font-size: 0.6875rem;
    color: #717973;
  }

  .db-td-num {
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    font-size: 0.9375rem;
    color: #191c1c;
  }

  .db-td-num.co2   { color: #ba1a1a; }
  .db-td-num.green { color: #012d1d; }
  .db-td-num.blue  { color: #2c694e; }

  .db-source-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
    white-space: nowrap;
  }

  .source-codecarbon { background: #c1ecd4; color: #002114; }
  .source-estimated  { background: #f3f4f3; color: #717973; }

  .db-empty-row td {
    text-align: center;
    padding: 3rem;
    color: #717973;
  }

  .db-empty-icon-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .db-empty-icon-wrap .material-symbols-outlined {
    font-size: 2rem;
    color: #c1c8c2;
    font-variation-settings: 'FILL' 0, 'wght' 200;
  }

  /* Impact section */
  .db-impact-wrap {
    background: #f3f4f3;
    border-radius: 0.875rem;
    padding: 2rem;
    margin-bottom: 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .db-impact-bg {
    position: absolute;
    inset: 0;
    background-image: url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200&h=400');
    opacity: 0.06;
    background-size: cover;
    background-position: center;
    pointer-events: none;
  }

  .db-impact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    position: relative;
    z-index: 1;
  }

  @media (min-width: 768px) { .db-impact-grid { grid-template-columns: repeat(3, 1fr); } }

  .db-impact-card {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 0.625rem;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 40px 40px rgba(25,28,28,0.06);
  }

  .db-impact-icon-wrap {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.875rem;
  }

  .db-impact-icon-wrap .material-symbols-outlined {
    font-size: 1.25rem;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .db-impact-num {
    font-family: 'Manrope', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin-bottom: 0.25rem;
  }

  .db-impact-desc {
    font-size: 0.8125rem;
    color: #414844;
    line-height: 1.4;
  }

  /* Quick actions */
  .db-actions-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 640px) { .db-actions-grid { grid-template-columns: repeat(3, 1fr); } }

  .db-action-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.375rem 1.5rem;
    text-decoration: none;
    color: #191c1c;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    transition: all 0.2s ease;
  }

  .db-action-card:hover {
    box-shadow: 0 40px 40px rgba(25,28,28,0.06);
    transform: translateY(-1px);
  }

  .db-action-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .db-action-icon .material-symbols-outlined {
    font-size: 1.25rem;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .db-action-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #191c1c;
    display: block;
    margin-bottom: 0.125rem;
  }

  .db-action-sub   { font-size: 0.75rem; color: #414844; }

  .db-action-arrow {
    margin-left: auto;
    color: #c1c8c2;
    font-variation-settings: 'FILL' 0, 'wght' 300;
    font-size: 1.125rem;
  }

  /* Loading */
  .db-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    gap: 1rem;
  }

  .db-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e7e8e7;
    border-top-color: #012d1d;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Spinning refresh icon */
  .spin-icon { animation: spin 0.7s linear infinite; display: inline-block; }
`

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (seconds < 60)   return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(ts) {
  const d = new Date(ts)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return `Today ${formatTime(ts)}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + formatTime(ts)
}

// ── component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [stats,         setStats]         = useState(null)
  const [summary,       setSummary]       = useState(null)
  const [recentSessions,setRecentSessions]= useState([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [period,        setPeriod]        = useState('day')   // default "day" so fresh data shows
  const [lastUpdated,   setLastUpdated]   = useState(null)
  const [newSessionIds, setNewSessionIds] = useState(new Set())  // highlight newly arrived rows

  const prevSessionIdsRef = useRef(new Set())
  const pollTimerRef      = useRef(null)

  // ── core fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)

    try {
      const [sR, sumR, recR] = await Promise.all([
        emissionsAPI.getStats({ period }),
        reportsAPI.getSummary(period),
        emissionsAPI.getRecent(15),          // ← NEW: last 15 sessions
      ])

      setStats(sR.data)
      setSummary(sumR.data)

      const incoming = recR.data.emissions || []
      setRecentSessions(incoming)

      // Highlight rows that weren't here before
      const incomingIds = new Set(incoming.map(e => e._id))
      const fresh = [...incomingIds].filter(id => !prevSessionIdsRef.current.has(id))
      if (fresh.length && prevSessionIdsRef.current.size > 0) {
        setNewSessionIds(new Set(fresh))
        setTimeout(() => setNewSessionIds(new Set()), 4000)   // fade after 4s
      }
      prevSessionIdsRef.current = incomingIds

      setLastUpdated(new Date())
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }, [period])

  // ── initial load + polling ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    fetchData()

    // Poll every 30 s
    pollTimerRef.current = setInterval(() => fetchData(), POLL_INTERVAL_MS)

    return () => clearInterval(pollTimerRef.current)
  }, [fetchData])

  // ── derived values ─────────────────────────────────────────────────────────
  const localEmissions = stats?.totalEmissions || 0
  const energyUsage    = stats?.totalEnergy    || 0
  const sessionCount   = stats?.sessionCount   || 0
  const cloudSavings   = summary?.cloud?.totalSavings || 0
  const netEmissions   = summary?.netEmissions        || 0

  const treesEquiv   = ((netEmissions) / 21000).toFixed(4)
  const milesEquiv   = ((netEmissions) / 404).toFixed(4)
  const chargesEquiv = Math.round((netEmissions) / 8.3)

  // ── loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="db-root">
        <style>{STYLES}</style>
        <div className="db-loading">
          <div className="db-spinner" />
          <p style={{ color: '#414844', fontSize: '0.875rem' }}>Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="db-root">
      <style>{STYLES}</style>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="db-page-header">
        <div>
          <h1 className="db-headline">Overview</h1>
          <p className="db-subheadline">Your organisation's current environmental footprint.</p>
        </div>

        <div className="db-header-actions">
          {/* Live badge */}
          <span className="db-live-badge">
            <span className="db-live-dot" />
            Live
          </span>

          {/* Last updated */}
          {lastUpdated && (
            <span className="db-last-updated">
              Updated {formatTime(lastUpdated)}
            </span>
          )}

          <select
            className="db-period-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="year">Last year</option>
          </select>

          {/* Manual refresh */}
          <button
            className="db-btn-secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh now"
          >
            <span
              className={`material-symbols-outlined${refreshing ? ' spin-icon' : ''}`}
            >
              refresh
            </span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          <a href="/cloud" className="db-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', fontVariationSettings: "'FILL' 1" }}>
              cloud_done
            </span>
            Optimize with Cloud
          </a>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
      <div className="db-stats-grid">

        {/* Local Emissions */}
        <div className="db-stat-card">
          <div className="db-stat-card-header">
            <span className="db-stat-label">Local Emissions</span>
            <span className="db-stat-icon"><span className="material-symbols-outlined">factory</span></span>
          </div>
          <div className="db-stat-value">
            {localEmissions}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#414844' }}> gCO₂</span>
          </div>
          <div className="db-stat-trend trend-up">
            <span className="material-symbols-outlined">science</span>
            {sessionCount} session{sessionCount !== 1 ? 's' : ''} tracked
          </div>
        </div>

        {/* Energy Usage */}
        <div className="db-stat-card">
          <div className="db-stat-card-header">
            <span className="db-stat-label">Energy Usage</span>
            <span className="db-stat-icon"><span className="material-symbols-outlined">bolt</span></span>
          </div>
          <div className="db-stat-value">
            {energyUsage}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#414844' }}> kWh</span>
          </div>
          <div className="db-stat-trend trend-neutral">
            <span className="material-symbols-outlined">devices</span>
            Desktop tracking
          </div>
        </div>

        {/* Cloud Savings */}
        <div className="db-stat-card">
          <div className="db-stat-card-header">
            <span className="db-stat-label">Cloud Savings</span>
            <span className="db-stat-icon"><span className="material-symbols-outlined">cloud</span></span>
          </div>
          <div className="db-stat-value primary">
            {cloudSavings}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#414844' }}> gCO₂</span>
          </div>
          <div className="db-stat-trend trend-down">
            <span className="material-symbols-outlined">trending_up</span>
            Via region optimization
          </div>
        </div>

        {/* Net Emissions */}
        <div className="db-stat-card">
          <div className="db-stat-card-header">
            <span className="db-stat-label">Net Emissions</span>
            <span className="db-stat-icon"><span className="material-symbols-outlined">eco</span></span>
          </div>
          <div className="db-stat-value">
            {netEmissions}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#414844' }}> gCO₂</span>
          </div>
          <div className="db-leaf-track">
            <div
              className="db-leaf-fill"
              style={{ width: localEmissions > 0 ? `${Math.min(100, (cloudSavings / localEmissions) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* ── Recent Tracking Sessions ─────────────────────────────────────────── */}
      <div className="db-sessions-wrap">
        <div className="db-sessions-header">
          <h2 className="db-sessions-title">
            Recent Tracking Sessions
            <span className="db-sessions-count">{recentSessions.length}</span>
          </h2>
          <span className="db-live-badge" style={{ fontSize: '0.625rem' }}>
            <span className="db-live-dot" />
            Auto-refreshes every 30s
          </span>
        </div>

        <table className="db-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Time</th>
              <th className="right">Duration</th>
              <th className="right">Emissions (gCO₂)</th>
              <th className="right">Energy (kWh)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.length > 0 ? recentSessions.map((em) => {
              const isNew = newSessionIds.has(em._id)
              return (
                <tr
                  key={em._id}
                  style={isNew ? {
                    background: '#f0fdf4',
                    transition: 'background 4s ease',
                  } : {}}
                >
                  {/* Session */}
                  <td>
                    <div className="db-td-session">
                      <span className="db-td-session-id">
                        #{em.sessionId?.slice(-8) || em._id?.slice(-8)}
                      </span>
                      <span className="db-td-session-device">{em.deviceId}</span>
                    </div>
                  </td>

                  {/* Time */}
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                    {formatDate(em.timestamp)}
                  </td>

                  {/* Duration */}
                  <td className="right">
                    <span className="db-td-num blue">
                      {formatDuration(em.durationSeconds)}
                    </span>
                  </td>

                  {/* Emissions */}
                  <td className="right">
                    <span className="db-td-num co2">
                      {Number(em.emissionsGCO2).toFixed(4)}
                    </span>
                  </td>

                  {/* Energy */}
                  <td className="right">
                    <span className="db-td-num green">
                      {Number(em.energyKWh).toFixed(6)}
                    </span>
                  </td>

                  {/* Source */}
                  <td>
                    <span className={`db-source-badge source-${em.metadata?.source || 'estimated'}`}>
                      {em.metadata?.source === 'codecarbon' ? '⚡ CodeCarbon' : '~ Estimated'}
                    </span>
                  </td>
                </tr>
              )
            }) : (
              <tr className="db-empty-row">
                <td colSpan={6}>
                  <div className="db-empty-icon-wrap">
                    <span className="material-symbols-outlined">sensors</span>
                    <span>No sessions yet — start the Python tracker to begin recording.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Environmental Impact ─────────────────────────────────────────────── */}
      <h2 className="db-section-title">Environmental Impact</h2>
      <div className="db-impact-wrap">
        <div className="db-impact-bg" />
        <div className="db-impact-grid">
          <div className="db-impact-card">
            <div className="db-impact-icon-wrap" style={{ background: '#c1ecd4' }}>
              <span className="material-symbols-outlined" style={{ color: '#002114' }}>forest</span>
            </div>
            <div className="db-impact-num">{treesEquiv} Trees</div>
            <div className="db-impact-desc">Equivalent carbon absorbed annually.</div>
          </div>
          <div className="db-impact-card">
            <div className="db-impact-icon-wrap" style={{ background: '#aeeecb' }}>
              <span className="material-symbols-outlined" style={{ color: '#002114' }}>directions_car</span>
            </div>
            <div className="db-impact-num">{milesEquiv} Miles</div>
            <div className="db-impact-desc">Driven by an average passenger vehicle.</div>
          </div>
          <div className="db-impact-card">
            <div className="db-impact-icon-wrap" style={{ background: '#e1e3e2' }}>
              <span className="material-symbols-outlined" style={{ color: '#414844' }}>battery_charging_full</span>
            </div>
            <div className="db-impact-num">{chargesEquiv}k Charges</div>
            <div className="db-impact-desc">Smartphones charged to 100%.</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <h2 className="db-section-title">Quick Actions</h2>
      <div className="db-actions-grid">
        <a href="/cloud" className="db-action-card">
          <div className="db-action-icon" style={{ background: '#c1ecd4' }}>
            <span className="material-symbols-outlined" style={{ color: '#002114' }}>cloud_done</span>
          </div>
          <div>
            <span className="db-action-label">Optimize with Cloud</span>
            <span className="db-action-sub">Reduce emissions via AWS</span>
          </div>
          <span className="material-symbols-outlined db-action-arrow">arrow_forward</span>
        </a>
        <a href="/reports" className="db-action-card">
          <div className="db-action-icon" style={{ background: '#f3f4f3' }}>
            <span className="material-symbols-outlined" style={{ color: '#414844' }}>summarize</span>
          </div>
          <div>
            <span className="db-action-label">View Reports</span>
            <span className="db-action-sub">Summary &amp; detailed breakdown</span>
          </div>
          <span className="material-symbols-outlined db-action-arrow">arrow_forward</span>
        </a>
        <a href="/reports/insights" className="db-action-card">
          <div className="db-action-icon" style={{ background: '#f3f4f3' }}>
            <span className="material-symbols-outlined" style={{ color: '#414844' }}>auto_awesome</span>
          </div>
          <div>
            <span className="db-action-label">Get Insights</span>
            <span className="db-action-sub">AI-powered recommendations</span>
          </div>
          <span className="material-symbols-outlined db-action-arrow">arrow_forward</span>
        </a>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(193,200,194,0.15)',
        paddingTop: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(1,45,29,0.5)', margin: 0 }}>
          © 2026 Carbon Track. Towards a permanent digital forest.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Documentation', 'Support', 'API Status', 'Privacy Policy'].map(l => (
            <a key={l} href="#" style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(25,28,28,0.4)',
              textDecoration: 'none',
            }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default Dashboard