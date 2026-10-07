// Mga TypeScript type na katapat ng Mongoose models sa server

export type OrderStatus = 'received' | 'washing' | 'drying' | 'ready' | 'claimed' | 'cancelled'
export type AddOn = 'fabcon' | 'extra_rinse' | 'stain_removal' | 'folding'
export type PaymentMethod = 'cash' | 'gcash' | 'maya'
export type MachineType = 'washer' | 'dryer'
export type MachineStatus = 'available' | 'in_use' | 'maintenance'

export interface Customer {
  _id: string
  name: string
  phone: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Service {
  _id: string
  name: string
  description?: string
  pricingType: 'per_kg' | 'per_piece'
  price: number
  minimumCharge: number
  turnaroundHours: number
  isActive: boolean
}

export interface StatusHistoryEntry {
  status: OrderStatus
  changedAt: string
}

export interface Order {
  _id: string
  orderCode: string
  customer: Pick<Customer, '_id' | 'name' | 'phone'> | null
  service: Pick<Service, '_id' | 'name' | 'pricingType' | 'price'> | null
  quantity: number
  addOns: AddOn[]
  isRush: boolean
  subtotal: number
  addOnsTotal: number
  rushFee: number
  totalAmount: number
  status: OrderStatus
  statusHistory: StatusHistoryEntry[]
  promisedAt: string
  claimedAt: string | null
  machine: Pick<Machine, '_id' | 'code' | 'type'> | null
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  _id: string
  order: string
  amount: number
  method: PaymentMethod
  reference?: string
  createdAt: string
}

export interface Machine {
  _id: string
  code: string
  type: MachineType
  capacityKg: number
  status: MachineStatus
  currentOrder: { _id: string; orderCode: string; status: OrderStatus } | null
}

// Laging { message } ang error format ng server
export interface ApiError {
  message: string
}
