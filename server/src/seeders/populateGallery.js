import { connectDB, disconnectDB } from '../config/db.js';
import { Gallery } from '../models/gallery.model.js';

const WATCH_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Gold Aero Chronograph Watch',
    order: 0
  },
  {
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    alt: 'LahVenture Steel Minimalist Watch',
    order: 1
  },
  {
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    alt: 'Classic Heritage White Dial Watch',
    order: 2
  },
  {
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dark Edition Chrono Timepiece',
    order: 3
  },
  {
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    alt: 'Vintage Leather Explorer Watch',
    order: 4
  },
  {
    url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80',
    alt: 'Apex Diver Rose Gold Watch',
    order: 5
  },
  {
    url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ocean Master Blue Chronometer',
    order: 6
  },
  {
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80',
    alt: 'Executive Black Leather Automatic',
    order: 7
  }
];

const seedGallery = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    let gallery = await Gallery.findOne({ key: 'panoramic-library' });

    if (!gallery) {
      console.log('Creating new gallery document...');
      gallery = await Gallery.create({
        key: 'panoramic-library',
        images: WATCH_IMAGES
      });
    } else {
      console.log('Updating existing gallery document...');
      gallery.images = WATCH_IMAGES;
      if (typeof gallery.save === 'function') {
        await gallery.save();
      } else {
        await Gallery.findByIdAndUpdate(gallery._id || gallery.id, { images: WATCH_IMAGES }, { new: true });
      }
    }

    console.log('Gallery successfully populated with watch pictures!');
  } catch (error) {
    console.error('Error seeding gallery:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedGallery();
