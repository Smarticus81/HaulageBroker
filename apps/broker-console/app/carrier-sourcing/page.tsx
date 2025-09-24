'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { mockCarriers, type Carrier } from '@/lib/broker-data'
import { Users, Search, Filter, Star, Phone, Mail, MapPin, Truck, Shield, CheckCircle, Send, Plus, Clock } from 'lucide-react'

export default function CarrierSourcingPage() {
  const [carriers, setCarriers] = useState<Carrier[]>(mockCarriers)
  const [filteredCarriers, setFilteredCarriers] = useState<Carrier[]>(mockCarriers)
  const [searchTerm, setSearchTerm] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let filtered = carriers

    if (searchTerm) {
      filtered = filtered.filter(carrier => 
        carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.mcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.contact.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (equipmentFilter) {
      filtered = filtered.filter(carrier => 
        carrier.equipment.includes(equipmentFilter)
      )
    }

    setFilteredCarriers(filtered)
  }, [searchTerm, equipmentFilter, carriers])

  const handleSelectCarrier = (carrierId: string) => {
    setSelectedCarriers(prev => 
      prev.includes(carrierId) 
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    )
  }

  const handleSendContract = async () => {
    if (selectedCarriers.length === 0) return

    setIsLoading(true)
    
    // Simulate sending contracts
    setTimeout(() => {
      const selectedCarrierNames = carriers
        .filter(c => selectedCarriers.includes(c.id))
        .map(c => c.name)
        .join(', ')
      
      alert(`Contracts sent successfully to ${selectedCarriers.length} carrier(s): ${selectedCarrierNames}`)
      setSelectedCarriers([])
      setIsLoading(false)
    }, 2000)
  }

  const handleCallCarrier = (carrier: Carrier) => {
    alert(`Calling ${carrier.name} at ${carrier.phone}`)
  }

  const handleEmailCarrier = (carrier: Carrier) => {
    alert(`Opening email to ${carrier.name} at ${carrier.email}`)
  }

  const addNewCarrier = () => {
    const newCarrier: Carrier = {
      id: String(Date.now()),
      name: 'New Carrier LLC',
      mcNumber: `MC-${String(Date.now()).slice(-6)}`,
      dotNumber: `DOT-${String(Date.now()).slice(-6)}`,
      contact: 'Contact Person',
      phone: '(555) 000-0000',
      email: 'contact@newcarrier.com',
      address: 'Address, City, State',
      equipment: ['Dry Van'],
      rating: 4.0,
      preferredLanes: [],
      status: 'Pending',
      insuranceExpiry: '2024-12-31',
      authorityExpiry: '2025-06-30',
      createdAt: new Date().toISOString()
    }
    
    setCarriers(prev => [newCarrier, ...prev])
    alert('New carrier added successfully!')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Carrier Sourcing & Contracting</h1>
              <p className="text-slate-600">Find and manage carriers for your freight loads</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button variant="outline" onClick={addNewCarrier} className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Carrier
              </Button>
              <Button 
                onClick={handleSendContract}
                disabled={selectedCarriers.length === 0 || isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Contract ({selectedCarriers.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search carriers by name, MC#, or contact..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                    className="px-4 py-3 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-slate-700"
                  >
                    <option value="">All Equipment</option>
                    <option value="Dry Van">Dry Van</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Step Deck">Step Deck</option>
                  </select>
                  <Button variant="outline" className="rounded-2xl">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carriers Grid */}
          <div className="grid gap-6">
            {filteredCarriers.map((carrier) => (
              <Card 
                key={carrier.id} 
                className={`border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl cursor-pointer ${
                  selectedCarriers.includes(carrier.id) ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                }`}
                onClick={() => handleSelectCarrier(carrier.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Selection Checkbox */}
                      <div className="mt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedCarriers.includes(carrier.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-slate-300 hover:border-blue-400'
                        }`}>
                          {selectedCarriers.includes(carrier.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Carrier Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-slate-800">{carrier.name}</h3>
                          <Badge 
                            variant={carrier.status === 'Active' ? 'default' : 'secondary'}
                            className="rounded-full"
                          >
                            {carrier.status}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-slate-700">{carrier.rating}</span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="text-xs text-slate-500">MC Number</div>
                              <div className="text-sm font-medium text-slate-800">{carrier.mcNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-xs text-slate-500">Equipment</div>
                              <div className="text-sm font-medium text-slate-800">{carrier.equipment.join(', ')}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="text-xs text-slate-500">Location</div>
                              <div className="text-sm font-medium text-slate-800">{carrier.address.split(',').slice(-2).join(',').trim()}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-xs text-slate-500">Insurance Exp</div>
                              <div className="text-sm font-medium text-slate-800">{new Date(carrier.insuranceExpiry).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">{carrier.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-700">{carrier.email}</span>
                          </div>
                          <div className="text-sm text-slate-500">
                            Contact: {carrier.contact}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCallCarrier(carrier)
                        }}
                        className="rounded-2xl"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEmailCarrier(carrier)
                        }}
                        className="rounded-2xl"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCarriers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No carriers found</h3>
              <p className="text-slate-600">Try adjusting your search criteria or add a new carrier</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}