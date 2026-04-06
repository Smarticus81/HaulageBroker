'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Search } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ComplianceItem {
  id: string;
  subjectName: string;
  subjectType: string;
  artifactType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  evidenceDoc: string | null;
  [key: string]: unknown;
}

const mockCompliance: ComplianceItem[] = [
  { id: 'C-001', subjectName: 'John Smith', subjectType: 'Driver', artifactType: 'CDL', issueDate: '2024-04-15', expiryDate: '2026-04-15', status: 'expiring', evidenceDoc: 'CDL_jsmith.pdf' },
  { id: 'C-002', subjectName: 'Maria Garcia', subjectType: 'Driver', artifactType: 'Medical Card', issueDate: '2024-04-20', expiryDate: '2026-04-20', status: 'expiring', evidenceDoc: 'med_mgarcia.pdf' },
  { id: 'C-003', subjectName: 'Bob Wilson', subjectType: 'Driver', artifactType: 'Drug Test', issueDate: '2025-05-01', expiryDate: '2026-05-01', status: 'active', evidenceDoc: 'drug_bwilson.pdf' },
  { id: 'C-004', subjectName: 'Truck #T-205', subjectType: 'Truck', artifactType: 'Annual Inspection', issueDate: '2025-04-12', expiryDate: '2026-04-12', status: 'expiring', evidenceDoc: 'insp_t205.pdf' },
  { id: 'C-005', subjectName: 'Truck #T-210', subjectType: 'Truck', artifactType: 'Registration', issueDate: '2025-06-01', expiryDate: '2026-06-01', status: 'active', evidenceDoc: 'reg_t210.pdf' },
  { id: 'C-006', subjectName: 'Trailer #TR-118', subjectType: 'Trailer', artifactType: 'Registration', issueDate: '2025-04-28', expiryDate: '2026-04-28', status: 'expiring', evidenceDoc: null },
  { id: 'C-007', subjectName: 'Trailer #TR-122', subjectType: 'Trailer', artifactType: 'Annual Inspection', issueDate: '2025-07-15', expiryDate: '2026-07-15', status: 'active', evidenceDoc: 'insp_tr122.pdf' },
  { id: 'C-008', subjectName: 'John Smith', subjectType: 'Driver', artifactType: 'MVR', issueDate: '2025-10-01', expiryDate: '2026-10-01', status: 'active', evidenceDoc: 'mvr_jsmith.pdf' },
  { id: 'C-009', subjectName: 'Truck #T-201', subjectType: 'Truck', artifactType: 'Insurance', issueDate: '2025-01-01', expiryDate: '2026-01-01', status: 'expired', evidenceDoc: 'ins_t201.pdf' },
  { id: 'C-010', subjectName: 'Maria Garcia', subjectType: 'Driver', artifactType: 'CDL', issueDate: '2022-08-15', expiryDate: '2026-08-15', status: 'active', evidenceDoc: 'cdl_mgarcia.pdf' },
];

const summaryStats = {
  active: mockCompliance.filter((c) => c.status === 'active').length,
  expiring: mockCompliance.filter((c) => c.status === 'expiring').length,
  expired: mockCompliance.filter((c) => c.status === 'expired').length,
  total: mockCompliance.length,
};

const tabOptions = ['All', 'By Driver', 'By Truck', 'By Trailer'];
const statusFilterOptions = ['All', 'Active', 'Expiring', 'Expired'];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const criticalCount = mockCompliance.filter((c) => c.status === 'expired' || c.status === 'expiring').length;

  const filtered = mockCompliance.filter((c) => {
    if (activeTab === 'By Driver' && c.subjectType !== 'Driver') return false;
    if (activeTab === 'By Truck' && c.subjectType !== 'Truck') return false;
    if (activeTab === 'By Trailer' && c.subjectType !== 'Trailer') return false;
    if (statusFilter !== 'All' && c.status !== statusFilter.toLowerCase()) return false;
    if (search && !c.subjectName.toLowerCase().includes(search.toLowerCase()) && !c.artifactType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: Column<ComplianceItem>[] = [
    { key: 'subjectName', header: 'Subject', sortable: true, render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.subjectName}</p>
        <p className="text-xs text-slate-500">{row.subjectType}</p>
      </div>
    )},
    { key: 'artifactType', header: 'Artifact Type', sortable: true },
    { key: 'issueDate', header: 'Issue Date', sortable: true, width: '110px', render: (row) => formatDate(row.issueDate) },
    { key: 'expiryDate', header: 'Expiry Date', sortable: true, width: '110px', render: (row) => (
      <span className={row.status === 'expired' ? 'text-red-600 font-medium' : row.status === 'expiring' ? 'text-amber-600 font-medium' : ''}>
        {formatDate(row.expiryDate)}
      </span>
    )},
    { key: 'status', header: 'Status', sortable: true, width: '120px', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'evidenceDoc', header: 'Evidence', render: (row) => (
      row.evidenceDoc ? (
        <span className="text-sm text-blue-600 hover:underline cursor-pointer">{row.evidenceDoc}</span>
      ) : (
        <span className="text-sm text-red-500">Missing</span>
      )
    )},
    { key: 'actions', header: '', width: '80px', render: () => (
      <button className="btn-ghost text-xs">View</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Compliance Center</h1>
        <p className="text-sm text-slate-500">Monitor driver, truck, and trailer compliance artifacts</p>
      </div>

      {/* Alert banner */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {criticalCount} compliance item{criticalCount > 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} attention
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {summaryStats.expired} expired, {summaryStats.expiring} expiring within 30 days
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Active" value={summaryStats.active} icon={Shield} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatsCard label="Expiring Soon" value={summaryStats.expiring} icon={Shield} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard label="Expired" value={summaryStats.expired} icon={Shield} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatsCard label="Total" value={summaryStats.total} icon={Shield} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1">
          {tabOptions.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32">
            {statusFilterOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 w-48" />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} />
    </div>
  );
}
