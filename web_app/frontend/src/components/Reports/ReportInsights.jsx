import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const ReportInsights = () => {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await reportsAPI.getInsights()
      setInsights(response.data.insights || [])
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'total': return '📊'
      case 'savings': return '💚'
      case 'average': return '📈'
      case 'cloud': return '☁️'
      default: return '💡'
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return '#4CAF50'
      case 'high': return '#f44336'
      case 'moderate': return '#ff9800'
      default: return '#2196F3'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#999' }}>Generating insights...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: '2rem',
        background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '2rem'
      }}>
        🧠 AI-Powered Insights
      </h1>

      <p style={{
        fontSize: '1.1rem',
        color: '#999',
        marginBottom: '2rem',
        lineHeight: '1.6'
      }}>
        Based on your last 30 days of activity, here are personalized insights to help you reduce your carbon footprint.
      </p>

      {insights.length > 0 ? (
        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {insights.map((insight, index) => (
            <div
              key={index}
              style={{
                background: '#2d2d2d',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #404040',
                borderLeft: `4px solid ${getTrendColor(insight.trend)}`
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '3rem' }}>
                  {getInsightIcon(insight.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.5rem',
                    color: '#e0e0e0'
                  }}>
                    {insight.title}
                  </h3>

                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: getTrendColor(insight.trend),
                    marginBottom: '0.75rem'
                  }}>
                    {insight.value}
                  </div>

                  <p style={{
                    fontSize: '1.1rem',
                    color: '#999',
                    lineHeight: '1.6'
                  }}>
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#2d2d2d',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid #404040',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Not Enough Data Yet
          </h3>
          <p style={{ color: '#999', fontSize: '1.1rem' }}>
            Start tracking your emissions and using cloud optimization to generate personalized insights.
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #404040',
        marginTop: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#4CAF50' }}>
          💡 Recommendations
        </h2>

        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Use Cloud Optimization</h4>
            <p style={{ color: '#999', lineHeight: '1.6' }}>
              Running workloads in AWS regions like Stockholm (8 gCO₂/kWh) can reduce emissions by up to 98% compared to high-carbon regions.
            </p>
          </div>

          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Track Regularly</h4>
            <p style={{ color: '#999', lineHeight: '1.6' }}>
              Consistent tracking helps identify patterns and opportunities for reduction. Try to track at least once a day.
            </p>
          </div>

          <div style={{
            background: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Monitor Your Progress</h4>
            <p style={{ color: '#999', lineHeight: '1.6' }}>
              Check the Progress report regularly to see how your emissions change over time and celebrate your wins!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportInsights