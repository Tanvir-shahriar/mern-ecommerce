import { Product } from '../models/product.model.js';
import { SearchLog } from '../models/searchLog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractPriceFilters,
  tokenizeAndExpand,
  resolveIntentCategoriesAndBrands,
  calculateRelevanceScore,
  isFuzzyMatch
} from '../utils/searchEngine.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Log search queries for popular/recent search tracking
const logSearchQuery = async (queryStr, userId = null) => {
  const normalized = queryStr.trim().toLowerCase();
  if (normalized.length < 2) return;

  try {
    const existing = await SearchLog.findOne({ query: normalized });
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      if (userId) existing.user = userId;
      await existing.save();
    } else {
      await SearchLog.create({
        query: normalized,
        user: userId,
        count: 1
      });
    }
  } catch (error) {
    console.error('Failed to log search query:', error);
  }
};

// GET /api/search
export const executeIntelligentSearch = asyncHandler(async (req, res) => {
  const { q = '', page = 1, limit = 12, sort = 'relevance' } = req.query;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 12, 1), 48);
  const skip = (pageNum - 1) * limitNum;

  // 1. Natural Language Intent Processing (Price filters)
  const { cleanQuery, minPrice, maxPrice } = extractPriceFilters(q);

  // 2. Tokenization and synonym expansions
  const queryTokens = tokenizeAndExpand(cleanQuery);

  // 3. Build standard DB query filters (price filters applied at query level for speed)
  const filter = { status: 'active' };

  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  // 4. Query all active matching products for in-memory fuzzy matching
  const productsRaw = await Product.find(filter).populate('category', 'name slug').lean();

  // 5. In-Memory Typo Tolerance / Fuzzy Matching
  let products = productsRaw;
  if (queryTokens.length > 0) {
    products = productsRaw.filter(product => {
      const catName = product.category?.name || '';
      return queryTokens.every(token => {
        return (
          isFuzzyMatch(product.name, token) ||
          isFuzzyMatch(product.brand, token) ||
          isFuzzyMatch(product.vendor, token) ||
          isFuzzyMatch(product.sku, token) ||
          isFuzzyMatch(product.barcode, token) ||
          isFuzzyMatch(product.description, token) ||
          isFuzzyMatch(product.shortDescription, token) ||
          isFuzzyMatch(catName, token) ||
          (product.tags || []).some(tag => isFuzzyMatch(tag, token)) ||
          (product.attributes || []).some(attr => isFuzzyMatch(attr.name, token) || isFuzzyMatch(attr.value, token))
        );
      });
    });
  }

  const total = products.length;

  // 6. Relevance scoring and ranking
  if (queryTokens.length > 0) {
    products = products.map(product => {
      product.relevanceScore = calculateRelevanceScore(product, queryTokens, cleanQuery);
      return product;
    });

    // Default to sorting by relevance unless price or rating sort specified
    if (sort === 'relevance' || sort === 'newest') {
      products.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  // Apply other sort parameters if requested
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
  } else if (sort === 'popular') {
    products.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  }

  // Paginate in-memory after ranking
  const paginatedProducts = products.slice(skip, skip + limitNum);

  // Log analytics asynchronous (page 1 only to prevent duplicate counting)
  if (pageNum === 1 && q.trim()) {
    logSearchQuery(q, req.user?._id || req.user?.id);
  }

  res.json({
    status: 'success',
    results: paginatedProducts.length,
    data: {
      products: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

// GET /api/search/suggestions
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  const cleanQ = String(q).trim();

  if (cleanQ.length < 2) {
    return res.json({
      status: 'success',
      data: { suggestions: [] }
    });
  }

  const queryTokens = tokenizeAndExpand(cleanQ);

  // Fetch all active products for in-memory typo tolerance
  const productsRaw = await Product.find({ status: 'active' })
    .populate('category', 'name slug')
    .lean();

  // Fuzzy filter
  let products = productsRaw.filter(product => {
    const catName = product.category?.name || '';
    return queryTokens.every(token => {
      return (
        isFuzzyMatch(product.name, token) ||
        isFuzzyMatch(product.brand, token) ||
        isFuzzyMatch(product.vendor, token) ||
        isFuzzyMatch(product.sku, token) ||
        isFuzzyMatch(product.barcode, token) ||
        isFuzzyMatch(product.description, token) ||
        isFuzzyMatch(product.shortDescription, token) ||
        isFuzzyMatch(catName, token) ||
        (product.tags || []).some(tag => isFuzzyMatch(tag, token)) ||
        (product.attributes || []).some(attr => isFuzzyMatch(attr.name, token) || isFuzzyMatch(attr.value, token))
      );
    });
  });

  // Score and rank suggestions
  const ranked = products.map(product => {
    product.relevanceScore = calculateRelevanceScore(product, queryTokens, cleanQ);
    return product;
  });

  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  res.json({
    status: 'success',
    data: {
      suggestions: ranked.slice(0, 5) // return top 5
    }
  });
});

// GET /api/search/popular
export const getPopularSearches = asyncHandler(async (req, res) => {
  // Fetch top 5 popular queries
  const popular = await SearchLog.find({})
    .sort('-count')
    .limit(5)
    .lean();

  res.json({
    status: 'success',
    data: {
      queries: popular.map(log => log.query)
    }
  });
});

// GET /api/search/recent
export const getRecentSearches = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.json({
      status: 'success',
      data: { queries: [] }
    });
  }

  // Fetch top 5 queries for user
  const recent = await SearchLog.find({ user: req.user._id || req.user.id })
    .sort('-updatedAt')
    .limit(5)
    .lean();

  res.json({
    status: 'success',
    data: {
      queries: recent.map(log => log.query)
    }
  });
});
