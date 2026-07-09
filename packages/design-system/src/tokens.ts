export const colors = {
  brand: {
    dark: "#0E3C1D",
    primary: "#25662C",
    action: "#358439",
    soft: "#B3CBB1",
  },
  surface: {
    app: "#F5F7F2",
    default: "#FFFFFF",
    muted: "#ECF5E8",
    warning: "#FFF4D8",
    danger: "#FDEBE8",
    community: "#EAF0FF",
  },
  text: {
    primary: "#183B24",
    secondary: "#636560",
    inverse: "#FFFFFF",
    muted: "#7B8178",
  },
  border: {
    default: "#DDE5DA",
    strong: "#B3CBB1",
    focus: "#358439",
  },
  status: {
    success: "#358439",
    warning: "#F49F0E",
    danger: "#D94132",
    info: "#2E63E6",
  },
  data: {
    soil: "#7A3B22",
    community: "#2E63E6",
    agriculture: "#358439",
    ph: "#F49F0E",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    android: "Roboto",
    web: "Inter",
  },
  fontSize: {
    caption: 12,
    small: 13,
    body: 15,
    input: 16,
    sectionTitle: 18,
    title: 24,
    display: 34,
  },
  lineHeight: {
    caption: 16,
    small: 19,
    body: 22,
    input: 24,
    sectionTitle: 24,
    title: 30,
    display: 38,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "700",
    bold: "800",
    heavy: "900",
  },
  letterSpacing: {
    default: 0,
  },
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
  circle: "50%",
} as const;

export const status = {
  success: {
    label: "Bom",
    color: colors.status.success,
    background: colors.surface.muted,
    text: colors.brand.primary,
  },
  warning: {
    label: "Razoável",
    color: colors.status.warning,
    background: colors.surface.warning,
    text: "#7A4B00",
  },
  danger: {
    label: "Inadequado",
    color: colors.status.danger,
    background: colors.surface.danger,
    text: "#8D2018",
  },
  info: {
    label: "Comunidade",
    color: colors.status.info,
    background: colors.surface.community,
    text: "#1F4297",
  },
  offline: {
    label: "Offline",
    color: colors.brand.primary,
    background: colors.surface.muted,
    text: colors.brand.dark,
  },
} as const;

export type PhBound = "inclusive" | "exclusive";

export type PhScaleRangeBand = {
  kind: "range";
  label: string;
  range: readonly [number, number];
  lowerBound: PhBound;
  upperBound: PhBound;
  color: string;
  status: string;
};

export type PhScalePointBand = {
  kind: "point";
  label: string;
  value: number;
  color: string;
  status: string;
};

export type PhScaleBand = PhScaleRangeBand | PhScalePointBand;

export type PhScale = {
  acidic: PhScaleRangeBand;
  favorable: PhScaleRangeBand;
  nearNeutral: PhScaleRangeBand;
  neutral: PhScalePointBand;
  alkaline: PhScaleRangeBand;
};

export const phScale = {
  acidic: {
    kind: "range",
    label: "Ácido",
    range: [0, 5.6],
    lowerBound: "inclusive",
    upperBound: "exclusive",
    color: colors.status.danger,
    status: status.danger.label,
  },
  favorable: {
    kind: "range",
    label: "Favorável",
    range: [5.6, 6.5],
    lowerBound: "inclusive",
    upperBound: "inclusive",
    color: colors.status.success,
    status: status.success.label,
  },
  nearNeutral: {
    kind: "range",
    label: "Quase neutro",
    range: [6.5, 7],
    lowerBound: "exclusive",
    upperBound: "exclusive",
    color: colors.status.warning,
    status: status.warning.label,
  },
  // Neutral is a single pH value in @ndjar/domain, not a visual range.
  neutral: {
    kind: "point",
    label: "Neutro",
    value: 7,
    color: colors.status.info,
    status: status.info.label,
  },
  alkaline: {
    kind: "range",
    label: "Alcalino",
    range: [7, 14],
    lowerBound: "exclusive",
    upperBound: "inclusive",
    color: colors.data.soil,
    status: status.warning.label,
  },
} as const satisfies PhScale;

export const elevation = {
  none: {
    web: "none",
    android: 0,
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    },
  },
  card: {
    web: "0 1px 2px rgba(14, 60, 29, 0.08)",
    android: 1,
    ios: {
      shadowColor: "#0E3C1D",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
  },
  sheet: {
    web: "0 8px 24px rgba(14, 60, 29, 0.12)",
    android: 3,
    ios: {
      shadowColor: "#0E3C1D",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
  },
} as const;

export const breakpoints = {
  phone: 360,
  largePhone: 520,
  tablet: 720,
  desktop: 1040,
  wide: 1180,
} as const;

export const touchTargets = {
  iosMin: 44,
  androidMin: 48,
  iconButton: 48,
  inputMinHeight: 48,
  bottomTabHeight: 64,
  touchGap: 8,
} as const;

export const components = {
  card: {
    background: colors.surface.default,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.lg,
    elevation: elevation.card,
  },
  button: {
    primaryBackground: colors.brand.action,
    primaryText: colors.text.inverse,
    secondaryBackground: colors.surface.default,
    secondaryText: colors.brand.primary,
    borderRadius: radius.md,
    minHeight: touchTargets.androidMin,
    paddingHorizontal: spacing.lg,
  },
  input: {
    background: colors.surface.default,
    borderColor: colors.border.default,
    focusBorderColor: colors.border.focus,
    borderRadius: radius.md,
    minHeight: touchTargets.inputMinHeight,
    paddingHorizontal: spacing.md,
  },
  bottomTab: {
    minHeight: touchTargets.bottomTabHeight,
    activeColor: colors.brand.action,
    inactiveColor: colors.text.muted,
    background: colors.surface.default,
    borderColor: colors.border.default,
  },
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  status,
  phScale,
  elevation,
  breakpoints,
  touchTargets,
  components,
} as const;
