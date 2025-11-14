// web_app/frontend/src/components/Reports/ReportInsights.jsx

import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'

const ReportInsights = () => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getInsights()
      setInsights(response.data)
    } catch (error) {
      console.error('Error fetching insights:', error)
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{textAlign: 'center', color: '#999'}}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Analyzing your data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#2d2d2d',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #f44336',
        color: '#f44336',
        textAlign: 'center'
      }}>
        {error}
      </div>
    )
  }

  if (!insights) return null

  const getInsightIcon = (type) => {
    switch(type) {
      case 'usage_pattern': return '⏰';
      case 'anomaly': return '⚠️';
      case 'trend': return '📊';
      case 'achievement': return '🏆';
      default: return '💡';
    }
  }

  const getInsightColor = (type) => {
    switch(type) {
      case 'usage_pattern': return '#2196F3';
      case 'anomaly': return '#ff9800';
      case 'trend': return '#4CAF50';
      case 'achievement': return '#ffd93d';
      default: return '#999';
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh',
      padding: '2rem 0',
      color: '#e0e0e0'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
        {/* Header */}
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{
            fontSize: '2rem',
            background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            🧠 AI-Powered Insights
          </h1>
          <p style={{color: '#999', fontSize: '0.95rem'}}>
            Personalized recommendations based on your usage patterns
          </p>
        </div>

        {/* Stats Overview */}
        {insights.stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #404040',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📊</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50'}}>
                {insights.stats.totalSessions}
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Total Sessions</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #404040',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>💨</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b6b'}}>
                {insights.stats.avgEmission.toFixed(4)} kg
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Avg per Session</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #404040',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⏰</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2196F3'}}>
                {insights.stats.peakHour}:00
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Peak Usage Hour</p>
            </div>
          </div>
        )}

        {/* Insights Cards */}
        {insights.insights && insights.insights.length > 0 && (
          <div style={{marginBottom: '2rem'}}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#e0e0e0',
              marginBottom: '1rem'
            }}>
              📈 Key Insights
            </h2>
            
            <div style={{display: 'grid', gap: '1rem'}}>
              {insights.insights.map((insight, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: `1px solid ${getInsightColor(insight.type)}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{
                      fontSize: '2.5rem',
                      flexShrink: 0
                    }}>
                      {insight.icon || getInsightIcon(insight.type)}
                    </div>
                    
                    <div style={{flex: 1}}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        color: getInsightColor(insight.type),
                        marginBottom: '0.5rem'
                      }}>
                        {insight.title}
                      </h3>
                      <p style={{
                        color: '#e0e0e0',
                        lineHeight: '1.6',
                        margin: 0
                      }}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #4CAF50'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#4CAF50',
              marginBottom: '1.5rem'
            }}>
              ✨ Personalized Recommendations
            </h2>
            
            <div style={{display: 'grid', gap: '1rem'}}>
              {insights.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  style={{
                    background: '#252525',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    animation: `fadeIn 0.6s ease-out ${(insights.insights.length + index) * 0.1}s both`
                  }}
                >
                  <span style={{
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    {index === 0 ? '🎯' : index === 1 ? '💡' : index === 2 ? '🔋' : '⚡'}
                  </span>
                  <p style={{
                    color: '#e0e0e0',
                    margin: 0,
                    flex: 1
                  }}>
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {(!insights.insights || insights.insights.length === 0) && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🔍</div>
            <h2 style={{color: '#999', marginBottom: '1rem'}}>
              Not Enough Data Yet
            </h2>
            <p style={{color: '#666'}}>
              Continue tracking your emissions to get personalized insights and recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportInsights