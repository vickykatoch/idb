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
export declare function EficcGrid({ columns, rows, className, emptyState, }: EficcGridProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=EficcGrid.d.ts.map