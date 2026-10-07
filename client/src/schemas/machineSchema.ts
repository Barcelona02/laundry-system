import { z } from 'zod'

// Kapareho ng mga rule sa Machine model ng server
export const machineSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[WD]-\d{2}$/, 'Code must look like W-01 (washer) or D-01 (dryer)'),
    type: z.enum(['washer', 'dryer']),
    capacityKg: z
      .number({ error: 'Capacity is required' })
      .min(1, 'Capacity must be at least 1 kg')
      .max(30, 'Capacity must not exceed 30 kg'),
    status: z.enum(['available', 'maintenance']),
  })
  // W- ay para sa washer, D- ay para sa dryer
  .refine((v) => v.code.startsWith(v.type === 'washer' ? 'W-' : 'D-'), {
    message: 'Washer codes start with W-, dryer codes start with D-',
    path: ['code'],
  })

export type MachineFormValues = z.infer<typeof machineSchema>
