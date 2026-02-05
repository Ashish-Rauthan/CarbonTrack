import React, { useState, useEffect } from 'react'
import { cloudAPI } from '../services/api'

const CloudOptimization = () => {
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [provider, setProvider] = useState('aws')
  const [workloadData, setWorkloadData] = useState({
    workloadType: 'computation',
    duration: 1,
    power: 100,
    instanceType: 't2.micro'
  })
  const [savings, setSavings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    aws: null
  })
  const [workloads, setWorkloads] = useState([])
  const [activeTab, setActiveTab] = useState('calculate')

  useEffect(() => {
    fetchRegions()
    testConnections()
    fetchWorkloads()
  }, [])

  const testConnections = async () => {
    try {
      const awsResult = await cloudAPI.testConnection('aws')
      setConnectionStatus({
        aws: awsResult.data.success
      })
    } catch (error) {
      console.error('Error testing connections:', error)
      setConnectionStatus({ aws: false })
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await cloudAPI.getRegions('aws')
      const awsRegions = response.data.regions.filter(r => r.provider === 'aws')
      setRegions(awsRegions || [])
      if (awsRegions.length > 0) {
        setSelectedRegion(awsRegions[0]._id)
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const fetchWorkloads = async () => {
    try {
      const response = await cloudAPI.getWorkloads({ limit: 10 })
      setWorkloads(response.data.workloads || [])
    } catch (error) {
      console.error('Error fetching workloads:', error)
    }
  }

  const calculateSavings = async () => {
    if (!selectedRegion) {
      alert('Please select an AWS region first')
      return
    }

    setLoading(true)
    try {
      const response = await cloudAPI.calculateSavings({
        workloadType: workloadData.workloadType,
        estimatedDurationHours: workloadData.duration,
        estimatedPowerWatts: workloadData.power,
        targetRegion: selectedRegion
      })
      setSavings(response.data)
      setActiveTab('results')
    } catch (error) {
      console.error('Error calculating savings:', error)
      alert('Failed to calculate savings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitWorkload = async () => {
    if (!savings) {
      alert('Please calculate savings first')
      return
    }

    setLoading(true)
    try {
      const region = regions.find(r => r._id === selectedRegion)
      await cloudAPI.submitWorkload({
        workloadType: workloadData.workloadType,
        targetCloudRegion: region.region,
        cloudProvider: 'aws',
        estimatedLocalEmissions: parseFloat(savings.localEmissions),
        estimatedCloudEmissions: parseFloat(savings.cloudEmissions),
        metadata: {
          duration: workloadData.duration,
          power: workloadData.power,
          energyKWh: parseFloat(savings.energyKWh),
          simulated: true
        }
      })
      alert('✓ Simulated workload submitted successfully!')
      setSavings(null)
      fetchWorkloads()
      setActiveTab('workloads')
    } catch (error) {
      console.error('Error submitting workload:', error)
      alert('Failed to submit workload')
    } finally {
      setLoading(false)
    }
  }

  const launchInstance = async () => {
    if (!savings) {
      alert('Please calculate savings first')
      return
    }

    const region = regions.find(r => r._id === selectedRegion)
    const confirmed = window.confirm(
      `⚠️ WARNING: This will create a REAL AWS EC2 instance!\n\n` +
      `Instance Type: ${workloadData.instanceType}\n` +
      `Region: ${region.regionName} (${region.region})\n` +
      `Est. Duration: ${workloadData.duration} hours\n` +
      `Est. Cost: ~$${(0.0116 * workloadData.duration).toFixed(4)}\n` +
      `Est. Savings: ${savings.savingsGCO2} gCO₂\n\n` +
      `Make sure to TERMINATE the instance when done!\n\n` +
      `Continue?`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const response = await cloudAPI.launchInstance({
        provider: 'aws',
        region: region.region,
        instanceType: workloadData.instanceType,
        workloadType: workloadData.workloadType,
        estimatedDurationHours: workloadData.duration
      })

      if (response.data.message === 'Instance launched successfully') {
        alert(
          `✓ AWS Instance launched successfully!\n\n` +
          `Instance ID: ${response.data.instance.instanceId}\n` +
          `Status: ${response.data.instance.state}\n` +
          `Region: ${region.region}\n\n` +
          `⚠️ IMPORTANT:\n` +
          `Check your AWS console to monitor and terminate when done!\n` +
          `Remember: You pay for every hour it runs!`
        )
        setSavings(null)
        fetchWorkloads()
      }
    } catch (error) {
      console.error('Error launching instance:', error)
      alert(
        `Failed to launch AWS instance\n\n` +
        `Error: ${error.response?.data?.error || error.message}\n\n` +
        `Please check:\n` +
        `1. Backend is running\n` +
        `2. AWS credentials are correct\n` +
        `3. You have permissions in AWS`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem',
      color: '#e0e0e0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2rem',
          background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '2rem'
        }}>
          ☁️ AWS Cloud Carbon Optimization
        </h1>

        {/* Connection Status */}
        <div style={{
          background: '#2d2d2d',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #404040'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
            AWS Provider Status
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: '8px',
            borderLeft: `4px solid ${connectionStatus.aws ? '#4CAF50' : '#f44336'}`
          }}>
            <div style={{ flex: 1 }}>
              <strong>AWS:</strong>{' '}
              <span style={{
                color: connectionStatus.aws ? '#4CAF50' : '#f44336',
                fontWeight: 'bold'
              }}>
                {connectionStatus.aws === null ? 'Testing...' : connectionStatus.aws ? '✓ Connected' : '✗ Not Connected'}
              </span>
            </div>
            <button
              onClick={() => testConnections()}
              style={{
                padding: '0.5rem 1rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Test Connection
            </button>
          </div>
          {connectionStatus.aws === false && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f44336',
              color: 'white',
              borderRadius: '8px'
            }}>
              ⚠️ AWS connection failed. Please check your credentials in the backend .env file.
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #404040'
        }}>
          <button
            onClick={() => setActiveTab('calculate')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'calculate' ? '#4CAF50' : 'transparent',
              color: activeTab === 'calculate' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'calculate' ? '3px solid #4CAF50' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            💡 Calculate Savings
          </button>
          <button
            onClick={() => setActiveTab('results')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'results' ? '#4CAF50' : 'transparent',
              color: activeTab === 'results' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'results' ? '3px solid #4CAF50' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
            disabled={!savings}
          >
            📊 Results
          </button>
          <button
            onClick={() => {
              setActiveTab('workloads')
              fetchWorkloads()
            }}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'workloads' ? '#4CAF50' : 'transparent',
              color: activeTab === 'workloads' ? 'white' : '#999',
              border: 'none',
              borderBottom: activeTab === 'workloads' ? '3px solid #4CAF50' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            📋 My Workloads
          </button>
        </div>

        {/* Calculate Tab */}
        {activeTab === 'calculate' && (
          <>
            {/* Region Selection */}
            <div style={{
              background: '#2d2d2d',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid #404040'
            }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                Select AWS Region
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Available Regions (sorted by carbon intensity):
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#1a1a1a',
                    color: '#e0e0e0',
                    border: '1px solid #404040',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select a region...</option>
                  {regions.map(region => (
                    <option key={region._id} value={region._id}>
                      {region.regionName} ({region.region}) - {region.carbonIntensity} gCO₂/kWh, {region.renewablePercentage}% renewable
                    </option>
                  ))}
                </select>
              </div>

              {selectedRegion && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4CAF50'
                }}>
                  {(() => {
                    const region = regions.find(r => r._id === selectedRegion)
                    return region ? (
                      <>
                        <strong>💚 Selected Region:</strong><br />
                        {region.regionName}, {region.country}<br />
                        Carbon Intensity: {region.carbonIntensity} gCO₂/kWh<br />
                        Renewable Energy: {region.renewablePercentage}%
                      </>
                    ) : null
                  })()}
                </div>
              )}
            </div>

            {/* Workload Configuration */}
            <div style={{
              background: '#2d2d2d',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid #404040'
            }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                Workload Configuration
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Workload Type
                  </label>
                  <select
                    value={workloadData.workloadType}
                    onChange={(e) => setWorkloadData({ ...workloadData, workloadType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      color: '#e0e0e0',
                      border: '1px solid #404040',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="computation">Computation</option>
                    <option value="storage">Storage</option>
                    <option value="processing">Processing</option>
                    <option value="training">AI Training</option>
                    <option value="batch">Batch Processing</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Instance Type
                  </label>
                  <select
                    value={workloadData.instanceType}
                    onChange={(e) => setWorkloadData({ ...workloadData, instanceType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      color: '#e0e0e0',
                      border: '1px solid #404040',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="t2.micro">t2.micro (Free Tier)</option>
                    <option value="t2.small">t2.small</option>
                    <option value="t3.micro">t3.micro</option>
                    <option value="t3.small">t3.small</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={workloadData.duration}
                    onChange={(e) => setWorkloadData({ ...workloadData, duration: parseFloat(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      color: '#e0e0e0',
                      border: '1px solid #404040',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Power (watts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={workloadData.power}
                    onChange={(e) => setWorkloadData({ ...workloadData, power: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      color: '#e0e0e0',
                      border: '1px solid #404040',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={calculateSavings}
                disabled={!selectedRegion || loading}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '0.875rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Calculating...' : '💡 Calculate Carbon Savings'}
              </button>
            </div>
          </>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && savings && (
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #4CAF50',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              💚 Carbon Savings Calculation
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: '#252525',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                  Local Emissions
                </div>
                <div style={{ fontSize: '2rem', color: '#ff6b6b', fontWeight: 'bold' }}>
                  {savings.localEmissions} g
                </div>
              </div>

              <div style={{
                background: '#252525',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                  Cloud Emissions
                </div>
                <div style={{ fontSize: '2rem', color: '#ffd93d', fontWeight: 'bold' }}>
                  {savings.cloudEmissions} g
                </div>
              </div>

              <div style={{
                background: '#252525',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                  Savings
                </div>
                <div style={{ fontSize: '2rem', color: '#4CAF50', fontWeight: 'bold' }}>
                  {savings.savingsGCO2} g ({savings.savingsPercentage}%)
                </div>
              </div>

              <div style={{
                background: '#252525',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                  Energy Usage
                </div>
                <div style={{ fontSize: '2rem', color: '#2196F3', fontWeight: 'bold' }}>
                  {savings.energyKWh} kWh
                </div>
              </div>
            </div>

            <div style={{
              background: '#1a1a1a',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, color: '#e0e0e0', lineHeight: '1.6' }}>
                <strong style={{ color: '#4CAF50' }}>{savings.region.name}</strong> (AWS)
                <br />
                Carbon Intensity: {savings.region.carbonIntensity} gCO₂/kWh
                <br />
                Renewable Energy: {savings.region.renewablePercentage}%
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <button
                onClick={launchInstance}
                disabled={loading}
                style={{
                  padding: '0.875rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Launching...' : '🚀 Launch Real AWS Instance'}
              </button>

              <button
                onClick={submitWorkload}
                disabled={loading}
                style={{
                  padding: '0.875rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #e68900 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Submitting...' : '📝 Submit Workload (Simulated)'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && !savings && (
          <div style={{
            background: '#2d2d2d',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #404040'
          }}>
            <p style={{ fontSize: '1.25rem', color: '#999' }}>
              No results yet. Go to "Calculate Savings" tab to get started.
            </p>
          </div>
        )}

        {/* Workloads Tab */}
        {activeTab === 'workloads' && (
          <div style={{
            background: '#2d2d2d',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #404040'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              📋 My Cloud Workloads
            </h2>

            {workloads.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {workloads.map(workload => (
                  <div
                    key={workload._id}
                    style={{
                      background: '#1a1a1a',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        workload.status === 'completed' ? '#4CAF50' :
                        workload.status === 'running' ? '#2196F3' :
                        workload.status === 'failed' ? '#f44336' : '#ff9800'
                      }`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem' }}>
                          {workload.workloadType.charAt(0).toUpperCase() + workload.workloadType.slice(1)}
                        </strong>
                        <span style={{ color: '#999', marginLeft: '0.5rem' }}>
                          • {workload.cloudProvider.toUpperCase()}
                        </span>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: workload.status === 'completed' ? '#4CAF50' :
                                   workload.status === 'running' ? '#2196F3' :
                                   workload.status === 'failed' ? '#f44336' : '#ff9800',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {workload.status.toUpperCase()}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      color: '#ccc',
                      fontSize: '0.875rem'
                    }}>
                      <div>
                        <div style={{ color: '#999' }}>Region:</div>
                        <div>{workload.targetCloudRegion}</div>
                      </div>
                      <div>
                        <div style={{ color: '#999' }}>Savings:</div>
                        <div style={{ color: '#4CAF50', fontWeight: '600' }}>
                          {workload.savingsGCO2.toFixed(2)} gCO₂
                        </div>
                      </div>
                      {workload.estimatedCost > 0 && (
                        <div>
                          <div style={{ color: '#999' }}>Cost:</div>
                          <div>${workload.estimatedCost.toFixed(4)}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#999' }}>Started:</div>
                        <div>{new Date(workload.startTime).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {workload.metadata?.simulated && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        background: '#ff9800',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        textAlign: 'center'
                      }}>
                        SIMULATED WORKLOAD
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#999'
              }}>
                <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  No workloads yet
                </p>
                <p>
                  Submit a workload from the "Calculate Savings" tab to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CloudOptimization