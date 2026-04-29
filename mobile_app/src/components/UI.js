// src/components/UI.js
// "The Earthbound Editorial" — Reusable atomic components
// No-Line Rule: boundaries via background shifts, not borders
// Ghost Borders only where accessibility demands it

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../utils/theme';

// ── Card ─────────────────────────────────────────────────────────────────────
// Level 2: surface-container-lowest (#fff) lifts against surface (#f9f9f8)
export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, unit, color, highlight }) {
  if (highlight) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statCard, styles.statCardGradient]}
      >
        <Text style={[styles.statLabel, { color: 'rgba(193,236,212,0.65)' }]}>{label}</Text>
        <Text style={[styles.statValue, { color: '#fff' }]}>
          {value}
          {unit && <Text style={[styles.statUnit, { color: 'rgba(193,236,212,0.55)' }]}> {unit}</Text>}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
// Primary: gradient from primary → primary_container (signature texture)
// Secondary: surface-container-high, no border
// Danger: error bg
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon }) {
  const isDanger    = variant === 'danger';
  const isSecondary = variant === 'secondary';

  if (variant === 'primary' && !isDanger && !isSecondary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#91a89e', '#91a89e'] : [Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, styles.btnGradient]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon && <Text style={styles.btnIcon}>{icon}</Text>}
              <Text style={[styles.btnText, { color: '#fff' }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg = isDanger ? Colors.error : Colors.surfaceContainerHigh;
  const textColor = isDanger ? '#fff' : Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: (disabled || loading) ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Text style={styles.btnIcon}>{icon}</Text>}
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
// Idle: surface-container-lowest bg + ghost border (outline-variant at 20%)
// Focus: border transitions to primary at 100%
export function Input({ label, error, style, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[styles.inputWrap, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = 'neutral' }) {
  const variants = {
    success: { bg: Colors.successLight,    text: Colors.success },
    error:   { bg: Colors.errorLight,      text: Colors.error   },
    warning: { bg: Colors.warningLight,    text: Colors.warning },
    neutral: { bg: Colors.surfaceContainerHigh, text: Colors.textMuted },
    running: { bg: Colors.accentLight,     text: Colors.primary },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
// Uses white space instead of divider lines (Forbid Divider Lines rule)
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── LoadingOverlay ────────────────────────────────────────────────────────────
export function LoadingOverlay({ message = 'Loading…' }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message ? <Text style={styles.loadingText}>{message}</Text> : null}
    </View>
  );
}

// ── ErrorBox ──────────────────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorBoxText}>{message}</Text>
    </View>
  );
}

// ── Divider — FORBIDDEN by design system (use white space instead) ─────────
// Included only for data list separations where absolutely needed
export function Divider({ style }) {
  // Render as spacing-only, not as a visible line (No-Line Rule)
  return <View style={[{ height: Spacing.md }, style]} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ── LeafProgressBar — Signature Sustainability Component ──────────────────────
// Track: surface-container-high | Fill: secondary → tertiary-fixed-dim gradient
export function LeafProgressBar({ progress = 0, height = 6, style }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.leafTrack, { height }, style]}>
      <LinearGradient
        colors={[Colors.success, Colors.accentDim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.leafFill, { width: `${pct * 100}%`, height }]}
      />
    </View>
  );
}

// ── ImpactBadge — tertiary-fixed tag for key metrics ─────────────────────────
export function ImpactBadge({ label }) {
  return (
    <View style={styles.impactBadge}>
      <Text style={styles.impactBadgeText}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Card — Level 2 surface
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.botanical,
  },

  // StatCard
  statCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flex: 1,
    ...Shadow.sm,
  },
  statCardGradient: {
    // Applied via LinearGradient wrapper
  },
  statLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.primary,
  },
  statUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Button
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnGradient: {
    ...Shadow.md,
  },
  btnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  btnIcon: { fontSize: 16 },

  // Input
  inputWrap: { marginBottom: Spacing.md },
  inputLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    // Ghost border: outline-variant at 20% opacity
    borderWidth: 1,
    borderColor: 'rgba(193,200,194,0.20)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputErrorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    paddingLeft: 4,
  },

  // Badge
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.4,
  },

  // SectionHeader — white space as structural element (no divider lines)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
    color: Colors.primary,
  },
  sectionAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.onSecondaryContainer,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Error
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    marginBottom: Spacing.md,
  },
  errorBoxText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.error,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIcon:  { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Leaf progress bar
  leafTrack: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  leafFill: {
    borderRadius: Radius.full,
  },

  // Impact badge (tertiary-fixed)
  impactBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  impactBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    color: '#002106',
    textTransform: 'uppercase',
  },
});