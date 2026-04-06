'use client';

import { useState } from 'react';
import { Plus, Play, Pause, Edit2, History, X, Zap, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  status: string;
  lastRun: string | null;
  conditions: { field: string; operator: string; value: string }[];
  actions: { type: string; params: string }[];
  [key: string]: unknown;
}

interface RunHistoryEntry {
  id: string;
  ruleName: string;
  status: string;
  triggeredAt: string;
  triggerData: string;
  actionsExecuted: string;
}

const mockRules: AutomationRule[] = [
  { id: 'R-001', name: 'Auto-classify incoming documents', triggerType: 'event', triggerValue: 'document.uploaded', status: 'active', lastRun: '2026-04-06T08:30:00Z', conditions: [{ field: 'document.type', operator: 'equals', value: 'unknown' }], actions: [{ type: 'classify_document', params: 'Use AI classification' }] },
  { id: 'R-002', name: 'Flag missing POD after 48h', triggerType: 'schedule', triggerValue: '0 9 * * *', status: 'active', lastRun: '2026-04-06T09:00:00Z', conditions: [{ field: 'load.status', operator: 'equals', value: 'complete' }, { field: 'load.pod_present', operator: 'equals', value: 'false' }], actions: [{ type: 'create_exception', params: 'severity=warning' }] },
  { id: 'R-003', name: 'Compliance expiry notification (30d)', triggerType: 'schedule', triggerValue: '0 8 * * 1', status: 'active', lastRun: '2026-04-06T08:00:00Z', conditions: [{ field: 'compliance.days_to_expiry', operator: 'less_than', value: '30' }], actions: [{ type: 'send_notification', params: 'channel=email,slack' }] },
  { id: 'R-004', name: 'Auto-approve complete invoice packets', triggerType: 'event', triggerValue: 'invoice_packet.docs_complete', status: 'inactive', lastRun: '2026-04-01T14:00:00Z', conditions: [{ field: 'packet.docs_count', operator: 'equals', value: 'packet.required_count' }], actions: [{ type: 'approve_packet', params: 'auto=true' }] },
  { id: 'R-005', name: 'Link documents by load number', triggerType: 'event', triggerValue: 'document.extracted', status: 'active', lastRun: '2026-04-05T16:45:00Z', conditions: [{ field: 'extracted.load_number', operator: 'not_empty', value: '' }], actions: [{ type: 'link_document', params: 'field=load_number' }] },
];

const mockHistory: RunHistoryEntry[] = [
  { id: 'H-001', ruleName: 'Auto-classify incoming documents', status: 'success', triggeredAt: '2026-04-06T08:30:00Z', triggerData: 'DOC-015 uploaded', actionsExecuted: 'Classified as BOL' },
  { id: 'H-002', ruleName: 'Flag missing POD after 48h', status: 'success', triggeredAt: '2026-04-06T09:00:00Z', triggerData: 'Daily scan', actionsExecuted: '3 exceptions created' },
  { id: 'H-003', ruleName: 'Link documents by load number', status: 'success', triggeredAt: '2026-04-05T16:45:00Z', triggerData: 'DOC-014 extracted', actionsExecuted: 'Linked to LD-1053' },
  { id: 'H-004', ruleName: 'Auto-classify incoming documents', status: 'error', triggeredAt: '2026-04-05T14:20:00Z', triggerData: 'DOC-013 uploaded', actionsExecuted: 'Classification failed - low confidence' },
  { id: 'H-005', ruleName: 'Compliance expiry notification (30d)', status: 'success', triggeredAt: '2026-04-06T08:00:00Z', triggerData: 'Weekly scan', actionsExecuted: '4 notifications sent' },
  { id: 'H-006', ruleName: 'Link documents by load number', status: 'success', triggeredAt: '2026-04-05T11:00:00Z', triggerData: 'DOC-012 extracted', actionsExecuted: 'Linked to LD-1050' },
];

const tabOptions = ['Rules', 'Run History'];

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState('Rules');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: 'event',
    triggerValue: '',
    conditions: [{ field: '', operator: 'equals', value: '' }],
    actions: [{ type: '', params: '' }],
  });

  const ruleColumns: Column<AutomationRule>[] = [
    { key: 'name', header: 'Rule Name', sortable: true, render: (row) => (
      <div className="flex items-center gap-2">
        <Zap className={cn('w-4 h-4', row.status === 'active' ? 'text-amber-500' : 'text-slate-300')} />
        <span className="font-medium text-slate-900">{row.name}</span>
      </div>
    )},
    { key: 'triggerType', header: 'Trigger', render: (row) => (
      <div>
        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">{row.triggerType}</span>
        <p className="text-xs text-slate-500 mt-0.5 font-mono">{row.triggerValue}</p>
      </div>
    )},
    { key: 'status', header: 'Status', width: '100px', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'lastRun', header: 'Last Run', sortable: true, render: (row) => row.lastRun ? <span className="text-slate-500 text-sm">{formatDateTime(row.lastRun)}</span> : <span className="text-slate-400 text-sm">Never</span> },
    { key: 'actions', header: '', width: '120px', render: (row) => (
      <div className="flex items-center gap-1">
        <button className={cn('p-1 rounded hover:bg-slate-100', row.status === 'active' ? 'text-amber-500' : 'text-green-500')} title={row.status === 'active' ? 'Disable' : 'Enable'}>
          {row.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Edit2 className="w-4 h-4" /></button>
        <button className="p-1 rounded hover:bg-slate-100 text-slate-500" title="History"><History className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const historyColumns: Column<RunHistoryEntry>[] = [
    { key: 'ruleName', header: 'Rule', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.ruleName}</span> },
    { key: 'status', header: 'Status', width: '100px', render: (row) => (
      <div className="flex items-center gap-1.5">
        {row.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
        <span className={cn('text-sm', row.status === 'success' ? 'text-green-700' : 'text-red-700')}>{row.status}</span>
      </div>
    )},
    { key: 'triggeredAt', header: 'Triggered', sortable: true, render: (row) => formatDateTime(row.triggeredAt) },
    { key: 'triggerData', header: 'Trigger Data' },
    { key: 'actionsExecuted', header: 'Result' },
  ];

  function addCondition() {
    setNewRule((r) => ({ ...r, conditions: [...r.conditions, { field: '', operator: 'equals', value: '' }] }));
  }

  function addAction() {
    setNewRule((r) => ({ ...r, actions: [...r.actions, { type: '', params: '' }] }));
  }

  function removeCondition(i: number) {
    setNewRule((r) => ({ ...r, conditions: r.conditions.filter((_, idx) => idx !== i) }));
  }

  function removeAction(i: number) {
    setNewRule((r) => ({ ...r, actions: r.actions.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Automations</h1>
          <p className="text-sm text-slate-500">Configure rules to automate document and compliance workflows</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabOptions.map((tab) => (
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

      {activeTab === 'Rules' && (
        <DataTable columns={ruleColumns} data={mockRules} keyExtractor={(row) => row.id} />
      )}

      {activeTab === 'Run History' && (
        <DataTable columns={historyColumns} data={mockHistory as unknown as Record<string, unknown>[]} keyExtractor={(row: Record<string, unknown>) => row.id as string} />
      )}

      {/* Create Rule Form */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreateForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[600px] max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Create Automation Rule</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Name */}
              <div>
                <label className="label">Rule Name</label>
                <input type="text" className="input" placeholder="e.g., Auto-classify uploaded documents" value={newRule.name} onChange={(e) => setNewRule((r) => ({ ...r, name: e.target.value }))} />
              </div>

              {/* Trigger */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Trigger Type</label>
                  <select className="input" value={newRule.triggerType} onChange={(e) => setNewRule((r) => ({ ...r, triggerType: e.target.value }))}>
                    <option value="event">Event</option>
                    <option value="schedule">Schedule</option>
                  </select>
                </div>
                <div>
                  <label className="label">{newRule.triggerType === 'event' ? 'Event Name' : 'Cron Expression'}</label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    placeholder={newRule.triggerType === 'event' ? 'document.uploaded' : '0 9 * * *'}
                    value={newRule.triggerValue}
                    onChange={(e) => setNewRule((r) => ({ ...r, triggerValue: e.target.value }))}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Conditions</label>
                  <button onClick={addCondition} className="text-xs text-blue-600 hover:text-blue-800">+ Add Condition</button>
                </div>
                <div className="space-y-2">
                  {newRule.conditions.map((cond, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" className="input flex-1" placeholder="Field" value={cond.field} onChange={(e) => { const c = [...newRule.conditions]; c[i] = { ...c[i], field: e.target.value }; setNewRule((r) => ({ ...r, conditions: c })); }} />
                      <select className="input w-32" value={cond.operator} onChange={(e) => { const c = [...newRule.conditions]; c[i] = { ...c[i], operator: e.target.value }; setNewRule((r) => ({ ...r, conditions: c })); }}>
                        <option value="equals">equals</option>
                        <option value="not_equals">not equals</option>
                        <option value="contains">contains</option>
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="not_empty">not empty</option>
                      </select>
                      <input type="text" className="input flex-1" placeholder="Value" value={cond.value} onChange={(e) => { const c = [...newRule.conditions]; c[i] = { ...c[i], value: e.target.value }; setNewRule((r) => ({ ...r, conditions: c })); }} />
                      {newRule.conditions.length > 1 && (
                        <button onClick={() => removeCondition(i)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Actions</label>
                  <button onClick={addAction} className="text-xs text-blue-600 hover:text-blue-800">+ Add Action</button>
                </div>
                <div className="space-y-2">
                  {newRule.actions.map((act, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select className="input w-48" value={act.type} onChange={(e) => { const a = [...newRule.actions]; a[i] = { ...a[i], type: e.target.value }; setNewRule((r) => ({ ...r, actions: a })); }}>
                        <option value="">Select action...</option>
                        <option value="classify_document">Classify Document</option>
                        <option value="link_document">Link Document</option>
                        <option value="create_exception">Create Exception</option>
                        <option value="send_notification">Send Notification</option>
                        <option value="approve_packet">Approve Packet</option>
                        <option value="validate_document">Validate Document</option>
                      </select>
                      <input type="text" className="input flex-1" placeholder="Parameters" value={act.params} onChange={(e) => { const a = [...newRule.actions]; a[i] = { ...a[i], params: e.target.value }; setNewRule((r) => ({ ...r, actions: a })); }} />
                      {newRule.actions.length > 1 && (
                        <button onClick={() => removeAction(i)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
                <button className="btn-primary">Create Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
