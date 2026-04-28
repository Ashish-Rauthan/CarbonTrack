// src/screens/CloudScreen.js
// All savings calculations and AWS interactions are done by the backend.
// This screen is purely a UI/API consumer.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { cloudAPI } from '../services/api';
import {
  Card, Button, Input, SectionHeader, ErrorBox,
  LoadingOverlay, EmptyState, Badge,
} from '../components/UI';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

const WORKLOAD_TYPES = ['computation', 'storage', 'processing', 'training', 'batch'];
const INSTANCE_TYPES = ['t2.micro', 't2.small', 't3.micro', 't3.small'];

export default function CloudScreen() {
  const [tab, setTab] = useState('calculate'); // 'calculate' | 'results' | 'workloads'

  const [regions,      setRegions]      = useState([]);
  const [selectedId,   setSelectedId]   = useState('');
  const [workloadType, setWorkloadType] = useState('computation');
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [duration,     setDuration]     = useState('1');
  const [power,        setPower]        = useState('100');

  const [savings,    setSavings]    = useState(null);
  const [workloads,  setWorkloads]  = useState([]);
  const [connStatus, setConnStatus] = useState(null); // null | true | false

  const [loading,    setLoading]    = useState(false);
  const [regLoading, setRegLoading] = useState(true);
  const [wlLoading,  setWlLoading]  = useState(false);
  const [error,      setError]      = useState('');

  // ── Bootstrap ────────────────────────────────────────────────────────────
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

  // ── Calculate savings (backend call) ─────────────────────────────────────
  const calculateSavings = async () => {
    if (!selectedId) { setError('Please select a region.'); return; }
    const dur  = parseFloat(duration);
    const pwr  = parseFloat(power);
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

  // ── Launch real instance ──────────────────────────────────────────────────
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

  // ── Submit simulated workload ─────────────────────────────────────────────
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

  // ── Terminate instance ────────────────────────────────────────────────────
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

  if (regLoading) return <LoadingOverlay message="Loading cloud regions…" />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        tab === 'workloads'
          ? <RefreshControl refreshing={wlLoading} onRefresh={fetchWorkloads} tintColor={Colors.primary} />
          : undefined
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cloud Optimization</Text>
        <View style={[styles.connBadge, { backgroundColor: connStatus ? Colors.accentLight : Colors.errorLight }]}>
          <View style={[styles.connDot, { backgroundColor: connStatus ? Colors.accent : Colors.error }]} />
          <Text style={[styles.connText, { color: connStatus ? Colors.primary : Colors.error }]}>
            {connStatus === null ? 'Testing…' : connStatus ? 'AWS Connected' : 'AWS Error'}
          </Text>
        </View>
      </View>
      <Text style={styles.desc}>Offload workloads to low-carbon AWS regions for maximum emission savings.</Text>

      {/* Tab Nav */}
      <View style={styles.tabs}>
        {[
          ['calculate', 'Calculate'],
          ['results',   'Results'],
          ['workloads', 'Workloads'],
        ].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, tab === id && styles.tabActive]}
            onPress={() => setTab(id)}
            disabled={id === 'results' && !savings}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorBox message={error} />

      {/* ── Calculate Tab ──────────────────────────────────────────────────── */}
      {tab === 'calculate' && (
        <>
          <SectionHeader title="Select AWS Region" />
          <Card>
            <Text style={styles.pickerLabel}>REGION (sorted greenest first)</Text>
            {regions.map((r) => (
              <TouchableOpacity
                key={r._id}
                style={[styles.regionItem, selectedId === r._id && styles.regionItemSelected]}
                onPress={() => setSelectedId(r._id)}
              >
                <View style={styles.regionLeft}>
                  <Text style={styles.regionName}>{r.regionName}</Text>
                  <Text style={styles.regionCode}>{r.provider?.toUpperCase()} · {r.region}</Text>
                </View>
                <View style={styles.regionRight}>
                  <Text style={styles.regionCarbon}>{r.carbonIntensity} gCO₂/kWh</Text>
                  <Text style={styles.regionRenew}>{r.renewablePercentage}% renewable</Text>
                </View>
              </TouchableOpacity>
            ))}
            {selectedRegionObj && (
              <View style={styles.regionTip}>
                <Text style={styles.regionTipText}>
                  💚 {selectedRegionObj.regionName}, {selectedRegionObj.country} — {selectedRegionObj.carbonIntensity} gCO₂/kWh
                  {selectedRegionObj.freeTierInstanceType ? ` · Free tier: ${selectedRegionObj.freeTierInstanceType}` : ''}
                </Text>
              </View>
            )}
          </Card>

          <SectionHeader title="Workload Configuration" />
          <Card>
            <Text style={styles.pickerLabel}>WORKLOAD TYPE</Text>
            <View style={styles.pickerWrap}>
              {WORKLOAD_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, workloadType === t && styles.typeChipSelected]}
                  onPress={() => setWorkloadType(t)}
                >
                  <Text style={[styles.typeChipText, workloadType === t && styles.typeChipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.pickerLabel, { marginTop: Spacing.md }]}>INSTANCE TYPE</Text>
            <View style={styles.pickerWrap}>
              {INSTANCE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, instanceType === t && styles.typeChipSelected]}
                  onPress={() => setInstanceType(t)}
                >
                  <Text style={[styles.typeChipText, instanceType === t && styles.typeChipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Duration (hours)"
              placeholder="e.g. 1.5"
              keyboardType="decimal-pad"
              value={duration}
              onChangeText={setDuration}
              style={{ marginTop: Spacing.md }}
            />
            <Input
              label="Estimated Power (watts)"
              placeholder="e.g. 100"
              keyboardType="decimal-pad"
              value={power}
              onChangeText={setPower}
            />
          </Card>

          <Button
            title="💡  Calculate Savings"
            onPress={calculateSavings}
            loading={loading}
            disabled={!selectedId}
            style={{ marginBottom: Spacing.xl }}
          />
        </>
      )}

      {/* ── Results Tab ────────────────────────────────────────────────────── */}
      {tab === 'results' && savings ? (
        <>
          <SectionHeader title="Carbon Savings Calculation" />
          <Card>
            <View style={styles.resultsGrid}>
              <ResultCell label="Local Emissions" value={savings.localEmissions} unit="gCO₂" color={Colors.error} />
              <ResultCell label="Cloud Emissions" value={savings.cloudEmissions} unit="gCO₂" color={Colors.textMuted} />
              <ResultCell label="Total Savings"   value={savings.savingsGCO2}    unit="gCO₂" color={Colors.success} />
              <ResultCell label="Reduction"       value={`${savings.savingsPercentage}%`}   color={Colors.primary} />
            </View>
            <View style={styles.regionTip}>
              <Text style={styles.regionTipText}>
                📍 {savings.region?.name} (AWS) · {savings.region?.carbonIntensity} gCO₂/kWh · {savings.region?.renewablePercentage}% renewable
              </Text>
            </View>
          </Card>

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
        <EmptyState icon="💡" title="No results yet" subtitle="Go to Calculate Savings to get started." />
      ) : null}

      {/* ── Workloads Tab ───────────────────────────────────────────────────── */}
      {tab === 'workloads' && (
        <>
          <SectionHeader
            title="My Cloud Workloads"
            action="Refresh"
            onAction={fetchWorkloads}
          />
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

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ResultCell({ label, value, unit, color }) {
  return (
    <View style={styles.resultCell}>
      <Text style={styles.resultCellLabel}>{label}</Text>
      <Text style={[styles.resultCellValue, color && { color }]}>
        {value}
        {unit && <Text style={styles.resultCellUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

function WorkloadCard({ workload, onTerminate }) {
  const status      = workload.status;
  const badgeVariant= status === 'running' ? 'running'
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
          <TouchableOpacity
            style={styles.terminateBtn}
            onPress={() => onTerminate(workload)}
          >
            <Text style={styles.terminateBtnText}>Terminate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  title:  { ...Typography.h1 },

  connBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  connDot:   { width: 7, height: 7, borderRadius: 3.5 },
  connText:  { fontSize: 11, fontWeight: '700' },

  desc: { ...Typography.body, marginBottom: Spacing.lg },

  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.full, padding: 4, marginBottom: Spacing.lg, ...Shadow.sm },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.full },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  pickerLabel: { ...Typography.label, marginBottom: Spacing.sm },
  pickerWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },

  typeChip: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipSelected: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  typeChipText:     { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  typeChipTextSelected: { color: Colors.primary },

  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
  },
  regionItemSelected: { backgroundColor: '#f0fdf4', borderRadius: Radius.sm },
  regionLeft: { flex: 1 },
  regionRight: { alignItems: 'flex-end' },
  regionName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  regionCode: { fontSize: 11, color: Colors.textMuted },
  regionCarbon: { fontSize: 12, fontWeight: '700', color: Colors.error },
  regionRenew: { fontSize: 11, color: Colors.success },

  regionTip: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  regionTipText: { fontSize: 12, color: Colors.primary, lineHeight: 18 },

  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  resultCell: { width: '47%', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md },
  resultCellLabel: { ...Typography.label, marginBottom: 4 },
  resultCellValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: Colors.textPrimary },
  resultCellUnit:  { fontSize: 12, fontWeight: '500', color: Colors.textMuted },

  workloadCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  workloadInfo: { flex: 1 },
  workloadType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  workloadMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  workloadRight: { alignItems: 'flex-end', gap: 4 },
  workloadSavings: { fontSize: 16, fontWeight: '800', color: Colors.success },
  workloadSavingsLabel: { fontSize: 10, color: Colors.textMuted },

  terminateBtn: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  terminateBtnText: { fontSize: 11, fontWeight: '700', color: Colors.error },
});
