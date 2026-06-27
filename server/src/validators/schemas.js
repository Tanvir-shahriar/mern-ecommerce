import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB id');

export const idParamSchema = z.object({
  id: objectId
});

export const orderLookupParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const slugOrIdParamSchema = z.object({
  slugOrId: z.string().min(1)
});

const imageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
  publicId: z.string().optional()
});

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(5),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional()
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const socialAuthSchema = z.object({
  provider: z.enum(['google', 'facebook']),
  // Google sends an ID token (JWT signed by Google)
  idToken: z.string().optional(),
  // Facebook sends an access token
  accessToken: z.string().optional()
}).refine(
  (data) => data.idToken || data.accessToken,
  { message: 'Provide idToken (Google) or accessToken (Facebook)' }
);


export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  addresses: z.array(addressSchema).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: imageSchema.optional(),
  parent: objectId.nullable().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().optional()
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().max(220).optional(),
  category: objectId,
  brand: z.string().optional(),
  sku: z.string().min(2),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  images: z.array(imageSchema).min(1),
  tags: z.array(z.string()).optional(),
  attributes: z
    .array(
      z.object({
        name: z.string(),
        value: z.string()
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        options: z.array(z.string())
      })
    )
    .optional(),
  inventory: z
    .object({
      stock: z.coerce.number().min(0).optional(),
      lowStockThreshold: z.coerce.number().min(0).optional(),
      trackQuantity: z.boolean().optional()
    })
    .optional(),
  shipping: z
    .object({
      weight: z.coerce.number().optional(),
      dimensions: z
        .object({
          length: z.coerce.number().optional(),
          width: z.coerce.number().optional(),
          height: z.coerce.number().optional()
        })
        .optional(),
      freeShipping: z.boolean().optional()
    })
    .optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional()
    })
    .optional()
});

export const productUpdateSchema = productSchema.partial();

export const reviewSchema = z.object({
  orderId: objectId,
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(5)
});

export const addCartItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).default(1),
  variant: z.record(z.string(), z.string()).optional()
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0)
});

export const couponApplySchema = z.object({
  code: z.string().min(2)
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['card', 'cash_on_delivery', 'paypal', 'stripe']).default('cash_on_delivery'),
  customerNote: z.string().optional(),
  directItem: addCartItemSchema.optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().optional(),
  paymentStatus: z.enum(['pending', 'authorized', 'paid', 'failed', 'refunded']).optional()
});

export const stockUpdateSchema = z
  .object({
    stock: z.coerce.number().int().min(0).optional(),
    delta: z.coerce.number().int().optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    trackQuantity: z.boolean().optional()
  })
  .refine((value) => value.stock !== undefined || value.delta !== undefined || value.lowStockThreshold !== undefined || value.trackQuantity !== undefined, {
    message: 'Provide stock, delta, lowStockThreshold, or trackQuantity'
  });

export const roleUpdateSchema = z
  .object({
    role: z.enum(['customer', 'admin']).optional(),
    status: z.enum(['active', 'blocked']).optional()
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: 'Provide role or status'
  });
