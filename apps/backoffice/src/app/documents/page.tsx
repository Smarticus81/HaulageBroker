'use client';

import { useState } from 'react';
import { Upload, Eye, Tag, CheckSquare, Link2, X, FileText, Search, Filter } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { FileUpload } from '@/components/file-upload';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  filename: string;
  type: string;
  linkedLoad: string | null;
  uploadedBy: string;
  uploadedAt: string;
  validationStatus: string;
  extractedFields?: Record<string, string>;
  [key: string]: unknown;
}

const mockDocuments: Document[] = [
  { id: 'DOC-001', filename: 'BOL_LD1024_signed.pdf', type: 'BOL', linkedLoad: 'LD-1024', uploadedBy: 'John Doe', uploadedAt: '2026-04-05T14:30:00Z', validationStatus: 'valid', extractedFields: { 'Shipper': 'Acme Corp', 'Load #': 'LD-1024', 'Weight': '42,000 lbs' } },
  { id: 'DOC-002', filename: 'POD_delivery_4032.pdf', type: 'POD', linkedLoad: 'LD-1031', uploadedBy: 'Maria Garcia', uploadedAt: '2026-04-05T11:15:00Z', validationStatus: 'pending_review', extractedFields: { 'Receiver': 'Target DC', 'Delivery Date': '04/03/2026' } },
  { id: 'DOC-003', filename: 'rate_conf_amazon.pdf', type: 'Rate Confirmation', linkedLoad: 'LD-1038', uploadedBy: 'System', uploadedAt: '2026-04-04T09:00:00Z', validationStatus: 'valid' },
  { id: 'DOC-004', filename: 'scan_20260403_001.jpg', type: 'Unknown', linkedLoad: null, uploadedBy: 'Bob Wilson', uploadedAt: '2026-04-03T16:45:00Z', validationStatus: 'needs_review' },
  { id: 'DOC-005', filename: 'lumper_receipt_1024.pdf', type: 'Lumper Receipt', linkedLoad: 'LD-1024', uploadedBy: 'John Doe', uploadedAt: '2026-04-03T10:20:00Z', validationStatus: 'valid' },
  { id: 'DOC-006', filename: 'BOL_costco_042.pdf', type: 'BOL', linkedLoad: 'LD-1042', uploadedBy: 'System', uploadedAt: '2026-04-02T08:30:00Z', validationStatus: 'invalid', extractedFields: { 'Shipper': 'Costco', 'Load #': 'Unreadable' } },
  { id: 'DOC-007', filename: 'insurance_cert_2026.pdf', type: 'Insurance Certificate', linkedLoad: null, uploadedBy: 'Admin', uploadedAt: '2026-04-01T14:00:00Z', validationStatus: 'valid' },
  { id: 'DOC-008', filename: 'POD_kroger_unsigned.pdf', type: 'POD', linkedLoad: 'LD-1047', uploadedBy: 'Maria Garcia', uploadedAt: '2026-04-01T11:00:00Z', validationStatus: 'invalid' },
  { id: 'DOC-009', filename: 'weight_ticket_1038.jpg', type: 'Weight Ticket', linkedLoad: 'LD-1038', uploadedBy: 'Driver App', uploadedAt: '2026-03-31T15:30:00Z', validationStatus: 'valid' },
  { id: 'DOC-010', filename: 'detention_letter_1019.pdf', type: 'Detention Letter', linkedLoad: 'LD-1019', uploadedBy: 'John Doe', uploadedAt: '2026-03-30T09:45:00Z', validationStatus: 'pending_review' },
];

const tabs = ['All', 'Pending Review', 'Valid', 'Invalid', 'Needs Review'];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = mockDocuments.filter((doc) => {
    if (activeTab === 'Pending Review') return doc.validationStatus === 'pending_review';
    if (activeTab === 'Valid') return doc.validationStatus === 'valid';
    if (activeTab === 'Invalid') return doc.validationStatus === 'invalid';
    if (activeTab === 'Needs Review') return doc.validationStatus === 'needs_review';
    return true;
  }).filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return doc.filename.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q) || (doc.linkedLoad?.toLowerCase().includes(q) ?? false);
  });

  const columns: Column<Document>[] = [
    { key: 'filename', header: 'Filename', sortable: true, render: (row) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-900">{row.filename}</span>
      </div>
    )},
    { key: 'type', header: 'Type', sortable: true, render: (row) => (
      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">{row.type}</span>
    )},
    { key: 'linkedLoad', header: 'Load #', sortable: true, render: (row) => (
      row.linkedLoad ? <span className="text-blue-600 font-medium">{row.linkedLoad}</span> : <span className="text-slate-400">Unlinked</span>
    )},
    { key: 'uploadedBy', header: 'Uploaded By', sortable: true },
    { key: 'uploadedAt', header: 'Uploaded', sortable: true, render: (row) => (
      <span className="text-slate-500">{formatDateTime(row.uploadedAt)}</span>
    )},
    { key: 'validationStatus', header: 'Status', sortable: true, render: (row) => (
      <StatusBadge status={row.validationStatus} />
    )},
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelectedDoc(row); }} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="View">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Classify">
          <Tag className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Validate">
          <CheckSquare className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Link">
          <Link2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Document Inbox</h1>
          <p className="text-sm text-slate-500">Manage uploaded documents and their validation status</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Upload dialog */}
      {showUpload && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Upload Documents</h3>
            <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <FileUpload onUpload={(files) => console.log('Uploaded:', files)} />
        </div>
      )}

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredDocs}
        onRowClick={(row) => setSelectedDoc(row)}
        keyExtractor={(row) => row.id}
      />

      {/* Detail Panel */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedDoc(null)} />
          <div className="relative w-[480px] bg-white h-full shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{selectedDoc.filename}</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* OCR Preview area */}
              <div className="bg-slate-100 rounded-lg h-64 flex items-center justify-center text-slate-400 text-sm border border-slate-200">
                Document Preview Area
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900">{selectedDoc.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <StatusBadge status={selectedDoc.validationStatus} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Linked Load</span>
                  <span className="font-medium text-blue-600">{selectedDoc.linkedLoad || 'None'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Uploaded By</span>
                  <span className="text-slate-700">{selectedDoc.uploadedBy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Uploaded At</span>
                  <span className="text-slate-700">{formatDateTime(selectedDoc.uploadedAt)}</span>
                </div>
              </div>

              {/* Extracted Fields */}
              {selectedDoc.extractedFields && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Extracted Fields</h4>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedDoc.extractedFields).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-slate-500">{key}</span>
                        <span className="text-slate-700 font-mono text-xs">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link/Unlink Controls */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Link to Load</h4>
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter load number..." className="input flex-1" defaultValue={selectedDoc.linkedLoad || ''} />
                  <button className="btn-primary">Link</button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="btn-secondary flex-1">Reclassify</button>
                <button className="btn-secondary flex-1">Re-extract</button>
                <button className="btn-primary flex-1">Validate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
