import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasGridProps, GridApi, GridLayout, GridTheme } from './types';
import { defaultTheme } from './types';
import { computeLayout, render } from './renderer';

export function CanvasGrid({
  gridOptions,
  className,
  style,
}: CanvasGridProps) {
  const {
    columnDefs,
    rowData,
    theme: themeProp,
    onRowClick,
    onGridReady,
  } = gridOptions;

  const mergedTheme = useMemo<GridTheme>(() => ({ ...defaultTheme, ...themeProp }), [themeProp]);
  const topBandHeight = mergedTheme.headerHeight + mergedTheme.filterRowHeight;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [scrollContentSize, setScrollContentSize] = useState({ width: 1, height: 1 });
  const [columnLayouts, setColumnLayouts] = useState<GridLayout['columns']>([]);
  const [uiScrollLeft, setUiScrollLeft] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [scrollIndicators, setScrollIndicators] = useState({
    showX: false,
    showY: false,
    xSize: 0,
    xPos: 0,
    ySize: 0,
    yPos: 0,
  });

  // All mutable render state kept in refs so draw() is a stable closure.
  const scrollTopRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const selectedRowRef = useRef<number | null>(null);
  const layoutRef = useRef<GridLayout>({ columns: [], totalWidth: 0 });
  const dprRef = useRef(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
  const widthOverridesRef = useRef<Record<string, number>>({});
  const resizeStateRef = useRef<{
    field: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);
  const apiRef = useRef<GridApi | null>(null);
  const isGridReadyRef = useRef(false);

  const filteredRowData = useMemo(() => {
    const activeFilters = Object.entries(filterValues)
      .map(([field, value]) => [field, value.trim().toLowerCase()] as const)
      .filter(([, value]) => value.length > 0);

    if (activeFilters.length === 0) {
      return rowData;
    }

    return rowData.filter((row) =>
      activeFilters.every(([field, filterValue]) => {
        const cellValue = row[field];
        const normalized = cellValue == null ? '' : String(cellValue).toLowerCase();
        return normalized.includes(filterValue);
      }),
    );
  }, [filterValues, rowData]);

  // Keep latest props accessible inside stable callbacks without re-subscribing.
  const rowDataRef = useRef(filteredRowData);
  rowDataRef.current = filteredRowData;
  const themeRef = useRef<GridTheme>(mergedTheme);
  themeRef.current = mergedTheme;
  const columnDefsRef = useRef(columnDefs);
  columnDefsRef.current = columnDefs;
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const onGridReadyRef = useRef(onGridReady);
  onGridReadyRef.current = onGridReady;

  const getResizeHandleAtClientPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const headerHeight = themeRef.current.headerHeight;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    if (y < 0 || y > headerHeight) return null;

    const xInCanvas = clientX - rect.left;
    const xInGrid = xInCanvas + scrollLeftRef.current;
    const threshold = 6;

    for (const col of layoutRef.current.columns) {
      const edgeX = col.x + col.width;
      if (Math.abs(xInGrid - edgeX) <= threshold) {
        return {
          field: col.def.field,
          startWidth: col.width,
          minWidth: col.def.minWidth ?? 50,
        };
      }
    }
    return null;
  }, []);

  /** Stable draw function - reads all state from refs. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    render(ctx, {
      layout: layoutRef.current,
      rowData: rowDataRef.current,
      theme: themeRef.current,
      scrollTop: scrollTopRef.current,
      scrollLeft: scrollLeftRef.current,
      selectedRowIndex: selectedRowRef.current,
      canvasWidth: canvas.width / dprRef.current,
      canvasHeight: canvas.height / dprRef.current,
      dpr: dprRef.current,
    });
  }, []);

  const updateLayoutAndScrollArea = useCallback((viewportWidth: number) => {
    const layout = computeLayout(columnDefsRef.current, viewportWidth, widthOverridesRef.current);
    layoutRef.current = layout;
    setColumnLayouts(layout.columns);
    setScrollContentSize({
      width: Math.max(1, layout.totalWidth),
      height: Math.max(
        1,
        themeRef.current.headerHeight
          + themeRef.current.filterRowHeight
          + rowDataRef.current.length * themeRef.current.rowHeight,
      ),
    });
  }, []);

  const updateScrollIndicators = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const showX = scroller.scrollWidth > scroller.clientWidth + 1;
    const showY = scroller.scrollHeight > scroller.clientHeight + 1;

    const xSize = showX
      ? Math.max(28, (scroller.clientWidth / scroller.scrollWidth) * scroller.clientWidth)
      : 0;
    const ySize = showY
      ? Math.max(28, (scroller.clientHeight / scroller.scrollHeight) * scroller.clientHeight)
      : 0;

    const maxX = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
    const maxY = Math.max(1, scroller.scrollHeight - scroller.clientHeight);

    const xPos = showX
      ? (scroller.scrollLeft / maxX) * (scroller.clientWidth - xSize)
      : 0;
    const yPos = showY
      ? (scroller.scrollTop / maxY) * (scroller.clientHeight - ySize)
      : 0;

    setScrollIndicators({ showX, showY, xSize, xPos, ySize, yPos });
  }, []);

  const refreshFromCurrentState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      updateLayoutAndScrollArea(scroller.clientWidth);
      updateScrollIndicators();
    }
    draw();
  }, [draw, updateLayoutAndScrollArea, updateScrollIndicators]);

  const maybeEmitGridReady = useCallback(() => {
    if (isGridReadyRef.current) return;
    const api = apiRef.current;
    if (!api) return;
    const canvas = canvasRef.current;
    const scroller = scrollerRef.current;
    if (!canvas || !scroller || layoutRef.current.columns.length === 0) return;

    isGridReadyRef.current = true;
    onGridReadyRef.current?.({ api });
  }, []);

  useEffect(() => {
    apiRef.current = {
      setColumnWidth: (field, width) => {
        widthOverridesRef.current[field] = Math.max(20, width);
        refreshFromCurrentState();
      },
      sizeColumnsToFit: () => {
        widthOverridesRef.current = {};
        refreshFromCurrentState();
      },
      refreshCells: () => {
        draw();
      },
      getSelectedRow: () => {
        const rowIndex = selectedRowRef.current;
        if (rowIndex == null || rowIndex < 0 || rowIndex >= rowDataRef.current.length) return null;
        return { row: rowDataRef.current[rowIndex], rowIndex };
      },
      getDisplayedRowCount: () => rowDataRef.current.length,
      ensureIndexVisible: (rowIndex) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const theme = themeRef.current;
        const rowTop = theme.headerHeight + theme.filterRowHeight + rowIndex * theme.rowHeight;
        const rowBottom = rowTop + theme.rowHeight;
        const viewTop = scroller.scrollTop + theme.headerHeight + theme.filterRowHeight;
        const viewBottom = scroller.scrollTop + scroller.clientHeight;

        if (rowTop < viewTop) {
          scroller.scrollTop = Math.max(0, rowTop - theme.headerHeight - theme.filterRowHeight);
        } else if (rowBottom > viewBottom) {
          scroller.scrollTop = Math.max(0, rowBottom - scroller.clientHeight);
        }
      },
    };
  }, [draw, refreshFromCurrentState]);

  // Observe container size changes and resize the canvas accordingly.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        dprRef.current = dpr;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        updateLayoutAndScrollArea(width);
        updateScrollIndicators();
        draw();
        maybeEmitGridReady();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw, maybeEmitGridReady, updateLayoutAndScrollArea, updateScrollIndicators]);

  // Recompute layout and redraw whenever props change.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      updateLayoutAndScrollArea(scroller.clientWidth);
      updateScrollIndicators();
    }
    draw();
    maybeEmitGridReady();
  }, [
    columnDefs,
    filteredRowData,
    mergedTheme,
    draw,
    maybeEmitGridReady,
    updateLayoutAndScrollArea,
    updateScrollIndicators,
  ]);

  // Scrollbar-driven scrolling (both axes) from native overflow container.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      scrollTopRef.current = scroller.scrollTop;
      scrollLeftRef.current = scroller.scrollLeft;
      setUiScrollLeft(scroller.scrollLeft);
      updateScrollIndicators();
      draw();
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [draw, updateScrollIndicators]);

  useEffect(() => {
    const onPointerMove = (e: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const nextWidth = Math.max(
        resizeState.minWidth,
        resizeState.startWidth + (e.clientX - resizeState.startX),
      );
      widthOverridesRef.current[resizeState.field] = nextWidth;

      const scroller = scrollerRef.current;
      if (scroller) {
        updateLayoutAndScrollArea(scroller.clientWidth);
        updateScrollIndicators();
      }
      draw();
    };

    const onPointerUp = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
    };
  }, [draw, updateLayoutAndScrollArea, updateScrollIndicators]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const handle = getResizeHandleAtClientPoint(e.clientX, e.clientY);
    if (!handle) return;

    // Freeze current rendered widths so resizing one column does not reflow others.
    const frozenWidths: Record<string, number> = {};
    for (const col of layoutRef.current.columns) {
      frozenWidths[col.def.field] = col.width;
    }
    widthOverridesRef.current = frozenWidths;

    resizeStateRef.current = {
      field: handle.field,
      startX: e.clientX,
      startWidth: handle.startWidth,
      minWidth: handle.minWidth,
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'col-resize';
    }

    e.preventDefault();
  }, [getResizeHandleAtClientPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (resizeStateRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = getResizeHandleAtClientPoint(e.clientX, e.clientY);
    canvas.style.cursor = handle ? 'col-resize' : 'default';
  }, [getResizeHandleAtClientPoint]);

  const handleMouseLeave = useCallback(() => {
    if (resizeStateRef.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }, []);

  // Row selection on click.
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      if (y < topBandHeight) return;

      const rowIndex = Math.floor((y - topBandHeight + scrollTopRef.current) / themeRef.current.rowHeight);
      if (rowIndex >= 0 && rowIndex < rowDataRef.current.length) {
        selectedRowRef.current = selectedRowRef.current === rowIndex ? null : rowIndex;
        onRowClickRef.current?.(rowDataRef.current[rowIndex], rowIndex);
        draw();
      }
    },
    [draw, topBandHeight],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      <div
        ref={scrollerRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'scroll',
          scrollbarGutter: 'stable both-edges',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'relative',
            width: `${scrollContentSize.width}px`,
            height: `${scrollContentSize.height}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              display: 'block',
              cursor: 'default',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
        </div>

      </div>

      {/* Filter row overlay positioned above scroll area */}
      <div
        style={{
          position: 'absolute',
          top: `${mergedTheme.headerHeight}px`,
          left: 0,
          right: scrollIndicators.showY ? 16 : 0,
          height: `${mergedTheme.filterRowHeight}px`,
          overflow: 'hidden',
          zIndex: 15,
          pointerEvents: 'auto',
          borderBottom: `1px solid ${mergedTheme.gridLineColor}`,
          background: mergedTheme.filterRowBackground,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${-uiScrollLeft}px`,
            top: 0,
            height: '100%',
            width: `${Math.max(scrollContentSize.width, 1)}px`,
            display: 'flex',
          }}
        >
          {columnLayouts.map((col) => (
            <div
              key={col.def.field}
              style={{
                width: `${col.width}px`,
                minWidth: `${col.width}px`,
                maxWidth: `${col.width}px`,
                boxSizing: 'border-box',
                borderRight: `1px solid ${mergedTheme.gridLineColor}`,
                padding: '6px 8px',
                pointerEvents: 'auto',
              }}
            >
              <input
                value={filterValues[col.def.field] ?? ''}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setFilterValues((prev) => ({ ...prev, [col.def.field]: nextValue }));
                  selectedRowRef.current = null;
                }}
                placeholder="Filter..."
                style={{
                  width: '100%',
                  height: '24px',
                  boxSizing: 'border-box',
                  borderRadius: '4px',
                  border: `1px solid ${mergedTheme.gridLineColor}`,
                  background: '#0b1220',
                  color: mergedTheme.rowForeground,
                  font: mergedTheme.cellFont,
                  padding: '0 8px',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {scrollIndicators.showX && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: scrollIndicators.showY ? 10 : 0,
            bottom: 0,
            height: 8,
            background: 'rgba(107, 114, 128, 0.18)',
            borderRadius: 999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${scrollIndicators.xPos}px`,
              width: `${scrollIndicators.xSize}px`,
              height: '100%',
              background: 'rgba(55, 65, 81, 0.6)',
              borderRadius: 999,
            }}
          />
        </div>
      )}

      {scrollIndicators.showY && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: scrollIndicators.showX ? 10 : 0,
            right: 0,
            width: 8,
            background: 'rgba(107, 114, 128, 0.18)',
            borderRadius: 999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `${scrollIndicators.yPos}px`,
              width: '100%',
              height: `${scrollIndicators.ySize}px`,
              background: 'rgba(55, 65, 81, 0.6)',
              borderRadius: 999,
            }}
          />
        </div>
      )}
    </div>
  );
}
