/**
 * Utility to convert an array of data objects to CSV and trigger browser download
 * Includes UTF-8 BOM (\uFEFF) for seamless display in Microsoft Excel & Google Sheets
 * 
 * @param {Array<object>} data - Array of records
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 * @param {string} filename - Desired file name (without or with .csv)
 */
export function exportToCsv({ data = [], columns = [], filename = 'report' }) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Derive columns from keys if not specified
  const effectiveColumns =
    columns && columns.length > 0
      ? columns
      : Object.keys(data[0]).map((k) => ({
          key: k,
          label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        }));

  // Build CSV Header
  const headerRow = effectiveColumns.map((col) => escapeCsvValue(col.label)).join(',');

  // Build CSV Rows
  const dataRows = data.map((row) => {
    return effectiveColumns
      .map((col) => {
        const val = row[col.key];
        return escapeCsvValue(val);
      })
      .join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');

  // Prepend UTF-8 BOM so Excel opens UTF-8 characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to escape quotes, commas, newlines in CSV cells
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'boolean') return val ? '"YES"' : '"NO"';
  
  let str = String(val).trim();
  // If string contains quotes, commas, or newlines, wrap in quotes and double internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
  }
  return `"${str}"`;
}
