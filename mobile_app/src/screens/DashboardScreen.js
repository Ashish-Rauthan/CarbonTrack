// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, cloudAPI, emissionsAPI } from '../services/api';
import {
  Card, StatCard, SectionHeader, LoadingOverlay,
  EmptyState, Badge,
} from '../components/UI';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [summary,   setSummary]   = useState(null);
  const [workloads, setWorkloads] = useState([]);
  const [recent,    setRecent]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, wRes, recRes] = await Promise.all([
        reportsAPI.summary('week'),
        cloudAPI.workloads({ limit: 5 }),
        emissionsAPI.recent(5),
      ]);
      setSummary(sumRes.data);
      setWorkloads(wRes.data.workloads || []);
      setRecent(recRes.data.emissions || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingOverlay message="Loading dashboard…" />;

  const local    = summary?.local  || {};
  const cloud    = summary?.cloud  || {};
  const net      = summary?.netEmissions || 0;
  const activeWl = workloads.filter((w) => w.status === 'running').length;

  const reductionPct = (local.totalEmissions > 0)
    ? ((cloud.totalSavings / local.totalEmissions) * 100).toFixed(1)
    : '0.0';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subtitle}>Your emissions overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Hero stat */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>NET EMISSIONS THIS WEEK</Text>
        <Text style={styles.heroValue}>{net} <Text style={styles.heroUnit}>gCO₂</Text></Text>
        {parseFloat(reductionPct) > 0 && (
          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>↓ {reductionPct}% via cloud</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Local Emissions"
          value={local.totalEmissions || 0}
          unit="gCO₂"
          color={Colors.error}
        />
        <View style={{ width: Spacing.sm }} />
        <StatCard
          label="Cloud Savings"
          value={cloud.totalSavings || 0}
          unit="gCO₂"
          color={Colors.success}
          highlight
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Energy Used"
          value={local.totalEnergy || 0}
          unit="kWh"
        />
        <View style={{ width: Spacing.sm }} />
        <StatCard
          label="Active Workloads"
          value={activeWl}
          unit="running"
          color={Colors.primary}
        />
      </View>

      {/* Quick actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionsGrid}>
        <ActionCard
          icon="📊"
          label="Start Tracking"
          desc="Log local emissions"
          color="#c1ecd4"
          onPress={() => navigation.navigate('Tracker')}
        />
        <ActionCard
          icon="☁️"
          label="Optimize Cloud"
          desc="Reduce with AWS"
          color="#aeeecb"
          onPress={() => navigation.navigate('Cloud')}
        />
        <ActionCard
          icon="📋"
          label="View Reports"
          desc="History & insights"
          color={Colors.surfaceAlt}
          onPress={() => navigation.navigate('Reports')}
        />
      </View>

      {/* Recent sessions */}
      <SectionHeader title="Recent Sessions" action="See all" onAction={() => navigation.navigate('Reports')} />
      {recent.length === 0 ? (
        <EmptyState icon="📡" title="No sessions yet" subtitle="Start the tracker to begin recording." />
      ) : (
        recent.map((em) => (
          <SessionRow key={em._id} emission={em} />
        ))
      )}

      {/* Recent workloads */}
      <SectionHeader title="Recent Workloads" action="See all" onAction={() => navigation.navigate('Cloud')} />
      {workloads.length === 0 ? (
        <EmptyState icon="☁️" title="No workloads yet" subtitle="Submit a workload to get started." />
      ) : (
        workloads.slice(0, 3).map((w) => (
          <WorkloadRow key={w._id} workload={w} />
        ))
      )}

      {/* Environmental impact */}
      <SectionHeader title="Environmental Impact" />
      <ImpactCard net={net} />

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionCard({ icon, label, desc, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function SessionRow({ emission }) {
  const ts = new Date(emission.timestamp);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = ts.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionId}>#{emission.sessionId?.slice(-6) || '—'}</Text>
        <Text style={styles.sessionMeta}>{date} · {time} · {emission.deviceId}</Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionCo2}>{Number(emission.emissionsGCO2).toFixed(3)} gCO₂</Text>
        <Badge
          label={emission.metadata?.source === 'codecarbon' ? '⚡ CodeCarbon' : '~ Est.'}
          variant={emission.metadata?.source === 'codecarbon' ? 'running' : 'neutral'}
        />
      </View>
    </View>
  );
}

function WorkloadRow({ workload }) {
  const badgeVariant = workload.status === 'running' ? 'running'
    : workload.status === 'completed' ? 'success'
    : workload.status === 'failed' ? 'error'
    : 'neutral';
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionId}>{workload.workloadType} workload</Text>
        <Text style={styles.sessionMeta}>{workload.cloudProvider?.toUpperCase()} · {workload.targetCloudRegion}</Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[styles.sessionCo2, { color: Colors.success }]}>
          {Number(workload.savingsGCO2).toFixed(2)} g saved
        </Text>
        <Badge label={workload.status} variant={badgeVariant} />
      </View>
    </View>
  );
}

function ImpactCard({ net }) {
  const treesEquiv   = (net / 21000).toFixed(4);
  const milesEquiv   = (net / 404).toFixed(4);
  const chargesEquiv = Math.round(net / 8.3);
  return (
    <View style={styles.impactCard}>
      {[
        { icon: '🌳', value: treesEquiv, label: 'Trees absorbed' },
        { icon: '🚗', value: milesEquiv, label: 'Miles driven equiv.' },
        { icon: '🔋', value: `${chargesEquiv}k`, label: 'Phone charges' },
      ].map((item) => (
        <View key={item.label} style={styles.impactCell}>
          <Text style={styles.impactIcon}>{item.icon}</Text>
          <Text style={styles.impactValue}>{item.value}</Text>
          <Text style={styles.impactLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
  logoutBtn: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  logoutText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  heroLabel: { ...Typography.label, color: 'rgba(193,236,212,0.7)', marginBottom: Spacing.sm },
  heroValue: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroUnit:  { fontSize: 18, fontWeight: '500', color: 'rgba(193,236,212,0.7)' },
  heroChip: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(127,253,139,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroChipText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  statsRow: { flexDirection: 'row', marginBottom: Spacing.sm },

  actionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  actionCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon:  { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  actionDesc:  { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  sessionRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  sessionLeft:  { flex: 1 },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionId:    { ...Typography.h3, fontSize: 14, marginBottom: 2 },
  sessionMeta:  { ...Typography.small },
  sessionCo2:   { fontSize: 14, fontWeight: '700', color: Colors.error },

  impactCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...Shadow.sm,
  },
  impactCell:  { alignItems: 'center', gap: 4 },
  impactIcon:  { fontSize: 24 },
  impactValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  impactLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', maxWidth: 80 },
});
