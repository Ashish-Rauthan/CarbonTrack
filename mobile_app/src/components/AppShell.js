// src/components/AppShell.js
// Shared layout chrome — TopAppBar + BottomNavBar
// Glass & Gradient Rule: navigation uses glassmorphism (80% opacity + blur)
// No-Line Rule: no border separators, tonal shifts only

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';

// ── TopAppBar ────────────────────────────────────────────────────────────────
export function TopAppBar({ onMenuPress, onNotifPress }) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BlurView
        intensity={60}
        tint="light"
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.brand}>CarbonTrack</Text>
          </View>
          <TouchableOpacity
            onPress={onNotifPress}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </>
  );
}

// ── BottomNavBar ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'Dashboard', screen: 'Dashboard', icon: '⊞', iconActive: '⊞' },
  { name: 'Tracking',  screen: 'Tracker',   icon: '📈', iconActive: '📊' },
  { name: 'Cloud',     screen: 'Cloud',     icon: '☁',  iconActive: '☁' },
  { name: 'Reports',   screen: 'Reports',   icon: '⬚',  iconActive: '⬚' },
];

export function BottomNavBar({ activeScreen, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[
        styles.navBar,
        { paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {isActive ? item.iconActive : item.icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  // TopAppBar — glassy, floats above content
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    // Subtle botanical shadow below
    ...Shadow.sm,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brand: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.5,
    color: Colors.primary,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
  notifIcon: {
    fontSize: 20,
    color: Colors.primary,
  },

  // BottomNavBar — glassy pill tabs
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    // Inverted botanical shadow
    shadowColor: '#191c1c',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  navInner: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: Spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    gap: 2,
  },
  navItemActive: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  navIcon: {
    fontSize: 20,
    color: `${Colors.textPrimary}50`,
  },
  navIconActive: {
    color: Colors.primary,
  },
  navLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: `${Colors.textPrimary}50`,
  },
  navLabelActive: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
});