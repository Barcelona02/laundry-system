import type { OrderStatus } from '../types'

// Kapareho ng ALLOWED_TRANSITIONS sa server (utils/orderLogic.js),
// para alam ng UI kung anong button ang ipapakita
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  received: ['washing', 'cancelled'],
  washing: ['drying'],
  drying: ['ready'],
  ready: ['claimed'],
  claimed: [],
  cancelled: [],
}

// Ang normal na daloy ng isang labada (para sa progress steps)
export const STATUS_FLOW: OrderStatus[] = ['received', 'washing', 'drying', 'ready', 'claimed']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'Received',
  washing: 'Washing',
  drying: 'Drying',
  ready: 'Ready for pickup',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
}
