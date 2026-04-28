// src/utils/theme.js

export const Colors = {
  primary:        '#012d1d',
  primaryLight:   '#1b4332',
  accent:         '#7ffd8b',
  accentLight:    '#c1ecd4',
  background:     '#f9f9f8',
  surface:        '#ffffff',
  surfaceAlt:     '#f3f4f3',
  border:         'rgba(193,200,194,0.25)',
  textPrimary:    '#191c1c',
  textSecondary:  '#414844',
  textMuted:      '#717973',
  error:          '#ba1a1a',
  errorLight:     '#ffdad6',
  success:        '#2c694e',
  successLight:   '#aeeecb',
  warning:        '#e68900',
  warningLight:   '#ffeeba',
};

export const Typography = {
  h1:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: Colors.primary },
  h2:    { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: Colors.textPrimary },
  h3:    { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: Colors.textPrimary },
  body:  { fontSize: 15, fontWeight: '400', color: Colors.textSecondary, lineHeight: 22 },
  small: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.textMuted },
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#191c1c', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  md: {
    shadowColor: '#191c1c', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  lg: {
    shadowColor: '#191c1c', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 8,
  },
};
