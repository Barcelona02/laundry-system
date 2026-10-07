import { z } from 'zod'

// Ang max ay ang natitirang balance, kaya gumagawa tayo ng schema base sa balance
export const makePaymentSchema = (balance: number) =>
  z
    .object({
      amount: z
        .number({ error: 'Amount is required' })
        .min(1, 'Amount must be at least ₱1')
        .max(balance, `Amount cannot exceed the balance of ₱${balance}`),
      method: z.enum(['cash', 'gcash', 'maya']),
      reference: z.string().trim().max(50, 'Reference must not exceed 50 characters'),
    })
    // GCash at Maya ay kailangan ng reference number
    .refine((v) => v.method === 'cash' || v.reference.length > 0, {
      message: 'Reference number is required for GCash and Maya',
      path: ['reference'],
    })

export type PaymentFormValues = z.infer<ReturnType<typeof makePaymentSchema>>
