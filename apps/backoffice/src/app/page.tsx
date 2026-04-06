'use client';

import { useState } from 'react';
import { Truck, FileWarning, Shield, AlertTriangle, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';

const kpis = [
  { label: 'Active Loads', value: 142, icon: Truck, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', trend: { value: 8, direction: 'up' as const, label: 'vs last week' } },
  { label: 'Missing Docs', value: 23, icon: FileWarning, iconColor: 'text-amber-600', iconBg: 'bg-amber-50', trend: { value: 5, direction: 'down' as const, label: 'vs last week' } },
  { label: 'Expiring Compliance', value: 7, icon: Shield, iconColor: 'text-red-600', iconBg: 'bg-red-50', trend: { value: 3, direction: 'up' as const, label: 'vs last week' } },
  { label: 'Open Exceptions', value: 12, icon: AlertTriangle, iconColor: 'text-orange-600', iconBg: 'bg-orange-50', trend: { value: 2, direction: 'down' as const, label: 'vs last week' } },
  { label: 'Pending Invoices', value: 31, icon: FileText, iconColor: 'text-purple-600', iconBg: 'bg-purple-50', trend: { value: 12, direction: 'up' as const, label: 'vs last week' } },
];

const missingDocs = [
  { loadNumber: 'LD-1024', customer: 'Walmart Distribution', missingDocs: ['BOL', 'POD'], daysOverdue: 5 },
  { loadNumber: 'LD-1031', customer: 'Target Logistics', missingDocs: ['Rate Confirmation'], daysOverdue: 3 },
  { loadNumber: 'LD-1038', customer: 'Amazon Freight', missingDocs: ['POD', 'Lumper Receipt'], daysOverdue: 7 },
  { loadNumber: 'LD-1042', customer: 'Costco Wholesale', missingDocs: ['BOL'], daysOverdue: 2 },
  { loadNumber: 'LD-1045', customer: 'Home Depot Supply', missingDocs: ['POD'], daysOverdue: 1 },
  { loadNumber: 'LD-1047', customer: 'Kroger Transport', missingDocs: ['BOL', 'Rate Confirmation', 'POD'], daysOverdue: 10 },
];

const expiringCompliance = [
  { subject: 'John Smith', type: 'CDL', expiryDate: '2026-04-15', daysLeft: 9 },
  { subject: 'Truck #T-205', type: 'Annual Inspection', expiryDate: '2026-04-12', daysLeft: 6 },
  { subject: 'Maria Garcia', type: 'Medical Card', expiryDate: '2026-04-20', daysLeft: 14 },
  { subject: 'Trailer #TR-118', type: 'Registration', expiryDate: '2026-04-28', daysLeft: 22 },
  { subject: 'Bob Wilson', type: 'Drug Test', expiryDate: '2026-05-01', daysLeft: 25 },
];

const recentExceptions = [
  { id: 'EX-301', load: 'LD-1024', severity: 'critical', description: 'Missing BOL for delivered load - invoice packet blocked', createdAt: '2026-04-05' },
  { id: 'EX-299', load: 'LD-1031', severity: 'warning', description: 'Rate confirmation amount mismatch ($150 difference)', createdAt: '2026-04-05' },
  { id: 'EX-297', load: 'LD-1019', severity: 'info', description: 'POD uploaded but pending OCR validation', createdAt: '2026-04-04' },
  { id: 'EX-295', load: 'LD-1038', severity: 'critical', description: 'Delivery date overdue - no POD received', createdAt: '2026-04-03' },
  { id: 'EX-293', load: 'LD-1015', severity: 'warning', description: 'Duplicate document detected for rate confirmation', createdAt: '2026-04-03' },
];

const taskQueueData = [
  { queue: 'Doc Review', open: 18 },
  { queue: 'Exceptions', open: 12 },
  { queue: 'Invoice Pkts', open: 31 },
  { queue: 'Compliance', open: 7 },
  { queue: 'Settlements', open: 9 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <StatsCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Missing Documents */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Missing Documents</h2>
            <p className="text-xs text-slate-500 mt-0.5">Loads missing required paperwork</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Load #</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Missing</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {missingDocs.map((row) => (
                  <tr key={row.loadNumber} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-blue-600">{row.loadNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{row.customer}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {row.missingDocs.map((doc) => (
                          <span key={doc} className="px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <span className={row.daysOverdue >= 7 ? 'text-red-600 font-medium' : 'text-amber-600'}>
                        {row.daysOverdue}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Compliance */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Expiring Compliance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Items expiring within 30 days</p>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringCompliance.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700">{formatDate(item.expiryDate)}</p>
                  <p className={`text-xs font-medium ${item.daysLeft <= 10 ? 'text-red-600' : item.daysLeft <= 20 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {item.daysLeft} days left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Exceptions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Recent Exceptions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest exceptions by severity</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentExceptions.map((ex) => (
              <div key={ex.id} className="px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{ex.id}</span>
                    <StatusBadge status={ex.severity} />
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(ex.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600">{ex.description}</p>
                <p className="text-xs text-blue-600 mt-1">Load: {ex.load}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Task Queue Summary */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Task Queue Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Open tasks by queue</p>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskQueueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="queue" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="open" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
