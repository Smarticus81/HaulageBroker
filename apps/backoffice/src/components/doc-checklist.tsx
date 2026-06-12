'use client';

import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocCheckItem {
  type: string;
  label: string;
  required: boolean;
  present: boolean;
  documentId?: string;
  uploadedAt?: string;
  status?: 'valid' | 'invalid' | 'pending';
}

interface DocChecklistProps {
  items: DocCheckItem[];
  onViewDoc?: (documentId: string) => void;
  onUploadDoc?: (type: string) => void;
  className?: string;
}

export function DocChecklist({ items, onViewDoc, onUploadDoc, className }: DocChecklistProps) {
  const presentCount = items.filter((i) => i.present).length;
  const requiredCount = items.filter((i) => i.required).length;
  const requiredPresentCount = items.filter((i) => i.required && i.present).length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          Documents ({presentCount}/{items.length})
        </span>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            requiredPresentCount === requiredCount
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700',
          )}
        >
          {requiredPresentCount}/{requiredCount} required
        </span>
      </div>

      {/* Checklist */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.type}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 group"
          >
            <div className="flex items-center gap-2.5">
              {item.present ? (
                item.status === 'invalid' ? (
                  <XCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                ) : item.status === 'pending' ? (
                  <Clock className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4.5 h-4.5 text-green-500 flex-shrink-0" />
                )
              ) : (
                <div
                  className={cn(
                    'w-4.5 h-4.5 rounded-full border-2 flex-shrink-0',
                    item.required ? 'border-red-300' : 'border-slate-300',
                  )}
                />
              )}
              <div>
                <span className="text-sm text-slate-700">{item.label}</span>
                {item.required && (
                  <span className="text-xs text-red-400 ml-1">*</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.present && item.documentId ? (
                <button
                  onClick={() => onViewDoc?.(item.documentId!)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                >
                  View
                </button>
              ) : (
                <button
                  onClick={() => onUploadDoc?.(item.type)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
