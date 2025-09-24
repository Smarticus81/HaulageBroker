'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { 
  Shield, Truck, MapPin, Package, DollarSign, 
  FileText, Users, BarChart3, ArrowRight, 
  CheckCircle, Clock, AlertTriangle, TrendingUp,
  Building2, Route, Calendar, CreditCard
} from 'lucide-react'

const workflows = [
  {
    id: 'dashboard',
    title: 'Operations Dashboard',
    purpose: 'Your command center for daily freight operations',
    icon: Shield,
    color: 'blue',
    value: 'Real-time visibility into active loads, revenue, and critical issues requiring immediate attention',
    steps: [
      { step: 'Monitor Active Loads', description: 'Track 47 loads in transit and pending pickup' },
      { step: 'Review Today\'s Revenue', description: 'See $18,450 from 12 completed loads' },
      { step: 'Check On-Time Performance', description: '97.7% delivery success rate' },
      { step: 'Address Critical Issues', description: 'Handle overdue pickups and weather delays' }
    ]
  },
  {
    id: 'loadboard',
    title: 'Load Board',
    purpose: 'Find and post freight opportunities across your network',
    icon: Truck,
    color: 'green',
    value: 'Access to thousands of loads from Anderson Direct, DAT, and Uber Freight with real-time pricing',
    steps: [
      { step: 'Search Available Loads', description: 'Filter by lane, equipment type, and rate' },
      { step: 'Review Load Details', description: 'Pickup/delivery times, commodity, weight, special requirements' },
      { step: 'Check Carrier Requirements', description: 'Insurance, safety rating, equipment availability' },
      { step: 'Submit Bids', description: 'Competitive rates with quick response times' }
    ]
  },
  {
    id: 'dispatch',
    title: 'Dispatch Operations',
    purpose: 'Coordinate pickup and delivery with carriers and drivers',
    icon: MapPin,
    color: 'purple',
    value: 'Streamlined dispatch process ensuring on-time pickups and deliveries with proper documentation',
    steps: [
      { step: 'Assign Carriers', description: 'Match loads with qualified carriers based on lane history' },
      { step: 'Issue Dispatch Instructions', description: 'Send pickup details, contact info, and special requirements' },
      { step: 'Generate BOL', description: 'Create Bill of Lading with all necessary documentation' },
      { step: 'Confirm Pickup', description: 'Verify driver arrival and load status' }
    ]
  },
  {
    id: 'tracking',
    title: 'Load Tracking',
    purpose: 'Monitor freight in transit with real-time updates',
    icon: Package,
    color: 'orange',
    value: 'Proactive monitoring prevents delays and keeps shippers informed of delivery status',
    steps: [
      { step: 'GPS Tracking', description: 'Real-time location updates via ELD integration' },
      { step: 'ETA Monitoring', description: 'Compare planned vs. actual delivery times' },
      { step: 'Exception Alerts', description: 'Immediate notifications for delays or issues' },
      { step: 'Shipper Updates', description: 'Proactive communication with cargo owners' }
    ]
  },
  {
    id: 'settlements',
    title: 'Settlements & Payments',
    purpose: 'Process carrier payments and shipper invoicing',
    icon: DollarSign,
    color: 'emerald',
    value: 'Automated payment processing with 30-day terms or Quick Pay options for carriers',
    steps: [
      { step: 'Verify Delivery', description: 'Confirm POD and resolve any accessorial charges' },
      { step: 'Calculate Settlement', description: 'Base rate plus detention, lumper, and fuel surcharges' },
      { step: 'Process Payment', description: 'ACH transfer or Quick Pay within 24-48 hours' },
      { step: 'Generate Invoices', description: 'Automated billing to shippers with detailed line items' }
    ]
  }
]

const industryTerms = {
  'BOL': 'Bill of Lading - Legal document showing ownership and details of freight',
  'POD': 'Proof of Delivery - Confirmation that freight was delivered to consignee',
  'ELD': 'Electronic Logging Device - GPS tracking system in commercial vehicles',
  'Detention': 'Extra charges when drivers wait beyond free time at pickup/delivery',
  'Lumper': 'Third-party labor for loading/unloading freight (common in food industry)',
  'MC#': 'Motor Carrier number - FMCSA authority to operate interstate',
  'DOT#': 'Department of Transportation safety rating and compliance number',
  'Lane': 'Specific origin-to-destination route (e.g., Chicago to Dallas)',
  'Rate Confirmation': 'Contractual agreement on freight charges between broker and carrier',
  'Quick Pay': 'Expedited payment option (typically 24-48 hours vs. standard 30 days)'
}

export default function InstructionsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
      <AuthGuard>
        <Navigation />

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2">
              Broker Console Instructions
            </h1>
            <p className="text-slate-600">
              Complete guide to managing freight operations with Anderson Direct Transport
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Workflow Selector */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-800">Workflow Modules</CardTitle>
                  <CardDescription className="text-sm">Select a workflow to view detailed instructions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedWorkflow.id === workflow.id
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${workflow.color}-100`}>
                          <workflow.icon className={`h-5 w-5 text-${workflow.color}-600`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{workflow.title}</div>
                          <div className="text-xs text-slate-500">{workflow.purpose}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Industry Terms */}
              <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl mt-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-800">Industry Terms</CardTitle>
                  <CardDescription className="text-sm">Common trucking and freight terminology</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(industryTerms).map(([term, definition]) => (
                    <div key={term} className="border-b border-slate-100 pb-2 last:border-b-0">
                      <div className="font-medium text-sm text-slate-800">{term}</div>
                      <div className="text-xs text-slate-600 mt-1">{definition}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Workflow Details */}
            <div className="lg:col-span-2">
              <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-${selectedWorkflow.color}-100`}>
                      <selectedWorkflow.icon className={`h-8 w-8 text-${selectedWorkflow.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-slate-800">
                        {selectedWorkflow.title}
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        {selectedWorkflow.purpose}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Value Proposition */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-800 mb-1">Business Value</div>
                        <div className="text-sm text-slate-600">{selectedWorkflow.value}</div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Workflow Process</h3>
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full bg-${selectedWorkflow.color}-100 flex items-center justify-center`}>
                              <span className={`text-sm font-semibold text-${selectedWorkflow.color}-600`}>
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-800 mb-1">{step.step}</div>
                            <div className="text-sm text-slate-600">{step.description}</div>
                          </div>
                          {index < selectedWorkflow.steps.length - 1 && (
                            <div className="flex-shrink-0 mt-4">
                              <ArrowRight className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Key Benefits</span>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Real-time visibility</li>
                        <li>• Automated notifications</li>
                        <li>• Mobile accessibility</li>
                        <li>• Integration with ELD systems</li>
                      </ul>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Time Savings</span>
                      </div>
                      <ul className="text-sm text-emerald-700 space-y-1">
                        <li>• 75% faster load matching</li>
                        <li>• Automated documentation</li>
                        <li>• Instant status updates</li>
                        <li>• Reduced phone calls</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    </div>
  )
}
