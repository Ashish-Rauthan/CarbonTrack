import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  .ri-root {
    font-family: 'Inter', sans-serif;
    background: #f9f9f8;
    min-height: 100vh;
    color: #191c1c;
    padding: 2.5rem 2rem 4rem;
  }

  @media (min-width: 1024px) { .ri-root { padding: 3rem 3.5rem 4rem; } }

  .ri-eyebrow {
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

  .ri-eyebrow .material-symbols-outlined {
    font-size: 0.875rem;
    font-variation-settings: 'FILL' 1, 'wght' 500;
    color: #7ffd8b;
    background: #012d1d;
    border-radius: 9999px;
    padding: 0.125rem;
  }

  .ri-headline {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    color: #012d1d;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.5rem;
  }

  .ri-sub {
    font-size: 1rem;
    color: #414844;
    margin: 0 0 2.5rem;
    max-width: 52ch;
    line-height: 1.5;
  }

  /* Insights list */
  .ri-insight {
    background: white;
    border-radius: 0.875rem;
    padding: 1.75rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    transition: box-shadow 0.2s ease;
  }

  .ri-insight:hover { box-shadow: 0 40px 40px rgba(25,28,28,0.05); }

  .ri-insight-accent {
    width: 3px;
    border-radius: 2px;
    align-self: stretch;
    flex-shrink: 0;
    min-height: 3rem;
  }

  .ri-insight-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ri-insight-icon .material-symbols-outlined {
    font-size: 1.375rem;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .ri-insight-body { flex: 1; min-width: 0; }

  .ri-insight-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #191c1c;
    margin: 0 0 0.375rem;
    letter-spacing: -0.01em;
  }

  .ri-insight-value {
    font-family: 'Manrope', sans-serif;
    font-size: 1.875rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
    line-height: 1;
  }

  .ri-insight-desc {
    font-size: 0.875rem;
    color: #414844;
    line-height: 1.5;
    margin: 0;
  }

  /* Recommendations */
  .ri-reco-wrap {
    background: #f3f4f3;
    border-radius: 0.875rem;
    padding: 2rem;
    margin-top: 2rem;
  }

  .ri-reco-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: #191c1c;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
  }

  .ri-reco-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (min-width: 768px) { .ri-reco-grid { grid-template-columns: repeat(3, 1fr); } }

  .ri-reco-card {
    background: white;
    border-radius: 0.625rem;
    padding: 1.375rem;
    transition: box-shadow 0.2s ease;
  }

  .ri-reco-card:hover { box-shadow: 0 40px 40px rgba(25,28,28,0.05); }

  .ri-reco-card-icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    background: #c1ecd4;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.875rem;
  }

  .ri-reco-card-icon .material-symbols-outlined {
    font-size: 1.125rem;
    color: #002114;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  .ri-reco-card-title {
    font-family: 'Manrope', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    color: #191c1c;
    margin: 0 0 0.5rem;
  }

  .ri-reco-card-body {
    font-size: 0.8125rem;
    color: #414844;
    line-height: 1.55;
    margin: 0;
  }

  /* Empty */
  .ri-empty {
    background: white;
    border-radius: 0.875rem;
    padding: 4rem 2rem;
    text-align: center;
  }

  .ri-empty-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #f3f4f3;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
  }

  .ri-empty-icon .material-symbols-outlined {
    font-size: 1.75rem;
    color: #c1c8c2;
    font-variation-settings: 'FILL' 0, 'wght' 200;
  }

  .ri-empty-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: #414844;
    margin: 0 0 0.375rem;
  }

  .ri-empty-sub { font-size: 0.875rem; color: #717973; margin: 0; }

  /* Spinner */
  .ri-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    gap: 1rem;
  }

  .ri-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e7e8e7;
    border-top-color: #012d1d;
    border-radius: 50%;
    animation: ri-spin 0.8s linear infinite;
  }

  @keyframes ri-spin { to { transform: rotate(360deg); } }
`

const INSIGHT_CONFIG = {
  total:   { icon: 'public',           bg: '#f3f4f3', iconColor: '#414844', accentColor: '#717973', valueColor: '#191c1c' },
  savings: { icon: 'eco',              bg: '#c1ecd4', iconColor: '#002114', accentColor: '#7ffd8b', valueColor: '#012d1d' },
  average: { icon: 'show_chart',       bg: '#f3f4f3', iconColor: '#414844', accentColor: '#2c694e', valueColor: '#191c1c' },
  cloud:   { icon: 'cloud_done',       bg: '#aeeecb', iconColor: '#002114', accentColor: '#3cbd54', valueColor: '#012d1d' },
  default: { icon: 'lightbulb',        bg: '#f3f4f3', iconColor: '#414844', accentColor: '#717973', valueColor: '#191c1c' },
}

const ReportInsights = () => {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInsights() }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const r = await reportsAPI.getInsights()
      setInsights(r.data.insights || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="ri-root"><style>{STYLES}</style>
      <div className="ri-loading"><div className="ri-spinner" /><p style={{ color: '#414844', fontSize: '0.875rem' }}>Generating insights…</p></div>
    </div>
  )

  return (
    <div className="ri-root">
      <style>{STYLES}</style>

      <div className="ri-eyebrow">
        <span className="material-symbols-outlined">auto_awesome</span>
        AI Analysis Complete
      </div>
      <h1 className="ri-headline">Emissions Insights</h1>
      <p className="ri-sub">Our models have identified key drivers in your recent emissions activity based on the last 30 days of data.</p>

      {insights.length > 0 ? insights.map((insight, i) => {
        const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.default
        return (
          <div className="ri-insight" key={i}>
            <div className="ri-insight-accent" style={{ background: cfg.accentColor }} />
            <div className="ri-insight-icon" style={{ background: cfg.bg }}>
              <span className="material-symbols-outlined" style={{ color: cfg.iconColor }}>{cfg.icon}</span>
            </div>
            <div className="ri-insight-body">
              <h3 className="ri-insight-title">{insight.title}</h3>
              <div className="ri-insight-value" style={{ color: cfg.valueColor }}>{insight.value}</div>
              <p className="ri-insight-desc">{insight.description}</p>
            </div>
          </div>
        )
      }) : (
        <div className="ri-empty">
          <div className="ri-empty-icon"><span className="material-symbols-outlined">analytics</span></div>
          <div className="ri-empty-title">Not enough data yet</div>
          <p className="ri-empty-sub">Start tracking emissions and using cloud optimization to generate personalized insights.</p>
        </div>
      )}

      {/* Recommendations */}
      <div className="ri-reco-wrap">
        <h3 className="ri-reco-title">AI-Generated Interventions</h3>
        <div className="ri-reco-grid">
          <div className="ri-reco-card">
            <div className="ri-reco-card-icon"><span className="material-symbols-outlined">cloud_sync</span></div>
            <div className="ri-reco-card-title">Shift Compute Workloads</div>
            <p className="ri-reco-card-body">Moving non-critical batch processing to EU-North during off-peak hours could reduce associated emissions by up to 22%.</p>
          </div>
          <div className="ri-reco-card">
            <div className="ri-reco-card-icon"><span className="material-symbols-outlined">schedule</span></div>
            <div className="ri-reco-card-title">Track Consistently</div>
            <p className="ri-reco-card-body">Consistent daily tracking helps identify patterns and opportunities for reduction. Regular sessions improve model accuracy.</p>
          </div>
          <div className="ri-reco-card">
            <div className="ri-reco-card-icon"><span className="material-symbols-outlined">monitoring</span></div>
            <div className="ri-reco-card-title">Monitor Your Progress</div>
            <p className="ri-reco-card-body">Check the Progress report regularly to see how emissions change over time and measure against your Net Zero targets.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(193,200,194,0.15)', paddingTop: '2rem', marginTop: '3rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
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

export default ReportInsights