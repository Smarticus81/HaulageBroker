'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, MapPin, Calendar, DollarSign, User, FileText, AlertTriangle, Package, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { DocChecklist } from '@/components/doc-checklist';
import { FileUpload } from '@/components/file-upload';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const mockLoad = {
  loadNumber: 'LD-1024',
  customer: 'Walmart Distribution',
  origin: 'Dallas, TX',
  destination: 'Memphis, TN',
  pickupDate: '2026-04-01',
  deliveryDate: '2026-04-02',
  amount: 3200,
  status: 'complete',
  driver: 'John Smith',
  truck: 'T-205',
  trailer: 'TR-118',
  weight: '42,000 lbs',
  commodity: 'Consumer Electronics',
};

const docCheckItems = [
  { type: 'bol', label: 'Bill of Lading (BOL)', required: true, present: true, documentId: 'DOC-001', uploadedAt: '2026-04-05T14:30:00Z', status: 'valid' as const },
  { type: 'pod', label: 'Proof of Delivery (POD)', required: true, present: false },
  { type: 'rate_confirmation', label: 'Rate Confirmation', required: true, present: true, documentId: 'DOC-003', uploadedAt: '2026-04-04T09:00:00Z', status: 'valid' as const },
  { type: 'lumper', label: 'Lumper Receipt', required: false, present: true, documentId: 'DOC-005', uploadedAt: '2026-04-03T10:20:00Z', status: 'valid' as const },
  { type: 'weight_ticket', label: 'Weight Ticket', required: false, present: false },
];

const exceptions = [
  { id: 'EX-301', severity: 'critical', description: 'Missing BOL for delivered load - invoice packet blocked', createdAt: '2026-04-05T10:00:00Z', status: 'open' },
  { id: 'EX-288', severity: 'warning', description: 'Delivery date mismatch between BOL and system record', createdAt: '2026-04-03T08:15:00Z', status: 'resolved' },
];

const timeline = [
  { action: 'Load created', actor: 'System', timestamp: '2026-03-30T09:00:00Z', details: 'Load imported from TMS' },
  { action: 'Rate confirmation uploaded', actor: 'System', timestamp: '2026-04-01T08:00:00Z', details: 'Auto-imported from email' },
  { action: 'Pickup completed', actor: 'John Smith', timestamp: '2026-04-01T14:30:00Z', details: 'Driver confirmed pickup' },
  { action: 'Delivery completed', actor: 'John Smith', timestamp: '2026-04-02T10:15:00Z', details: 'Driver confirmed delivery' },
  { action: 'BOL uploaded', actor: 'John Doe', timestamp: '2026-04-05T14:30:00Z', details: 'Manually uploaded and linked' },
  { action: 'Lumper receipt uploaded', actor: 'John Doe', timestamp: '2026-04-03T10:20:00Z', details: 'Scanned from driver paperwork' },
  { action: 'Exception created', actor: 'System', timestamp: '2026-04-05T10:00:00Z', details: 'Missing POD - auto-detected' },
];

const tabs = ['Documents', 'Exceptions', 'Invoice Packet', 'Timeline'];

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Documents');
  const [showUpload, setShowUpload] = useState(false);

  const packetReady = docCheckItems.filter((d) => d.required && d.present).length === docCheckItems.filter((d) => d.required).length;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Loads
      </button>

      {/* Load Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">{mockLoad.loadNumber}</h1>
              <StatusBadge status={mockLoad.status} size="md" />
            </div>
            <p className="text-sm text-slate-500 mt-1">{mockLoad.customer}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(mockLoad.amount)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-200">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Origin</p>
              <p className="text-sm font-medium text-slate-900">{mockLoad.origin}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Destination</p>
              <p className="text-sm font-medium text-slate-900">{mockLoad.destination}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Pickup</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(mockLoad.pickupDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Delivery</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(mockLoad.deliveryDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Document Checklist</h2>
            <button onClick={() => setShowUpload((s) => !s)} className="btn-primary flex items-center gap-1.5 text-sm">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
          {showUpload && (
            <div className="card p-4">
              <FileUpload onUpload={(files) => console.log('Upload:', files)} />
            </div>
          )}
          <div className="card p-4">
            <DocChecklist items={docCheckItems} />
          </div>
        </div>
      )}

      {activeTab === 'Exceptions' && (
        <div className="space-y-3">
          {exceptions.map((ex) => (
            <div key={ex.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('w-4 h-4', ex.severity === 'critical' ? 'text-red-500' : ex.severity === 'warning' ? 'text-amber-500' : 'text-blue-500')} />
                  <span className="text-sm font-medium text-slate-900">{ex.id}</span>
                  <StatusBadge status={ex.severity} />
                  <StatusBadge status={ex.status} />
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(ex.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700">{ex.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Invoice Packet' && (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Invoice Packet Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {packetReady ? 'All required documents present' : 'Missing required documents'}
              </p>
            </div>
            <StatusBadge status={packetReady ? 'approved' : 'pending'} size="md" />
          </div>
          <div className="space-y-2">
            {docCheckItems.filter((d) => d.required).map((d) => (
              <div key={d.type} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-full', d.present ? 'bg-green-500' : 'bg-red-500')} />
                  <span className="text-sm text-slate-700">{d.label}</span>
                </div>
                <span className={cn('text-xs font-medium', d.present ? 'text-green-600' : 'text-red-600')}>
                  {d.present ? 'Present' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
          <button disabled={!packetReady} className="btn-primary w-full">
            {packetReady ? 'Approve Invoice Packet' : 'Cannot Approve - Missing Documents'}
          </button>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="card p-5">
          <div className="space-y-0">
            {timeline.map((entry, i) => (
              <div key={i} className="flex gap-4 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                    <span className="text-xs text-slate-400">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">by {entry.actor}</p>
                  <p className="text-sm text-slate-600 mt-1">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
