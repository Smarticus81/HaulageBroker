'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Upload, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Load {
  id: string;
  loadNumber: string;
  customer: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  amount: number;
  status: string;
  docsPresent: number;
  docsRequired: number;
  [key: string]: unknown;
}

const mockLoads: Load[] = [
  { id: '1', loadNumber: 'LD-1024', customer: 'Walmart Distribution', origin: 'Dallas, TX', destination: 'Memphis, TN', pickupDate: '2026-04-01', deliveryDate: '2026-04-02', amount: 3200, status: 'complete', docsPresent: 3, docsRequired: 5 },
  { id: '2', loadNumber: 'LD-1031', customer: 'Target Logistics', origin: 'Chicago, IL', destination: 'Indianapolis, IN', pickupDate: '2026-04-02', deliveryDate: '2026-04-03', amount: 1850, status: 'complete', docsPresent: 4, docsRequired: 5 },
  { id: '3', loadNumber: 'LD-1038', customer: 'Amazon Freight', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', pickupDate: '2026-04-03', deliveryDate: '2026-04-04', amount: 2100, status: 'in_transit', docsPresent: 2, docsRequired: 5 },
  { id: '4', loadNumber: 'LD-1042', customer: 'Costco Wholesale', origin: 'Seattle, WA', destination: 'Portland, OR', pickupDate: '2026-04-04', deliveryDate: '2026-04-05', amount: 950, status: 'in_transit', docsPresent: 4, docsRequired: 5 },
  { id: '5', loadNumber: 'LD-1045', customer: 'Home Depot Supply', origin: 'Atlanta, GA', destination: 'Charlotte, NC', pickupDate: '2026-04-05', deliveryDate: '2026-04-06', amount: 1600, status: 'active', docsPresent: 1, docsRequired: 5 },
  { id: '6', loadNumber: 'LD-1047', customer: 'Kroger Transport', origin: 'Cincinnati, OH', destination: 'Louisville, KY', pickupDate: '2026-03-28', deliveryDate: '2026-03-29', amount: 780, status: 'complete', docsPresent: 0, docsRequired: 5 },
  { id: '7', loadNumber: 'LD-1050', customer: 'FedEx Freight', origin: 'Nashville, TN', destination: 'Birmingham, AL', pickupDate: '2026-04-06', deliveryDate: '2026-04-07', amount: 1200, status: 'active', docsPresent: 2, docsRequired: 5 },
  { id: '8', loadNumber: 'LD-1053', customer: 'UPS Supply Chain', origin: 'Denver, CO', destination: 'Salt Lake City, UT', pickupDate: '2026-04-06', deliveryDate: '2026-04-07', amount: 2450, status: 'active', docsPresent: 1, docsRequired: 5 },
  { id: '9', loadNumber: 'LD-1055', customer: 'Walmart Distribution', origin: 'Houston, TX', destination: 'San Antonio, TX', pickupDate: '2026-04-05', deliveryDate: '2026-04-05', amount: 650, status: 'complete', docsPresent: 5, docsRequired: 5 },
  { id: '10', loadNumber: 'LD-1058', customer: 'Target Logistics', origin: 'Miami, FL', destination: 'Orlando, FL', pickupDate: '2026-04-07', deliveryDate: '2026-04-08', amount: 1100, status: 'pending', docsPresent: 0, docsRequired: 5 },
];

const statusOptions = ['All', 'Active', 'In Transit', 'Complete', 'Pending'];
const customerOptions = ['All', 'Walmart Distribution', 'Target Logistics', 'Amazon Freight', 'Costco Wholesale', 'Home Depot Supply', 'Kroger Transport'];

export default function LoadsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockLoads.filter((load) => {
    if (statusFilter !== 'All' && load.status !== statusFilter.toLowerCase().replace(' ', '_')) return false;
    if (customerFilter !== 'All' && load.customer !== customerFilter) return false;
    if (searchQuery && !load.loadNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const columns: Column<Load>[] = [
    { key: 'loadNumber', header: 'Load #', sortable: true, width: '100px', render: (row) => (
      <span className="font-medium text-blue-600">{row.loadNumber}</span>
    )},
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'route', header: 'Route', render: (row) => (
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-700">{row.origin}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-700">{row.destination}</span>
      </div>
    )},
    { key: 'pickupDate', header: 'Pickup', sortable: true, width: '110px', render: (row) => formatDate(row.pickupDate) },
    { key: 'deliveryDate', header: 'Delivery', sortable: true, width: '110px', render: (row) => formatDate(row.deliveryDate) },
    { key: 'amount', header: 'Amount', sortable: true, width: '100px', render: (row) => (
      <span className="font-medium">{formatCurrency(row.amount)}</span>
    )},
    { key: 'status', header: 'Status', sortable: true, width: '120px', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'docs', header: 'Docs', width: '80px', render: (row) => (
      <span className={`text-sm font-medium ${row.docsPresent === row.docsRequired ? 'text-green-600' : row.docsPresent === 0 ? 'text-red-600' : 'text-amber-600'}`}>
        {row.docsPresent}/{row.docsRequired}
      </span>
    )},
    { key: 'actions', header: '', width: '100px', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); router.push(`/loads/${row.loadNumber}`); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="View">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Upload Doc">
          <Upload className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Exception">
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Load Records</h1>
        <p className="text-sm text-slate-500">View and manage all load records and their documentation</p>
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-36">
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Customer</label>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="input w-48">
              {customerOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Search Load #</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="LD-..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 w-44"
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => router.push(`/loads/${row.loadNumber}`)}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
