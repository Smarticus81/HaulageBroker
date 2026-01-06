// Unified data layer for broker operations
// Supports both real API and mock data fallback

import { loadsApi, carriersApi, quotesApi } from './api-client';

// Check if we should use mock data (for local development without backend)
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

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

// Mock data for fallback
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

// Data cache for API responses
let loadsCache: Load[] = [];
let carriersCache: Carrier[] = [];

// Map API response to our Load interface
function mapApiLoadToLoad(apiLoad: any): Load {
  const statusMap: Record<string, Load['status']> = {
    'created': 'Quote',
    'quoted': 'Contracted',
    'tendered': 'Contracted',
    'awarded': 'Dispatched',
    'picked_up': 'In Transit',
    'in_transit': 'In Transit',
    'delivered': 'Delivered',
    'cancelled': 'Quote',
  };

  return {
    id: apiLoad.id,
    referenceNumber: `LH-${new Date(apiLoad.created_at).getFullYear()}-${apiLoad.id.slice(0, 3).toUpperCase()}`,
    shipper: {
      name: 'Shipper',
      contact: 'Contact',
      phone: '(555) 000-0000'
    },
    origin: {
      city: apiLoad.origin?.city || '',
      state: apiLoad.origin?.state || '',
      address: `${apiLoad.origin?.address || ''}, ${apiLoad.origin?.city || ''}, ${apiLoad.origin?.state || ''} ${apiLoad.origin?.zip || ''}`,
      pickupDate: apiLoad.pickup_earliest ? new Date(apiLoad.pickup_earliest).toISOString().split('T')[0] : '',
      pickupTime: apiLoad.pickup_earliest ? new Date(apiLoad.pickup_earliest).toTimeString().slice(0, 5) : ''
    },
    destination: {
      city: apiLoad.destination?.city || '',
      state: apiLoad.destination?.state || '',
      address: `${apiLoad.destination?.address || ''}, ${apiLoad.destination?.city || ''}, ${apiLoad.destination?.state || ''} ${apiLoad.destination?.zip || ''}`,
      deliveryDate: apiLoad.delivery_latest ? new Date(apiLoad.delivery_latest).toISOString().split('T')[0] : '',
      deliveryTime: apiLoad.delivery_latest ? new Date(apiLoad.delivery_latest).toTimeString().slice(0, 5) : ''
    },
    commodity: apiLoad.commodity || 'General Freight',
    weight: apiLoad.weight_lbs || 0,
    equipment: apiLoad.equipment_code?.includes('REEFER') ? 'Reefer' :
               apiLoad.equipment_code?.includes('FLAT') ? 'Flatbed' :
               apiLoad.equipment_code?.includes('STEP') ? 'Step Deck' : 'Dry Van',
    distance: 500,
    sellRate: 0,
    status: statusMap[apiLoad.status] || 'Quote',
    createdAt: apiLoad.created_at,
    updatedAt: apiLoad.updated_at
  };
}

// Map API response to our Carrier interface
function mapApiCarrierToCarrier(apiCarrier: any): Carrier {
  return {
    id: apiCarrier.id,
    name: apiCarrier.name,
    mcNumber: apiCarrier.mcNumber,
    dotNumber: apiCarrier.dotNumber,
    contact: 'Contact',
    phone: apiCarrier.phone || '',
    email: apiCarrier.email || '',
    address: `${apiCarrier.address?.street || ''}, ${apiCarrier.address?.city || ''}, ${apiCarrier.address?.state || ''} ${apiCarrier.address?.zip || ''}`,
    equipment: apiCarrier.equipmentTypes || [],
    rating: (apiCarrier.trustScore || 0) / 20,
    preferredLanes: [],
    status: 'Active',
    insuranceExpiry: apiCarrier.insurance?.expiration || '',
    authorityExpiry: '',
    createdAt: apiCarrier.createdAt
  };
}

// Fetch loads from API or use mock data
export async function fetchLoads(): Promise<Load[]> {
  if (USE_MOCK_DATA) {
    return mockLoads;
  }

  try {
    const response = await loadsApi.getAll({ limit: 100 });
    loadsCache = response.data.map(mapApiLoadToLoad);
    return loadsCache;
  } catch (error) {
    console.warn('Failed to fetch loads from API, using mock data:', error);
    return mockLoads;
  }
}

// Fetch carriers from API or use mock data
export async function fetchCarriers(): Promise<Carrier[]> {
  if (USE_MOCK_DATA) {
    return mockCarriers;
  }

  try {
    const response = await carriersApi.getAll({ limit: 100 });
    carriersCache = response.data.map(mapApiCarrierToCarrier);
    return carriersCache;
  } catch (error) {
    console.warn('Failed to fetch carriers from API, using mock data:', error);
    return mockCarriers;
  }
}

// Utility functions that work with both mock and real data
export const getLoadById = (id: string): Load | undefined => {
  if (loadsCache.length > 0) {
    return loadsCache.find(load => load.id === id);
  }
  return mockLoads.find(load => load.id === id);
}

export const getCarrierById = (id: string): Carrier | undefined => {
  if (carriersCache.length > 0) {
    return carriersCache.find(carrier => carrier.id === id);
  }
  return mockCarriers.find(carrier => carrier.id === id);
}

export const getLoadsByStatus = (status: Load['status']): Load[] => {
  const loads = loadsCache.length > 0 ? loadsCache : mockLoads;
  return loads.filter(load => load.status === status);
}

export const getActiveCarriers = (): Carrier[] => {
  const carriers = carriersCache.length > 0 ? carriersCache : mockCarriers;
  return carriers.filter(carrier => carrier.status === 'Active');
}

export const calculateTotalRevenue = (): number => {
  const loads = loadsCache.length > 0 ? loadsCache : mockLoads;
  return loads.reduce((total, load) => total + (load.sellRate || 0), 0);
}

export const calculateTotalMargin = (): number => {
  const loads = loadsCache.length > 0 ? loadsCache : mockLoads;
  return loads.reduce((total, load) => total + (load.margin || 0), 0);
}

export const getLoadStatistics = () => {
  const loads = loadsCache.length > 0 ? loadsCache : mockLoads;
  const total = loads.length;
  const active = loads.filter(l => l.status === 'In Transit' || l.status === 'Dispatched').length;
  const delivered = loads.filter(l => l.status === 'Delivered').length;
  const revenue = calculateTotalRevenue();
  const margin = calculateTotalMargin();
  const marginPercentage = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : '0.0';

  return {
    total,
    active,
    delivered,
    revenue,
    margin,
    marginPercentage
  };
}

// API-backed operations
export const createLoad = async (data: any) => {
  if (USE_MOCK_DATA) {
    const newLoad: Load = {
      id: String(mockLoads.length + 1),
      referenceNumber: `LH-${new Date().getFullYear()}-${String(mockLoads.length + 1).padStart(3, '0')}`,
      ...data,
      status: 'Quote',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockLoads.push(newLoad);
    return newLoad;
  }
  return loadsApi.create(data);
};

export const updateLoad = async (id: string, data: any) => {
  if (USE_MOCK_DATA) {
    const index = mockLoads.findIndex(l => l.id === id);
    if (index !== -1) {
      mockLoads[index] = { ...mockLoads[index], ...data, updatedAt: new Date().toISOString() };
      return mockLoads[index];
    }
    return null;
  }
  return loadsApi.update(id, data);
};

export const createCarrier = async (data: any) => {
  if (USE_MOCK_DATA) {
    const newCarrier: Carrier = {
      id: String(mockCarriers.length + 1),
      ...data,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    mockCarriers.push(newCarrier);
    return newCarrier;
  }
  return carriersApi.create(data);
};

export const updateCarrier = async (id: string, data: any) => {
  if (USE_MOCK_DATA) {
    const index = mockCarriers.findIndex(c => c.id === id);
    if (index !== -1) {
      mockCarriers[index] = { ...mockCarriers[index], ...data };
      return mockCarriers[index];
    }
    return null;
  }
  return carriersApi.update(id, data);
};

// Quote calculation
export const calculateQuote = async (data: { distance: number; equipmentCode: string; serviceLevel: string; weight?: number }) => {
  if (USE_MOCK_DATA) {
    const baseRates: Record<string, number> = {
      'DRY': 2.50,
      'REEFER': 3.00,
      'FLATBED': 2.75,
      'STEPDECK': 2.85,
    };
    const serviceMultipliers: Record<string, number> = {
      'standard': 1.0,
      'expedited': 1.25,
      'urgent': 1.5,
    };

    const baseRate = baseRates[data.equipmentCode.toUpperCase()] || 2.50;
    const multiplier = serviceMultipliers[data.serviceLevel] || 1.0;
    const price = Math.round(data.distance * baseRate * multiplier);

    return {
      priceUsd: price,
      ratePerMile: baseRate * multiplier,
      basis: `${data.equipmentCode} ${data.serviceLevel} - ${data.distance} miles`,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
  return quotesApi.calculate(data);
};
