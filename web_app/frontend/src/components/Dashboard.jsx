import React, { useState, useEffect } from 'react'
import { emissionsAPI, reportsAPI } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsResponse, summaryResponse] = await Promise.all([
        emissionsAPI.getStats({ period }),
        reportsAPI.getSummary(period)
      ])
      setStats(statsResponse.data)
      setSummary(summaryResponse.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#999' }}>Loading dashboard...</p>
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
          📊 Dashboard
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Local Emissions */}
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          borderLeft: '4px solid #ff6b6b'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Local Emissions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '0.5rem' }}>
            {stats?.totalEmissions || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            CO₂ from {stats?.sessionCount || 0} sessions
          </div>
        </div>

        {/* Energy Usage */}
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          borderLeft: '4px solid #ffd93d'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Energy Usage
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffd93d', marginBottom: '0.5rem' }}>
            {stats?.totalEnergy || 0} kWh
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            Average: {stats?.sessionCount > 0 ? (stats.totalEnergy / stats.sessionCount).toFixed(4) : 0} kWh/session
          </div>
        </div>

        {/* Cloud Savings */}
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          borderLeft: '4px solid #4CAF50'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Cloud Savings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.5rem' }}>
            {summary?.cloud?.totalSavings || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            From {summary?.cloud?.workloadCount || 0} workloads
          </div>
        </div>

        {/* Net Emissions */}
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          borderLeft: '4px solid #2196F3'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Net Emissions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3', marginBottom: '0.5rem' }}>
            {summary?.netEmissions || 0} g
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            After cloud optimization
          </div>
        </div>
      </div>

      {/* Impact Visualization */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          🌱 Environmental Impact
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌳</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.5rem' }}>
              {((summary?.netEmissions || 0) / 21000).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#999' }}>
              Trees needed to offset
            </div>
          </div>

          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚗</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.5rem' }}>
              {((summary?.netEmissions || 0) / 404).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#999' }}>
              Miles driven equivalent
            </div>
          </div>

          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.5rem' }}>
              {((summary?.netEmissions || 0) / 8.3).toFixed(0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#999' }}>
              Phone charges equivalent
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          🚀 Quick Actions
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          
          <a href="/cloud"
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: '600',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ☁️ Optimize with Cloud
          </a>

          
          <a href="/reports"
            style={{
              background: 'linear-gradient(135deg, #2196F3 0%, #0b7dda 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: '600',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            📊 View Reports
          </a>

          
          <a href="/reports/insights"
            style={{
              background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              textAlign: 'center',
              fontWeight: '600',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            🧠 Get Insights
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard