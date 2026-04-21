import React, { useState, useEffect } from 'react'
import { cloudAPI } from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  .co-root {
    font-family: 'Inter', sans-serif;
    background: #f9f9f8;
    min-height: 100vh;
    color: #191c1c;
    padding: 2.5rem 2rem 4rem;
  }

  @media (min-width: 1024px) { .co-root { padding: 3rem 3.5rem 4rem; } }

  .co-page-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  @media (min-width: 768px) {
    .co-page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
  }

  .co-headline {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    color: #012d1d;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.5rem;
  }

  .co-subheadline {
    font-size: 1rem;
    color: #414844;
    margin: 0;
    max-width: 48ch;
    line-height: 1.5;
  }

  /* Connection status widget */
  .co-status-widget {
    background: white;
    border-radius: 0.875rem;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex-shrink: 0;
    box-shadow: 0 40px 40px rgba(25,28,28,0.04);
    min-width: 220px;
  }

  .co-status-icon-wrap {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: #aeeecb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .co-status-icon-wrap .material-symbols-outlined {
    font-size: 1.125rem;
    font-variation-settings: 'FILL' 1, 'wght' 400;
    color: #002114;
  }

  .co-status-label {
    font-size: 0.75rem;
    color: #414844;
    margin-bottom: 0.25rem;
  }

  .co-status-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .co-status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #7ffd8b;
    flex-shrink: 0;
  }

  .co-status-dot.error { background: #ba1a1a; }

  .co-status-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #012d1d;
  }

  /* Tab nav */
  .co-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(193,200,194,0.15);
    margin-bottom: 2.5rem;
  }

  .co-tab {
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: #414844;
    background: transparent;
    border: none;
    padding: 0.75rem 1.25rem 0.75rem 0;
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease;
    margin-right: 1.5rem;
  }

  .co-tab:hover { color: #012d1d; }

  .co-tab.active {
    color: #012d1d;
    font-weight: 700;
  }

  .co-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #012d1d;
    border-radius: 2px 2px 0 0;
  }

  /* Section card */
  .co-card {
    background: white;
    border-radius: 0.875rem;
    padding: 2rem;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  @media (min-width: 1024px) { .co-card { padding: 2.5rem; } }

  .co-card-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: #012d1d;
    letter-spacing: -0.01em;
    margin: 0 0 1.75rem;
  }

  /* Form grid */
  .co-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) { .co-form-grid { grid-template-columns: 1fr 1fr; } }

  .co-form-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .co-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #414844;
    margin-bottom: 0.5rem;
  }

  .co-select, .co-input {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    padding: 0.75rem 1rem;
    background: white;
    color: #191c1c;
    border: 1px solid rgba(193,200,194,0.2);
    border-radius: 0.625rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
  }

  .co-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23414844' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.875rem center;
    padding-right: 2.5rem;
  }

  .co-select:focus, .co-input:focus {
    border-color: #012d1d;
    box-shadow: 0 0 0 3px rgba(193,236,212,0.35);
  }

  .co-form-footer {
    grid-column: 1 / -1;
    padding-top: 0.5rem;
  }

  .co-btn-calculate {
    font-family: 'Manrope', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    padding: 0.8125rem 2rem;
    background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%);
    color: white;
    border: none;
    border-radius: 0.625rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 40px 40px rgba(25,28,28,0.06);
  }

  .co-btn-calculate:hover:not(:disabled) {
    opacity: 0.88;
    box-shadow: 0 8px 24px rgba(1,45,29,0.22);
  }

  .co-btn-calculate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Region select highlight */
  .co-region-info {
    margin-top: 0.875rem;
    padding: 1rem 1.25rem;
    background: #f3f4f3;
    border-radius: 0.625rem;
    font-size: 0.8125rem;
    color: #414844;
    line-height: 1.6;
    border-left: 3px solid #7ffd8b;
  }

  .co-region-info strong { color: #012d1d; font-weight: 600; }

  /* Results */
  .co-results-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) { .co-results-grid { grid-template-columns: repeat(4, 1fr); } }

  .co-result-cell {
    background: #f9f9f8;
    border-radius: 0.625rem;
    padding: 1.25rem;
    text-align: center;
  }

  .co-result-cell-label {
    font-size: 0.75rem;
    color: #414844;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.625rem;
  }

  .co-result-cell-value {
    font-family: 'Manrope', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1;
  }

  .co-result-cell-unit {
    font-size: 0.75rem;
    font-weight: 500;
    color: #414844;
  }

  .color-error { color: #ba1a1a; }
  .color-warn { color: #717973; }
  .color-success { color: #012d1d; }
  .color-blue { color: #2c694e; }

  .co-region-detail {
    background: #f3f4f3;
    border-radius: 0.625rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #414844;
  }

  .co-region-detail strong { color: #012d1d; font-weight: 600; }

  .co-result-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .co-btn-launch {
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%);
    color: white;
    border: none;
    border-radius: 0.625rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    box-shadow: 0 40px 40px rgba(25,28,28,0.06);
  }

  .co-btn-launch:hover:not(:disabled) {
    opacity: 0.88;
    box-shadow: 0 8px 24px rgba(1,45,29,0.2);
  }

  .co-btn-launch:disabled { opacity: 0.5; cursor: not-allowed; }

  .co-btn-simulate {
    font-family: 'Manrope', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    background: #e1e3e2;
    color: #191c1c;
    border: none;
    border-radius: 0.625rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
  }

  .co-btn-simulate:hover:not(:disabled) { background: #d9dad9; }
  .co-btn-simulate:disabled { opacity: 0.5; cursor: not-allowed; }

  .co-btn-simulate .material-symbols-outlined,
  .co-btn-launch .material-symbols-outlined {
    font-size: 0.9rem;
    font-variation-settings: 'FILL' 1, 'wght' 400;
  }

  /* Workloads */
  .co-workload-item {
    background: white;
    border-radius: 0.75rem;
    padding: 1.25rem 1.5rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: box-shadow 0.2s ease;
  }

  .co-workload-item:hover {
    box-shadow: 0 40px 40px rgba(25,28,28,0.05);
  }

  .co-workload-accent {
    width: 3px;
    height: 2.75rem;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .co-workload-info { flex: 1; min-width: 0; }

  .co-workload-type {
    font-family: 'Manrope', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    color: #191c1c;
    margin-bottom: 0.125rem;
  }

  .co-workload-meta {
    font-size: 0.75rem;
    color: #717973;
  }

  .co-workload-savings {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #012d1d;
    text-align: right;
  }

  .co-workload-savings-label {
    font-size: 0.6875rem;
    color: #717973;
    font-weight: 400;
    display: block;
    margin-top: 0.125rem;
  }

  .co-status-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .badge-running { background: #c1ecd4; color: #002114; }
  .badge-completed { background: #aeeecb; color: #002114; }
  .badge-pending { background: #f3f4f3; color: #414844; }
  .badge-failed { background: #ffdad6; color: #93000a; }

  .co-terminate-btn {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.3125rem 0.75rem;
    background: #ffdad6;
    color: #93000a;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .co-terminate-btn:hover { background: #ba1a1a; color: white; }

  /* Connection status card */
  .co-conn-card {
    background: white;
    border-radius: 0.875rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .co-conn-info { display: flex; align-items: center; gap: 0.75rem; }

  .co-test-btn {
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: #f3f4f3;
    color: #191c1c;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .co-test-btn:hover { background: #e7e8e7; }

  .co-test-btn .material-symbols-outlined {
    font-size: 0.9rem;
    font-variation-settings: 'FILL' 0, 'wght' 300;
  }

  /* Empty state */
  .co-empty {
    text-align: center;
    padding: 3rem 2rem;
    background: white;
    border-radius: 0.875rem;
  }

  .co-empty-icon {
    font-size: 2.5rem;
    color: #c1c8c2;
    margin-bottom: 1rem;
    font-variation-settings: 'FILL' 0, 'wght' 200;
  }

  .co-empty-title {
    font-family: 'Manrope', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #414844;
    margin-bottom: 0.375rem;
  }

  .co-empty-sub {
    font-size: 0.875rem;
    color: #717973;
  }

  /* Loading */
  .co-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: co-spin 0.6s linear infinite;
    margin-right: 0.375rem;
  }

  @keyframes co-spin { to { transform: rotate(360deg); } }
`

const CloudOptimization = () => {
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [workloadData, setWorkloadData] = useState({ workloadType: 'computation', duration: 1, power: 100, instanceType: 't2.micro' })
  const [savings, setSavings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({ aws: null })
  const [workloads, setWorkloads] = useState([])
  const [activeTab, setActiveTab] = useState('calculate')

  useEffect(() => { fetchRegions(); testConnections(); fetchWorkloads() }, [])

  const testConnections = async () => {
    try {
      const r = await cloudAPI.testConnection('aws')
      setConnectionStatus({ aws: r.data.success })
    } catch { setConnectionStatus({ aws: false }) }
  }

  const fetchRegions = async () => {
    try {
      const r = await cloudAPI.getRegions('aws')
      const regs = (r.data.regions || []).filter(x => x.provider === 'aws')
      setRegions(regs)
      if (regs.length > 0) setSelectedRegion(regs[0]._id)
    } catch (e) { console.error(e) }
  }

  const fetchWorkloads = async () => {
    try {
      const r = await cloudAPI.getWorkloads({ limit: 10 })
      setWorkloads(r.data.workloads || [])
    } catch (e) { console.error(e) }
  }

  const calculateSavings = async () => {
    if (!selectedRegion) return
    setLoading(true)
    try {
      const r = await cloudAPI.calculateSavings({ workloadType: workloadData.workloadType, estimatedDurationHours: workloadData.duration, estimatedPowerWatts: workloadData.power, targetRegion: selectedRegion })
      setSavings(r.data)
      setActiveTab('results')
    } catch { alert('Failed to calculate savings. Please try again.') }
    finally { setLoading(false) }
  }

  const submitWorkload = async () => {
    if (!savings) return
    setLoading(true)
    try {
      const region = regions.find(r => r._id === selectedRegion)
      await cloudAPI.submitWorkload({ workloadType: workloadData.workloadType, targetCloudRegion: region.region, cloudProvider: 'aws', estimatedLocalEmissions: parseFloat(savings.localEmissions), estimatedCloudEmissions: parseFloat(savings.cloudEmissions), metadata: { duration: workloadData.duration, power: workloadData.power, energyKWh: parseFloat(savings.energyKWh), simulated: true } })
      setSavings(null); fetchWorkloads(); setActiveTab('workloads')
    } catch { alert('Failed to submit workload') }
    finally { setLoading(false) }
  }

  const launchInstance = async () => {
    if (!savings) return
    const region = regions.find(r => r._id === selectedRegion)
    const confirmed = window.confirm(`⚠️ This will create a REAL AWS EC2 instance!\n\nInstance: ${workloadData.instanceType}\nRegion: ${region.regionName} (${region.region})\nEst. Cost: ~$${(0.0116 * workloadData.duration).toFixed(4)}\n\nMake sure to TERMINATE when done!\nContinue?`)
    if (!confirmed) return
    setLoading(true)
    try {
      const r = await cloudAPI.launchInstance({ provider: 'aws', region: region.region, instanceType: workloadData.instanceType, workloadType: workloadData.workloadType, estimatedDurationHours: workloadData.duration })
      if (r.data.message === 'Instance launched successfully') { setSavings(null); fetchWorkloads() }
    } catch (e) { alert(`Failed to launch AWS instance\n\n${e.response?.data?.error || e.message}`) }
    finally { setLoading(false) }
  }

  const handleTerminate = async (workload) => {
    if (!window.confirm(`Terminate instance ${workload.instanceId}?`)) return
    try {
      const r = await cloudAPI.terminateInstance({ provider: workload.cloudProvider, instanceId: workload.instanceId, region: workload.targetCloudRegion, workloadId: workload._id })
      if (r.data.message === 'Instance terminated successfully') fetchWorkloads()
    } catch (e) { alert(`Error: ${e.response?.data?.error || e.message}`) }
  }

  const selectedRegionObj = regions.find(r => r._id === selectedRegion)

  const statusColors = { running: '#012d1d', completed: '#2c694e', pending: '#717973', failed: '#ba1a1a' }
  const badgeClass = s => ({ running: 'badge-running', completed: 'badge-completed', pending: 'badge-pending', failed: 'badge-failed' }[s] || 'badge-pending')

  return (
    <div className="co-root">
      <style>{STYLES}</style>

      {/* Page Header */}
      <div className="co-page-header">
        <div>
          <h1 className="co-headline">Cloud Optimization</h1>
          <p className="co-subheadline">Analyze and optimize your cloud infrastructure for minimum carbon impact without sacrificing performance.</p>
        </div>
        <div className="co-status-widget">
          <div className="co-status-icon-wrap">
            <span className="material-symbols-outlined">cloud</span>
          </div>
          <div>
            <div className="co-status-label">AWS Connection</div>
            <div className="co-status-row">
              <span className={`co-status-dot ${connectionStatus.aws === false ? 'error' : ''}`} />
              <span className="co-status-text">
                {connectionStatus.aws === null ? 'Testing…' : connectionStatus.aws ? 'Active (us-east-1)' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="co-tabs">
        {[['calculate', 'Calculate Savings'], ['results', 'Results'], ['workloads', 'My Workloads']].map(([id, label]) => (
          <button key={id} className={`co-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); if (id === 'workloads') fetchWorkloads() }}
            disabled={id === 'results' && !savings && activeTab !== 'results'}>
            {label}
          </button>
        ))}
      </div>

      {/* Calculate Tab */}
      {activeTab === 'calculate' && (
        <>
          {/* Connection Status Card */}
          <div className="co-conn-card">
            <div className="co-conn-info">
              <div className={`co-status-dot ${connectionStatus.aws === false ? 'error' : ''}`} style={{ width: '0.625rem', height: '0.625rem' }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#191c1c' }}>AWS Provider</span>
                <span style={{ fontSize: '0.8125rem', color: '#414844', marginLeft: '0.5rem' }}>
                  {connectionStatus.aws === null ? 'Checking connection…' : connectionStatus.aws ? 'Connected and ready' : 'Connection failed — check credentials in .env'}
                </span>
              </div>
            </div>
            <button className="co-test-btn" onClick={testConnections}>
              <span className="material-symbols-outlined">refresh</span>
              Test Connection
            </button>
          </div>

          {/* Optimization Parameters */}
          <div className="co-card">
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 60%, #f3f4f3 100%)', pointerEvents: 'none', borderRadius: '0.875rem' }} />
            <h2 className="co-card-title" style={{ position: 'relative', zIndex: 1 }}>Optimization Parameters</h2>
            <div className="co-form-grid" style={{ position: 'relative', zIndex: 1 }}>
              <div className="co-form-col">
                <div>
                  <label className="co-label">Current Region</label>
                  <select className="co-select">
                    <option>US East (N. Virginia)</option>
                    <option>US West (Oregon)</option>
                    <option>EU (Ireland)</option>
                  </select>
                </div>
                <div>
                  <label className="co-label">Target Region</label>
                  <select className="co-select" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>
                    <option value="">Auto-select lowest carbon</option>
                    {regions.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.regionName} ({r.region}) — {r.carbonIntensity} gCO₂/kWh, {r.renewablePercentage}% renewable
                      </option>
                    ))}
                  </select>
                  {selectedRegionObj && (
                    <div className="co-region-info">
                      <strong>{selectedRegionObj.regionName}, {selectedRegionObj.country}</strong><br />
                      {selectedRegionObj.carbonIntensity} gCO₂/kWh · {selectedRegionObj.renewablePercentage}% renewable energy
                    </div>
                  )}
                </div>
              </div>
              <div className="co-form-col">
                <div>
                  <label className="co-label">Workload Type</label>
                  <select className="co-select" value={workloadData.workloadType} onChange={e => setWorkloadData({ ...workloadData, workloadType: e.target.value })}>
                    <option value="computation">Computation</option>
                    <option value="storage">Storage</option>
                    <option value="processing">Processing</option>
                    <option value="training">ML Training</option>
                    <option value="batch">Batch Processing</option>
                  </select>
                </div>
                <div>
                  <label className="co-label">Instance Type</label>
                  <select className="co-select" value={workloadData.instanceType} onChange={e => setWorkloadData({ ...workloadData, instanceType: e.target.value })}>
                    <option value="t2.micro">t2.micro (Free Tier)</option>
                    <option value="t2.small">t2.small</option>
                    <option value="t3.micro">t3.micro</option>
                    <option value="t3.small">t3.small</option>
                  </select>
                </div>
                <div>
                  <label className="co-label">Estimated Duration (Hours)</label>
                  <input className="co-input" type="number" min="0.1" step="0.5" value={workloadData.duration} onChange={e => setWorkloadData({ ...workloadData, duration: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="co-form-footer">
                <button className="co-btn-calculate" onClick={calculateSavings} disabled={!selectedRegion || loading}>
                  {loading ? <><span className="co-spinner" />Calculating…</> : 'Calculate Impact'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && savings ? (
        <div className="co-card">
          <h2 className="co-card-title">Carbon Savings Calculation</h2>
          <div className="co-results-grid">
            <div className="co-result-cell">
              <div className="co-result-cell-label">Local Emissions</div>
              <div className="co-result-cell-value color-error">{savings.localEmissions} <span className="co-result-cell-unit">g</span></div>
            </div>
            <div className="co-result-cell">
              <div className="co-result-cell-label">Cloud Emissions</div>
              <div className="co-result-cell-value color-warn">{savings.cloudEmissions} <span className="co-result-cell-unit">g</span></div>
            </div>
            <div className="co-result-cell">
              <div className="co-result-cell-label">Total Savings</div>
              <div className="co-result-cell-value color-success">{savings.savingsGCO2} <span className="co-result-cell-unit">g</span></div>
            </div>
            <div className="co-result-cell">
              <div className="co-result-cell-label">Reduction</div>
              <div className="co-result-cell-value color-success">{savings.savingsPercentage}<span className="co-result-cell-unit">%</span></div>
            </div>
          </div>
          <div className="co-region-detail">
            <strong>{savings.region.name}</strong> (AWS) &nbsp;·&nbsp; {savings.region.carbonIntensity} gCO₂/kWh &nbsp;·&nbsp; {savings.region.renewablePercentage}% renewable energy &nbsp;·&nbsp; {savings.energyKWh} kWh estimated usage
          </div>
          <div className="co-result-actions">
            <button className="co-btn-launch" onClick={launchInstance} disabled={loading}>
              <span className="material-symbols-outlined">rocket_launch</span>
              {loading ? 'Launching…' : 'Launch Real AWS Instance'}
            </button>
            <button className="co-btn-simulate" onClick={submitWorkload} disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300", fontSize: '0.9rem' }}>description</span>
              {loading ? 'Submitting…' : 'Submit Simulated Workload'}
            </button>
          </div>
        </div>
      ) : activeTab === 'results' && (
        <div className="co-empty">
          <span className="material-symbols-outlined co-empty-icon">calculate</span>
          <div className="co-empty-title">No results yet</div>
          <div className="co-empty-sub">Go to Calculate Savings to get started.</div>
        </div>
      )}

      {/* Workloads Tab */}
      {activeTab === 'workloads' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#191c1c', margin: 0 }}>My Cloud Workloads</h2>
            <button className="co-test-btn" onClick={fetchWorkloads}>
              <span className="material-symbols-outlined">refresh</span>
              Refresh
            </button>
          </div>
          {workloads.length > 0 ? workloads.map(w => (
            <div className="co-workload-item" key={w._id}>
              <div className="co-workload-accent" style={{ background: statusColors[w.status] || '#717973' }} />
              <div className="co-workload-info">
                <div className="co-workload-type">{w.workloadType.charAt(0).toUpperCase() + w.workloadType.slice(1)} Workload</div>
                <div className="co-workload-meta">
                  {w.cloudProvider.toUpperCase()} · {w.targetCloudRegion}
                  {w.instanceId ? ` · ${w.instanceId}` : ''}
                  {w.metadata?.simulated ? ' · Simulated' : ''}
                  {' · '}{new Date(w.startTime).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="co-workload-savings">{Number(w.savingsGCO2).toFixed(2)} g</div>
                <span className="co-workload-savings-label">CO₂ saved</span>
              </div>
              <span className={`co-status-badge ${badgeClass(w.status)}`}>{w.status}</span>
              {(w.status === 'running' || w.status === 'pending') && w.instanceId && (
                <button className="co-terminate-btn" onClick={() => handleTerminate(w)}>Terminate</button>
              )}
            </div>
          )) : (
            <div className="co-empty">
              <span className="material-symbols-outlined co-empty-icon">cloud_off</span>
              <div className="co-empty-title">No workloads yet</div>
              <div className="co-empty-sub">Submit a workload from the Calculate Savings tab to get started.</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(193,200,194,0.15)', paddingTop: '2rem', marginTop: '3rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(1,45,29,0.5)', margin: 0 }}>© 2024 Earthbound Editorial. Towards a permanent digital forest.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Documentation', 'Support', 'API Status', 'Privacy Policy'].map(l => (
            <a key={l} href="#" style={{ fontSize: '0.6875rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(25,28,28,0.4)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default CloudOptimization