'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { MapPin, Clock, AlertTriangle, CheckCircle, Navigation as NavigationIcon, Phone, Mail, RefreshCw, Truck, Zap } from 'lucide-react'

interface LoadTracking {
  id: string
  referenceNumber: string
  route: string
  progress: number
  currentLocation: string
  driver: {
    name: string
    phone: string
  }
  carrier: string
  eta: string
  lastUpdate: string
  status: 'On Time' | 'Delayed' | 'Early'
  alerts: string[]
}

export default function MonitoringPage() {
  const [loads, setLoads] = useState<LoadTracking[]>([
    {
      id: '1',
      referenceNumber: 'LH-2024-091',
      route: 'Chicago, IL → Dallas, TX',
      progress: 65,
      currentLocation: 'I-55 S, Memphis, TN',
      driver: { name: 'John Driver', phone: '(555) 123-4567' },
      carrier: 'Reliable Transport LLC',
      eta: '8 hours 30 min',
      lastUpdate: '2 hours ago',
      status: 'On Time',
      alerts: []
    },
    {
      id: '2',
      referenceNumber: 'LH-2024-092',
      route: 'Atlanta, GA → Miami, FL',
      progress: 85,
      currentLocation: 'I-95 S, Fort Lauderdale, FL',
      driver: { name: 'Carlos Rodriguez', phone: '(555) 567-8901' },
      carrier: 'Southeast Freight',
      eta: '2 hours 15 min',
      lastUpdate: '30 minutes ago',
      status: 'Early',
      alerts: []
    },
    {
      id: '3',
      referenceNumber: 'LH-2024-093',
      route: 'Los Angeles, CA → Phoenix, AZ',
      progress: 45,
      currentLocation: 'I-10 E, Indio, CA',
      driver: { name: 'David Kim', phone: '(555) 678-9012' },
      carrier: 'Desert Express',
      eta: '4 hours 45 min',
      lastUpdate: '1 hour ago',
      status: 'Delayed',
      alerts: ['Weather delay reported', 'Heavy traffic ahead']
    }
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Simulate data refresh
    setTimeout(() => {
      setLoads(prev => prev.map(load => ({
        ...load,
        progress: Math.min(100, load.progress + Math.random() * 5),
        lastUpdate: 'Just now',
        eta: load.status === 'Delayed' ? '5 hours 30 min' : load.eta
      })))
      setIsRefreshing(false)
    }, 2000)
  }

  const handleCallDriver = (driver: { name: string; phone: string }) => {
    alert(`Calling ${driver.name} at ${driver.phone}`)
  }

  const handleUpdateShipper = (load: LoadTracking) => {
    alert(`Sending update to shipper for ${load.referenceNumber}`)
  }

  const handleResolveAlert = (loadId: string, alertIndex: number) => {
    setLoads(prev => prev.map(load => 
      load.id === loadId 
        ? { ...load, alerts: load.alerts.filter((_, i) => i !== alertIndex) }
        : load
    ))
    alert('Alert resolved successfully!')
  }

  const getStatusColor = (status: LoadTracking['status']) => {
    switch (status) {
      case 'On Time': return 'bg-green-100 text-green-800'
      case 'Delayed': return 'bg-red-100 text-red-800'
      case 'Early': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoads(prev => prev.map(load => ({
        ...load,
        progress: Math.min(100, load.progress + 0.5),
        lastUpdate: 'Just updated'
      })))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />

        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">In-Transit Monitoring</h1>
              <p className="text-slate-600">Real-time tracking and status updates for active loads</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-2xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh All'}
              </Button>
              <Button variant="outline" className="rounded-2xl">
                <NavigationIcon className="h-4 w-4 mr-2" />
                Map View
              </Button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { title: "On Time", count: loads.filter(l => l.status === 'On Time').length, color: "green" },
              { title: "Delayed", count: loads.filter(l => l.status === 'Delayed').length, color: "red" },
              { title: "Early", count: loads.filter(l => l.status === 'Early').length, color: "blue" }
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

          {/* Active Loads Tracking */}
          <div className="grid gap-6">
            {loads.map((load) => (
              <Card key={load.id} className="border-0 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                        <NavigationIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{load.referenceNumber}</h3>
                          <Badge className={`rounded-full ${getStatusColor(load.status)}`}>
                            {load.status}
                          </Badge>
                        </div>
                        <div className="text-slate-600 mb-1">{load.route}</div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          <span>Current: {load.currentLocation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-blue-600">{load.progress}%</div>
                      <div className="text-xs text-slate-500">Complete</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Route Progress</span>
                      <span>ETA: {load.eta}</span>
                    </div>
                    <Progress value={load.progress} className="h-3 rounded-full" />
                  </div>

                  {/* Driver & Carrier Info */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{load.carrier}</div>
                        <div className="text-sm text-slate-600">Carrier</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{load.driver.name}</div>
                        <div className="text-sm text-slate-600">{load.driver.phone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {load.alerts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-800 mb-3 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        Active Alerts
                      </h4>
                      <div className="space-y-2">
                        {load.alerts.map((alert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-amber-800">{alert}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveAlert(load.id, index)}
                              className="rounded-xl text-xs"
                            >
                              Resolve
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Last updated: {load.lastUpdate}
                    </div>
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
                        onClick={() => handleUpdateShipper(load)}
                        className="rounded-2xl"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Update Shipper
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
                      >
                        <NavigationIcon className="h-4 w-4 mr-2" />
                        Track Live
                      </Button>
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