// src/screens/ReportsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { reportsAPI, cloudAPI, emissionsAPI } from '../services/api';
import {
  Card, StatCard, SectionHeader, LoadingOverlay,
  EmptyState, Badge, Divider,
} from '../components/UI';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

export default function ReportsScreen() {
  const [tab,        setTab]        = useState('emissions'); // 'emissions' | 'cloud' | 'summary'
  const [summary,    setSummary]    = useState(null);
  const [progress,   setProgress]   = useState([]);
  const [emissions,  setEmissions]  = useState([]);
  const [workloads,  setWorkloads]  = useState([]);
  const [period,     setPeriod]     = useState('week');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, progRes, emRes, wlRes] = await Promise.all([
        reportsAPI.summary(period),
        reportsAPI.progress(),
        emissionsAPI.recent(30),
        cloudAPI.workloads({ limit: 30 }),
      ]);
      setSummary(sumRes.data);
      setProgress(progRes.data.progress || []);
      setEmissions(emRes.data.emissions || []);
      setWorkloads(wlRes.data.workloads || []);
    } catch (err) {
      console.warn('Reports fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  if (loading) return <LoadingOverlay message="Loading reports…" />;

  const local = summary?.local || {};
  const cloud = summary?.cloud || {};
  const net   = summary?.netEmissions || 0;

  const totalSavings   = workloads.reduce((s, w) => s + (w.savingsGCO2 || 0), 0);
  const reductionPct   = local.totalEmissions > 0
    ? ((cloud.totalSavings / local.totalEmissions) * 100).toFixed(1)
    : '0.0';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.desc}>Emissions history, cloud savings, and your environmental progress.</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {['day', 'week', 'month', 'year'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary cards */}
      <View style={styles.statsRow}>
        <StatCard label="Local Emissions" value={local.totalEmissions || 0} unit="gCO₂" color={Colors.error} />
        <View style={{ width: Spacing.sm }} />
        <StatCard label="Cloud Savings"   value={cloud.totalSavings || 0}   unit="gCO₂" color={Colors.success} highlight />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Net Emissions" value={net} unit="gCO₂" />
        <View style={{ width: Spacing.sm }} />
        <StatCard label="Sessions" value={local.sessionCount || 0} unit="total" />
      </View>

      {/* Reduction bar */}
      {parseFloat(reductionPct) > 0 && (
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={styles.reductionRow}>
            <Text style={styles.reductionLabel}>Cloud Reduction Progress</Text>
            <Text style={styles.reductionPct}>{reductionPct}%</Text>
          </View>
          <View style={styles.reductionTrack}>
            <View style={[styles.reductionFill, { width: `${Math.min(100, parseFloat(reductionPct))}%` }]} />
          </View>
          <Text style={styles.reductionSub}>
            Saved {cloud.totalSavings || 0} gCO₂ of {local.totalEmissions || 0} gCO₂ emitted
          </Text>
        </Card>
      )}

      {/* Tab Nav */}
      <View style={styles.tabs}>
        {[
          ['emissions', '📡 Emissions'],
          ['cloud',     '☁️ Workloads'],
          ['progress',  '📈 Progress'],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, tab === id && styles.tabActive]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Emissions Tab ──────────────────────────────────────────────────── */}
      {tab === 'emissions' && (
        <>
          <SectionHeader title={`Emissions (${emissions.length} sessions)`} />
          {emissions.length === 0 ? (
            <EmptyState icon="📡" title="No emission data" subtitle="Start a tracking session from the Tracker tab." />
          ) : (
            emissions.map((em) => <EmissionRow key={em._id} emission={em} />)
          )}
        </>
      )}

      {/* ── Cloud Tab ──────────────────────────────────────────────────────── */}
      {tab === 'cloud' && (
        <>
          <SectionHeader title={`Workloads (${workloads.length} total)`} />
          {/* Stats mini row */}
          <View style={styles.cloudStats}>
            <CloudStatChip label="Total Saved" value={`${totalSavings.toFixed(2)} g`} color={Colors.success} />
            <CloudStatChip label="Running"   value={workloads.filter((w) => w.status === 'running').length}   color={Colors.primary} />
            <CloudStatChip label="Completed" value={workloads.filter((w) => w.status === 'completed').length} color={Colors.textMuted} />
          </View>
          {workloads.length === 0 ? (
            <EmptyState icon="☁️" title="No workloads yet" subtitle="Submit a workload from the Cloud tab." />
          ) : (
            workloads.map((w) => <WorkloadRow key={w._id} workload={w} />)
          )}
        </>
      )}

      {/* ── Progress Tab ───────────────────────────────────────────────────── */}
      {tab === 'progress' && (
        <>
          <SectionHeader title="Daily Progress (Last 30 Days)" />
          {/* Environmental equivalents */}
          <EquivalentsCard net={net} cloudSavings={parseFloat(cloud.totalSavings || 0)} />
          <Divider />
          {progress.length === 0 ? (
            <EmptyState icon="📈" title="No progress data yet" subtitle="Track emissions daily to build your progress chart." />
          ) : (
            progress.map((day, i) => <ProgressRow key={i} day={day} />)
          )}
        </>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmissionRow({ emission }) {
  const ts   = new Date(emission.timestamp);
  const date = ts.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isCodeCarbon = emission.metadata?.source === 'codecarbon';

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>#{emission.sessionId?.slice(-6) || '—'}</Text>
        <Text style={styles.rowMeta}>{date} · {time}</Text>
        <Text style={styles.rowMeta}>{emission.deviceId}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: Colors.error }]}>
          {Number(emission.emissionsGCO2).toFixed(4)} gCO₂
        </Text>
        <Text style={styles.rowSub}>{Number(emission.energyKWh).toFixed(6)} kWh</Text>
        <Badge
          label={isCodeCarbon ? '⚡ CC' : '~ Est.'}
          variant={isCodeCarbon ? 'running' : 'neutral'}
        />
      </View>
    </View>
  );
}

function WorkloadRow({ workload }) {
  const badgeVariant = workload.status === 'running'   ? 'running'
    : workload.status === 'completed' ? 'success'
    : workload.status === 'failed'    ? 'error'
    : 'neutral';
  const date = new Date(workload.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{workload.workloadType} workload</Text>
        <Text style={styles.rowMeta}>{workload.cloudProvider?.toUpperCase()} · {workload.targetCloudRegion}</Text>
        {workload.instanceId && <Text style={styles.rowMeta}>{workload.instanceId}</Text>}
        <Text style={styles.rowMeta}>{date}{workload.metadata?.simulated ? ' · Simulated' : ''}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: Colors.success }]}>
          {Number(workload.savingsGCO2).toFixed(2)} g saved
        </Text>
        <Text style={styles.rowSub}>${Number(workload.estimatedCost || 0).toFixed(4)}</Text>
        <Badge label={workload.status} variant={badgeVariant} />
      </View>
    </View>
  );
}

function ProgressRow({ day }) {
  const date = new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressDate}>{date}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(100, day.emissions / 5)}%`, backgroundColor: Colors.error }]} />
      </View>
      <View style={styles.progressStats}>
        <Text style={[styles.progressVal, { color: Colors.error }]}>{day.emissions.toFixed(1)}g</Text>
        <Text style={[styles.progressVal, { color: Colors.success }]}>−{day.savings.toFixed(1)}g</Text>
        <Text style={styles.progressSessions}>{day.sessions} sess.</Text>
      </View>
    </View>
  );
}

function CloudStatChip({ label, value, color }) {
  return (
    <View style={styles.cloudStatChip}>
      <Text style={[styles.cloudStatValue, { color }]}>{value}</Text>
      <Text style={styles.cloudStatLabel}>{label}</Text>
    </View>
  );
}

function EquivalentsCard({ net, cloudSavings }) {
  const savings = cloudSavings;
  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <Text style={styles.equivTitle}>Environmental Equivalents</Text>
      <View style={styles.equivRow}>
        {[
          { icon: '🌳', value: (savings / 21000).toFixed(4), label: 'Trees absorbed' },
          { icon: '🚗', value: (savings / 404).toFixed(4),   label: 'Miles saved' },
          { icon: '🔋', value: Math.round(savings / 8.3),    label: 'Phone charges' },
        ].map((item) => (
          <View key={item.label} style={styles.equivCell}>
            <Text style={styles.equivIcon}>{item.icon}</Text>
            <Text style={styles.equivValue}>{item.value}</Text>
            <Text style={styles.equivLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },

  title: { ...Typography.h1, marginBottom: 4 },
  desc:  { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  periodBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: Radius.full },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  periodBtnTextActive: { color: '#fff' },

  statsRow: { flexDirection: 'row', marginBottom: Spacing.sm },

  reductionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reductionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  reductionPct:   { fontSize: 18, fontWeight: '800', color: Colors.primary },
  reductionTrack: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, height: 8, marginBottom: 6 },
  reductionFill:  { backgroundColor: Colors.success, borderRadius: Radius.full, height: 8 },
  reductionSub:   { fontSize: 11, color: Colors.textMuted },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.full },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  rowCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  rowLeft:  { flex: 1, gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  rowMeta:  { fontSize: 11, color: Colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '700' },
  rowSub:   { fontSize: 11, color: Colors.textMuted },

  cloudStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  cloudStatChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.sm,
  },
  cloudStatValue: { fontSize: 16, fontWeight: '800' },
  cloudStatLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressDate: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, width: 50 },
  progressBar:  { flex: 1, height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressStats:{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  progressVal:  { fontSize: 11, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  progressSessions: { fontSize: 10, color: Colors.textMuted },

  equivTitle: { ...Typography.h3, fontSize: 14, marginBottom: Spacing.md },
  equivRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  equivCell:  { alignItems: 'center', gap: 4 },
  equivIcon:  { fontSize: 24 },
  equivValue: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  equivLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', maxWidth: 70 },
});
