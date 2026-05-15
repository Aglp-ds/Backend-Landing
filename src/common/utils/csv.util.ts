/**
 * Escapa un valor para CSV.
 * Si el valor contiene comas, saltos de línea o comillas, se envuelve entre comillas.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const text = String(value);
  const mustQuote = /[",\n\r]/.test(text);
  const escaped = text.replace(/"/g, '""');

  return mustQuote ? `"${escaped}"` : escaped;
}

/**
 * Convierte un arreglo de objetos a texto CSV.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: Array<{ key: keyof T; label: string }>,
): string {
  const headerLine = headers.map((header) => escapeCsvValue(header.label)).join(',');

  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header.key])).join(','),
  );

  return [headerLine, ...lines].join('\n');
}
