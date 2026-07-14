import type { CSSProperties } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Shared design tokens for the entire Admin Panel (AdminDashboard.tsx and
// every tab it renders: Candidates, Round Settings, Analytics, Hiring
// Monitor, Resume Pool, AI Bulk Pool, Panel Members/Assignments/Evaluations,
// and the admin login screen).
//
// Before this file existed, every admin screen picked its own accent color
// (orange, indigo, sky-blue, plain blue, cyan) and its own radius/shadow
// scale. This is the single source of truth going forward — import from
// here instead of hand-rolling hex codes or px values in a new admin page.
// ─────────────────────────────────────────────────────────────────────────

export const COLORS = {
  brand: '#2563EB',
  brandHover: '#1D4ED8',
  brandTint: '#EFF6FF',
  brandBorder: '#BFDBFE',

  success: '#22C55E',
  successDark: '#15803D',
  successTint: '#F0FDF4',
  successBorder: '#BBF7D0',

  danger: '#EF4444',
  dangerDark: '#B91C1C',
  dangerTint: '#FEF2F2',
  dangerBorder: '#FECACA',

  warning: '#D97706',
  warningDark: '#B45309',
  warningTint: '#FFFBEB',
  warningBorder: '#FDE68A',

  neutral: '#64748B',
  neutralTint: '#F1F5F9',
  neutralBorder: '#E2E8F0',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  surface: '#FFFFFF',
  pageBg: '#F8FAFC',
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',

  // Shell surfaces — sidebar and header share one dark family (slightly different
  // shades so they read as related, not identical). Active/accent state inside the
  // dark shell uses a muted slate-blue (not the vivid brand blue) so it blends into
  // the dark theme instead of popping — the vivid brand blue stays reserved for
  // buttons and links on light surfaces.
  shellSidebarBg: '#0F172A',
  shellHeaderBg: '#1E293B',
  shellBorder: 'rgba(255,255,255,0.08)',
  shellText: '#94A3B8',
  shellTextDim: '#64748B',
  shellActiveBg: '#3E4C63',
  shellActiveText: '#FFFFFF',
  // Softer highlight for "a child of this group is active" — not a full solid
  // fill (that's reserved for the actual selected leaf item).
  shellActiveTextSoft: '#60A5FA',
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
} as const;

export const SHADOW = {
  sm: '0 1px 2px rgba(15,23,42,0.04)',
  md: '0 2px 8px rgba(15,23,42,0.06)',
  lg: '0 8px 24px rgba(15,23,42,0.10)',
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const FONT = "'Inter', 'Segoe UI', sans-serif";

export const TYPE = {
  h1: { fontSize: 20, fontWeight: 700 as const, color: COLORS.textPrimary, letterSpacing: '-0.01em' },
  h2: { fontSize: 17, fontWeight: 700 as const, color: COLORS.textPrimary, letterSpacing: '-0.01em' },
  subtitle: { fontSize: 12.5, color: COLORS.textMuted, fontWeight: 400 as const },
  label: { fontSize: 12, fontWeight: 600 as const, color: COLORS.textSecondary },
  body: { fontSize: 13, color: COLORS.textPrimary },
  caption: { fontSize: 11, color: COLORS.textMuted },
};

// ── Ready-to-spread style objects for the most common patterns ──────────

export const card: CSSProperties = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.lg,
  boxShadow: SHADOW.sm,
};

export const statPill = (accent: string): CSSProperties => ({
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  height: 34,
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxSizing: 'border-box',
  flexShrink: 0,
});

// Fuller stat card (for a dedicated stats row, not a compact header pill) —
// a colored left accent bar + shadow gives it real visual weight so the
// number stands out instead of blending into a flat bordered box.
export const statCard = (accent: string): CSSProperties => ({
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderLeft: `3px solid ${accent}`,
  borderRadius: RADIUS.lg,
  boxShadow: SHADOW.md,
  padding: '14px 18px',
});

export const inputStyle: CSSProperties = {
  padding: '7px 10px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  fontSize: 13,
  color: COLORS.textSecondary,
  background: COLORS.pageBg,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export const buttonBase: CSSProperties = {
  border: 'none',
  borderRadius: RADIUS.sm,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: '8px 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'background 0.12s, opacity 0.12s',
};

export const buttonPrimary: CSSProperties = {
  ...buttonBase,
  background: COLORS.brand,
  color: '#fff',
};

export const buttonSecondary: CSSProperties = {
  ...buttonBase,
  background: COLORS.neutralTint,
  color: COLORS.textSecondary,
};

export const buttonDanger: CSSProperties = {
  ...buttonBase,
  background: COLORS.dangerTint,
  color: COLORS.dangerDark,
};

export const badge = (tone: 'success' | 'danger' | 'warning' | 'neutral'): CSSProperties => {
  const map = {
    success: { bg: COLORS.successTint, color: COLORS.successDark, border: COLORS.successBorder },
    danger:  { bg: COLORS.dangerTint,  color: COLORS.dangerDark,  border: COLORS.dangerBorder },
    warning: { bg: COLORS.warningTint, color: COLORS.warningDark, border: COLORS.warningBorder },
    neutral: { bg: COLORS.neutralTint, color: COLORS.textSecondary, border: COLORS.border },
  }[tone];
  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: RADIUS.pill,
    fontSize: 11,
    fontWeight: 600,
    background: map.bg,
    color: map.color,
    border: `1px solid ${map.border}`,
  };
};

export const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
  boxSizing: 'border-box',
};

export const modalPanel = (maxWidth = 480): CSSProperties => ({
  background: COLORS.surface,
  borderRadius: RADIUS.xl,
  padding: '28px 32px',
  width: '100%',
  maxWidth,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: SHADOW.lg,
  boxSizing: 'border-box',
});

export const tableHeaderRow: CSSProperties = {
  background: COLORS.pageBg,
  borderBottom: `1px solid ${COLORS.border}`,
};

export const tableHeaderCell: CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: COLORS.textSecondary,
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export const tableCell: CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: COLORS.textPrimary,
};
