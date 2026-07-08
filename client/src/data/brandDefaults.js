const brand = ({
  name,
  assetKey,
  tagline,
  filterGroup,
  description,
  founded = 'Curated',
  origin = 'Global',
  isSpotlight = false
}) => ({
  name,
  slug: assetKey,
  assetKey,
  tagline,
  filterGroup,
  description,
  founded,
  origin,
  isSpotlight,
  productCount: 0
});

export const defaultBrands = [
  brand({
    name: 'Sea-Gull',
    assetKey: 'seagull',
    tagline: 'Chinese Heritage',
    filterGroup: 'Chinese Heritage',
    description: 'Historic Chinese watchmaking with accessible mechanical movements and classic daily-wear designs.',
    founded: '1955',
    origin: 'Tianjin',
    isSpotlight: true
  }),
  brand({
    name: 'San Martin',
    assetKey: 'sanmartin',
    tagline: 'Tool Watch Microbrand',
    filterGroup: 'Microbrand Tools',
    description: 'Crisp finishing, robust cases, and enthusiast-focused divers built around strong everyday value.',
    origin: 'China'
  }),
  brand({
    name: 'Sugess',
    assetKey: 'sugess',
    tagline: 'Chronograph & Tourbillon',
    filterGroup: 'Chinese Heritage',
    description: 'Mechanical chronographs, moonphases, and tourbillon-led pieces with expressive dress-watch detail.',
    origin: 'China'
  }),
  brand({
    name: 'Pagani Design',
    assetKey: 'pagani',
    tagline: 'Sport Homage Watches',
    filterGroup: 'Microbrand Tools',
    description: 'Accessible sport watches with automatic movements, familiar case profiles, and broad strap versatility.',
    origin: 'China'
  }),
  brand({
    name: 'CIGA Design',
    assetKey: 'ciga',
    tagline: 'Design-Led Mechanical',
    filterGroup: 'Design Focused',
    description: 'Contemporary mechanical watches built around skeleton architecture and industrial design language.',
    origin: 'Shenzhen'
  }),
  brand({
    name: 'Shanghai Watch',
    assetKey: 'shanghai',
    tagline: 'Heritage Reissue',
    filterGroup: 'Chinese Heritage',
    description: 'Classic Chinese dress-watch styling with reissue character and a long domestic watchmaking legacy.',
    founded: '1955',
    origin: 'Shanghai'
  }),
  brand({
    name: 'Beijing Watch',
    assetKey: 'beijing',
    tagline: 'Chinese Horology',
    filterGroup: 'Chinese Heritage',
    description: 'Traditional Chinese watchmaking with mechanical complications, formal cases, and refined dial work.',
    founded: '1958',
    origin: 'Beijing'
  }),
  brand({
    name: 'FIYTA',
    assetKey: 'fiyta',
    tagline: 'Aerospace Precision',
    filterGroup: 'Chinese Heritage',
    description: 'Modern Chinese watches with aviation links, crisp cases, and polished everyday mechanical collections.',
    origin: 'Shenzhen'
  }),
  brand({
    name: 'Rossini',
    assetKey: 'rossini',
    tagline: 'Dress & Classic',
    filterGroup: 'Chinese Heritage',
    description: 'Dress watches and classic daily pieces with elegant proportions and approachable pricing.',
    origin: 'Zhuhai'
  }),
  brand({
    name: 'Ebohr',
    assetKey: 'ebohr',
    tagline: 'Contemporary Mechanical',
    filterGroup: 'Chinese Heritage',
    description: 'Modern mechanical watches with dress, business, and everyday collections for practical wear.',
    origin: 'China'
  }),
  brand({
    name: 'Tian Wang',
    assetKey: 'tianwang',
    tagline: 'Modern Chinese Watchmaking',
    filterGroup: 'Chinese Heritage',
    description: 'Established Chinese watch design across formal, sport, and daily timepiece collections.',
    origin: 'China'
  }),
  brand({
    name: 'Peacock',
    assetKey: 'peacock',
    tagline: 'Mechanical Manufacture',
    filterGroup: 'Chinese Heritage',
    description: 'Mechanical manufacture work with dress-focused watches and movement-building heritage.',
    origin: 'Dandong'
  }),
  brand({
    name: 'Memorigin',
    assetKey: 'memorigin',
    tagline: 'Tourbillon Specialist',
    filterGroup: 'Design Focused',
    description: 'Tourbillon-centered watchmaking with ornate movement displays and collector-driven finishing.',
    origin: 'Hong Kong'
  }),
  brand({
    name: 'Cadisen',
    assetKey: 'cadisen',
    tagline: 'Accessible Automatic',
    filterGroup: 'Microbrand Tools',
    description: 'Automatic watches with clean designs, practical specifications, and straightforward everyday appeal.',
    origin: 'China'
  }),
  brand({
    name: 'Berny',
    assetKey: 'berny',
    tagline: 'Everyday Mechanical',
    filterGroup: 'Microbrand Tools',
    description: 'Affordable mechanical and quartz watches with utility styling and easy daily-wear sizing.',
    origin: 'China'
  }),
  brand({
    name: 'Addiesdive',
    assetKey: 'addiesdive',
    tagline: 'Diver Tool Watches',
    filterGroup: 'Microbrand Tools',
    description: 'Dive-watch focused tool pieces with rugged cases, legible dials, and water-ready specifications.',
    origin: 'China'
  }),
  brand({
    name: 'Heimdallr',
    assetKey: 'heimdallr',
    tagline: 'Diver Specialist',
    filterGroup: 'Microbrand Tools',
    description: 'Enthusiast dive watches with strong lume, solid bracelets, and classic tool-watch proportions.',
    origin: 'China'
  }),
  brand({
    name: 'Proxima',
    assetKey: 'proxima',
    tagline: 'Microbrand Tool Watches',
    filterGroup: 'Microbrand Tools',
    description: 'Compact tool watches and divers with practical automatic movements and restrained case design.',
    origin: 'China'
  }),
  brand({
    name: 'Cronos',
    assetKey: 'cronos',
    tagline: 'Professional Divers',
    filterGroup: 'Microbrand Tools',
    description: 'Sport and dive watches with premium-leaning specifications, bracelet finishing, and sharp dial execution.',
    origin: 'China'
  }),
  brand({
    name: 'Baltany',
    assetKey: 'baltany',
    tagline: 'Vintage Field Watches',
    filterGroup: 'Microbrand Tools',
    description: 'Vintage military and field-watch inspired pieces with domed crystals and warm dial layouts.',
    origin: 'China'
  }),
  brand({
    name: 'Merkur',
    assetKey: 'merkur',
    tagline: 'Retro Mechanical',
    filterGroup: 'Design Focused',
    description: 'Retro mechanical watches with distinctive dials, compact cases, and playful vintage references.',
    origin: 'China'
  }),
  brand({
    name: 'Tandorio',
    assetKey: 'tandorio',
    tagline: 'Custom Tool Watches',
    filterGroup: 'Microbrand Tools',
    description: 'Configurable tool watches with practical cases, simple dials, and approachable mechanical builds.',
    origin: 'China'
  }),
  brand({
    name: 'Guanqin',
    assetKey: 'guanqin',
    tagline: 'Dress Automatics',
    filterGroup: 'Design Focused',
    description: 'Dress-oriented automatics with polished cases, visible movement details, and accessible pricing.',
    origin: 'China'
  }),
  brand({
    name: 'Lobinni',
    assetKey: 'lobinni',
    tagline: 'Elegant Mechanical',
    filterGroup: 'Design Focused',
    description: 'Elegant mechanical pieces with dress-watch proportions, open-heart layouts, and formal finishing cues.',
    origin: 'China'
  })
];
