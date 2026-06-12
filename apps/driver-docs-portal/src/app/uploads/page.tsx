'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UploadStatus = 'processing' | 'accepted' | 'rejected';

interface UploadedDocument {
  id: string;
  filename: string;
  documentType: string;
  uploadedDate: Date;
  status: UploadStatus;
  loadNumber: string;
}

const mockUploads: UploadedDocument[] = [
  {
    id: 'upl-1',
    filename: 'BOL_LD4798_signed.pdf',
    documentType: 'Bill of Lading',
    uploadedDate: new Date('2026-03-25'),
    status: 'accepted',
    loadNumber: 'LD-4798',
  },
  {
    id: 'upl-2',
    filename: 'POD_LD4798.jpg',
    documentType: 'Proof of Delivery',
    uploadedDate: new Date('2026-03-25'),
    status: 'accepted',
    loadNumber: 'LD-4798',
  },
  {
    id: 'upl-3',
    filename: 'rate_confirm_LD4810.pdf',
    documentType: 'Rate Confirmation',
    uploadedDate: new Date('2026-03-30'),
    status: 'accepted',
    loadNumber: 'LD-4810',
  },
  {
    id: 'upl-4',
    filename: 'lumper_receipt_4815.pdf',
    documentType: 'Lumper Receipt',
    uploadedDate: new Date('2026-04-01'),
    status: 'rejected',
    loadNumber: 'LD-4815',
  },
  {
    id: 'upl-5',
    filename: 'delivery_photo_4820.png',
    documentType: 'Delivery Photo',
    uploadedDate: new Date('2026-04-02'),
    status: 'processing',
    loadNumber: 'LD-4820',
  },
  {
    id: 'upl-6',
    filename: 'insurance_cert_2026.pdf',
    documentType: 'Insurance Certificate',
    uploadedDate: new Date('2026-04-03'),
    status: 'accepted',
    loadNumber: 'LD-4835',
  },
  {
    id: 'upl-7',
    filename: 'W9_driver_jones.pdf',
    documentType: 'W-9',
    uploadedDate: new Date('2026-04-04'),
    status: 'processing',
    loadNumber: 'LD-4841',
  },
  {
    id: 'upl-8',
    filename: 'BOL_LD4841_scan.pdf',
    documentType: 'Bill of Lading',
    uploadedDate: new Date('2026-04-05'),
    status: 'processing',
    loadNumber: 'LD-4841',
  },
];

function UploadStatusBadge({ status }: { status: UploadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        status === 'processing' && 'bg-blue-100 text-blue-800',
        status === 'accepted' && 'bg-green-100 text-green-800',
        status === 'rejected' && 'bg-red-100 text-red-800'
      )}
    >
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'accepted' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'rejected' && <XCircle className="w-3 h-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const PAGE_SIZE = 5;

export default function UploadsPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(mockUploads.length / PAGE_SIZE);
  const paged = mockUploads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Upload History</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all documents you have uploaded.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Filename
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Type
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Uploaded
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Status
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Load #
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 flex items-center gap-2 text-gray-900">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {doc.filename}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{doc.documentType}</td>
                <td className="px-5 py-3 text-gray-600">
                  {format(doc.uploadedDate, 'MMM d, yyyy')}
                </td>
                <td className="px-5 py-3">
                  <UploadStatusBadge status={doc.status} />
                </td>
                <td className="px-5 py-3 text-gray-600 font-mono text-xs">
                  {doc.loadNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {paged.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {doc.filename}
                </span>
              </div>
              <UploadStatusBadge status={doc.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{doc.documentType}</span>
              <span>{format(doc.uploadedDate, 'MMM d, yyyy')}</span>
              <span className="font-mono">{doc.loadNumber}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(page * PAGE_SIZE, mockUploads.length)} of{' '}
            {mockUploads.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium',
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
