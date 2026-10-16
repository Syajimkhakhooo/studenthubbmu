import React from 'react';

export function Table({
  columns = [], // [{ header, accessor, render, className, align }]
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'Belum ada data yang dapat ditampilkan.',
  className = '',
  onRowClick,
}) {
  return (
    <div className={`table-container ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={col.className || ''}
                style={{ textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={col.className || ''}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render
                      ? col.render(row, rowIdx)
                      : typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor] ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          ) : !isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8) var(--space-4)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
