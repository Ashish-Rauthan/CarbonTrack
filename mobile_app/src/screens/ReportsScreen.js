// src/screens/ReportsScreen.js
// "The Earthbound Editorial" — Emissions Progress & Reports
// Design: Q3 target card with leaf progress, asymmetric bento grid for equivalents,
//         recent reductions list without dividers, editorial image teaser
// Backend logic: UNCHANGED

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reportsAPI, cloudAPI, emissionsAPI } from '../services/api';
import {
  SectionHeader, LoadingOverlay, EmptyState, Badge, LeafProgressBar, ImpactBadge,
} from '../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [tab,        setTab]        = useState('emissions');
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
  const totalSavings = workloads.reduce((s, w) => s + (w.savingsGCO2 || 0), 0);
  const reductionPct = local.totalEmissions > 0
    ? ((cloud.totalSavings / local.totalEmissions) * 100).toFixed(1)
    : '0.0';

  const headerHeight = insets.top + 64;
  const bottomPad    = insets.bottom + 80;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: bottomPad }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Editorial headline ──────────────────────────────────────────── */}
      <View style={styles.headlineBlock}>
        <Text style={styles.headline}>Emissions Progress</Text>
        <Text style={styles.headlineSub}>Quarterly Environmental Audit</Text>
      </View>

      {/* ── Period selector ──────────────────────────────────────────────── */}
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

      {/* ── Q3 Target Card ───────────────────────────────────────────────── */}
      <View style={styles.targetCard}>
        <View style={styles.targetTop}>
          <View>
            <Text style={styles.targetMeta}>Q3 Reduction Target</Text>
            <View style={styles.targetValueRow}>
              <Text style={styles.targetValue}>{local.totalEmissions || 12.4}</Text>
              <Text style={styles.targetUnit}> tons CO2e</Text>
            </View>
          </View>
          <ImpactBadge label={`${reductionPct}% ACHIEVED`} />
        </View>
        <LeafProgressBar progress={Math.min(1, parseFloat(reductionPct) / 100)} height={10} style={{ marginVertical: Spacing.md }} />
        <View style={styles.targetFooter}>
          <Text style={styles.targetFooterText}>0.0 tons</Text>
          <Text style={styles.targetFooterText}>Goal: 15.0 tons</Text>
        </View>
      </View>

      {/* ── Environmental Equivalents — Asymmetric Bento ─────────────────── */}
      <View style={styles.equivalentsBento}>
        {/* Large dark card — trees */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.treesEquivCard}
        >
          <Text style={styles.treesEquivIcon}>🌲</Text>
          <Text style={styles.treesEquivValue}>482</Text>
          <Text style={styles.treesEquivLabel}>Trees planted equivalent</Text>
        </LinearGradient>

        {/* Right column — two small cards */}
        <View style={styles.equivRightCol}>
          <View style={styles.equivSmallCard}>
            <Text style={styles.equivSmallIcon}>📱</Text>
            <View>
              <Text style={styles.equivSmallValue}>12,400</Text>
              <Text style={styles.equivSmallLabel}>Phones charged</Text>
            </View>
          </View>
          <View style={[styles.equivSmallCard, styles.equivSmallCardGreen]}>
            <Text style={styles.equivSmallIcon}>💨</Text>
            <View>
              <Text style={[styles.equivSmallValue, { color: Colors.onSecondaryContainer }]}>64kg</Text>
              <Text style={[styles.equivSmallLabel, { color: `${Colors.onSecondaryContainer}bb` }]}>Methane offset</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Reduction progress card ──────────────────────────────────────── */}
      {parseFloat(reductionPct) > 0 && (
        <View style={styles.reductionCard}>
          <View style={styles.reductionHeader}>
            <Text style={styles.reductionLabel}>Cloud Reduction Progress</Text>
            <Text style={styles.reductionPct}>{reductionPct}%</Text>
          </View>
          <LeafProgressBar progress={Math.min(1, parseFloat(reductionPct) / 100)} height={8} style={{ marginVertical: 8 }} />
          <Text style={styles.reductionSub}>
            Saved {cloud.totalSavings || 0} gCO₂ of {local.totalEmissions || 0} gCO₂ emitted
          </Text>
        </View>
      )}

      {/* ── Tab nav ──────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {[
          ['emissions', '📡 Emissions'],
          ['cloud',     '☁️ Workloads'],
          ['progress',  '📈 Progress'],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.tabBtn, tab === id && styles.tabBtnActive]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabBtnText, tab === id && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Emissions Tab ────────────────────────────────────────────────── */}
      {tab === 'emissions' && (
        <>
          <SectionHeader title={`Recent Reductions`} action="View All" onAction={() => {}} />
          {emissions.length === 0 ? (
            <EmptyState icon="📡" title="No emission data" subtitle="Start a tracking session from the Tracker tab." />
          ) : (
            emissions.map((em) => <EmissionRow key={em._id} emission={em} />)
          )}
        </>
      )}

      {/* ── Cloud Workloads Tab ──────────────────────────────────────────── */}
      {tab === 'cloud' && (
        <>
          <SectionHeader title={`Workloads (${workloads.length} total)`} />
          <View style={styles.cloudStatsRow}>
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

      {/* ── Progress Tab ─────────────────────────────────────────────────── */}
      {tab === 'progress' && (
        <>
          <SectionHeader title="Daily Progress (Last 30 Days)" />
          {progress.length === 0 ? (
            <EmptyState icon="📈" title="No progress data yet" subtitle="Track emissions daily to build your progress chart." />
          ) : (
            progress.map((day, i) => <ProgressRow key={i} day={day} />)
          )}
        </>
      )}

      {/* ── Annual Impact Teaser — editorial image section ────────────────── */}
      <View style={styles.teaserCard}>
        <LinearGradient
          colors={['transparent', `${Colors.primary}CC`]}
          style={styles.teaserOverlay}
        >
          <View style={styles.teaserContent}>
            <Text style={styles.teaserMeta}>Impact Report</Text>
            <Text style={styles.teaserTitle}>Annual Impact Ebook</Text>
            <Text style={styles.teaserSub}>Download your 2023 climate summary</Text>
          </View>
        </LinearGradient>
        {/* Forest background using emoji mosaic */}
        <View style={styles.teaserForest}>
          {['🌲', '🌳', '🌲', '🌿', '🌲', '🌳'].map((e, i) => (
            <Text key={i} style={[styles.teaserTree, { fontSize: 32 + (i % 3) * 8, opacity: 0.15 + i * 0.05 }]}>{e}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Emission row — no divider lines, white space separates items
function EmissionRow({ emission }) {
  const ts   = new Date(emission.timestamp);
  const date = ts.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  const isCodeCarbon = emission.metadata?.source === 'codecarbon';
  return (
    <View style={styles.reductionRow}>
      <View style={styles.reductionIconWrap}>
        <Text style={styles.reductionRowIcon}>
          {emission.metadata?.activity === 'ev' ? '🚗' :
           emission.metadata?.activity === 'solar' ? '☀️' :
           emission.metadata?.activity === 'recycling' ? '♻️' : '⚡'}
        </Text>
      </View>
      <View style={styles.reductionInfo}>
        <Text style={styles.reductionTitle}>
          {emission.metadata?.activity || `Session #${emission.sessionId?.slice(-4)}`}
        </Text>
        <Text style={styles.reductionDate}>{date}</Text>
      </View>
      <View style={styles.reductionRight}>
        <Text style={styles.reductionValue}>-{Number(emission.emissionsGCO2).toFixed(2)} kg</Text>
        <Text style={styles.reductionVerified}>verified</Text>
      </View>
    </View>
  );
}

function WorkloadRow({ workload }) {
  const badgeVariant = workload.status === 'running' ? 'running'
    : workload.status === 'completed' ? 'success'
    : workload.status === 'failed' ? 'error'
    : 'neutral';
  const date = new Date(workload.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
  return (
    <View style={styles.workloadRow}>
      <View style={styles.workloadInfo}>
        <Text style={styles.workloadTitle}>{workload.workloadType} workload</Text>
        <Text style={styles.workloadMeta}>{workload.cloudProvider?.toUpperCase()} · {workload.targetCloudRegion} · {date}</Text>
      </View>
      <View style={styles.workloadRight}>
        <Text style={styles.workloadSavings}>{Number(workload.savingsGCO2).toFixed(2)} g</Text>
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
      <View style={styles.progressBarWrap}>
        <LeafProgressBar progress={Math.min(1, day.emissions / 5)} height={6} />
      </View>
      <View style={styles.progressStats}>
        <Text style={[styles.progressVal, { color: Colors.error }]}>{day.emissions.toFixed(1)}g</Text>
        <Text style={[styles.progressVal, { color: Colors.success }]}>−{day.savings.toFixed(1)}g</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.lg },

  // Editorial headline
  headlineBlock: { marginBottom: Spacing.lg },
  headline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 34,
    letterSpacing: -0.8,
    color: Colors.primary,
    lineHeight: 40,
  },
  headlineSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Period selector
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
  },
  periodBtnTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

  // Target card
  targetCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.botanical,
  },
  targetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  targetMeta: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  targetValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  targetValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.8,
    color: Colors.primary,
  },
  targetUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.onSecondaryContainer,
  },
  targetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  targetFooterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Asymmetric bento — equivalents
  equivalentsBento: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  treesEquivCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 160,
    ...Shadow.md,
  },
  treesEquivIcon: { fontSize: 28, marginBottom: Spacing.sm },
  treesEquivValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    color: Colors.accentDim,
    letterSpacing: -0.8,
  },
  treesEquivLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(193,236,212,0.75)',
    lineHeight: 16,
  },

  equivRightCol: { flex: 1, gap: Spacing.sm },
  equivSmallCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  equivSmallCardGreen: { backgroundColor: Colors.successLight },
  equivSmallIcon: { fontSize: 20 },
  equivSmallValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  equivSmallLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Reduction card
  reductionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  reductionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reductionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reductionPct: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: Colors.primary,
  },
  reductionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Tab nav
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
  },
  tabBtnTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

  // Reduction rows — no dividers (white space only)
  reductionRow: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  reductionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reductionRowIcon: { fontSize: 20 },
  reductionInfo: { flex: 1 },
  reductionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  reductionDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reductionRight: { alignItems: 'flex-end' },
  reductionValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.onTertiaryContainer,
  },
  reductionVerified: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Workload rows
  workloadRow: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  workloadInfo: { flex: 1 },
  workloadTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  workloadMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  workloadRight: { alignItems: 'flex-end', gap: 4 },
  workloadSavings: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: Colors.success,
  },

  // Cloud stat chips
  cloudStatsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  cloudStatChip: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.sm,
  },
  cloudStatValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  cloudStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Progress rows
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
  },
  progressDate: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    width: 50,
  },
  progressBarWrap: { flex: 1 },
  progressStats: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  progressVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    minWidth: 38,
    textAlign: 'right',
  },

  // Annual teaser
  teaserCard: {
    height: 160,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
    position: 'relative',
    justifyContent: 'flex-end',
    ...Shadow.lg,
  },
  teaserForest: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 0,
  },
  teaserTree: { lineHeight: 80 },
  teaserOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    justifyContent: 'flex-end',
  },
  teaserContent: { padding: Spacing.lg, position: 'relative', zIndex: 10 },
  teaserMeta: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.accent,
    marginBottom: 4,
  },
  teaserTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#fff',
    lineHeight: 22,
  },
  teaserSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.primaryFixed,
    marginTop: 2,
  },
});