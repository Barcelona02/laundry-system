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

// Mga computed field na idinadagdag ng server sa bawat order (GET /orders)
export interface OrderBalance {
  amountPaid: number
  storageFee: number
  daysUnclaimed: number
  amountDue: number
  balance: number
  isPaid: boolean
  isLate: boolean
}

export type OrderWithBalance = Order & OrderBalance

// GET /orders/:id: may kasamang buong customer, service, at payments
export interface OrderDetail extends Omit<OrderWithBalance, 'customer' | 'service'> {
  customer: Customer | null
  service: Service | null
  payments: Payment[]
}

// GET /stats/dashboard
export interface DashboardStats {
  sales: { today: number; thisMonth: number; allTime: number }
  orders: {
    total: number
    byStatus: Record<OrderStatus, number>
    active: number
    late: number
    unclaimed: number
  }
  receivables: { unpaidBalance: number; pendingStorageFees: number }
  machines: { total: number; inUse: number; maintenance: number; utilizationRate: number }
  averages: { turnaroundHours: number; kgPerOrder: number; orderValue: number }
  topServices: { name: string; orders: number; billed: number }[]
  topCustomers: { _id: string; name: string; orders: number; totalSpent: number }[]
}

// GET /stats/sales?days=7
export interface SalesReport {
  days: number
  total: number
  series: { date: string; total: number; payments: number }[]
}

// GET /machines/availability
export interface MachineTypeSummary {
  total: number
  available: number
  inUse: number
  maintenance: number
  availableCapacityKg: number
}

export interface MachineAvailability {
  washer: MachineTypeSummary
  dryer: MachineTypeSummary
  utilizationRate: number
}

// GET /track/:orderCode (public, walang personal na detalye)
export interface TrackResult {
  orderCode: string
  customerFirstName: string
  service: string | null
  quantity: number
  status: OrderStatus
  statusHistory: StatusHistoryEntry[]
  promisedAt: string
  claimedAt: string | null
  isLate: boolean
  amountDue: number
  amountPaid: number
  balance: number
  storageFee: number
}

// Laging { message } ang error format ng server
export interface ApiError {
  message: string
}
