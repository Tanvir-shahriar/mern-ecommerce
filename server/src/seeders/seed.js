import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Cart } from '../models/cart.model.js';
import { Category } from '../models/category.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';

const image = (id, alt) => ({
  url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`,
  alt
});

const run = async () => {
  await connectDB();

  await Promise.all([
    Cart.deleteMany(),
    Order.deleteMany(),
    Product.deleteMany(),
    Category.deleteMany(),
    Coupon.deleteMany(),
    User.deleteMany()
  ]);

  const [electronics, apparel, home, wellness] = await Category.create([
    {
      name: 'Electronics',
      description: 'Connected devices, audio, productivity, and everyday tech.',
      isFeatured: true,
      order: 1
    },
    {
      name: 'Apparel',
      description: 'Modern wardrobe essentials for work, travel, and weekends.',
      isFeatured: true,
      order: 2
    },
    {
      name: 'Home',
      description: 'Useful home goods with clean materials and timeless styling.',
      isFeatured: true,
      order: 3
    },
    {
      name: 'Wellness',
      description: 'Daily-care products for recovery, focus, and better routines.',
      order: 4
    }
  ]);

  const categories = {
    electronics: electronics._id,
    apparel: apparel._id,
    home: home._id,
    wellness: wellness._id
  };

  await Product.create([
    {
      name: 'AeroSound Pro Headphones',
      shortDescription: 'Adaptive noise cancellation with a 38-hour battery.',
      description:
        'Premium wireless headphones built for focused work, travel, and immersive listening with soft-touch controls and multipoint pairing.',
      category: categories.electronics,
      brand: 'AeroSound',
      sku: 'AUD-AERO-PRO',
      price: 179,
      compareAtPrice: 229,
      images: [image('photo-1505740420928-5e560c06d30e', 'Black wireless headphones')],
      tags: ['audio', 'wireless', 'featured'],
      inventory: { stock: 32, lowStockThreshold: 8, trackQuantity: true },
      shipping: { weight: 1.2, freeShipping: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 42
    },
    {
      name: 'Lumina Desk Lamp',
      shortDescription: 'Dimmable LED task lamp with wireless charging.',
      description:
        'A compact aluminum desk lamp with warm-to-cool light, touch controls, and a built-in wireless charging base.',
      category: categories.home,
      brand: 'Lumina',
      sku: 'HOME-LUMINA-LAMP',
      price: 89,
      compareAtPrice: 119,
      images: [image('photo-1507473885765-e6ed057f782c', 'Minimal desk lamp')],
      tags: ['desk', 'lighting', 'home-office'],
      inventory: { stock: 18, lowStockThreshold: 6, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.6,
      ratingsCount: 18
    },
    {
      name: 'Transit Tech Backpack',
      shortDescription: 'Weather-resistant 24L backpack with laptop protection.',
      description:
        'A structured backpack with a padded laptop zone, clamshell access, cable pockets, and recycled water-resistant fabric.',
      category: categories.apparel,
      brand: 'Northline',
      sku: 'BAG-TRANSIT-24',
      price: 132,
      compareAtPrice: 160,
      images: [image('photo-1553062407-98eeb64c6a62', 'Black travel backpack')],
      tags: ['travel', 'bag', 'work'],
      inventory: { stock: 24, lowStockThreshold: 5, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.7,
      ratingsCount: 31
    },
    {
      name: 'PulseFit Smart Watch',
      shortDescription: 'Health, activity, and sleep tracking in a slim case.',
      description:
        'An everyday smart watch with heart-rate monitoring, GPS activity tracking, sleep reports, and seven-day battery life.',
      category: categories.electronics,
      brand: 'PulseFit',
      sku: 'WEAR-PULSEFIT-7',
      price: 214,
      compareAtPrice: 260,
      images: [image('photo-1523275335684-37898b6baf30', 'Smart watch on neutral background')],
      tags: ['watch', 'fitness', 'wearable'],
      inventory: { stock: 15, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.5,
      ratingsCount: 24
    },
    {
      name: 'Everyday Knit Overshirt',
      shortDescription: 'Soft midweight layer with a tailored casual fit.',
      description:
        'A breathable cotton-blend overshirt made for layering, finished with durable buttons and reinforced seams.',
      category: categories.apparel,
      brand: 'Threadform',
      sku: 'APP-KNIT-OVERSHIRT',
      price: 74,
      compareAtPrice: 98,
      images: [image('photo-1520975954732-35dd22299614', 'Neutral knit overshirt')],
      tags: ['shirt', 'layer', 'apparel'],
      variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }],
      inventory: { stock: 46, lowStockThreshold: 10, trackQuantity: true },
      ratingsAverage: 4.4,
      ratingsCount: 16
    },
    {
      name: 'Ceramic Pour-Over Set',
      shortDescription: 'Hand-glazed pour-over dripper and matching server.',
      description:
        'A ceramic brewing set with an ergonomic server, heat-retaining dripper, and reusable stainless filter.',
      category: categories.home,
      brand: 'Kettle & Kiln',
      sku: 'HOME-POUR-SET',
      price: 68,
      images: [image('photo-1495474472287-4d71bcdd2085', 'Coffee pour over set')],
      tags: ['coffee', 'kitchen', 'ceramic'],
      inventory: { stock: 11, lowStockThreshold: 5, trackQuantity: true },
      ratingsAverage: 4.9,
      ratingsCount: 12
    },
    {
      name: 'Recovery Massage Roller',
      shortDescription: 'Textured roller for mobility and post-workout recovery.',
      description:
        'A dense EVA foam roller with a multi-zone texture pattern for legs, back, shoulders, and daily mobility work.',
      category: categories.wellness,
      brand: 'Reform',
      sku: 'WELL-ROLLER-PRO',
      price: 39,
      images: [image('photo-1571019613454-1cb2f99b2d8b', 'Fitness recovery roller')],
      tags: ['fitness', 'recovery', 'wellness'],
      inventory: { stock: 52, lowStockThreshold: 12, trackQuantity: true },
      ratingsAverage: 4.3,
      ratingsCount: 9
    },
    {
      name: 'Studio Monitor Stand',
      shortDescription: 'Solid walnut stand that raises screens and clears desk space.',
      description:
        'A low-profile monitor stand with a satin finish, cable channel, and enough clearance for compact keyboards.',
      category: categories.home,
      brand: 'Oakline',
      sku: 'DESK-MONITOR-WALNUT',
      price: 96,
      compareAtPrice: 120,
      images: [image('photo-1516321318423-f06f85e504b3', 'Clean desk with monitor stand')],
      tags: ['desk', 'workspace', 'wood'],
      inventory: { stock: 7, lowStockThreshold: 5, trackQuantity: true },
      ratingsAverage: 4.6,
      ratingsCount: 20
    }
  ]);

  await Coupon.create([
    {
      code: 'WELCOME10',
      description: '10% off first orders over $50.',
      discountType: 'percent',
      value: 10,
      minOrderAmount: 50,
      maxDiscountAmount: 40,
      usageLimit: 500
    },
    {
      code: 'FREESHIP',
      description: '$9 off orders over $75.',
      discountType: 'fixed',
      value: 9,
      minOrderAmount: 75,
      usageLimit: 300
    }
  ]);

  await User.create([
    {
      name: 'Store Admin',
      email: env.seedAdminEmail,
      password: env.seedAdminPassword,
      role: 'admin'
    },
    {
      name: 'Demo Customer',
      email: 'customer@example.com',
      password: 'Customer123!',
      role: 'customer'
    }
  ]);

  console.log('Database seeded successfully');
  console.log(`Admin: ${env.seedAdminEmail} / ${env.seedAdminPassword}`);
  console.log('Customer: customer@example.com / Customer123!');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  });
