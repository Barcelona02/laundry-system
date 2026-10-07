import { z } from 'zod'

export const ADD_ONS = ['fabcon', 'extra_rinse', 'stain_removal', 'folding'] as const

// Presyo ng add-ons (kapareho ng Order.ADD_ONS sa server), para sa price preview
export const ADD_ON_PRICES: Record<(typeof ADD_ONS)[number], number> = {
  fabcon: 15,
  extra_rinse: 20,
  stain_removal: 30,
  folding: 25,
}

export const RUSH_RATE = 0.5

export const orderSchema = z.object({
  customer: z.string().min(1, 'Please select a customer'),
  service: z.string().min(1, 'Please select a service'),
  quantity: z
    .number({ error: 'Quantity is required' })
    .min(0.5, 'Quantity must be at least 0.5')
    .max(100, 'Quantity must not exceed 100'),
  addOns: z.array(z.enum(ADD_ONS)),
  isRush: z.boolean(),
  notes: z.string().trim().max(300, 'Notes must not exceed 300 characters'),
})

export type OrderFormValues = z.infer<typeof orderSchema>
