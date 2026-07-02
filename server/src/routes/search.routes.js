import express from 'express';
import {
  executeIntelligentSearch,
  getSearchSuggestions,
  getPopularSearches,
  getRecentSearches
} from '../controllers/search.controller.js';
import { optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalProtect, executeIntelligentSearch);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.get('/recent', optionalProtect, getRecentSearches);

export default router;
