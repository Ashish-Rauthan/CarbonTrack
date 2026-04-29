// src/screens/TrackerScreen.js
// "The Earthbound Editorial" — Real-time Carbon Intensity Tracking
// Design: Circular gauge as hero, tonal surface layering, primary gradient CTA
// Backend logic: UNCHANGED — same estimation formula, same API calls

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { emissionsAPI } from '../services/api';
import { Button, SectionHeader, ErrorBox } from '../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';

const { width } = Dimensions.get('window');

// ── Activity definitions — UNCHANGED from backend spec ────────────────────────
const ACTIVITIES = [
  { id: 'idle',     label: 'Idle',            icon: '💤', power: 1,  desc: '~1W — screen on, minimal CPU' },
  { id: 'browsing', label: 'Web Browsing',    icon: '🌐', power: 3,  desc: '~3W — light browser activity' },
  { id: 'video',    label: 'Video Streaming', icon: '🎬', power: 4,  desc: '~4W — CPU + GPU active' },
  { id: 'gaming',   label: 'Gaming / ML',     icon: '🎮', power: 6,  desc: '~6W — high CPU/GPU load' },
];

const DEFAULT_CARBON_INTENSITY = 500;

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Circular Gauge ─────────────────────────────────────────────────────────────
function CircularGauge({ value, unit, progress = 0 }) {
  const SIZE = 240;
  const STROKE = 14;
  const R = (SIZE - STROKE * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const strokeDash = CIRCUMFERENCE * Math.max(0, Math.min(1, progress));

  return (
    <View style={gaugeStyles.container}>
      <Svg width={SIZE} height={SIZE} style={gaugeStyles.svg}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.accent} />
            <Stop offset="1" stopColor={Colors.primaryLight} />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={Colors.surfaceContainerHigh}
          strokeWidth={STROKE}
          fill="none"
          opacity={0.5}
        />
        {/* Fill */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="url(#gaugeGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={gaugeStyles.innerContent}>
        <Text style={gaugeStyles.value}>{value}</Text>
        <Text style={gaugeStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: { position: 'absolute' },
  innerContent: { alignItems: 'center' },
  value: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 44,
    letterSpacing: -1.2,
    color: Colors.primary,
    lineHeight: 50,
  },
  unit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 4,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TrackerScreen() {
  const insets = useSafeAreaInsets();

  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [tracking,   setTracking]   = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [result,     setResult]     = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const startTime   = useRef(null);
  const sessionId   = useRef(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Pulse animation for the "live" dot
  useEffect(() => {
    if (tracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [tracking]);

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

    // ── Client-side estimation (thin client) — UNCHANGED ──────────────────
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

  const liveEnergyKwh = tracking ? (selectedActivity.power * (elapsed / 3600)) / 1000 : 0;
  const liveEmissions  = liveEnergyKwh * DEFAULT_CARBON_INTENSITY;
  const gaugeProgress  = Math.min(1, liveEmissions / 10); // scale: 10g = full
  const gaugeValue     = tracking ? liveEmissions.toFixed(4) : '0.00';

  const headerHeight = insets.top + 64;
  const bottomPad    = insets.bottom + 80;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── System Status Badge ─────────────────────────────────────────── */}
      <View style={styles.statusBadgeWrap}>
        <View style={[styles.statusBadge, tracking && styles.statusBadgeActive]}>
          <Animated.View style={[styles.statusDot, tracking && styles.statusDotActive, { transform: [{ scale: tracking ? pulseAnim : 1 }] }]} />
          <Text style={[styles.statusText, tracking && styles.statusTextActive]}>
            {tracking ? 'TRACKING LIVE' : 'SYSTEM READY'}
          </Text>
        </View>
      </View>

      {/* ── Circular Gauge Hero ──────────────────────────────────────────── */}
      <View style={styles.gaugeSection}>
        <CircularGauge
          value={tracking ? liveEmissions.toFixed(4) : '0.42'}
          unit="kg CO2e/s"
          progress={tracking ? gaugeProgress : 0.3}
        />
        <Text style={styles.gaugeSubLabel}>
          REAL-TIME CARBON INTENSITY LOAD{'\n'}
          {tracking ? 'SESSION ACTIVE' : 'LOCAL CONSOLE ACTIVE'}
        </Text>
      </View>

      {/* ── Activity Selector ────────────────────────────────────────────── */}
      <SectionHeader title="Activity Type" />
      <View style={styles.activitiesGrid}>
        {ACTIVITIES.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={[
              styles.activityCard,
              selectedActivity.id === act.id && styles.activityCardSelected,
              tracking && styles.activityCardDisabled,
            ]}
            onPress={() => { if (!tracking) setSelectedActivity(act); }}
            activeOpacity={0.82}
            disabled={tracking}
          >
            <Text style={styles.activityIcon}>{act.icon}</Text>
            <Text style={[styles.activityLabel, selectedActivity.id === act.id && styles.activityLabelActive]}>
              {act.label}
            </Text>
            <Text style={styles.activityPower}>{act.power}W</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.activityDesc}>{selectedActivity.desc}</Text>

      {/* ── Live stats when tracking ─────────────────────────────────────── */}
      {tracking && (
        <View style={styles.liveStatsRow}>
          <View style={styles.liveStatCard}>
            <Text style={styles.liveStatLabel}>Duration</Text>
            <Text style={styles.liveStatValue}>{formatDuration(elapsed)}</Text>
          </View>
          <View style={styles.liveStatCard}>
            <Text style={styles.liveStatLabel}>Energy</Text>
            <Text style={styles.liveStatValue}>{liveEnergyKwh.toFixed(6)}</Text>
            <Text style={styles.liveStatUnit}>kWh</Text>
          </View>
          <View style={[styles.liveStatCard, styles.liveStatCardAccent]}>
            <Text style={[styles.liveStatLabel, { color: Colors.error }]}>CO₂e</Text>
            <Text style={[styles.liveStatValue, { color: Colors.error }]}>{liveEmissions.toFixed(4)}</Text>
            <Text style={styles.liveStatUnit}>gCO₂</Text>
          </View>
        </View>
      )}

      {/* ── CTAs ─────────────────────────────────────────────────────────── */}
      <View style={styles.ctaSection}>
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

        <Button
          title="💾  Stop and Save"
          onPress={tracking ? stopTracking : undefined}
          variant="secondary"
          disabled={!tracking}
        />
      </View>

      {/* ── Mini stat cards ──────────────────────────────────────────────── */}
      <View style={styles.miniCardsRow}>
        <MiniCard icon="🖥️" label="Local Instances" value="12" unit="Nodes" />
        <MiniCard icon="⏱️" label="Poll Rate" value="250" unit="ms" />
      </View>

      {/* ── Result card ──────────────────────────────────────────────────── */}
      {result && !tracking && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>✅ Session Complete</Text>
          <ResultRow label="Activity"   value={`${result.activity.icon} ${result.activity.label}`} />
          <ResultRow label="Duration"   value={formatDuration(result.duration_seconds)} />
          <ResultRow label="Energy"     value={`${result.energy_kwh.toFixed(6)} kWh`} />
          <ResultRow label="CO₂ emitted" value={`${result.emissions_gco2.toFixed(4)} gCO₂`} valueColor={Colors.error} />
        </View>
      )}

      {/* ── Info box ─────────────────────────────────────────────────────── */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How estimation works</Text>
        <Text style={styles.infoText}>
          Energy (kWh) = Power (W) × Duration (h) ÷ 1000{'\n'}
          CO₂ = Energy × {DEFAULT_CARBON_INTENSITY} gCO₂/kWh (avg. grid intensity){'\n\n'}
          For precise hardware readings, use the desktop Python app with CodeCarbon.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MiniCard({ icon, label, value, unit }) {
  return (
    <View style={styles.miniCard}>
      <View style={styles.miniCardTop}>
        <Text style={styles.miniCardIcon}>{icon}</Text>
        <Text style={styles.miniCardLabel}>{label}</Text>
      </View>
      <View style={styles.miniCardBottom}>
        <Text style={styles.miniCardValue}>{value}</Text>
        <Text style={styles.miniCardUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function ResultRow({ label, value, valueColor }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.lg },

  // Status badge
  statusBadgeWrap: { alignItems: 'center', marginBottom: Spacing.lg },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.successLight}50`,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}15`,
  },
  statusBadgeActive: {
    backgroundColor: `${Colors.accentLight}60`,
    borderColor: `${Colors.accent}30`,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onTertiaryContainer,
  },
  statusDotActive: { backgroundColor: Colors.accent },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.onSecondaryContainer,
  },
  statusTextActive: { color: Colors.primary },

  // Gauge section
  gaugeSection: { alignItems: 'center', marginBottom: Spacing.lg },
  gaugeSubLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.outlineVariant,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.lg,
  },

  // Activity grid
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  activityCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surfaceContainerLowest,
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
  activityCardDisabled: { opacity: 0.4 },
  activityIcon:  { fontSize: 28 },
  activityLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  activityLabelActive: { color: Colors.primary },
  activityPower: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
  },
  activityDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    paddingLeft: 4,
    lineHeight: 18,
  },

  // Live stats
  liveStatsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  liveStatCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  liveStatCardAccent: { backgroundColor: `${Colors.errorLight}60` },
  liveStatLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  liveStatValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    letterSpacing: -0.3,
    color: Colors.primary,
  },
  liveStatUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },

  // CTAs
  ctaSection: { marginBottom: Spacing.lg },

  // Mini cards
  miniCardsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  miniCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  miniCardIcon: { fontSize: 16 },
  miniCardLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    flex: 1,
  },
  miniCardBottom: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  miniCardValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.primary,
  },
  miniCardUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.onSecondaryContainer,
  },

  // Result card
  resultCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.botanical,
  },
  resultTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: Colors.success,
    marginBottom: Spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    // No border — white space separates items (No-Line Rule)
    // Subtle background shift every other row instead
  },
  resultLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  resultValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Info box
  infoBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentLight,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});