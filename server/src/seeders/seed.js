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

  const [smartwatches, automatics, chronographs, accessories, fashionCat, electronicsCat, homeLivingCat, beautyCareCat] = await Promise.all(
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
      },
      {
        name: 'Fashion',
        description: 'Haute couture, luxury apparel, outerwear, and statement garments.',
        isFeatured: true,
        order: 5
      },
      {
        name: 'Electronics',
        description: 'Audio equipment, smart gadgets, cameras, and wearable tech.',
        isFeatured: true,
        order: 6
      },
      {
        name: 'Home & Living',
        description: 'Minimalist decor, living room aesthetics, lighting, and interior accents.',
        isFeatured: true,
        order: 7
      },
      {
        name: 'Beauty & Personal Care',
        description: 'Organic skincare, luxury fragrances, botanical serums, and grooming.',
        isFeatured: true,
        order: 8
      }
    ].map((category) => upsertOne(Category, { name: category.name }, category))
  );

  const categories = {
    smartwatches: smartwatches._id,
    automatics: automatics._id,
    chronographs: chronographs._id,
    accessories: accessories._id,
    fashion: fashionCat._id,
    electronics: electronicsCat._id,
    homeLiving: homeLivingCat._id,
    beautyCare: beautyCareCat._id
  };

  const productSeeds = [
    // Fashion Collection
    {
      name: 'Y-26 Architectural Graphic Kimono Jacket',
      shortDescription: 'Monochrome structured oversized graphic coat with raw hem finish.',
      description: 'Crafted from heavyweight Japanese cotton twill, this architectural graphic coat features signature relaxed proportions, drop shoulders, and custom screen-printed artwork across the back.',
      category: categories.fashion,
      brand: 'Yohji Yamamoto',
      sku: 'Y-FASH-001',
      price: 45000,
      compareAtPrice: 52000,
      images: [
        image('photo-1515886657613-9f3515b0c78f', 'Fashion Kimono Coat'),
        image('photo-1490481651871-ab68de25d43d', 'Coat Back View'),
        image('photo-1489987707025-afc232f7ea0f', 'Coat Fabric Detail')
      ],
      tags: ['fashion', 'clothing', 'outerwear', 'featured'],
      inventory: { stock: 15, lowStockThreshold: 3, trackQuantity: true },
      shipping: { weight: 1.5, freeShipping: true },
      isFeatured: true,
      ratingsAverage: 4.9,
      ratingsCount: 28
    },
    {
      name: 'Jubilant Minimalist Pleated Trousers',
      shortDescription: 'High-waisted double pleated wool trousers with relaxed silhouette.',
      description: 'Tailored from tropical wool drape with double forward pleats, wide silhouette, subtle coin pocket, and concealed horn buttons.',
      category: categories.fashion,
      brand: 'Yohji Yamamoto',
      sku: 'Y-FASH-002',
      price: 32000,
      compareAtPrice: 38000,
      images: [
        image('photo-1509631179647-0177331693ae', 'Minimalist Pleated Trousers'),
        image('photo-1515886657613-9f3515b0c78f', 'Trousers Styling')
      ],
      tags: ['fashion', 'clothing', 'pants'],
      inventory: { stock: 20, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 19
    },
    {
      name: 'Avant-Garde Drape Trench Overcoat',
      shortDescription: 'Deconstructed storm flap trench coat in midnight black.',
      description: 'An iconic deconstructed trench coat engineered with asymmetric storm flaps, deep welt pockets, and custom belt buckle detailing.',
      category: categories.fashion,
      brand: 'Yohji Yamamoto',
      sku: 'Y-FASH-003',
      price: 58000,
      compareAtPrice: 65000,
      images: [
        image('photo-1539109136881-3be0616acf4b', 'Avant Garde Trench Coat'),
        image('photo-1490481651871-ab68de25d43d', 'Trench Side Detail')
      ],
      tags: ['fashion', 'clothing', 'coat'],
      inventory: { stock: 8, lowStockThreshold: 2, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 5.0,
      ratingsCount: 35
    },

    // Electronics Collection
    {
      name: 'Acoustique Studio Noise-Cancelling Headphones',
      shortDescription: 'Wireless audiophile studio headphones with active noise isolation.',
      description: 'Engineered with custom 45mm beryllium drivers, active noise cancellation, low-latency Bluetooth 5.3, and 40-hour battery stamina.',
      category: categories.electronics,
      brand: 'Acoustique',
      sku: 'EL-AUDIO-001',
      price: 38500,
      compareAtPrice: 44000,
      images: [
        image('photo-1505740420928-5e560c06d30e', 'Studio Headphones'),
        image('photo-1484704849700-f032a568e944', 'Headphones Case')
      ],
      tags: ['electronics', 'audio', 'headphones', 'tech'],
      inventory: { stock: 25, lowStockThreshold: 5, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.9,
      ratingsCount: 52
    },
    {
      name: 'lahVenture Apex S9 Smartwatch',
      shortDescription: 'AMOLED smartwatch with GPS, calls, and seven-day battery.',
      description: 'A polished everyday smartwatch with GPS workouts, Bluetooth calling, health metrics, sleep reports, and a bright always-on display.',
      category: categories.smartwatches,
      brand: 'lahVenture',
      sku: 'LV-SMART-APEX-S9',
      price: 22900,
      compareAtPrice: 27900,
      images: [
        image('photo-1523275335684-37898b6baf30', 'lahVenture Apex smartwatch'),
        image('photo-1508685096489-7aacd43bd3b1', 'Smartwatch Dial')
      ],
      tags: ['electronics', 'smartwatch', 'gps', 'wearable', 'featured'],
      inventory: { stock: 32, lowStockThreshold: 8, trackQuantity: true },
      shipping: { weight: 1.2, freeShipping: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 42
    },
    {
      name: 'Vortex Portable Spatial Speaker',
      shortDescription: '360-degree spatial audio speaker with aluminum body.',
      description: 'An acoustic masterpiece with dual passive radiators, room calibration, IP67 dust/waterproofing, and magnetic charging dock.',
      category: categories.electronics,
      brand: 'Vortex',
      sku: 'EL-AUDIO-002',
      price: 26000,
      compareAtPrice: 30000,
      images: [
        image('photo-1545454675-3531b543be5d', 'Vortex Spatial Speaker'),
        image('photo-1505740420928-5e560c06d30e', 'Speaker Angle')
      ],
      tags: ['electronics', 'audio', 'speaker'],
      inventory: { stock: 18, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.7,
      ratingsCount: 31
    },

    // Home & Living Collection
    {
      name: 'Aero Lounge Sculptural Accent Chair',
      shortDescription: 'Minimalist ergonomic velvet lounge chair with matte steel frame.',
      description: 'Designed for contemporary living spaces, featuring density foam cushioning, organic contours, and hand-welded architectural steel legs.',
      category: categories.homeLiving,
      brand: 'Kjaer Living',
      sku: 'HM-FURN-001',
      price: 64000,
      compareAtPrice: 72000,
      images: [
        image('photo-1567538096630-e0c55bd6374c', 'Accent Lounge Chair'),
        image('photo-1513694203232-719a280e022f', 'Living Room Layout')
      ],
      tags: ['home', 'furniture', 'decor', 'living'],
      inventory: { stock: 6, lowStockThreshold: 2, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.9,
      ratingsCount: 14
    },
    {
      name: 'Lumina Warm Diffused Pendant Light',
      shortDescription: 'Hand-blown opal glass LED pendant with brushed brass hardware.',
      description: 'Creates ambient warm illumination with dimmable LED core, satin brass suspension rod, and hand-finished glass diffuser.',
      category: categories.homeLiving,
      brand: 'Lumina Haus',
      sku: 'HM-DECOR-002',
      price: 28900,
      compareAtPrice: 34000,
      images: [
        image('photo-1507473885765-e6ed057f782c', 'Pendant Lighting'),
        image('photo-1513694203232-719a280e022f', 'Pendant Ambience')
      ],
      tags: ['home', 'lighting', 'decor'],
      inventory: { stock: 14, lowStockThreshold: 3, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.8,
      ratingsCount: 22
    },
    {
      name: 'Zenith Handcrafted Ceramic Vase Set',
      shortDescription: 'Trio of textured matte ceramic vessels for botanical styling.',
      description: 'Each vessel is thrown by hand with raw stoneware clay, matte reactive glaze, and unique organic form variations.',
      category: categories.homeLiving,
      brand: 'Zenith Studio',
      sku: 'HM-DECOR-003',
      price: 14500,
      compareAtPrice: 18000,
      images: [
        image('photo-1612196808214-b7e239e5f6b7', 'Ceramic Vase Set'),
        image('photo-1513694203232-719a280e022f', 'Vase Detail')
      ],
      tags: ['home', 'decor', 'ceramics'],
      inventory: { stock: 22, lowStockThreshold: 5, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.6,
      ratingsCount: 18
    },

    // Beauty & Personal Care Collection
    {
      name: 'Botanical Elixir Facial Radiance Serum',
      shortDescription: 'Nourishing botanical oil infusion with hyaluronic acid & vitamin C.',
      description: 'Formulated with cold-pressed rosehip seed oil, bakuchiol, and bio-fermented algae to restore skin elasticity and natural radiance.',
      category: categories.beautyCare,
      brand: 'Aura Botanicals',
      sku: 'BT-SKIN-001',
      price: 12800,
      compareAtPrice: 15500,
      images: [
        image('photo-1620916566398-39f1143ab7be', 'Botanical Serum Bottle'),
        image('photo-1522337360788-8b13dee7a37e', 'Serum Dropper')
      ],
      tags: ['beauty', 'skincare', 'serum', 'organic'],
      inventory: { stock: 40, lowStockThreshold: 8, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.9,
      ratingsCount: 64
    },
    {
      name: 'Nocturne Eau de Parfum 100ml',
      shortDescription: 'Complex woody oriental fragrance with amber, oud, and bergamot.',
      description: 'An evocative olfactory composition opening with crisp Italian bergamot, deepening into rare agarwood resin and warm golden amber.',
      category: categories.beautyCare,
      brand: 'Maison Noir',
      sku: 'BT-FRAG-002',
      price: 24500,
      compareAtPrice: 28500,
      images: [
        image('photo-1541643600914-78b084683601', 'Perfume Bottle'),
        image('photo-1522337360788-8b13dee7a37e', 'Perfume Packaging')
      ],
      tags: ['beauty', 'fragrance', 'perfume'],
      inventory: { stock: 19, lowStockThreshold: 4, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 5.0,
      ratingsCount: 41
    },
    {
      name: 'Velvet Hydra-Balm Lip Treatment',
      shortDescription: 'Rich conditioning lip mask infused with shea butter and peptides.',
      description: 'Delivers intensive hydration, smoothing fine lines and plumping lips with botanical seed oils and restorative peptides.',
      category: categories.beautyCare,
      brand: 'Aura Botanicals',
      sku: 'BT-SKIN-003',
      price: 6500,
      compareAtPrice: 8000,
      images: [
        image('photo-1586495777744-4413f21062fa', 'Lip Treatment Balm'),
        image('photo-1522337360788-8b13dee7a37e', 'Lip Balm Detail')
      ],
      tags: ['beauty', 'skincare', 'lipcare'],
      inventory: { stock: 35, lowStockThreshold: 6, trackQuantity: true },
      isFeatured: true,
      ratingsAverage: 4.7,
      ratingsCount: 29
    },

    // Watches & Accessories Seeds
    {
      name: 'lahVenture Heritage Automatic',
      shortDescription: 'Dress automatic with sapphire crystal and leather strap.',
      description: 'A refined automatic watch with a 38mm stainless steel case, sapphire crystal, exhibition caseback, and hand-finished dial details.',
      category: categories.automatics,
      brand: 'lahVenture',
      sku: 'LV-AUTO-HERITAGE-38',
      price: 34900,
      compareAtPrice: 42900,
      images: [image('photo-1523170335258-f5ed11844a49', 'Classic automatic watch')],
      tags: ['automatic', 'dress-watch', 'leather'],
      inventory: { stock: 18, lowStockThreshold: 6, trackQuantity: true },
      isFeatured: true,
      isTopPick: true,
      isHotDeal: true,
      ratingsAverage: 4.6,
      ratingsCount: 18
    },
    {
      name: 'lahVenture Rally Chronograph',
      shortDescription: 'Sport chronograph with tachymeter bezel and steel bracelet.',
      description: 'A bold chronograph with a high-contrast dial, accurate timing registers, 316L stainless steel case, and quick-release bracelet.',
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
