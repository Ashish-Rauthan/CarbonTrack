// src/components/UI.js
// Reusable atomic components used across all screens.

import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../utils/theme';

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, unit, color, highlight }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={[styles.statLabel, highlight && { color: 'rgba(255,255,255,0.65)' }]}>
        {label}
      </Text>
      <Text style={[
        styles.statValue,
        color && { color },
        highlight && { color: '#fff' },
      ]}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon }) {
  const isSecondary = variant === 'secondary';
  const isDanger    = variant === 'danger';

  const bg = isDanger ? Colors.error
    : isSecondary ? Colors.surfaceAlt
    : Colors.primary;

  const textColor = (isSecondary) ? Colors.textPrimary : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[styles.btn, { backgroundColor: bg }, disabled && styles.btnDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Text style={[styles.btnIcon]}>{icon}</Text>}
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={[styles.inputWrap, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = 'neutral' }) {
  const variants = {
    success:  { bg: Colors.successLight,  text: Colors.primary },
    error:    { bg: Colors.errorLight,    text: Colors.error   },
    warning:  { bg: Colors.warningLight,  text: Colors.warning },
    neutral:  { bg: Colors.surfaceAlt,    text: Colors.textMuted },
    running:  { bg: Colors.accentLight,   text: Colors.primary },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
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
      <Text style={styles.loadingText}>{message}</Text>
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

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },

  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flex: 1,
    ...Shadow.sm,
  },
  statCardHighlight: {
    backgroundColor: Colors.primary,
  },
  statLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  btn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  btnIcon: { fontSize: 16 },

  inputWrap: { marginBottom: Spacing.md },
  inputLabel: {
    ...Typography.label,
    marginBottom: 6,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  inputErrorText: { fontSize: 12, color: Colors.error, marginTop: 4 },

  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...Typography.h3 },
  sectionAction: { fontSize: 13, fontWeight: '600', color: Colors.success },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: { ...Typography.body, color: Colors.textMuted },

  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    marginBottom: Spacing.md,
  },
  errorBoxText: { fontSize: 13, fontWeight: '500', color: Colors.error },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textMuted, textAlign: 'center' },
  emptySub: { ...Typography.small, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
