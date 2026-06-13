// Enterprise ATS Design Tokens

export const C = {
  primary:       '#2563EB',
  primaryHover:  '#1D4ED8',
  primaryLight:  '#EFF6FF',
  brand:         '#2563EB',
  brandLight:    '#EFF6FF',
  brandHover:    '#1D4ED8',
  success:       '#16A34A',
  successBg:     '#F0FDF4',
  successBorder: '#BBF7D0',
  warning:       '#F59E0B',
  warningBg:     '#FFFBEB',
  warningBorder: '#FDE68A',
  error:         '#DC2626',
  errorBg:       '#FEF2F2',
  errorBorder:   '#FECACA',
  bg:            '#F8FAFC',
  bgCard:        '#FFFFFF',
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
};

export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  applied:              { bg: '#EFF6FF', color: '#2563EB' },
  pending:              { bg: '#F9FAFB', color: '#6B7280' },
  screened:             { bg: '#FEF9C3', color: '#A16207' },
  interview_sent:       { bg: '#FFF7ED', color: '#C2410C' },
  shortlisted:          { bg: '#EFF6FF', color: '#1D4ED8' },
  approved:             { bg: '#EFF6FF', color: '#1D4ED8' },
  hired:                { bg: '#F0FDF4', color: '#16A34A' },
  rejected:             { bg: '#FEF2F2', color: '#DC2626' },
  assessment_pending:   { bg: '#FFF7ED', color: '#C2410C' },
};

export const STATUS_LABEL: Record<string, string> = {
  applied:            'Applied',
  pending:            'Pending',
  screened:           'Screened',
  interview_sent:     'Assessment Sent',
  shortlisted:        'Shortlisted',
  approved:           'Shortlisted',
  hired:              'Hired',
  rejected:           'Rejected',
  assessment_pending: 'Assessment Pending',
};

export const getStatusStyle = (status: string) =>
  STATUS_STYLE[status?.toLowerCase()] ?? STATUS_STYLE.pending;
