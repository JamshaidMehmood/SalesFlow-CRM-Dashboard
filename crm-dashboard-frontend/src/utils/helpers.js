import clsx from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getInitials(name) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export function contactName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

export const STATUS_LABELS = {
  lead: 'Lead',
  prospect: 'Prospect',
  customer: 'Customer',
  inactive: 'Inactive',
};

export const SCORE_TIER_LABELS = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };

export const SCORE_TIER_COLORS = {
  hot: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

export const LOST_REASON_LABELS = {
  price_too_high: 'Price too high',
  bad_timing: 'Bad timing',
  chose_competitor: 'Chose competitor',
  no_budget: 'No budget',
  no_response: 'No response',
  other: 'Other',
};

export const LOST_REASONS = Object.keys(LOST_REASON_LABELS);

export const STAGE_PALETTE = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

export function getStageColor(stage, index = 0) {
  if (stage?.isWonStage) return STAGE_PALETTE[3];
  if (stage?.isLostStage) return STAGE_PALETTE[4];
  return STAGE_PALETTE[index % STAGE_PALETTE.length];
}

export function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const STATUS_COLORS = {
  lead: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  prospect: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  customer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const CHART_COLORS = ['#ff7a59', '#0091ae', '#7c98b6', '#00bda5', '#f2545b'];

// Legacy aliases for components still using slug-based keys
export const STAGE_LABELS = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_COLORS = {
  new: STAGE_PALETTE[0],
  qualified: STAGE_PALETTE[1],
  proposal: STAGE_PALETTE[2],
  won: STAGE_PALETTE[3],
  lost: STAGE_PALETTE[4],
};
