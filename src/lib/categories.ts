/**
 * @deprecated Import directly from `@/domain/categories` in new code.
 *
 * This module is a backward-compatibility shim. All category definitions
 * and business logic have been moved to the domain layer
 * (`src/domain/categories/`). Existing imports from `@/lib/categories`
 * continue to work without changes.
 */
export type { CategoryMetadata } from '@/domain/categories'
export {
  MAX_CATEGORIES_PER_BAND,
  CATEGORY_DEFINITIONS,
  CATEGORY_GROUPS,
  getCategoryMetadata,
  getCategoriesByGroup,
  getChartEligibleCategories,
  getCommunityAwardCategories,
  canBandCompeteInCategory,
  calculateCategoryScore,
  validateCategorySelection,
} from '@/domain/categories'
