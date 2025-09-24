'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { Activity, Clock, CheckCircle, Plus, Search, Filter, TrendingUp, TrendingDown, DollarSign, Truck, Users, BarChart3, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

// Dummy data for charts
const generateChartData = () => {
  const data = []
  for (let i = 0; i < 7; i++) {
    data.push({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 5000) + 1000,
    })
  }
  return data
}

export default function BrokerConsole() {
  const [user, setUser] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'load_created', message: 'New load LH-2024-091 created for Chicago → Dallas', time: '2 min ago', status: 'info' },
    { id: 2, type: 'carrier_assigned', message: 'Carrier assigned to load LH-2024-090', time: '15 min ago', status: 'success' },
    { id: 3, type: 'payment_processed', message: 'Payment of $2,850 processed', time: '1 hr ago', status: 'success' },
    { id: 4, type: 'issue_reported', message: 'Weather delay reported on load LH-2024-088', time: '2 hr ago', status: 'warning' }
  ])

  useEffect(() => {
    const userData = localStorage.getItem('broker-user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleQuickAction = (action: string) => {
    const newActivity = {
      id: Date.now(),
      type: action,
      message: `Quick action: ${action.replace('_', ' ')} initiated`,
      time: 'Just now',
      status: 'info' as const
    }
    setRecentActivity(prev => [newActivity, ...prev.slice(0, 3)])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
      <AuthGuard>
        <Navigation />

        <div className="container mx-auto px-6 py-6">
          {/* Clean Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-slate-800 mb-1">
              Operations Dashboard
            </h1>
            <p className="text-slate-600 text-sm">Real-time freight operations overview</p>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { 
                title: "Active Loads", 
                value: "47", 
                subtitle: "In transit & pending pickup",
                color: "blue",
                icon: Truck
              },
              { 
                title: "Today's Revenue", 
                value: "$18,450", 
                subtitle: "From 12 completed loads",
                color: "emerald",
                icon: DollarSign
              },
              { 
                title: "On-Time Rate", 
                value: "97.7%", 
                subtitle: "Last 30 days average",
                color: "violet",
                icon: CheckCircle
              }
            ].map((metric) => (
              <Card key={metric.title} className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${metric.color}-50`}>
                        <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600">{metric.title}</div>
                        <div className="text-xs text-slate-500">{metric.subtitle}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-800">{metric.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Essential Operations */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Critical Loads */}
            <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800">Critical Loads</CardTitle>
                <CardDescription className="text-sm">Loads requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: 'LH-2024-091', route: 'Chicago → Dallas', status: 'Pickup Overdue', time: '2 hours late', urgent: true },
                  { id: 'LH-2024-092', route: 'Atlanta → Miami', status: 'Driver Check-in', time: '15 min ago', urgent: false },
                  { id: 'LH-2024-093', route: 'Denver → Phoenix', status: 'Weather Delay', time: '1 hour ago', urgent: true }
                ].map((load) => (
                  <div key={load.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    load.urgent ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div>
                      <div className="font-medium text-slate-800">{load.id}</div>
                      <div className="text-sm text-slate-600">{load.route}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        load.urgent ? 'text-red-600' : 'text-slate-600'
                      }`}>{load.status}</div>
                      <div className="text-xs text-slate-500">{load.time}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800">Quick Actions</CardTitle>
                <CardDescription className="text-sm">Essential broker operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Create New Load', href: '/load-intake', icon: Plus, primary: true },
                  { label: 'Find Carriers', href: '/carrier-sourcing', icon: Users, primary: false },
                  { label: 'View Loadboard', href: '/loadboard', icon: Activity, primary: false },
                  { label: 'Process Payments', href: '/settlements', icon: DollarSign, primary: false }
                ].map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant={action.primary ? "default" : "outline"}
                      className={`w-full justify-start rounded-lg ${
                        action.primary 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <action.icon className="h-4 w-4 mr-3" />
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    </div>
  )
}