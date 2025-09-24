'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { mockLoads } from '@/lib/broker-data'
import { DollarSign, Calendar, CheckCircle, Clock, AlertTriangle, Download, Send, Filter, CreditCard, FileText, Eye } from 'lucide-react'

interface Settlement {
  id: string
  loadId: string
  carrierName: string
  amount: number
  status: 'Pending' | 'Approved' | 'Paid' | 'Overdue'
  dueDate: string
  invoiceDate: string
  paymentMethod: 'ACH' | 'Check' | 'Wire'
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([
    {
      id: 'SET-001',
      loadId: 'LH-2024-091',
      carrierName: 'Reliable Transport LLC',
      amount: 2400,
      status: 'Pending',
      dueDate: '2024-01-20',
      invoiceDate: '2024-01-16',
      paymentMethod: 'ACH'
    },
    {
      id: 'SET-002',
      loadId: 'LH-2024-090',
      carrierName: 'Southeast Freight',
      amount: 1650,
      status: 'Approved',
      dueDate: '2024-01-18',
      invoiceDate: '2024-01-15',
      paymentMethod: 'ACH'
    },
    {
      id: 'SET-003',
      loadId: 'LH-2024-089',
      carrierName: 'Desert Express',
      amount: 950,
      status: 'Paid',
      dueDate: '2024-01-17',
      invoiceDate: '2024-01-14',
      paymentMethod: 'Wire'
    }
  ])

  const [selectedSettlements, setSelectedSettlements] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectSettlement = (settlementId: string) => {
    setSelectedSettlements(prev => 
      prev.includes(settlementId) 
        ? prev.filter(id => id !== settlementId)
        : [...prev, settlementId]
    )
  }

  const handleProcessPayments = async () => {
    if (selectedSettlements.length === 0) return

    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setSettlements(prev => prev.map(settlement => 
        selectedSettlements.includes(settlement.id)
          ? { ...settlement, status: 'Paid' as const }
          : settlement
      ))
      
      alert(`Successfully processed ${selectedSettlements.length} payment(s)`)
      setSelectedSettlements([])
      setIsProcessing(false)
    }, 2000)
  }

  const handleApproveSettlement = (settlementId: string) => {
    setSettlements(prev => prev.map(settlement => 
      settlement.id === settlementId
        ? { ...settlement, status: 'Approved' as const }
        : settlement
    ))
    alert('Settlement approved successfully!')
  }

  const handleDownloadInvoice = (settlement: Settlement) => {
    alert(`Downloading invoice for ${settlement.loadId} - ${settlement.carrierName}`)
  }

  const handleViewDetails = (settlement: Settlement) => {
    alert(`Viewing details for settlement ${settlement.id}`)
  }

  const getStatusColor = (status: Settlement['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-blue-100 text-blue-800'
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Settlement['status']) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />
      case 'Approved': return <CheckCircle className="h-4 w-4" />
      case 'Paid': return <CheckCircle className="h-4 w-4" />
      case 'Overdue': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const totalPending = settlements.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.amount, 0)
  const totalApproved = settlements.filter(s => s.status === 'Approved').reduce((sum, s) => sum + s.amount, 0)
  const totalPaid = settlements.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Billing & Settlements</h1>
              <p className="text-slate-600">Manage carrier payments and settlement processing</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button variant="outline" className="rounded-2xl">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button 
                onClick={handleProcessPayments}
                disabled={selectedSettlements.length === 0 || isProcessing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payments ({selectedSettlements.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { title: "Pending", value: `$${totalPending.toLocaleString()}`, count: settlements.filter(s => s.status === 'Pending').length, color: "yellow" },
              { title: "Approved", value: `$${totalApproved.toLocaleString()}`, count: settlements.filter(s => s.status === 'Approved').length, color: "blue" },
              { title: "Paid", value: `$${totalPaid.toLocaleString()}`, count: settlements.filter(s => s.status === 'Paid').length, color: "green" },
              { title: "Total", value: `$${(totalPending + totalApproved + totalPaid).toLocaleString()}`, count: settlements.length, color: "slate" }
            ].map((stat, index) => (
              <Card key={stat.title} className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200`}>
                      <DollarSign className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                    <div className={`w-2 h-2 rounded-full bg-${stat.color}-400 opacity-60`}></div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-light text-slate-800 tracking-tight">{stat.value}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-xs font-medium text-slate-500">{stat.count} items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Settlements Table */}
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Settlement Queue</span>
              </CardTitle>
              <CardDescription>Review and process carrier settlements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settlements.map((settlement) => (
                  <div 
                    key={settlement.id}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md ${
                      selectedSettlements.includes(settlement.id) 
                        ? 'border-blue-300 bg-blue-50/50' 
                        : 'border-slate-200/60 bg-white/40'
                    }`}
                    onClick={() => handleSelectSettlement(settlement.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Selection Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedSettlements.includes(settlement.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-slate-300 hover:border-blue-400'
                        }`}>
                          {selectedSettlements.includes(settlement.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>

                        {/* Settlement Info */}
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-slate-800">{settlement.loadId}</h3>
                            <Badge className={`rounded-full ${getStatusColor(settlement.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(settlement.status)}
                                <span>{settlement.status}</span>
                              </div>
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-1">{settlement.carrierName}</div>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span>Invoice: {new Date(settlement.invoiceDate).toLocaleDateString()}</span>
                            <span>Due: {new Date(settlement.dueDate).toLocaleDateString()}</span>
                            <span>Method: {settlement.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-semibold text-slate-800">${settlement.amount.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">Settlement Amount</div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(settlement)
                            }}
                            className="rounded-2xl"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadInvoice(settlement)
                            }}
                            className="rounded-2xl"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {settlement.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproveSettlement(settlement.id)
                              }}
                              className="bg-blue-600 hover:bg-blue-700 rounded-2xl"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}