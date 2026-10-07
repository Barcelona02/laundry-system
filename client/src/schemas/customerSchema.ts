import { z } from 'zod'

// Kapareho ng mga rule sa Customer model ng server
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, 'Phone must be a valid PH mobile number (e.g. 09171234567)'),
  address: z.string().trim().max(200, 'Address must not exceed 200 characters'),
  notes: z.string().trim().max(300, 'Notes must not exceed 300 characters'),
})

// Type ng form, kinuha mismo sa schema
export type CustomerFormValues = z.infer<typeof customerSchema>
