'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Tag, CheckSquare, Link2, FileText, Download } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime } from '@/lib/utils';

const mockDoc = {
  id: 'DOC-001',
  filename: 'BOL_LD1024_signed.pdf',
  type: 'BOL',
  linkedLoad: 'LD-1024',
  linkedEntity: { type: 'Load', id: 'LD-1024', customer: 'Walmart Distribution', route: 'Dallas, TX -> Memphis, TN' },
  uploadedBy: 'John Doe',
  uploadedAt: '2026-04-05T14:30:00Z',
  validationStatus: 'valid',
  extractedFields: {
    'Shipper Name': 'Acme Corp',
    'Shipper Address': '1234 Industrial Blvd, Dallas, TX 75201',
    'Consignee Name': 'Walmart DC #4032',
    'Consignee Address': '5678 Distribution Way, Memphis, TN 38118',
    'Load Number': 'LD-1024',
    'Weight': '42,000 lbs',
    'Pieces': '24 pallets',
    'Pickup Date': '04/01/2026',
    'Delivery Date': '04/02/2026',
    'Commodity': 'Consumer Electronics',
  },
  validationResults: [
    { field: 'Load Number', status: 'pass', message: 'Matches linked load' },
    { field: 'Shipper Name', status: 'pass', message: 'Matches customer record' },
    { field: 'Weight', status: 'pass', message: 'Within expected range' },
    { field: 'Signature', status: 'pass', message: 'Signature detected' },
    { field: 'Delivery Date', status: 'warning', message: 'Date format non-standard but readable' },
  ],
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loadNumberInput, setLoadNumberInput] = useState(mockDoc.linkedLoad || '');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-400" />
            <h1 className="text-xl font-semibold text-slate-900">{mockDoc.filename}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">{mockDoc.type}</span>
            <StatusBadge status={mockDoc.validationStatus} />
            <span className="text-xs text-slate-500">Uploaded {formatDateTime(mockDoc.uploadedAt)} by {mockDoc.uploadedBy}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-1.5 text-sm">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document preview */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Document Preview</h2>
          </div>
          <div className="bg-slate-100 h-[600px] flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">PDF/Image Viewer Placeholder</p>
              <p className="text-xs text-slate-400 mt-1">Document ID: {params.id}</p>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Extracted Fields */}
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Extracted Fields</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {Object.entries(mockDoc.extractedFields).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-slate-500">{key}</p>
                  <p className="text-sm text-slate-900 font-mono">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Results */}
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Validation Results</h3>
            </div>
            <div className="p-4 space-y-2">
              {mockDoc.validationResults.map((result, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${result.status === 'pass' ? 'bg-green-500' : result.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-slate-700">{result.field}</p>
                    <p className="text-xs text-slate-500">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Entity */}
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Linked Entity</h3>
            </div>
            <div className="p-4 space-y-2">
              {mockDoc.linkedEntity ? (
                <>
                  <div className="text-sm">
                    <span className="text-slate-500">Type:</span>{' '}
                    <span className="text-slate-900">{mockDoc.linkedEntity.type}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">ID:</span>{' '}
                    <span className="text-blue-600 font-medium">{mockDoc.linkedEntity.id}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Customer:</span>{' '}
                    <span className="text-slate-900">{mockDoc.linkedEntity.customer}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Route:</span>{' '}
                    <span className="text-slate-900">{mockDoc.linkedEntity.route}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">No linked entity</p>
              )}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={loadNumberInput}
                  onChange={(e) => setLoadNumberInput(e.target.value)}
                  placeholder="Load #"
                  className="input flex-1"
                />
                <button className="btn-secondary text-sm">
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <Tag className="w-4 h-4" />
              Reclassify
            </button>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Re-extract
            </button>
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Validate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
