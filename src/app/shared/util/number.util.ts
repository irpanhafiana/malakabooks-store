/**
 * Helper utility untuk parsing dan formatting angka/nominal mata uang.
 */

/**
 * Mengonversi nilai numerik atau string berformat (misal: "150.000") menjadi number murni (150000).
 */
export function parseFormattedNumber(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  }
  return 0;
}

/**
 * Memformat angka number/string ke format pemisah ribuan id-ID (misal: 150000 -> "150.000").
 */
export function formatThousands(val: unknown): string {
  const num = parseFormattedNumber(val);
  return num.toLocaleString('id-ID');
}
