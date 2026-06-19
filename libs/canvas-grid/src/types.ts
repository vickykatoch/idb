import type { CSSProperties } from 'react';

export interface ColumnDef {
  field: string;
  headerName?: string;
  /** Fixed pixel width. Ignored when flex is set. */
  width?: number;
  minWidth?: number;
  /** Proportional share of remaining space, like CSS flex-grow. */
  flex?: number;
  valueFormatter?: (params: { value: unknown; data: RowData }) => string;
  /** Text alignment for header and cells: 'left' | 'center' | 'right'. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right';
}

export type RowData = Record<string, unknown>;

export interface GridTheme {
  headerBackground: string;
  headerForeground: string;
  headerFont: string;
  filterRowBackground: string;
  rowBackground: string;
  rowAltBackground: string;
  rowForeground: string;
  cellFont: string;
  gridLineColor: string;
  selectedRowBackground: string;
  selectedRowForeground: string;
  rowHeight: number;
  headerHeight: number;
  filterRowHeight: number;
  cellPaddingX: number;
}

export const defaultTheme: GridTheme = {
  headerBackground: '#111827',
  headerForeground: '#e5e7eb',
  headerFont: 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  filterRowBackground: '#0f172a',
  rowBackground: '#0b1220',
  rowAltBackground: '#0f172a',
  rowForeground: '#e2e8f0',
  cellFont: '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  gridLineColor: '#334155',
  selectedRowBackground: '#1e293b',
  selectedRowForeground: '#93c5fd',
  rowHeight: 32,
  headerHeight: 40,
  filterRowHeight: 36,
  cellPaddingX: 12,
};

export interface ColumnLayout {
  def: ColumnDef;
  x: number;
  width: number;
}

export interface GridLayout {
  columns: ColumnLayout[];
  totalWidth: number;
}

export interface GridApi {
  setColumnWidth: (field: string, width: number) => void;
  sizeColumnsToFit: () => void;
  refreshCells: () => void;
  getSelectedRow: () => { row: RowData; rowIndex: number } | null;
  getDisplayedRowCount: () => number;
  ensureIndexVisible: (rowIndex: number) => void;
}

export interface GridReadyEvent {
  api: GridApi;
}

export interface GridOptions {
  columnDefs: ColumnDef[];
  rowData: RowData[];
  theme?: Partial<GridTheme>;
  onRowClick?: (row: RowData, rowIndex: number) => void;
  onGridReady?: (event: GridReadyEvent) => void;
}

export interface CanvasGridProps {
  gridOptions: GridOptions;
  className?: string;
  style?: CSSProperties;
}
