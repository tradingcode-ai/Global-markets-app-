import type { ResearchEvent, ResearchReport } from '../types/marketResearch';
import { researchYahooSymbol } from './researchSessionQuotes';

export function researchReportSessionKey(report: ResearchReport, event?: ResearchEvent): string | undefined {
  if (report.sessionKey) return report.sessionKey;
  const fingerprint = event?.fingerprint?.match(/_(UP|DOWN)_(\d{4}-\d{2}-\d{2})$/);
  const date = event?.sessionDate || fingerprint?.[2];
  const move = event?.triggerChangePercent ?? report.changePercent ?? report.change_percent;
  const direction = event?.triggerDirection || fingerprint?.[1] || (Number.isFinite(move) && move !== 0 ? (move! > 0 ? 'UP' : 'DOWN') : undefined);
  if (!date || !direction || (report.period && report.period !== 'SESSION' && !fingerprint)) return undefined;
  return JSON.stringify([event?.marketSymbol?.toUpperCase() || researchYahooSymbol(report.ticker), date, direction]);
}

/** Preserve every report; uncertain legacy sessions are never merged by UTC date. */
export function groupResearchReports(reports: ResearchReport[], events: ResearchEvent[] = []): ResearchReport[] {
  const eventMap = new Map(events.map(event => [event.id, event]));
  const groups = new Map<string, ResearchReport[]>();
  for (const report of reports) {
    const sessionKey = researchReportSessionKey(report, eventMap.get(report.eventId || report.event_id || ''));
    const key = sessionKey || `report:${report.id}`;
    const group = groups.get(key) || [];
    if (!group.some(item => item.id === report.id)) group.push({ ...report, sessionKey });
    groups.set(key, group);
  }
  return [...groups.values()].map(group => {
    group.sort((left, right) => Number(right.status === 'COMPLETED') - Number(left.status === 'COMPLETED') ||
      (left.createdAt || '').localeCompare(right.createdAt || '') || left.id.localeCompare(right.id));
    const primary = group[0];
    const alternatives = new Map<string, { id: string; ticker: string; status?: string; createdAt?: string }>();
    for (const item of group) {
      if (item.id !== primary.id) alternatives.set(item.id, { id: item.id, ticker: item.ticker, status: item.status, createdAt: item.createdAt });
      for (const alternative of item.alternativeReports || []) {
        if (alternative.id !== primary.id) alternatives.set(alternative.id, alternative);
      }
    }
    return { ...primary, alternativeReports: [...alternatives.values()] };
  }).sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));
}
