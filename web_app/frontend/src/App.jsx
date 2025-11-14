// web_app/frontend/src/App.jsx

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import ReportSummary from './components/Reports/ReportSummary'
import ReportInsights from './components/Reports/ReportInsights'
import ReportProgress from './components/Reports/ReportProgress'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<ReportSummary />} />
            <Route path="/reports/insights" element={<ReportInsights />} />
            <Route path="/reports/progress" element={<ReportProgress />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App