// src/screens/CloudScreen.js
// "The Earthbound Editorial" — Cloud Optimization
// Design: AWS status card with tonal layering, form inputs with ghost borders,
//         results card with leaf progress, no-line data lists
// Backend logic: UNCHANGED

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cloudAPI } from '../services/api';
import {
  Button, Input, SectionHeader, ErrorBox,
  LoadingOverlay, EmptyState, Badge, LeafProgressBar, ImpactBadge,
} from '../components/UI';
import { Colors, Spacing, Radius, Shadow, Typography } from '../utils/theme';

const { width } = Dimensions.get('window');
const WORKLOAD_TYPES = ['computation', 'storage', 'processing', 'training', 'batch'];
const INSTANCE_TYPES = ['t2.micro', 't2.small', 't3.micro', 't3.small'];

export default function CloudScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('calculate');

  const [regions,      setRegions]      = useState([]);
  const [selectedId,   setSelectedId]   = useState('');
  const [workloadType, setWorkloadType] = useState('computation');
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [duration,     setDuration]     = useState('1');
  const [power,        setPower]        = useState('100');

  const [savings,    setSavings]    = useState(null);
  const [workloads,  setWorkloads]  = useState([]);
  const [connStatus, setConnStatus] = useState(null);

  const [loading,    setLoading]    = useState(false);
  const [regLoading, setRegLoading] = useState(true);
  const [wlLoading,  setWlLoading]  = useState(false);
  const [error,      setError]      = useState('');

  // ── Bootstrap — UNCHANGED ─────────────────────────────────────────────────
  const fetchRegions = useCallback(async () => {
    setRegLoading(true);
    try {
      const res = await cloudAPI.regions('aws');
      const aws = (res.data.regions || []).filter((r) => r.provider === 'aws');
      setRegions(aws);
      if (aws.length > 0) setSelectedId(aws[0]._id);
    } catch (err) {
      setError('Failed to load regions: ' + (err.response?.data?.message || err.message));
    } finally {
      setRegLoading(false);
    }
  }, []);

  const testConnection = async () => {
    try {
      const res = await cloudAPI.testConnection('aws');
      setConnStatus(res.data.success);
    } catch { setConnStatus(false); }
  };

  const fetchWorkloads = useCallback(async () => {
    setWlLoading(true);
    try {
      const res = await cloudAPI.workloads({ limit: 20 });
      setWorkloads(res.data.workloads || []);
    } catch (err) {
      console.warn('Workloads fetch error:', err.message);
    } finally {
      setWlLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
    testConnection();
  }, [fetchRegions]);

  useEffect(() => {
    if (tab === 'workloads') fetchWorkloads();
  }, [tab, fetchWorkloads]);

  // ── Calculate savings — UNCHANGED ────────────────────────────────────────
  const calculateSavings = async () => {
    if (!selectedId) { setError('Please select a region.'); return; }
    const dur = parseFloat(duration);
    const pwr = parseFloat(power);
    if (isNaN(dur) || dur <= 0) { setError('Enter a valid duration (hours).'); return; }
    if (isNaN(pwr) || pwr <= 0) { setError('Enter a valid power (watts).'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await cloudAPI.calculateSavings({
        workloadType,
        estimatedDurationHours: dur,
        estimatedPowerWatts:    pwr,
        targetRegion:           selectedId,
      });
      setSavings(res.data);
      setTab('results');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate savings.');
    } finally {
      setLoading(false);
    }
  };

  // ── Launch instance — UNCHANGED ───────────────────────────────────────────
  const launchInstance = async () => {
    const region = regions.find((r) => r._id === selectedId);
    if (!region || !savings) return;

    Alert.alert(
      '⚠️ Launch Real AWS Instance',
      `This creates a REAL EC2 instance!\n\nType: ${instanceType}\nRegion: ${region.regionName} (${region.region})\nEst. Cost: ~$${(0.0116 * parseFloat(duration)).toFixed(4)}\n\nMake sure to TERMINATE when done!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError('');
            try {
              const res = await cloudAPI.launchInstance({
                provider:               'aws',
                region:                 region.region,
                instanceType,
                workloadType,
                estimatedDurationHours: parseFloat(duration),
              });
              if (res.data.message === 'Instance launched successfully') {
                Alert.alert('✅ Instance Launched', `ID: ${res.data.instance?.instanceId}\nSwitch to Workloads to monitor.`);
                setSavings(null);
                setTab('workloads');
                fetchWorkloads();
              } else {
                setError(res.data.error || 'Launch failed');
              }
            } catch (err) {
              setError(err.response?.data?.error || err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Submit simulated workload — UNCHANGED ─────────────────────────────────
  const submitWorkload = async () => {
    if (!savings) return;
    const region = regions.find((r) => r._id === selectedId);
    setLoading(true);
    setError('');
    try {
      await cloudAPI.submitWorkload({
        workloadType,
        targetCloudRegion:       region?.region || 'unknown',
        cloudProvider:           'aws',
        estimatedLocalEmissions: parseFloat(savings.localEmissions),
        estimatedCloudEmissions: parseFloat(savings.cloudEmissions),
        metadata: {
          duration: parseFloat(duration),
          power:    parseFloat(power),
          energyKWh: parseFloat(savings.energyKWh),
          simulated: true,
        },
      });
      Alert.alert('✅ Simulated Workload Submitted', `${Number(savings.savingsGCO2).toFixed(2)} gCO₂ saved logged.`);
      setSavings(null);
      setTab('workloads');
      fetchWorkloads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit workload.');
    } finally {
      setLoading(false);
    }
  };

  // ── Terminate instance — UNCHANGED ────────────────────────────────────────
  const terminateInstance = (workload) => {
    Alert.alert(
      '⚠️ Terminate Instance',
      `Terminate ${workload.instanceId}?\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate', style: 'destructive',
          onPress: async () => {
            try {
              await cloudAPI.terminateInstance({
                provider:   workload.cloudProvider,
                instanceId: workload.instanceId,
                region:     workload.targetCloudRegion,
                workloadId: workload._id,
              });
              fetchWorkloads();
              Alert.alert('Instance terminated.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || err.message);
            }
          },
        },
      ]
    );
  };

  const selectedRegionObj = regions.find((r) => r._id === selectedId);
  const headerHeight = insets.top + 64;
  const bottomPad    = insets.bottom + 80;

  if (regLoading) return <LoadingOverlay message="Loading cloud regions…" />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: bottomPad }]}
      refreshControl={
        tab === 'workloads'
          ? <RefreshControl refreshing={wlLoading} onRefresh={fetchWorkloads} tintColor={Colors.primary} />
          : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── AWS Provider Status Card ─────────────────────────────────────── */}
      <View style={styles.awsCard}>
        <View style={styles.awsLeft}>
          <View style={styles.awsLogoWrap}>
            <Text style={styles.awsLogoEmoji}>☁️</Text>
          </View>
          <View>
            <Text style={styles.awsTitle}>AWS Provider Status</Text>
            <View style={styles.awsStatusRow}>
              <View style={[styles.awsDot, { backgroundColor: connStatus ? Colors.onTertiaryContainer : Colors.error }]} />
              <Text style={[styles.awsStatusText, { color: connStatus ? Colors.onSecondaryContainer : Colors.error }]}>
                {connStatus === null ? 'TESTING…' : connStatus ? 'CONNECTED' : 'ERROR'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={testConnection}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ── Section headline ─────────────────────────────────────────────── */}
      <Text style={styles.sectionHeadline}>Optimize Workload</Text>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {[
          ['calculate', 'Calculate'],
          ['results',   'Results'],
          ['workloads', 'Workloads'],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.tabBtn, tab === id && styles.tabBtnActive]}
            onPress={() => setTab(id)}
            disabled={id === 'results' && !savings}
          >
            <Text style={[styles.tabBtnText, tab === id && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorBox message={error} />

      {/* ── Calculate Tab ────────────────────────────────────────────────── */}
      {tab === 'calculate' && (
        <>
          {/* Cloud Region */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Cloud Region</Text>
            <View style={styles.selectWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
                {regions.map((r) => (
                  <TouchableOpacity
                    key={r._id}
                    style={[styles.regionChip, selectedId === r._id && styles.regionChipSelected]}
                    onPress={() => setSelectedId(r._id)}
                  >
                    <Text style={[styles.regionChipText, selectedId === r._id && styles.regionChipTextSelected]}>
                      {r.region}
                    </Text>
                    <Text style={[styles.regionChipSub, selectedId === r._id && { color: Colors.onSecondaryContainer }]}>
                      {r.carbonIntensity}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {selectedRegionObj && (
              <View style={styles.regionTip}>
                <Text style={styles.regionTipText}>
                  💚 {selectedRegionObj.regionName} · {selectedRegionObj.carbonIntensity} gCO₂/kWh · {selectedRegionObj.renewablePercentage}% renewable
                </Text>
              </View>
            )}
          </View>

          {/* Workload Type */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Workload Type</Text>
            <View style={styles.chipRow}>
              {WORKLOAD_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, workloadType === t && styles.typeChipSelected]}
                  onPress={() => setWorkloadType(t)}
                >
                  <Text style={[styles.typeChipText, workloadType === t && styles.typeChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instance Type */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Instance Type</Text>
            <View style={styles.chipRow}>
              {INSTANCE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, instanceType === t && styles.typeChipSelected]}
                  onPress={() => setInstanceType(t)}
                >
                  <Text style={[styles.typeChipText, instanceType === t && styles.typeChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Estimated Duration</Text>
            <View style={styles.durationRow}>
              <Input
                placeholder="24"
                keyboardType="decimal-pad"
                value={duration}
                onChangeText={setDuration}
                style={styles.durationInput}
              />
              <View style={styles.durationUnit}>
                <Text style={styles.durationUnitText}>HOURS</Text>
              </View>
            </View>
          </View>

          {/* Power */}
          <Input
            label="Estimated Power (watts)"
            placeholder="e.g. 100"
            keyboardType="decimal-pad"
            value={power}
            onChangeText={setPower}
          />

          {/* Calculate CTA — gradient primary button */}
          <Button
            title="🧮  Calculate Savings"
            onPress={calculateSavings}
            loading={loading}
            disabled={!selectedId}
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
          />
        </>
      )}

      {/* ── Results Tab ──────────────────────────────────────────────────── */}
      {tab === 'results' && savings ? (
        <>
          {/* Results hero card */}
          <View style={styles.resultsCard}>
            {/* Header */}
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsMetaLabel}>Potential Carbon Reduction</Text>
                <View style={styles.resultsValueRow}>
                  <Text style={styles.resultsValue}>{savings.savingsGCO2}</Text>
                  <Text style={styles.resultsValueUnit}> gCO2e</Text>
                </View>
              </View>
              <ImpactBadge label={`-${savings.savingsPercentage}% IMPACT`} />
            </View>

            {/* Data rows — white space separates items (No-Line Rule) */}
            <View style={styles.dataList}>
              <DataRow label="Local Emissions"    value={`${savings.localEmissions} gCO₂`} />
              <DataRow label="Cloud Emissions"    value={`${savings.cloudEmissions} gCO₂`} />
              <DataRow label="Recommended Region" value={savings.region?.name || 'eu-west-1'} highlight />
              <DataRow label="Spot Instance Offset" value={`-$${(parseFloat(savings.savingsGCO2) * 0.0001).toFixed(2)} USD`} highlight />
            </View>

            {/* Leaf progress bar — the signature component */}
            <View style={styles.progressWrap}>
              <LeafProgressBar progress={Math.min(1, parseFloat(savings.savingsPercentage) / 100)} height={6} />
            </View>

            {/* Submit CTA */}
            <TouchableOpacity style={styles.submitBtn} onPress={submitWorkload}>
              <Text style={styles.submitBtnIcon}>☁️</Text>
              <Text style={styles.submitBtnText}>Submit Workload</Text>
            </TouchableOpacity>
          </View>

          {/* Contextual note */}
          <Text style={styles.contextNote}>
            By optimizing this workload, you save the equivalent of charging{' '}
            <Text style={styles.contextNoteBold}>
              {Math.round(parseFloat(savings.savingsGCO2) * 12)} smartphones
            </Text>.
          </Text>

          <Button
            title="🚀  Launch Real AWS Instance"
            onPress={launchInstance}
            loading={loading}
            style={{ marginBottom: Spacing.sm }}
          />
          <Button
            title="📝  Submit Simulated Workload"
            onPress={submitWorkload}
            loading={loading}
            variant="secondary"
            style={{ marginBottom: Spacing.xl }}
          />
        </>
      ) : tab === 'results' ? (
        <EmptyState icon="💡" title="No results yet" subtitle="Go to Calculate to get started." />
      ) : null}

      {/* ── Workloads Tab ────────────────────────────────────────────────── */}
      {tab === 'workloads' && (
        <>
          <SectionHeader title="My Cloud Workloads" action="Refresh" onAction={fetchWorkloads} />
          {wlLoading ? (
            <LoadingOverlay message="Loading workloads…" />
          ) : workloads.length === 0 ? (
            <EmptyState icon="☁️" title="No workloads yet" subtitle="Submit a workload to get started." />
          ) : (
            workloads.map((w) => (
              <WorkloadCard key={w._id} workload={w} onTerminate={terminateInstance} />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DataRow({ label, value, highlight }) {
  return (
    <View style={[styles.dataRow, highlight && styles.dataRowHighlight]}>
      <Text style={styles.dataRowLabel}>{label}</Text>
      <Text style={[styles.dataRowValue, highlight && styles.dataRowValueHighlight]}>{value}</Text>
    </View>
  );
}

function WorkloadCard({ workload, onTerminate }) {
  const status      = workload.status;
  const badgeVariant = status === 'running' ? 'running'
    : status === 'completed' ? 'success'
    : status === 'failed' ? 'error'
    : 'neutral';
  const canTerminate = (status === 'running' || status === 'pending') && workload.instanceId;
  return (
    <View style={styles.workloadCard}>
      <View style={styles.workloadInfo}>
        <Text style={styles.workloadType}>{workload.workloadType} workload</Text>
        <Text style={styles.workloadMeta}>
          {workload.cloudProvider?.toUpperCase()} · {workload.targetCloudRegion}
          {workload.instanceId ? `\n${workload.instanceId}` : ''}
          {workload.metadata?.simulated ? ' · Simulated' : ''}
        </Text>
      </View>
      <View style={styles.workloadRight}>
        <Text style={styles.workloadSavings}>{Number(workload.savingsGCO2).toFixed(2)} g</Text>
        <Text style={styles.workloadSavingsLabel}>saved</Text>
        <Badge label={status} variant={badgeVariant} />
        {canTerminate && (
          <TouchableOpacity style={styles.terminateBtn} onPress={() => onTerminate(workload)}>
            <Text style={styles.terminateBtnText}>Terminate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.lg },

  // AWS card — Level 2 card on Level 0 surface
  awsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    ...Shadow.botanical,
  },
  awsLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  awsLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awsLogoEmoji: { fontSize: 24 },
  awsTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  awsStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  awsDot: { width: 7, height: 7, borderRadius: 3.5 },
  awsStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 20 },

  sectionHeadline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.7,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },

  // Tabs — pill style
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
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabBtnTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

  // Form fields
  formField: { marginBottom: Spacing.md },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  selectWrap: { marginBottom: Spacing.sm },
  regionScroll: { flexGrow: 0 },

  regionChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  regionChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0fdf4',
  },
  regionChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.textMuted,
  },
  regionChipTextSelected: { color: Colors.primary },
  regionChipSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.error,
    marginTop: 1,
  },
  regionTip: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: 8,
  },
  regionTipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  typeChip: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipSelected: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  typeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
  },
  typeChipTextSelected: { color: Colors.primary, fontFamily: 'Inter_700Bold' },

  durationRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  durationInput: { flex: 1, marginBottom: 0 },
  durationUnit: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationUnitText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },

  // Results card
  resultsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.botanical,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  resultsMetaLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    opacity: 0.6,
    marginBottom: 4,
  },
  resultsValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  resultsValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 40,
    letterSpacing: -1,
    color: Colors.primary,
  },
  resultsValueUnit: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: Colors.textMuted,
    opacity: 0.4,
  },

  // Data list — no dividers, white space only
  dataList: { marginBottom: Spacing.lg },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    // Subtle tonal shift instead of border
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  dataRowHighlight: {},
  dataRowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  dataRowValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dataRowValueHighlight: { color: Colors.primary },

  progressWrap: { marginBottom: Spacing.lg },

  submitBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.md,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnIcon: { fontSize: 16 },
  submitBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },

  contextNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  contextNoteBold: { fontFamily: 'Inter_700Bold', color: Colors.textPrimary },

  // Workload cards
  workloadCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  workloadInfo: { flex: 1 },
  workloadType: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  workloadMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  workloadRight: { alignItems: 'flex-end', gap: 4 },
  workloadSavings: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: Colors.success,
  },
  workloadSavingsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
  terminateBtn: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  terminateBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.error,
  },
});