import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import CloudOptimization from './components/CloudOptimization'
import ReportSummary from './components/Reports/ReportSummary'
import ReportInsights from './components/Reports/ReportInsights'
import ReportProgress from './components/Reports/ReportProgress'
import './App.css'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cloud"
              element={
                <ProtectedRoute>
                  <CloudOptimization />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/insights"
              element={
                <ProtectedRoute>
                  <ReportInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/progress"
              element={
                <ProtectedRoute>
                  <ReportProgress />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App