// web_app/frontend/src/components/Reports/ReportSummary.jsx

import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { reportsAPI } from '../../services/api'

const COLORS = ['#4CAF50', '#2196F3', '#ff9800', '#f44336'];

const ReportSummary = () => {
  const [period, setPeriod] = useState('week')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [period])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getSummary(period)
      setReportData(response.data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Failed to load report data')
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
        minHeight: '400px',
        color: '#999'
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading report...
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

  if (!reportData) return null

  const { summary, impact, recommendations, chartData } = reportData

  // Prepare trend indicator
  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  }

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'increasing': return '#f44336';
      case 'decreasing': return '#4CAF50';
      default: return '#ff9800';
    }
  }

  const getComparisonColor = (comparison) => {
    const value = parseFloat(comparison);
    if (value < -10) return '#4CAF50'; // Much better than average
    if (value < 0) return '#8BC34A'; // Better than average
    if (value < 10) return '#ff9800'; // Close to average
    return '#f44336'; // Worse than average
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
      `}</style>

      <div className="container" style={{maxWidth: '1400px', margin: '0 auto', padding: '0 20px'}}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              📊 Emission Report
            </h1>
            <p style={{color: '#999', fontSize: '0.95rem'}}>
              Detailed analysis of your carbon footprint
            </p>
          </div>

          {/* Period Selector */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: '#2d2d2d',
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid #404040'
          }}>
            {['day', 'week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '0.5rem 1rem',
                  background: period === p ? '#4CAF50' : 'transparent',
                  color: period === p ? '#1a1a1a' : '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: period === p ? 'bold' : 'normal',
                  transition: 'all 0.3s',
                  textTransform: 'capitalize'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>💨</div>
            <h3 style={{color: '#999', fontSize: '0.85rem', marginBottom: '0.5rem'}}>
              TOTAL CO₂ EMISSIONS
            </h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '0.5rem'}}>
              {summary.totalEmissions.toFixed(3)} kg
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <span style={{color: getTrendColor(summary.trend)}}>
                {getTrendIcon(summary.trend)}
              </span>
              <span style={{color: '#666'}}>
                Trend: <span style={{color: getTrendColor(summary.trend)}}>{summary.trend}</span>
              </span>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⚡</div>
            <h3 style={{color: '#999', fontSize: '0.85rem', marginBottom: '0.5rem'}}>
              TOTAL ENERGY
            </h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#ffd93d', marginBottom: '0.5rem'}}>
              {summary.totalEnergy.toFixed(4)} kWh
            </p>
            <p style={{fontSize: '0.85rem', color: '#666'}}>
              {(summary.totalEnergy * 1000).toFixed(1)} Wh
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📊</div>
            <h3 style={{color: '#999', fontSize: '0.85rem', marginBottom: '0.5rem'}}>
              SESSIONS
            </h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#6ec6ff', marginBottom: '0.5rem'}}>
              {summary.sessionsCount}
            </p>
            <p style={{fontSize: '0.85rem', color: '#666'}}>
              Avg: {summary.avgPerSession.toFixed(4)} kg/session
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #404040'
          }}>
            <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📈</div>
            <h3 style={{color: '#999', fontSize: '0.85rem', marginBottom: '0.5rem'}}>
              VS PLATFORM AVG
            </h3>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getComparisonColor(summary.comparisonToAverage),
              marginBottom: '0.5rem'
            }}>
              {summary.comparisonToAverage > 0 ? '+' : ''}{summary.comparisonToAverage}%
            </p>
            <p style={{fontSize: '0.85rem', color: '#666'}}>
              {summary.comparisonToAverage < 0 ? 'Better' : 'Higher'} than average
            </p>
          </div>
        </div>

        {/* Environmental Impact */}
        <div style={{
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #4CAF50'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            color: '#4CAF50'
          }}>
            🌱 Environmental Impact ({period})
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              background: '#252525',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>🌳</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50'}}>
                {impact.trees}
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Trees to offset</p>
            </div>

            <div style={{
              background: '#252525',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>🚗</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800'}}>
                {impact.carMiles}
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Miles driven</p>
            </div>

            <div style={{
              background: '#252525',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #404040'
            }}>
              <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>📱</div>
              <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2196F3'}}>
                {impact.phoneCharges}
              </p>
              <p style={{fontSize: '0.85rem', color: '#999'}}>Phone charges</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #404040'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '1.5rem',
              color: '#e0e0e0'
            }}>
              💡 Recommendations
            </h2>
            
            <div style={{display: 'grid', gap: '1rem'}}>
              {recommendations.map((rec, index) => (
                <div key={index} style={{
                  background: '#1a1a1a',
                  padding: '1rem 1.5rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{fontSize: '1.5rem'}}>✨</span>
                  <p style={{color: '#e0e0e0', margin: 0}}>{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div style={{
          display: 'grid',
          gap: '2rem'
        }}>
          {chartData && chartData.length > 0 && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040'
              }}>
                <h3 style={{marginBottom: '1rem', color: '#e0e0e0'}}>
                  Emissions Timeline
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      stroke="#999"
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#e0e0e0'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="emissions" 
                      stroke="#ff6b6b" 
                      name="CO₂ (g)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040'
              }}>
                <h3 style={{marginBottom: '1rem', color: '#e0e0e0'}}>
                  Energy Consumption
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      stroke="#999"
                    />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{
                        background: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#e0e0e0'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="energy" 
                      fill="#ffd93d" 
                      name="Energy (kWh)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportSummary