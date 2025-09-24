'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Truck, Users, Calendar, Download, Filter, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    change: number
  }
  loads: {
    total: number
    completed: number
    onTime: number
    margin: number
  }
  carriers: {
    active: number
    topPerformer: string
    avgRating: number
  }
  lanes: {
    name: string
    volume: number
    revenue: number
    margin: number
  }[]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [data, setData] = useState<AnalyticsData>({
    revenue: {
      current: 127500,
      previous: 118200,
      change: 7.9
    },
    loads: {
      total: 47,
      completed: 44,
      onTime: 43,
      margin: 15.2
    },
    carriers: {
      active: 23,
      topPerformer: 'Reliable Transport LLC',
      avgRating: 4.7
    },
    lanes: [
      { name: 'Chicago, IL → Dallas, TX', volume: 12, revenue: 34200, margin: 18.5 },
      { name: 'Atlanta, GA → Miami, FL', volume: 8, revenue: 15600, margin: 16.2 },
      { name: 'Los Angeles, CA → Phoenix, AZ', volume: 6, revenue: 7200, margin: 20.8 },
      { name: 'Houston, TX → New Orleans, LA', volume: 5, revenue: 9800, margin: 14.3 },
      { name: 'Denver, CO → Salt Lake City, UT', volume: 4, revenue: 8400, margin: 19.1 }
    ]
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Simulate data refresh
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          current: prev.revenue.current + Math.random() * 5000 - 2500,
          change: Math.random() * 20 - 10
        },
        loads: {
          ...prev.loads,
          total: prev.loads.total + Math.floor(Math.random() * 5),
          onTime: Math.floor(prev.loads.completed * (0.9 + Math.random() * 0.1))
        }
      }))
      setIsRefreshing(false)
    }, 2000)
  }

  const handleExportReport = () => {
    alert(`Exporting analytics report for ${timeRange}`)
  }

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    // Simulate data change based on time range
    const multiplier = range === '7d' ? 0.25 : range === '30d' ? 1 : range === '90d' ? 3 : 12
    setData(prev => ({
      ...prev,
      revenue: {
        ...prev.revenue,
        current: Math.floor(prev.revenue.current * multiplier)
      },
      loads: {
        ...prev.loads,
        total: Math.floor(prev.loads.total * multiplier)
      }
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Business Analytics</h1>
              <p className="text-slate-600">Performance insights and business intelligence</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-2xl p-1 border border-slate-200/50">
                {['7d', '30d', '90d', '1y'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleTimeRangeChange(range)}
                    className={`rounded-xl ${timeRange === range ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-2xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleExportReport}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    data.revenue.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.revenue.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{formatPercentage(data.revenue.change)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-light text-slate-800 tracking-tight">
                    {formatCurrency(data.revenue.current)}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Total Revenue</div>
                  <div className="text-xs text-slate-500">vs {formatCurrency(data.revenue.previous)} last period</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {((data.loads.completed / data.loads.total) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-light text-slate-800 tracking-tight">{data.loads.total}</div>
                  <div className="text-sm font-medium text-slate-600">Total Loads</div>
                  <div className="text-xs text-slate-500">{data.loads.completed} completed</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-200">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    ★ {data.carriers.avgRating}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-light text-slate-800 tracking-tight">{data.carriers.active}</div>
                  <div className="text-sm font-medium text-slate-600">Active Carriers</div>
                  <div className="text-xs text-slate-500">Top: {data.carriers.topPerformer}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-200">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {((data.loads.onTime / data.loads.completed) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-light text-slate-800 tracking-tight">{data.loads.margin}%</div>
                  <div className="text-sm font-medium text-slate-600">Avg Margin</div>
                  <div className="text-xs text-slate-500">{data.loads.onTime} on-time deliveries</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Lanes Performance */}
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Top Performing Lanes</span>
              </CardTitle>
              <CardDescription>Revenue and volume analysis by shipping lane</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.lanes.map((lane, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50/80 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{lane.name}</div>
                        <div className="text-sm text-slate-600">{lane.volume} loads</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">{formatCurrency(lane.revenue)}</div>
                        <div className="text-xs text-slate-500">Revenue</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{lane.margin}%</div>
                        <div className="text-xs text-slate-500">Margin</div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-2xl">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Performance Insights</span>
                </CardTitle>
                <CardDescription>Key business metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Revenue Growth</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Revenue increased by {formatPercentage(data.revenue.change)} compared to last period, 
                    driven by higher volume on premium lanes.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">On-Time Performance</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {((data.loads.onTime / data.loads.completed) * 100).toFixed(1)}% on-time delivery rate 
                    maintains customer satisfaction and carrier relationships.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/50 border border-purple-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Carrier Network</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {data.carriers.active} active carriers with average rating of {data.carriers.avgRating}/5.0 
                    ensures reliable capacity.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Recommendations</span>
                </CardTitle>
                <CardDescription>Actionable insights for business growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Expand High-Margin Lanes</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Los Angeles → Phoenix shows 20.8% margin. Consider increasing capacity on this lane.
                  </p>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 rounded-2xl">
                    View Lane Analysis
                  </Button>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">Carrier Development</span>
                  </div>
                  <p className="text-sm text-indigo-700 mb-3">
                    Identify and onboard 3-5 new carriers for high-volume lanes to reduce dependency.
                  </p>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl">
                    Carrier Sourcing
                  </Button>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Pricing Optimization</span>
                  </div>
                  <p className="text-sm text-emerald-700 mb-3">
                    Review pricing on Houston → New Orleans (14.3% margin) to improve profitability.
                  </p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl">
                    Pricing Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}