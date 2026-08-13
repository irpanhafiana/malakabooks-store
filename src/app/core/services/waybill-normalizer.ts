/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WaybillLogEntry {
  date: string;
  description: string;
  location: string;
}

export function extractDetailResiData(data: any): any {
  if (!data) return null;
  const raw = data.data || data;
  return typeof raw === 'object' ? raw : null;
}

export function getWaybillField(detailObj: any, ...keys: string[]): string {
  if (!detailObj) return '-';
  for (const k of keys) {
    const v = detailObj[k];
    if (v != null && v !== '') return String(v);
  }
  return '-';
}

export function getWaybillLogDate(log: any): string {
  if (!log) return '';
  return log.date || log.dateTime || log.timestamp || log.time || '';
}

export function getWaybillLogDesc(log: any): string {
  if (!log) return '';
  return log.desc || log.description || log.status || log.note || '';
}

export function getWaybillLogLoc(log: any): string {
  if (!log) return '';
  return log.location || log.city || log.position || '';
}

export function getWaybillHistory(detailObj: any): WaybillLogEntry[] {
  if (!detailObj) return [];
  const list = detailObj.history_pengiriman || detailObj.history || detailObj.histories || detailObj.logs || detailObj.manifests || detailObj.details || [];
  if (!Array.isArray(list)) return [];
  return [...list]
    .map(log => ({
      date: getWaybillLogDate(log),
      description: getWaybillLogDesc(log),
      location: getWaybillLogLoc(log)
    }))
    .sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (isNaN(da) || isNaN(db)) return 0;
      return db - da;
    });
}

export function getWaybillSummaryEntries(detailObj: any): { key: string; val: string }[] {
  if (!detailObj || typeof detailObj !== 'object') return [];
  const skip = ['history_pengiriman', 'history', 'histories', 'logs', 'manifests', 'details', 'deliveryHistory'];
  return Object.entries(detailObj)
    .filter(([k, v]) => !skip.includes(k) && v != null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => ({ key: k, val: String(v) }));
}
