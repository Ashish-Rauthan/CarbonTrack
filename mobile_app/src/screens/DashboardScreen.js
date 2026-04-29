// src/screens/DashboardScreen.js
// "The Earthbound Editorial" — Dashboard: Ecosystem Health
// Design: Bento grid, tonal surface layers, no divider lines, leaf progress bars

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, cloudAPI, emissionsAPI } from '../services/api';
import {
  SectionHeader, LoadingOverlay, EmptyState, Badge, LeafProgressBar,
} from '../components/UI';
import { Colors, Spacing, Radius, Shadow, Typography } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [summary,    setSummary]    = useState(null);
  const [workloads,  setWorkloads]  = useState([]);
  const [recent,     setRecent]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) return <LoadingOverlay message="Loading ecosystem data…" />;

  const local  = summary?.local  || {};
  const cloud  = summary?.cloud  || {};
  const net    = summary?.netEmissions || 0;
  const activeWl = workloads.filter((w) => w.status === 'running').length;
  const reductionPct = (local.totalEmissions > 0)
    ? ((cloud.totalSavings / local.totalEmissions) * 100).toFixed(1)
    : '0.0';

  const headerHeight = insets.top + 64;
  const bottomPad = insets.bottom + 80;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: bottomPad }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Section label + headline ────────────────────────────────────── */}
      <View style={styles.heroHeader}>
        <Text style={styles.overviewLabel}>Overview</Text>
        <Text style={styles.heroHeadline}>Ecosystem Health</Text>
      </View>

      {/* ── Bento Grid — Net + Local + Cloud ────────────────────────────── */}
      <View style={styles.bentoGrid}>
        {/* Net Emissions — full width hero card */}
        <View style={styles.bentoHeroCard}>
          <Text style={styles.bentoLabel}>Net Emissions</Text>
          <View style={styles.bentoValueRow}>
            <Text style={styles.bentoValueLarge}>{net}</Text>
            <Text style={styles.bentoValueUnit}>tons CO2e</Text>
          </View>
          <View style={styles.sustainableBadge}>
            <Text style={styles.sustainableDot}>🌿</Text>
            <Text style={styles.sustainableText}>Sustainable Range</Text>
          </View>
          {/* Decorative nature icon — ambient, not functional */}
          <Text style={styles.bentoDecorIcon}>🌲</Text>
        </View>

        {/* Local + Cloud — two-column */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoSmallCard]}>
            <Text style={styles.bentoLabel}>Local</Text>
            <Text style={styles.bentoValueMd}>{local.totalEmissions || 4.2}</Text>
            <View style={styles.trendRow}>
              <Text style={[styles.trendArrow, { color: Colors.error }]}>↑</Text>
              <Text style={[styles.trendText, { color: Colors.error }]}>+12%</Text>
            </View>
          </View>
          <View style={[styles.bentoSmallCard, styles.bentoCloudCard]}>
            <Text style={styles.bentoLabel}>Cloud</Text>
            <Text style={styles.bentoValueMd}>{cloud.totalSavings || 8.2}</Text>
            <View style={styles.trendRow}>
              <Text style={[styles.trendArrow, { color: Colors.onTertiaryContainer }]}>↓</Text>
              <Text style={[styles.trendText, { color: Colors.onTertiaryContainer }]}>-24%</Text>
            </View>
            {/* Accent bottom border — the only "border" allowed */}
            <View style={styles.cloudAccentBar} />
          </View>
        </View>
      </View>

      {/* ── Your Impact ──────────────────────────────────────────────────── */}
      <View style={styles.impactHeaderRow}>
        <Text style={styles.impactHeading}>Your Impact</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.impactLink}>View History</Text>
        </TouchableOpacity>
      </View>

      {/* Trees Card — primary dark card */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.treesCard}
      >
        <View style={styles.treesCardInner}>
          <View style={styles.treesTop}>
            <View style={styles.treesIconWrap}>
              <Text style={styles.treesIconEmoji}>🌳</Text>
            </View>
            <Text style={styles.treesNumber}>124</Text>
          </View>
          <Text style={styles.treesTitle}>Trees planted through reforestation credits</Text>
          <Text style={styles.treesSubtitle}>Neutralizing 2.4 tons of offset monthly</Text>
        </View>
        {/* Ambient glow — top right */}
        <View style={styles.treesGlow} />
      </LinearGradient>

      {/* Offset Equivalent Card */}
      <View style={styles.offsetCard}>
        <View style={styles.offsetLeft}>
          <Text style={styles.offsetLabel}>Offset Equivalent</Text>
          <View style={styles.offsetValueRow}>
            <Text style={styles.offsetValue}>4,820</Text>
            <Text style={styles.offsetUnit}> miles</Text>
          </View>
          <Text style={styles.offsetDesc}>Equal to driving a standard gas car across the US twice.</Text>
        </View>
        <View style={styles.offsetIconWrap}>
          <Text style={styles.offsetCarIcon}>🚗</Text>
        </View>
      </View>

      {/* Leaf progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Milestone Progress</Text>
          <Text style={styles.progressPct}>80%</Text>
        </View>
        <LeafProgressBar progress={0.80} height={6} />
      </View>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionsGrid}>
        <ActionCard icon="📊" label="Start Tracking" desc="Log local emissions" color={Colors.accentLight} onPress={() => navigation.navigate('Tracker')} />
        <ActionCard icon="☁️" label="Optimize Cloud"  desc="Reduce with AWS"    color={Colors.successLight} onPress={() => navigation.navigate('Cloud')} />
        <ActionCard icon="📋" label="View Reports"    desc="History & insights" color={Colors.surfaceContainerLow} onPress={() => navigation.navigate('Reports')} />
      </View>

      {/* ── Recent Sessions ──────────────────────────────────────────────── */}
      <SectionHeader title="Recent Sessions" action="See all" onAction={() => navigation.navigate('Reports')} />
      {recent.length === 0 ? (
        <EmptyState icon="📡" title="No sessions yet" subtitle="Start the tracker to begin recording." />
      ) : (
        recent.map((em) => <SessionRow key={em._id} emission={em} />)
      )}

      {/* ── Environmental Impact ─────────────────────────────────────────── */}
      <SectionHeader title="Environmental Impact" />
      <ImpactCard net={net} />

      {/* ── Header actions ──────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionCard({ icon, label, desc, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function SessionRow({ emission }) {
  const ts   = new Date(emission.timestamp);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = ts.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const isCodeCarbon = emission.metadata?.source === 'codecarbon';
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionId}>#{emission.sessionId?.slice(-6) || '—'}</Text>
        <Text style={styles.sessionMeta}>{date} · {time} · {emission.deviceId}</Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionCo2}>{Number(emission.emissionsGCO2).toFixed(3)} gCO₂</Text>
        <Badge
          label={isCodeCarbon ? '⚡ CodeCarbon' : '~ Est.'}
          variant={isCodeCarbon ? 'running' : 'neutral'}
        />
      </View>
    </View>
  );
}

function ImpactCard({ net }) {
  const items = [
    { icon: '🌳', value: (net / 21000).toFixed(4), label: 'Trees absorbed' },
    { icon: '🚗', value: (net / 404).toFixed(4),   label: 'Miles driven equiv.' },
    { icon: '🔋', value: `${Math.round(net / 8.3)}k`, label: 'Phone charges' },
  ];
  return (
    <View style={styles.impactCard}>
      {items.map((item) => (
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
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.lg },

  // Hero header
  heroHeader: { marginBottom: Spacing.lg },
  overviewLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: `${Colors.textMuted}`,
    opacity: 0.7,
    marginBottom: 4,
  },
  heroHeadline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 34,
    letterSpacing: -0.8,
    color: Colors.primary,
    lineHeight: 40,
  },

  // Bento Grid
  bentoGrid: { marginBottom: Spacing.lg, gap: Spacing.sm },

  bentoHeroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.botanical,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: `${Colors.textMuted}`,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: Spacing.md },
  bentoValueLarge: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 44,
    letterSpacing: -1.2,
    color: Colors.primary,
  },
  bentoValueUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  sustainableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  sustainableDot: { fontSize: 12 },
  sustainableText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.onSecondaryContainer,
  },
  bentoDecorIcon: {
    position: 'absolute',
    right: -8,
    bottom: -12,
    fontSize: 90,
    opacity: 0.05,
  },

  bentoRow: { flexDirection: 'row', gap: Spacing.sm },
  bentoSmallCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoCloudCard: {
    // No border — uses accent bar instead
  },
  bentoValueMd: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.7,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: Spacing.sm },
  trendArrow: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  trendText:  { fontFamily: 'Inter_700Bold', fontSize: 12 },
  cloudAccentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accentDim,
  },

  // Your Impact
  impactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  impactHeading: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.primary,
  },
  impactLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },

  // Trees card
  treesCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.md,
  },
  treesCardInner: { position: 'relative', zIndex: 1 },
  treesTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  treesIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treesIconEmoji: { fontSize: 20 },
  treesNumber: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 44,
    letterSpacing: -1,
    color: Colors.accent,
  },
  treesTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 6,
  },
  treesSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(193,236,212,0.7)',
  },
  treesGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(127,253,139,0.15)',
    borderRadius: 60,
    zIndex: 0,
  },

  // Offset card
  offsetCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  offsetLeft: { flex: 1 },
  offsetLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    opacity: 0.6,
    marginBottom: 4,
  },
  offsetValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  offsetValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.7,
    color: Colors.primary,
  },
  offsetUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  offsetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  offsetIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  offsetCarIcon: { fontSize: 24 },

  // Progress
  progressSection: { marginBottom: Spacing.md },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    opacity: 0.5,
  },
  progressPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    opacity: 0.5,
  },

  // Quick actions
  actionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  actionCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon:  { fontSize: 24 },
  actionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
  },
  actionDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Session rows (no divider lines — white space only)
  sessionRow: {
    backgroundColor: Colors.surfaceContainerLowest,
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
  sessionId: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  sessionCo2: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.error,
  },

  // Impact card
  impactCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...Shadow.sm,
    marginBottom: Spacing.lg,
  },
  impactCell:  { alignItems: 'center', gap: 4 },
  impactIcon:  { fontSize: 24 },
  impactValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: Colors.primary,
  },
  impactLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 80,
  },

  // Sign out
  signOutBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});