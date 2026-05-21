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

  const [smartwatches, automatics, chronographs, accessories] = await Category.create([
    {
      name: 'Smartwatches',
      description: 'Connected watches for health, activity, notifications, and daily planning.',
      isFeatured: true,
      order: 1
    },
    {
      name: 'Automatic Watches',
      description: 'Mechanical watches with classic cases, exhibition backs, and premium finishing.',
      isFeatured: true,
      order: 2
    },
    {
      name: 'Chronographs',
      description: 'Sport and dress chronographs with precise timing and bold dial layouts.',
      isFeatured: true,
      order: 3
    },
    {
      name: 'Straps & Accessories',
      description: 'Leather, steel, silicone, chargers, and watch-care essentials.',
      order: 4
    }
  ]);

  const categories = {
    smartwatches: smartwatches._id,
    automatics: automatics._id,
    chronographs: chronographs._id,
    accessories: accessories._id
  };

  await Product.create([
    {
      name: 'Lahventure Apex S9 Smartwatch',
      shortDescription: 'AMOLED smartwatch with GPS, calls, and seven-day battery.',
      description:
        'A polished everyday smartwatch with GPS workouts, Bluetooth calling, health metrics, sleep reports, and a bright always-on display.',
      category: categories.smartwatches,
      brand: 'Lahventure',
      sku: 'LV-SMART-APEX-S9',
      price: 229,
      compareAtPrice: 279,
      images: [image('photo-1523275335684-37898b6baf30', 'Lahventure Apex smartwatch')],
      tags: ['smartwatch', 'gps', 'wearable', 'featured'],
      inventory: { stock: 32, lowStockThreshold: 8, trackQuantity: true },
      shipping: { weight: 1.2, freeShipping: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 42
    },
    {
      name: 'Lahventure Heritage Automatic',
      shortDescription: 'Dress automatic with sapphire crystal and leather strap.',
      description:
        'A refined automatic watch with a 38mm stainless steel case, sapphire crystal, exhibition caseback, and hand-finished dial details.',
      category: categories.automatics,
      brand: 'Lahventure',
      sku: 'LV-AUTO-HERITAGE-38',
      price: 349,
      compareAtPrice: 429,
      images: [image('photo-1523170335258-f5ed11844a49', 'Classic automatic watch')],
      tags: ['automatic', 'dress-watch', 'leather'],
      inventory: { stock: 18, lowStockThreshold: 6, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.6,
      ratingsCount: 18
    },
    {
      name: 'Lahventure Expedition GMT',
      shortDescription: 'Dual-time travel watch with 100m water resistance.',
      description:
        'A travel-ready GMT watch with independent hour hand adjustment, luminous markers, screw-down crown, and brushed steel bracelet.',
      category: categories.automatics,
      brand: 'Lahventure',
      sku: 'LV-AUTO-EXP-GMT',
      price: 489,
      compareAtPrice: 560,
      images: [image('photo-1508685096489-7aacd43bd3b1', 'GMT travel watch')],
      tags: ['automatic', 'gmt', 'travel'],
      inventory: { stock: 24, lowStockThreshold: 5, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.7,
      ratingsCount: 31
    },
    {
      name: 'Lahventure Pulse Pro Smartwatch',
      shortDescription: 'Health, activity, and sleep tracking in a slim case.',
      description:
        'An everyday smartwatch with heart-rate monitoring, GPS activity tracking, sleep reports, water resistance, and seven-day battery life.',
      category: categories.smartwatches,
      brand: 'Lahventure',
      sku: 'LV-SMART-PULSE-PRO',
      price: 214,
      compareAtPrice: 260,
      images: [image('photo-1523275335684-37898b6baf30', 'Smart watch on neutral background')],
      tags: ['smartwatch', 'fitness', 'wearable'],
      inventory: { stock: 15, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.5,
      ratingsCount: 24
    },
    {
      name: 'Lahventure Rally Chronograph',
      shortDescription: 'Sport chronograph with tachymeter bezel and steel bracelet.',
      description:
        'A bold chronograph with a high-contrast dial, accurate timing registers, 316L stainless steel case, and quick-release bracelet.',
      category: categories.chronographs,
      brand: 'Lahventure',
      sku: 'LV-CHRONO-RALLY',
      price: 299,
      compareAtPrice: 369,
      images: [image('photo-1434056886845-dac89ffe9b56', 'Sport chronograph watch')],
      tags: ['chronograph', 'sport-watch', 'steel'],
      variants: [{ name: 'Dial', options: ['Black', 'Blue', 'Silver'] }],
      inventory: { stock: 46, lowStockThreshold: 10, trackQuantity: true },
      ratingsAverage: 4.4,
      ratingsCount: 16
    },
    {
      name: 'Lahventure Leather Strap Set',
      shortDescription: 'Two quick-release leather straps for daily rotation.',
      description:
        'A pair of full-grain leather straps with quick-release spring bars, reinforced stitching, and polished stainless buckles.',
      category: categories.accessories,
      brand: 'Lahventure',
      sku: 'LV-STRAP-LEATHER-DUO',
      price: 68,
      images: [image('photo-1524592094714-0f0654e20314', 'Leather watch strap')],
      tags: ['strap', 'leather', 'accessory'],
      inventory: { stock: 11, lowStockThreshold: 5, trackQuantity: true },
      ratingsAverage: 4.9,
      ratingsCount: 12
    },
    {
      name: 'Lahventure Trainer Sport Smartwatch',
      shortDescription: 'Lightweight sport smartwatch with workout coaching.',
      description:
        'A lightweight smartwatch built for training with workout coaching, heart-rate zones, recovery insights, and a breathable silicone strap.',
      category: categories.smartwatches,
      brand: 'Lahventure',
      sku: 'LV-SMART-TRAINER',
      price: 189,
      images: [image('photo-1523275335684-37898b6baf30', 'Sport smartwatch')],
      tags: ['smartwatch', 'fitness', 'sport'],
      inventory: { stock: 52, lowStockThreshold: 12, trackQuantity: true },
      ratingsAverage: 4.3,
      ratingsCount: 9
    },
    {
      name: 'Lahventure Watch Care Kit',
      shortDescription: 'Cleaning cloth, tool, and travel case for watch upkeep.',
      description:
        'A compact watch-care kit with microfiber cloths, case brush, strap tool, and a structured travel case for daily maintenance.',
      category: categories.accessories,
      brand: 'Lahventure',
      sku: 'LV-CARE-KIT',
      price: 49,
      compareAtPrice: 69,
      images: [image('photo-1523170335258-f5ed11844a49', 'Watch care kit')],
      tags: ['care', 'tool', 'accessory'],
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
