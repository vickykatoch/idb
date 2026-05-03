import type { ReactNode } from 'react';

export interface EficcGridColumn {
  key: string;
  header: ReactNode;
}

export interface EficcGridProps {
  columns: EficcGridColumn[];
  rows: Array<Record<string, ReactNode>>;
  className?: string;
  emptyState?: ReactNode;
}

export function EficcGrid({
  columns,
  rows,
  className,
  emptyState = 'No rows available',
}: EficcGridProps) {
  if (rows.length === 0) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={className}>
      <table role="grid">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column.key}>{row[column.key] ?? null}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
