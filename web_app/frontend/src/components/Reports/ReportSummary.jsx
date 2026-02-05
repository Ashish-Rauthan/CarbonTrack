import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const ReportSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    fetchSummary()
  }, [period])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const response = await reportsAPI.getSummary(period)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#999' }}>Loading report...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          📊 Summary Report
        </h1>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: '#2d2d2d',
            color: '#e0e0e0',
            border: '1px solid #404040',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040'
        }}>
          <h3 style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Local Emissions
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '0.5rem' }}>
            {summary?.local?.totalEmissions || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {summary?.local?.sessionCount || 0} tracking sessions
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040'
        }}>
          <h3 style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Cloud Savings
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.5rem' }}>
            {summary?.cloud?.totalSavings || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {summary?.cloud?.workloadCount || 0} cloud workloads
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040'
        }}>
          <h3 style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Net Emissions
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3', marginBottom: '0.5rem' }}>
            {summary?.netEmissions || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            After optimization
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040'
        }}>
          <h3 style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Cloud Cost
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffd93d', marginBottom: '0.5rem' }}>
            ${summary?.cloud?.totalCost || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            Total cloud spend
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          Detailed Breakdown
        </h2>

        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {/* Local Activity */}
          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>
              📊 Local Activity
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Total Sessions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.local?.sessionCount || 0}
                </div>
              </div>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Total Energy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.local?.totalEnergy || 0} kWh
                </div>
              </div>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Avg per Session</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.local?.sessionCount > 0
                    ? (summary.local.totalEmissions / summary.local.sessionCount).toFixed(2)
                    : 0} g
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Activity */}
          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#4CAF50', marginBottom: '1rem' }}>
              ☁️ Cloud Activity
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Total Workloads</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.cloud?.workloadCount || 0}
                </div>
              </div>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Total Savings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.cloud?.totalSavings || 0} g
                </div>
              </div>
              <div>
                <div style={{ color: '#999', fontSize: '0.875rem' }}>Avg Savings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary?.cloud?.workloadCount > 0
                    ? (summary.cloud.totalSavings / summary.cloud.workloadCount).toFixed(2)
                    : 0} g
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          Period Summary
        </h2>

        <div style={{
          background: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          fontSize: '1.1rem',
          lineHeight: '1.8'
        }}>
          <p>
            During the selected period (<strong>{period}</strong>), you:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
            <li>
              Tracked <strong>{summary?.local?.sessionCount || 0}</strong> sessions
              with total emissions of <strong style={{ color: '#ff6b6b' }}>
                {summary?.local?.totalEmissions || 0} gCO₂
              </strong>
            </li>
            <li style={{ marginTop: '0.5rem' }}>
              Ran <strong>{summary?.cloud?.workloadCount || 0}</strong> cloud workloads
              saving <strong style={{ color: '#4CAF50' }}>
                {summary?.cloud?.totalSavings || 0} gCO₂
              </strong>
            </li>
            <li style={{ marginTop: '0.5rem' }}>
              Net emissions: <strong style={{ color: '#2196F3' }}>
                {summary?.netEmissions || 0} gCO₂
              </strong>
            </li>
            {(summary?.cloud?.totalSavings || 0) > 0 && (
              <li style={{ marginTop: '0.5rem' }}>
                Reduction: <strong style={{ color: '#4CAF50' }}>
                  {((summary.cloud.totalSavings / (summary.local.totalEmissions || 1)) * 100).toFixed(1)}%
                </strong> through cloud optimization
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ReportSummary