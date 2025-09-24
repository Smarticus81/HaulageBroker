'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { Search, Mic, Truck, MapPin, Calendar, Weight, Clock, ExternalLink, Zap, Plus, Filter, Star, Phone, Mail } from 'lucide-react'

interface LoadboardLoad {
  id: string
  source: string
  origin: string
  destination: string
  pickupDate: string
  equipment: string
  weight: string
  distance: string
  rate: number
  ratePerMile: number
  urgent: boolean
  postedTime: string
  shipper: string
  contact?: {
    name: string
    phone: string
    email: string
  }
}

export default function LoadboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [equipmentType, setEquipmentType] = useState('')
  const [sortBy, setSortBy] = useState('pickup')
  const [selectedLoads, setSelectedLoads] = useState<string[]>([])
  const [isBooking, setIsBooking] = useState(false)

  const [loads, setLoads] = useState<LoadboardLoad[]>([
    {
      id: 'ADT-001',
      source: 'Anderson Direct',
      origin: 'Chicago, IL',
      destination: 'Dallas, TX',
      pickupDate: '1/20/2024',
      equipment: 'Dry Van',
      weight: '45,000 lbs',
      distance: '925 mi',
      rate: 2850,
      ratePerMile: 3.08,
      urgent: false,
      postedTime: '2 hours ago',
      shipper: 'ABC Manufacturing',
      contact: {
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john@abcmfg.com'
      }
    },
    {
      id: 'UF-7891',
      source: 'UberFreight',
      origin: 'Atlanta, GA',
      destination: 'Miami, FL',
      pickupDate: '1/20/2024',
      equipment: 'Dry Van',
      weight: '42,000 lbs',
      distance: '650 mi',
      rate: 1950,
      ratePerMile: 3.00,
      urgent: false,
      postedTime: '4 hours ago',
      shipper: 'XYZ Logistics'
    },
    {
      id: 'DAT-5432',
      source: 'DAT',
      origin: 'Los Angeles, CA',
      destination: 'Phoenix, AZ',
      pickupDate: '1/19/2024',
      equipment: 'Reefer',
      weight: '38,000 lbs',
      distance: '370 mi',
      rate: 1200,
      ratePerMile: 3.24,
      urgent: true,
      postedTime: '30 minutes ago',
      shipper: 'Global Supply Co'
    },
    {
      id: 'ADT-002',
      source: 'Anderson Direct',
      origin: 'Houston, TX',
      destination: 'New Orleans, LA',
      pickupDate: '1/21/2024',
      equipment: 'Flatbed',
      weight: '48,000 lbs',
      distance: '350 mi',
      rate: 1400,
      ratePerMile: 4.00,
      urgent: false,
      postedTime: '1 hour ago',
      shipper: 'Steel Works Inc',
      contact: {
        name: 'Mike Johnson',
        phone: '(555) 987-6543',
        email: 'mike@steelworks.com'
      }
    },
    {
      id: 'TRU-9876',
      source: 'Truckstop.com',
      origin: 'Denver, CO',
      destination: 'Salt Lake City, UT',
      pickupDate: '1/22/2024',
      equipment: 'Dry Van',
      weight: '35,000 lbs',
      distance: '525 mi',
      rate: 1575,
      ratePerMile: 3.00,
      urgent: false,
      postedTime: '6 hours ago',
      shipper: 'Mountain Freight'
    }
  ])

  const filteredLoads = loads
    .filter(
      (load) =>
        load.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.shipper.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((load) => (equipmentType ? load.equipment === equipmentType : true))
    .sort((a, b) => {
      if (sortBy === 'rate') return b.rate - a.rate
      if (sortBy === 'distance') return parseInt(a.distance) - parseInt(b.distance)
      if (sortBy === 'pickup') return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
      return 0
    })

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSearchTerm(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        alert('Voice search not available. Please try typing instead.')
      }

      recognition.start()
    } else {
      alert('Voice search not supported in this browser.')
    }
  }

  const handleSelectLoad = (loadId: string) => {
    setSelectedLoads(prev => 
      prev.includes(loadId) 
        ? prev.filter(id => id !== loadId)
        : [...prev, loadId]
    )
  }

  const handleBookLoad = async (load: LoadboardLoad) => {
    setIsBooking(true)
    
    // Simulate booking process
    setTimeout(() => {
      alert(`Load ${load.id} booked successfully! Shipper contact: ${load.contact?.name || 'Contact via platform'}`)
      setIsBooking(false)
    }, 2000)
  }

  const handleBulkBook = async () => {
    if (selectedLoads.length === 0) return
    
    setIsBooking(true)
    
    setTimeout(() => {
      alert(`${selectedLoads.length} loads booked successfully!`)
      setSelectedLoads([])
      setIsBooking(false)
    }, 3000)
  }

  const handleContactShipper = (load: LoadboardLoad) => {
    if (load.contact) {
      alert(`Contacting ${load.contact.name} at ${load.contact.phone}`)
    } else {
      alert(`Contact ${load.shipper} through ${load.source} platform`)
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Anderson Direct': return 'bg-blue-100 text-blue-800'
      case 'DAT': return 'bg-green-100 text-green-800'
      case 'UberFreight': return 'bg-purple-100 text-purple-800'
      case 'Truckstop.com': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const addNewLoad = () => {
    const newLoad: LoadboardLoad = {
      id: `ADT-${String(Date.now()).slice(-3)}`,
      source: 'Anderson Direct',
      origin: 'Seattle, WA',
      destination: 'Portland, OR',
      pickupDate: '1/23/2024',
      equipment: 'Dry Van',
      weight: '40,000 lbs',
      distance: '175 mi',
      rate: 525,
      ratePerMile: 3.00,
      urgent: false,
      postedTime: 'Just posted',
      shipper: 'Pacific Logistics',
      contact: {
        name: 'Sarah Wilson',
        phone: '(555) 234-5678',
        email: 'sarah@pacificlogistics.com'
      }
    }
    
    setLoads(prev => [newLoad, ...prev])
    alert('New load posted to loadboard!')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/50 sticky top-16 z-40">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-light text-slate-800 tracking-tight">Load Board</h1>
                <p className="text-slate-600 mt-1">Find and book loads from multiple sources</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={addNewLoad} className="rounded-2xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Load
                </Button>
                <Button 
                  onClick={handleBulkBook}
                  disabled={selectedLoads.length === 0 || isBooking}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
                >
                  {isBooking ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Booking...</span>
                    </div>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Book Selected ({selectedLoads.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by origin, destination, shipper, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 h-12 rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  aria-label="Voice search"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="px-4 py-3 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-slate-700"
              >
                <option value="">All Equipment</option>
                <option value="Dry Van">Dry Van</option>
                <option value="Reefer">Reefer</option>
                <option value="Flatbed">Flatbed</option>
                <option value="Step Deck">Step Deck</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-slate-700"
              >
                <option value="pickup">Sort by Pickup</option>
                <option value="rate">Sort by Rate</option>
                <option value="distance">Sort by Distance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Load Results */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-6">
            {filteredLoads.map((load) => (
              <Card 
                key={load.id} 
                className={`border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl cursor-pointer ${
                  selectedLoads.includes(load.id) ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                }`}
                onClick={() => handleSelectLoad(load.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      {/* Selection Checkbox */}
                      <div className="mt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedLoads.includes(load.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-slate-300 hover:border-blue-400'
                        }`}>
                          {selectedLoads.includes(load.id) && (
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-800">{load.id}</h3>
                          <Badge className={`rounded-full ${getSourceColor(load.source)}`}>
                            {load.source}
                          </Badge>
                          {load.urgent && (
                            <Badge className="bg-red-100 text-red-800 rounded-full">
                              <Zap className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-xs text-slate-500">Origin</div>
                              <div className="text-sm font-medium text-slate-800">{load.origin}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="text-xs text-slate-500">Destination</div>
                              <div className="text-sm font-medium text-slate-800">{load.destination}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="text-xs text-slate-500">Pickup Date</div>
                              <div className="text-sm font-medium text-slate-800">{load.pickupDate}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-xs text-slate-500">Equipment</div>
                              <div className="text-sm font-medium text-slate-800">{load.equipment}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Weight className="h-4 w-4" />
                            <span>{load.weight}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{load.distance}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Posted {load.postedTime}</span>
                          </div>
                          <div className="text-slate-500">
                            Shipper: {load.shipper}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${load.rate.toLocaleString()}</div>
                      <div className="text-sm text-slate-500">${load.ratePerMile.toFixed(2)}/mile</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {load.contact && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleContactShipper(load)
                            }}
                            className="rounded-2xl"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              alert(`Emailing ${load.contact?.email}`)
                            }}
                            className="rounded-2xl"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        </>
                      )}
                      {load.source !== 'Anderson Direct' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            alert(`Opening ${load.source} platform`)
                          }}
                          className="rounded-2xl"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on {load.source}
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookLoad(load)
                      }}
                      disabled={isBooking}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Book Load
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLoads.length === 0 && (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No loads found</h3>
              <p className="text-slate-600">Try adjusting your search criteria or check back later for new loads</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}