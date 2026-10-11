import type { ResearchDashboardData, ResearchReport } from '../types/marketResearch';

export const RESEARCH_REPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function isResearchReportRetained(report: ResearchReport, now = Date.now()): boolean {
  const created = Date.parse(report.createdAt || report.created_at || '');
  return Number.isFinite(created) && created > now - RESEARCH_REPORT_RETENTION_MS;
}

/** Lists and browser snapshots carry text/metadata; full pixels come from the detail endpoint. */
export function withoutReportVisualBytes(report: ResearchReport): ResearchReport {
  const payload = report.visualPayload || report.visual_payload;
  if (!payload) return report;
  return {
    ...report, visual_payload: undefined,
    visualPayload: {
      ...payload,
      assetRegistry: payload.assetRegistry?.map(({ stored: _stored, ...asset }) => asset),
      availability: {
        photo: 'Open this saved report online to load its stored photo.',
        evidence: 'Open this saved report online to load its stored figure.',
      },
    },
  };
}

/** Apply the same expiry rule to server responses and disposable browser copies. */
export function retainResearchDashboard(data: ResearchDashboardData, now = Date.now()): ResearchDashboardData {
  const original = data.recentReports || data.recent_reports || [];
  const recentReports = original.filter(report => isResearchReportRetained(report, now));
  const expiredIds = new Set(original.filter(report => !isResearchReportRetained(report, now)).map(report => report.id));
  const clearLinks = (events: ResearchDashboardData['recentEvents']) => events?.map(event =>
    expiredIds.has(event.reportId || event.report_id || '')
      ? { ...event, reportId: undefined, report_id: undefined, catalystSummary: undefined }
      : event);
  return {
    ...data,
    recentReports,
    recent_reports: data.recent_reports ? recentReports : undefined,
    activeEvents: clearLinks(data.activeEvents),
    recentEvents: clearLinks(data.recentEvents),
    active_research: clearLinks(data.active_research),
    recent_events: clearLinks(data.recent_events),
    stats: data.stats ? { ...data.stats, totalReports: recentReports.length } : undefined,
    kpi: data.kpi ? { ...data.kpi, completed_reports_count: recentReports.length } : undefined,
  };
}
