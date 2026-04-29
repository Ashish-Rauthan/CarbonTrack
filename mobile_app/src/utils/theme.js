// src/utils/theme.js
// "The Earthbound Editorial" Design System
// Based on Material Design 3 with editorial lens — Quiet Luxury for sustainability

import { Platform } from 'react-native';

// ── Color Palette ─────────────────────────────────────────────────────────────
export const Colors = {
  // Primary brand greens
  primary:        '#012d1d',   // Deep forest — the anchor
  primaryLight:   '#1b4332',   // Primary container
  primaryFixed:   '#c1ecd4',   // Soft mint
  primaryFixedDim:'#a5d0b9',

  // Accent / Tertiary — the "spark"
  accent:         '#7ffd8b',   // Tertiary fixed — bright lime
  accentDim:      '#61df72',   // Tertiary fixed dim
  accentLight:    '#c1ecd4',   // Soft accent background

  // Surfaces — tonal depth hierarchy
  surface:              '#f9f9f8',   // Level 0 — the canvas
  surfaceContainerLow:  '#f3f4f3',   // Level 1 — sidebars / utility
  surfaceContainer:     '#edeeed',   // Level 1.5
  surfaceContainerHigh: '#e7e8e7',   // Level 3 — hover/active
  surfaceContainerHighest: '#e1e3e2',
  surfaceContainerLowest:  '#ffffff', // Level 2 — primary cards
  surfaceDim:     '#d9dad9',          // For modal underlays

  // Text
  textPrimary:    '#191c1c',   // on-surface — never pure black
  textSecondary:  '#414844',   // on-surface-variant
  textMuted:      '#717973',   // outline

  // Semantic
  error:          '#ba1a1a',
  errorLight:     '#ffdad6',
  success:        '#2c694e',   // secondary
  successLight:   '#aeeecb',   // secondary-container
  warning:        '#e68900',
  warningLight:   '#ffeeba',

  // Secondary
  secondary:          '#2c694e',
  secondaryContainer: '#aeeecb',
  secondaryFixed:     '#b1f0ce',
  secondaryFixedDim:  '#95d4b3',
  onSecondaryContainer: '#316e52',

  // Tertiary (bright green highlight)
  tertiary:           '#002d0a',
  tertiaryFixed:      '#7ffd8b',
  tertiaryFixedDim:   '#61df72',
  onTertiaryContainer: '#3cbd54',

  // Outlines (ghost borders only)
  outline:        '#717973',
  outlineVariant: '#c1c8c2',

  // Legacy aliases for backward compat
  background:     '#f9f9f8',
  surfaceAlt:     '#f3f4f3',
  border:         'rgba(193,200,194,0.20)',
};

// ── Typography — Earthbound Editorial ────────────────────────────────────────
// Manrope for display/headlines (editorial authority)
// Inter for body/labels (workhorse legibility)
export const Typography = {
  // Display (Manrope — large editorial moments)
  displayLg: { fontFamily: 'Manrope_800ExtraBold', fontSize: 44, letterSpacing: -1.2, color: Colors.primary },
  displayMd: { fontFamily: 'Manrope_800ExtraBold', fontSize: 36, letterSpacing: -0.9, color: Colors.primary },
  displaySm: { fontFamily: 'Manrope_700Bold',      fontSize: 28, letterSpacing: -0.7, color: Colors.primary },

  // Headlines (Manrope)
  headlineLg: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: -0.5, color: Colors.primary },
  headlineMd: { fontFamily: 'Manrope_700Bold',      fontSize: 20, letterSpacing: -0.4, color: Colors.primary },
  headlineSm: { fontFamily: 'Manrope_600SemiBold',  fontSize: 16, letterSpacing: -0.2, color: Colors.primary },

  // Body (Inter — data / long form)
  bodyLg:  { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: Colors.textSecondary },
  bodyMd:  { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  bodySm:  { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, color: Colors.textMuted },

  // Labels (Inter — UI chrome)
  labelLg:  { fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.1,  color: Colors.textSecondary },
  labelMd:  { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.5,  color: Colors.textMuted },
  labelSm:  { fontFamily: 'Inter_700Bold',     fontSize: 10, letterSpacing: 0.8,  color: Colors.textMuted, textTransform: 'uppercase' },
  labelXs:  { fontFamily: 'Inter_700Bold',     fontSize: 9,  letterSpacing: 1.2,  color: Colors.textMuted, textTransform: 'uppercase' },

  // Legacy aliases
  h1:    { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, letterSpacing: -0.5, color: Colors.primary },
  h2:    { fontFamily: 'Manrope_700Bold',      fontSize: 22, letterSpacing: -0.3, color: Colors.textPrimary },
  h3:    { fontFamily: 'Manrope_700Bold',      fontSize: 17, letterSpacing: -0.2, color: Colors.textPrimary },
  body:  { fontFamily: 'Inter_400Regular',     fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  small: { fontFamily: 'Inter_500Medium',      fontSize: 12, color: Colors.textMuted },
  label: { fontFamily: 'Inter_700Bold',        fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.textMuted },
};

// ── Spacing — 4pt base grid ───────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
// DESIGN.md: lg=1rem for cards, md=0.75rem for nested elements
export const Radius = {
  xs:   4,
  sm:   8,    // DEFAULT
  md:   12,   // Buttons, chips, inputs (0.75rem)
  lg:   16,   // Main cards (1rem)
  xl:   24,   // Large cards, modals
  full: 9999,
};

// ── Botanical Shadows — diffused light, never harsh ───────────────────────────
export const Shadow = {
  // Botanical shadow: blur 40px, spread 0, rgba(25,28,28,0.06)
  botanical: {
    shadowColor: '#191c1c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  sm: {
    shadowColor: '#191c1c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#191c1c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#191c1c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
};