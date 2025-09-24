'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { mockLoads } from '@/lib/broker-data'
import { MapPin, Phone, Mail, FileText, Clock, CheckCircle, AlertTriangle, Send, Download, Navigation as NavigationIcon, Truck, User } from 'lucide-react'

interface DispatchLoad {
  id: string
  referenceNumber: string
  status: 'Ready to Dispatch' | 'Dispatched' | 'Driver Assigned' | 'En Route'
  shipper: string
  origin: string
  destination: string
  pickupDate: string
  deliveryDate: string
  carrier: string
  driver?: {
    name: string
    phone: string
    cdlNumber: string
  }
  equipment: string
  commodity: string
  weight: number
  rate: number
}

export default function DispatchPage() {
  const [loads, setLoads] = useState<DispatchLoad[]>([
    {
      id: '1',
      referenceNumber: 'LH-2024-091',
      status: 'Ready to Dispatch',
      shipper: 'ABC Manufacturing',
      origin: 'Chicago, IL',
      destination: 'Dallas, TX',
      pickupDate: '2024-01-20',
      deliveryDate: '2024-01-22',
      carrier: 'Reliable Transport LLC',
      equipment: 'Dry Van',
      commodity: 'Electronics',
      weight: 45000,
      rate: 2850
    },
    {
      id: '2',
      referenceNumber: 'LH-2024-092',
      status: 'Dispatched',
      shipper: 'XYZ Logistics',
      origin: 'Atlanta, GA',
      destination: 'Miami, FL',
      pickupDate: '2024-01-19',
      deliveryDate: '2024-01-20',
      carrier: 'Southeast Freight',
      driver: {
        name: 'Carlos Rodriguez',
        phone: '(555) 567-8901',
        cdlNumber: 'CDL-GA-876543'
      },
      equipment: 'Dry Van',
      commodity: 'Automotive Parts',
      weight: 38000,
      rate: 1950
    },
    {
      id: '3',
      referenceNumber: 'LH-2024-093',
      status: 'En Route',
      shipper: 'Global Supply Co',
      origin: 'Los Angeles, CA',
      destination: 'Phoenix, AZ',
      pickupDate: '2024-01-18',
      deliveryDate: '2024-01-19',
      carrier: 'Desert Express',
      driver: {
        name: 'David Kim',
        phone: '(555) 678-9012',
        cdlNumber: 'CDL-CA-765432'
      },
      equipment: 'Reefer',
      commodity: 'Consumer Goods',
      weight: 42000,
      rate: 1200
    }
  ])

  const [selectedLoad, setSelectedLoad] = useState<DispatchLoad | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDispatchLoad = async (loadId: string) => {
    setIsLoading(true)
    
    setTimeout(() => {
      setLoads(prev => prev.map(load => 
        load.id === loadId 
          ? { 
              ...load, 
              status: 'Dispatched' as const,
              driver: {
                name: 'John Driver',
                phone: '(555) 123-4567',
                cdlNumber: 'CDL-TX-123456'
              }
            }
          : load
      ))
      
      alert(`Load ${loads.find(l => l.id === loadId)?.referenceNumber} dispatched successfully!`)
      setIsLoading(false)
    }, 1500)
  }

  const handleSendBOL = (load: DispatchLoad) => {
    alert(`Bill of Lading sent for ${load.referenceNumber} to ${load.carrier}`)
  }

  const handleCallDriver = (driver: { name: string; phone: string }) => {
    alert(`Calling ${driver.name} at ${driver.phone}`)
  }

  const handleSendInstructions = (load: DispatchLoad) => {
    alert(`Pickup instructions sent for ${load.referenceNumber}`)
  }

  const handleTrackLoad = (load: DispatchLoad) => {
    alert(`Opening tracking for ${load.referenceNumber}`)
  }

  const getStatusColor = (status: DispatchLoad['status']) => {
    switch (status) {
      case 'Ready to Dispatch': return 'bg-yellow-100 text-yellow-800'
      case 'Dispatched': return 'bg-blue-100 text-blue-800'
      case 'Driver Assigned': return 'bg-purple-100 text-purple-800'
      case 'En Route': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: DispatchLoad['status']) => {
    switch (status) {
      case 'Ready to Dispatch': return <Clock className="h-4 w-4" />
      case 'Dispatched': return <Send className="h-4 w-4" />
      case 'Driver Assigned': return <User className="h-4 w-4" />
      case 'En Route': return <Truck className="h-4 w-4" />
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
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Dispatch & Pickup Coordination</h1>
              <p className="text-slate-600">Coordinate pickups and manage driver assignments</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button variant="outline" className="rounded-2xl">
                <Download className="h-4 w-4 mr-2" />
                Export BOLs
              </Button>
              <Button variant="outline" className="rounded-2xl">
                <NavigationIcon className="h-4 w-4 mr-2" />
                Track All
              </Button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Ready", count: loads.filter(l => l.status === 'Ready to Dispatch').length, color: "yellow" },
              { title: "Dispatched", count: loads.filter(l => l.status === 'Dispatched').length, color: "blue" },
              { title: "Assigned", count: loads.filter(l => l.status === 'Driver Assigned').length, color: "purple" },
              { title: "En Route", count: loads.filter(l => l.status === 'En Route').length, color: "green" }
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

          {/* Loads Grid */}
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="border-0 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                        <FileText className="h-5 w-5 text-blue-600" />
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
                        </div>
                        <div className="text-slate-600 mb-1">{load.shipper}</div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          <span>{load.origin} → {load.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-slate-800">${load.rate.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Load Rate</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Pickup Date</div>
                      <div className="text-sm font-medium text-slate-800">{new Date(load.pickupDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Delivery Date</div>
                      <div className="text-sm font-medium text-slate-800">{new Date(load.deliveryDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Equipment</div>
                      <div className="text-sm font-medium text-slate-800">{load.equipment}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Weight</div>
                      <div className="text-sm font-medium text-slate-800">{load.weight.toLocaleString()} lbs</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{load.carrier}</div>
                        {load.driver && (
                          <div className="text-sm text-slate-600">
                            Driver: {load.driver.name} • {load.driver.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {load.driver && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCallDriver(load.driver!)}
                        className="rounded-2xl"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Driver
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendBOL(load)}
                        className="rounded-2xl"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Send BOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendInstructions(load)}
                        className="rounded-2xl"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Instructions
                      </Button>
                      {(load.status === 'Dispatched' || load.status === 'En Route') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackLoad(load)}
                          className="rounded-2xl"
                        >
                          <NavigationIcon className="h-4 w-4 mr-2" />
                          Track
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {load.status === 'Ready to Dispatch' && (
                        <Button
                          onClick={() => handleDispatchLoad(load.id)}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Dispatching...</span>
                            </div>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Dispatch Load
                            </>
                          )}
                        </Button>
                      )}
                      {load.status === 'En Route' && (
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
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