'use client';

import { useState } from 'react';
import { Search, Eye, X, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Settlement {
  id: string;
  driverName: string;
  period: string;
  loadsCount: number;
  totalPay: number;
  deductions: number;
  netPay: number;
  status: string;
  missingDocs: number;
  loads: { loadNumber: string; amount: number; docsComplete: boolean }[];
  [key: string]: unknown;
}

const mockSettlements: Settlement[] = [
  {
    id: 'STL-001', driverName: 'John Smith', period: 'Mar 25 - Apr 5, 2026', loadsCount: 8,
    totalPay: 6400, deductions: 850, netPay: 5550, status: 'pending', missingDocs: 2,
    loads: [
      { loadNumber: 'LD-1024', amount: 960, docsComplete: false },
      { loadNumber: 'LD-1031', amount: 555, docsComplete: true },
      { loadNumber: 'LD-1038', amount: 630, docsComplete: false },
      { loadNumber: 'LD-1045', amount: 480, docsComplete: true },
    ],
  },
  {
    id: 'STL-002', driverName: 'Maria Garcia', period: 'Mar 25 - Apr 5, 2026', loadsCount: 6,
    totalPay: 4800, deductions: 620, netPay: 4180, status: 'approved', missingDocs: 0,
    loads: [
      { loadNumber: 'LD-1042', amount: 285, docsComplete: true },
      { loadNumber: 'LD-1055', amount: 195, docsComplete: true },
    ],
  },
  {
    id: 'STL-003', driverName: 'Bob Wilson', period: 'Mar 25 - Apr 5, 2026', loadsCount: 7,
    totalPay: 5600, deductions: 720, netPay: 4880, status: 'pending', missingDocs: 1,
    loads: [
      { loadNumber: 'LD-1047', amount: 234, docsComplete: false },
      { loadNumber: 'LD-1050', amount: 360, docsComplete: true },
    ],
  },
  {
    id: 'STL-004', driverName: 'Carlos Rodriguez', period: 'Mar 25 - Apr 5, 2026', loadsCount: 5,
    totalPay: 4200, deductions: 540, netPay: 3660, status: 'paid', missingDocs: 0,
    loads: [
      { loadNumber: 'LD-1053', amount: 735, docsComplete: true },
    ],
  },
  {
    id: 'STL-005', driverName: 'John Smith', period: 'Mar 11 - Mar 24, 2026', loadsCount: 9,
    totalPay: 7200, deductions: 980, netPay: 6220, status: 'paid', missingDocs: 0,
    loads: [],
  },
  {
    id: 'STL-006', driverName: 'Maria Garcia', period: 'Mar 11 - Mar 24, 2026', loadsCount: 7,
    totalPay: 5100, deductions: 650, netPay: 4450, status: 'paid', missingDocs: 0,
    loads: [],
  },
];

const driverOptions = ['All', 'John Smith', 'Maria Garcia', 'Bob Wilson', 'Carlos Rodriguez'];
const statusOptions = ['All', 'Pending', 'Approved', 'Paid'];

export default function SettlementsPage() {
  const [driverFilter, setDriverFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  const filtered = mockSettlements.filter((s) => {
    if (driverFilter !== 'All' && s.driverName !== driverFilter) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const columns: Column<Settlement>[] = [
    { key: 'driverName', header: 'Driver', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.driverName}</span> },
    { key: 'period', header: 'Period', sortable: true },
    { key: 'loadsCount', header: 'Loads', sortable: true, width: '70px', render: (row) => <span className="text-center">{row.loadsCount}</span> },
    { key: 'totalPay', header: 'Total Pay', sortable: true, render: (row) => formatCurrency(row.totalPay) },
    { key: 'deductions', header: 'Deductions', sortable: true, render: (row) => <span className="text-red-600">{formatCurrency(row.deductions)}</span> },
    { key: 'netPay', header: 'Net Pay', sortable: true, render: (row) => <span className="font-semibold">{formatCurrency(row.netPay)}</span> },
    { key: 'status', header: 'Status', sortable: true, width: '110px', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'missingDocs', header: 'Missing Docs', width: '100px', render: (row) => (
      row.missingDocs > 0
        ? <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{row.missingDocs}</span>
        : <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />0</span>
    )},
    { key: 'actions', header: '', width: '60px', render: (row) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedSettlement(row); }} className="p-1 rounded hover:bg-slate-100 text-slate-500">
        <Eye className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Settlements</h1>
        <p className="text-sm text-slate-500">Driver settlement support with document verification</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="label">Driver</label>
            <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="input w-48">
              {driverOptions.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setSelectedSettlement(row)} />

      {/* Detail modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedSettlement(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedSettlement.driverName}</h3>
                <p className="text-sm text-slate-500">{selectedSettlement.period}</p>
              </div>
              <button onClick={() => setSelectedSettlement(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Total Pay</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedSettlement.totalPay)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-500">Deductions</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(selectedSettlement.deductions)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Net Pay</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(selectedSettlement.netPay)}</p>
                </div>
              </div>

              {/* Included loads */}
              {selectedSettlement.loads.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Included Loads</h4>
                  <div className="space-y-1.5">
                    {selectedSettlement.loads.map((load) => (
                      <div key={load.loadNumber} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">{load.loadNumber}</span>
                          <span className="text-sm text-slate-600">{formatCurrency(load.amount)}</span>
                        </div>
                        {load.docsComplete ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" />Docs complete</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-3.5 h-3.5" />Missing docs</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={selectedSettlement.status} size="md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
