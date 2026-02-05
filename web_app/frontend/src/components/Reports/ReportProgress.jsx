import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const ReportProgress = () => {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const response = await reportsAPI.getProgress()
      setProgress(response.data.progress || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#999' }}>Loading progress...</p>
      </div>
    )
  }

  // Calculate totals
  const totalEmissions = progress.reduce((sum, day) => sum + day.emissions, 0)
  const totalSavings = progress.reduce((sum, day) => sum + day.savings, 0)
  const totalNet = progress.reduce((sum, day) => sum + day.net, 0)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: '2rem',
        background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '2rem'
      }}>
        🎯 Progress Tracking
      </h1>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Total Emissions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
            {totalEmissions.toFixed(2)} g
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Total Savings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
            {totalSavings.toFixed(2)} g
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Net Emissions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
            {totalNet.toFixed(2)} g
          </div>
        </div>

        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
            Reduction
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
            {totalEmissions > 0 ? ((totalSavings / totalEmissions) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Daily Progress */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          📅 Daily Progress (Last 30 Days)
        </h2>

        {progress.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #404040' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#999' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#999' }}>Emissions</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#999' }}>Savings</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#999' }}>Net</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((day, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #333',
                      transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>
                      {day.emissions.toFixed(2)} g
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#4CAF50', fontWeight: '600' }}>
                      {day.savings.toFixed(2)} g
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#2196F3', fontWeight: '600' }}>
                      {day.net.toFixed(2)} g
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {day.sessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ fontSize: '1.25rem' }}>
              No data available yet. Start tracking to see your progress!
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          💪 Keep Going!
        </h2>

        <div style={{
          background: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          lineHeight: '1.8',
          fontSize: '1.1rem'
        }}>
          <p style={{ marginBottom: '1rem' }}>
            Every gram of CO₂ saved makes a difference! Here's how you're contributing:
          </p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>
              Your total savings of <strong style={{ color: '#4CAF50' }}>{totalSavings.toFixed(2)} gCO₂</strong> is equivalent to:
            </li>
            <li style={{ marginTop: '0.5rem' }}>
              🌳 <strong>{(totalSavings / 21000).toFixed(4)}</strong> trees worth of CO₂ absorption
            </li>
            <li style={{ marginTop: '0.5rem' }}>
              🚗 Avoiding <strong>{(totalSavings / 404).toFixed(2)}</strong> miles of car travel
            </li>
            <li style={{ marginTop: '0.5rem' }}>
              📱 <strong>{(totalSavings / 8.3).toFixed(0)}</strong> smartphone charges
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ReportProgress