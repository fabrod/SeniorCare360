// SeniorCare360 Design System — Senior-optimized UI
export const Colors = {
  primary: '#1B6CA8',
  primaryLight: '#4A90D9',
  primaryDark: '#0D4F7C',
  accent: '#E8A020',
  accentLight: '#F5C553',
  accentDark: '#B87D15',
  success: '#2D9B5A',
  successLight: '#E8F7EE',
  warning: '#E8821A',
  warningLight: '#FEF3E2',
  danger: '#D63B3B',
  dangerLight: '#FDEAEA',
  emergency: '#CC2222',
  info: '#1B6CA8',
  infoLight: '#E3F0FB',
  white: '#FFFFFF',
  offWhite: '#F7F8FC',
  background: '#EDF2F8',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#4A5568',
  textMuted: '#9BA8B8',
  textOnPrimary: '#FFFFFF',
  border: '#D1D9E6',
  borderLight: '#E8EDF5',
  tabActive: '#1B6CA8',
  tabInactive: '#9BA8B8',
};

export const Typography = {
  displayXL: 32,
  displayL: 28,
  displayM: 24,
  heading1: 22,
  heading2: 20,
  heading3: 18,
  body: 17,
  bodySmall: 15,
  caption: 13,
  button: 18,
  buttonSmall: 16,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
};

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#1B6CA8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emergency: {
    shadowColor: '#CC2222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const MIN_TOUCH_TARGET = 56;
