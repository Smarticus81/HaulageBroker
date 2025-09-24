'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { Package, CheckCircle, Clock, AlertTriangle, FileText, Camera, Upload, Download, Phone, Mail, MapPin } from 'lucide-react'

interface DeliveryLoad {
  id: string
  referenceNumber: string
  shipper: string
  consignee: string
  destination: string
  deliveryDate: string
  driver: {
    name: string
    phone: string
  }
  carrier: string
  status: 'Arriving' | 'Unloading' | 'Completed' | 'Issues'
  commodity: string
  weight: number
  podStatus: 'Pending' | 'Received' | 'Verified'
  documents: string[]
  issues?: string[]
}

export default function DeliveryPage() {
  const [loads, setLoads] = useState<DeliveryLoad[]>([
    {
      id: '1',
      referenceNumber: 'LH-2024-091',
      shipper: 'ABC Manufacturing',
      consignee: 'Dallas Distribution Center',
      destination: 'Dallas, TX',
      deliveryDate: '2024-01-22',
      driver: { name: 'John Driver', phone: '(555) 123-4567' },
      carrier: 'Reliable Transport LLC',
      status: 'Arriving',
      commodity: 'Electronics',
      weight: 45000,
      podStatus: 'Pending',
      documents: []
    },
    {
      id: '2',
      referenceNumber: 'LH-2024-092',
      shipper: 'XYZ Logistics',
      consignee: 'Miami Warehouse',
      destination: 'Miami, FL',
      deliveryDate: '2024-01-20',
      driver: { name: 'Carlos Rodriguez', phone: '(555) 567-8901' },
      carrier: 'Southeast Freight',
      status: 'Unloading',
      commodity: 'Automotive Parts',
      weight: 38000,
      podStatus: 'Pending',
      documents: []
    },
    {
      id: '3',
      referenceNumber: 'LH-2024-093',
      shipper: 'Global Supply Co',
      consignee: 'Phoenix Distribution',
      destination: 'Phoenix, AZ',
      deliveryDate: '2024-01-19',
      driver: { name: 'David Kim', phone: '(555) 678-9012' },
      carrier: 'Desert Express',
      status: 'Completed',
      commodity: 'Consumer Goods',
      weight: 42000,
      podStatus: 'Verified',
      documents: ['POD', 'Bill of Lading', 'Delivery Receipt']
    }
  ])

  const [selectedLoad, setSelectedLoad] = useState<DeliveryLoad | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleStatusUpdate = (loadId: string, newStatus: DeliveryLoad['status']) => {
    setLoads(prev => prev.map(load => 
      load.id === loadId ? { ...load, status: newStatus } : load
    ))
    alert(`Status updated to ${newStatus}`)
  }

  const handlePODUpload = async (loadId: string) => {
    setIsUploading(true)
    
    // Simulate file upload
    setTimeout(() => {
      setLoads(prev => prev.map(load => 
        load.id === loadId 
          ? { 
              ...load, 
              podStatus: 'Received' as const,
              documents: [...load.documents, 'POD', 'Delivery Receipt']
            }
          : load
      ))
      alert('POD uploaded successfully!')
      setIsUploading(false)
    }, 2000)
  }

  const handleVerifyPOD = (loadId: string) => {
    setLoads(prev => prev.map(load => 
      load.id === loadId 
        ? { ...load, podStatus: 'Verified' as const, status: 'Completed' as const }
        : load
    ))
    alert('POD verified and load completed!')
  }

  const handleCallDriver = (driver: { name: string; phone: string }) => {
    alert(`Calling ${driver.name} at ${driver.phone}`)
  }

  const handleContactConsignee = (consignee: string) => {
    alert(`Contacting ${consignee}`)
  }

  const handleDownloadDocuments = (load: DeliveryLoad) => {
    alert(`Downloading documents for ${load.referenceNumber}`)
  }

  const handleReportIssue = (loadId: string) => {
    const issue = prompt('Describe the delivery issue:')
    if (issue) {
      setLoads(prev => prev.map(load => 
        load.id === loadId 
          ? { 
              ...load, 
              status: 'Issues' as const,
              issues: [...(load.issues || []), issue]
            }
          : load
      ))
      alert('Issue reported successfully!')
    }
  }

  const getStatusColor = (status: DeliveryLoad['status']) => {
    switch (status) {
      case 'Arriving': return 'bg-blue-100 text-blue-800'
      case 'Unloading': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Issues': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPODStatusColor = (status: DeliveryLoad['podStatus']) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-800'
      case 'Received': return 'bg-blue-100 text-blue-800'
      case 'Verified': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: DeliveryLoad['status']) => {
    switch (status) {
      case 'Arriving': return <Clock className="h-4 w-4" />
      case 'Unloading': return <Package className="h-4 w-4" />
      case 'Completed': return <CheckCircle className="h-4 w-4" />
      case 'Issues': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Delivery & Documentation</h1>
              <p className="text-slate-600">Manage deliveries and collect proof of delivery documents</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button variant="outline" className="rounded-2xl">
                <Download className="h-4 w-4 mr-2" />
                Export PODs
              </Button>
              <Button variant="outline" className="rounded-2xl">
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Arriving", count: loads.filter(l => l.status === 'Arriving').length, color: "blue" },
              { title: "Unloading", count: loads.filter(l => l.status === 'Unloading').length, color: "yellow" },
              { title: "Completed", count: loads.filter(l => l.status === 'Completed').length, color: "green" },
              { title: "Issues", count: loads.filter(l => l.status === 'Issues').length, color: "red" }
            ].map((stat) => (
              <Card key={stat.title} className="border-0 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{stat.title}</div>
                    <div className={`w-2 h-2 rounded-full bg-${stat.color}-400 opacity-60`}></div>
                  </div>
                  <div className="text-2xl font-light text-slate-800 tracking-tight">{stat.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Delivery Loads */}
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="border-0 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{load.referenceNumber}</h3>
                          <Badge className={`rounded-full ${getStatusColor(load.status)}`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(load.status)}
                              <span>{load.status}</span>
                            </div>
                          </Badge>
                          <Badge className={`rounded-full ${getPODStatusColor(load.podStatus)}`}>
                            POD: {load.podStatus}
                          </Badge>
                        </div>
                        <div className="text-slate-600 mb-1">{load.shipper} → {load.consignee}</div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          <span>{load.destination}</span>
                          <span>•</span>
                          <span>Delivery: {new Date(load.deliveryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-800">{load.weight.toLocaleString()} lbs</div>
                      <div className="text-xs text-slate-500">{load.commodity}</div>
                    </div>
                  </div>

                  {/* Driver & Carrier Info */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{load.driver.name}</div>
                        <div className="text-sm text-slate-600">{load.driver.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{load.carrier}</div>
                        <div className="text-sm text-slate-600">Carrier</div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {load.documents.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-800 mb-3 flex items-center">
                        <FileText className="h-4 w-4 text-blue-500 mr-2" />
                        Documents ({load.documents.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {load.documents.map((doc, index) => (
                          <Badge key={index} variant="outline" className="rounded-full">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {load.issues && load.issues.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-800 mb-3 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        Delivery Issues
                      </h4>
                      <div className="space-y-2">
                        {load.issues.map((issue, index) => (
                          <div key={index} className="p-3 bg-red-50/50 border border-red-200/50 rounded-2xl">
                            <span className="text-sm text-red-800">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCallDriver(load.driver)}
                        className="rounded-2xl"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Driver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactConsignee(load.consignee)}
                        className="rounded-2xl"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Consignee
                      </Button>
                      {load.documents.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocuments(load)}
                          className="rounded-2xl"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {load.status !== 'Issues' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportIssue(load.id)}
                          className="rounded-2xl text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      )}
                      
                      {load.podStatus === 'Pending' && (
                        <Button
                          onClick={() => handlePODUpload(load.id)}
                          disabled={isUploading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
                        >
                          {isUploading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload POD
                            </>
                          )}
                        </Button>
                      )}

                      {load.podStatus === 'Received' && (
                        <Button
                          onClick={() => handleVerifyPOD(load.id)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify POD
                        </Button>
                      )}

                      {load.podStatus === 'Verified' && (
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}