/**
 * CSV generation helpers with protection against:
 *  - Delimiter / quote / newline corruption (RFC 4180 quoting).
 *  - CSV formula injection: a cell beginning with = + - @ (or tab/CR) is
 *    executed as a formula by Excel/Sheets. We neutralise it by prefixing a
 *    single quote so the value renders as literal text.
 */

const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

/** Escape a single CSV cell value safely. */
export function escapeCsvCell(value: unknown): string {
  let str = value === null || value === undefined ? '' : String(value);

  // Neutralise formula-injection vectors.
  if (str.length > 0 && FORMULA_TRIGGERS.includes(str[0])) {
    str = `'${str}`;
  }

  // Quote when the value contains a delimiter, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from a header row and data rows. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(','))
  ];
  return lines.join('\n');
}

/** Trigger a browser download for the given CSV content. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
