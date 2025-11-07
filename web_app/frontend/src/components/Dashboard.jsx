import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { emissionsAPI } from '../services/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

  if (loading) return <div className="loading">Loading your carbon emissions data...</div>
  if (error) return <div className="error" style={{textAlign: 'center', color: 'red', padding: '2rem'}}>{error}</div>

  const chartData = emissionsData?.emissions.map(item => ({
    ...item,
    formattedDate: formatDate(item.timestamp),
    emissions_kg: (item.emissions_gco2 / 1000).toFixed(3)
  })) || []

  const latestSessions = chartData.slice(0, 10)

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <h1>Carbon Emissions Dashboard</h1>
        {emissionsData && (
          <div className="stats">
            <div className="stat-card">
              <h3>Total CO₂ Emissions</h3>
              <p>{(emissionsData.totals.emissions / 1000).toFixed(2)} kg</p>
            </div>
            <div className="stat-card">
              <h3>Total Energy Used</h3>
              <p>{emissionsData.totals.energy.toFixed(4)} kWh</p>
            </div>
            <div className="stat-card">
              <h3>Tracking Sessions</h3>
              <p>{emissionsData.totals.sessions}</p>
            </div>
            <div className="stat-card">
              <h3>Avg CO₂ per Session</h3>
              <p>{emissionsData.totals.sessions > 0 ? (emissionsData.totals.emissions / emissionsData.totals.sessions / 1000).toFixed(3) : 0} kg</p>
            </div>
          </div>
        )}
      </div>

      {emissionsData && emissionsData.emissions.length > 0 ? (
        <div className="charts">
          <div className="chart-container">
            <h3>CO₂ Emissions Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [value.toFixed(4), 'Emissions (g CO₂)']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="emissions_gco2" 
                  stroke="#8884d8" 
                  name="CO₂ Emissions (g)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Energy Consumption</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [value.toFixed(4), 'Energy (kWh)']}
                />
                <Legend />
                <Bar 
                  dataKey="energy_kwh" 
                  fill="#82ca9d" 
                  name="Energy (kWh)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="recent-sessions">
            <h3>Recent Tracking Sessions</h3>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Energy (kWh)</th>
                  <th>CO₂ (g)</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                {latestSessions.map((session) => (
                  <tr key={session._id}>
                    <td>{session.formattedDate}</td>
                    <td>{session.energy_kwh.toFixed(4)}</td>
                    <td>{session.emissions_gco2.toFixed(4)}</td>
                    <td title={session.session_id}>{session.session_id.substring(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <h2>No emissions data yet</h2>
          <p>Start tracking with the Carbon Tracker desktop app to see your emissions data here!</p>
          <div style={{marginTop: '2rem'}}>
            <p>📱 Download the desktop app and start tracking your device's carbon emissions</p>
            <p>🔐 Login with the same account to sync your data</p>
            <p>📊 View detailed analytics and insights about your environmental impact</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard