'use client';

import { useState } from 'react';
import { Download, Eye, Check, X, FileText, Package } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InvoicePacket {
  id: string;
  loadNumber: string;
  customer: string;
  status: string;
  docsReady: number;
  docsRequired: number;
  createdDate: string;
  [key: string]: unknown;
}

interface InvoiceDraft {
  id: string;
  invoiceNumber: string;
  customer: string;
  loadNumber: string;
  total: number;
  status: string;
  createdDate: string;
  [key: string]: unknown;
}

const mockPackets: InvoicePacket[] = [
  { id: 'PKT-001', loadNumber: 'LD-1024', customer: 'Walmart Distribution', status: 'pending', docsReady: 3, docsRequired: 5, createdDate: '2026-04-05' },
  { id: 'PKT-002', loadNumber: 'LD-1031', customer: 'Target Logistics', status: 'approved', docsReady: 5, docsRequired: 5, createdDate: '2026-04-04' },
  { id: 'PKT-003', loadNumber: 'LD-1055', customer: 'Walmart Distribution', status: 'approved', docsReady: 5, docsRequired: 5, createdDate: '2026-04-03' },
  { id: 'PKT-004', loadNumber: 'LD-1038', customer: 'Amazon Freight', status: 'pending', docsReady: 2, docsRequired: 5, createdDate: '2026-04-03' },
  { id: 'PKT-005', loadNumber: 'LD-1042', customer: 'Costco Wholesale', status: 'pending', docsReady: 4, docsRequired: 5, createdDate: '2026-04-02' },
  { id: 'PKT-006', loadNumber: 'LD-1047', customer: 'Kroger Transport', status: 'rejected', docsReady: 0, docsRequired: 5, createdDate: '2026-04-01' },
];

const mockDrafts: InvoiceDraft[] = [
  { id: 'D-001', invoiceNumber: 'INV-2026-0401', customer: 'Target Logistics', loadNumber: 'LD-1031', total: 1850, status: 'draft', createdDate: '2026-04-05' },
  { id: 'D-002', invoiceNumber: 'INV-2026-0402', customer: 'Walmart Distribution', loadNumber: 'LD-1055', total: 650, status: 'draft', createdDate: '2026-04-05' },
  { id: 'D-003', invoiceNumber: 'INV-2026-0398', customer: 'FedEx Freight', loadNumber: 'LD-1015', total: 2200, status: 'approved', createdDate: '2026-04-03' },
  { id: 'D-004', invoiceNumber: 'INV-2026-0395', customer: 'Amazon Freight', loadNumber: 'LD-1010', total: 3100, status: 'approved', createdDate: '2026-04-02' },
  { id: 'D-005', invoiceNumber: 'INV-2026-0390', customer: 'UPS Supply Chain', loadNumber: 'LD-1005', total: 1450, status: 'sent', createdDate: '2026-04-01' },
];

const tabs = ['Invoice Packets', 'Invoice Drafts'];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('Invoice Packets');
  const [selectedPacket, setSelectedPacket] = useState<InvoicePacket | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const packetColumns: Column<InvoicePacket>[] = [
    { key: 'loadNumber', header: 'Load #', sortable: true, render: (row) => <span className="font-medium text-blue-600">{row.loadNumber}</span> },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'docsReady', header: 'Docs Ready', render: (row) => (
      <span className={cn('font-medium', row.docsReady === row.docsRequired ? 'text-green-600' : 'text-amber-600')}>
        {row.docsReady}/{row.docsRequired}
      </span>
    )},
    { key: 'createdDate', header: 'Created', sortable: true, render: (row) => formatDate(row.createdDate) },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelectedPacket(row); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="View">
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'pending' && row.docsReady === row.docsRequired && (
          <button className="p-1 rounded hover:bg-green-100 text-green-600" title="Approve">
            <Check className="w-4 h-4" />
          </button>
        )}
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Export">
          <Download className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  const draftColumns: Column<InvoiceDraft>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.invoiceNumber}</span> },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'loadNumber', header: 'Load #', sortable: true, render: (row) => <span className="text-blue-600">{row.loadNumber}</span> },
    { key: 'total', header: 'Total', sortable: true, render: (row) => <span className="font-medium">{formatCurrency(row.total)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdDate', header: 'Created', sortable: true, render: (row) => formatDate(row.createdDate) },
    { key: 'actions', header: '', render: () => (
      <div className="flex items-center gap-1">
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><Eye className="w-4 h-4" /></button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500"><Download className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">Manage invoice packets and billing paperwork</p>
        </div>
        <button className="btn-secondary flex items-center gap-1.5">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Invoice Packets' && (
        <DataTable columns={packetColumns} data={mockPackets} keyExtractor={(row) => row.id} onRowClick={(row) => setSelectedPacket(row)} />
      )}

      {activeTab === 'Invoice Drafts' && (
        <DataTable columns={draftColumns} data={mockDrafts} keyExtractor={(row) => row.id} />
      )}

      {/* Approval dialog */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedPacket(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Invoice Packet: {selectedPacket.loadNumber}</h3>
              <button onClick={() => setSelectedPacket(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Customer</span>
                  <p className="font-medium text-slate-900">{selectedPacket.customer}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <div className="mt-0.5"><StatusBadge status={selectedPacket.status} /></div>
                </div>
                <div>
                  <span className="text-slate-500">Documents Ready</span>
                  <p className="font-medium">{selectedPacket.docsReady}/{selectedPacket.docsRequired}</p>
                </div>
                <div>
                  <span className="text-slate-500">Created</span>
                  <p className="font-medium">{formatDate(selectedPacket.createdDate)}</p>
                </div>
              </div>

              {/* Docs checklist */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Required Documents</h4>
                {['BOL', 'POD', 'Rate Confirmation', 'Lumper Receipt', 'Weight Ticket'].map((doc, i) => (
                  <div key={doc} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700">{doc}</span>
                    <span className={cn('w-2.5 h-2.5 rounded-full', i < selectedPacket.docsReady ? 'bg-green-500' : 'bg-red-400')} />
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="input h-20 resize-none"
                  placeholder="Add approval or rejection notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  disabled={selectedPacket.docsReady < selectedPacket.docsRequired}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1.5">
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
