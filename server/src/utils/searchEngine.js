import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';

// Synonyms dictionary for overall e-commerce context
const SYNONYMS = {
  'smart': ['intelligent', 'digital', 'connected', 'electronic'],
  'strap': ['band', 'bracelet', 'link'],
  'straps': ['band', 'bracelet', 'link'],
  'charger': ['cable', 'usb', 'charging', 'power'],
  'chargers': ['cable', 'usb', 'charging', 'power'],
  'glass': ['sunglass', 'eyewear', 'spectacles'],
  'glasses': ['sunglass', 'eyewear', 'spectacles'],
  'sunglasses': ['sunglass', 'eyewear', 'glasses']
};

// Calculate Levenshtein Distance between two strings for fuzzy matching
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// Normalize plurals (simple English rules)
export const singularize = (word) => {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ies') && w.length > 3) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 4 && (w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes') || w.endsWith('zes'))) return w.slice(0, -2);
  if (w.endsWith('s') && w.length > 2 && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};

// Extract natural language price expressions
export const extractPriceFilters = (searchStr) => {
  const result = {
    cleanQuery: searchStr,
    minPrice: null,
    maxPrice: null
  };

  let query = searchStr.toLowerCase().trim();

  // "between X and Y"
  const betweenRegex = /\b(?:between)\s+৳?\$?(\d+)\s+(?:and)\s+৳?\$?(\d+)\b/i;
  const betweenMatch = query.match(betweenRegex);
  if (betweenMatch) {
    result.minPrice = Number(betweenMatch[1]);
    result.maxPrice = Number(betweenMatch[2]);
    query = query.replace(betweenRegex, '');
  }

  // "under X", "below X", "less than X"
  const underRegex = /\b(?:under|below|less\s+than)\s+৳?\$?(\d+)\b/i;
  const underMatch = query.match(underRegex);
  if (underMatch) {
    result.maxPrice = Number(underMatch[1]);
    query = query.replace(underRegex, '');
  }

  // "above X", "over X", "more than X"
  const aboveRegex = /\b(?:above|over|more\s+than)\s+৳?\$?(\d+)\b/i;
  const aboveMatch = query.match(aboveRegex);
  if (aboveMatch) {
    result.minPrice = Number(aboveMatch[1]);
    query = query.replace(aboveRegex, '');
  }

  result.cleanQuery = query.replace(/\s+/g, ' ').trim();
  return result;
};

// Parse synonyms and token modifications
export const tokenizeAndExpand = (searchStr) => {
  const tokens = searchStr.toLowerCase().split(/[^\w\d-+]+/).filter(Boolean);
  const expanded = new Set();

  tokens.forEach(token => {
    expanded.add(token);

    // Singular form
    const singular = singularize(token);
    expanded.add(singular);

    // Synonyms expansion
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(syn => expanded.add(syn));
    }
    if (SYNONYMS[singular]) {
      SYNONYMS[singular].forEach(syn => expanded.add(syn));
    }
  });

  return Array.from(expanded);
};

// Match tokens with typo tolerance
export const isFuzzyMatch = (targetText, token) => {
  if (!targetText || !token) return false;
  const targetLower = targetText.toLowerCase();
  const tokenLower = token.toLowerCase();

  if (targetLower.includes(tokenLower)) return true;

  const targetWords = targetLower.split(/\s+/);
  for (const word of targetWords) {
    const distance = levenshteinDistance(word, tokenLower);
    // Typo criteria:
    if (tokenLower.length <= 4 && distance <= 1) return true;
    if (tokenLower.length > 4 && distance <= 2) return true;
  }

  return false;
};

// Find matching category or brand from DB
export const resolveIntentCategoriesAndBrands = async (tokens) => {
  const matchedCategories = [];
  const matchedBrands = [];

  // Fetch categories and brands to match against
  const [categories, brands] = await Promise.all([
    Category.find({}).lean(),
    Product.distinct('brand', { status: 'active', brand: { $ne: null } })
  ]);

  for (const token of tokens) {
    // Check categories
    for (const cat of categories) {
      if (isFuzzyMatch(cat.name, token) || isFuzzyMatch(cat.slug, token)) {
        matchedCategories.push(cat._id.toString());
      }
    }
    // Check brands
    for (const b of brands) {
      if (isFuzzyMatch(b, token)) {
        matchedBrands.push(b);
      }
    }
  }

  return {
    categoryIds: [...new Set(matchedCategories)],
    brands: [...new Set(matchedBrands)]
  };
};

// Main scoring function to rank query results
export const calculateRelevanceScore = (product, queryTokens, originalQuery) => {
  let score = 0;
  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const vendor = (product.vendor || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const shortDesc = (product.shortDescription || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const barcode = (product.barcode || '').toLowerCase();
  const tags = (product.tags || []).map(t => String(t).toLowerCase());
  const attributes = (product.attributes || []).map(attr => `${attr.name} ${attr.value}`.toLowerCase());

  const originalLower = originalQuery.toLowerCase().trim();

  // 1. Direct name / SKU match (Highest weight)
  if (name === originalLower) score += 1000;
  if (sku === originalLower) score += 800;
  if (barcode === originalLower) score += 800;
  if (name.startsWith(originalLower)) score += 500;
  if (brand === originalLower) score += 300;
  if (vendor === originalLower) score += 250;

  // 2. Tokenized match
  queryTokens.forEach(token => {
    // Exact token matches in specific fields
    const nameWords = name.split(/\s+/);
    if (nameWords.includes(token)) {
      score += 150;
    } else if (name.includes(token)) {
      score += 50; // substring match
    }

    if (brand.split(/\s+/).includes(token)) {
      score += 100;
    } else if (brand.includes(token)) {
      score += 30;
    }

    if (vendor.split(/\s+/).includes(token)) {
      score += 80;
    } else if (vendor.includes(token)) {
      score += 25;
    }

    if (tags.includes(token)) {
      score += 80;
    }

    if (sku.includes(token)) {
      score += 60;
    }

    if (barcode.includes(token)) {
      score += 60;
    }

    // Attributes match (like dial color, strap material, size, water resistance)
    if (attributes.some(attr => attr.includes(token))) {
      score += 45;
    }

    if (shortDesc.includes(token)) score += 15;
    if (description.includes(token)) score += 5;

    // Fuzzy matching fallback if no exact token matches
    if (!name.includes(token) && !brand.includes(token) && !vendor.includes(token) && !sku.includes(token) && !barcode.includes(token)) {
      if (isFuzzyMatch(name, token)) score += 40;
      if (isFuzzyMatch(brand, token)) score += 25;
      if (isFuzzyMatch(vendor, token)) score += 20;
      if (isFuzzyMatch(description, token)) score += 2;
    }
  });

  return score;
};
