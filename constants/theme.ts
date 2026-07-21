// Design Tokens — Moklet Event Center
// Gunakan file ini sebagai satu-satunya sumber kebenaran untuk warna, spacing, dll.

export const Colors = {
  primary: '#C62828',
  primaryDark: '#B71C1C',
  primaryLight: '#FFEBEE',
  background: '#FFFFFF',
  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  textMain: '#212121',
  textSubtitle: '#757575',
  textPlaceholder: '#9E9E9E',
  white: '#FFFFFF',
  black: '#000000',
  divider: '#E0E0E0',
  error: '#C62828',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
} as const;

export const Typography = {
  displayLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textMain,
    lineHeight: 36,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textMain,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textMain,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textSubtitle,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSubtitle,
    lineHeight: 20,
  },
} as const;
