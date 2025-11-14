// web_app/frontend/src/components/Reports/ReportProgress.jsx

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { reportsAPI } from '../../services/api'

const ReportProgress = () => {
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getProgress()
      setProgressData(response.data)
    } catch (error) {
      console.error('Error fetching progress:', error)
      setError('Failed to load progress data')
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
          Loading progress...
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

  if (!progressData) return null

  const { progress, achievements, summary } = progressData

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAchievementColor = (id) => {
    if (id.includes('first')) return '#4CAF50';
    if (id.includes('low')) return '#8BC34A';
    if (id.includes('half')) return '#ffd93d';
    return '#2196F3';
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
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
            🎯 Your Progress
          </h1>
          <p style={{color: '#999', fontSize: '0.95rem'}}>
            Track your journey towards a greener footprint
          </p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
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
                {summary.totalSessions}
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
                {summary.totalEmissionsKg} kg
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Total CO₂</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #404040',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📅</div>
              <p style={{fontSize: '1rem', fontWeight: 'bold', color: '#2196F3'}}>
                {formatDate(summary.firstSession)}
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Member Since</p>
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #ffd93d',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#ffd93d',
              marginBottom: '1.5rem'
            }}>
              🏆 Achievements Unlocked
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {achievements.map((achievement, index) => (
                <div 
                  key={achievement.id}
                  style={{
                    background: '#252525',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: `2px solid ${getAchievementColor(achievement.id)}`,
                    textAlign: 'center',
                    animation: `fadeIn 0.6s ease-out ${index * 0.1}s both, pulse 2s ease-in-out infinite ${index * 0.2}s`
                  }}
                >
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '0.5rem'
                  }}>
                    {achievement.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    color: getAchievementColor(achievement.id),
                    marginBottom: '0.5rem'
                  }}>
                    {achievement.title}
                  </h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#999',
                    marginBottom: '0.5rem'
                  }}>
                    {achievement.description}
                  </p>
                  {achievement.unlockedAt && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#666'
                    }}>
                      Unlocked: {formatDate(achievement.unlockedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Chart */}
        {progress && progress.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #404040',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#e0e0e0',
              marginBottom: '1.5rem'
            }}>
              📈 Monthly Progress
            </h2>
            
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis 
                  dataKey="month" 
                  stroke="#999"
                />
                <YAxis yAxisId="left" stroke="#ff6b6b" />
                <YAxis yAxisId="right" orientation="right" stroke="#ffd93d" />
                <Tooltip 
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#e0e0e0'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="#ff6b6b" 
                  name="Emissions (g)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#ffd93d" 
                  name="Energy (kWh)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#2196F3" 
                  name="Sessions"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Monthly breakdown */}
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gap: '1rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {progress.slice().reverse().map((month, index) => (
                <div 
                  key={month.month}
                  style={{
                    background: '#1a1a1a',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr 1fr',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#4CAF50',
                    fontWeight: 'bold',
                    minWidth: '80px'
                  }}>
                    {month.month}
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#999'}}>Sessions</div>
                    <div style={{fontSize: '1.1rem', color: '#2196F3', fontWeight: 'bold'}}>
                      {month.sessions}
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#999'}}>Energy</div>
                    <div style={{fontSize: '1.1rem', color: '#ffd93d', fontWeight: 'bold'}}>
                      {month.energy.toFixed(3)} kWh
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.75rem', color: '#999'}}>CO₂</div>
                    <div style={{fontSize: '1.1rem', color: '#ff6b6b', fontWeight: 'bold'}}>
                      {(month.emissions / 1000).toFixed(3)} kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {(!progress || progress.length === 0) && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📊</div>
            <h2 style={{color: '#999', marginBottom: '1rem'}}>
              Start Your Journey
            </h2>
            <p style={{color: '#666'}}>
              Begin tracking your emissions to see your progress and unlock achievements!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportProgress