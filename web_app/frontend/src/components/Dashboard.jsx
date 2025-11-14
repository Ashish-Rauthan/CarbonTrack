import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { emissionsAPI } from '../services/api'

const Dashboard = () => {
  const [emissionsData, setEmissionsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmissions()
  }, [])

  const fetchEmissions = async () => {
    try {
      const response = await emissionsAPI.getEmissions()
      setEmissionsData(response.data)
    } catch (error) {
      console.error('Error fetching emissions:', error)
      setError('Failed to load emissions data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate environmental impact metrics
  const calculateImpact = () => {
    if (!emissionsData) return null
    
    const totalCO2kg = emissionsData.totals.emissions / 1000
    
    return {
      trees: (totalCO2kg / 0.021).toFixed(1), // Trees needed to offset (1 tree absorbs ~21kg CO2/year)
      cars: (totalCO2kg / 0.404).toFixed(2), // Equivalent car miles (0.404 kg CO2/mile avg)
      phones: (totalCO2kg / 0.000008).toFixed(0), // Smartphones charged (8g CO2/charge)
      lightbulbs: (emissionsData.totals.energy * 1000).toFixed(0), // Hours of LED bulb (10W)
      water: (emissionsData.totals.energy * 0.25).toFixed(2), // Liters of water saved if renewable
    }
  }

  const impact = calculateImpact()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        fontSize: '1.2rem',
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
          Loading your carbon emissions data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#ff6b6b',
        padding: '2rem',
        background: '#1a1a1a',
        borderRadius: '8px',
        margin: '2rem',
        border: '1px solid #ff6b6b'
      }}>
        ⚠️ {error}
      </div>
    )
  }

  const chartData = emissionsData?.emissions.map(item => ({
    ...item,
    formattedDate: formatDate(item.timestamp),
    emissions_kg: (item.emissions_gco2 / 1000).toFixed(3)
  })) || []

  const latestSessions = chartData.slice(0, 10)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
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
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
      
      <div className="container" style={{maxWidth: '1400px', margin: '0 auto', padding: '0 20px'}}>
        {/* Header */}
        <div style={{marginBottom: '2rem', textAlign: 'center'}} className="fade-in">
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            🌍 Carbon Emissions Dashboard
          </h1>
          <p style={{color: '#999', fontSize: '1rem'}}>
            Track your environmental impact in real-time
          </p>
        </div>

        {emissionsData && (
          <>
            {/* Main Stats Grid */}
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
                border: '1px solid #404040',
                textAlign: 'center',
                transition: 'transform 0.3s ease',
              }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              className="fade-in">
                <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>💨</div>
                <h3 style={{
                  color: '#999',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Total CO₂ Emissions</h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#ff6b6b',
                  marginBottom: '0.25rem'
                }}>
                  {(emissionsData.totals.emissions / 1000).toFixed(2)} kg
                </p>
                <p style={{fontSize: '0.75rem', color: '#666'}}>
                  {(emissionsData.totals.emissions).toFixed(0)} grams
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040',
                textAlign: 'center',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              className="fade-in">
                <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⚡</div>
                <h3 style={{
                  color: '#999',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Total Energy Used</h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#ffd93d',
                  marginBottom: '0.25rem'
                }}>
                  {emissionsData.totals.energy.toFixed(4)} kWh
                </p>
                <p style={{fontSize: '0.75rem', color: '#666'}}>
                  {(emissionsData.totals.energy * 1000).toFixed(1)} Wh
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040',
                textAlign: 'center',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              className="fade-in">
                <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📊</div>
                <h3 style={{
                  color: '#999',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Tracking Sessions</h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#6ec6ff',
                  marginBottom: '0.25rem'
                }}>
                  {emissionsData.totals.sessions}
                </p>
                <p style={{fontSize: '0.75rem', color: '#666'}}>
                  Active monitoring periods
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040',
                textAlign: 'center',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              className="fade-in">
                <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📈</div>
                <h3 style={{
                  color: '#999',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Avg CO₂ per Session</h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#a5d6a7',
                  marginBottom: '0.25rem'
                }}>
                  {emissionsData.totals.sessions > 0 
                    ? (emissionsData.totals.emissions / emissionsData.totals.sessions / 1000).toFixed(3) 
                    : 0} kg
                </p>
                <p style={{fontSize: '0.75rem', color: '#666'}}>
                  Per tracking session
                </p>
              </div>
            </div>

            {/* Environmental Impact Section */}
            {impact && (
              <div style={{
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #4CAF50'
              }} className="fade-in">
                <h2 style={{
                  fontSize: '1.8rem',
                  marginBottom: '1.5rem',
                  color: '#4CAF50',
                  textAlign: 'center'
                }}>
                  🌱 Regional Environmental Impact
                </h2>
                <p style={{
                  textAlign: 'center',
                  color: '#999',
                  marginBottom: '2rem',
                  fontSize: '0.95rem'
                }}>
                  Your carbon footprint translated into real-world equivalents
                </p>
                
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
                    <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50', marginBottom: '0.25rem'}}>
                      {impact.trees}
                    </p>
                    <p style={{fontSize: '0.85rem', color: '#999'}}>
                      Trees needed to offset
                    </p>
                    <p style={{fontSize: '0.7rem', color: '#666', marginTop: '0.5rem'}}>
                      (annually)
                    </p>
                  </div>

                  <div style={{
                    background: '#252525',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #404040'
                  }}>
                    <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>🚗</div>
                    <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800', marginBottom: '0.25rem'}}>
                      {impact.cars}
                    </p>
                    <p style={{fontSize: '0.85rem', color: '#999'}}>
                      Miles driven by car
                    </p>
                    <p style={{fontSize: '0.7rem', color: '#666', marginTop: '0.5rem'}}>
                      (equivalent)
                    </p>
                  </div>

                  <div style={{
                    background: '#252525',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #404040'
                  }}>
                    <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>📱</div>
                    <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2196F3', marginBottom: '0.25rem'}}>
                      {impact.phones}
                    </p>
                    <p style={{fontSize: '0.85rem', color: '#999'}}>
                      Smartphone charges
                    </p>
                    <p style={{fontSize: '0.7rem', color: '#666', marginTop: '0.5rem'}}>
                      (equivalent energy)
                    </p>
                  </div>

                  <div style={{
                    background: '#252525',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #404040'
                  }}>
                    <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>💡</div>
                    <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd93d', marginBottom: '0.25rem'}}>
                      {impact.lightbulbs}
                    </p>
                    <p style={{fontSize: '0.85rem', color: '#999'}}>
                      Hours of LED light
                    </p>
                    <p style={{fontSize: '0.7rem', color: '#666', marginTop: '0.5rem'}}>
                      (10W bulb)
                    </p>
                  </div>

                  <div style={{
                    background: '#252525',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #404040'
                  }}>
                    <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>💧</div>
                    <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#00bcd4', marginBottom: '0.25rem'}}>
                      {impact.water}
                    </p>
                    <p style={{fontSize: '0.85rem', color: '#999'}}>
                      Liters of water saved
                    </p>
                    <p style={{fontSize: '0.7rem', color: '#666', marginTop: '0.5rem'}}>
                      (if renewable energy)
                    </p>
                  </div>
                </div>

                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4CAF50'
                }}>
                  <p style={{color: '#999', fontSize: '0.9rem', lineHeight: '1.6'}}>
                    💡 <strong style={{color: '#4CAF50'}}>Tip:</strong> Reducing your screen time, 
                    enabling power-saving modes, and using energy-efficient hardware can significantly 
                    decrease your carbon footprint. Consider offsetting your emissions by supporting 
                    reforestation projects in your region.
                  </p>
                </div>
              </div>
            )}

            {emissionsData.emissions.length > 0 ? (
              <>
                {/* Charts */}
                <div style={{
                  display: 'grid',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #404040'
                  }} className="fade-in">
                    <h3 style={{
                      marginBottom: '1rem',
                      color: '#e0e0e0',
                      fontSize: '1.3rem'
                    }}>
                      📉 CO₂ Emissions Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                        <XAxis 
                          dataKey="timestamp" 
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
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value) => [value.toFixed(4) + ' g', 'CO₂ Emissions']}
                        />
                        <Legend />
                        <Area
                          type="monotone" 
                          dataKey="emissions_gco2" 
                          stroke="#ff6b6b" 
                          fillOpacity={1}
                          fill="url(#colorEmissions)"
                          name="CO₂ Emissions (g)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #404040'
                  }} className="fade-in">
                    <h3 style={{
                      marginBottom: '1rem',
                      color: '#e0e0e0',
                      fontSize: '1.3rem'
                    }}>
                      ⚡ Energy Consumption
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                        <XAxis 
                          dataKey="timestamp"
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
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value) => [value.toFixed(4) + ' kWh', 'Energy']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="energy_kwh" 
                          fill="#ffd93d" 
                          name="Energy (kWh)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Sessions Table */}
                <div style={{
                  background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '1px solid #404040',
                  overflowX: 'auto'
                }} className="fade-in">
                  <h3 style={{
                    marginBottom: '1rem',
                    color: '#e0e0e0',
                    fontSize: '1.3rem'
                  }}>
                    📋 Recent Tracking Sessions
                  </h3>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        background: '#1a1a1a',
                        borderBottom: '2px solid #404040'
                      }}>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#999',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>Date & Time</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#999',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>Energy (kWh)</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#999',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>CO₂ (g)</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          color: '#999',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>Session ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestSessions.map((session, index) => (
                        <tr key={session._id} style={{
                          borderBottom: '1px solid #404040',
                          background: index % 2 === 0 ? '#2d2d2d' : '#252525',
                          transition: 'background 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#2d2d2d' : '#252525'}
                        >
                          <td style={{
                            padding: '1rem',
                            color: '#e0e0e0'
                          }}>{session.formattedDate}</td>
                          <td style={{
                            padding: '1rem',
                            color: '#ffd93d',
                            fontWeight: '500'
                          }}>{session.energy_kwh.toFixed(6)}</td>
                          <td style={{
                            padding: '1rem',
                            color: '#ff6b6b',
                            fontWeight: '500'
                          }}>{session.emissions_gco2.toFixed(4)}</td>
                          <td style={{
                            padding: '1rem',
                            color: '#6ec6ff',
                            fontFamily: 'monospace'
                          }} title={session.session_id}>{session.session_id.substring(0, 8)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid #404040'
              }} className="fade-in">
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📊</div>
                <h2 style={{
                  color: '#999',
                  marginBottom: '1rem',
                  fontSize: '1.8rem'
                }}>No emissions data yet</h2>
                <p style={{
                  color: '#666',
                  marginBottom: '2rem',
                  fontSize: '1.1rem'
                }}>Start tracking with the Carbon Tracker desktop app to see your emissions data here!</p>
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                  textAlign: 'left'
                }}>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4CAF50'
                  }}>
                    <p style={{color: '#e0e0e0', fontSize: '0.95rem'}}>
                      📱 Download the desktop app and start tracking your device's carbon emissions
                    </p>
                  </div>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #2196F3'
                  }}>
                    <p style={{color: '#e0e0e0', fontSize: '0.95rem'}}>
                      🔐 Login with the same account to sync your data
                    </p>
                  </div>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff9800'
                  }}>
                    <p style={{color: '#e0e0e0', fontSize: '0.95rem'}}>
                      📊 View detailed analytics and insights about your environmental impact
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard