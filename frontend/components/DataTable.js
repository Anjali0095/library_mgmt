import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

export default function DataTable({
  columns,       // [{ key, label, render?, sortable? }]
  data,          // rows array
  total,
  page,
  totalPages,
  onPageChange,
  onSearch,
  searchPlaceholder,
  loading,
  actions,       // optional JSX buttons in toolbar
  emptyMessage = 'No data found',
}) {
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {onSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              placeholder={searchPlaceholder || 'Search...'}
              value={search}
              onChange={handleSearch}
            />
          </div>
        )}
        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {total ? `${total} records` : ''}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table" style={{ padding: '0 8px' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      <div className="skeleton h-5 rounded-md" style={{ width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📭</div>
                    <div>{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              data?.map((row, i) => (
                <tr key={row.id || i} style={{ animationDelay: `${i * 30}ms` }}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1,
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                  style={{
                    background: p === page ? 'var(--accent)' : 'var(--bg-secondary)',
                    border: `1px solid ${p === page ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    color: p === page ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.4 : 1,
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
