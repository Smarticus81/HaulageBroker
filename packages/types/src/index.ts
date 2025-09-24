import { z } from 'zod'

// Core Entity Schemas
export const ShipperSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CarrierSchema = z.object({
  id: z.string().uuid(),
  mc_number: z.string(),
  dot_number: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  equipment_types: z.array(z.string()),
  insurance: z.object({
    liability: z.number(),
    cargo: z.number(),
    general: z.number(),
    expiration: z.date(),
  }),
  trust_score: z.number().min(0).max(100),
  created_at: z.date(),
  updated_at: z.date(),
})

export const LoadSchema = z.object({
  id: z.string().uuid(),
  shipper_id: z.string().uuid(),
  origin: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  destination: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  commodity: z.string(),
  weight_lbs: z.number(),
  equipment_code: z.string(),
  pickup_earliest: z.date(),
  delivery_latest: z.date(),
  service_level: z.enum(['standard', 'expedited', 'urgent']),
  special_requirements: z.array(z.string()).optional(),
  status: z.enum(['created', 'quoted', 'tendered', 'awarded', 'picked_up', 'in_transit', 'delivered', 'cancelled']),
  created_at: z.date(),
  updated_at: z.date(),
})

// Type exports
export type Shipper = z.infer<typeof ShipperSchema>
export type Carrier = z.infer<typeof CarrierSchema>
export type Load = z.infer<typeof LoadSchema>