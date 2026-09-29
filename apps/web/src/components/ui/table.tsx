'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  width?: string;
  className?: string;
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  empty,
  dense,
  className,
  selectedId,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  dense?: boolean;
  className?: string;
  selectedId?: string | null;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const av = sv(a) ?? '';
      const bv = sv(b) ?? '';
      const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, sort, columns]);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {columns.map((c) => {
              const sortable = !!c.sortValue;
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(
                    'sticky top-0 z-10 border-b border-line bg-surface/90 px-4 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3 backdrop-blur',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.hideBelow && hide[c.hideBelow],
                  )}
                >
                  {sortable ? (
                    <button
                      onClick={() => setSort(active && sort?.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}
                      className={cn('inline-flex items-center gap-1 hover:text-ink', active && 'text-ink', c.align === 'right' && 'flex-row-reverse')}
                    >
                      {c.header}
                      {active ? (sort?.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length}>{empty ?? <div className="px-4 py-10 text-center text-sm text-ink-3">Nothing here.</div>}</td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'group transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface-2',
                selectedId === row.id && 'bg-signal-soft/60',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'border-b border-line-soft px-4 align-middle text-ink-2 group-last:border-b-0',
                    dense ? 'py-2' : 'py-3',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.hideBelow && hide[c.hideBelow],
                    c.className,
                  )}
                >
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
