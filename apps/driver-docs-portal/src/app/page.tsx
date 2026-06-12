'use client';

import { useState } from 'react';
import { format, isPast, differenceInDays } from 'date-fns';
import {
  FileText,
  Upload,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RequestStatus = 'pending' | 'fulfilled' | 'overdue';

interface DocumentRequest {
  id: string;
  requestDate: Date;
  dueDate: Date;
  documentTypes: string[];
  status: RequestStatus;
  loadNumber: string;
  description: string;
}

const mockRequests: DocumentRequest[] = [
  {
    id: 'req-1',
    requestDate: new Date('2026-03-28'),
    dueDate: new Date('2026-04-02'),
    documentTypes: ['Bill of Lading', 'Proof of Delivery'],
    status: 'overdue',
    loadNumber: 'LD-4820',
    description: 'Documents for Chicago to Dallas shipment',
  },
  {
    id: 'req-2',
    requestDate: new Date('2026-04-01'),
    dueDate: new Date('2026-04-08'),
    documentTypes: ['Rate Confirmation'],
    status: 'pending',
    loadNumber: 'LD-4835',
    description: 'Signed rate confirmation for Houston run',
  },
  {
    id: 'req-3',
    requestDate: new Date('2026-04-03'),
    dueDate: new Date('2026-04-10'),
    documentTypes: ['Lumper Receipt', 'Delivery Photo'],
    status: 'pending',
    loadNumber: 'LD-4841',
    description: 'Lumper and delivery proof for Atlanta delivery',
  },
  {
    id: 'req-4',
    requestDate: new Date('2026-03-20'),
    dueDate: new Date('2026-03-27'),
    documentTypes: ['Bill of Lading'],
    status: 'fulfilled',
    loadNumber: 'LD-4798',
    description: 'BOL for Memphis pickup',
  },
  {
    id: 'req-5',
    requestDate: new Date('2026-04-04'),
    dueDate: new Date('2026-04-12'),
    documentTypes: ['Insurance Certificate', 'W-9'],
    status: 'pending',
    loadNumber: 'LD-4850',
    description: 'Compliance documents renewal',
  },
];

const allDocumentTypes = [
  'Bill of Lading',
  'Proof of Delivery',
  'Rate Confirmation',
  'Lumper Receipt',
  'Delivery Photo',
  'Insurance Certificate',
  'W-9',
  'Other',
];

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        status === 'pending' && 'bg-yellow-100 text-yellow-800',
        status === 'fulfilled' && 'bg-green-100 text-green-800',
        status === 'overdue' && 'bg-red-100 text-red-800'
      )}
    >
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'fulfilled' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DueDate({ date, status }: { date: Date; status: RequestStatus }) {
  const overdue = status === 'overdue';
  const daysLeft = differenceInDays(date, new Date());
  const urgent = !overdue && daysLeft <= 2 && status === 'pending';

  return (
    <span
      className={cn(
        'text-sm',
        overdue && 'text-red-600 font-medium',
        urgent && 'text-orange-600 font-medium',
        !overdue && !urgent && 'text-gray-600'
      )}
    >
      {format(date, 'MMM d, yyyy')}
      {overdue && ` (${Math.abs(daysLeft)}d overdue)`}
      {urgent && ` (${daysLeft}d left)`}
    </span>
  );
}

function UploadDialog({
  request,
  onClose,
}: {
  request: DocumentRequest;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState(request.documentTypes[0]);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = () => {
    if (!file) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">
            Upload Document &mdash; {request.loadNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Document type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {allDocumentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            )}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.png,.jpg,.jpeg,.tiff';
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) setFile(f);
              };
              input.click();
            }}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            {file ? (
              <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Drag & drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, PNG, JPG, TIFF up to 10MB
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2',
              file && !submitting
                ? 'bg-primary hover:bg-primary-700'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const [uploadRequest, setUploadRequest] = useState<DocumentRequest | null>(
    null
  );

  const pending = mockRequests.filter((r) => r.status !== 'fulfilled');
  const fulfilled = mockRequests.filter((r) => r.status === 'fulfilled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Document Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload required documents for your loads.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-gray-900">
            No pending requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            You&apos;re all caught up. New requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Pending ({pending.length})
          </h2>
          {pending.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">
                      {req.loadNumber}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.documentTypes.map((dt) => (
                      <span
                        key={dt}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        <FileText className="w-3 h-3" />
                        {dt}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      Requested: {format(req.requestDate, 'MMM d, yyyy')}
                    </span>
                    <span>
                      Due:{' '}
                      <DueDate date={req.dueDate} status={req.status} />
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setUploadRequest(req)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fulfilled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Fulfilled ({fulfilled.length})
          </h2>
          {fulfilled.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 opacity-70"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">
                      {req.loadNumber}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {req.documentTypes.map((dt) => (
                      <span
                        key={dt}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        <FileText className="w-3 h-3" />
                        {dt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadRequest && (
        <UploadDialog
          request={uploadRequest}
          onClose={() => setUploadRequest(null)}
        />
      )}
    </div>
  );
}
