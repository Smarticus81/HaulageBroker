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
          {/* Welcome Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">
                Welcome back, {user?.name || 'Broker'}
              </h1>
              <p className="text-slate-600">Here's what's happening with your brokerage operations today</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Link href="/load-intake">
                <Button 
                  onClick={() => handleQuickAction('create_load')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-9 px-4 text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Load
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="rounded-xl h-9 px-4 text-sm"
                onClick={() => {
                  const searchTerm = prompt('Search for loads, carriers, or shipments:')
                  if (searchTerm) {
                    alert(`Searching for: "${searchTerm}"`)
                  }
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Active Loads", value: "47", change: "+5", color: "blue", trend: "up" },
              { title: "Open Contracts", value: "23", change: "12 pending", color: "amber", trend: "neutral" },
              { title: "Revenue (7d)", value: "$127.5K", change: "+8%", color: "emerald", trend: "up" },
              { title: "On-Time %", value: "97.7%", change: "+0.5%", color: "violet", trend: "up" }
            ].map((stat, index) => (
              <Card key={stat.title} className="border-0 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{stat.title}</div>
                    <div className={`w-2 h-2 rounded-full bg-${stat.color}-400 opacity-60`}></div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-light text-slate-800 tracking-tight">{stat.value}</div>
                    <div className={`flex items-center text-xs font-medium ${
                      stat.trend === 'up' ? 'text-emerald-600' : 
                      stat.trend === 'down' ? 'text-red-500' : 'text-slate-500'
                    }`}>
                      {stat.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {stat.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-slate-800">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Latest updates on your operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-400' :
                        activity.status === 'warning' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800">{activity.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-slate-800">Performance Overview</CardTitle>
                      <CardDescription className="text-sm">7-day trend analysis</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl"
                      onClick={() => window.location.href = '/analytics'}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Avg. Revenue/Load</div>
                      <div className="text-xl font-semibold text-emerald-600">$2,150</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Avg. Margin/Load</div>
                      <div className="text-xl font-semibold text-blue-600">$420</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Avg. On-Time %</div>
                      <div className="text-xl font-semibold text-violet-600">98.1%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div>
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-slate-800">Quick Actions</CardTitle>
                  <CardDescription className="text-sm">Jump to key tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Create Load', action: 'create_load', href: '/load-intake', icon: Plus },
                    { label: 'Find Carriers', action: 'find_carriers', href: '/carrier-sourcing', icon: Users },
                    { label: 'View Loadboard', action: 'view_loadboard', href: '/loadboard', icon: Activity },
                    { label: 'Process Settlements', action: 'process_settlements', href: '/settlements', icon: DollarSign }
                  ].map((item) => (
                    <Link key={item.action} href={item.href}>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl border-slate-200/60 bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-all duration-300"
                        onClick={() => handleQuickAction(item.action)}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    </div>
  )
}