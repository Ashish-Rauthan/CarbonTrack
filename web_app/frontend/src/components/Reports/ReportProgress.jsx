import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  .rp-root {
    font-family: 'Inter', sans-serif;
    background: #f9f9f8;
    min-height: 100vh;
    color: #191c1c;
    padding: 2.5rem 2rem 4rem;
  }

  @media (min-width: 1024px) { .rp-root { padding: 3rem 3.5rem 4rem; } }

  .rp-eyebrow {
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

  .rp-eyebrow .material-symbols-outlined {
    font-size: 0.875rem;
    font-variation-settings: 'FILL' 1, 'wght' 500;
    color: #7ffd8b;
    background: #012d1d;
    border-radius: 9999px;
    padding: 0.125rem;
  }

  .rp-page-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 768px) {
    .rp-page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .rp-headline {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    color: #012d1d;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.5rem;
  }

  .rp-sub {
    font-size: 1rem;
    color: #414844;
    margin: 0;
    max-width: 52ch;
    line-height: 1.5;
  }

  .rp-period-btns {
    display: flex;
    gap: 0.25rem;
    background: white;
    padding: 0.25rem;
    border-radius: 0.625rem;
    flex-shrink: 0;
  }

  .rp-period-btn {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.4375rem 0.875rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    color: #414844;
    background: transparent;
    transition: all 0.15s ease;
  }

  .rp-period-btn:hover { background: #f3f4f3; color: #191c1c; }
  .rp-period-btn.active { background: #012d1d; color: white; font-weight: 600; }

  /* Stats row */
  .rp-stats-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 1024px) { .rp-stats-row { grid-template-columns: repeat(4, 1fr); } }

  .rp-stat {
    background: white;
    border-radius: 0.75rem;
    padding: 1.375rem 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .rp-stat:hover { box-shadow: 0 40px 40px rgba(25,28,28,0.05); }

  .rp-stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #414844;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }

  .rp-stat-value {
    font-family: 'Manrope', sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 0.375rem;
  }

  .rp-stat-sub { font-size: 0.75rem; color: #717973; }

  /* Target bar card */
  .rp-target-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.375rem 1.5rem;
    grid-column: span 2;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (min-width: 1024px) { .rp-target-card { grid-column: span 2; } }

  .rp-target-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.8125rem;
  }

  .rp-target-label { font-weight: 500; color: #414844; }
  .rp-target-pct { font-family: 'Manrope', sans-serif; font-weight: 800; color: #012d1d; font-size: 1.25rem; }

  .rp-target-track {
    background: #e7e8e7;
    border-radius: 9999px;
    height: 8px;
  }

  .rp-target-fill {
    background: linear-gradient(90deg, #012d1d, #61df72);
    border-radius: 9999px;
    height: 8px;
    transition: width 0.6s ease;
  }

  .rp-target-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #717973;
  }

  /* Equivalents */
  .rp-equiv-wrap {
    background: #f3f4f3;
    border-radius: 0.875rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .rp-section-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
  }

  .rp-equiv-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .rp-equiv-cell {
    background: white;
    border-radius: 0.625rem;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  .rp-equiv-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: #c1ecd4;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rp-equiv-icon .material-symbols-outlined {
    font-size: 1.125rem;
    color: #002114;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .rp-equiv-num {
    font-family: 'Manrope', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    color: #191c1c;
    letter-spacing: -0.01em;
  }

  .rp-equiv-label { font-size: 0.75rem; color: #717973; line-height: 1.3; margin-top: 0.125rem; }

  /* Data table */
  .rp-table-wrap {
    background: white;
    border-radius: 0.875rem;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .rp-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.75rem 1.25rem;
    border-bottom: 1px solid #f3f4f3;
  }

  .rp-table-header-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .rp-view-all {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #012d1d;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .rp-view-all .material-symbols-outlined { font-size: 0.875rem; font-variation-settings: 'FILL' 0, 'wght' 400; }

  .rp-table {
    width: 100%;
    border-collapse: collapse;
  }

  .rp-table thead th {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #717973;
    padding: 0.75rem 1.75rem;
    text-align: left;
    background: #fafafa;
  }

  .rp-table thead th:not(:first-child) { text-align: right; }

  .rp-table tbody tr {
    border-top: 1px solid #f3f4f3;
    transition: background 0.15s ease;
  }

  .rp-table tbody tr:hover { background: #fafafa; }

  .rp-table tbody td {
    padding: 1rem 1.75rem;
    font-size: 0.875rem;
    color: #414844;
    vertical-align: middle;
  }

  .rp-table tbody td:not(:first-child) { text-align: right; }

  .rp-table-date { font-weight: 500; color: #191c1c; }

  .rp-table-num {
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    font-size: 0.9375rem;
  }

  .col-emissions { color: #ba1a1a; }
  .col-savings { color: #012d1d; }
  .col-net { color: #2c694e; }

  .rp-empty-row td {
    text-align: center !important;
    padding: 3rem !important;
    color: #717973;
    font-size: 0.9375rem;
  }

  /* Spinner */
  .rp-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    gap: 1rem;
  }

  .rp-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e7e8e7;
    border-top-color: #012d1d;
    border-radius: 50%;
    animation: rp-spin 0.8s linear infinite;
  }

  @keyframes rp-spin { to { transform: rotate(360deg); } }
`

const ReportProgress = () => {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProgress() }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const r = await reportsAPI.getProgress()
      setProgress(r.data.progress || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const totalEmissions = progress.reduce((s, d) => s + d.emissions, 0)
  const totalSavings = progress.reduce((s, d) => s + d.savings, 0)
  const totalNet = progress.reduce((s, d) => s + d.net, 0)
  const reductionPct = totalEmissions > 0 ? ((totalSavings / totalEmissions) * 100).toFixed(1) : 0

  const treesEquiv = (totalSavings / 21000).toFixed(2)
  const milesEquiv = (totalSavings / 404).toFixed(2)
  const chargesEquiv = (totalSavings / 8.3).toFixed(0)

  // Q3 style target (example)
  const targetKg = 6300
  const remainingKg = Math.max(0, targetKg - totalNet).toFixed(0)
  const targetPct = Math.min(100, (totalNet / targetKg) * 100).toFixed(0)

  if (loading) return (
    <div className="rp-root"><style>{STYLES}</style>
      <div className="rp-loading"><div className="rp-spinner" /><p style={{ color: '#414844', fontSize: '0.875rem' }}>Loading progress…</p></div>
    </div>
  )

  return (
    <div className="rp-root">
      <style>{STYLES}</style>

      <div className="rp-page-header">
        <div>
          <div className="rp-eyebrow">
            <span className="material-symbols-outlined">show_chart</span>
            Impact Report
          </div>
          <h1 className="rp-headline">Emissions Progress</h1>
          <p className="rp-sub">Tracking overall reductions against target baselines over the last 30 days.</p>
        </div>
        <div className="rp-period-btns">
          {['30 Days', 'YTD', 'All Time'].map((l, i) => (
            <button key={l} className={`rp-period-btn ${i === 0 ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="rp-stats-row">
        <div className="rp-stat">
          <div className="rp-stat-label">Total CO₂e Reduced</div>
          <div className="rp-stat-value" style={{ color: '#012d1d' }}>{totalSavings.toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#717973' }}>g</span></div>
          <div className="rp-stat-sub" style={{ color: '#3cbd54', fontWeight: 500 }}>↓ {reductionPct}%</div>
        </div>

        <div className="rp-stat">
          <div className="rp-stat-label">Total Emissions</div>
          <div className="rp-stat-value" style={{ color: '#ba1a1a' }}>{totalEmissions.toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#717973' }}>g</span></div>
          <div className="rp-stat-sub">vs. previous 30 days</div>
        </div>

        <div className="rp-target-card" style={{ background: 'white', borderRadius: '0.75rem', padding: '1.375rem 1.5rem' }}>
          <div className="rp-target-header">
            <span className="rp-target-label">Q3 Reduction Target</span>
            <span className="rp-target-pct">{targetPct}%</span>
          </div>
          <div className="rp-target-track">
            <div className="rp-target-fill" style={{ width: `${targetPct}%` }} />
          </div>
          <div className="rp-target-meta">
            <span>Target: {targetKg} g</span>
            <span>Remaining: {remainingKg} g</span>
          </div>
        </div>
      </div>

      {/* Environmental Equivalents */}
      <div className="rp-equiv-wrap">
        <h3 className="rp-section-title">Environmental Equivalents</h3>
        <div className="rp-equiv-row">
          <div className="rp-equiv-cell">
            <div className="rp-equiv-icon"><span className="material-symbols-outlined">forest</span></div>
            <div>
              <div className="rp-equiv-num">{treesEquiv}</div>
              <div className="rp-equiv-label">Tree seedlings grown for 10 years</div>
            </div>
          </div>
          <div className="rp-equiv-cell">
            <div className="rp-equiv-icon"><span className="material-symbols-outlined">directions_car</span></div>
            <div>
              <div className="rp-equiv-num">{milesEquiv}</div>
              <div className="rp-equiv-label">Miles driven by gas-powered car</div>
            </div>
          </div>
          <div className="rp-equiv-cell">
            <div className="rp-equiv-icon" style={{ background: '#e1e3e2' }}><span className="material-symbols-outlined" style={{ color: '#414844' }}>battery_charging_full</span></div>
            <div>
              <div className="rp-equiv-num">{chargesEquiv}k</div>
              <div className="rp-equiv-label">Smartphones charged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Reductions Table */}
      <div className="rp-table-wrap">
        <div className="rp-table-header">
          <h3 className="rp-table-header-title">Daily Reductions List (Last 30 Days)</h3>
          <a href="#" className="rp-view-all">
            View Full Log
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
        <table className="rp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Emissions</th>
              <th>Savings</th>
              <th>Net</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {progress.length > 0 ? progress.map((day, i) => (
              <tr key={i}>
                <td className="rp-table-date">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="rp-table-num col-emissions">{day.emissions.toFixed(2)} g</td>
                <td className="rp-table-num col-savings">{day.savings.toFixed(2)} g</td>
                <td className="rp-table-num col-net">{day.net.toFixed(2)} g</td>
                <td style={{ color: '#717973', fontWeight: 500 }}>{day.sessions}</td>
              </tr>
            )) : (
              <tr className="rp-empty-row">
                <td colSpan={5}>No data yet. Start tracking to see your progress!</td>
              </tr>
            )}
          </tbody>
        </table>
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

export default ReportProgress