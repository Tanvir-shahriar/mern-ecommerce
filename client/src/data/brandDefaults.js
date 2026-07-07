import watch1 from '../assets/watches/1.png';
import watch2 from '../assets/watches/2.png';
import watch3 from '../assets/watches/3.png';
import watch4 from '../assets/watches/4.png';
import watch5 from '../assets/watches/5.png';
import watch6 from '../assets/watches/6.png';
import watch7 from '../assets/watches/7.png';
import watch8 from '../assets/watches/8.png';

export const defaultBrands = [
  {
    name: 'Patek Philippe',
    slug: 'patek-philippe',
    tagline: 'Haute Horlogerie',
    filterGroup: 'Swiss Heritage',
    description: 'Master of mechanical complexity. Creating timepieces of unmatched prestige and enduring value.',
    image: { url: watch4, alt: 'Patek Philippe mechanical watch movement' },
    spotlightImage: { url: watch4, alt: 'Detailed watch movement' },
    spotlightTitle: 'Patek Philippe: The Pursuit of the Perfect Movement',
    spotlightDescription: 'For over a century, Patek Philippe has operated at the pinnacle of fine watchmaking. Their commitment to independent excellence creates timepieces that are often passed down through generations.',
    founded: '1839',
    origin: 'Geneva',
    isSpotlight: true,
    productCount: 0
  },
  {
    name: 'Seiko',
    slug: 'seiko',
    tagline: 'Pioneering Innovation',
    filterGroup: 'Japanese Innovation',
    description: 'Robust quartz and automatic pioneers. Uncompromising quality from everyday wear to refined mechanical pieces.',
    image: { url: watch1, alt: 'Seiko inspired dress watch' },
    founded: '1881',
    origin: 'Tokyo',
    productCount: 0
  },
  {
    name: 'Omega',
    slug: 'omega',
    tagline: 'Precision & Heritage',
    filterGroup: 'Swiss Heritage',
    description: 'Historic Swiss precision and chronometers. A legacy spanning ocean depth, racing, and lunar exploration.',
    image: { url: watch2, alt: 'Omega inspired chronograph watch' },
    founded: '1848',
    origin: 'Bienne',
    productCount: 0
  },
  {
    name: 'Rado',
    slug: 'rado',
    tagline: 'Swiss Master of Materials',
    filterGroup: 'Minimalist & Modern',
    description: 'Ceramic specialist. Renowned for innovative design and scratch-resistant modern materials.',
    image: { url: watch3, alt: 'Rado inspired modern watch' },
    founded: '1917',
    origin: 'Lengnau',
    productCount: 0
  },
  {
    name: 'Fossil',
    slug: 'fossil',
    tagline: 'Contemporary Fashion',
    filterGroup: 'Fashion & Lifestyle',
    description: 'Modern lifestyle accessories blending vintage inspiration with contemporary everyday elegance.',
    image: { url: watch5, alt: 'Fossil inspired lifestyle watch' },
    productCount: 0
  },
  {
    name: 'Maxlord',
    slug: 'maxlord',
    tagline: 'Distinctive Design',
    filterGroup: 'Minimalist & Modern',
    description: 'Bold structural profiles. Statement pieces engineered for powerful, unapologetic aesthetics.',
    image: { url: watch8, alt: 'Maxlord inspired structural watch' },
    productCount: 0
  },
  {
    name: 'Sober',
    slug: 'sober',
    tagline: 'Modern Minimalist',
    filterGroup: 'Minimalist & Modern',
    description: 'Clean dials and ultra-thin profiles. The essence of timekeeping distilled to its most essential form.',
    image: { url: watch6, alt: 'Sober inspired minimalist watch' },
    productCount: 0
  },
  {
    name: 'Success Way',
    slug: 'success-way',
    tagline: 'Curated Heritage',
    filterGroup: 'Fashion & Lifestyle',
    description: 'Vintage revivals honoring the golden era of watchmaking with carefully crafted nostalgic designs.',
    image: { url: watch7, alt: 'Success Way inspired heritage watch' },
    productCount: 0
  }
];
