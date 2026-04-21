import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  .rs-root {
    font-family: 'Inter', sans-serif;
    background: #f9f9f8;
    min-height: 100vh;
    color: #191c1c;
    padding: 2.5rem 2rem 4rem;
  }

  @media (min-width: 1024px) { .rs-root { padding: 3rem 3.5rem 4rem; } }

  .rs-page-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 768px) {
    .rs-page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .rs-eyebrow {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #717973;
    margin: 0 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .rs-eyebrow .material-symbols-outlined {
    font-size: 0.875rem;
    font-variation-settings: 'FILL' 1, 'wght' 500;
    color: #7ffd8b;
    background: #012d1d;
    border-radius: 9999px;
    padding: 0.125rem;
  }

  .rs-headline {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    color: #012d1d;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.5rem;
  }

  .rs-sub {
    font-size: 1rem;
    color: #414844;
    margin: 0;
    max-width: 48ch;
    line-height: 1.5;
  }

  .rs-header-right {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    flex-shrink: 0;
  }

  .rs-period-select {
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

  .rs-export-btn {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #012d1d, #1b4332);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: opacity 0.2s ease;
  }

  .rs-export-btn:hover { opacity: 0.88; }
  .rs-export-btn .material-symbols-outlined { font-size: 0.9rem; font-variation-settings: 'FILL' 0, 'wght' 300; }

  /* Stats row */
  .rs-stats-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 640px) { .rs-stats-row { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .rs-stats-row { grid-template-columns: repeat(4, 1fr); } }

  .rs-stat {
    background: white;
    border-radius: 0.75rem;
    padding: 1.375rem 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .rs-stat:hover { box-shadow: 0 40px 40px rgba(25,28,28,0.05); }

  .rs-stat.highlight {
    background: linear-gradient(135deg, #012d1d, #1b4332);
    color: white;
  }

  .rs-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #414844;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .rs-stat.highlight .rs-stat-label { color: rgba(255,255,255,0.65); }

  .rs-stat-label .material-symbols-outlined {
    font-size: 1.125rem;
    color: #c1c8c2;
    font-variation-settings: 'FILL' 0, 'wght' 300;
  }

  .rs-stat.highlight .rs-stat-label .material-symbols-outlined { color: rgba(255,255,255,0.4); }

  .rs-stat-value {
    font-family: 'Manrope', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 0.5rem;
    color: #191c1c;
  }

  .rs-stat.highlight .rs-stat-value { color: white; }

  .rs-stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.1875rem 0.5rem;
    border-radius: 9999px;
  }

  .rs-stat-badge .material-symbols-outlined { font-size: 0.75rem; font-variation-settings: 'FILL' 0, 'wght' 400; }
  .badge-red { background: #ffdad6; color: #93000a; }
  .badge-green { background: #aeeecb; color: #002114; }
  .rs-stat.highlight .badge-green { background: rgba(127,253,139,0.25); color: #7ffd8b; }

  /* Leaf bar */
  .rs-leaf-track { background: #e7e8e7; border-radius: 9999px; height: 4px; margin-top: 0.75rem; }
  .rs-leaf-fill { background: linear-gradient(90deg, #2c694e, #61df72); height: 4px; border-radius: 9999px; }

  /* Two-col */
  .rs-two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) { .rs-two-col { grid-template-columns: 1fr 1fr; } }

  .rs-panel {
    background: white;
    border-radius: 0.875rem;
    padding: 1.75rem;
  }

  .rs-panel-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
  }

  .rs-detail-row {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid #f3f4f3;
  }

  .rs-detail-row:last-child { border-bottom: none; padding-bottom: 0; }
  .rs-detail-row:first-child { padding-top: 0; }

  .rs-detail-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    background: #f3f4f3;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rs-detail-icon .material-symbols-outlined {
    font-size: 1rem;
    color: #414844;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .rs-detail-label {
    flex: 1;
    font-size: 0.875rem;
    color: #414844;
  }

  .rs-detail-val {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
  }

  /* Period summary card */
  .rs-summary-card {
    background: #f3f4f3;
    border-radius: 0.875rem;
    padding: 2rem;
    margin-bottom: 1.5rem;
  }

  .rs-summary-card-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    margin: 0 0 1rem;
  }

  .rs-summary-body {
    font-size: 0.9375rem;
    color: #414844;
    line-height: 1.75;
  }

  .rs-summary-body strong { color: #191c1c; font-weight: 600; }
  .rs-summary-highlight { color: #012d1d; font-weight: 700; }

  /* Spinner */
  .rs-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    gap: 1rem;
  }

  .rs-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e7e8e7;
    border-top-color: #012d1d;
    border-radius: 50%;
    animation: rs-spin 0.8s linear infinite;
  }

  @keyframes rs-spin { to { transform: rotate(360deg); } }
`

const ReportSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')

  useEffect(() => { fetchSummary() }, [period])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const r = await reportsAPI.getSummary(period)
      setSummary(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const local = summary?.local || {}
  const cloud = summary?.cloud || {}
  const net = summary?.netEmissions || 0
  const reductionPct = local.totalEmissions > 0 ? ((cloud.totalSavings / local.totalEmissions) * 100).toFixed(1) : 0

  if (loading) return (
    <div className="rs-root"><style>{STYLES}</style>
      <div className="rs-loading"><div className="rs-spinner" /><p style={{ color: '#414844', fontSize: '0.875rem' }}>Loading report…</p></div>
    </div>
  )

  return (
    <div className="rs-root">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="rs-page-header">
        <div>
          <div className="rs-eyebrow">
            <span className="material-symbols-outlined">eco</span>
            Report Summary
          </div>
          <h1 className="rs-headline">Infrastructure Overview</h1>
          <p className="rs-sub">On-premise emissions vs. estimated cloud efficiencies for the selected period.</p>
        </div>
        <div className="rs-header-right">
          <select className="rs-period-select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="year">Last year</option>
          </select>
          <button className="rs-export-btn">
            <span className="material-symbols-outlined">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="rs-stats-row">
        <div className="rs-stat">
          <div className="rs-stat-label">Local Emissions <span className="material-symbols-outlined">factory</span></div>
          <div className="rs-stat-value">{local.totalEmissions || 0}</div>
          <span className="rs-stat-badge badge-red" style={{ fontSize: '0.6875rem' }}>
            <span className="material-symbols-outlined">trending_up</span>
            gCO₂
          </span>
          <div className="rs-leaf-track"><div className="rs-leaf-fill" style={{ width: '80%', background: 'linear-gradient(90deg, #ba1a1a, #ffdad6)' }} /></div>
        </div>

        <div className="rs-stat">
          <div className="rs-stat-label">Cloud Savings <span className="material-symbols-outlined">cloud_done</span></div>
          <div className="rs-stat-value">{cloud.totalSavings || 0}</div>
          <span className="rs-stat-badge badge-green">
            <span className="material-symbols-outlined">trending_down</span>
            gCO₂ saved
          </span>
          <div className="rs-leaf-track"><div className="rs-leaf-fill" style={{ width: '45%' }} /></div>
        </div>

        <div className="rs-stat highlight">
          <div className="rs-stat-label">Net Emissions <span className="material-symbols-outlined">eco</span></div>
          <div className="rs-stat-value">{net}</div>
          <span className="rs-stat-badge badge-green">
            <span className="material-symbols-outlined">trending_down</span>
            −{reductionPct}% reduction
          </span>
        </div>

        <div className="rs-stat">
          <div className="rs-stat-label">Cloud Cost <span className="material-symbols-outlined">payments</span></div>
          <div className="rs-stat-value">${cloud.totalCost || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#717973' }}>Est. annual</span>
        </div>
      </div>

      {/* Two-col breakdown */}
      <div className="rs-two-col">
        <div className="rs-panel">
          <h3 className="rs-panel-title">On-Premise Profile</h3>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">memory</span></div>
            <span className="rs-detail-label">Total Sessions</span>
            <span className="rs-detail-val">{local.sessionCount || 0}</span>
          </div>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">bolt</span></div>
            <span className="rs-detail-label">Total Energy</span>
            <span className="rs-detail-val">{local.totalEnergy || 0} kWh</span>
          </div>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">avg_pace</span></div>
            <span className="rs-detail-label">Avg per Session</span>
            <span className="rs-detail-val">{local.sessionCount > 0 ? (local.totalEmissions / local.sessionCount).toFixed(2) : 0} g</span>
          </div>
        </div>

        <div className="rs-panel">
          <h3 className="rs-panel-title">Cloud Target Profile</h3>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">hub</span></div>
            <span className="rs-detail-label">Total Workloads</span>
            <span className="rs-detail-val">{cloud.workloadCount || 0}</span>
          </div>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">savings</span></div>
            <span className="rs-detail-label">Total Savings</span>
            <span className="rs-detail-val" style={{ color: '#012d1d' }}>{cloud.totalSavings || 0} g</span>
          </div>
          <div className="rs-detail-row">
            <div className="rs-detail-icon"><span className="material-symbols-outlined">calculate</span></div>
            <span className="rs-detail-label">Avg Savings / Workload</span>
            <span className="rs-detail-val">{cloud.workloadCount > 0 ? (cloud.totalSavings / cloud.workloadCount).toFixed(2) : 0} g</span>
          </div>
        </div>
      </div>

      {/* Period summary */}
      <div className="rs-summary-card">
        <h3 className="rs-summary-card-title">Period Summary</h3>
        <div className="rs-summary-body">
          During the selected <strong>{period}</strong> period, you tracked <strong>{local.sessionCount || 0}</strong> sessions
          producing <span className="rs-summary-highlight">{local.totalEmissions || 0} gCO₂</span> total.
          Running <strong>{cloud.workloadCount || 0}</strong> cloud workloads saved <span className="rs-summary-highlight">{cloud.totalSavings || 0} gCO₂</span>,
          bringing net emissions to <span className="rs-summary-highlight">{net} gCO₂</span>
          {reductionPct > 0 ? ` — a ${reductionPct}% reduction through cloud optimization.` : '.'}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(193,200,194,0.15)', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(1,45,29,0.5)', margin: 0 }}>© 2024 Earthbound Editorial. Towards a permanent digital forest.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Documentation', 'Support', 'API Status', 'Privacy Policy'].map(l => (
            <a key={l} href="#" style={{ fontSize: '0.6875rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(25,28,28,0.4)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default ReportSummary