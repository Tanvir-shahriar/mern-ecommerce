import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Cart } from '../models/cart.model.js';
import { Category } from '../models/category.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { Gallery } from '../models/gallery.model.js';

const image = (id, alt) => ({
  url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`,
  alt
});

const shouldReset = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';

const upsertOne = async (Model, filter, payload) => {
  const existing = await Model.findOne(filter);
  if (!existing) return Model.create(payload);

  Object.assign(existing, payload);
  await existing.save();
  return existing;
};

const run = async () => {
  await connectDB();

  if (shouldReset) {
    await Promise.all([
      Cart.deleteMany(),
      Order.deleteMany(),
      Product.deleteMany(),
      Category.deleteMany(),
      Coupon.deleteMany(),
      User.deleteMany()
    ]);
  }

  const [smartwatches, automatics, chronographs, accessories] = await Promise.all(
    [
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
    ].map((category) => upsertOne(Category, { name: category.name }, category))
  );

  const categories = {
    smartwatches: smartwatches._id,
    automatics: automatics._id,
    chronographs: chronographs._id,
    accessories: accessories._id
  };

  const productSeeds = [
    {
      name: 'lahVenture Apex S9 Smartwatch',
      shortDescription: 'AMOLED smartwatch with GPS, calls, and seven-day battery.',
      description:
        'A polished everyday smartwatch with GPS workouts, Bluetooth calling, health metrics, sleep reports, and a bright always-on display.',
      category: categories.smartwatches,
      brand: 'lahVenture',
      sku: 'LV-SMART-APEX-S9',
      price: 22900,
      compareAtPrice: 27900,
      images: [image('photo-1523275335684-37898b6baf30', 'lahVenture Apex smartwatch')],
      tags: ['smartwatch', 'gps', 'wearable', 'featured'],
      inventory: { stock: 32, lowStockThreshold: 8, trackQuantity: true },
      shipping: { weight: 1.2, freeShipping: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 42
    },
    {
      name: 'lahVenture Heritage Automatic',
      shortDescription: 'Dress automatic with sapphire crystal and leather strap.',
      description:
        'A refined automatic watch with a 38mm stainless steel case, sapphire crystal, exhibition caseback, and hand-finished dial details.',
      category: categories.automatics,
      brand: 'lahVenture',
      sku: 'LV-AUTO-HERITAGE-38',
      price: 34900,
      compareAtPrice: 42900,
      images: [image('photo-1523170335258-f5ed11844a49', 'Classic automatic watch')],
      tags: ['automatic', 'dress-watch', 'leather'],
      inventory: { stock: 18, lowStockThreshold: 6, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.6,
      ratingsCount: 18
    },
    {
      name: 'lahVenture Expedition GMT',
      shortDescription: 'Dual-time travel watch with 100m water resistance.',
      description:
        'A travel-ready GMT watch with independent hour hand adjustment, luminous markers, screw-down crown, and brushed steel bracelet.',
      category: categories.automatics,
      brand: 'lahVenture',
      sku: 'LV-AUTO-EXP-GMT',
      price: 48900,
      compareAtPrice: 56000,
      images: [image('photo-1508685096489-7aacd43bd3b1', 'GMT travel watch')],
      tags: ['automatic', 'gmt', 'travel'],
      inventory: { stock: 24, lowStockThreshold: 5, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.7,
      ratingsCount: 31
    },
    {
      name: 'lahVenture Pulse Pro Smartwatch',
      shortDescription: 'Health, activity, and sleep tracking in a slim case.',
      description:
        'An everyday smartwatch with heart-rate monitoring, GPS activity tracking, sleep reports, water resistance, and seven-day battery life.',
      category: categories.smartwatches,
      brand: 'lahVenture',
      sku: 'LV-SMART-PULSE-PRO',
      price: 21400,
      compareAtPrice: 26000,
      images: [image('photo-1523275335684-37898b6baf30', 'Smart watch on neutral background')],
      tags: ['smartwatch', 'fitness', 'wearable'],
      inventory: { stock: 15, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.5,
      ratingsCount: 24
    },
    {
      name: 'lahVenture Rally Chronograph',
      shortDescription: 'Sport chronograph with tachymeter bezel and steel bracelet.',
      description:
        'A bold chronograph with a high-contrast dial, accurate timing registers, 316L stainless steel case, and quick-release bracelet.',
      category: categories.chronographs,
      brand: 'lahVenture',
      sku: 'LV-CHRONO-RALLY',
      price: 29900,
      compareAtPrice: 36900,
      images: [image('photo-1434056886845-dac89ffe9b56', 'Sport chronograph watch')],
      tags: ['chronograph', 'sport-watch', 'steel'],
      variants: [{ name: 'Dial', options: ['Black', 'Blue', 'Silver'] }],
      inventory: { stock: 46, lowStockThreshold: 10, trackQuantity: true },
      ratingsAverage: 4.4,
      ratingsCount: 16
    },
    {
      name: 'lahVenture Leather Strap Set',
      shortDescription: 'Two quick-release leather straps for daily rotation.',
      description:
        'A pair of full-grain leather straps with quick-release spring bars, reinforced stitching, and polished stainless buckles.',
      category: categories.accessories,
      brand: 'lahVenture',
      sku: 'LV-STRAP-LEATHER-DUO',
      price: 6800,
      images: [image('photo-1524592094714-0f0654e20314', 'Leather watch strap')],
      tags: ['strap', 'leather', 'accessory'],
      inventory: { stock: 11, lowStockThreshold: 5, trackQuantity: true },
      ratingsAverage: 4.9,
      ratingsCount: 12
    },
    {
      name: 'lahVenture Trainer Sport Smartwatch',
      shortDescription: 'Lightweight sport smartwatch with workout coaching.',
      description:
        'A lightweight smartwatch built for training with workout coaching, heart-rate zones, recovery insights, and a breathable silicone strap.',
      category: categories.smartwatches,
      brand: 'lahVenture',
      sku: 'LV-SMART-TRAINER',
      price: 18900,
      images: [image('photo-1523275335684-37898b6baf30', 'Sport smartwatch')],
      tags: ['smartwatch', 'fitness', 'sport'],
      inventory: { stock: 52, lowStockThreshold: 12, trackQuantity: true },
      ratingsAverage: 4.3,
      ratingsCount: 9
    },
    {
      name: 'lahVenture Watch Care Kit',
      shortDescription: 'Cleaning cloth, tool, and travel case for watch upkeep.',
      description:
        'A compact watch-care kit with microfiber cloths, case brush, strap tool, and a structured travel case for daily maintenance.',
      category: categories.accessories,
      brand: 'lahVenture',
      sku: 'LV-CARE-KIT',
      price: 4900,
      compareAtPrice: 6900,
      images: [image('photo-1523170335258-f5ed11844a49', 'Watch care kit')],
      tags: ['care', 'tool', 'accessory'],
      inventory: { stock: 7, lowStockThreshold: 5, trackQuantity: true },
      ratingsAverage: 4.6,
      ratingsCount: 20
    }
  ];

  for (const product of productSeeds) {
    await upsertOne(Product, { sku: product.sku }, product);
  }

  const couponSeeds = [
    {
      code: 'WELCOME10',
      description: '10% off first orders over BDT 5,000.',
      discountType: 'percent',
      value: 10,
      minOrderAmount: 5000,
      maxDiscountAmount: 4000,
      usageLimit: 500
    },
    {
      code: 'FREESHIP',
      description: 'BDT 900 off orders over BDT 7,500.',
      discountType: 'fixed',
      value: 900,
      minOrderAmount: 7500,
      usageLimit: 300
    }
  ];

  for (const coupon of couponSeeds) {
    await upsertOne(Coupon, { code: coupon.code }, coupon);
  }

  const userSeeds = [
    {
      name: 'Store Admin',
      email: env.seedAdminEmail,
      password: env.seedAdminPassword,
      role: 'super_admin'
    },
    {
      name: 'Demo Customer',
      email: 'customer@example.com',
      password: 'Customer123!',
      role: 'customer',
      phone: '+8801700000000',
      addresses: [
        {
          label: 'Home',
          fullName: 'Demo Customer',
          phone: '+8801700000000',
          line1: 'House 12, Road 4',
          line2: 'Dhanmondi',
          city: 'Dhaka',
          state: 'Dhaka',
          postalCode: '1209',
          country: 'Bangladesh',
          isDefault: true
        }
      ]
    }
  ];

  for (const user of userSeeds) {
    await upsertOne(User, { email: user.email }, user);
  }

  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80', alt: 'Gold Aero Chronograph Watch', order: 0 },
    { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80', alt: 'LahVenture Steel Minimalist Watch', order: 1 },
    { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', alt: 'Classic Heritage White Dial Watch', order: 2 },
    { url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80', alt: 'Dark Edition Chrono Timepiece', order: 3 },
    { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80', alt: 'Vintage Leather Explorer Watch', order: 4 },
    { url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80', alt: 'Apex Diver Rose Gold Watch', order: 5 },
    { url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=80', alt: 'Ocean Master Blue Chronometer', order: 6 },
    { url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80', alt: 'Executive Black Leather Automatic', order: 7 }
  ];
  await upsertOne(Gallery, { key: 'panoramic-library' }, { key: 'panoramic-library', images: galleryImages });

  console.log(`Database seeded successfully${shouldReset ? ' with reset' : ' without deleting existing records'}`);
  console.log(`Admin: ${env.seedAdminEmail} / ${env.seedAdminPassword}`);
  console.log('Customer: customer@example.com / Customer123!');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
