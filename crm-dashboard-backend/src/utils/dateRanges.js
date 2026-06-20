export function parseReportDateRange(query) {
  const now = new Date();
  const preset = query.preset || 'this_month';

  if (preset === 'custom' && query.from && query.to) {
    const from = new Date(query.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setHours(23, 59, 59, 999);
    return { from, to, preset };
  }

  if (preset === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to, preset: 'last_month' };
  }

  if (preset === 'this_quarter') {
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), quarterStart, 1);
    const to = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59, 999);
    return { from, to, preset: 'this_quarter' };
  }

  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to, preset: 'this_month' };
}

export function getPreviousPeriod(from, to) {
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  prevFrom.setHours(0, 0, 0, 0);
  return { from: prevFrom, to: prevTo };
}
