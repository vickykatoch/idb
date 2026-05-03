import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EficcGrid({ columns, rows, className, emptyState = 'No rows available', }) {
    if (rows.length === 0) {
        return _jsx("div", { className: className, children: emptyState });
    }
    return (_jsx("div", { className: className, children: _jsxs("table", { role: "grid", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map(column => (_jsx("th", { scope: "col", children: column.header }, column.key))) }) }), _jsx("tbody", { children: rows.map((row, index) => (_jsx("tr", { children: columns.map(column => (_jsx("td", { children: row[column.key] ?? null }, column.key))) }, index))) })] }) }));
}
//# sourceMappingURL=EficcGrid.js.map