// src/screens/TrackerScreen.js
// Thin-client: local session timer + simple power estimation → POST to backend.
// No CodeCarbon, no Python — pure frontend estimation as per architecture spec.

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { emissionsAPI } from '../services/api';
import { Card, Button, SectionHeader, ErrorBox } from '../components/UI';
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';

// ── Activity definitions ──────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'idle',     label: 'Idle',           icon: '💤', power: 1,  desc: '~1W — screen on, minimal CPU' },
  { id: 'browsing', label: 'Web Browsing',   icon: '🌐', power: 3,  desc: '~3W — light browser activity' },
  { id: 'video',    label: 'Video Streaming',icon: '🎬', power: 4,  desc: '~4W — CPU + GPU active' },
  { id: 'gaming',   label: 'Gaming / ML',    icon: '🎮', power: 6,  desc: '~6W — high CPU/GPU load' },
];

// Default carbon intensity (gCO₂/kWh) when backend value isn't fetched
const DEFAULT_CARBON_INTENSITY = 500;

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TrackerScreen() {
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [tracking,   setTracking]   = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [result,     setResult]     = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');

  const intervalRef = useRef(null);
  const startTime   = useRef(null);
  const sessionId   = useRef(null);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startTracking = () => {
    setResult(null);
    setError('');
    startTime.current = Date.now();
    sessionId.current = `mob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setElapsed(0);
    setTracking(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  };

  const stopTracking = async () => {
    clearInterval(intervalRef.current);
    setTracking(false);

    const durationSeconds = Math.floor((Date.now() - startTime.current) / 1000);
    if (durationSeconds < 1) {
      setError('Session too short. Please track for at least 1 second.');
      return;
    }

    // ── Client-side estimation (thin client) ──
    // energy_kwh = (power_watts * duration_hours) / 1000
    const durationHours = durationSeconds / 3600;
    const energyKwh     = (selectedActivity.power * durationHours) / 1000;
    const emissionsGco2 = energyKwh * DEFAULT_CARBON_INTENSITY;

    const payload = {
      session_id:       sessionId.current,
      device_id:        'mobile-app',
      timestamp:        new Date().toISOString(),
      energy_kwh:       parseFloat(energyKwh.toFixed(8)),
      emissions_gco2:   parseFloat(emissionsGco2.toFixed(6)),
      duration_seconds: durationSeconds,
      metadata: {
        source:        'estimated',
        activity:      selectedActivity.id,
        power_watts:   selectedActivity.power,
        platform:      'mobile',
      },
    };

    setResult({ ...payload, activity: selectedActivity });
    setUploading(true);
    setError('');

    try {
      await emissionsAPI.log(payload);
      Alert.alert('✅ Session Saved', 'Your emissions data has been uploaded to the dashboard.');
    } catch (err) {
      setError('Failed to upload data: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // ── Live calculation preview ─────────────────────────────────────────────
  const liveEnergyKwh    = tracking
    ? (selectedActivity.power * (elapsed / 3600)) / 1000
    : 0;
  const liveEmissions = liveEnergyKwh * DEFAULT_CARBON_INTENSITY;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Local Tracker</Text>
        <View style={styles.estimatedBadge}>
          <Text style={styles.estimatedBadgeText}>~ Estimated Tracking</Text>
        </View>
      </View>
      <Text style={styles.desc}>
        Select your current activity, then start tracking. The app estimates emissions
        based on typical device power draw and uploads results to your dashboard.
      </Text>

      {/* Activity selector */}
      <SectionHeader title="Activity Type" />
      <View style={styles.activitiesGrid}>
        {ACTIVITIES.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={[
              styles.activityCard,
              selectedActivity.id === act.id && styles.activityCardSelected,
              tracking && { opacity: 0.5 },
            ]}
            onPress={() => { if (!tracking) setSelectedActivity(act); }}
            activeOpacity={0.82}
            disabled={tracking}
          >
            <Text style={styles.activityIcon}>{act.icon}</Text>
            <Text style={[
              styles.activityLabel,
              selectedActivity.id === act.id && { color: Colors.primary },
            ]}>
              {act.label}
            </Text>
            <Text style={styles.activityPower}>{act.power}W</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.activityDesc}>{selectedActivity.desc}</Text>

      {/* Live tracking display */}
      <View style={[styles.trackerCard, tracking && styles.trackerCardActive]}>
        {tracking ? (
          <>
            <View style={styles.trackerPulse}>
              <View style={styles.pulseDot} />
              <Text style={styles.trackerLive}>TRACKING LIVE</Text>
            </View>
            <Text style={styles.trackerElapsed}>{formatDuration(elapsed)}</Text>
            <View style={styles.trackerStats}>
              <LiveStat label="Energy" value={liveEnergyKwh.toFixed(6)} unit="kWh" />
              <LiveStat label="CO₂e" value={liveEmissions.toFixed(4)} unit="gCO₂" color={Colors.error} />
            </View>
            <Text style={styles.trackerActivity}>
              {selectedActivity.icon} {selectedActivity.label} · {selectedActivity.power}W
            </Text>
          </>
        ) : (
          <View style={styles.trackerIdle}>
            <Text style={styles.trackerIdleIcon}>⏱</Text>
            <Text style={styles.trackerIdleText}>Press Start to begin tracking</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <ErrorBox message={error} />

      {!tracking ? (
        <Button
          title="▶  Start Tracking"
          onPress={startTracking}
          style={{ marginBottom: Spacing.sm }}
        />
      ) : (
        <Button
          title="⏹  Stop & Save"
          onPress={stopTracking}
          loading={uploading}
          variant="danger"
          style={{ marginBottom: Spacing.sm }}
        />
      )}

      {/* Result card */}
      {result && !tracking && (
        <Card>
          <Text style={styles.resultTitle}>✅ Session Complete</Text>
          <ResultRow label="Activity"   value={`${result.activity.icon} ${result.activity.label}`} />
          <ResultRow label="Duration"   value={formatDuration(result.duration_seconds)} />
          <ResultRow label="Energy"     value={`${result.energy_kwh.toFixed(6)} kWh`} />
          <ResultRow label="CO₂ emitted" value={`${result.emissions_gco2.toFixed(4)} gCO₂`} color={Colors.error} />
          <ResultRow label="Source"     value="~ Estimated" />
        </Card>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How estimation works</Text>
        <Text style={styles.infoText}>
          Energy (kWh) = Power (W) × Duration (h) ÷ 1000{'\n'}
          CO₂ = Energy × {DEFAULT_CARBON_INTENSITY} gCO₂/kWh (avg. grid intensity){'\n\n'}
          For precise hardware readings, use the desktop Python app with CodeCarbon.
        </Text>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function LiveStat({ label, value, unit, color }) {
  return (
    <View style={styles.liveStatCell}>
      <Text style={styles.liveStatLabel}>{label}</Text>
      <Text style={[styles.liveStatValue, color && { color }]}>{value}</Text>
      <Text style={styles.liveStatUnit}>{unit}</Text>
    </View>
  );
}

function ResultRow({ label, value, color }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  title:  { ...Typography.h1 },
  estimatedBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estimatedBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  desc:   { ...Typography.body, marginBottom: Spacing.md },

  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  activityCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  activityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0fdf4',
  },
  activityIcon:  { fontSize: 28 },
  activityLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  activityPower: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  activityDesc:  { ...Typography.small, marginBottom: Spacing.lg, paddingHorizontal: 4 },

  trackerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 160,
    justifyContent: 'center',
    ...Shadow.md,
  },
  trackerCardActive: { backgroundColor: Colors.primary },

  trackerPulse:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  pulseDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  trackerLive:    { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 1.5 },
  trackerElapsed: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: Spacing.md },
  trackerStats:   { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.sm },
  trackerActivity:{ fontSize: 12, color: 'rgba(193,236,212,0.7)', marginTop: Spacing.sm },

  liveStatCell:  { alignItems: 'center' },
  liveStatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(193,236,212,0.65)', letterSpacing: 0.8, textTransform: 'uppercase' },
  liveStatValue: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  liveStatUnit:  { fontSize: 10, fontWeight: '500', color: 'rgba(193,236,212,0.65)' },

  trackerIdle:     { alignItems: 'center', gap: Spacing.sm },
  trackerIdleIcon: { fontSize: 40 },
  trackerIdleText: { ...Typography.body, color: Colors.textMuted },

  resultTitle: { ...Typography.h3, marginBottom: Spacing.md, color: Colors.success },
  resultRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resultLabel: { ...Typography.body, color: Colors.textMuted },
  resultValue: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },

  infoBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentLight,
    marginBottom: Spacing.md,
  },
  infoTitle: { ...Typography.label, color: Colors.primary, marginBottom: 6 },
  infoText:  { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
});
