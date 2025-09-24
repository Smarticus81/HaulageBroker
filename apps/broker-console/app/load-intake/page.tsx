'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Navigation } from '@/components/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { FileText, MapPin, Package, DollarSign, Calendar, Clock, Truck, Save, Send, Calculator, User, Phone } from 'lucide-react'

interface LoadForm {
  // Shipper Information
  shipperName: string
  shipperContact: string
  shipperPhone: string
  
  // Origin Information
  originCity: string
  originState: string
  originAddress: string
  pickupDate: string
  pickupTime: string
  
  // Destination Information
  destinationCity: string
  destinationState: string
  destinationAddress: string
  deliveryDate: string
  deliveryTime: string
  
  // Load Details
  commodity: string
  weight: string
  equipment: string
  distance: string
  sellRate: string
  
  // Special Instructions
  specialInstructions: string
}

export default function LoadIntakePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<LoadForm>({
    shipperName: '',
    shipperContact: '',
    shipperPhone: '',
    originCity: '',
    originState: '',
    originAddress: '',
    pickupDate: '',
    pickupTime: '',
    destinationCity: '',
    destinationState: '',
    destinationAddress: '',
    deliveryDate: '',
    deliveryTime: '',
    commodity: '',
    weight: '',
    equipment: 'Dry Van',
    distance: '',
    sellRate: '',
    specialInstructions: ''
  })

  const handleInputChange = (field: keyof LoadForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateRate = () => {
    const distance = parseFloat(formData.distance) || 0
    const weight = parseFloat(formData.weight) || 0
    
    // Simple rate calculation based on distance and equipment type
    let baseRate = distance * 2.5 // $2.50 per mile base
    
    // Equipment multipliers
    const equipmentMultipliers = {
      'Dry Van': 1.0,
      'Reefer': 1.3,
      'Flatbed': 1.2,
      'Step Deck': 1.4
    }
    
    const multiplier = equipmentMultipliers[formData.equipment as keyof typeof equipmentMultipliers] || 1.0
    const calculatedRate = Math.round(baseRate * multiplier)
    
    handleInputChange('sellRate', calculatedRate.toString())
  }

  const handleSaveDraft = async () => {
    setIsLoading(true)
    
    // Simulate saving draft
    setTimeout(() => {
      const loadId = `LH-2024-${String(Date.now()).slice(-3)}`
      localStorage.setItem(`draft-${loadId}`, JSON.stringify({
        ...formData,
        id: loadId,
        status: 'Draft',
        createdAt: new Date().toISOString()
      }))
      
      setIsLoading(false)
      alert(`Draft saved successfully! Load ID: ${loadId}`)
    }, 1000)
  }

  const handleCreateLoad = async () => {
    setIsLoading(true)
    
    // Simulate creating load
    setTimeout(() => {
      const loadId = `LH-2024-${String(Date.now()).slice(-3)}`
      const newLoad = {
        ...formData,
        id: loadId,
        referenceNumber: loadId,
        status: 'Quote',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Save to localStorage (simulating database)
      const existingLoads = JSON.parse(localStorage.getItem('broker-loads') || '[]')
      existingLoads.push(newLoad)
      localStorage.setItem('broker-loads', JSON.stringify(existingLoads))
      
      setIsLoading(false)
      alert(`Load created successfully! Load ID: ${loadId}`)
      router.push('/carrier-sourcing')
    }, 1500)
  }

  const useDemoData = () => {
    setFormData({
      shipperName: 'ABC Manufacturing',
      shipperContact: 'John Smith',
      shipperPhone: '(555) 123-4567',
      originCity: 'Chicago',
      originState: 'IL',
      originAddress: '123 Industrial Blvd, Chicago, IL 60601',
      pickupDate: '2024-01-20',
      pickupTime: '08:00',
      destinationCity: 'Dallas',
      destinationState: 'TX',
      destinationAddress: '456 Commerce St, Dallas, TX 75201',
      deliveryDate: '2024-01-22',
      deliveryTime: '14:00',
      commodity: 'Electronics',
      weight: '45000',
      equipment: 'Dry Van',
      distance: '925',
      sellRate: '2850',
      specialInstructions: 'Handle with care - fragile electronics'
    })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30">
        <Navigation />
        
        <div className="container mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight mb-2">Load Intake & Creation</h1>
              <p className="text-slate-600">Create new freight loads and generate quotes for shippers</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button variant="outline" onClick={useDemoData} className="rounded-2xl">
                Use Demo Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isLoading}
                className="rounded-2xl"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={handleCreateLoad}
                disabled={isLoading || !formData.shipperName || !formData.originCity || !formData.destinationCity}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Load
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipper Information */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>Shipper Information</span>
                  </CardTitle>
                  <CardDescription>Enter shipper details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={formData.shipperName}
                        onChange={(e) => handleInputChange('shipperName', e.target.value)}
                        placeholder="ABC Manufacturing"
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Person *</Label>
                      <Input
                        value={formData.shipperContact}
                        onChange={(e) => handleInputChange('shipperContact', e.target.value)}
                        placeholder="John Smith"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={formData.shipperPhone}
                      onChange={(e) => handleInputChange('shipperPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="rounded-2xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Origin Information */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span>Pickup Location</span>
                  </CardTitle>
                  <CardDescription>Specify pickup location and timing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        value={formData.originCity}
                        onChange={(e) => handleInputChange('originCity', e.target.value)}
                        placeholder="Chicago"
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        value={formData.originState}
                        onChange={(e) => handleInputChange('originState', e.target.value)}
                        placeholder="IL"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Address</Label>
                    <Input
                      value={formData.originAddress}
                      onChange={(e) => handleInputChange('originAddress', e.target.value)}
                      placeholder="123 Industrial Blvd, Chicago, IL 60601"
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Pickup Date *</Label>
                      <Input
                        type="date"
                        value={formData.pickupDate}
                        onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pickup Time</Label>
                      <Input
                        type="time"
                        value={formData.pickupTime}
                        onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destination Information */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span>Delivery Location</span>
                  </CardTitle>
                  <CardDescription>Specify delivery location and timing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        value={formData.destinationCity}
                        onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                        placeholder="Dallas"
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        value={formData.destinationState}
                        onChange={(e) => handleInputChange('destinationState', e.target.value)}
                        placeholder="TX"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Address</Label>
                    <Input
                      value={formData.destinationAddress}
                      onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                      placeholder="456 Commerce St, Dallas, TX 75201"
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Delivery Date *</Label>
                      <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input
                        type="time"
                        value={formData.deliveryTime}
                        onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Load Details */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <span>Load Details</span>
                  </CardTitle>
                  <CardDescription>Specify commodity and equipment requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Commodity *</Label>
                      <Input
                        value={formData.commodity}
                        onChange={(e) => handleInputChange('commodity', e.target.value)}
                        placeholder="Electronics"
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (lbs) *</Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="45000"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Equipment Type *</Label>
                      <select
                        value={formData.equipment}
                        onChange={(e) => handleInputChange('equipment', e.target.value)}
                        className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="Dry Van">Dry Van</option>
                        <option value="Reefer">Reefer</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Step Deck">Step Deck</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Distance (miles)</Label>
                      <Input
                        type="number"
                        value={formData.distance}
                        onChange={(e) => handleInputChange('distance', e.target.value)}
                        placeholder="925"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      placeholder="Any special handling requirements..."
                      className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rate Calculator */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>Rate Calculator</span>
                  </CardTitle>
                  <CardDescription>Calculate suggested rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sell Rate ($)</Label>
                    <Input
                      type="number"
                      value={formData.sellRate}
                      onChange={(e) => handleInputChange('sellRate', e.target.value)}
                      placeholder="2850"
                      className="rounded-2xl"
                    />
                  </div>
                  <Button 
                    onClick={calculateRate}
                    variant="outline" 
                    className="w-full rounded-2xl"
                    disabled={!formData.distance || !formData.equipment}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Rate
                  </Button>
                  {formData.sellRate && formData.distance && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl">
                      <div className="text-sm text-slate-600 mb-1">Rate per Mile</div>
                      <div className="text-lg font-semibold text-blue-600">
                        ${(parseFloat(formData.sellRate) / parseFloat(formData.distance)).toFixed(2)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Load Summary */}
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span>Load Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Route:</span>
                    <span className="font-medium">
                      {formData.originCity && formData.destinationCity 
                        ? `${formData.originCity}, ${formData.originState} → ${formData.destinationCity}, ${formData.destinationState}`
                        : 'Not specified'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Equipment:</span>
                    <span className="font-medium">{formData.equipment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Weight:</span>
                    <span className="font-medium">{formData.weight ? `${formData.weight} lbs` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Distance:</span>
                    <span className="font-medium">{formData.distance ? `${formData.distance} miles` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-slate-600">Total Rate:</span>
                    <span className="font-semibold text-green-600">{formData.sellRate ? `$${formData.sellRate}` : 'Not calculated'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}