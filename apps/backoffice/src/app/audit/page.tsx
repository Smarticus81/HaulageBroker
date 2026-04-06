'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entity: string;
  timestamp: string;
  source: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

const mockAuditLogs: AuditEntry[] = [
  { id: 'AL-001', actor: 'John Doe', action: 'document.uploaded', entityType: 'Document', entity: 'DOC-015', timestamp: '2026-04-06T08:30:00Z', source: 'Web UI', before: undefined, after: { filename: 'BOL_1060.pdf', type: 'BOL', status: 'pending_review' } },
  { id: 'AL-002', actor: 'System', action: 'document.classified', entityType: 'Document', entity: 'DOC-015', timestamp: '2026-04-06T08:30:05Z', source: 'Automation', before: { type: 'unknown' }, after: { type: 'BOL', confidence: 0.95 } },
  { id: 'AL-003', actor: 'Maria Garcia', action: 'document.validated', entityType: 'Document', entity: 'DOC-010', timestamp: '2026-04-06T07:45:00Z', source: 'Web UI', before: { validationStatus: 'pending_review' }, after: { validationStatus: 'valid' } },
  { id: 'AL-004', actor: 'System', action: 'exception.created', entityType: 'Exception', entity: 'EX-301', timestamp: '2026-04-05T10:00:00Z', source: 'Automation', after: { severity: 'critical', loadNumber: 'LD-1024', description: 'Missing BOL' } },
  { id: 'AL-005', actor: 'John Doe', action: 'document.linked', entityType: 'Document', entity: 'DOC-005', timestamp: '2026-04-05T10:20:00Z', source: 'Web UI', before: { linkedLoad: null }, after: { linkedLoad: 'LD-1024' } },
  { id: 'AL-006', actor: 'Admin', action: 'compliance.renewed', entityType: 'Compliance', entity: 'C-009', timestamp: '2026-04-04T14:00:00Z', source: 'Web UI', before: { status: 'expired', expiryDate: '2026-01-01' }, after: { status: 'active', expiryDate: '2027-01-01' } },
  { id: 'AL-007', actor: 'System', action: 'invoice_packet.created', entityType: 'InvoicePacket', entity: 'PKT-006', timestamp: '2026-04-04T09:00:00Z', source: 'Automation', after: { loadNumber: 'LD-1047', status: 'pending', docsReady: 0 } },
  { id: 'AL-008', actor: 'Maria Garcia', action: 'invoice_packet.approved', entityType: 'InvoicePacket', entity: 'PKT-002', timestamp: '2026-04-04T11:30:00Z', source: 'Web UI', before: { status: 'pending' }, after: { status: 'approved' } },
  { id: 'AL-009', actor: 'Bob Wilson', action: 'settlement.approved', entityType: 'Settlement', entity: 'STL-004', timestamp: '2026-04-03T16:00:00Z', source: 'Web UI', before: { status: 'pending' }, after: { status: 'approved' } },
  { id: 'AL-010', actor: 'System', action: 'automation.executed', entityType: 'Automation', entity: 'R-003', timestamp: '2026-04-06T08:00:00Z', source: 'Scheduler', after: { notificationsSent: 4, rule: 'Compliance expiry notification' } },
  { id: 'AL-011', actor: 'John Doe', action: 'load.updated', entityType: 'Load', entity: 'LD-1024', timestamp: '2026-04-02T15:30:00Z', source: 'Web UI', before: { status: 'in_transit' }, after: { status: 'complete' } },
  { id: 'AL-012', actor: 'System', action: 'document.extracted', entityType: 'Document', entity: 'DOC-001', timestamp: '2026-04-05T14:31:00Z', source: 'OCR Engine', after: { fieldsExtracted: 10, confidence: 0.92 } },
];

const entityTypeOptions = ['All', 'Document', 'Load', 'Exception', 'Compliance', 'InvoicePacket', 'Settlement', 'Automation'];

export default function AuditPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockAuditLogs.filter((log) => {
    if (entityTypeFilter !== 'All' && log.entityType !== entityTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return log.actor.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || log.entity.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">Complete audit trail of all system actions</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div>
          <label className="label">Entity Type</label>
          <select value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)} className="input w-44">
            {entityTypeOptions.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Actor, action, entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className={cn(
                      'border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors',
                      expandedId === log.id && 'bg-slate-50',
                    )}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-2 py-3 text-center">
                      {(log.before || log.after) && (
                        expandedId === log.id
                          ? <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />
                          : <ChevronRight className="w-4 h-4 text-slate-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn('font-medium', log.actor === 'System' ? 'text-slate-500' : 'text-slate-900')}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{log.entityType}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{log.entity}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        log.source === 'Web UI' ? 'bg-blue-50 text-blue-600' :
                        log.source === 'Automation' ? 'bg-purple-50 text-purple-600' :
                        log.source === 'Scheduler' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {log.source}
                      </span>
                    </td>
                  </tr>
                  {expandedId === log.id && (log.before || log.after) && (
                    <tr key={`${log.id}-detail`} className="border-b border-slate-100">
                      <td colSpan={7} className="px-10 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          {log.before && (
                            <div>
                              <h4 className="text-xs font-semibold text-red-600 uppercase mb-2">Before</h4>
                              <pre className="bg-red-50 rounded-lg p-3 text-xs font-mono text-red-800 overflow-x-auto">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && (
                            <div>
                              <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">After</h4>
                              <pre className="bg-green-50 rounded-lg p-3 text-xs font-mono text-green-800 overflow-x-auto">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                          {!log.before && log.after && (
                            <div className="col-start-1">
                              <p className="text-xs text-slate-400 italic">No previous state (new entity)</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
          Showing {filtered.length} of {mockAuditLogs.length} entries
        </div>
      </div>
    </div>
  );
}
