'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, 
  Shield, 
  Clock, 
  DollarSign, 
  BarChart3, 
  CheckCircle, 
  MapPin,
  Search,
  Filter,
  ExternalLink,
  Zap,
  Users,
  Star,
  ArrowRight,
  Play,
  Package,
  TrendingUp
} from 'lucide-react'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'shippers' | 'carriers'>('shippers')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock loadboard data for preview
  const mockLoads = [
    {
      id: 'ADT-001',
      origin: 'Chicago, IL',
      destination: 'Dallas, TX',
      rate: 2850,
      equipment: 'Dry Van',
      pickupDate: '2024-01-15',
      urgent: false
    },
    {
      id: 'ADT-002',
      origin: 'Los Angeles, CA',
      destination: 'Phoenix, AZ',
      rate: 1200,
      equipment: 'Reefer',
      pickupDate: '2024-01-16',
      urgent: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <Shield className="h-9 w-9 text-slate-700" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-light text-slate-800 tracking-wide">Anderson Direct</span>
                <span className="text-xs text-slate-500 -mt-1 tracking-wider">TRANSPORT</span>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-50">
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl">
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-5xl lg:text-7xl font-light text-slate-800 mb-8 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Freight Made
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Simple
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Connect shippers and carriers through our intelligent platform. 
              Real-time matching, instant settlements, and complete transparency.
            </motion.p>

            {/* Tab Selector */}
            <motion.div 
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-2 border border-slate-200/50">
                <div className="flex">
                  {['shippers', 'carriers'].map((tab) => (
                    <motion.button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-8 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative ${
                        activeTab === tab
                          ? 'text-slate-800'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-white rounded-2xl shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative capitalize">{tab}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'shippers' ? (
                  <motion.div
                    key="shipper-cta"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-4 rounded-2xl shadow-lg">
                        Get Quote
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-2xl border-slate-200">
                        <Play className="mr-2 h-5 w-5" />
                        Watch Demo
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="carrier-cta"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-2xl shadow-lg">
                        Find Loads
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-2xl border-slate-200">
                        Join Network
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Live Loadboard Preview */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light text-slate-800 mb-6">Live Load Board</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Real-time loads from Anderson Direct and partner networks
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by origin, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 rounded-3xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-lg"
              />
            </div>
          </motion.div>

          {/* Load Cards */}
          <div className="grid gap-6 max-w-4xl mx-auto">
            {mockLoads.map((load, index) => (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group"
              >
                <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            Anderson Direct
                          </div>
                          {load.urgent && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <Zap className="h-3 w-3" />
                              Urgent
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                            <span className="font-medium text-slate-800">{load.origin}</span>
                          </div>
                          <div className="hidden sm:block w-8 h-px bg-slate-300"></div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-red-500" />
                            <span className="font-medium text-slate-800">{load.destination}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <span>{load.equipment}</span>
                          <span>{new Date(load.pickupDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <div className="text-3xl font-light text-slate-800">${load.rate.toLocaleString()}</div>
                        </div>
                        
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-2xl">
                            View Details
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button variant="outline" className="rounded-2xl px-8 py-3">
              View All Loads
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light text-slate-800 mb-6">Why Choose Anderson Direct</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Advanced technology meets personalized service
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "TrustShield",
                description: "Advanced fraud protection and carrier verification",
                color: "blue"
              },
              {
                icon: DollarSign,
                title: "Instant Pay",
                description: "Same-day settlements and transparent pricing",
                color: "emerald"
              },
              {
                icon: BarChart3,
                title: "Smart Analytics",
                description: "AI-powered insights and performance tracking",
                color: "violet"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 rounded-3xl h-full">
                  <CardContent className="p-8 text-center">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-200 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xl font-light tracking-wide">Anderson Direct</span>
                <span className="text-xs text-slate-400 -mt-1 tracking-wider">TRANSPORT</span>
              </div>
            </div>
            <p className="text-slate-400 mb-8">Connecting freight across America</p>
            <div className="flex justify-center gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}