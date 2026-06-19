import type { ColumnDef, GridLayout, GridTheme, RowData } from './types';

const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 50;

export function computeLayout(
  columnDefs: ColumnDef[],
  availableWidth: number,
  widthOverrides: Readonly<Record<string, number>> = {},
): GridLayout {
  let fixedTotal = 0;
  let flexTotal = 0;

  const columns = columnDefs.map((def) => {
    const overrideWidth = widthOverrides[def.field];
    const hasOverride = typeof overrideWidth === 'number';
    const isFlexed = !hasOverride && def.flex !== undefined && def.flex > 0;
    const w = isFlexed
      ? 0
      : Math.max(overrideWidth ?? def.width ?? DEFAULT_COLUMN_WIDTH, def.minWidth ?? MIN_COLUMN_WIDTH);
    if (!isFlexed) fixedTotal += w;
    else flexTotal += def.flex!;
    return { def, x: 0, width: w };
  });

  const remaining = Math.max(0, availableWidth - fixedTotal);
  if (flexTotal > 0) {
    for (const col of columns) {
      if (col.def.flex) {
        col.width = Math.max(
          col.def.minWidth ?? MIN_COLUMN_WIDTH,
          Math.floor((col.def.flex / flexTotal) * remaining),
        );
      }
    }
  }

  let x = 0;
  for (const col of columns) {
    col.x = x;
    x += col.width;
  }

  return { columns, totalWidth: x };
}

export interface RenderOptions {
  layout: GridLayout;
  rowData: RowData[];
  theme: GridTheme;
  scrollTop: number;
  scrollLeft: number;
  selectedRowIndex: number | null;
  canvasWidth: number;
  canvasHeight: number;
  dpr: number;
}

export function render(ctx: CanvasRenderingContext2D, opts: RenderOptions): void {
  const { layout, rowData, theme, scrollTop, scrollLeft, selectedRowIndex, canvasWidth, canvasHeight, dpr } = opts;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  drawHeader(ctx, layout, theme, scrollLeft, canvasWidth);
  drawBody(ctx, layout, rowData, theme, scrollTop, scrollLeft, selectedRowIndex, canvasWidth, canvasHeight);

  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  theme: GridTheme,
  scrollLeft: number,
  canvasWidth: number,
): void {
  const {
    headerHeight,
    filterRowHeight,
    headerBackground,
    filterRowBackground,
    headerForeground,
    headerFont,
    gridLineColor,
    cellPaddingX,
  } = theme;
  const topBandHeight = headerHeight + filterRowHeight;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, topBandHeight);
  ctx.clip();

  ctx.fillStyle = headerBackground;
  ctx.fillRect(0, 0, canvasWidth, headerHeight);
  ctx.fillStyle = filterRowBackground;
  ctx.fillRect(0, headerHeight, canvasWidth, filterRowHeight);

  ctx.font = headerFont;
  ctx.textBaseline = 'middle';

  for (const { def, x, width } of layout.columns) {
    const drawX = x - scrollLeft;
    if (drawX + width < 0 || drawX > canvasWidth) continue;

    // 3D header cell face with subtle vertical gradient.
      // Flat bevel: highlight and shadow lines only.
    // Bevel lines: top/left highlight, bottom/right shadow.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(drawX + 0.5, 0.5);
    ctx.lineTo(drawX + width - 0.5, 0.5);
    ctx.moveTo(drawX + 0.5, 0.5);
    ctx.lineTo(drawX + 0.5, headerHeight - 0.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.moveTo(drawX + width - 0.5, 0.5);
    ctx.lineTo(drawX + width - 0.5, headerHeight - 0.5);
    ctx.moveTo(drawX + 0.5, headerHeight - 0.5);
    ctx.lineTo(drawX + width - 0.5, headerHeight - 0.5);
    ctx.stroke();

    const label = def.headerName ?? def.field;
    const align = def.align ?? 'left';
    let textX = drawX + cellPaddingX;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX + cellPaddingX, 0, Math.max(0, width - cellPaddingX * 2), headerHeight);
    ctx.clip();
    ctx.fillStyle = headerForeground;
    ctx.textAlign = align;
    
    if (align === 'center') {
      textX = drawX + width / 2;
    } else if (align === 'right') {
      textX = drawX + width - cellPaddingX;
    }
    
    ctx.fillText(label, textX, headerHeight / 2);
    ctx.restore();

    // Column separator
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(drawX + width - 0.5, 8);
    ctx.lineTo(drawX + width - 0.5, topBandHeight - 8);
    ctx.stroke();
  }

  // Divider between header and filter row
  ctx.strokeStyle = gridLineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight - 0.5);
  ctx.lineTo(canvasWidth, headerHeight - 0.5);
  ctx.stroke();

  // Bottom border under filter row
  ctx.strokeStyle = gridLineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, topBandHeight - 0.5);
  ctx.lineTo(canvasWidth, topBandHeight - 0.5);
  ctx.stroke();

  ctx.restore();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  rowData: RowData[],
  theme: GridTheme,
  scrollTop: number,
  scrollLeft: number,
  selectedRowIndex: number | null,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const {
    headerHeight, filterRowHeight, rowHeight, rowBackground, rowAltBackground, rowForeground,
    cellFont, gridLineColor, selectedRowBackground, selectedRowForeground, cellPaddingX,
  } = theme;
  const topBandHeight = headerHeight + filterRowHeight;

  const bodyHeight = canvasHeight - topBandHeight;
  const firstRow = Math.floor(scrollTop / rowHeight);
  const lastRow = Math.min(rowData.length - 1, firstRow + Math.ceil(bodyHeight / rowHeight) + 1);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topBandHeight, canvasWidth, bodyHeight);
  ctx.clip();

  for (let i = firstRow; i <= lastRow; i++) {
    const row = rowData[i];
    const rowY = topBandHeight + i * rowHeight - scrollTop;
    const isSelected = i === selectedRowIndex;

    // Row background
    ctx.fillStyle = isSelected
      ? selectedRowBackground
      : i % 2 === 0 ? rowBackground : rowAltBackground;
    ctx.fillRect(0, rowY, canvasWidth, rowHeight);

    // Row bottom border
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rowY + rowHeight - 0.5);
    ctx.lineTo(canvasWidth, rowY + rowHeight - 0.5);
    ctx.stroke();

    // Cells
    ctx.font = cellFont;
    ctx.textBaseline = 'middle';

    for (const { def, x, width } of layout.columns) {
      const drawX = x - scrollLeft;
      if (drawX + width < 0 || drawX > canvasWidth) continue;

      // Flat bevel: highlight and shadow lines only.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.moveTo(drawX + 0.5, rowY + 0.5);
      ctx.lineTo(drawX + width - 0.5, rowY + 0.5);
      ctx.moveTo(drawX + 0.5, rowY + 0.5);
      ctx.lineTo(drawX + 0.5, rowY + rowHeight - 0.5);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.moveTo(drawX + width - 0.5, rowY + 0.5);
      ctx.lineTo(drawX + width - 0.5, rowY + rowHeight - 0.5);
      ctx.moveTo(drawX + 0.5, rowY + rowHeight - 0.5);
      ctx.lineTo(drawX + width - 0.5, rowY + rowHeight - 0.5);
      ctx.stroke();

      const rawValue = row[def.field];
      const text = def.valueFormatter
        ? def.valueFormatter({ value: rawValue, data: row })
        : rawValue == null ? '' : String(rawValue);
      const align = def.align ?? 'left';
      let textX = drawX + cellPaddingX;

      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX + cellPaddingX, rowY, Math.max(0, width - cellPaddingX * 2), rowHeight);
      ctx.clip();
      ctx.fillStyle = isSelected ? selectedRowForeground : rowForeground;
      ctx.textAlign = align;
      
      if (align === 'center') {
        textX = drawX + width / 2;
      } else if (align === 'right') {
        textX = drawX + width - cellPaddingX;
      }
      
      ctx.fillText(text, textX, rowY + rowHeight / 2);
      ctx.restore();

      // Cell right border
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + width - 0.5, rowY);
      ctx.lineTo(drawX + width - 0.5, rowY + rowHeight);
      ctx.stroke();
    }
  }

  ctx.restore();
}
