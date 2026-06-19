import { useMemo } from 'react';
import { CanvasGrid } from '@idb/canvas-grid';
import type { ColumnDef, GridOptions, RowData } from '@idb/canvas-grid';

const columnDefs: ColumnDef[] = [
  { field: 'id', headerName: 'ID', width: 70, align: 'right' },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'role', headerName: 'Role', flex: 1 },
  { field: 'department', headerName: 'Department', flex: 1 },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 120,
    align: 'right',
    valueFormatter: ({ value }) =>
      typeof value === 'number'
        ? value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          })
        : String(value),
  },
  { field: 'startDate', headerName: 'Start Date', width: 120 },
];

function generateRows(count: number): RowData[] {
  const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR'];
  const roles = ['Engineer', 'Manager', 'Analyst', 'Director', 'Lead', 'Coordinator'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    role: roles[i % roles.length],
    department: departments[i % departments.length],
    salary: 60000 + (i % 20) * 5000,
    startDate: new Date(2018 + (i % 7), i % 12, (i % 28) + 1).toLocaleDateString('en-US'),
  }));
}

export default function CanvasGridDemo() {
  const rowData = useMemo(() => generateRows(50_000), []);
  const gridOptions = useMemo<GridOptions>(
    () => ({
      columnDefs,
      rowData,
      onRowClick: (row, index) => console.log('Row clicked:', index, row),
      onGridReady: ({ api }) => {
        console.log('Grid ready. Displayed rows:', api.getDisplayedRowCount());
      },
    }),
    [rowData],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
      }}
    >
      <h2 style={{ margin: '0 0 12px' }}>
        Canvas Grid Demo - {rowData.length.toLocaleString()} rows
      </h2>
      <div style={{ flex: 1 }}>
        <CanvasGrid
          gridOptions={gridOptions}
          style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
        />
      </div>
    </div>
  );
}