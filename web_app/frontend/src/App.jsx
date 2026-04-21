import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import CloudOptimization from './components/CloudOptimization'
import ReportSummary from './components/Reports/ReportSummary'
import ReportInsights from './components/Reports/ReportInsights'
import ReportProgress from './components/Reports/ReportProgress'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function AppLayout() {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f8' }}>
      <Navigation />
      <div style={{ marginLeft: (!isAuthPage && token) ? '240px' : '0' }}
        className="main-content-area">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/cloud" element={<ProtectedRoute><CloudOptimization /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportSummary /></ProtectedRoute>} />
          <Route path="/reports/insights" element={<ProtectedRoute><ReportInsights /></ProtectedRoute>} />
          <Route path="/reports/progress" element={<ProtectedRoute><ReportProgress /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App