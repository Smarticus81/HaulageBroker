// Simulated data store for broker operations

export interface Load {
  id: string
  referenceNumber: string
  shipper: {
    name: string
    contact: string
    phone: string
  }
  origin: {
    city: string
    state: string
    address: string
    pickupDate: string
    pickupTime: string
  }
  destination: {
    city: string
    state: string
    address: string
    deliveryDate: string
    deliveryTime: string
  }
  commodity: string
  weight: number
  equipment: 'Dry Van' | 'Reefer' | 'Flatbed' | 'Step Deck'
  distance: number
  sellRate: number
  buyRate?: number
  margin?: number
  status: 'Quote' | 'Contracted' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Invoiced' | 'Paid'
  carrier?: {
    name: string
    contact: string
    phone: string
    mcNumber: string
    dotNumber: string
  }
  driver?: {
    name: string
    phone: string
    cdlNumber: string
  }
  createdAt: string
  updatedAt: string
}

export interface Carrier {
  id: string
  name: string
  mcNumber: string
  dotNumber: string
  contact: string
  phone: string
  email: string
  address: string
  equipment: string[]
  rating: number
  preferredLanes: string[]
  status: 'Active' | 'Inactive' | 'Pending'
  insuranceExpiry: string
  authorityExpiry: string
  createdAt: string
}

// Simulated data
export const mockLoads: Load[] = [
  {
    id: '1',
    referenceNumber: 'LH-2024-091',
    shipper: {
      name: 'ABC Manufacturing',
      contact: 'John Smith',
      phone: '(555) 123-4567'
    },
    origin: {
      city: 'Chicago',
      state: 'IL',
      address: '123 Industrial Blvd, Chicago, IL 60601',
      pickupDate: '2024-01-16',
      pickupTime: '08:00'
    },
    destination: {
      city: 'Dallas',
      state: 'TX',
      address: '456 Commerce St, Dallas, TX 75201',
      deliveryDate: '2024-01-18',
      deliveryTime: '14:00'
    },
    commodity: 'Electronics',
    weight: 45000,
    equipment: 'Dry Van',
    distance: 925,
    sellRate: 2850,
    buyRate: 2400,
    margin: 450,
    status: 'Dispatched',
    carrier: {
      name: 'Reliable Transport LLC',
      contact: 'Mike Johnson',
      phone: '(555) 987-6543',
      mcNumber: 'MC-123456',
      dotNumber: 'DOT-789012'
    },
    driver: {
      name: 'Robert Wilson',
      phone: '(555) 456-7890',
      cdlNumber: 'CDL-IL-987654'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:45:00Z'
  },
  {
    id: '2',
    referenceNumber: 'LH-2024-090',
    shipper: {
      name: 'XYZ Logistics',
      contact: 'Sarah Davis',
      phone: '(555) 234-5678'
    },
    origin: {
      city: 'Atlanta',
      state: 'GA',
      address: '789 Peachtree St, Atlanta, GA 30309',
      pickupDate: '2024-01-15',
      pickupTime: '10:00'
    },
    destination: {
      city: 'Miami',
      state: 'FL',
      address: '321 Ocean Dr, Miami, FL 33139',
      deliveryDate: '2024-01-16',
      deliveryTime: '16:00'
    },
    commodity: 'Automotive Parts',
    weight: 38000,
    equipment: 'Dry Van',
    distance: 650,
    sellRate: 1950,
    buyRate: 1650,
    margin: 300,
    status: 'In Transit',
    carrier: {
      name: 'Southeast Freight',
      contact: 'Tom Anderson',
      phone: '(555) 345-6789',
      mcNumber: 'MC-234567',
      dotNumber: 'DOT-890123'
    },
    driver: {
      name: 'Carlos Rodriguez',
      phone: '(555) 567-8901',
      cdlNumber: 'CDL-GA-876543'
    },
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T11:20:00Z'
  },
  {
    id: '3',
    referenceNumber: 'LH-2024-089',
    shipper: {
      name: 'Global Supply Co',
      contact: 'Lisa Brown',
      phone: '(555) 345-6789'
    },
    origin: {
      city: 'Los Angeles',
      state: 'CA',
      address: '555 Harbor Blvd, Los Angeles, CA 90731',
      pickupDate: '2024-01-14',
      pickupTime: '07:00'
    },
    destination: {
      city: 'Phoenix',
      state: 'AZ',
      address: '777 Desert Ave, Phoenix, AZ 85001',
      deliveryDate: '2024-01-15',
      deliveryTime: '12:00'
    },
    commodity: 'Consumer Goods',
    weight: 42000,
    equipment: 'Reefer',
    distance: 370,
    sellRate: 1200,
    buyRate: 950,
    margin: 250,
    status: 'Delivered',
    carrier: {
      name: 'Desert Express',
      contact: 'Jim Martinez',
      phone: '(555) 456-7890',
      mcNumber: 'MC-345678',
      dotNumber: 'DOT-901234'
    },
    driver: {
      name: 'David Kim',
      phone: '(555) 678-9012',
      cdlNumber: 'CDL-CA-765432'
    },
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-15T13:30:00Z'
  }
]

export const mockCarriers: Carrier[] = [
  {
    id: '1',
    name: 'Reliable Transport LLC',
    mcNumber: 'MC-123456',
    dotNumber: 'DOT-789012',
    contact: 'Mike Johnson',
    phone: '(555) 987-6543',
    email: 'mike@reliabletransport.com',
    address: '123 Trucking Way, Dallas, TX 75201',
    equipment: ['Dry Van', 'Reefer'],
    rating: 4.8,
    preferredLanes: ['IL-TX', 'TX-CA', 'GA-FL'],
    status: 'Active',
    insuranceExpiry: '2024-12-31',
    authorityExpiry: '2025-06-30',
    createdAt: '2023-03-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Southeast Freight',
    mcNumber: 'MC-234567',
    dotNumber: 'DOT-890123',
    contact: 'Tom Anderson',
    phone: '(555) 345-6789',
    email: 'tom@southeastfreight.com',
    address: '456 Highway Rd, Atlanta, GA 30309',
    equipment: ['Dry Van', 'Flatbed'],
    rating: 4.6,
    preferredLanes: ['GA-FL', 'FL-TX', 'TX-GA'],
    status: 'Active',
    insuranceExpiry: '2024-11-30',
    authorityExpiry: '2025-04-15',
    createdAt: '2023-05-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Desert Express',
    mcNumber: 'MC-345678',
    dotNumber: 'DOT-901234',
    contact: 'Jim Martinez',
    phone: '(555) 456-7890',
    email: 'jim@desertexpress.com',
    address: '789 Desert Blvd, Phoenix, AZ 85001',
    equipment: ['Reefer', 'Dry Van'],
    rating: 4.9,
    preferredLanes: ['CA-AZ', 'AZ-TX', 'NV-CA'],
    status: 'Active',
    insuranceExpiry: '2025-01-31',
    authorityExpiry: '2025-08-20',
    createdAt: '2023-07-10T11:15:00Z'
  }
]

// Utility functions
export const getLoadById = (id: string): Load | undefined => {
  return mockLoads.find(load => load.id === id)
}

export const getCarrierById = (id: string): Carrier | undefined => {
  return mockCarriers.find(carrier => carrier.id === id)
}

export const getLoadsByStatus = (status: Load['status']): Load[] => {
  return mockLoads.filter(load => load.status === status)
}

export const getActiveCarriers = (): Carrier[] => {
  return mockCarriers.filter(carrier => carrier.status === 'Active')
}

export const calculateTotalRevenue = (): number => {
  return mockLoads.reduce((total, load) => total + (load.sellRate || 0), 0)
}

export const calculateTotalMargin = (): number => {
  return mockLoads.reduce((total, load) => total + (load.margin || 0), 0)
}

export const getLoadStatistics = () => {
  const total = mockLoads.length
  const active = getLoadsByStatus('In Transit').length + getLoadsByStatus('Dispatched').length
  const delivered = getLoadsByStatus('Delivered').length
  const revenue = calculateTotalRevenue()
  const margin = calculateTotalMargin()
  const marginPercentage = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : '0.0'

  return {
    total,
    active,
    delivered,
    revenue,
    margin,
    marginPercentage
  }
}
