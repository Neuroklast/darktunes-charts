/**
 * @module domain/categories
 *
 * Pure domain layer for chart category definitions, voting weight configurations,
 * and eligibility logic. Zero React dependencies; zero external I/O.
 *
 * Re-exports everything from `src/lib/categories.ts` so that both legacy
 * `@/lib/categories` imports and new `@/domain/categories` imports resolve to
 * the same canonical definitions.
 */
export type { CategoryMetadata } from '@/lib/categories'
export {
  CATEGORY_DEFINITIONS,
  CATEGORY_GROUPS,
  getCategoryMetadata,
  getCategoriesByGroup,
  canBandCompeteInCategory,
  calculateCategoryScore,
} from '@/lib/categories'
